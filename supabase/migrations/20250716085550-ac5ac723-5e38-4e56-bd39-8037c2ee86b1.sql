-- Enhanced item code generation function with better edge case handling
CREATE OR REPLACE FUNCTION public.generate_item_code(category_name text, qualifier text DEFAULT ''::text, size_mm text DEFAULT ''::text, gsm numeric DEFAULT NULL::numeric)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  category_code TEXT;
  final_code TEXT;
  base_code TEXT;
  counter INTEGER := 1;
  max_attempts INTEGER := 100;
BEGIN
  -- Sanitize and get category code
  category_code := UPPER(LEFT(REGEXP_REPLACE(category_name, '[^A-Za-z0-9]', '', 'g'), 3));
  
  -- If category code is too short, pad with 'X' or use fallback
  IF LENGTH(category_code) < 2 THEN
    category_code := RPAD(category_code, 3, 'X');
  END IF;
  
  -- If category code is empty, use 'GEN' as fallback
  IF category_code = '' OR category_code IS NULL THEN
    category_code := 'GEN';
  END IF;
  
  -- Build base item code
  base_code := category_code;
  
  IF qualifier IS NOT NULL AND qualifier != '' THEN
    -- Sanitize qualifier and limit length
    base_code := base_code || '_' || UPPER(LEFT(REGEXP_REPLACE(qualifier, '[^A-Za-z0-9]', '', 'g'), 10));
  END IF;
  
  IF size_mm IS NOT NULL AND size_mm != '' THEN
    -- Sanitize size and limit length
    base_code := base_code || '_' || LEFT(REGEXP_REPLACE(size_mm, '[^A-Za-z0-9x]', '', 'g'), 15);
  END IF;
  
  IF gsm IS NOT NULL THEN
    base_code := base_code || '_' || gsm::TEXT;
  END IF;
  
  -- Ensure uniqueness by checking existing codes
  final_code := base_code;
  
  -- Check if code already exists and append counter if needed
  WHILE EXISTS (SELECT 1 FROM item_master WHERE item_code = final_code) AND counter <= max_attempts LOOP
    final_code := base_code || '_' || LPAD(counter::TEXT, 3, '0');
    counter := counter + 1;
  END LOOP;
  
  -- If we've exceeded max attempts, add timestamp suffix
  IF counter > max_attempts THEN
    final_code := base_code || '_' || EXTRACT(EPOCH FROM now())::bigint;
  END IF;
  
  RETURN final_code;
END;
$$;

-- Create a function to validate item code generation parameters
CREATE OR REPLACE FUNCTION public.validate_item_code_params(category_name text, qualifier text DEFAULT ''::text, size_mm text DEFAULT ''::text, gsm numeric DEFAULT NULL::numeric)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb := '{"valid": true, "warnings": [], "errors": []}'::jsonb;
  warnings text[] := '{}';
  errors text[] := '{}';
BEGIN
  -- Validate category name
  IF category_name IS NULL OR category_name = '' THEN
    errors := array_append(errors, 'Category name is required');
  ELSIF LENGTH(REGEXP_REPLACE(category_name, '[^A-Za-z0-9]', '', 'g')) < 2 THEN
    warnings := array_append(warnings, 'Category name has few valid characters, code may be generic');
  END IF;
  
  -- Validate qualifier
  IF qualifier IS NOT NULL AND LENGTH(qualifier) > 20 THEN
    warnings := array_append(warnings, 'Qualifier is long and will be truncated');
  END IF;
  
  -- Validate size
  IF size_mm IS NOT NULL AND LENGTH(size_mm) > 20 THEN
    warnings := array_append(warnings, 'Size is long and will be truncated');
  END IF;
  
  -- Validate GSM
  IF gsm IS NOT NULL AND (gsm < 0 OR gsm > 10000) THEN
    warnings := array_append(warnings, 'GSM value seems unusual');
  END IF;
  
  -- Update result
  result := jsonb_set(result, '{valid}', to_jsonb(array_length(errors, 1) IS NULL));
  result := jsonb_set(result, '{warnings}', to_jsonb(warnings));
  result := jsonb_set(result, '{errors}', to_jsonb(errors));
  
  RETURN result;
END;
$$;

-- Create an improved function to generate item codes with validation
CREATE OR REPLACE FUNCTION public.generate_item_code_with_validation(category_name text, qualifier text DEFAULT ''::text, size_mm text DEFAULT ''::text, gsm numeric DEFAULT NULL::numeric)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  validation_result jsonb;
  item_code text;
  result jsonb;
BEGIN
  -- First validate the parameters
  validation_result := validate_item_code_params(category_name, qualifier, size_mm, gsm);
  
  -- If validation fails, return error
  IF NOT (validation_result->>'valid')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'item_code', null,
      'validation', validation_result
    );
  END IF;
  
  -- Generate the item code
  item_code := generate_item_code(category_name, qualifier, size_mm, gsm);
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'item_code', item_code,
    'validation', validation_result
  );
END;
$$;
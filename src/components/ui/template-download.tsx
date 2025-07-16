
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadCSVTemplate, templateConfigs } from "@/utils/templateGenerator";

interface TemplateDownloadProps {
  templateType: keyof typeof templateConfigs;
  title: string;
  description: string;
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
  showPreview?: boolean;
}

export const TemplateDownload = ({ 
  templateType, 
  title, 
  description, 
  variant = "outline",
  size = "default",
  showPreview = true 
}: TemplateDownloadProps) => {
  const config = templateConfigs[templateType];

  const handleDownload = () => {
    downloadCSVTemplate(templateType);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleDownload}
        variant={variant}
        size={size}
        className="w-full"
      >
        <Download className="mr-2 h-4 w-4" />
        {title}
      </Button>
      
      {showPreview && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Template Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-2">
              {description}
            </div>
            <div className="bg-muted p-3 rounded-md">
              <div className="text-xs font-mono space-y-1">
                <div className="font-semibold text-primary">
                  {config.headers.join(', ')}
                </div>
                {config.sampleData.slice(0, 2).map((row, idx) => (
                  <div key={idx} className="text-muted-foreground">
                    {config.headers.map(header => row[header] || '').join(', ')}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground italic">
                  ...and more sample rows
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

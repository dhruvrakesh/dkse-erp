
import * as React from "react"
import { Check, ChevronsUpDown, Package, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface ItemComboboxProps {
  items: Array<{
    item_code: string
    item_name: string
    uom: string
    category_name?: string
    current_qty?: number
    status?: string
  }>
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  showStockLevel?: boolean
  className?: string
  isLoading?: boolean
}

export function ItemCombobox({
  items,
  value,
  onValueChange,
  placeholder = "Select item...",
  disabled = false,
  showStockLevel = false,
  className,
  isLoading = false
}: ItemComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedItem = items.find(item => item.item_code === value)

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.item_code.toLowerCase().includes(search.toLowerCase())
  )

  const getStockStatus = (qty?: number) => {
    if (!qty || qty === 0) return { label: "Out of Stock", color: "destructive" }
    if (qty < 10) return { label: "Low Stock", color: "warning" }
    return { label: "In Stock", color: "success" }
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className={cn("w-full justify-between", className)}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading items...</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="truncate font-medium">{selectedItem.item_name}</span>
              <Badge variant="secondary" className="text-xs">
                {selectedItem.item_code}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search items..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {items.length === 0 ? 
                "No items found. Please check if items are properly configured." :
                "No items match your search."
              }
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => {
                const stockStatus = showStockLevel ? getStockStatus(item.current_qty) : null
                return (
                  <CommandItem
                    key={item.item_code}
                    value={item.item_code}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === item.item_code ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.item_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>{item.item_code}</span>
                          <span>•</span>
                          <span>{item.uom}</span>
                          {item.category_name && (
                            <>
                              <span>•</span>
                              <span>{item.category_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {showStockLevel && stockStatus && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-muted-foreground">
                          Qty: {item.current_qty || 0}
                        </span>
                        <Badge 
                          variant={stockStatus.color === "destructive" ? "destructive" : 
                                  stockStatus.color === "warning" ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {stockStatus.label}
                        </Badge>
                      </div>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

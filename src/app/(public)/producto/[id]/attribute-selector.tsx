"use client";

import { cn } from "@/lib/utils";
import { formatCOP } from "@/lib/format";
import type { ProductAttributeWithOptions } from "./product-attributes-types";

export function AttributeSelector({
  attributes,
  selected,
  onSelect,
}: {
  attributes: ProductAttributeWithOptions[];
  selected: Record<string, string>;
  onSelect: (attributeId: string, optionId: string) => void;
}) {
  if (attributes.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {attributes.map((attribute) => (
        <div key={attribute.id}>
          <p className="text-sm font-medium text-foreground">{attribute.displayName}</p>
          <div className={cn("mt-1.5 flex flex-wrap", attribute.kind === "color" ? "gap-x-2 gap-y-3" : "gap-2")}>
            {attribute.options.map((option) => {
              const isSelected = selected[attribute.id] === option.id;
              if (attribute.kind === "color") {
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelect(attribute.id, option.id)}
                    className="flex w-16 flex-col items-center gap-1 text-center"
                  >
                    <span
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-full border-2 transition-transform active:scale-95",
                        isSelected ? "border-primary" : "border-border",
                        !option.colorHex && "bg-muted"
                      )}
                      style={option.colorHex ? { backgroundColor: option.colorHex } : undefined}
                    />
                    <span
                      className={cn(
                        "line-clamp-2 text-xs leading-tight",
                        isSelected ? "font-medium text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {option.displayName}
                    </span>
                  </button>
                );
              }
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(attribute.id, option.id)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm transition-transform active:scale-95",
                    isSelected ? "border-primary bg-primary/10 font-medium text-foreground" : "border-border text-muted-foreground"
                  )}
                >
                  {option.displayName}
                  {option.unitPriceCop != null && <span className="ml-1 text-xs">({formatCOP(option.unitPriceCop)})</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

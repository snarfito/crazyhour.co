"use client";

import { useState, useTransition } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { updateProductCategories } from "./actions";

export function CategoryPickerCell({
  productId,
  categories,
  selectedCategoryIds,
}: {
  productId: string;
  categories: { id: string; name: string }[];
  selectedCategoryIds: string[];
}) {
  const [selected, setSelected] = useState(new Set(selectedCategoryIds));
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(categoryId: string, checked: boolean) {
    const previous = selected;
    const next = new Set(selected);
    if (checked) next.add(categoryId);
    else next.delete(categoryId);
    setSelected(next);
    setError(null);

    startTransition(async () => {
      try {
        await updateProductCategories(productId, Array.from(next));
      } catch (err) {
        setSelected(previous);
        setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
      }
    });
  }

  const selectedNames = categories.filter((c) => selected.has(c.id)).map((c) => c.name);

  return (
    <div className="flex flex-col gap-1">
      <Popover>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="max-w-56 justify-start truncate font-normal">
              {selectedNames.length > 0 ? selectedNames.join(", ") : "Sin categoría"}
            </Button>
          }
        />
        <PopoverContent className="flex flex-col gap-1.5">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={(e) => toggle(c.id, e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              {c.name}
            </label>
          ))}
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

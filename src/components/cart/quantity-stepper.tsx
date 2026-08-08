"use client";

import { Button } from "@/components/ui/button";

export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
}) {
  return (
    <div className="inline-flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Restar"
        onClick={() => onChange(Math.max(min, quantity - 1))}
      >
        −
      </Button>
      <span className="w-6 text-center tabular-nums">{quantity}</span>
      <Button type="button" variant="outline" size="icon-sm" aria-label="Sumar" onClick={() => onChange(quantity + 1)}>
        +
      </Button>
    </div>
  );
}

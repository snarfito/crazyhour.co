"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
}) {
  // Local text buffer so typing a multi-digit quantity (50, 100...) doesn't
  // get clamped mid-keystroke — the value only commits to onChange on
  // blur/Enter, same as a normal <input type="number"> form field. Resets
  // to match `quantity` when it changes externally (+/- buttons, cart
  // sync) via the render-time derived-state pattern, not an effect.
  const [text, setText] = useState(String(quantity));
  const [prevQuantity, setPrevQuantity] = useState(quantity);
  if (quantity !== prevQuantity) {
    setPrevQuantity(quantity);
    setText(String(quantity));
  }

  function commit(value: string) {
    const parsed = Math.floor(Number(value));
    onChange(Number.isFinite(parsed) && parsed >= min ? parsed : min);
  }

  return (
    <div className="inline-flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Restar"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        className="border-brand-cyan/50 bg-card text-base font-bold text-brand-cyan hover:bg-card/70 [box-shadow:0_0_10px_rgba(63,224,255,.35)]"
      >
        −
      </Button>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
        }}
        aria-label="Cantidad"
        className="w-16 bg-card text-center font-semibold"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label="Sumar"
        onClick={() => onChange(quantity + 1)}
        className="border-brand-cyan/50 bg-card text-base font-bold text-brand-cyan hover:bg-card/70 [box-shadow:0_0_10px_rgba(63,224,255,.35)]"
      >
        +
      </Button>
    </div>
  );
}

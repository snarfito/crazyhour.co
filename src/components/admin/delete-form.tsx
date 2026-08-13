"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteForm({
  action,
  confirmMessage,
  children = "Eliminar",
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
        <Trash2 />
        {children}
      </Button>
    </form>
  );
}

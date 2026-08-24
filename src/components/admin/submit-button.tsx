"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

// Reads the pending state of the nearest ancestor <form>, so it works with
// any server action — no need to thread pending state through props.
export function SubmitButton({ children, disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

"use client";

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
      <button type="submit" className="text-destructive hover:underline">
        {children}
      </button>
    </form>
  );
}

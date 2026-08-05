export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="font-heading text-xl font-extrabold">Crazy Hour</p>
      <p className="max-w-sm text-muted-foreground">{message}</p>
    </div>
  );
}

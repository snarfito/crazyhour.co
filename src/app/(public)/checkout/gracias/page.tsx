export default async function GraciasPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <h1 className="font-heading text-2xl font-extrabold">¡Gracias por tu compra!</h1>
      <p className="mt-4 text-muted-foreground">
        Tu pago está siendo procesado. Te avisaremos por WhatsApp cuando esté confirmado.
      </p>
      {ref && <p className="mt-2 text-xs text-muted-foreground">Referencia: {ref}</p>}
    </div>
  );
}

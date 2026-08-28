const STEPS = [
  {
    number: "01",
    title: "Miras el catálogo",
    description: 'Todo por foto real, sin adivinar qué es "decoración temática surtida".',
    colorClass: "text-brand-cyan",
  },
  {
    number: "02",
    title: "Pagas como prefieres",
    description:
      "Agrega al carrito y paga en línea con Wompi, o escríbenos por WhatsApp y coordinamos por chat.",
    colorClass: "text-brand-pink",
  },
  {
    number: "03",
    title: "Recoges o te lo enviamos",
    description: "A tiempo para que la fiesta no se dañe por falta de globos.",
    colorClass: "text-brand-green",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <h2 className="text-glow font-heading text-xl font-black sm:text-2xl">Cómo funciona</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.number}>
            <span className={`text-glow font-heading text-3xl font-black ${step.colorClass}`}>{step.number}</span>
            <h3 className="mt-2 font-heading text-lg font-extrabold">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

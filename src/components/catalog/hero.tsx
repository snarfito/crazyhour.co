import Image from "next/image";

export function Hero({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <section className="px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl text-center sm:text-left">
          <h1 className="font-heading text-4xl font-black leading-[0.95] sm:text-5xl lg:text-6xl">
            La{" "}
            <span className="bg-linear-to-r from-brand-orange via-brand-yellow to-brand-green bg-clip-text text-transparent">
              hora loca
            </span>
            <br />
            empieza aquí.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Piñatería y artículos de fiesta para tu próxima celebración.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            <a
              href="#catalogo"
              className="rounded-lg bg-primary px-6 py-3 font-heading text-sm font-extrabold text-primary-foreground transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Ver catálogo →
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-brand-whatsapp px-6 py-3 font-heading text-sm font-extrabold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Pedir por WhatsApp
            </a>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Catálogo renovado cada 15 días
          </p>
        </div>
        <div className="group relative h-48 w-48 shrink-0 sm:h-64 sm:w-64">
          <Image
            src="/logo-emblema.jpeg"
            alt=""
            fill
            sizes="256px"
            className="rounded-full object-cover shadow-lg ring-2 ring-primary/40 transition-transform duration-400 ease-out group-hover:rotate-360"
          />
        </div>
      </div>
    </section>
  );
}

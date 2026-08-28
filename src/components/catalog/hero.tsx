"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar } from "lucide-react";

// Small confetti marks scattered around the hero, matching the design
// canvas's neon dashes. Purely decorative.
const CONFETTI = [
  { className: "left-4 top-9 h-[7px] w-[7px] rotate-[28deg] bg-brand-yellow", glow: "rgba(255,216,77,.95)" },
  { className: "left-14 top-20 h-3 w-[5px] -rotate-[24deg] rounded-sm bg-brand-purple", glow: "rgba(176,97,255,.95)" },
  { className: "right-20 top-24 h-3.5 w-1.5 rotate-[38deg] rounded-sm bg-brand-cyan", glow: "rgba(63,224,255,.95)" },
  { className: "right-8 bottom-28 h-[7px] w-[7px] rotate-[18deg] bg-brand-pink", glow: "rgba(255,46,136,.95)" },
  { className: "left-8 bottom-16 h-[11px] w-[5px] rotate-[52deg] rounded-sm bg-brand-green", glow: "rgba(52,245,139,.95)" },
];

// Neon balloon and sun outlines, echoing the client-approved neon mockup's
// hand-drawn ornaments — no client-provided art for these two yet, unlike
// the gorro/piñata PNGs below.
function NeonBalloon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 76 112" fill="none" aria-hidden="true" className={className} {...props}>
      <ellipse cx="36" cy="40" rx="26" ry="32" stroke="#FF2E88" strokeWidth="2.4" />
      <path d="M36 72 q 9 16 -3 34" stroke="#FF2E88" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function NeonSun({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 58 58" fill="none" aria-hidden="true" className={className} {...props}>
      <circle cx="29" cy="29" r="12" stroke="#34F58B" strokeWidth="2.2" />
      <path
        d="M29 3v9M29 46v9M3 29h9M46 29h9M11 11l6 6M41 41l6 6M47 11l-6 6M17 41l-6 6"
        stroke="#34F58B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Hero({ whatsappUrl }: { whatsappUrl: string }) {
  const [spin, setSpin] = useState(false);

  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
      <NeonBalloon
        data-hero-ornament
        className="animate-float pointer-events-none absolute left-0 top-24 z-0 h-24 w-16 opacity-80 [filter:drop-shadow(0_0_7px_rgba(255,46,136,.85))] sm:h-28 sm:w-20"
      />
      <NeonSun
        data-hero-ornament
        className="animate-float-slow pointer-events-none absolute right-3 top-3 z-0 h-11 w-11 opacity-80 [filter:drop-shadow(0_0_7px_rgba(52,245,139,.85))] sm:h-14 sm:w-14"
      />
      {CONFETTI.map(({ className, glow }, i) => (
        <span
          key={i}
          data-hero-ornament
          aria-hidden="true"
          className={`pointer-events-none absolute z-0 ${className}`}
          style={{ boxShadow: `0 0 10px ${glow}` }}
        />
      ))}
      {/* Client-provided neon PNGs (gorro, piñata) — same opacity/glow
          treatment as the balloon/sun outlines above, and behind the
          content column (z-0 vs. the content's z-10) so they read as
          background texture, not foreground elements. */}
      <div
        data-hero-ornament
        aria-hidden="true"
        className="animate-float pointer-events-none absolute right-3 top-20 z-0 h-16 w-16 opacity-80 [filter:drop-shadow(0_0_7px_rgba(63,224,255,.6))_brightness(1.2)] sm:h-20 sm:w-20"
      >
        <div className="relative h-full w-full">
          <Image src="/neon-gorro.png" alt="" fill sizes="80px" className="object-contain" />
        </div>
      </div>
      <div
        data-hero-ornament
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute bottom-2 left-1/2 z-0 h-24 w-28 -translate-x-1/2 opacity-80 [filter:drop-shadow(0_0_7px_rgba(255,46,136,.6))_brightness(1.2)] sm:bottom-10 sm:left-auto sm:right-8 sm:h-32 sm:w-36 sm:translate-x-0"
      >
        <div className="relative h-full w-full">
          <Image src="/neon-pinata.png" alt="" fill sizes="144px" className="object-contain" />
        </div>
      </div>
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col items-center sm:order-2 sm:shrink-0">
          <div
            role="button"
            tabIndex={0}
            aria-label="Girar el logo"
            onClick={() => setSpin(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setSpin(true);
            }}
            className="group relative h-48 w-48 shrink-0 cursor-pointer sm:h-64 sm:w-64"
          >
            <div
              aria-hidden="true"
              data-testid="hero-emblem-ring"
              className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#3FE0FF,#B061FF,#FF2E88,#FFD84D,#34F58B,#3FE0FF)] [box-shadow:0_0_24px_rgba(63,224,255,.55),0_0_60px_rgba(176,97,255,.4)]"
            />
            <div className="absolute inset-[5px] overflow-hidden rounded-full">
              <Image
                src="/logo-emblema.jpeg"
                alt=""
                fill
                sizes="256px"
                data-spin={spin}
                onTransitionEnd={() => setSpin(false)}
                className="object-cover transition-transform duration-400 ease-out group-hover:rotate-360 data-[spin=true]:rotate-360"
              />
            </div>
          </div>
        </div>
        <div className="max-w-xl text-center sm:order-1 sm:text-left">
          <h1 className="text-glow font-heading text-4xl font-black leading-[0.95] sm:text-5xl lg:text-6xl">
            La <span className="text-brand-pink text-glow">hora</span>{" "}
            <span className="text-brand-yellow text-glow">loca</span>
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
          <div className="neon-border mt-6 flex items-center gap-3.5 rounded-2xl border border-brand-purple/50 bg-background/60 px-4 py-3.5 text-brand-purple">
            <div
              aria-hidden="true"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-pink text-brand-pink [box-shadow:0_0_12px_rgba(255,46,136,.6),inset_0_0_10px_rgba(255,46,136,.25)]"
            >
              <Calendar className="absolute h-full w-full opacity-15" />
              <span className="text-glow font-heading text-lg font-black">15</span>
            </div>
            <div className="text-left">
              <p className="font-heading text-sm font-extrabold text-foreground">
                Catálogo renovado cada <span className="text-glow text-brand-green">15 días</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Nuevos productos, más temáticas y muchas sorpresas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

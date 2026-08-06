// Each accent pairs its background with a foreground that passes WCAG
// contrast against it — bg-brand-yellow (#FFC400) and bg-brand-green
// (#7CB800) fail contrast with white text, so they use the admin panel's
// dark-ink token (#16232E, see globals.css .theme-light --foreground)
// instead.
const ACCENTS = [
  { bg: "bg-brand-orange", fg: "text-white" },
  { bg: "bg-brand-yellow", fg: "text-[#16232E]" },
  { bg: "bg-brand-red", fg: "text-white" },
  { bg: "bg-brand-green", fg: "text-[#16232E]" },
];

function pickAccent(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENTS[hash % ACCENTS.length];
}

export function BrandPlaceholder({ label, seed }: { label: string; seed: string }) {
  const { bg, fg } = pickAccent(seed);
  return (
    <div
      className={`${bg} flex h-full w-full items-center justify-center p-4 text-center`}
    >
      <span className={`font-heading text-lg font-extrabold ${fg}`}>{label}</span>
    </div>
  );
}

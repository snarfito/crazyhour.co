const ACCENT_CLASSES = [
  "bg-brand-orange",
  "bg-brand-yellow",
  "bg-brand-red",
  "bg-brand-green",
];

function pickAccent(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENT_CLASSES[hash % ACCENT_CLASSES.length];
}

export function BrandPlaceholder({ label, seed }: { label: string; seed: string }) {
  return (
    <div
      className={`${pickAccent(seed)} flex h-full w-full items-center justify-center p-4 text-center`}
    >
      <span className="font-heading text-lg font-extrabold text-white">{label}</span>
    </div>
  );
}

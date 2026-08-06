import { PartyPopper, Gift, Sparkles, Star } from "lucide-react";

// Each entry pairs a two-stop brand-color gradient with a decorative icon.
// Purely visual — the accessible name for the tile comes from CatalogImage's
// overlay text (Task 3), so the icon is aria-hidden and contrast rules that
// applied to the old text-based placeholder no longer apply here.
const ACCENTS = [
  { from: "from-brand-orange", to: "to-brand-yellow", Icon: PartyPopper },
  { from: "from-brand-yellow", to: "to-brand-red", Icon: Gift },
  { from: "from-brand-red", to: "to-brand-green", Icon: Sparkles },
  { from: "from-brand-green", to: "to-brand-orange", Icon: Star },
];

function pickAccent(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENTS[hash % ACCENTS.length];
}

export function BrandPlaceholder({ seed }: { seed: string }) {
  const { from, to, Icon } = pickAccent(seed);
  return (
    <div className={`bg-linear-to-br ${from} ${to} flex h-full w-full items-center justify-center`}>
      <Icon aria-hidden="true" className="h-10 w-10 text-white drop-shadow-md" />
    </div>
  );
}

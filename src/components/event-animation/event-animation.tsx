import { EVENT_THEME_REGISTRY, type EventTheme, type ThemeConfig } from "@/lib/event-themes";
import type { ThemeMotionSettings } from "@/lib/theme-motion-defaults";

// Deterministic in [0, 1), seeded only by `n` — same output on every call,
// server or client. Math.random() here would make the server-rendered HTML
// and the client's post-hydration render pick different values for every
// particle's position/size/timing, which React flags as a hydration
// mismatch (and then discards the server markup for real, refetching new
// random values — visible as the particles "jumping" right after load).
function seededRandom(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

// Rounds to 4 decimal places. The browser's CSS parser doesn't always
// round-trip a long decimal (e.g. "95.86120768763067%") the same way twice —
// re-serializing the server-parsed attribute can come out shorter than the
// client's freshly-computed float, which React reports as a hydration
// mismatch even though the underlying seed is identical. Rounding both
// sides to the same fixed precision up front removes the ambiguity.
function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function buildParticles(config: ThemeConfig, settings: ThemeMotionSettings) {
  const imageUrls = settings.shapeImageUrls;
  return Array.from({ length: settings.particleCount }, (_, i) => ({
    key: i,
    Shape: imageUrls.length > 0 ? null : config.shapes[i % config.shapes.length],
    imageUrl: imageUrls.length > 0 ? imageUrls[i % imageUrls.length] : null,
    color: config.colors[i % config.colors.length],
    size: round(settings.minSize + seededRandom(i * 12.9898 + 1) * (settings.maxSize - settings.minSize)),
    left: `${round(seededRandom(i * 78.233 + 2) * 100)}%`,
    duration: round(
      settings.minDuration + seededRandom(i * 39.425 + 3) * (settings.maxDuration - settings.minDuration)
    ),
    delay: round(-seededRandom(i * 94.673 + 4) * settings.maxDuration),
  }));
}

export function EventAnimation({
  theme,
  contained,
  settings,
}: {
  theme: EventTheme;
  contained?: boolean;
  settings: ThemeMotionSettings;
}) {
  if (theme === "none") return null;
  const config = EVENT_THEME_REGISTRY[theme];
  const particles = buildParticles(config, settings);
  const hasCustomCss = Boolean(settings.customCss);

  // z-0 (not the previous z-10) so the overlay sits behind page content —
  // every non-contained usage renders this first, and page content that
  // follows in the DOM paints on top of it at the same implicit stacking
  // level, while still sitting above the page background.
  const containerClass = contained
    ? "pointer-events-none absolute inset-0 overflow-hidden"
    : "pointer-events-none fixed inset-0 z-0 overflow-hidden";

  return (
    <div aria-hidden="true" className={containerClass}>
      {settings.customCss && <style>{settings.customCss}</style>}
      {particles.map(({ key, Shape, imageUrl, color, size, left, duration, delay }) => {
        const className = hasCustomCss ? "event-particle" : `event-particle event-particle-${config.direction}`;
        const style = {
          left,
          width: size,
          height: size,
          opacity: settings.maxOpacity,
          ...(hasCustomCss ? {} : { animationDuration: `${duration}s`, animationDelay: `${delay}s` }),
        };
        if (imageUrl) {
          return (
            // eslint-disable-next-line @next/next/no-img-element -- tiny decorative particle, not worth Next's image optimizer
            <img key={key} src={imageUrl} alt="" data-theme={theme} className={className} style={style} />
          );
        }
        const Icon = Shape!;
        return <Icon key={key} data-theme={theme} className={className} style={{ ...style, color }} />;
      })}
    </div>
  );
}

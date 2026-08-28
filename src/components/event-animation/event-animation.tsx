import { EVENT_THEME_REGISTRY, type EventTheme, type ThemeConfig } from "@/lib/event-themes";
import type { ThemeMotionSettings } from "@/lib/theme-motion-defaults";

function buildParticles(config: ThemeConfig, settings: ThemeMotionSettings) {
  const imageUrls = settings.shapeImageUrls;
  return Array.from({ length: settings.particleCount }, (_, i) => ({
    key: i,
    Shape: imageUrls.length > 0 ? null : config.shapes[i % config.shapes.length],
    imageUrl: imageUrls.length > 0 ? imageUrls[i % imageUrls.length] : null,
    color: config.colors[i % config.colors.length],
    size: settings.minSize + Math.random() * (settings.maxSize - settings.minSize),
    left: `${Math.random() * 100}%`,
    duration: settings.minDuration + Math.random() * (settings.maxDuration - settings.minDuration),
    delay: -Math.random() * settings.maxDuration,
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

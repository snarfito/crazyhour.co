import { EVENT_THEME_REGISTRY, type EventTheme, type ThemeConfig } from "@/lib/event-themes";
import type { ThemeMotionSettings } from "@/lib/theme-motion-defaults";

function buildParticles(config: ThemeConfig, settings: ThemeMotionSettings) {
  return Array.from({ length: settings.particleCount }, (_, i) => ({
    key: i,
    Shape: config.shapes[i % config.shapes.length],
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

  const containerClass = contained
    ? "pointer-events-none absolute inset-0 overflow-hidden"
    : "pointer-events-none fixed inset-0 z-10 overflow-hidden";

  return (
    <div aria-hidden="true" className={containerClass}>
      {settings.customCss && <style>{settings.customCss}</style>}
      {particles.map(({ key, Shape, color, size, left, duration, delay }) => (
        <Shape
          key={key}
          data-theme={theme}
          className={hasCustomCss ? "event-particle" : `event-particle event-particle-${config.direction}`}
          style={{
            left,
            width: size,
            height: size,
            color,
            opacity: settings.maxOpacity,
            ...(hasCustomCss ? {} : { animationDuration: `${duration}s`, animationDelay: `${delay}s` }),
          }}
        />
      ))}
    </div>
  );
}

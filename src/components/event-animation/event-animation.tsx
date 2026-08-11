import { EVENT_THEME_REGISTRY, type EventTheme, type ThemeConfig } from "@/lib/event-themes";

const PARTICLE_COUNT = 8;
const SIZE_RANGE = [16, 28] as const;
const DURATION_RANGE = [14, 22] as const;
const MAX_OPACITY = 0.18;

function buildParticles(config: ThemeConfig) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    key: i,
    Shape: config.shapes[i % config.shapes.length],
    color: config.colors[i % config.colors.length],
    size: SIZE_RANGE[0] + Math.random() * (SIZE_RANGE[1] - SIZE_RANGE[0]),
    left: `${Math.random() * 100}%`,
    duration: DURATION_RANGE[0] + Math.random() * (DURATION_RANGE[1] - DURATION_RANGE[0]),
    delay: -Math.random() * DURATION_RANGE[1],
  }));
}

export function EventAnimation({ theme, contained }: { theme: EventTheme; contained?: boolean }) {
  if (theme === "none") return null;
  const config = EVENT_THEME_REGISTRY[theme];
  const particles = buildParticles(config);

  const containerClass = contained
    ? "pointer-events-none absolute inset-0 overflow-hidden"
    : "pointer-events-none fixed inset-0 z-10 overflow-hidden";

  return (
    <div aria-hidden="true" className={containerClass}>
      {particles.map(({ key, Shape, color, size, left, duration, delay }) => (
        <Shape
          key={key}
          className={`event-particle event-particle-${config.direction}`}
          style={{
            left,
            width: size,
            height: size,
            color,
            opacity: MAX_OPACITY,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}

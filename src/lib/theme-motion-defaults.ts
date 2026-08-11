export type ThemeMotionSettings = {
  particleCount: number;
  minDuration: number;
  maxDuration: number;
  minSize: number;
  maxSize: number;
  maxOpacity: number;
  customCss: string | null;
};

export const DEFAULT_MOTION_SETTINGS: ThemeMotionSettings = {
  particleCount: 8,
  minDuration: 14,
  maxDuration: 22,
  minSize: 16,
  maxSize: 28,
  maxOpacity: 0.18,
  customCss: null,
};

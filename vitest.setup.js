import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver — stub it for recharts ResponsiveContainer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

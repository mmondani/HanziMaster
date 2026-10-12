import type { CSSProperties } from 'react';

export function Skeleton({ width = '100%', height = 16 }: { width?: CSSProperties['width']; height?: CSSProperties['height'] }) {
  return <div className="skeleton" style={{ width, height }} aria-hidden="true" />;
}

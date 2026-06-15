export interface Point {
  x: number;
  y: number;
}

/**
 * Angle 0 points straight up (towards the fixed pointer), increasing clockwise.
 */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

export function describeSlice(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/**
 * Computes the final rotation (in degrees, can be > 360) so that the wheel
 * lands with the center of `winningIndex` segment under the fixed pointer
 * (at angle 0 / top), after spinning a few extra full turns.
 */
export function computeFinalRotation(
  currentRotation: number,
  winningIndex: number,
  segmentAngle: number,
  extraSpins = 5
): number {
  const segmentCenter = winningIndex * segmentAngle + segmentAngle / 2;
  const jitter = (Math.random() - 0.5) * segmentAngle * 0.6;

  const target = (((-segmentCenter + jitter) % 360) + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;

  let delta = target - currentMod;
  if (delta < 0) {
    delta += 360;
  }

  return currentRotation + extraSpins * 360 + delta;
}

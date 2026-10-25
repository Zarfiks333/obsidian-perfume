export function frameAtProgress(progress, first, last) {
  const safe = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.round(first + safe * (last - first));
}

export function nearestFrame(target, available) {
  let closest = null;
  let distance = Infinity;
  for (const frame of available) {
    const delta = Math.abs(target - frame);
    if (delta < distance) { closest = frame; distance = delta; }
  }
  return closest;
}

export const isTouchDevice = (): boolean => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
export function vibrate(ms: number, enabled: boolean): void {
  if (!enabled || !('vibrate' in navigator)) return;
  try { navigator.vibrate(ms); } catch { /* unsupported */ }
}

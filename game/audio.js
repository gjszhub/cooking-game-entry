// Dapur Kilat — audio: tiny synthesised sounds, no audio files.
// Everything is an oscillator blip, created on first user gesture only, so a
// headless screenshot run stays silent and never throws.

let ctx = null;
let muted = false;

function ac() {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  if (!ctx) {
    try { ctx = new window.AudioContext(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, gain, slideTo) {
  if (muted) return;
  const a = ac();
  if (!a) return;
  try {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, a.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
    g.gain.setValueAtTime(gain || 0.08, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur + 0.02);
  } catch { /* sound is garnish, never fatal */ }
}

export const sfx = {
  setMuted(m) { muted = m; },
  click() { tone(660, 0.06, 'triangle', 0.06); },
  take() { tone(520, 0.07, 'sine', 0.07, 780); },
  cook() { tone(180, 0.12, 'sawtooth', 0.04, 120); },
  ready() { tone(880, 0.12, 'sine', 0.08); tone(1320, 0.14, 'sine', 0.06); },
  serve() {
    tone(523, 0.1, 'triangle', 0.09);
    setTimeout(() => tone(659, 0.1, 'triangle', 0.09), 90);
    setTimeout(() => tone(784, 0.18, 'triangle', 0.1), 180);
  },
  error() { tone(160, 0.15, 'square', 0.05, 110); },
  lost() { tone(392, 0.2, 'sawtooth', 0.06, 196); },
  level() {
    tone(523, 0.1, 'triangle', 0.08);
    setTimeout(() => tone(784, 0.16, 'triangle', 0.08), 110);
  },
};

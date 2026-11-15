/**
 * Synthesized plastic sounds via the Web Audio API — no audio files.
 * The AudioContext is created lazily on the first user gesture.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (!noise) {
    const len = Math.floor(ac.sampleRate * 0.05);
    noise = ac.createBuffer(1, len, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  return noise;
}

/** One transient: a filtered noise burst plus a short pitched "tock". */
function tick(ac: AudioContext, at: number, { freq, filter, gain }: { freq: number; filter: number; gain: number }) {
  const out = ac.createGain();
  out.gain.value = gain;
  out.connect(ac.destination);

  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = filter;
  bp.Q.value = 1.4;
  src.connect(bp).connect(out);
  src.start(at);

  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, at + 0.04);
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(0.6, at + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + 0.08);
}

/** Two quick transients read as a brick seating onto studs. */
export function playSnap(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.005;
  tick(ac, t, { freq: 1900, filter: 3200, gain: 0.32 });
  tick(ac, t + 0.028, { freq: 1250, filter: 2200, gain: 0.42 });
}

/** A softer, lower pop for pulling a brick off. */
export function playRemove(): void {
  const ac = audio();
  if (!ac) return;
  tick(ac, ac.currentTime + 0.005, { freq: 700, filter: 1200, gain: 0.3 });
}

/** A dull thud for an invalid placement. */
export function playBlocked(): void {
  const ac = audio();
  if (!ac) return;
  tick(ac, ac.currentTime + 0.005, { freq: 220, filter: 400, gain: 0.35 });
}

/** A tiny reel tick for the slot-machine randomizer. */
export function playTick(): void {
  const ac = audio();
  if (!ac) return;
  tick(ac, ac.currentTime + 0.002, { freq: 2600, filter: 4200, gain: 0.12 });
}

/** A bright two-note chime when the reels settle. */
export function playChime(): void {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  [880, 1320].forEach((f, i) => {
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    env.gain.setValueAtTime(0.0001, t + i * 0.09);
    env.gain.exponentialRampToValueAtTime(0.18, t + i * 0.09 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.35);
    osc.connect(env).connect(ac.destination);
    osc.start(t + i * 0.09);
    osc.stop(t + i * 0.09 + 0.4);
  });
}

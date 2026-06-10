"use client";

const AudioContext = typeof window !== "undefined" ? window.AudioContext || (window as any).webkitAudioContext : null;

let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx && AudioContext) ctx = new AudioContext();
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export function playMoveSound() {
  playTone(600, 0.08, "square", 0.1);
}

export function playCaptureSound() {
  playTone(300, 0.12, "sawtooth", 0.12);
}

export function playAnalysisChime() {
  const c = getCtx();
  if (!c) return;
  playTone(880, 0.15, "sine", 0.1);
  setTimeout(() => playTone(1100, 0.2, "sine", 0.08), 100);
}

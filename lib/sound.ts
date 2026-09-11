let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = frequency;
  osc.type = type;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playBeep(volume = 0.3) {
  playTone(880, 0.15, volume);
}

export function playAlert(volume = 0.3) {
  playTone(660, 0.2, volume);
  setTimeout(() => playTone(880, 0.2, volume), 250);
  setTimeout(() => playTone(660, 0.3, volume), 500);
}

export function playCritical(volume = 0.4) {
  for (let i = 0; i < 4; i++) {
    setTimeout(() => playTone(1000, 0.1, volume, "square"), i * 150);
  }
  setTimeout(() => playTone(800, 0.3, volume), 600);
}

export function playNotificationSound(tipo: "alerta" | "critico", volume: number) {
  const vol = Math.min(Math.max(volume / 100, 0), 1);
  if (tipo === "critico") {
    playCritical(vol);
  } else {
    playAlert(vol);
  }
}

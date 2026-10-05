/* Sinais sonoros suaves e vibração (opcionais). */
window.D31 = window.D31 || {};

D31.audio = (() => {
  let ctx = null;
  function bip(freq = 660, dur = 0.14, vol = 0.12) {
    if (!D31.storage.get().som) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch (e) { /* sem áudio */ }
  }
  return {
    desbloquear() { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) {} },
    tic() { bip(520, 0.1, 0.09); },
    troca() { bip(784, 0.22, 0.14); if (D31.storage.get().som && navigator.vibrate) navigator.vibrate(120); },
    fim() { bip(523, 0.18); setTimeout(() => bip(659, 0.18), 190); setTimeout(() => bip(784, 0.3), 380); },
  };
})();

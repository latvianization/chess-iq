class SoundService {
  constructor() {
    this.ctx = null;
    this.isMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('chess_iq_muted') === 'true' : false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('chess_iq_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  setMuted(muted) {
    this.isMuted = !!muted;
    try {
      localStorage.setItem('chess_iq_muted', String(this.isMuted));
    } catch {}
  }

  getContext() {
    if (typeof window === 'undefined' || this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playMove() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      if (osc.frequency?.setValueAtTime) {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);
      }

      if (gain.gain?.setValueAtTime) {
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);

      this.triggerHaptic('light');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playCapture() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      if (osc1.frequency?.setValueAtTime) {
        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      }
      if (gain1.gain?.setValueAtTime) {
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      }
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      if (osc2.frequency?.setValueAtTime) {
        osc2.frequency.setValueAtTime(420, now + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      }
      if (gain2.gain?.setValueAtTime) {
        gain2.gain.setValueAtTime(0.2, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      }
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.02);
      osc2.stop(now + 0.13);

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playCheck() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (osc.frequency?.setValueAtTime) {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
      }

      if (gain.gain?.setValueAtTime) {
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playBlunder() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      [164.81, 155.56, 110.0].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, now + i * 0.03);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.35);
        }

        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.2, now + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.03);
        osc.stop(now + 0.42);
      });

      this.triggerHaptic('heavy');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playBrilliant() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, noteTime);
        }

        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.18, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.36);
      });

      this.triggerHaptic('medium');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime || 0;
      [440, 554.37, 659.25].forEach((freq, i) => {
        const noteTime = now + i * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        if (osc.frequency?.setValueAtTime) {
          osc.frequency.setValueAtTime(freq, noteTime);
        }
        if (gain.gain?.setValueAtTime) {
          gain.gain.setValueAtTime(0.2, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
        }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.26);
      });
      this.triggerHaptic('light');
    } catch {
      // Audio playback safely suppressed if blocked by environment
    }
  }

  triggerHaptic(type) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(12);
        else if (type === 'medium') navigator.vibrate(35);
        else if (type === 'heavy') navigator.vibrate([60, 30, 80]);
      } catch {
        // Ignore vibration errors if blocked by browser
      }
    }
  }
}

export const soundService = new SoundService();

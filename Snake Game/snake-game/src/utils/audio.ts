// Web Audio API Retro Sound Effects Manager
class AudioManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy initialized on first user interaction to comply with browser autoplay policies
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('snake_game_muted', JSON.stringify(this.isMuted));
    } catch (e) {
      // Ignore security or storage errors
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    try {
      const saved = localStorage.getItem('snake_game_muted');
      if (saved !== null) {
        this.isMuted = JSON.parse(saved);
      }
    } catch (e) {
      // Use fallback
    }
    return this.isMuted;
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, gainVals: number[], times: number[]): { osc: OscillatorNode, gain: GainNode } | null {
    this.initContext();
    if (!this.ctx || this.isMuted) return null;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(gainVals[0] || 0, this.ctx.currentTime);
    let cumulativeTime = 0;
    for (let i = 1; i < gainVals.length; i++) {
      cumulativeTime += times[i - 1] || 0;
      gainNode.gain.linearRampToValueAtTime(gainVals[i], this.ctx.currentTime + cumulativeTime);
    }

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    return { osc, gain: gainNode };
  }

  public playEatRegular() {
    try {
      const parts = this.createOscillator('sine', 523.25, 0.1, [0.15, 0.15, 0.0], [0.02, 0.08]); // C5
      if (!parts) return;
      
      parts.osc.start();
      parts.osc.stop(this.ctx!.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }

  public playEatSpecial() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;

      const now = this.ctx.currentTime;
      
      // Plucky synth bubble sound
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.07); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.14); // D6
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn(e);
    }
  }

  public playPowerUp() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  public playLevelUp() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major chord arpeggio
      const noteDuration = 0.08;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * noteDuration);
        
        gain.gain.setValueAtTime(0, now + idx * noteDuration);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * noteDuration + 0.01);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * noteDuration + noteDuration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * noteDuration + noteDuration * 1.8);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * noteDuration);
        osc.stop(now + idx * noteDuration + noteDuration * 1.8);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  public playCrash() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Low frequency pitch drop and some custom noise-like qualities
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.4);
      
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
      
      // Let's also create a brief low rumble
      const rumble = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumble.type = 'sawtooth';
      rumble.frequency.setValueAtTime(90, now);
      rumble.frequency.setValueAtTime(30, now + 0.2);
      
      rumbleGain.gain.setValueAtTime(0.15, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      rumble.connect(rumbleGain);
      rumbleGain.connect(this.ctx.destination);
      rumble.start(now);
      rumble.stop(now + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  public playGameOver() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      const freqs = [293.66, 277.18, 261.63, 246.94]; // D4, C#4, C4, B3 descending gloom
      const noteDuration = 0.15;

      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * noteDuration);
        
        gain.gain.setValueAtTime(0, now + idx * noteDuration);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * noteDuration + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * noteDuration + noteDuration * 0.9);
        
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * noteDuration);
        osc.stop(now + idx * noteDuration + noteDuration * 0.9);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  public playTick() {
    try {
      this.initContext();
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Extremely subtle, high-pitched tick for rhythm (can be toggled or kept super light)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3000, now);
      
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.02);
    } catch (e) {
      // Fail silently
    }
  }
}

export const audio = new AudioManager();
export default audio;

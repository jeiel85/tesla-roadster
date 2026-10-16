/**
 * Audio Engine using Web Audio API
 * Generates custom synthesized sounds without requiring external audio files.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.thrusterGain = null;
    this.thrusterNoise = null;
    this.isThrusterPlaying = false;
    this.bgmPlaying = false;
    this.bgmInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  ensureReady() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopThrusterSound();
      this.stopBGM();
    } else {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      this.startBGM();
    }
    return this.enabled;
  }

  // --- Cold Gas Thruster Continuous Blast Sound ---
  startThrusterSound() {
    if (!this.enabled || !this.ctx || this.isThrusterPlaying) return;
    try {
      this.ensureReady();
      // White noise buffer for high-pressure gas jet
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.thrusterNoise = this.ctx.createBufferSource();
      this.thrusterNoise.buffer = noiseBuffer;
      this.thrusterNoise.loop = true;

      // Bandpass filter to make it sound like a focused rocket nozzle
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      // Low oscillator layer for deep rocket rumble
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, this.ctx.currentTime);

      this.thrusterGain = this.ctx.createGain();
      this.thrusterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.thrusterGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.08);

      this.thrusterNoise.connect(filter);
      filter.connect(this.thrusterGain);
      osc.connect(this.thrusterGain);
      this.thrusterGain.connect(this.ctx.destination);

      this.thrusterNoise.start();
      osc.start();
      this.thrusterOsc = osc;
      this.isThrusterPlaying = true;
    } catch (e) {
      // Ignore audio error
    }
  }

  stopThrusterSound() {
    if (!this.isThrusterPlaying) return;
    try {
      if (this.thrusterGain && this.ctx) {
        this.thrusterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        setTimeout(() => {
          if (this.thrusterNoise) {
            try { this.thrusterNoise.stop(); } catch (err) {}
            this.thrusterNoise.disconnect();
          }
          if (this.thrusterOsc) {
            try { this.thrusterOsc.stop(); } catch (err) {}
            this.thrusterOsc.disconnect();
          }
        }, 120);
      }
    } catch (e) {}
    this.isThrusterPlaying = false;
  }

  // --- RCS Attitude Thruster Micro-Burst ---
  playRcsBurst() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureReady();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (e) {}
  }

  // --- Hop / Jump Sound ---
  playJump() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureReady();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // --- Car Cleared Sound (Ascending with Combo) ---
  playCleared(combo = 1) {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureReady();
      const baseFreq = 330 * Math.min(2.5, 1 + (combo - 1) * 0.12);
      const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      });
    } catch (e) {}
  }

  // --- Roof Bounce (Super Mario style Pogo jump) ---
  playRoofBounce() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureReady();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch (e) {}
  }

  // --- Perfect Landing Sound ---
  playLanding() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureReady();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {}
  }

  // --- Fuel / Tank Powerup Sound ---
  playFuelPickup() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureReady();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch (e) {}
  }

  // --- Crash Sound ---
  playCrash() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureReady();
      // Low boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);

      // Noise burst for metal crunch
      const bufferSize = this.ctx.sampleRate * 0.3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const out = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start();
    } catch (e) {}
  }

  // --- Procedural Synthwave BGM Loop ---
  startBGM() {
    if (!this.enabled || !this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;
    this.ensureReady();

    const bpm = 124;
    const stepTime = (60 / bpm) / 4; // 16th notes
    let step = 0;

    // Bassline in D minor: D2, D2, F2, G2, D2, D2, C2, C2
    const bassline = [
      73.42, 73.42, 73.42, 87.31,
      73.42, 73.42, 98.00, 73.42,
      73.42, 73.42, 65.41, 65.41,
      73.42, 87.31, 98.00, 110.00
    ];

    this.bgmInterval = setInterval(() => {
      if (!this.bgmPlaying || !this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const noteIdx = step % 16;
        const freq = bassline[noteIdx];

        // Bass synth
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(380, t);
        filter.frequency.exponentialRampToValueAtTime(180, t + 0.1);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.11);

        // Hi-hat on every 8th note
        if (step % 2 === 0) {
          const hatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
          const hatOut = hatBuffer.getChannelData(0);
          for (let i = 0; i < hatOut.length; i++) hatOut[i] = Math.random() * 2 - 1;
          const hat = this.ctx.createBufferSource();
          hat.buffer = hatBuffer;
          const hatGain = this.ctx.createGain();
          hatGain.gain.setValueAtTime(0.025, t);
          hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
          hat.connect(hatGain);
          hatGain.connect(this.ctx.destination);
          hat.start(t);
        }

        step++;
      } catch (e) {}
    }, stepTime * 1000);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundEngine();

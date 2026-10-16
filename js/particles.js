/**
 * High-performance Particle & Floating Text FX System
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
  }

  // --- Add Rocket Thruster Plasma/Gas Jet ---
  emitThruster(x, y, angle, power = 1.0) {
    const count = Math.floor(4 * power);
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.45;
      const speed = (8 + Math.random() * 9) * power;
      // Thrust direction is opposite of car heading plus spread
      const thrustAngle = angle + Math.PI + spread;
      
      this.particles.push({
        x: x + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(thrustAngle) * speed,
        vy: Math.sin(thrustAngle) * speed,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.04,
        size: (4 + Math.random() * 6) * power,
        type: 'plasma', // cold gas plasma
        colorCore: '#ffffff',
        colorGlow: Math.random() > 0.3 ? '#00d2ff' : '#0066ff'
      });
    }
  }

  // --- Add RCS Attitude Thruster Micro-Jet ---
  emitRCS(x, y, direction = 'down') {
    const count = 3;
    const baseAngle = direction === 'down' ? Math.PI / 2 : -Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(baseAngle + spread) * speed,
        vy: Math.sin(baseAngle + spread) * speed,
        life: 1.0,
        decay: 0.08 + Math.random() * 0.05,
        size: 2.5 + Math.random() * 3,
        type: 'rcs',
        colorCore: '#ffffff',
        colorGlow: '#80e5ff'
      });
    }
  }

  // --- Add Tire Smoke & Ground Sparks ---
  emitTireSmoke(x, y) {
    for (let i = 0; i < 2; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y,
        vx: -(2 + Math.random() * 3),
        vy: -(0.5 + Math.random() * 1.5),
        life: 1.0,
        decay: 0.05,
        size: 4 + Math.random() * 5,
        type: 'smoke',
        colorCore: 'rgba(200, 210, 230, 0.4)',
        colorGlow: 'rgba(150, 160, 180, 0.2)'
      });
    }
  }

  // --- Add Crash / Explosion Debris ---
  emitExplosion(x, y) {
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 12;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        size: 3 + Math.random() * 7,
        type: 'debris',
        colorCore: Math.random() > 0.5 ? '#e82127' : '#ff9900',
        colorGlow: '#ff3300'
      });
    }
  }

  // --- Floating Dynamic Text (e.g. "TRAFFIC CLEARED +100") ---
  addText(x, y, text, color = '#00d2ff', size = 16) {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      size: size,
      alpha: 1.0,
      vy: -1.8,
      life: 1.0,
      decay: 0.02
    });
  }

  update(worldSpeed = 0) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx - worldSpeed * 0.5;
      p.y += p.vy;
      p.life -= p.decay;
      p.size = Math.max(0.1, p.size * 0.96);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.x -= worldSpeed * 0.4;
      t.y += t.vy;
      t.life -= t.decay;
      t.alpha = Math.max(0, t.life);

      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();

    // Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.colorGlow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Inner intense core
      ctx.fillStyle = p.colorCore;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render floating texts with glowing shadow
    ctx.font = 'bold 16px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    for (const t of this.floatingTexts) {
      ctx.globalAlpha = t.alpha;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px "Orbitron", sans-serif`;
      ctx.fillText(t.text, t.x, t.y);
    }

    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}

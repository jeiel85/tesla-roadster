/**
 * Parallax Synthwave City & Futuristic Highway Background
 */

export class CityEnvironment {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.roadY = 0; // Calculated dynamically based on height
    
    // Parallax layers offsets
    this.starsOffset = 0;
    this.farBuildingsOffset = 0;
    this.midBuildingsOffset = 0;
    this.neonSignsOffset = 0;
    this.roadStripeOffset = 0;
    this.streetLightsOffset = 0;

    // Procedural buildings cache
    this.farBuildings = [];
    this.midBuildings = [];
    this.neonSigns = [];
    this.stars = [];

    this.initWorld();
  }

  resize(width, height) {
    this.roadY = height * 0.76;
    this.initWorld();
  }

  initWorld() {
    const w = this.canvas.width || window.innerWidth;
    const h = this.canvas.height || window.innerHeight;
    this.roadY = h * 0.76;

    // Stars & Starlink satellites
    this.stars = [];
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * w * 2,
        y: Math.random() * (this.roadY * 0.5),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.8 + 0.2
      });
    }

    // Far skyline buildings (silhouettes)
    this.farBuildings = [];
    let curX = 0;
    while (curX < w * 3) {
      const bWidth = 40 + Math.random() * 70;
      const bHeight = 100 + Math.random() * (this.roadY * 0.45);
      this.farBuildings.push({
        x: curX,
        width: bWidth,
        height: bHeight,
        hasAntenna: Math.random() > 0.6
      });
      curX += bWidth + (Math.random() * 15);
    }

    // Midground buildings with glowing windows
    this.midBuildings = [];
    curX = 0;
    while (curX < w * 3) {
      const bWidth = 70 + Math.random() * 100;
      const bHeight = 140 + Math.random() * (this.roadY * 0.55);
      const windowCols = Math.floor(bWidth / 14);
      const windowRows = Math.floor(bHeight / 18);
      const windows = [];
      for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
          if (Math.random() > 0.4) {
            windows.push({ r, c, active: true, color: Math.random() > 0.8 ? '#00d2ff' : '#ffe6a3' });
          }
        }
      }

      this.midBuildings.push({
        x: curX,
        width: bWidth,
        height: bHeight,
        windows: windows,
        windowCols,
        windowRows
      });
      curX += bWidth + 20 + Math.random() * 30;
    }

    // Cyberpunk & Tesla Neon Signs
    const signTexts = ['TESLA', 'SPACEX', '0-60: 1.1s', 'COLD GAS', 'MARS ORBIT', 'CYBER', 'PLAID', 'STARLINK'];
    const signColors = ['#e82127', '#00d2ff', '#ff007f', '#00ffcc', '#ff9900'];
    this.neonSigns = [];
    for (let i = 0; i < 8; i++) {
      this.neonSigns.push({
        x: (w * 0.4) + i * 350 + Math.random() * 100,
        y: this.roadY - 180 - Math.random() * 120,
        text: signTexts[i % signTexts.length],
        color: signColors[i % signColors.length]
      });
    }
  }

  update(speed) {
    const w = this.canvas.width;

    // Parallax speed factors
    this.starsOffset += speed * 0.05;
    this.farBuildingsOffset += speed * 0.2;
    this.midBuildingsOffset += speed * 0.55;
    this.neonSignsOffset += speed * 0.55;
    this.roadStripeOffset += speed * 1.0;
    this.streetLightsOffset += speed * 1.0;

    // Loop far buildings
    for (const b of this.farBuildings) {
      if (b.x - this.farBuildingsOffset + b.width < -100) {
        b.x += w * 2.8;
      }
    }

    // Loop mid buildings
    for (const b of this.midBuildings) {
      if (b.x - this.midBuildingsOffset + b.width < -100) {
        b.x += w * 2.8;
      }
    }

    // Loop neon signs
    for (const s of this.neonSigns) {
      if (s.x - this.neonSignsOffset < -200) {
        s.x += w * 2.5;
      }
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const roadY = this.roadY;

    // 1. Sky Gradient (Sunset Cyberpunk: Dark blue -> Deep purple -> Crimson horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, roadY);
    skyGrad.addColorStop(0, '#060810');
    skyGrad.addColorStop(0.5, '#12122b');
    skyGrad.addColorStop(0.85, '#2c1236');
    skyGrad.addColorStop(1.0, '#4b152d');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, roadY);

    // 2. Stars
    ctx.fillStyle = '#ffffff';
    for (const star of this.stars) {
      const sx = (star.x - this.starsOffset) % (w * 2);
      const drawX = sx < 0 ? sx + w * 2 : sx;
      if (drawX < w) {
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(drawX, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;

    // 3. Cyber Sun / Moon
    const sunX = w * 0.75;
    const sunY = roadY * 0.35;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 70);
    sunGrad.addColorStop(0, 'rgba(255, 90, 150, 0.9)');
    sunGrad.addColorStop(0.6, 'rgba(232, 33, 39, 0.4)');
    sunGrad.addColorStop(1, 'rgba(232, 33, 39, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
    ctx.fill();

    // 4. Far Silhouette Buildings
    ctx.fillStyle = '#111422';
    for (const b of this.farBuildings) {
      const bx = b.x - this.farBuildingsOffset;
      if (bx > -b.width && bx < w) {
        ctx.fillRect(bx, roadY - b.height, b.width, b.height);
        if (b.hasAntenna) {
          ctx.strokeStyle = '#22273d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bx + b.width / 2, roadY - b.height);
          ctx.lineTo(bx + b.width / 2, roadY - b.height - 25);
          ctx.stroke();
          // Red beacon blink
          ctx.fillStyle = 'rgba(255, 30, 30, 0.8)';
          ctx.beginPath();
          ctx.arc(bx + b.width / 2, roadY - b.height - 25, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#111422';
        }
      }
    }

    // 5. Midground Buildings with Lit Windows
    for (const b of this.midBuildings) {
      const bx = b.x - this.midBuildingsOffset;
      if (bx > -b.width && bx < w) {
        // Building body
        ctx.fillStyle = '#171c2c';
        ctx.fillRect(bx, roadY - b.height, b.width, b.height);

        // Building edge glow
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, roadY - b.height, b.width, b.height);

        // Windows
        for (const win of b.windows) {
          const wx = bx + 8 + win.c * 13;
          const wy = roadY - b.height + 12 + win.r * 17;
          if (wx < bx + b.width - 8 && wy < roadY - 10) {
            ctx.fillStyle = win.color;
            ctx.globalAlpha = 0.65;
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
        ctx.globalAlpha = 1.0;
      }
    }

    // 6. Neon Signs
    ctx.font = '900 15px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    for (const s of this.neonSigns) {
      const sx = s.x - this.neonSignsOffset;
      if (sx > -100 && sx < w + 100) {
        ctx.save();
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = s.color;
        ctx.fillText(s.text, sx, s.y);
        // Neon border box
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        const textWidth = ctx.measureText(s.text).width;
        ctx.strokeRect(sx - textWidth / 2 - 8, s.y - 18, textWidth + 16, 24);
        ctx.restore();
      }
    }

    // 7. Futuristic Highway Road
    const roadHeight = h - roadY;
    const roadGrad = ctx.createLinearGradient(0, roadY, 0, h);
    roadGrad.addColorStop(0, '#1c1f2b');
    roadGrad.addColorStop(0.3, '#141620');
    roadGrad.addColorStop(1.0, '#0a0b10');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, roadY, w, roadHeight);

    // Top Highway Barrier / Guardrail (Glowing Neon Cyan/Blue Line)
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, roadY);
    ctx.lineTo(w, roadY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Subtle Road Grid / Lane Markings
    const stripeSpacing = 90;
    const stripeWidth = 50;
    const stripeY = roadY + roadHeight * 0.45;
    ctx.fillStyle = '#ffde59';
    ctx.shadowColor = 'rgba(255, 222, 89, 0.4)';
    ctx.shadowBlur = 6;
    
    const startStripeX = -(this.roadStripeOffset % stripeSpacing);
    for (let x = startStripeX; x < w + stripeSpacing; x += stripeSpacing) {
      ctx.fillRect(x, stripeY, stripeWidth, 4);
    }
    ctx.shadowBlur = 0;

    // Bottom Ambient Fog / Light Glow
    const fogGrad = ctx.createLinearGradient(0, h - 30, 0, h);
    fogGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    fogGrad.addColorStop(1, 'rgba(232, 33, 39, 0.15)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, h - 30, w, 30);
  }
}

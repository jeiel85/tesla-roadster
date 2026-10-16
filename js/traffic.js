/**
 * Traffic Jam Obstacles & Collectibles
 * Simulates city traffic (Sedans, Yellow Cabs, Trucks, Cybertrucks, Buses)
 * and bonus items (SpaceX Cold Gas Tanks, Supercharge Coils).
 */

export class TrafficManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.vehicles = [];
    this.items = [];
    this.spawnTimer = 0;
    this.itemTimer = 0;
    this.minSpawnInterval = 110;
    this.spawnInterval = 170;
  }

  reset() {
    this.vehicles = [];
    this.items = [];
    this.spawnTimer = 60;
    this.itemTimer = 180;
    this.spawnInterval = 170;
  }

  update(worldSpeed, roadY, difficultyFactor = 1.0) {
    const w = this.canvas.width;

    // Adjust spawn rate according to distance / difficulty
    const currentInterval = Math.max(this.minSpawnInterval, this.spawnInterval - difficultyFactor * 25);

    // 1. Spawn Traffic Vehicles
    this.spawnTimer++;
    if (this.spawnTimer > currentInterval) {
      this.spawnVehicle(w + 50, roadY);
      this.spawnTimer = Math.floor(Math.random() * 20); // slight random offset
    }

    // 2. Spawn Collectibles
    this.itemTimer++;
    if (this.itemTimer > 280) {
      this.spawnItem(w + 50, roadY);
      this.itemTimer = 0;
    }

    // 3. Update Vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      // Traffic moves slightly slower than the road speed (representing stuck/crawling traffic)
      v.x -= (worldSpeed - v.speed);

      // Remove offscreen
      if (v.x + v.width < -150) {
        this.vehicles.splice(i, 1);
      }
    }

    // 4. Update Items
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.x -= worldSpeed;
      item.floatAngle = (item.floatAngle || 0) + 0.05;
      item.y = item.baseY + Math.sin(item.floatAngle) * 8;

      if (item.x + item.width < -100) {
        this.items.splice(i, 1);
      }
    }
  }

  spawnVehicle(x, roadY) {
    const types = ['sedan', 'taxi', 'cybertruck', 'truck', 'bus'];
    // Weight types
    const rand = Math.random();
    let type = 'sedan';
    if (rand < 0.3) type = 'sedan';
    else if (rand < 0.5) type = 'taxi';
    else if (rand < 0.7) type = 'cybertruck';
    else if (rand < 0.88) type = 'truck';
    else type = 'bus';

    let width = 72;
    let height = 30;
    let color = '#3a86ff';
    let speed = 1.0 + Math.random() * 1.5; // Crawling in traffic

    if (type === 'taxi') {
      width = 72;
      height = 30;
      color = '#ffbe0b';
    } else if (type === 'cybertruck') {
      width = 88;
      height = 36;
      color = '#c0c0c0';
    } else if (type === 'truck') {
      width = 135;
      height = 56;
      color = '#8338ec';
      speed = 0.5 + Math.random() * 1.0;
    } else if (type === 'bus') {
      width = 120;
      height = 48;
      color = '#fb5607';
      speed = 0.8 + Math.random() * 1.0;
    } else {
      // Sedans in various colors
      const sedanColors = ['#e63946', '#457b9d', '#2a9d8f', '#6c757d', '#f4a261'];
      color = sedanColors[Math.floor(Math.random() * sedanColors.length)];
    }

    this.vehicles.push({
      x: x,
      y: roadY - height,
      width: width,
      height: height,
      type: type,
      color: color,
      speed: speed,
      cleared: false,
      closeCallAwarded: false
    });
  }

  spawnItem(x, roadY) {
    const isTank = Math.random() > 0.4;
    const type = isTank ? 'tank' : 'battery';
    // Position floating in the air for mid-air thruster navigation
    const altitude = 60 + Math.random() * 140;
    const y = roadY - altitude;

    this.items.push({
      x: x,
      y: y,
      baseY: y,
      width: 28,
      height: 28,
      type: type,
      floatAngle: Math.random() * Math.PI,
      collected: false
    });
  }

  draw() {
    const ctx = this.ctx;

    // 1. Draw Vehicles
    for (const v of this.vehicles) {
      this.drawVehicle(v);
    }

    // 2. Draw Items
    for (const item of this.items) {
      this.drawItem(item);
    }
  }

  drawVehicle(v) {
    const ctx = this.ctx;
    ctx.save();

    // Wheel dimensions
    const wheelR = v.height * 0.22;
    const wheelY = v.y + v.height - 2;

    if (v.type === 'cybertruck') {
      // Cyber polygonal styling
      ctx.fillStyle = '#a8b2bc';
      ctx.beginPath();
      ctx.moveTo(v.x, v.y + v.height - 4);
      ctx.lineTo(v.x + 10, v.y + 12);
      ctx.lineTo(v.x + v.width * 0.42, v.y);
      ctx.lineTo(v.x + v.width - 12, v.y + 8);
      ctx.lineTo(v.x + v.width, v.y + v.height - 4);
      ctx.closePath();
      ctx.fill();

      // Cyber lightbar (Front LED)
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(v.x + v.width - 5, v.y + 8, 4, 4);
      ctx.shadowBlur = 0;

      // Dark glass window
      ctx.fillStyle = '#1e242c';
      ctx.beginPath();
      ctx.moveTo(v.x + 22, v.y + 14);
      ctx.lineTo(v.x + v.width * 0.42, v.y + 4);
      ctx.lineTo(v.x + v.width * 0.75, v.y + 10);
      ctx.lineTo(v.x + 22, v.y + 14);
      ctx.fill();
    } else if (v.type === 'truck') {
      // Semi / Box Truck
      // Trailer
      ctx.fillStyle = '#2b2d42';
      ctx.fillRect(v.x, v.y, v.width * 0.72, v.height - 4);
      // Trailer border/ribs
      ctx.strokeStyle = '#4a4e69';
      ctx.strokeRect(v.x, v.y, v.width * 0.72, v.height - 4);

      // Cab
      ctx.fillStyle = v.color;
      ctx.fillRect(v.x + v.width * 0.74, v.y + 10, v.width * 0.26, v.height - 14);
      // Windshield
      ctx.fillStyle = '#a8dadc';
      ctx.fillRect(v.x + v.width * 0.88, v.y + 14, v.width * 0.11, 14);
      // Headlight
      ctx.fillStyle = '#fff';
      ctx.fillRect(v.x + v.width - 2, v.y + v.height - 12, 3, 6);
    } else if (v.type === 'bus') {
      // City Bus
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(v.x, v.y, v.width, v.height - 4, [6, 12, 4, 4]);
      ctx.fill();

      // Bus Windows row
      ctx.fillStyle = '#1d3557';
      const winCount = 6;
      const winW = (v.width - 24) / winCount;
      for (let i = 0; i < winCount; i++) {
        ctx.fillRect(v.x + 8 + i * winW, v.y + 7, winW - 3, 14);
      }
    } else {
      // Standard Sedan or Taxi
      ctx.fillStyle = v.color;
      ctx.beginPath();
      // Hood -> Windshield -> Roof -> Rear window -> Trunk
      ctx.moveTo(v.x, v.y + v.height - 4);
      ctx.lineTo(v.x + 8, v.y + v.height * 0.45);
      ctx.lineTo(v.x + v.width * 0.25, v.y + 4);
      ctx.lineTo(v.x + v.width * 0.72, v.y + 4);
      ctx.lineTo(v.x + v.width * 0.88, v.y + v.height * 0.45);
      ctx.lineTo(v.x + v.width, v.y + v.height - 4);
      ctx.closePath();
      ctx.fill();

      // Windows
      ctx.fillStyle = '#1b263b';
      ctx.beginPath();
      ctx.moveTo(v.x + v.width * 0.28, v.y + 6);
      ctx.lineTo(v.x + v.width * 0.7, v.y + 6);
      ctx.lineTo(v.x + v.width * 0.84, v.y + v.height * 0.42);
      ctx.lineTo(v.x + v.width * 0.16, v.y + v.height * 0.42);
      ctx.closePath();
      ctx.fill();

      // Taxi Roof Sign
      if (v.type === 'taxi') {
        ctx.fillStyle = '#ffde59';
        ctx.fillRect(v.x + v.width * 0.42, v.y - 6, 16, 7);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 5px sans-serif';
        ctx.fillText('TAXI', v.x + v.width * 0.44, v.y - 1);
      }
    }

    // Wheels
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;

    const w1X = v.x + v.width * 0.22;
    const w2X = v.x + v.width * 0.78;

    // Front/Rear Wheels
    [w1X, w2X].forEach(wx => {
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Hubcap
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelR * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
    });

    // Red taillight & White Headlight
    ctx.fillStyle = '#ff2233';
    ctx.fillRect(v.x, v.y + v.height * 0.5, 3, 5);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(v.x + v.width - 2, v.y + v.height * 0.5, 3, 5);

    ctx.restore();
  }

  drawItem(item) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(item.x + item.width / 2, item.y + item.height / 2);

    if (item.type === 'tank') {
      // SpaceX Cold Gas Tank (Cyan capsule with glowing thruster icon)
      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 14;

      // Capsule body
      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.roundRect(-10, -14, 20, 28, 8);
      ctx.fill();

      // Tank stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-8, -4, 16, 8);

      // Rocket text
      ctx.fillStyle = '#0a1020';
      ctx.font = 'bold 7px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PSI', 0, 2);
    } else {
      // Tesla Energy Bolt (Golden battery)
      ctx.shadowColor = '#ffde59';
      ctx.shadowBlur = 14;

      ctx.fillStyle = '#ffde59';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();

      // Lightning bolt icon
      ctx.fillStyle = '#1a1000';
      ctx.beginPath();
      ctx.moveTo(-1, -7);
      ctx.lineTo(4, -1);
      ctx.lineTo(0, 0);
      ctx.lineTo(2, 7);
      ctx.lineTo(-4, 1);
      ctx.lineTo(-1, 0);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

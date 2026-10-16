/**
 * Tesla Roadster with SpaceX Cold Gas Thruster Package
 * Features:
 * - Dynamic rocket hover & vertical thrust
 * - Autonomous Attitude Stabilization (RCS leveling)
 * - Suspension squish on landing
 * - High-speed aero silhouette & thruster nozzle visualization
 */

export class Roadster {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Dimensions
    this.width = 96;
    this.height = 30;

    // Position & Physics
    this.x = 120;
    this.y = 0;
    this.vy = 0;
    this.gravity = 0.52;
    this.angle = 0;
    this.angularVelocity = 0;
    this.groundY = 0;
    this.isGrounded = true;

    // Thruster & RCS systems
    this.maxPsi = 10000;
    this.psi = this.maxPsi;
    this.isThrusting = false;
    this.isStabilizing = false;
    this.thrustForce = -0.92;
    this.jumpForce = -9.8;
    this.psiDrainRate = 55; // PSI per frame when thrusting
    this.psiRechargeRate = 42; // PSI per frame when grounded

    // Visuals & Suspension
    this.wheelRotation = 0;
    this.suspensionSquish = 0; // vertical compress offset
    this.wheelGroundedY = 0;
    this.thrusterGlow = 0;
  }

  reset(roadY) {
    this.groundY = roadY - this.height;
    this.y = this.groundY;
    this.vy = 0;
    this.angle = 0;
    this.angularVelocity = 0;
    this.isGrounded = true;
    this.psi = this.maxPsi;
    this.isThrusting = false;
    this.isStabilizing = false;
    this.suspensionSquish = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.angularVelocity = -0.04; // Nose lifts up slightly on rocket hop
      this.suspensionSquish = 4;
      return true;
    }
    return false;
  }

  setThrusting(active) {
    this.isThrusting = active && this.psi > 100;
  }

  rechargePSI(amount) {
    this.psi = Math.min(this.maxPsi, this.psi + amount);
  }

  update(roadY, particles, sound) {
    this.groundY = roadY - this.height;

    // 1. Thruster Physics
    if (this.isThrusting && this.psi > 0) {
      this.vy += this.thrustForce;
      this.psi = Math.max(0, this.psi - this.psiDrainRate);
      this.thrusterGlow = Math.min(1.0, this.thrusterGlow + 0.2);

      // Rocket pitch tilt: tail down, nose up
      this.angularVelocity = Math.max(-0.06, this.angularVelocity - 0.005);

      // Emit Thruster Plasma Particles from rear SpaceX nozzles
      const nozzleX = this.x + 4;
      const nozzleY = this.y + this.height - 8;
      particles.emitThruster(nozzleX, nozzleY, this.angle, 1.2);

      sound.startThrusterSound();
    } else {
      this.thrusterGlow = Math.max(0, this.thrusterGlow - 0.1);
      sound.stopThrusterSound();

      // Recharge PSI when grounded
      if (this.isGrounded) {
        this.psi = Math.min(this.maxPsi, this.psi + this.psiRechargeRate);
      }
    }

    // 2. Gravity & Velocity
    this.vy += this.gravity;
    // Terminal fall velocity
    if (this.vy > 13) this.vy = 13;
    this.y += this.vy;

    // 3. Autonomous RCS Attitude Stabilization (Real Tesla Unveil Feature!)
    // As seen in the viral reveal: car uses cold gas thrusters to auto-level before landing
    this.angle += this.angularVelocity;

    if (!this.isGrounded) {
      if (Math.abs(this.angle) > 0.03) {
        this.isStabilizing = true;
        // Dampen angular velocity and pull angle back toward 0 (horizontal)
        const restoringTorque = -this.angle * 0.12;
        this.angularVelocity += restoringTorque;
        this.angularVelocity *= 0.88;

        // Emit micro RCS bursts from front or rear roof nozzle
        if (this.angle < -0.05) {
          // Nose is pointing up, fire front RCS downwards to level
          particles.emitRCS(this.x + this.width - 15, this.y + 4, 'down');
          if (Math.random() > 0.6) sound.playRcsBurst();
        } else if (this.angle > 0.05) {
          // Nose is pointing down, fire rear RCS downwards
          particles.emitRCS(this.x + 15, this.y + 4, 'down');
          if (Math.random() > 0.6) sound.playRcsBurst();
        }
      } else {
        this.isStabilizing = false;
        this.angle *= 0.85;
      }
    } else {
      this.isStabilizing = false;
      this.angle = 0;
      this.angularVelocity = 0;
    }

    // 4. Ground Collision & Landing Suspension
    if (this.y >= this.groundY) {
      const prevVy = this.vy;
      this.y = this.groundY;
      this.vy = 0;

      if (!this.isGrounded) {
        // Just landed!
        this.isGrounded = true;
        this.suspensionSquish = Math.min(7, Math.abs(prevVy) * 0.7);
        particles.emitTireSmoke(this.x + 22, this.y + this.height);
        particles.emitTireSmoke(this.x + this.width - 20, this.y + this.height);
        sound.playLanding();

        // Level instantly on road contact
        this.angle = 0;
        this.angularVelocity = 0;
      }
    } else {
      this.isGrounded = false;
    }

    // Recover suspension
    if (this.suspensionSquish > 0) {
      this.suspensionSquish *= 0.8;
      if (this.suspensionSquish < 0.1) this.suspensionSquish = 0;
    }

    // Wheel rotation speed
    this.wheelRotation += 0.28;
  }

  // Roof Stomp / Bounce on another vehicle
  roofBounce(vehicleY) {
    this.y = vehicleY - this.height;
    this.vy = -8.5; // High bounce
    this.isGrounded = false;
    this.suspensionSquish = 6;
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();

    // Center pivot for rotation
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2 + this.suspensionSquish;

    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);

    const w = this.width;
    const h = this.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // 1. SpaceX Rocket Thruster Nozzles (Rear)
    ctx.fillStyle = '#222733';
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 1;
    // Dual cold-gas nozzles
    ctx.fillRect(-halfW - 5, halfH - 14, 6, 5);
    ctx.fillRect(-halfW - 5, halfH - 8, 6, 5);

    // Glowing nozzle halo when active
    if (this.thrusterGlow > 0) {
      ctx.fillStyle = `rgba(0, 210, 255, ${this.thrusterGlow * 0.8})`;
      ctx.shadowColor = '#00d2ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(-halfW - 3, halfH - 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 2. Roadster Streamlined Body (Tesla Carmine Red)
    const bodyGrad = ctx.createLinearGradient(0, -halfH, 0, halfH);
    bodyGrad.addColorStop(0, '#ff3b42');
    bodyGrad.addColorStop(0.35, '#e82127');
    bodyGrad.addColorStop(0.85, '#990c11');
    bodyGrad.addColorStop(1, '#570407');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    // Start at rear bumper
    ctx.moveTo(-halfW, halfH - 4);
    // Rear diffuser/lip
    ctx.lineTo(-halfW + 4, halfH - 10);
    // Rear deck & spoiler subtle curve
    ctx.lineTo(-halfW * 0.55, -2);
    // Fastback Glass Canopy / Roof
    ctx.lineTo(-halfW * 0.2, -halfH + 2);
    ctx.lineTo(halfW * 0.25, -halfH + 2);
    // Sleek Windshield rake
    ctx.lineTo(halfW * 0.58, 2);
    // Low Long Hood
    ctx.lineTo(halfW * 0.88, 4);
    // Front Nose / Splitter
    ctx.lineTo(halfW, halfH - 4);
    ctx.lineTo(halfW - 8, halfH - 2);
    // Underbody
    ctx.lineTo(-halfW + 6, halfH - 2);
    ctx.closePath();
    ctx.fill();

    // 3. Tinted Aerodynamic Glass Canopy
    const glassGrad = ctx.createLinearGradient(0, -halfH, 0, 0);
    glassGrad.addColorStop(0, '#0a101d');
    glassGrad.addColorStop(1, '#1b2a47');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.45, 0);
    ctx.lineTo(-halfW * 0.16, -halfH + 4);
    ctx.lineTo(halfW * 0.22, -halfH + 4);
    ctx.lineTo(halfW * 0.52, 2);
    ctx.closePath();
    ctx.fill();

    // Interior subtle driver/steering yoke silhouette
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, -4, 8, 3);

    // 4. LED Headlight (Aggressive Signature Tesla Blade)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00d2ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(halfW * 0.82, 5);
    ctx.lineTo(halfW - 2, 6);
    ctx.lineTo(halfW * 0.9, 9);
    ctx.closePath();
    ctx.fill();

    // 5. Full-width Neon Red Taillight Bar
    ctx.fillStyle = '#ff2233';
    ctx.shadowColor = '#ff2233';
    ctx.shadowBlur = 12;
    ctx.fillRect(-halfW + 1, -1, 4, 7);
    ctx.shadowBlur = 0;

    // 6. Wheels & Rims (Tesla Turbine Rims)
    const wheelRadius = 10;
    const wheelY = halfH - 1;
    const wheel1X = -halfW * 0.48;
    const wheel2X = halfW * 0.55;

    [wheel1X, wheel2X].forEach(wx => {
      // Tire
      ctx.fillStyle = '#0e0f14';
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#252936';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rim Hub
      ctx.fillStyle = '#22252e';
      ctx.beginPath();
      ctx.arc(wx, wheelY, wheelRadius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Turbine Spokes rotating
      ctx.save();
      ctx.translate(wx, wheelY);
      ctx.rotate(this.wheelRotation);
      ctx.strokeStyle = '#8e9aaf';
      ctx.lineWidth = 1.5;
      for (let s = 0; s < 5; s++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const spokeAngle = (s * Math.PI * 2) / 5;
        ctx.lineTo(Math.cos(spokeAngle) * (wheelRadius * 0.6), Math.sin(spokeAngle) * (wheelRadius * 0.6));
        ctx.stroke();
      }
      ctx.restore();
    });

    // 7. RCS Attitude Nozzle Badges (Micro white ports on front/rear)
    ctx.fillStyle = '#c5d3e8';
    ctx.fillRect(-halfW * 0.2, -halfH + 2, 3, 2); // Rear roof RCS
    ctx.fillRect(halfW * 0.72, 3, 3, 2);         // Front hood RCS

    ctx.restore();
  }

  // Bounding box for collisions
  getBounds() {
    return {
      x: this.x + 8,
      y: this.y + 4 + this.suspensionSquish,
      width: this.width - 16,
      height: this.height - 6
    };
  }
}

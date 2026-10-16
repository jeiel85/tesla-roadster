/**
 * Tesla Roadster: Flight Mode - Main Game Controller
 * Architecture: ES6 Modular HTML5 Canvas Game
 */

import { sound } from './audio.js';
import { ParticleSystem } from './particles.js';
import { CityEnvironment } from './city.js';
import { TrafficManager } from './traffic.js';
import { Roadster } from './car.js';
import { UIManager } from './ui.js';

const STATE = {
  START: 'START',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
  PAUSED: 'PAUSED'
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Core systems
    this.particles = new ParticleSystem();
    this.city = new CityEnvironment(this.canvas);
    this.traffic = new TrafficManager(this.canvas);
    this.car = new Roadster(this.canvas);
    this.ui = new UIManager();

    // Game State
    this.state = STATE.START;
    this.score = 0;
    this.distance = 0;
    this.clearedCars = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;

    // Speeds (MPH)
    this.baseSpeed = 65;
    this.speed = this.baseSpeed;
    this.maxSpeed = 230;

    // Visual FX
    this.shakeAmount = 0;
    this.slowMoFactor = 1.0;
    this.targetSlowMo = 1.0;

    // Input tracker
    this.isActionPressed = false;

    this.init();
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    this.bindInputs();
    this.bindUI();

    // Reset car position
    this.car.reset(this.city.roadY);

    // Initial render
    this.render();

    // Start Animation Loop
    requestAnimationFrame((t) => this.loop(t));

    // Instant Action Demo Mode for Screenshots/Previews
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
      setTimeout(() => {
        this.startGame();
        this.car.y = this.city.roadY - 130;
        this.car.vy = -1.5;
        this.car.angle = -0.07;
        this.car.isThrusting = true;
        this.car.isGrounded = false;
        this.speed = 135;
        this.score = 3850;
        this.combo = 4;
        this.clearedCars = 6;
        this.distance = 1840;
        this.particles.addText(this.car.x + 85, this.car.y - 32, '⚡ CLOSE CALL! +500', '#00d2ff', 18);
        this.particles.emitThruster(this.car.x + 4, this.car.y + this.car.height - 8, this.car.angle, 1.8);
        this.traffic.spawnVehicle(this.car.x - 30, this.city.roadY);
        this.traffic.spawnVehicle(this.car.x + 80, this.city.roadY);
        this.traffic.spawnVehicle(this.car.x + 230, this.city.roadY);
      }, 100);
    }
  }

  handleResize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);

    this.city.resize(width, height);
    if (this.state === STATE.START) {
      this.car.reset(this.city.roadY);
    }
  }

  bindInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.onActionStart();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.onActionEnd();
      }
    });

    // Mouse & Touch Pointer inputs
    const handlePointerDown = (e) => {
      // Don't trigger if clicking HUD buttons
      if (e.target.closest('#hud button') || e.target.closest('.overlay-card button')) return;
      this.onActionStart();
    };

    const handlePointerUp = () => {
      this.onActionEnd();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('blur', () => this.onActionEnd());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.onActionEnd();
    });
  }

  bindUI() {
    this.ui.startBtn.addEventListener('click', () => this.startGame());
    this.ui.restartBtn.addEventListener('click', () => this.startGame());
    this.ui.resumeBtn.addEventListener('click', () => this.togglePause());

    this.ui.soundToggleBtn.addEventListener('click', () => {
      const enabled = sound.toggleSound();
      this.ui.updateSoundButton(enabled);
    });

    this.ui.shareBtn.addEventListener('click', () => {
      this.ui.shareResults(this.score, this.clearedCars);
    });
  }

  onActionStart() {
    sound.ensureReady();

    if (this.state === STATE.START) {
      this.startGame();
      return;
    }

    if (this.state === STATE.GAMEOVER) {
      this.startGame();
      return;
    }

    if (this.state !== STATE.PLAYING) return;

    this.isActionPressed = true;
    const didHop = this.car.jump();
    if (didHop) {
      sound.playJump();
      this.particles.emitThruster(this.car.x + 4, this.car.y + this.car.height - 8, this.car.angle, 1.4);
    }
    this.car.setThrusting(true);
  }

  onActionEnd() {
    this.isActionPressed = false;
    this.car.setThrusting(false);
    sound.stopThrusterSound();
  }

  startGame() {
    sound.ensureReady();
    sound.startBGM();

    this.score = 0;
    this.distance = 0;
    this.clearedCars = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.speed = this.baseSpeed;
    this.shakeAmount = 0;

    this.particles.clear();
    this.traffic.reset();
    this.car.reset(this.city.roadY);

    this.ui.hideStartScreen();
    this.ui.hideGameOver();
    this.ui.hidePause();

    this.state = STATE.PLAYING;
  }

  togglePause() {
    if (this.state === STATE.PLAYING) {
      this.state = STATE.PAUSED;
      sound.stopThrusterSound();
      this.ui.showPause();
    } else if (this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
      this.ui.hidePause();
    }
  }

  triggerScreenShake(intensity = 10) {
    this.shakeAmount = intensity;
  }

  triggerSlowMo(durationMs = 280) {
    this.targetSlowMo = 0.35;
    setTimeout(() => {
      this.targetSlowMo = 1.0;
    }, durationMs);
  }

  loop(currentTime) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    if (this.state !== STATE.PLAYING) {
      if (this.state === STATE.START) {
        // Idle ambient background animation
        this.city.update(1.2);
        this.particles.update(1.2);
      }
      return;
    }

    // Slow-mo smoothing
    this.slowMoFactor += (this.targetSlowMo - this.slowMoFactor) * 0.15;

    // Dynamic speed progression based on distance
    const speedRatio = Math.min(1.0, this.distance / 12000);
    this.speed = this.baseSpeed + (this.maxSpeed - this.baseSpeed) * speedRatio;
    
    // Pixel scroll per frame (scaled with speed and slowmo)
    const worldSpeed = (this.speed * 0.08) * this.slowMoFactor;

    // Update Distance & Score over time
    this.distance += worldSpeed * 2.2;
    this.score += Math.round(1 * this.combo);

    // Combo timeout decay
    if (this.combo > 1) {
      this.comboTimer++;
      if (this.comboTimer > 200) {
        this.combo = 1;
      }
    }

    // 1. Update City & Background
    this.city.update(worldSpeed);

    // 2. Update Roadster Car Physics
    this.car.update(this.city.roadY, this.particles, sound);

    // 3. Update Traffic & Obstacles
    const difficultyFactor = Math.min(2.0, 1.0 + (this.distance / 8000));
    this.traffic.update(worldSpeed, this.city.roadY, difficultyFactor);

    // 4. Update Particles
    this.particles.update(worldSpeed);

    // 5. Collision & Interaction Checks
    this.checkCollisions();

    // 6. Screen shake decay
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.88;
      if (this.shakeAmount < 0.2) this.shakeAmount = 0;
    }

    // 7. Update HUD
    this.ui.updateHUD({
      score: this.score,
      combo: this.combo,
      distance: this.distance,
      cleared: this.clearedCars,
      speed: this.speed,
      psi: this.car.psi,
      maxPsi: this.car.maxPsi,
      isStabilizing: this.car.isStabilizing,
      isThrusting: this.car.isThrusting
    });
  }

  checkCollisions() {
    const carBounds = this.car.getBounds();

    // Check Traffic Vehicles
    for (const v of this.traffic.vehicles) {
      // Check horizontal clearance
      if (!v.cleared && v.x + v.width < carBounds.x) {
        v.cleared = true;
        this.clearedCars++;
        this.combo++;
        this.comboTimer = 0;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        const bonus = 150 * this.combo;
        this.score += bonus;
        sound.playCleared(this.combo);
        this.particles.addText(this.car.x + 30, this.car.y - 18, `TRAFFIC CLEARED! +${bonus}`, '#39ff14', 15);
      }

      // Check Close-Call (flying closely right above vehicle roof)
      if (!v.closeCallAwarded && !v.cleared) {
        const horizOverlap = (carBounds.x + carBounds.width > v.x) && (carBounds.x < v.x + v.width);
        const verticalDistance = v.y - (carBounds.y + carBounds.height);
        if (horizOverlap && verticalDistance > 0 && verticalDistance < 42) {
          v.closeCallAwarded = true;
          this.score += 500;
          this.combo++;
          this.comboTimer = 0;
          this.triggerSlowMo(220); // Brief cinematic slow-mo!
          sound.playCleared(this.combo + 2);
          this.particles.addText(v.x + v.width / 2, v.y - 30, '⚡ CLOSE CALL! +500', '#00d2ff', 16);
        }
      }

      // Check AABB Collision Box
      const overlapX = (carBounds.x < v.x + v.width) && (carBounds.x + carBounds.width > v.x);
      const overlapY = (carBounds.y < v.y + v.height) && (carBounds.y + carBounds.height > v.y);

      if (overlapX && overlapY) {
        // Did we land on top of the vehicle roof while descending?
        const carBottom = carBounds.y + carBounds.height;
        const roofTolerance = 14;

        if (this.car.vy > 0 && carBottom <= v.y + roofTolerance) {
          // Roof Stomp / Bounce!
          this.car.roofBounce(v.y);
          this.score += 300;
          this.combo++;
          this.comboTimer = 0;
          if (this.combo > this.maxCombo) this.maxCombo = this.combo;

          sound.playRoofBounce();
          this.triggerScreenShake(6);
          this.particles.addText(v.x + v.width / 2, v.y - 20, 'ROOF HOP! +300', '#ffde59', 16);
          this.particles.emitTireSmoke(carBounds.x + 20, v.y);
        } else {
          // Fatal Crash!
          this.gameOver('정체 차량과 충돌했습니다!');
          return;
        }
      }
    }

    // Check Collectible Items
    for (let i = this.traffic.items.length - 1; i >= 0; i--) {
      const item = this.traffic.items[i];
      const overlap = (carBounds.x < item.x + item.width) &&
                      (carBounds.x + carBounds.width > item.x) &&
                      (carBounds.y < item.y + item.height) &&
                      (carBounds.y + carBounds.height > item.y);

      if (overlap) {
        if (item.type === 'tank') {
          // SpaceX Cold Gas Tank
          this.car.rechargePSI(8000);
          this.score += 800;
          sound.playFuelPickup();
          this.particles.addText(item.x, item.y - 15, '🚀 10,000 PSI RECHARGED!', '#00d2ff', 16);
        } else {
          // Tesla Battery
          this.score += 400;
          sound.playFuelPickup();
          this.particles.addText(item.x, item.y - 15, '⚡ BATTERY +400', '#ffde59', 15);
        }

        this.traffic.items.splice(i, 1);
      }
    }
  }

  gameOver(reason) {
    this.state = STATE.GAMEOVER;
    sound.stopThrusterSound();
    sound.playCrash();

    this.triggerScreenShake(24);
    this.particles.emitExplosion(this.car.x + this.car.width / 2, this.car.y + this.car.height / 2);

    setTimeout(() => {
      this.ui.showGameOver({
        score: this.score,
        distance: this.distance,
        cleared: this.clearedCars,
        maxCombo: this.maxCombo,
        reason: reason
      });
    }, 700);
  }

  render() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.save();

    // Screen Shake Offset
    if (this.shakeAmount > 0) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(sx, sy);
    }

    // 1. Clear & Draw Parallax City
    ctx.clearRect(0, 0, w, h);
    this.city.draw();

    // 2. Draw Traffic Vehicles & Items
    this.traffic.draw();

    // 3. Draw Roadster Car (unless destroyed)
    if (this.state !== STATE.GAMEOVER) {
      this.car.draw();
    }

    // 4. Draw Particles & Floating Text FX
    this.particles.draw(ctx);

    ctx.restore();
  }
}

// Instantiate and start when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

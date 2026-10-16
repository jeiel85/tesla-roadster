/**
 * UI Manager for HUD, Overlays, High Scores, and Social Share
 */

export class UIManager {
  constructor() {
    // HUD Elements
    this.scoreVal = document.getElementById('scoreVal');
    this.comboContainer = document.getElementById('comboContainer');
    this.comboMultiplier = document.getElementById('comboMultiplier');
    this.clearedVal = document.getElementById('clearedVal');
    this.distanceVal = document.getElementById('distanceVal');
    this.speedVal = document.getElementById('speedVal');
    this.accelMode = document.getElementById('accelMode');
    this.psiVal = document.getElementById('psiVal');
    this.thrusterBar = document.getElementById('thrusterBar');
    this.rcsIndicator = document.getElementById('rcsIndicator');
    this.statusText = document.getElementById('statusText');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIcon = document.getElementById('soundIcon');

    // Overlay Screens
    this.startScreen = document.getElementById('startScreen');
    this.gameOverScreen = document.getElementById('gameOverScreen');
    this.pauseScreen = document.getElementById('pauseScreen');
    this.startBtn = document.getElementById('startBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.resumeBtn = document.getElementById('resumeBtn');
    this.shareBtn = document.getElementById('shareBtn');

    // Result fields
    this.finalScore = document.getElementById('finalScore');
    this.finalDistance = document.getElementById('finalDistance');
    this.finalCleared = document.getElementById('finalCleared');
    this.finalMaxCombo = document.getElementById('finalMaxCombo');
    this.newBestBadge = document.getElementById('newBestBadge');
    this.startHighScore = document.getElementById('startHighScore');
    this.crashReason = document.getElementById('crashReason');

    this.highScore = parseInt(localStorage.getItem('tesla_roadster_highscore') || '0', 10);
    this.updateStartHighScore();
  }

  updateStartHighScore() {
    if (this.startHighScore) {
      this.startHighScore.textContent = `${this.highScore.toLocaleString()} PTS`;
    }
  }

  updateHUD(data) {
    // Score & Combo
    this.scoreVal.textContent = data.score.toLocaleString();
    if (data.combo > 1) {
      this.comboContainer.classList.remove('hidden');
      this.comboMultiplier.textContent = `x${data.combo}`;
    } else {
      this.comboContainer.classList.add('hidden');
    }

    // Traffic Cleared & Distance
    this.clearedVal.textContent = data.cleared;
    this.distanceVal.textContent = (data.distance / 1000).toFixed(2);

    // Speedometer
    this.speedVal.textContent = Math.round(data.speed);
    if (data.speed > 160) {
      this.accelMode.textContent = 'MAX PLAID';
      this.accelMode.style.background = 'linear-gradient(90deg, #ff007f, #00d2ff)';
    } else if (data.speed > 100) {
      this.accelMode.textContent = 'LUDICROUS';
      this.accelMode.style.background = 'linear-gradient(90deg, #e82127, #ff9900)';
    } else {
      this.accelMode.textContent = 'PLAID';
      this.accelMode.style.background = 'linear-gradient(90deg, #e82127, #ff5e62)';
    }

    // Cold Gas Thruster PSI
    const psiPercent = Math.max(0, Math.min(100, (data.psi / data.maxPsi) * 100));
    this.psiVal.textContent = `${Math.round(data.psi).toLocaleString()} PSI`;
    this.thrusterBar.style.width = `${psiPercent}%`;

    if (psiPercent < 25) {
      this.thrusterBar.classList.add('warning');
    } else {
      this.thrusterBar.classList.remove('warning');
    }

    // RCS Status
    if (data.isStabilizing) {
      this.rcsIndicator.className = 'indicator-dot stabilizing';
      this.statusText.textContent = 'RCS STABILIZING';
      this.statusText.style.color = '#ff9900';
    } else if (data.isThrusting) {
      this.rcsIndicator.className = 'indicator-dot active';
      this.statusText.textContent = 'THRUST ACTIVE';
      this.statusText.style.color = '#00d2ff';
    } else {
      this.rcsIndicator.className = 'indicator-dot active';
      this.statusText.textContent = 'RCS READY';
      this.statusText.style.color = '#8b9bb4';
    }
  }

  showStartScreen() {
    this.startScreen.classList.add('active');
    this.gameOverScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.updateStartHighScore();
  }

  hideStartScreen() {
    this.startScreen.classList.remove('active');
  }

  showGameOver(results) {
    this.finalScore.textContent = results.score.toLocaleString();
    this.finalDistance.textContent = `${(results.distance / 1000).toFixed(2)} KM`;
    this.finalCleared.textContent = `${results.cleared} CARS`;
    this.finalMaxCombo.textContent = `x${results.maxCombo}`;

    if (results.reason) {
      this.crashReason.textContent = results.reason;
    }

    // Check for new record
    if (results.score > this.highScore) {
      this.highScore = results.score;
      localStorage.setItem('tesla_roadster_highscore', this.highScore.toString());
      this.newBestBadge.classList.remove('hidden');
    } else {
      this.newBestBadge.classList.add('hidden');
    }

    this.gameOverScreen.classList.add('active');
  }

  hideGameOver() {
    this.gameOverScreen.classList.remove('active');
  }

  showPause() {
    this.pauseScreen.classList.add('active');
  }

  hidePause() {
    this.pauseScreen.classList.remove('active');
  }

  updateSoundButton(enabled) {
    this.soundIcon.textContent = enabled ? '🔊' : '🔇';
  }

  shareResults(score, cleared) {
    const text = `🏎️💨 방금 [테슬라 로드스터: FLIGHT MODE]에서 스페이스X 로켓 스러스터로 교통체증 차량 ${cleared}대를 뛰어넘고 ${score.toLocaleString()}점을 기록했습니다!\n0-60 in 1.1s, Traffic to Orbit! 🚀\n`;
    const url = window.location.href;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }
}

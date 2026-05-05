// ============================================================
//  RETRO SHOOTER
// ============================================================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---- resize ------------------------------------------------
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ---- input -------------------------------------------------
const keys  = {};
const mouse = { x: 0, y: 0, down: false, clicked: false };

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup',   e => { keys[e.key] = false; });
window.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
window.addEventListener('mousedown', e => {
  mouse.down    = true;
  mouse.clicked = true;
  resumeAudio();
});
window.addEventListener('mouseup',   e => { mouse.down = false; });

// ---- audio -------------------------------------------------
let audioCtx = null;
function resumeAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const cfg = {
    shoot:      { wave:'square',   f0:880,  f1:220,  g0:0.25, dur:0.08 },
    enemyHit:   { wave:'sawtooth', f0:440,  f1:110,  g0:0.15, dur:0.10 },
    enemyDie:   { wave:'sawtooth', f0:220,  f1:55,   g0:0.30, dur:0.25 },
    playerHit:  { wave:'square',   f0:150,  f1:60,   g0:0.40, dur:0.30 },
    levelClear: { wave:'sine',     f0:440,  f1:1320, g0:0.35, dur:0.50 },
    gameOver:   { wave:'sawtooth', f0:440,  f1:55,   g0:0.45, dur:1.00 },
    uiClick:    { wave:'sine',     f0:660,  f1:660,  g0:0.15, dur:0.05 },
  }[type];
  if (!cfg) return;

  osc.type = cfg.wave;
  osc.frequency.setValueAtTime(cfg.f0, t);
  osc.frequency.exponentialRampToValueAtTime(cfg.f1, t + cfg.dur);
  gain.gain.setValueAtTime(cfg.g0, t);
  gain.gain.linearRampToValueAtTime(0, t + cfg.dur);
  osc.start(t);
  osc.stop(t + cfg.dur + 0.01);
}

// ---- pixel sprites -----------------------------------------
// Each sprite is a 2D array of color indices. 0 = transparent.
// Rendered at SCALE px per logical pixel.
const SCALE = 3;

function drawSprite(sprite, palette, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const rows = sprite.length;
  const cols = sprite[0].length;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = sprite[r][c];
      if (idx === 0) continue;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(
        (c - cols / 2) * SCALE,
        (r - rows / 2) * SCALE,
        SCALE, SCALE
      );
    }
  }
  ctx.restore();
}

function drawSpriteFlash(sprite, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const rows = sprite.length;
  const cols = sprite[0].length;
  ctx.fillStyle = '#ffffff';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sprite[r][c] === 0) continue;
      ctx.fillRect((c - cols / 2) * SCALE, (r - rows / 2) * SCALE, SCALE, SCALE);
    }
  }
  ctx.restore();
}

// Player sprite frames (12x12, facing right = angle 0)
const P_PAL = ['', '#27ae60', '#2ecc71', '#f39c12', '#1a252f', '#ffffff'];
//                  1=body     2=hi       3=gun      4=dark     5=eye
const PLAYER_A = [
  [0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,1,2,2,2,2,2,1,0,0,0],
  [0,1,2,2,5,2,2,2,2,1,0,0],
  [0,1,2,2,2,2,2,2,2,1,3,3],
  [0,1,2,2,2,2,2,2,2,1,3,3],
  [0,1,2,2,2,2,2,2,2,1,3,3],
  [0,1,2,2,2,2,2,2,2,1,0,0],
  [0,0,1,2,2,2,2,2,1,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,1,4,0,0,1,4,0,0,0,0],
  [0,0,1,4,0,0,1,4,0,0,0,0],
  [0,0,4,0,0,0,4,0,0,0,0,0],
];
const PLAYER_B = [
  [0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,1,2,2,2,2,2,1,0,0,0],
  [0,1,2,2,5,2,2,2,2,1,0,0],
  [0,1,2,2,2,2,2,2,2,1,3,3],
  [0,1,2,2,2,2,2,2,2,1,3,3],
  [0,1,2,2,2,2,2,2,2,1,3,3],
  [0,1,2,2,2,2,2,2,2,1,0,0],
  [0,0,1,2,2,2,2,2,1,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0,0],
  [0,0,4,0,0,0,4,0,0,0,0,0],  // legs swapped
  [0,0,1,4,0,0,1,4,0,0,0,0],
  [0,0,1,4,0,0,1,4,0,0,0,0],
];

// Grunt (8x10)
const G_PAL = ['', '#c0392b', '#e74c3c', '#922b21', '#1a252f'];
const GRUNT_A = [
  [0,0,1,1,1,1,0,0],
  [0,1,2,2,2,2,1,0],
  [0,1,2,4,2,4,1,0],
  [0,1,3,2,2,3,1,0],
  [0,0,1,2,2,1,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,3,0,0,3,1,0],
  [0,1,3,0,0,3,1,0],
  [0,3,0,0,0,0,3,0],
  [0,0,0,0,0,0,0,0],
];
const GRUNT_B = [
  [0,0,1,1,1,1,0,0],
  [0,1,2,2,2,2,1,0],
  [0,1,2,4,2,4,1,0],
  [0,1,3,2,2,3,1,0],
  [0,0,1,2,2,1,0,0],
  [0,0,1,1,1,1,0,0],
  [0,1,3,0,0,3,1,0],
  [0,3,0,0,0,0,3,0],
  [0,1,3,0,0,3,1,0],
  [0,0,0,0,0,0,0,0],
];

// Rusher (8x8) — leaner, meaner
const R_PAL = ['', '#e67e22', '#f39c12', '#d35400', '#1a252f'];
const RUSHER_A = [
  [0,0,1,1,1,0,0,0],
  [0,1,2,2,2,1,0,0],
  [0,1,2,4,2,1,0,0],
  [1,3,2,2,2,3,1,0],
  [0,1,2,2,2,1,0,0],
  [0,0,3,3,3,0,0,0],
  [0,0,3,0,3,0,0,0],
  [0,0,3,0,3,0,0,0],
];
const RUSHER_B = [
  [0,0,1,1,1,0,0,0],
  [0,1,2,2,2,1,0,0],
  [0,1,2,4,2,1,0,0],
  [1,3,2,2,2,3,1,0],
  [0,1,2,2,2,1,0,0],
  [0,0,3,3,3,0,0,0],
  [0,0,3,0,0,3,0,0],
  [0,0,0,0,0,3,0,0],
];

// Tank (12x12) — big boy
const T_PAL = ['', '#6c3483', '#8e44ad', '#512e5f', '#1a252f', '#bb8fce'];
const TANK_A = [
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,1,2,2,2,2,2,2,2,2,1,0],
  [1,2,5,5,2,2,2,2,5,5,2,1],
  [1,2,5,4,2,2,2,2,4,5,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [0,1,2,2,2,2,2,2,2,2,1,0],
  [0,0,1,3,1,0,0,1,3,1,0,0],
  [0,0,1,3,1,0,0,1,3,1,0,0],
  [0,0,3,0,0,0,0,0,0,3,0,0],
];
const TANK_B = [
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,1,2,2,2,2,2,2,2,2,1,0],
  [1,2,5,5,2,2,2,2,5,5,2,1],
  [1,2,5,4,2,2,2,2,4,5,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [0,1,2,2,2,2,2,2,2,2,1,0],
  [0,0,3,0,0,0,0,0,0,3,0,0],
  [0,0,1,3,1,0,0,1,3,1,0,0],
  [0,0,1,3,1,0,0,1,3,1,0,0],
];

// Shooter (10x10) — has a visible gun
const SH_PAL = ['', '#1a5276', '#2980b9', '#1f618d', '#1a252f', '#5dade2'];
const SHOOTER_A = [
  [0,0,1,1,1,1,1,0,0,0],
  [0,1,2,2,2,2,2,1,0,0],
  [0,1,2,4,2,4,2,1,0,0],
  [0,1,3,2,2,2,3,1,1,1],
  [0,1,2,2,2,2,2,1,1,1],
  [0,1,2,2,2,2,2,1,0,0],
  [0,0,1,2,2,2,1,0,0,0],
  [0,0,1,3,0,3,1,0,0,0],
  [0,0,1,3,0,3,1,0,0,0],
  [0,0,3,0,0,0,3,0,0,0],
];
const SHOOTER_B = [
  [0,0,1,1,1,1,1,0,0,0],
  [0,1,2,2,2,2,2,1,0,0],
  [0,1,2,4,2,4,2,1,0,0],
  [0,1,3,2,2,2,3,1,1,1],
  [0,1,2,2,2,2,2,1,1,1],
  [0,1,2,2,2,2,2,1,0,0],
  [0,0,1,2,2,2,1,0,0,0],
  [0,0,3,0,0,0,3,0,0,0],
  [0,0,1,3,0,3,1,0,0,0],
  [0,0,1,3,0,3,1,0,0,0],
];

// ---- sprite data lookup ------------------------------------
const SPRITES = {
  player:  { frames: [PLAYER_A, PLAYER_B], palette: P_PAL, radius: 14 },
  grunt:   { frames: [GRUNT_A,  GRUNT_B],  palette: G_PAL, radius: 11 },
  rusher:  { frames: [RUSHER_A, RUSHER_B], palette: R_PAL, radius: 10 },
  tank:    { frames: [TANK_A,   TANK_B],   palette: T_PAL, radius: 17 },
  shooter: { frames: [SHOOTER_A,SHOOTER_B],palette: SH_PAL,radius: 13 },
};

// ---- level data --------------------------------------------
const LEVELS = [
  {
    name: 'SECTOR 1',
    bg: '#0a0a0f',
    waves: [
      [{ type:'grunt',   count:5 }],
      [{ type:'grunt',   count:8 }],
    ]
  },
  {
    name: 'SECTOR 2',
    bg: '#0a0f0a',
    waves: [
      [{ type:'grunt',   count:6 }, { type:'rusher', count:2 }],
      [{ type:'rusher',  count:5 }],
      [{ type:'grunt',   count:6 }, { type:'rusher', count:3 }],
    ]
  },
  {
    name: 'SECTOR 3',
    bg: '#0f0a0a',
    waves: [
      [{ type:'grunt',   count:6 }, { type:'tank',   count:1 }],
      [{ type:'rusher',  count:4 }, { type:'tank',   count:2 }],
      [{ type:'grunt',   count:8 }, { type:'tank',   count:2 }],
    ]
  },
  {
    name: 'SECTOR 4',
    bg: '#0a0a14',
    waves: [
      [{ type:'grunt',   count:4 }, { type:'shooter', count:3 }],
      [{ type:'rusher',  count:5 }, { type:'shooter', count:3 }],
      [{ type:'tank',    count:2 }, { type:'shooter', count:4 }],
      [{ type:'grunt',   count:6 }, { type:'rusher',  count:4 }, { type:'shooter', count:2 }],
    ]
  },
  {
    name: 'FINAL STAND',
    bg: '#14000a',
    waves: [
      [{ type:'grunt',   count:8 }, { type:'rusher', count:4 }],
      [{ type:'tank',    count:3 }, { type:'shooter', count:4 }],
      [{ type:'rusher',  count:8 }, { type:'grunt',  count:6 }],
      [{ type:'tank',    count:3 }, { type:'rusher', count:6 }, { type:'shooter', count:4 }],
      [{ type:'tank',    count:4 }, { type:'shooter', count:6 }, { type:'rusher', count:6 }, { type:'grunt', count:8 }],
    ]
  },
];

const SCORE_VALUES = { grunt: 100, rusher: 150, tank: 300, shooter: 200 };

// ---- game state --------------------------------------------
let STATE = 'MENU';
let player, enemies, bullets, particles;
let score = 0;
let level = 0;
let currentWave = 0;
let waveEnemiesAlive = 0;
let waveClearTimer = 0;
let levelNameTimer = 0;
let blinkTimer = 0;
let gameOverTimer = 0;
let levelCompleteTimer = 0;
let highScore = parseInt(localStorage.getItem('retroshooter_hs') || '0');
let screenShake = { dur: 0, mag: 0 };
let stars = [];

// ---- star field for menu / background ----------------------
function initStars() {
  stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      spd: Math.random() * 15 + 5,
    });
  }
}
initStars();

// ---- factories ---------------------------------------------
function makePlayer() {
  return {
    x: canvas.width  / 2,
    y: canvas.height / 2,
    vx: 0, vy: 0,
    speed: 170,
    hp: 3, maxHp: 3,
    fireRate: 0.22,
    fireCooldown: 0,
    angle: 0,
    invTimer: 0,
    hitFlash: 0,
    animFrame: 0,
    animTimer: 0,
    moving: false,
  };
}

function makeEnemy(type, x, y) {
  const cfg = {
    grunt:   { hp:2, speed:75,  shootCd:0, radius:SPRITES.grunt.radius,   scoreVal:100 },
    rusher:  { hp:2, speed:80,  shootCd:0, radius:SPRITES.rusher.radius,  scoreVal:150 },
    tank:    { hp:5, speed:40,  shootCd:0, radius:SPRITES.tank.radius,    scoreVal:300 },
    shooter: { hp:3, speed:55,  shootCd:2, radius:SPRITES.shooter.radius, scoreVal:200 },
  }[type];
  return {
    type, x, y, vx:0, vy:0,
    hp: cfg.hp, maxHp: cfg.hp,
    speed: cfg.speed,
    radius: cfg.radius,
    angle: 0,
    state: type === 'rusher' ? 'approach' : 'walk',
    stateTimer: 0,
    shootCd: cfg.shootCd + Math.random() * 1.5,
    animFrame: 0,
    animTimer: 0,
    hitFlash: 0,
    moving: true,
  };
}

function makeBullet(x, y, angle, owner, speed, dmg, color) {
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    owner, damage: dmg,
    life: 2.0,
    color: color || '#ffe066',
    radius: owner === 'player' ? 4 : 3,
  };
}

function makeParticle(x, y, vx, vy, color, size, life, type) {
  return { x, y, vx, vy, color, size, maxSize: size, life, maxLife: life, type: type || 'dot' };
}

// ---- spawning ----------------------------------------------
function spawnEnemyOffscreen() {
  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;
  const angle = Math.random() * Math.PI * 2;
  const R = Math.max(canvas.width, canvas.height) * 0.62 + 60;
  return { x: cx + Math.cos(angle) * R, y: cy + Math.sin(angle) * R };
}

function spawnWave(waveIndex) {
  const waveDef = LEVELS[level].waves[waveIndex];
  waveEnemiesAlive = 0;
  for (const group of waveDef) {
    for (let i = 0; i < group.count; i++) {
      const pos = spawnEnemyOffscreen();
      enemies.push(makeEnemy(group.type, pos.x, pos.y));
      waveEnemiesAlive++;
    }
  }
}

// ---- particle bursts ---------------------------------------
function burstDeath(x, y, type) {
  const cfgs = {
    grunt:   { count:14, colors:['#e74c3c','#c0392b','#922b21'], speed:[80,160], size:[3,6], life:[0.4,0.7] },
    rusher:  { count:10, colors:['#f39c12','#e67e22','#d35400'], speed:[100,200], size:[2,5], life:[0.3,0.5] },
    tank:    { count:22, colors:['#8e44ad','#6c3483','#aaa'],    speed:[60,180], size:[4,8], life:[0.5,0.9] },
    shooter: { count:12, colors:['#2980b9','#1a5276','#aaa'],    speed:[80,150], size:[3,6], life:[0.4,0.7] },
  }[type] || { count:10, colors:['#fff'], speed:[80,150], size:[3,5], life:[0.4,0.6] };

  for (let i = 0; i < cfgs.count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = cfgs.speed[0] + Math.random() * (cfgs.speed[1] - cfgs.speed[0]);
    const col = cfgs.colors[Math.floor(Math.random() * cfgs.colors.length)];
    const sz  = cfgs.size[0]  + Math.random() * (cfgs.size[1]  - cfgs.size[0]);
    const lf  = cfgs.life[0]  + Math.random() * (cfgs.life[1]  - cfgs.life[0]);
    particles.push(makeParticle(x, y, Math.cos(ang)*spd, Math.sin(ang)*spd, col, sz, lf));
  }
}

function burstHit(x, y, color) {
  for (let i = 0; i < 5; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 80;
    particles.push(makeParticle(x, y, Math.cos(ang)*spd, Math.sin(ang)*spd, color, 2, 0.25));
  }
}

function muzzleFlash(x, y) {
  for (let i = 0; i < 6; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 20 + Math.random() * 60;
    particles.push(makeParticle(x, y, Math.cos(ang)*spd, Math.sin(ang)*spd, '#ffffaa', 3 + Math.random()*3, 0.07, 'flash'));
  }
}

// ---- state inits -------------------------------------------
function enterMenu() {
  STATE = 'MENU';
  blinkTimer = 0;
  initStars();
}

function enterPlaying(lvl) {
  level = lvl;
  if (lvl === 0) score = 0;
  player    = makePlayer();
  enemies   = [];
  bullets   = [];
  particles = [];
  currentWave = 0;
  waveClearTimer = 0;
  levelNameTimer = 2.5;
  spawnWave(0);
  STATE = 'PLAYING';
}

function enterLevelComplete() {
  STATE = 'LEVEL_COMPLETE';
  levelCompleteTimer = 0;
  playSound('levelClear');
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('retroshooter_hs', String(highScore));
  }
}

function enterGameOver() {
  STATE = 'GAME_OVER';
  gameOverTimer = 0;
  playSound('gameOver');
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('retroshooter_hs', String(highScore));
  }
  screenShake.dur = 0.6;
  screenShake.mag = 12;
}

// ---- update ------------------------------------------------
function update(dt) {
  blinkTimer += dt;
  updateStars(dt);

  if (STATE === 'PLAYING')        updatePlaying(dt);
  else if (STATE === 'GAME_OVER') { gameOverTimer += dt; }
  else if (STATE === 'LEVEL_COMPLETE') { levelCompleteTimer += dt; }
}

function updateStars(dt) {
  for (const s of stars) {
    s.y += s.spd * dt;
    if (s.y > canvas.height) {
      s.y = -2;
      s.x = Math.random() * canvas.width;
    }
  }
}

function updatePlaying(dt) {
  levelNameTimer = Math.max(0, levelNameTimer - dt);
  updatePlayer(dt);
  updateEnemies(dt);
  updateBullets(dt);
  updateParticles(dt);
  checkCollisions();

  if (screenShake.dur > 0) {
    screenShake.dur -= dt;
    screenShake.mag *= 0.88;
  }

  // Wave progression
  if (waveEnemiesAlive <= 0) {
    waveClearTimer += dt;
    if (waveClearTimer >= 1.8) {
      waveClearTimer = 0;
      currentWave++;
      if (currentWave >= LEVELS[level].waves.length) {
        // Level done
        if (level + 1 >= LEVELS.length) {
          enterLevelComplete(); // actually game won — handled in render
        } else {
          enterLevelComplete();
        }
      } else {
        spawnWave(currentWave);
      }
    }
  }
}

function updatePlayer(dt) {
  const p = player;
  if (p.hp <= 0) return;

  // Movement
  let dx = 0, dy = 0;
  if (keys['ArrowLeft']  || keys['a']) dx -= 1;
  if (keys['ArrowRight'] || keys['d']) dx += 1;
  if (keys['ArrowUp']    || keys['w']) dy -= 1;
  if (keys['ArrowDown']  || keys['s']) dy += 1;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len > 0) { dx /= len; dy /= len; }
  p.moving = len > 0;
  p.x += dx * p.speed * dt;
  p.y += dy * p.speed * dt;

  // Clamp to canvas
  const pad = 20;
  p.x = Math.max(pad, Math.min(canvas.width  - pad, p.x));
  p.y = Math.max(pad, Math.min(canvas.height - pad, p.y));

  // Aim toward mouse
  p.angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);

  // Animation
  if (p.moving) {
    p.animTimer += dt;
    if (p.animTimer >= 0.14) { p.animTimer = 0; p.animFrame = 1 - p.animFrame; }
  } else {
    p.animFrame = 0;
  }

  // Fire
  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  if (mouse.down && p.fireCooldown <= 0) {
    const tipX = p.x + Math.cos(p.angle) * 18;
    const tipY = p.y + Math.sin(p.angle) * 18;
    bullets.push(makeBullet(tipX, tipY, p.angle, 'player', 500, 1, '#ffe066'));
    p.fireCooldown = p.fireRate;
    muzzleFlash(tipX, tipY);
    playSound('shoot');
  }

  // Timers
  if (p.invTimer > 0) p.invTimer -= dt;
  if (p.hitFlash > 0) p.hitFlash -= dt;
}

function updateEnemies(dt) {
  for (const e of enemies) {
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.animTimer += dt;
    if (e.animTimer >= 0.18) { e.animTimer = 0; e.animFrame = 1 - e.animFrame; }

    const pdx = player.x - e.x;
    const pdy = player.y - e.y;
    const dist = Math.sqrt(pdx*pdx + pdy*pdy);
    const pAngle = Math.atan2(pdy, pdx);

    if (e.type === 'grunt') {
      e.vx = Math.cos(pAngle) * e.speed;
      e.vy = Math.sin(pAngle) * e.speed;
      e.angle = pAngle;
    }

    else if (e.type === 'rusher') {
      e.stateTimer += dt;
      if (e.state === 'approach') {
        e.vx = Math.cos(pAngle) * e.speed;
        e.vy = Math.sin(pAngle) * e.speed;
        e.angle = pAngle;
        if (dist < 220) { e.state = 'windup'; e.stateTimer = 0; }
      } else if (e.state === 'windup') {
        e.vx *= 0.7; e.vy *= 0.7;
        if (e.stateTimer > 0.45) {
          e.state = 'charge';
          e.stateTimer = 0;
          e.chargeAngle = pAngle;
        }
      } else if (e.state === 'charge') {
        e.vx = Math.cos(e.chargeAngle) * e.speed * 3.5;
        e.vy = Math.sin(e.chargeAngle) * e.speed * 3.5;
        e.angle = e.chargeAngle;
        if (e.stateTimer > 0.6) { e.state = 'approach'; e.stateTimer = 0; }
      }
    }

    else if (e.type === 'tank') {
      e.vx = Math.cos(pAngle) * e.speed;
      e.vy = Math.sin(pAngle) * e.speed;
      e.angle = pAngle;
    }

    else if (e.type === 'shooter') {
      const idealDist = 260;
      if (dist > idealDist + 30) {
        e.vx = Math.cos(pAngle) * e.speed;
        e.vy = Math.sin(pAngle) * e.speed;
      } else if (dist < idealDist - 30) {
        e.vx = -Math.cos(pAngle) * e.speed;
        e.vy = -Math.sin(pAngle) * e.speed;
      } else {
        e.vx *= 0.85; e.vy *= 0.85;
      }
      e.angle = pAngle;
      e.shootCd -= dt;
      if (e.shootCd <= 0) {
        e.shootCd = 1.8 + Math.random() * 1.2;
        const spread = (Math.random() - 0.5) * 0.25;
        bullets.push(makeBullet(e.x, e.y, pAngle + spread, 'enemy', 280, 1, '#3498db'));
      }
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;
  }
}

function updateBullets(dt) {
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    // Remove if off canvas with margin
    if (b.x < -60 || b.x > canvas.width+60 || b.y < -60 || b.y > canvas.height+60) b.life = 0;
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.90;
    p.vy *= 0.90;
    p.life -= dt;
  }
}

function checkCollisions() {
  const p = player;

  // Player bullets vs enemies
  for (const b of bullets) {
    if (b.owner !== 'player' || b.life <= 0) continue;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const dx = b.x - e.x, dy = b.y - e.y;
      if (dx*dx + dy*dy < (b.radius + e.radius) ** 2) {
        b.life = 0;
        e.hp -= b.damage;
        e.hitFlash = 0.12;
        burstHit(b.x, b.y, '#fff');
        playSound('enemyHit');
        if (e.hp <= 0) {
          score += SCORE_VALUES[e.type] || 100;
          waveEnemiesAlive--;
          burstDeath(e.x, e.y, e.type);
          if (e.type === 'tank') { screenShake.dur = 0.25; screenShake.mag = 7; }
          playSound('enemyDie');
        }
      }
    }
  }

  // Enemy bullets vs player
  if (p.invTimer <= 0 && p.hp > 0) {
    for (const b of bullets) {
      if (b.owner !== 'enemy' || b.life <= 0) continue;
      const dx = b.x - p.x, dy = b.y - p.y;
      if (dx*dx + dy*dy < (b.radius + 12) ** 2) {
        b.life = 0;
        p.hp--;
        p.invTimer = 1.2;
        p.hitFlash = 0.2;
        screenShake.dur = 0.3; screenShake.mag = 8;
        burstHit(p.x, p.y, '#e74c3c');
        playSound('playerHit');
        if (p.hp <= 0) { enterGameOver(); return; }
      }
    }
  }

  // Enemies touching player
  if (p.invTimer <= 0 && p.hp > 0) {
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const dx = e.x - p.x, dy = e.y - p.y;
      const minDist = e.radius + 12;
      if (dx*dx + dy*dy < minDist*minDist) {
        p.hp--;
        p.invTimer = 1.2;
        p.hitFlash = 0.2;
        screenShake.dur = 0.3; screenShake.mag = 10;
        burstHit(p.x, p.y, '#e74c3c');
        playSound('playerHit');
        if (p.hp <= 0) { enterGameOver(); return; }
      }
    }
  }

  // Cleanup dead entities
  bullets   = bullets.filter(b => b.life > 0);
  enemies   = enemies.filter(e => e.hp > 0);
  particles = particles.filter(p => p.life > 0);
}

// ---- render ------------------------------------------------
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  if (screenShake.dur > 0) {
    const sx = (Math.random() - 0.5) * 2 * screenShake.mag;
    const sy = (Math.random() - 0.5) * 2 * screenShake.mag;
    ctx.translate(sx, sy);
  }

  if (STATE === 'MENU')           renderMenu();
  else if (STATE === 'PLAYING')   renderPlaying();
  else if (STATE === 'LEVEL_COMPLETE') renderLevelComplete();
  else if (STATE === 'GAME_OVER') renderGameOver();

  ctx.restore();
}

function renderStars(alpha) {
  ctx.save();
  for (const s of stars) {
    ctx.globalAlpha = alpha * (0.3 + s.r / 2);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function renderMenu() {
  // Background
  ctx.fillStyle = '#07070f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  renderStars(0.7);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  setFont(28);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#27ae60';
  ctx.shadowBlur = 24;
  ctx.fillText('RETRO SHOOTER', cx, cy - 80);
  ctx.shadowBlur = 0;

  setFont(10);
  ctx.fillStyle = '#27ae60';
  ctx.fillText('TOP-DOWN SURVIVAL', cx, cy - 45);

  // Blink
  if (Math.floor(blinkTimer * 2) % 2 === 0) {
    setFont(12);
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 10;
    ctx.fillText('CLICK TO START', cx, cy + 20);
    ctx.shadowBlur = 0;
  }

  setFont(8);
  ctx.fillStyle = '#888';
  ctx.fillText('ARROWS / WASD - MOVE     MOUSE - AIM & SHOOT', cx, cy + 70);

  setFont(8);
  ctx.fillStyle = '#666';
  ctx.fillText('HIGH SCORE: ' + String(highScore).padStart(6, '0'), cx, cy + 105);
}

function renderPlaying() {
  const lvlData = LEVELS[level];

  // Floor
  ctx.fillStyle = lvlData.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  const gSize = 32;
  for (let x = gSize; x < canvas.width;  x += gSize) {
    for (let y = gSize; y < canvas.height; y += gSize) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  renderStars(0.15);

  // Particles (behind everything)
  renderParticles();

  // Bullets
  for (const b of bullets) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, b.life * 4);
    ctx.shadowColor = b.color;
    ctx.shadowBlur  = 8;
    ctx.fillStyle   = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Enemies
  for (const e of enemies) {
    const sd = SPRITES[e.type];
    const frame = sd.frames[e.animFrame];
    // Angle offset: sprite faces right by default
    if (e.hitFlash > 0) {
      drawSpriteFlash(frame, e.x, e.y, e.angle - Math.PI / 2);
    } else {
      drawSprite(frame, sd.palette, e.x, e.y, e.angle - Math.PI / 2);
    }

    // HP bar
    if (e.maxHp > 1) {
      const bw = e.radius * 2 + 4;
      const bh = 4;
      const bx = e.x - bw / 2;
      const by = e.y - e.radius * 1.6 - 8;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = e.hp / e.maxHp > 0.5 ? '#2ecc71' : e.hp / e.maxHp > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(bx, by, bw * (e.hp / e.maxHp), bh);
    }
  }

  // Player
  const p = player;
  const pSpr = SPRITES.player;
  const pFrame = pSpr.frames[p.animFrame];
  if (p.hp > 0) {
    const blink = p.invTimer > 0 && Math.floor(p.invTimer * 10) % 2 === 0;
    if (!blink) {
      if (p.hitFlash > 0) {
        drawSpriteFlash(pFrame, p.x, p.y, p.angle - Math.PI / 2);
      } else {
        // Glow
        ctx.save();
        ctx.shadowColor = '#27ae60';
        ctx.shadowBlur = 14;
        drawSprite(pFrame, pSpr.palette, p.x, p.y, p.angle - Math.PI / 2);
        ctx.restore();
      }
    }
  }

  // HUD
  renderHUD();

  // Level name banner
  if (levelNameTimer > 0) {
    const alpha = Math.min(1, levelNameTimer * 2) * Math.min(1, (levelNameTimer) * 1.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    setFont(22);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 20;
    ctx.fillText(lvlData.name, canvas.width / 2, canvas.height / 2 - 20);
    setFont(10);
    ctx.fillStyle = '#ffe066';
    ctx.shadowBlur = 0;
    ctx.fillText('WAVE ' + (currentWave + 1) + ' / ' + LEVELS[level].waves.length, canvas.width / 2, canvas.height / 2 + 18);
    ctx.restore();
  }

  // Wave indicator (when waiting between waves)
  if (waveEnemiesAlive <= 0 && waveClearTimer > 0 && waveClearTimer < 1.8) {
    const nextWave = currentWave + 1;
    if (nextWave < LEVELS[level].waves.length) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, waveClearTimer * 3);
      setFont(11);
      ctx.fillStyle = '#ffe066';
      ctx.textAlign = 'center';
      ctx.fillText('WAVE CLEAR!  NEXT WAVE IN...', canvas.width / 2, canvas.height / 2);
      ctx.restore();
    }
  }
}

function renderParticles() {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.type === 'flash') {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = p.color;
    const sz = p.size * (p.type === 'flash' ? alpha : 1);
    ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    ctx.restore();
  }
}

function renderHUD() {
  const pad = 14;
  const topY = pad + 10;

  // Score
  setFont(11);
  ctx.fillStyle = '#ffe066';
  ctx.textAlign = 'left';
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 6;
  ctx.fillText('SCORE ' + String(score).padStart(6, '0'), pad, topY);
  ctx.shadowBlur = 0;

  // Level / Wave
  ctx.textAlign = 'center';
  ctx.fillStyle = '#aaa';
  setFont(9);
  ctx.fillText(LEVELS[level].name + '  W' + (currentWave+1) + '/' + LEVELS[level].waves.length, canvas.width / 2, topY);

  // HP hearts
  ctx.textAlign = 'right';
  const heartX = canvas.width - pad;
  for (let i = 0; i < player.maxHp; i++) {
    ctx.fillStyle = i < player.hp ? '#e74c3c' : '#333';
    ctx.shadowColor = i < player.hp ? '#e74c3c' : 'transparent';
    ctx.shadowBlur = i < player.hp ? 8 : 0;
    drawHeart(heartX - i * 22, topY - 6, 8);
  }
  ctx.shadowBlur = 0;
}

function drawHeart(x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y - size * 0.3, x - size, y - size * 0.3, x - size, y + size * 0.3);
  ctx.bezierCurveTo(x - size, y + size * 0.8, x, y + size * 1.3, x, y + size * 1.3);
  ctx.bezierCurveTo(x, y + size * 1.3, x + size, y + size * 0.8, x + size, y + size * 0.3);
  ctx.bezierCurveTo(x + size, y - size * 0.3, x, y - size * 0.3, x, y + size * 0.3);
  ctx.fill();
  ctx.restore();
}

function renderLevelComplete() {
  ctx.fillStyle = '#07070f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  renderStars(0.5);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const isWin = level + 1 >= LEVELS.length;

  ctx.textAlign = 'center';

  if (levelCompleteTimer > 0.3) {
    setFont(22);
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ffe066';
    ctx.shadowBlur = 20;
    ctx.fillText(isWin ? 'YOU WIN!' : 'SECTOR CLEAR', cx, cy - 70);
    ctx.shadowBlur = 0;
  }

  if (levelCompleteTimer > 0.7) {
    setFont(10);
    ctx.fillStyle = '#aaa';
    ctx.fillText(LEVELS[level].name + ' COMPLETE', cx, cy - 30);
    ctx.fillStyle = '#ffe066';
    ctx.fillText('SCORE: ' + String(score).padStart(6, '0'), cx, cy + 5);
    if (score >= highScore) {
      ctx.fillStyle = '#2ecc71';
      ctx.fillText('NEW HIGH SCORE!', cx, cy + 35);
    } else {
      ctx.fillStyle = '#888';
      ctx.fillText('BEST: ' + String(highScore).padStart(6, '0'), cx, cy + 35);
    }
  }

  if (levelCompleteTimer > 1.5 && Math.floor(blinkTimer * 2) % 2 === 0) {
    setFont(11);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fillText(isWin ? 'CLICK TO RETURN TO MENU' : 'CLICK TO CONTINUE', cx, cy + 90);
    ctx.shadowBlur = 0;
  }
}

function renderGameOver() {
  ctx.fillStyle = '#0f0007';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  renderStars(0.3);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.textAlign = 'center';

  if (gameOverTimer > 0.5) {
    setFont(28);
    ctx.fillStyle = '#e74c3c';
    ctx.shadowColor = '#e74c3c';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', cx, cy - 60);
    ctx.shadowBlur = 0;
  }

  if (gameOverTimer > 1.0) {
    setFont(10);
    ctx.fillStyle = '#ffe066';
    ctx.fillText('SCORE: ' + String(score).padStart(6, '0'), cx, cy - 10);
    ctx.fillStyle = score >= highScore ? '#2ecc71' : '#888';
    ctx.fillText((score >= highScore ? 'NEW ' : '') + 'BEST: ' + String(highScore).padStart(6, '0'), cx, cy + 25);
  }

  if (gameOverTimer > 1.8 && Math.floor(blinkTimer * 2) % 2 === 0) {
    setFont(11);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fillText('CLICK TO PLAY AGAIN', cx, cy + 80);
    ctx.shadowBlur = 0;
  }
}

// ---- font helper -------------------------------------------
function setFont(size) {
  ctx.font = `${size}px 'Press Start 2P', monospace`;
}

// ---- click handler -----------------------------------------
canvas.addEventListener('click', () => {
  resumeAudio();
  playSound('uiClick');

  if (STATE === 'MENU') {
    enterPlaying(0);
  } else if (STATE === 'LEVEL_COMPLETE') {
    if (levelCompleteTimer < 1.5) return;
    const isWin = level + 1 >= LEVELS.length;
    if (isWin) {
      enterMenu();
    } else {
      enterPlaying(level + 1);
    }
  } else if (STATE === 'GAME_OVER') {
    if (gameOverTimer < 1.8) return;
    enterMenu();
  }
});

// ---- main loop ---------------------------------------------
let lastTime = 0;
function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

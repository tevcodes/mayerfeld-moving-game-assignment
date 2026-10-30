const game = document.querySelector("[data-game]");
const player = document.querySelector("[data-player]");
const obstacles = document.querySelector("[data-obstacles]");
const scoreEl = document.querySelector("[data-score]");
const finalScoreEl = document.querySelector("[data-final-score]");
const restartBtn = document.querySelector("[data-action='restart']");
const obstacleTemplate = document.querySelector("[data-obstacle-template]");

if (
  !game ||
  !player ||
  !obstacles ||
  !scoreEl ||
  !finalScoreEl ||
  !restartBtn ||
  !obstacleTemplate
) {
  throw new Error(
    "Game elements were not found. Check the data-* hooks in index.html.",
  );
}


const CONFIG = Object.freeze({
  GRAVITY: 2400, 
  JUMP_VELOCITY: 800, 
  JUMP_CUT: 0.5, 
  START_SPEED: 360,
  SPEED_INCREASE: 8,
  MAX_SPEED: 900,
  SPAWN_MIN: 1.0, 
  SPAWN_MAX: 1.9,
  HITBOX_INSET: 4,
  MAX_DELTA: 0.05,
  VARIANTS: ["", "", "obstacle--small", "obstacle--tall"], 
  SOUND: true,
});



const state = {
  playerY: 0,
  velocityY: 0,
  speed: CONFIG.START_SPEED,
  score: 0,
  obstacles: [], 
  spawnTimer: 0,
  running: false,
  paused: false,
  rafId: null,
  lastTime: null,
};

function setState(state) {
  
  game.classList.remove("is-ready", "is-playing", "is-over");
  game.classList.add(`is-${state}`);
}

function currentState() {
  if (game.classList.contains("is-playing")) return "playing";
  if (game.classList.contains("is-over")) return "over";
  return "ready";
}



function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}


function insetRect(rect, inset) {
  return {
    left: rect.left + inset,
    right: rect.right - inset,
    top: rect.top + inset,
    bottom: rect.bottom - inset,
  };
}

function rectsOverlap(a, b) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}


function nextSpawnDelay() {
  const speedFactor = 0.75 + 0.25 * (CONFIG.START_SPEED / state.speed);
  return randomBetween(CONFIG.SPAWN_MIN, CONFIG.SPAWN_MAX) * speedFactor;
}


let audioCtx = null;

function ensureAudio() {
  if (!CONFIG.SOUND || audioCtx) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (AudioCtor) audioCtx = new AudioCtor();
}

function playTone(startFreq, endFreq, duration, type = "square") {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

const sounds = {
  jump: () => playTone(400, 800, 0.12),
  point: () => playTone(900, 1300, 0.08, "triangle"),
  over: () => playTone(300, 80, 0.4, "sawtooth"),
};



function resetState() {
  state.playerY = 0;
  state.velocityY = 0;
  state.speed = CONFIG.START_SPEED;
  state.score = 0;
  state.obstacles = [];
  state.spawnTimer = nextSpawnDelay();
  state.lastTime = null;
  state.paused = false;

  obstacles.replaceChildren();
  player.classList.remove("is-jumping");
  player.style.setProperty("--player-y", 0);
  scoreEl.value = 0;
  finalScoreEl.value = 0;
}

function startGame() {
 
  if (state.rafId !== null) cancelAnimationFrame(state.rafId);
  resetState();
  setState("playing");
  state.running = true;
  state.rafId = requestAnimationFrame(loop);
}

function endGame() {
  setState("over");
  state.running = false;
  cancelAnimationFrame(state.rafId);
  state.rafId = null;
  finalScoreEl.value = state.score;
  sounds.over();
  restartBtn.focus();
}

function loop(timestamp) {
  if (!state.running) return;


  if (state.lastTime === null) state.lastTime = timestamp;
  const dt = Math.min((timestamp - state.lastTime) / 1000, CONFIG.MAX_DELTA);
  state.lastTime = timestamp;

  updatePlayer(dt);
  updateSpawner(dt);
  updateObstacles(dt);
  updateScore();

  if (hasCollided()) {
    endGame();
    return;
  }

  state.rafId = requestAnimationFrame(loop);
}

function jump() {
  if (state.playerY > 0) return; 
  state.velocityY = CONFIG.JUMP_VELOCITY;
  player.classList.add("is-jumping");
  sounds.jump();
}


function cutJump() {
  if (state.velocityY > 0) state.velocityY *= CONFIG.JUMP_CUT;
}

function updatePlayer(dt) {
  if (state.playerY === 0 && state.velocityY === 0) return;

  state.velocityY -= CONFIG.GRAVITY * dt;
  state.playerY += state.velocityY * dt;

  if (state.playerY <= 0) {
    state.playerY = 0;
    state.velocityY = 0;
    player.classList.remove("is-jumping");
  }

  player.style.setProperty("--player-y", state.playerY);
}


function spawnObstacle() {
  const el = obstacleTemplate.content.firstElementChild.cloneNode(true);
  const variant = randomItem(CONFIG.VARIANTS);
  if (variant) el.classList.add(variant);

  el.style.setProperty("--x", 0);
  obstacles.append(el);
  state.obstacles.push({ el, x: 0, passed: false });
}

function updateSpawner(dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnObstacle();
    state.spawnTimer = nextSpawnDelay();
  }
}

function updateObstacles(dt) {
  state.speed = Math.min(
    state.speed + CONFIG.SPEED_INCREASE * dt,
    CONFIG.MAX_SPEED,
  );

  const limit = game.clientWidth;

  state.obstacles = state.obstacles.filter((obstacle) => {
    obstacle.x += state.speed * dt;
    obstacle.el.style.setProperty("--x", obstacle.x);

    const offScreen = obstacle.x > limit + obstacle.el.offsetWidth;
    if (offScreen) obstacle.el.remove();
    return !offScreen;
  });
}



function updateScore() {
  const playerLeft = player.getBoundingClientRect().left;
  let changed = false;

  for (const obstacle of state.obstacles) {
    if (obstacle.passed) continue;
    if (obstacle.el.getBoundingClientRect().right < playerLeft) {
      obstacle.passed = true;
      state.score += 1;
      changed = true;
    }
  }

  if (changed) {
    scoreEl.value = state.score;
    sounds.point();
  }
}

function hasCollided() {
  const playerBox = insetRect(
    player.getBoundingClientRect(),
    CONFIG.HITBOX_INSET,
  );

  return state.obstacles.some(({ el }) =>
    rectsOverlap(
      playerBox,
      insetRect(el.getBoundingClientRect(), CONFIG.HITBOX_INSET),
    ),
  );
}




function handleAction() {
  ensureAudio();
  const current = currentState();
  if (current === "playing") jump();
  else startGame();
}

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;
  event.preventDefault(); 
  if (event.repeat) return; 
  handleAction();
});

document.addEventListener("keyup", (event) => {
  if (event.code === "Space" && state.running) cutJump();
});

game.addEventListener("pointerdown", (event) => {
  if (restartBtn.contains(event.target)) return;
  handleAction();
});

game.addEventListener("pointerup", () => {
  if (state.running) cutJump();
});

document.addEventListener("visibilitychange", () => {
  if (!state.running && !state.paused) return;

  if (document.hidden) {
    state.paused = true;
    state.running = false;
    cancelAnimationFrame(state.rafId);
    state.rafId = null;
  } else if (state.paused) {
    state.paused = false;
    state.running = true;
    state.lastTime = null;
    state.rafId = requestAnimationFrame(loop);
  }
});

restartBtn.addEventListener("click", () => {
  ensureAudio();
  startGame();
});

setState("ready");

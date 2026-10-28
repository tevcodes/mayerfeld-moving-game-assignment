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

//Game State Variables
let gameRunning = false;
let score = 0;
let playerY = 0;
let velocityY = 0;
const gravity = 0.6;
const jumpForce = 12;
let animationFrameId = null;

function setState(state) {
  // state: "ready" | "playing" | "over"
  game.classList.remove("is-ready", "is-playing", "is-over");
  game.classList.add(`is-${state}`);
}

function startGame() {
  setState("playing");
  gameRunning = true;
  score = 0;
  playerY = 0;
  velocityY = 0;
  scoreEl.textContent = score;

  obstacles.innerHTML = "";

  if (animationFrameId) cancelAnimationFrame(animationFrameID);
  gameLoop();
}

function jump() {
  if (playerY === 0 && gameRunning) {
    velocityY = jumpForce;
    player.classList.add("is-jumping");
  }
}

function updatePlayer() {
  if(playerY > 0 || velocity > 0) {
    velocityY -= gravity;
    playerY += velocityY;
  }

  // Prevent falling below the ground
  if (playerY <= 0) {
    playerY = 0;
    velocityY = 0;
    player.classList.remove("is-jumping");
  }

  player.style.setProperty("--player-y", playerY);
}

function spawnObstacle() {
  // TODO: clone obstacleTemplate, append to obstacles, track it
}

function updateObstacles() {
  // TODO: move each one with style.setProperty("--x", value), remove when off-screen
}

function hasCollided() {
  // TODO: compare player.getBoundingClientRect() with each obstacle's
}

function endGame() {
  setState("over");
  // TODO: stop the loop, show the final score in finalScoreEl
}

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") return;
  event.preventDefault(); // stops the page scrolling
  // TODO: start the game if ready, otherwise jump
});

restartBtn.addEventListener("click", startGame);

setState("ready");

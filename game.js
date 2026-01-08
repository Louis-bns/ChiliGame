
const game = document.getElementById("game");
const player = document.getElementById("player");
const bat = document.getElementById("bat");
const startScreen = document.getElementById("startscreen");

let gameStarted = false;

console.log("LEVEL1:", window.LEVEL1);

/* =========================
   LEVEL STATE
   ========================= */
let currentLevel = null;
let wallGrid = null; // 2D boolean [row][col]
let TILE = 32;

/* =========================
   STARTSCREEN → ENTER
   ========================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !gameStarted) {
    gameStarted = true;
    startScreen.classList.add("startscreen-hide");

    // Level 1 laden (aus level1.js)
    loadLevel(window.LEVEL1);
    requestAnimationFrame(update);
  }
});

/* =========================
   STARTPOSITIONEN
   ========================= */
let px = 0, py = 0;
let bx = 0, by = 0;

/* Bewegungsgeschwindigkeit (px pro Frame) */
const SPEED = 4;

/* Eingabestatus Player */
const keys = { left: false, right: false, up: false, down: false };

/* =========================
   INPUT
   ========================= */
document.addEventListener("keydown", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowright":
    case "d": keys.right = true; break;
    case "arrowleft":
    case "a": keys.left = true; break;
    case "arrowup":
    case "w": keys.up = true; break;
    case "arrowdown":
    case "s": keys.down = true; break;
    default: return;
  }
  e.preventDefault();
});

document.addEventListener("keyup", (e) => {
  switch (e.key.toLowerCase()) {
    case "arrowright":
    case "d": keys.right = false; break;
    case "arrowleft":
    case "a": keys.left = false; break;
    case "arrowup":
    case "w": keys.up = false; break;
    case "arrowdown":
    case "s": keys.down = false; break;
    default: return;
  }
  e.preventDefault();
});

/* =========================
   HELPERS (Animation)
   ========================= */
function setWalkClass(dir) {
  player.classList.remove("walk-left", "walk-right", "walk-up", "walk-down");
  if (dir) player.classList.add("walk-" + dir);
}

function setBatWalkClass(dir) {
  bat.classList.remove("walk-left", "walk-right", "walk-up", "walk-down");
  if (dir) bat.classList.add("walk-" + dir);
}

/* =========================
   LEVEL LOADER
   ========================= */
function loadLevel(level) {
  currentLevel = level;
  TILE = level.tileSize;

  // CSS Grid Größe anpassen (Damit werden rows/cols automatisch aus der Map genommen und sind garantiert passend.
 level.rows = level.walls.length;
level.cols = level.walls[0].length;

  // Wandgrid bauen
  wallGrid = level.walls.map((rowStr) => [...rowStr].map((c) => c === "1"));

  // Spawn-Marker "2" suchen
let spawnFound = false;
for (let y = 0; y < level.walls.length; y++) {
  const x = level.walls[y].indexOf("2");
  if (x !== -1) {
    level.spawn = { tx: x, ty: y };
    spawnFound = true;
    break;
  }
}
console.log("spawnFound:", spawnFound, "spawn:", level.spawn);
// Span Punkt unsichtbar
level.walls = level.walls.map(r => r.replaceAll("2", "0"));

  // Spawn: Tile → Pixel (oben links)
  px = level.spawn.tx * TILE + (TILE - player.clientWidth) / 2;
  py = level.spawn.ty * TILE + (TILE - player.clientHeight) / 2;

  // Bat irgendwo hin (kannst du später levelabhängig machen) hab ich <§
  // Gegner-Setup (levelabhängig)
if (level.enemies?.bat) {
  bat.style.display = "block";

  bx = (game.clientWidth - bat.clientWidth) / 3;
  by = (game.clientHeight - bat.clientHeight) / 3;

  bat.style.transform = `translate(${bx}px, ${by}px)`;
} else {
  bat.style.display = "none";
}


  player.style.transform = `translate(${px}px, ${py}px)`;
if (level.enemies?.bat) {
  bat.style.transform = `translate(${bx}px, ${by}px)`;
}

  // Optional: Wände sichtbar machen (Debug)
  renderWallsDebug(level);
}

/* =========================
   WALL RENDER (Debug)
   ========================= */
function renderWallsDebug(level) {
  // Erzeuge/aktualisiere eine Tile-Ebene hinter Player/Bat
  let tiles = document.getElementById("tiles");
  if (!tiles) {
    tiles = document.createElement("div");
    tiles.id = "tiles";
    game.insertBefore(tiles, player);
  }

  tiles.style.display = "grid";
  tiles.style.gridTemplateColumns = `repeat(${level.cols}, ${TILE}px)`;
  tiles.style.gridTemplateRows = `repeat(${level.rows}, ${TILE}px)`;
  tiles.style.position = "absolute";
  tiles.style.inset = "0";
  tiles.style.zIndex = "1";

  tiles.innerHTML = "";
  for (let y = 0; y < level.rows; y++) {
    for (let x = 0; x < level.cols; x++) {
      const cell = document.createElement("div");
      cell.className = wallGrid[y][x] ? "tile wall" : "tile";
      tiles.appendChild(cell);
    }
  }

  // Player/Bat nach vorne
  player.style.zIndex = "10";
  bat.style.zIndex = "10";
}

/* =========================
   COLLISION
   ========================= */
function isWallTile(tx, ty) {
  if (!currentLevel) return false;
  if (tx < 0 || ty < 0 || tx >= currentLevel.cols || ty >= currentLevel.rows) return true; // außerhalb = Wand
  return wallGrid?.[ty]?.[tx] === true;
}

function rectIntersectsWall(x, y, w, h) {
  // welche Tiles überlappt das Rechteck?
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + w - 1) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + h - 1) / TILE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (isWallTile(tx, ty)) return true;
    }
  }
  return false;
}

/* =========================
   GAME LOOP
   ========================= */
function update() {
  console.log("update läuft");
  if (!gameStarted || !currentLevel) return;

  let vx = 0, vy = 0;
  if (keys.right) vx += SPEED;
  if (keys.left)  vx -= SPEED;
  if (keys.down)  vy += SPEED;
  if (keys.up)    vy -= SPEED;

  // Bewegung + Kollision: erst X, dann Y
  // kleinere Hitbox für Kollision (Sprite bleibt groß)
const hitW = 40;
const hitH = 60;
const hitOX = (player.clientWidth  - hitW) / 2;
const hitOY = (player.clientHeight - hitH) / 2;

function canMoveTo(nx, ny) {
  return !rectIntersectsWall(
    nx + hitOX,
    ny + hitOY,
    hitW,
    hitH
  );
}

// Bewegung + Kollision: erst X, dann Y
if (vx !== 0) {
  const nextX = px + vx;
  if (canMoveTo(nextX, py)) px = nextX;
}

if (vy !== 0) {
  const nextY = py + vy;
  if (canMoveTo(px, nextY)) py = nextY;
}

  // Animation
  if (vx > 0)      setWalkClass("right");
  else if (vx < 0) setWalkClass("left");
  else if (vy < 0) setWalkClass("up");
  else if (vy > 0) setWalkClass("down");
  else             setWalkClass(null);

  player.style.transform = `translate(${px}px, ${py}px)`;

  // Bat nur wenn im Level aktiv
  if (currentLevel.enemies?.bat) {
    updateBatInfinity();
  }

  // ✅ GANZ WICHTIG: Loop weiterlaufen lassen
  requestAnimationFrame(update);
}

/* =========================
   BAT – ∞ BEWEGUNG (wie bei dir)
   ========================= */
function updateBatInfinity() {
  const a = (game.clientWidth - bat.clientWidth) / 2;
  const b = (game.clientHeight - bat.clientHeight) / 2;
  const cx = game.clientWidth / 2 - bat.clientWidth / 2;
  const cy = game.clientHeight / 2 - bat.clientHeight / 2;

  // t als globale Zeit
  if (typeof updateBatInfinity.t === "undefined") updateBatInfinity.t = 0;
  let t = updateBatInfinity.t;

  const sinT = Math.sin(t);
  const cosT = Math.cos(t);
  const denom = 20 + sinT * sinT;

  const x = cx + a * cosT / denom;
  const y = cy + b * cosT * sinT / denom;

  const dx = x - bx;
  const dy = y - by;

  if (Math.abs(dx) > Math.abs(dy)) setBatWalkClass(dx > 0 ? "right" : "left");
  else setBatWalkClass(dy > 0 ? "down" : "up");

  bx = x;
  by = y;
  bat.style.transform = `translate(${bx}px, ${by}px)`;

  updateBatInfinity.t = t + 0.01;
}
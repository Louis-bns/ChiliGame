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
   TRIGGER MESSAGE (HUD)
   ========================= */
function ensureMessageBox() {
  let el = document.getElementById("level-message");
  if (!el) {
    el = document.createElement("div");
    el.id = "level-message";

    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.top = "50%";
    el.style.transform = "translate(-50%, -50%)";

    el.style.padding = "28px 36px";
    el.style.borderRadius = "16px";
    el.style.background = "rgba(0, 0, 0, 0.85)";
    el.style.color = "#fff";
    el.style.fontFamily = "system-ui, Arial, sans-serif";
    el.style.fontSize = "32px";
    el.style.fontWeight = "600";
    el.style.lineHeight = "1.3";
    el.style.textAlign = "center";

    el.style.maxWidth = "70vw";
    el.style.boxShadow = "0 10px 40px rgba(0,0,0,0.6)";
    el.style.zIndex = "99999";
    el.style.display = "none";
    el.style.pointerEvents = "none";

    document.body.appendChild(el);
  }
  return el;
}

function showTempMessage(text, ms = 2000) {
  const el = ensureMessageBox();
  el.textContent = text;
  el.style.display = "block";
  clearTimeout(showTempMessage._t);
  showTempMessage._t = setTimeout(() => {
    el.style.display = "none";
  }, ms);
}

/* =========================
   SPAWN ARROWS (assets/arrows.png)
   ========================= */
function showSpawnArrows() {
  const old = document.getElementById("spawn-arrows");
  if (old) old.remove();

  const img = document.createElement("img");
  img.id = "spawn-arrows";
  img.src = "assets/arrows.png";
  img.alt = "arrows";

  img.style.position = "absolute";
  img.style.pointerEvents = "none";
  img.style.zIndex = "30";

  const size = 56 * 3;
  img.style.width = size + "px";
  img.style.height = size + "px";

  game.appendChild(img);

  const duration = 5000;
  const start = performance.now();

  if (typeof showSpawnArrows._raf !== "undefined") {
    cancelAnimationFrame(showSpawnArrows._raf);
  }

  function tick(now) {
    const left = px + player.clientWidth / 2 - size / 2;
    const top = py - size - 40;

    img.style.left = left + "px";
    img.style.top = top + "px";

    if (now - start < duration) {
      showSpawnArrows._raf = requestAnimationFrame(tick);
    } else {
      img.remove();
    }
  }

  showSpawnArrows._raf = requestAnimationFrame(tick);
}

/* =========================
   STARTSCREEN → ENTER
   ========================= */
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !gameStarted) {
    gameStarted = true;
    startScreen.classList.add("startscreen-hide");

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
  const k = e.key.toLowerCase();

  // SPACE → Interaktion (nur wenn Game läuft)
  if ((k === " " || e.code === "Space") && gameStarted) {
    e.preventDefault();
    handleInteract();
    return;
  }

  switch (k) {
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
   TILE HELPERS
   ========================= */
function getTileAt(level, tx, ty) {
  if (!level) return "1";
  if (typeof level.getTile === "function") return level.getTile(tx, ty);

  // fallback (falls du mal ein Level ohne getTile hast)
  if (tx < 0 || ty < 0 || tx >= level.cols || ty >= level.rows) return "1";
  const row = level.walls[ty];
  if (!row) return "1";
  return row[tx] ?? "1";
}

function getPlayerTilePos() {
  const playerCenterX = px + player.clientWidth / 2;
  const playerCenterY = py + player.clientHeight / 2;
  const tx = Math.floor(playerCenterX / TILE);
  const ty = Math.floor(playerCenterY / TILE);
  return { tx, ty };
}

/* =========================
   INTERACTION SYSTEM (SPACE)
   ========================= */
function handleInteract() {
  if (!currentLevel) return;

  const { tx, ty } = getPlayerTilePos();
  const tile = getTileAt(currentLevel, tx, ty);

  // 0 → nichts
  if (tile === "0") return;

  // pro Level: interactions["5"] = (ctx) => ...
  const map = currentLevel.interactions || {};
  const fn = map[tile];

  if (typeof fn === "function") {
    fn({
      level: currentLevel,
      tile,
      tx,
      ty,
      showTempMessage,
      // optional: falls du später NPCs etc. brauchst
      playerEl: player,
      gameEl: game
    });
    return;
  }

  // optionaler Fallback: Level kann auch onInteract haben
  if (typeof currentLevel.onInteract === "function") {
    currentLevel.onInteract({
      level: currentLevel,
      tile,
      tx,
      ty,
      showTempMessage,
      playerEl: player,
      gameEl: game
    });
  }
}

/* =========================
   LEVEL LOADER
   ========================= */
function loadLevel(level) {
  currentLevel = level;
  TILE = level.tileSize;

  // rows/cols sauber aus der Map ziehen
  level.rows = level.walls.length;
  level.cols = level.walls[0].length;

  // Wandgrid bauen: NUR "1" ist Wand
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

  // Spawn Punkt nur optisch entfernen (2 -> 0), Kollision bleibt via wallGrid
  level.walls = level.walls.map(r => r.replaceAll("2", "0"));

    // ✅ Tile-8 Sprites (animiert) aus dem Grid erzeugen
  renderTile8Sprites(level);

  // Spawn: Tile → Pixel (oben links)
  px = level.spawn.tx * TILE + (TILE - player.clientWidth) / 2;
  py = level.spawn.ty * TILE + (TILE - player.clientHeight) / 2;

  // Gegner-Setup
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

  showSpawnArrows();

  // Debug-Wände (optional)
  if (level.debugWalls === true) {
    renderWallsDebug(level);
  } else {
    const tiles = document.getElementById("tiles");
    if (tiles) tiles.innerHTML = "";
  }

  /* =========================
   TILE 8 – Granny
   ========================= */
function renderTile8Sprites(level) {
  // Layer holen/erzeugen
  let decor = document.getElementById("decor");
  if (!decor) {
    decor = document.createElement("div");
    decor.id = "decor";
    game.insertBefore(decor, player); // hinter player, vor background
  }

  // alten Inhalt entfernen
  decor.innerHTML = "";

  // alle 8er im Grid finden und als Sprite setzen
  for (let ty = 0; ty < level.rows; ty++) {
    const row = level.walls[ty];
    for (let tx = 0; tx < level.cols; tx++) {
      if (row[tx] === "8") {
        const el = document.createElement("div");
        el.className = "tile8-anim";
        el.style.left = (tx * TILE) + "px";
        el.style.top  = (ty * TILE) + "px";
        decor.appendChild(el);
      }
    }
  }
}





  // Trigger direkt am Spawn prüfen (Level-eigene Trigger, wenn vorhanden)
  const { tx: spawnTx, ty: spawnTy } = getPlayerTilePos();
  if (typeof currentLevel.checkTriggers === "function") {
    currentLevel.checkTriggers(spawnTx, spawnTy);
  }

  // Tile-Tracking initialisieren
  update._lastTx = spawnTx;
  update._lastTy = spawnTy;
}

/* =========================
   WALL RENDER (Debug)
   ========================= */
function renderWallsDebug(level) {
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
      cell.className = "tile";
      if (level.debugWalls === true && wallGrid[y][x]) {
        cell.className = "tile wall";
      }
      tiles.appendChild(cell);
    }
  }

  player.style.zIndex = "10";
  bat.style.zIndex = "10";
}

/* =========================
   COLLISION
   ========================= */
function isWallTile(tx, ty) {
  if (!currentLevel) return false;

  // out of bounds = solid
  if (tx < 0 || ty < 0 || tx >= currentLevel.cols || ty >= currentLevel.rows) return true;

  // Wenn Level eigene Solid-Logik hat (z.B. "6" dynamisch), nutze die
  if (typeof currentLevel.isSolid === "function") {
    return currentLevel.isSolid(tx, ty) === true;
  }

  // Fallback: altes wallGrid (nur "1")
  return wallGrid?.[ty]?.[tx] === true;
}

function rectIntersectsWall(x, y, w, h) {
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
  if (!gameStarted || !currentLevel) return;

  let vx = 0, vy = 0;
  if (keys.right) vx += SPEED;
  if (keys.left)  vx -= SPEED;
  if (keys.down)  vy += SPEED;
  if (keys.up)    vy -= SPEED;

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

  if (vx !== 0) {
    const nextX = px + vx;
    if (canMoveTo(nextX, py)) px = nextX;
  }

  if (vy !== 0) {
    const nextY = py + vy;
    if (canMoveTo(px, nextY)) py = nextY;
  }

  if (vx > 0)      setWalkClass("right");
  else if (vx < 0) setWalkClass("left");
  else if (vy < 0) setWalkClass("up");
  else if (vy > 0) setWalkClass("down");
  else             setWalkClass(null);

  player.style.transform = `translate(${px}px, ${py}px)`;

  // Tile-Change → Trigger check
  const { tx: ptx, ty: pty } = getPlayerTilePos();
  if (update._lastTx !== ptx || update._lastTy !== pty) {
    update._lastTx = ptx;
    update._lastTy = pty;

    if (typeof currentLevel.checkTriggers === "function") {
      currentLevel.checkTriggers(ptx, pty);
    }
  }

  if (currentLevel.enemies?.bat) {
    updateBatInfinity();
  }

  requestAnimationFrame(update);
}

/* =========================
   BAT – ∞ BEWEGUNG
   ========================= */
function updateBatInfinity() {
  const a = (game.clientWidth - bat.clientWidth) / 2;
  const b = (game.clientHeight - bat.clientHeight) / 2;
  const cx = game.clientWidth / 2 - bat.clientWidth / 2;
  const cy = game.clientHeight / 2 - bat.clientHeight / 2;

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

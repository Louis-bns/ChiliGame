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
  const container = document.getElementById("game");
  let wrap = document.getElementById("msgWrap");
  if (wrap) return wrap._textEl; // Text-Element zurückgeben
 
  // Wrapper (Positionierung übernimmt showTempMessage)
  wrap = document.createElement("div");
  wrap.id = "msgWrap";
  wrap.style.position = "absolute";
  wrap.style.zIndex = "9999";
  wrap.style.pointerEvents = "none";
 
  // Blase
  const bubble = document.createElement("div");
  bubble.style.position = "relative";
  bubble.style.background = "#fff";
  bubble.style.color = "#111";
 
  // Pixel-Rahmen + Pixel-Shadow
  bubble.style.border = "4px solid #111";
  bubble.style.boxShadow = "6px 6px 0 #000";
  bubble.style.borderRadius = "0";
 
  // Pixel-Schrift
  bubble.style.fontFamily = '"Press Start 2P", monospace';
  bubble.style.fontSize = "32px";
  bubble.style.lineHeight = "1.6";
 
  // Umbrüche: max Breite -> bricht automatisch nach Wörtern um
  bubble.style.maxWidth = "600px";  // <- Umbrüche passieren durch Breite
  bubble.style.padding = "14px 16px";
  bubble.style.whiteSpace = "pre-wrap";
  bubble.style.wordBreak = "normal";
  bubble.style.overflowWrap = "break-word";
 
  // Textnode (damit wir Tail separat halten können)
  const textEl = document.createElement("div");
  bubble.appendChild(textEl);
 
  // Tail (Sprechblasen-"Zipfel") als 2 Layer (Rand + Innen)
  const tailBorder = document.createElement("div");
  tailBorder.style.position = "absolute";
  tailBorder.style.left = "28px";
  tailBorder.style.top = "100%";
  tailBorder.style.width = "0";
  tailBorder.style.height = "0";
  tailBorder.style.borderLeft = "14px solid transparent";
  tailBorder.style.borderRight = "14px solid transparent";
  tailBorder.style.borderTop = "18px solid #111";
 
  const tailInner = document.createElement("div");
  tailInner.style.position = "absolute";
  tailInner.style.left = "32px";
  tailInner.style.top = "100%";
  tailInner.style.width = "0";
  tailInner.style.height = "0";
  tailInner.style.borderLeft = "10px solid transparent";
  tailInner.style.borderRight = "10px solid transparent";
  tailInner.style.borderTop = "14px solid #fff";
 
  bubble.appendChild(tailBorder);
  bubble.appendChild(tailInner);
 
  wrap.appendChild(bubble);
  container.appendChild(wrap);
 
  // Trick: wir geben das Text-Element zurück, aber behalten Zugriff auf wrap
  textEl._wrap = wrap;
  wrap._textEl = textEl;
 
  // Default unsichtbar
  wrap.style.display = "none";
 
  return textEl;
}
 
 
function showTempMessage(text, ms = 2000, opts = {}) {
  const el = ensureMessageBox();
  const wrap = el._wrap;
 
  const {
    typewriter = false,
    charDelay = 30,
    x = "50%",
    y = "50%",
    center = true
  } = opts;
 
  // Positionierung
  wrap.style.position = "absolute";
  wrap.style.right = "auto";
  wrap.style.bottom = "auto";
  wrap.style.left = typeof x === "number" ? `${x}px` : x;
  wrap.style.top  = typeof y === "number" ? `${y}px` : y;
  wrap.style.transform = center ? "translate(-50%, -50%)" : "none";
 
  wrap.style.display = "block";
 
  // alte Timer stoppen
  clearTimeout(showTempMessage._hideTimer);
  if (showTempMessage._typeTimer) {
    clearInterval(showTempMessage._typeTimer);
    showTempMessage._typeTimer = null;
  }
 
  // 🔹 SOFORT anzeigen (ohne Typewriter)
  if (!typewriter) {
    el.textContent = text;
    showTempMessage._hideTimer = setTimeout(() => {
      wrap.style.display = "none"; // ✅ wrap, nicht el
    }, ms);
    return;
  }
 
  // 🔹 TYPEWRITER (integriert)
  el.textContent = "";
  let i = 0;
 
  showTempMessage._typeTimer = setInterval(() => {
    el.textContent += text[i++] ?? "";
    if (i >= text.length) {
      clearInterval(showTempMessage._typeTimer);
      showTempMessage._typeTimer = null;
 
      showTempMessage._hideTimer = setTimeout(() => {
        wrap.style.display = "none"; // ✅ wrap, nicht el
      }, ms);
    }
  }, Math.max(0, charDelay));
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
  // alte Layer löschen
  const decor = document.getElementById("decor");
  if (decor) decor.innerHTML = "";
  const tiles = document.getElementById("tiles");
  if (tiles) tiles.innerHTML = "";

  // ✅ Level klonen
  currentLevel = {
    ...level,
    walls: level.walls.map(r => ("" + r)),
    flags: level.flags ? structuredClone(level.flags) : undefined,
    _spentTriggers: level._spentTriggers ? new Set() : undefined
  };
  level = currentLevel;

  TILE = level.tileSize;

  // ✅ HIER Hintergrund setzen (nach dem Clone!)
  if (level.background) {
    game.style.backgroundImage = `url('${level.background}')`;
  } else {
    game.style.backgroundImage = "none";
  }


  TILE = level.tileSize;

  // rows/cols sauber aus der Map ziehen
  level.rows = level.walls.length;
  level.cols = level.walls[0].length;

  // Wandgrid bauen: NUR "1" ist Wand
  wallGrid = level.walls.map((rowStr) => [...rowStr].map((c) => c === "1"));

  // ✅ Spawn-Char: Standard "2", Level2 nutzt z.B. "Z"
  const spawnChar = level.spawnChar || "2";

  // Spawn-Marker suchen
  let spawnFound = false;
  for (let y = 0; y < level.walls.length; y++) {
    const x = level.walls[y].indexOf(spawnChar);
    if (x !== -1) {
      level.spawn = { tx: x, ty: y };
      spawnFound = true;
      break;
    }
  }

  // Spawnmarker optisch entfernen (spawnChar -> 0)
  level.walls = level.walls.map(r => r.split(spawnChar).join("0"));

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

  const tileHere = getTileAt(currentLevel, ptx, pty);
  if (tileHere === "Z" && window.LEVEL2 && currentLevel !== window.LEVEL2) {
    loadLevel(window.LEVEL2);
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

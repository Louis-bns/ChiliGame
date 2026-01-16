const game = document.getElementById("game");
const player = document.getElementById("player");
const startScreen = document.getElementById("startscreen");

const batTpl = document.getElementById("batTpl");
const wolfTpl = document.getElementById("wolfTpl");

let gameStarted = false;

/* =========================
   LEVEL STATE
   ========================= */
let currentLevel = null;
let wallGrid = null;
let TILE = 32;

/* =========================
   SETTINGS
   ========================= */
const SPEED = 4;

// Player Hitbox
const PLAYER_HIT = { w: 40, h: 60 };

// Default scales (kannst du pro Level überschreiben)
const DEFAULT_SCALES = { wolf: 4, bat: 1 };

// Enemy Hitboxen (fair; ggf. anpassen)
// Hitboxen in "Sprite-Pixeln" (unskaliert), werden in getEnemyHitRect mit scale multipliziert
const BAT_HIT_BASE  = { w: 70, h: 70, ox: 13, oy: 28 }; // Bat: Element 96x128
const WOLF_HIT_BASE = { w: 56, h: 56, ox: 4,  oy: 4  }; // Wolf: Element 64x64


// Spawn Schutz
let SAFE_UNTIL = 0;

/* =========================
   STATE
   ========================= */
let px = 0, py = 0;
const keys = { left: false, right: false, up: false, down: false };
const enemies = []; // {type, el, x,y, homeX,homeY, t, cfg, dir, startX, maxX}

/* =========================
   SPEECH BUBBLE (HUD)
   ========================= */
function ensureMessageBox() {
  const container = document.getElementById("game");
  let wrap = document.getElementById("msgWrap");
  if (wrap) return wrap._textEl;

  wrap = document.createElement("div");
  wrap.id = "msgWrap";
  wrap.style.position = "absolute";
  wrap.style.zIndex = "9999";
  wrap.style.pointerEvents = "none";

  const bubble = document.createElement("div");
  bubble.style.position = "relative";
  bubble.style.background = "#fff";
  bubble.style.color = "#111";
  bubble.style.border = "4px solid #111";
  bubble.style.boxShadow = "6px 6px 0 #000";
  bubble.style.borderRadius = "0";
  bubble.style.fontFamily = '"Press Start 2P", monospace';
  bubble.style.fontSize = "32px";
  bubble.style.lineHeight = "1.6";
  bubble.style.maxWidth = "600px";
  bubble.style.padding = "14px 16px";
  bubble.style.whiteSpace = "pre-wrap";
  bubble.style.wordBreak = "normal";
  bubble.style.overflowWrap = "break-word";

  const textEl = document.createElement("div");
  bubble.appendChild(textEl);

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

  textEl._wrap = wrap;
  wrap._textEl = textEl;
  wrap.style.display = "none";

  return textEl;
}

function showTempMessage(text, ms = 2000, opts = {}) {
  const el = ensureMessageBox();
  const wrap = el._wrap;

  const { typewriter = false, charDelay = 30, x = "50%", y = "50%", center = true } = opts;

  wrap.style.position = "absolute";
  wrap.style.left = typeof x === "number" ? `${x}px` : x;
  wrap.style.top  = typeof y === "number" ? `${y}px` : y;
  wrap.style.transform = center ? "translate(-50%, -50%)" : "none";
  wrap.style.display = "block";

  clearTimeout(showTempMessage._hideTimer);
  if (showTempMessage._typeTimer) {
    clearInterval(showTempMessage._typeTimer);
    showTempMessage._typeTimer = null;
  }

  if (!typewriter) {
    el.textContent = text;
    showTempMessage._hideTimer = setTimeout(() => (wrap.style.display = "none"), ms);
    return;
  }

  el.textContent = "";
  let i = 0;
  showTempMessage._typeTimer = setInterval(() => {
    el.textContent += text[i++] ?? "";
    if (i >= text.length) {
      clearInterval(showTempMessage._typeTimer);
      showTempMessage._typeTimer = null;
      showTempMessage._hideTimer = setTimeout(() => (wrap.style.display = "none"), ms);
    }
  }, Math.max(0, charDelay));
}

/* =========================
   UTILS
   ========================= */
function restartGame() {
  if (restartGame._done) return;
  restartGame._done = true;
  window.location.reload();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getPlayerHitRect() {
  const hitOX = (player.clientWidth - PLAYER_HIT.w) / 2;
  const hitOY = (player.clientHeight - PLAYER_HIT.h) / 2;
  return { x: px + hitOX, y: py + hitOY, w: PLAYER_HIT.w, h: PLAYER_HIT.h };
}

function getEnemyHitRect(e) {
  const hb = (e.type === "wolf") ? WOLF_HIT_BASE : BAT_HIT_BASE;
  const s = e.cfg.scale;

  return {
    x: e.x + hb.ox * s,
    y: e.y + hb.oy * s,
    w: hb.w * s,
    h: hb.h * s
  };
}


function setWalkClass(el, dir) {
  el.classList.remove("walk-left", "walk-right", "walk-up", "walk-down");
  if (dir) el.classList.add("walk-" + dir);
}

/* =========================
   INPUT
   ========================= */
document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();

  if (e.key === "Enter" && !gameStarted) {
    gameStarted = true;
    startScreen.classList.add("startscreen-hide");
    loadLevel(window.LEVEL1);
    requestAnimationFrame(update);
    return;
  }

  // SPACE interact
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
   TILE HELPERS + INTERACT
   ========================= */
function getTileAt(level, tx, ty) {
  if (!level) return "1";
  if (typeof level.getTile === "function") return level.getTile(tx, ty);

  if (tx < 0 || ty < 0 || tx >= level.cols || ty >= level.rows) return "1";
  const row = level.walls[ty];
  if (!row) return "1";
  return row[tx] ?? "1";
}

function getPlayerTilePos() {
  const cx = px + player.clientWidth / 2;
  const cy = py + player.clientHeight / 2;
  return { tx: Math.floor(cx / TILE), ty: Math.floor(cy / TILE) };
}

function handleInteract() {
  if (!currentLevel) return;

  const { tx, ty } = getPlayerTilePos();
  const tile = getTileAt(currentLevel, tx, ty);

  if (tile === "0") return;

  const map = currentLevel.interactions || {};
  const fn = map[tile];

  if (typeof fn === "function") {
    fn({ level: currentLevel, tile, tx, ty, showTempMessage, playerEl: player, gameEl: game });
    return;
  }

  if (typeof currentLevel.onInteract === "function") {
    currentLevel.onInteract({ level: currentLevel, tile, tx, ty, showTempMessage, playerEl: player, gameEl: game });
  }
}

/* =========================
   WALL COLLISION
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
function isWallTile(tx, ty) {
  if (!currentLevel) return false;
  if (tx < 0 || ty < 0 || tx >= currentLevel.cols || ty >= currentLevel.rows) return true;

  if (typeof currentLevel.isSolid === "function") return currentLevel.isSolid(tx, ty) === true;
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
   PER-LEVEL ENEMY CONFIG
   ========================= */
function getEnemyCfg(level, type) {
  const cfg = level?.enemyConfig?.[type] || {};
  return {
    // mode: "infinity" | "patrolX"
    mode: cfg.mode || (type === "wolf" ? "patrolX" : "infinity"),

    scale: typeof cfg.scale === "number" ? cfg.scale : DEFAULT_SCALES[type],

    // infinity
    a: typeof cfg.a === "number" ? cfg.a : (type === "wolf" ? 180 : 140),
    b: typeof cfg.b === "number" ? cfg.b : (type === "wolf" ? 140 : 90),
    curveSpeed: typeof cfg.curveSpeed === "number"
      ? cfg.curveSpeed
      : (typeof cfg.speed === "number" ? cfg.speed : (type === "wolf" ? 0.015 : 0.02)),

    // patrolX
    distance: typeof cfg.distance === "number" ? cfg.distance : 8, // tiles
    patrolSpeed: typeof cfg.patrolSpeed === "number"
      ? cfg.patrolSpeed
      : (typeof cfg.speed === "number" ? cfg.speed : 1.2), // px/frame
  };
}

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
/* =========================
   ENEMIES (MULTI)
   ========================= */
function clearEnemies() {
  for (const e of enemies) e.el.remove();
  enemies.length = 0;
}

function findAllMarkers(level, marker) {
  const out = [];
  for (let y = 0; y < level.walls.length; y++) {
    const row = level.walls[y];
    for (let x = 0; x < row.length; x++) {
      if (row[x] === marker) out.push({ tx: x, ty: y });
    }
  }
  return out;
}

function applyEnemyTransform(e) {
  const s = e.cfg.scale;
  const isWolf = e.type === "wolf";
  const flip = (isWolf && e.dir === -1) ? -1 : 1;

  const w = e.el.clientWidth; // unskaliert (z.B. Wolf 64)
  const xFix = (flip === -1) ? (w * s) : 0;

  e.el.style.transformOrigin = "top left";
  e.el.style.transform = `translate(${e.x + xFix}px, ${e.y}px) scale(${flip * s}, ${s})`;
}



function spawnEnemy(type, tx, ty) {
  const tpl = type === "wolf" ? wolfTpl : batTpl;
  const el = tpl.cloneNode(false);
  el.id = "";
  el.style.display = "block";
  game.appendChild(el);

  const x = tx * TILE + (TILE - el.clientWidth) / 2;
  const y = ty * TILE + (TILE - el.clientHeight) / 2;

  const e = {
    type,
    el,
    x,
    y,
    homeX: x,
    homeY: y,
    t: Math.random() * Math.PI * 2,
    dir: 1,       // 1 rechts, -1 links (für patrol + spiegel)
    startX: x,     // patrol start
    maxX: x,       // patrol end
    cfg: getEnemyCfg(currentLevel, type),
  };

  e.startX = e.homeX;
  e.maxX = e.homeX + e.cfg.distance * TILE;

  enemies.push(e);
  applyEnemyTransform(e);
}

function updateEnemyInfinity(e) {
  const { a, b, curveSpeed } = e.cfg;

  const sinT = Math.sin(e.t);
  const cosT = Math.cos(e.t);
  const denom = 20 + sinT * sinT;

  const nx = e.homeX + a * cosT / denom;
  const ny = e.homeY + b * cosT * sinT / denom;

  const dx = nx - e.x;
  const dy = ny - e.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    e.dir = dx > 0 ? 1 : -1; // für spiegeln beim Wolf
    setWalkClass(e.el, dx > 0 ? "right" : "left");
  } else {
    setWalkClass(e.el, dy > 0 ? "down" : "up");
  }

  e.x = nx;
  e.y = ny;
  e.t += curveSpeed;

  applyEnemyTransform(e);
}

function updateWolfPatrolX(e) {
  const speed = e.cfg.patrolSpeed;

  e.x += speed * e.dir;

  if (e.x >= e.maxX) { e.x = e.maxX; e.dir = -1; }
  if (e.x <= e.startX) { e.x = e.startX; e.dir = 1; }

  setWalkClass(e.el, e.dir === 1 ? "right" : "left");
  applyEnemyTransform(e);
}

function updateEnemy(e) {
  if (e.type === "wolf" && e.cfg.mode === "patrolX") return updateWolfPatrolX(e);
  return updateEnemyInfinity(e);
}

/* =========================
   TILE 8 – Granny Sprites
   ========================= */
function renderTile8Sprites(level) {
  let decor = document.getElementById("decor");
  if (!decor) {
    decor = document.createElement("div");
    decor.id = "decor";
    game.insertBefore(decor, player);
  }
  decor.innerHTML = "";

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

/* =========================
   LEVEL LOADER
   ========================= */
function loadLevel(level) {
  currentLevel = level;
  TILE = level.tileSize;

  level.rows = level.walls.length;
  level.cols = level.walls[0].length;

  wallGrid = level.walls.map((rowStr) => [...rowStr].map((c) => c === "1"));

  // Player spawn "2"
  let spawn = null;
  for (let y = 0; y < level.walls.length; y++) {
    const x = level.walls[y].indexOf("2");
    if (x !== -1) { spawn = { tx: x, ty: y }; break; }
  }
  if (!spawn) spawn = level.spawn;

  // Enemies aus Markern
  clearEnemies();
  const wolfSpawns = level.enemies?.wolf ? findAllMarkers(level, "W") : [];
  const batSpawns  = level.enemies?.bat  ? findAllMarkers(level, "F") : [];

  // Marker entfernen
  level.walls = level.walls.map(r =>
    r.replaceAll("2", "0").replaceAll("W", "0").replaceAll("F", "0")
  );

  renderTile8Sprites(level);

  px = spawn.tx * TILE + (TILE - player.clientWidth) / 2;
  py = spawn.ty * TILE + (TILE - player.clientHeight) / 2;
  player.style.transform = `translate(${px}px, ${py}px)`;

  for (const s of wolfSpawns) spawnEnemy("wolf", s.tx, s.ty);
  for (const s of batSpawns)  spawnEnemy("bat",  s.tx, s.ty);

  SAFE_UNTIL = performance.now() + 1200;

  // Trigger am Spawn
  const { tx: spawnTx, ty: spawnTy } = getPlayerTilePos();
  if (typeof currentLevel.checkTriggers === "function") {
    currentLevel.checkTriggers(spawnTx, spawnTy);
  }

  update._lastTx = spawnTx;
  update._lastTy = spawnTy;
}

/* =========================
   GAME LOOP
   ========================= */
function update() {
  if (!gameStarted || !currentLevel) return;

  // Movement
  let vx = 0, vy = 0;
  if (keys.right) vx += SPEED;
  if (keys.left)  vx -= SPEED;
  if (keys.down)  vy += SPEED;
  if (keys.up)    vy -= SPEED;

  const hitOX = (player.clientWidth - PLAYER_HIT.w) / 2;
  const hitOY = (player.clientHeight - PLAYER_HIT.h) / 2;

  const canMoveTo = (nx, ny) =>
    !rectIntersectsWall(nx + hitOX, ny + hitOY, PLAYER_HIT.w, PLAYER_HIT.h);

  if (vx) {
    const nx = px + vx;
    if (canMoveTo(nx, py)) px = nx;
  }
  if (vy) {
    const ny = py + vy;
    if (canMoveTo(px, ny)) py = ny;
  }

  if (vx > 0) setWalkClass(player, "right");
  else if (vx < 0) setWalkClass(player, "left");
  else if (vy < 0) setWalkClass(player, "up");
  else if (vy > 0) setWalkClass(player, "down");
  else setWalkClass(player, null);

  player.style.transform = `translate(${px}px, ${py}px)`;

  // Tile Change -> Trigger
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
  // Enemies bewegen
  for (const e of enemies) updateEnemy(e);

  // Enemy collision -> restart
  if (performance.now() > SAFE_UNTIL) {
    const p = getPlayerHitRect();
    for (const e of enemies) {
      if (rectsOverlap(p, getEnemyHitRect(e))) return restartGame();
    }
  }

  requestAnimationFrame(update);
}

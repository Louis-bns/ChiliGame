const game = document.getElementById("game");
const player = document.getElementById("player");
const startScreen = document.getElementById("startscreen");

const restartBtn = document.getElementById("restartBtn");
if (restartBtn) restartBtn.addEventListener("click", restartGame);

const batTpl = document.getElementById("batTpl");
const wolfTpl = document.getElementById("wolfTpl");
const cowTpl = document.getElementById("cowTpl"); // NEU

let gameStarted = false;

/* =========================
   LEVEL STATE
   ========================= */
let currentLevel = null;
let wallGrid = null; // 2D boolean [row][col]
let TILE = 32;
let HAS_GUN = false;
const bullets = []; // { el, x, y, vx, vy, born }
const BULLET_SPEED = 900;      // px/s
const BULLET_LIFETIME = 1200;  // ms
const SHOOT_COOLDOWN = 140;    // ms
let _lastShotAt = 0;
// Truhen
const gunChests = new Map(); // key "tx,ty" -> { el, tx, ty }
let bossChest = null;        // { el, tx, ty }

/* =========================
   BOSS STATE
   ========================= */
let boss = null; // { el, x,y, vx,vy, dirX, dirY, speed, baseSpeed, scale, nextTurnAt, nextShotAt }
const bossFireballs = []; // { el, x,y, vx,vy, born }
const BOSS_FIREBALL_SPEED = 520;   // px/s
const BOSS_FIREBALL_LIFETIME = 2400; // ms
const BOSS_HIT_BASE = { w: 54, h: 54, ox: 5, oy: 5 }; // Boss 64x64 -> fairer Hit

/* =========================
   SETTINGS
   ========================= */
const SPEED = 240;

// Player Hitbox
const PLAYER_HIT = { w: 40, h: 60 };

// Default scales (kannst du pro Level überschreiben)
const DEFAULT_SCALES = { wolf: 4, bat: 1 };

// Enemy Hitboxen (fair; ggf. anpassen)
// Hitboxen in "Sprite-Pixeln" (unskaliert), werden in getEnemyHitRect mit scale multipliziert
const BAT_HIT_BASE = { w: 70, h: 70, ox: 13, oy: 28 }; // Bat: Element 96x128
const WOLF_HIT_BASE = { w: 56, h: 56, ox: 4, oy: 4 };  // Wolf: Element 64x64

// Spawn Schutz
let SAFE_UNTIL = 0;

/* =========================
   STATE
   ========================= */
let px = 0, py = 0;
let facing = "down"; // "left" | "right" | "up" | "down"
const keys = { left: false, right: false, up: false, down: false };
const enemies = []; // {type, el, x,y, homeX,homeY, t, cfg, dir, startX, maxX}
const cows = [];    // NEU: reine Deko (ohne Hitbox)
let PLAYER_LOCKED = false; // für bearbeitung spiel modus wechseln ( Locked bei Text)

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

  const {
    typewriter = false,
    charDelay = 30,
    x = "50%",
    y = "50%",
    center = true,
    lockPlayer = false   // 👈 NEU
  } = opts;

  if (showTempMessage._locked) {
    PLAYER_LOCKED = false;
    showTempMessage._locked = false;
  }

  if (lockPlayer) {
    PLAYER_LOCKED = true;
  }

  wrap.style.position = "absolute";
  wrap.style.left = typeof x === "number" ? `${x}px` : x;
  wrap.style.top = typeof y === "number" ? `${y}px` : y;
  wrap.style.transform = center ? "translate(-50%, -50%)" : "none";
  wrap.style.display = "block";

  clearTimeout(showTempMessage._hideTimer);
  if (showTempMessage._typeTimer) {
    clearInterval(showTempMessage._typeTimer);
    showTempMessage._typeTimer = null;
  }

  const unlock = () => {
    if (lockPlayer) PLAYER_LOCKED = false;
    wrap.style.display = "none";
  };

  if (!typewriter) {
    el.textContent = text;
    showTempMessage._hideTimer = setTimeout(unlock, ms);
    return;
  }

  el.textContent = "";
  let i = 0;

  showTempMessage._typeTimer = setInterval(() => {
    el.textContent += text[i++] ?? "";

    if (i >= text.length) {
      clearInterval(showTempMessage._typeTimer);
      showTempMessage._typeTimer = null;
      showTempMessage._hideTimer = setTimeout(unlock, ms);
    }
  }, Math.max(0, charDelay));
}

/* =========================
   UTILS
   ========================= */
// =========================
// INGREDIENT LIST (PNG SWAP)
// =========================
let LIST_STEP = 1;           // 1 = Liste1.png (leer)
const LIST_MIN = 1;
const LIST_MAX = 20;

function showIngredientsList() {
  const el = document.getElementById("side-image");
  if (!el) return;
  el.classList.remove("hidden");
}

function setListStep(step) {
  LIST_STEP = Math.max(LIST_MIN, Math.min(LIST_MAX, step));

  showIngredientsList(); // blendet die Box ein

  const img =
    document.getElementById("listImg") ||
    document.querySelector("#side-image img");

  if (!img) return;

  img.src = `assets/Liste${LIST_STEP}.png`;
}

function advanceListStep() {
  setListStep(LIST_STEP + 1);
}

function unequipGun() {
  HAS_GUN = false;
  player.classList.remove("gun"); // Sprite zurück auf Koch.png (Default CSS)
  _lastShotAt = 0;

  // optional: alle noch fliegenden Corn-Bullets entfernen
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].el?.remove();
    bullets.splice(i, 1);
  }
}


function restartGame() {
  if (restartGame._done) return;
  restartGame._done = true;
  window.location.reload();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getBossRect() {
  const boss = document.getElementById("boss");
  if (!boss) return null;

  // Boss-Position relativ zum #game Container
  const b = boss.getBoundingClientRect();
  const g = game.getBoundingClientRect();

  return {
    x: b.left - g.left,
    y: b.top - g.top,
    w: b.width,
    h: b.height
  };
}

function keyXY(tx, ty) { return `${tx},${ty}`; }

function spawnChestAtTile(tx, ty, { z = 20, scale = 2, className = "" } = {}) {
  const el = document.createElement("div");
  el.className = `tile-chest ${className}`.trim();
  el.style.left = (tx * TILE) + "px";
  el.style.top  = (ty * TILE) + "px";
  el.style.zIndex = String(z);

  // tile-chest hat schon scale(2) in CSS – wenn du variabel willst:
  // wir setzen hier per transform direkt (überschreibt CSS)
  el.style.transform = `translate(-6px, -6px) scale(${scale})`;

  game.appendChild(el);
  return el;
}

function setTileChar(level, tx, ty, ch) {
  const row = level.walls[ty];
  if (!row) return;
  level.walls[ty] = row.substring(0, tx) + ch + row.substring(tx + 1);
}

function unlockBossExit(level) {
  if (!level) return;

  // Flag (falls du es im Level brauchst)
  level.flags = level.flags || {};
  level.flags.bossLooted = true;

  // Unsichtbare Wände entfernen: wir nutzen Tile "V" als Invisible Block
  // (siehe Patch in LEVEL4 weiter unten)
  if (Array.isArray(level.walls)) {
    level.walls = level.walls.map(r => r.replaceAll("V", "0"));
  }

  showTempMessage("Ein Mechanismus klickt... Der Weg ist frei!", 1600, { typewriter: true, charDelay: 18 });
}


function spawnGunChestsFromP(level) {
  gunChests.clear();
  // alte P-Truhen (falls Level reload)
  document.querySelectorAll(".gun-chest").forEach(el => el.remove());

  for (let ty = 0; ty < level.rows; ty++) {
    const row = level.walls[ty];
    for (let tx = 0; tx < level.cols; tx++) {
      if (row[tx] === "P") {
        const el = spawnChestAtTile(tx, ty, { className: "gun-chest", z: 21, scale: 2 });
        gunChests.set(keyXY(tx, ty), { el, tx, ty });
      }
    }
  }
}

function pickupGunFromChest(level, tx, ty) {
  if (HAS_GUN) return;

  // 🔥 NEU: Level 4 Corn-Chest setzt explizit Liste4
  if (currentLevel?.id === "level4") {
    setListStep(4); // Liste4.png
  }

  HAS_GUN = true;
  player.classList.add("gun");
  showTempMessage(
    "Maiskolben-Pistole aufgenommen!",
    1500,
    { typewriter: true, charDelay: 18 }
  );

  // Truhe entfernen
  const k = keyXY(tx, ty);
  const chest = gunChests.get(k);
  if (chest?.el) chest.el.remove();
  gunChests.delete(k);

  setTileChar(level, tx, ty, "0");
}



function shootCorn() {
  if (!HAS_GUN) return;

  const now = performance.now();
  if (now - _lastShotAt < SHOOT_COOLDOWN) return;
  _lastShotAt = now;

  // Startpunkt: Mitte der Player-Hitbox
  const p = getPlayerHitRect();
  let x = p.x + p.w / 2 - 5;
  let y = p.y + p.h / 2 - 5;

  // Richtung aus facing
  let dx = 0, dy = 0;
  if (facing === "right") dx = 1;
  else if (facing === "left") dx = -1;
  else if (facing === "up") dy = -1;
  else dy = 1;

  // minimaler Offset, damit Bullet nicht im Player steckt
  x += dx * 18;
  y += dy * 18;

  const el = document.createElement("div");
  el.className = "corn-bullet";
  game.appendChild(el);

  const b = {
    el,
    x,
    y,
    vx: dx * BULLET_SPEED,
    vy: dy * BULLET_SPEED,
    born: now
  };

  bullets.push(b);
  el.style.transform = `translate(${b.x}px, ${b.y}px)`;
}

function updateBullets(dt) {
  if (!bullets.length) return;

  const bossRect = getBossRect();

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    // Lifetime
    if (performance.now() - b.born > BULLET_LIFETIME) {
      b.el.remove();
      bullets.splice(i, 1);
      continue;
    }

    // Move
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Wall collision (10x10 Bullet)
    if (rectIntersectsWall(b.x, b.y, 10, 10)) {
      b.el.remove();
      bullets.splice(i, 1);
      continue;
    }

   // Boss collision (wenn vorhanden)
if (bossRect) {
  const br = { x: b.x, y: b.y, w: 10, h: 10 };
  if (rectsOverlap(br, bossRect)) {

    // HP default 20
    window.BOSS_HP = (typeof window.BOSS_HP === "number") ? window.BOSS_HP : 20;
    window.BOSS_HP -= 1;
    updateBossHpBar();


    showTempMessage(`Treffer! Boss HP: ${window.BOSS_HP}`, 700);

    // Bullet weg
    b.el.remove();
    bullets.splice(i, 1);

    // Boss dead
    if (window.BOSS_HP <= 0) {
      // Kiste da spawnen wo er stirbt
      spawnChestAtBoss();

      const bossEl = document.getElementById("boss");
      if (bossEl) bossEl.remove();
      boss = null;
      unequipGun();
      showTempMessage("Boss besiegt!", 1500, { typewriter: true, charDelay: 18 });
    }

    continue;
  }
}


    b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
  }
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

function forceSolveCurrentLevel() {
  if (!currentLevel) return;

  // Nur für Level 3 (optional absichern)
  if (currentLevel.id !== "level3") {
    console.warn("forceSolve: falsches Level");
    return;
  }

  // Alle Targets direkt als gelöst markieren
  for (const t of currentLevel._targets || []) {
    currentLevel.setTile(t.tx, t.ty, "L");
  }

  currentLevel.flags.solved = true;

  // Neu rendern (Tür, Blöcke, etc.)
  if (typeof currentLevel.renderPuzzle === "function") {
    currentLevel.renderPuzzle({
      gameEl: game,
      showTempMessage
    });
  }

  // Offizielles Solve-Event auslösen
  if (typeof currentLevel.checkSolved === "function") {
    currentLevel.checkSolved({
      showTempMessage
    });
  }

  console.log("LEVEL FORCED SOLVED");
}

/* =========================
   KEY POPUP (Schlüssel gefunden)
   ========================= */
function showKeyPopup() {
  const keyImg = document.createElement("img");
  keyImg.src = "assets/key.png"; 
  keyImg.className = "key-popup";

  // Position relativ zum #game Container
  const playerRect = player.getBoundingClientRect();
  const gameRect = game.getBoundingClientRect();

  keyImg.style.left =
    (playerRect.left - gameRect.left) + (playerRect.width / 2) - 20 + "px";
  keyImg.style.top =
    (playerRect.top - gameRect.top) - 45 + "px";

  game.appendChild(keyImg);

  setTimeout(() => keyImg.remove(), 1200);
}

function showArrowsPopup(ms = 2200) {
  const img = document.createElement("img");
  img.src = "assets/arrows.png";
  img.className = "arrow-popup";

  // Position relativ zum #game Container
  const playerRect = player.getBoundingClientRect();
  const gameRect = game.getBoundingClientRect();

  // mittig über dem Kopf (Werte ggf. feinjustieren)
  img.style.left = (playerRect.left - gameRect.left) + (playerRect.width / 2) - 40 + "px";
  img.style.top  = (playerRect.top - gameRect.top) - 80 + "px";

  game.appendChild(img);
  setTimeout(() => img.remove(), ms);
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
      // Arrow-Hint direkt nach Spawn (1 Frame warten, damit Position stimmt)
     // 3 Sekunden warten, dann Pfeile anzeigen
    setTimeout(() => {
    showArrowsPopup(2200);
  }, 1200);
    update._lastTime = null;
    requestAnimationFrame(update);

    return;
  }

    // R = Full Restart
  if (k === "r") {
    e.preventDefault();
    restartGame(); // macht window.location.reload()
    return;
  }


// SPACE = shoot (wenn Waffe), sonst Interact
if ((k === " " || e.code === "Space") && gameStarted) {
  e.preventDefault();
  if (HAS_GUN) shootCorn();
  else handleInteract();
  return;
}

// OPTIONAL: Interact zusätzlich auf "E"
if (k === "e" && gameStarted) {
  e.preventDefault();
  handleInteract();
  return;
}

  // DEBUG: Shift + L = Level sofort lösen
if (e.shiftKey && e.key.toLowerCase() === "l") {
  e.preventDefault();
  forceSolveCurrentLevel();
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
  // Nutze die Hitbox-Mitte statt Sprite-Mitte -> Interact fühlt sich viel präziser an
  const hitOX = (player.clientWidth - PLAYER_HIT.w) / 2;
  const hitOY = (player.clientHeight - PLAYER_HIT.h) / 2;

  const cx = px + hitOX + PLAYER_HIT.w / 2;
  const cy = py + hitOY + PLAYER_HIT.h / 2;

  return { tx: Math.floor(cx / TILE), ty: Math.floor(cy / TILE) };
}


function handleInteract() {
  if (!currentLevel) return;
  const { tx, ty } = getPlayerTilePos();

  // 0) Boss-Truhe öffnen (falls vorhanden)
 if (bossChest && bossChest.tx === tx && bossChest.ty === ty) {
  showTempMessage("Du öffnest die Truhe...\nDu hast die 🌶️ Chilischote gefunden!", 2600, {
    typewriter: true, charDelay: 18, x: "50%", y: "50%", center: true
  });

  // Liste weiter (z.B. nach Chili)
setListStep(5); // 🌶️ Chili = Liste5.png

  // Exit freischalten (unsichtbare Wand entfernen)
  unlockBossExit(currentLevel);

  bossChest.el.remove();
  bossChest = null;
  return;
}


  // 0b) P-Truhe (Gun) öffnen
  const pTile = getTileAt(currentLevel, tx, ty);
  if (pTile === "P" && !HAS_GUN) {
    pickupGunFromChest(currentLevel, tx, ty);
    return;
  }

  const tile = getTileAt(currentLevel, tx, ty);

  // 1) Wenn es eine direkte Interaktion für das Tile gibt (z.B. K, F, M, ...)
  const map = currentLevel.interactions || {};
  const fn = map[tile];

  if (typeof fn === "function") {
    fn({
      level: currentLevel,
      tile, tx, ty,
      showTempMessage,
      playerEl: player,
      gameEl: game,
      facing,
      playerTile: { tx, ty }
    });
    return;
  }

  // 2) Wichtig: onInteract IMMER erlauben (auch wenn tile === "0"),
  // weil Push-Puzzle "vor dem Spieler" arbeitet.
  if (typeof currentLevel.onInteract === "function") {
    currentLevel.onInteract({
      level: currentLevel,
      tile, tx, ty,
      showTempMessage,
      playerEl: player,
      gameEl: game,
      facing,
      playerTile: { tx, ty }
    });
    return;
  }

  // 3) Falls weder interactions noch onInteract: dann kein Interact
}


/* =========================
   WALL COLLISION
   ========================= */
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

/* =========================
   NEU: PER-LEVEL COW CONFIG
   ========================= */
function getCowCfg(level) {
  const cfg = level?.cowConfig || {};
  return {
    enabled: cfg.enabled !== false, // default true
    sprite: typeof cfg.sprite === "string" ? cfg.sprite : "assets/Cow.png",
    frameW: typeof cfg.frameW === "number" ? cfg.frameW : 64,
    frameH: typeof cfg.frameH === "number" ? cfg.frameH : 64,
    animDur: typeof cfg.animDur === "number" ? cfg.animDur : 0.8,
    scale: typeof cfg.scale === "number" ? cfg.scale : 2,
    ox: typeof cfg.ox === "number" ? cfg.ox : 0,
    oy: typeof cfg.oy === "number" ? cfg.oy : 0,
    behindPlayer: cfg.behindPlayer === true
  };
}

/* =========================
   ENEMIES (MULTI)
   ========================= */
function clearEnemies() {
  for (const e of enemies) e.el.remove();
  enemies.length = 0;
}

/* =========================
   NEU: COWS (DECO ONLY)
   ========================= */
function clearCows() {
  for (const c of cows) c.el.remove();
  cows.length = 0;
}

/* =========================
   BOSS: SPAWN / CLEAR
   ========================= */
function clearBoss() {
  if (boss?.el) boss.el.remove();
  boss = null;

  for (const f of bossFireballs) f.el.remove();
  bossFireballs.length = 0;
}

function getBossCfg(level) {
  const cfg = level?.boss || {};
  return {
    enabled: cfg.enabled === true,
    tx: typeof cfg.tx === "number" ? cfg.tx : 22,
    ty: typeof cfg.ty === "number" ? cfg.ty : 22,
    scale: typeof cfg.scale === "number" ? cfg.scale : 3,
    speed: typeof cfg.speed === "number" ? cfg.speed : 210, // px/s
    turnMinMs: typeof cfg.turnMinMs === "number" ? cfg.turnMinMs : 600,
    turnMaxMs: typeof cfg.turnMaxMs === "number" ? cfg.turnMaxMs : 1600,
    shotMinMs: typeof cfg.shotMinMs === "number" ? cfg.shotMinMs : 900,
    shotMaxMs: typeof cfg.shotMaxMs === "number" ? cfg.shotMaxMs : 2600
  };
}

function spawnBossFromLevel(level) {
  clearBoss();

  const cfg = getBossCfg(level);
  if (!cfg.enabled) return;

  const el = document.getElementById("bossTpl").cloneNode(false);
  el.id = "boss";
  el.style.display = "block";
  game.appendChild(el);

  // initial HP
  window.BOSS_HP = 20;

  // Position: tile-centered
  const x = cfg.tx * TILE + (TILE - 64 * cfg.scale) / 2;
  const y = cfg.ty * TILE + (TILE - 64 * cfg.scale) / 2;

  boss = {
    el,
    x, y,
    vx: 0, vy: 0,
    dirX: 1, dirY: 0,
    scale: cfg.scale,
    baseSpeed: cfg.speed,
    speed: cfg.speed,
    nextTurnAt: performance.now() + 200,
    nextShotAt: performance.now() + 600,
    turnMinMs: cfg.turnMinMs,
    turnMaxMs: cfg.turnMaxMs,
    shotMinMs: cfg.shotMinMs,
    shotMaxMs: cfg.shotMaxMs,
  };

    // HP-Bar DOM
  const hpWrap = document.createElement("div");
  hpWrap.className = "boss-hp-wrap";

  const hpFill = document.createElement("div");
  hpFill.className = "boss-hp-fill";

  hpWrap.appendChild(hpFill);
  el.appendChild(hpWrap);

  boss._hpFill = hpFill;
  boss._hpMax = 20;
  updateBossHpBar();


  setBossDir(1, 0);
  applyBossTransform();
}

function updateBossHpBar() {
  if (!boss || !boss._hpFill) return;

  const hp = (typeof window.BOSS_HP === "number") ? window.BOSS_HP : 20;
  const max = boss._hpMax || 20;

  const pct = Math.max(0, Math.min(1, hp / max));
  boss._hpFill.style.width = (pct * 100) + "%";

  // optional: Farbwechsel je nach HP
  if (pct > 0.5) boss._hpFill.style.background = "#2cff3a";
  else if (pct > 0.25) boss._hpFill.style.background = "#ffd400";
  else boss._hpFill.style.background = "#ff2a2a";
}


function applyBossTransform() {
  if (!boss) return;
  boss.el.style.transformOrigin = "top left";
  boss.el.style.transform = `translate(${boss.x}px, ${boss.y}px) scale(${boss.scale})`;
}

function setBossDir(dx, dy) {
  if (!boss) return;
  boss.dirX = dx;
  boss.dirY = dy;

  // Sprite-Reihe wählen: links/rechts
  boss.el.classList.remove("walk-left", "walk-right", "walk-up", "walk-down");

  if (dx < 0) boss.el.classList.add("walk-left");
  else if (dx > 0) boss.el.classList.add("walk-right");
  else {
    // Wenn nur up/down: behalte last horizontale Richtung, default right
    if (boss.el.classList.contains("walk-left")) boss.el.classList.add("walk-left");
    else boss.el.classList.add("walk-right");
    boss.el.classList.add(dy < 0 ? "walk-up" : "walk-down");
  }

  // Velocity (random walk)
  boss.vx = dx * boss.speed;
  boss.vy = dy * boss.speed;
}

function bossHitRectAt(x, y) {
  const s = boss?.scale ?? 1;
  return {
    x: x + BOSS_HIT_BASE.ox * s,
    y: y + BOSS_HIT_BASE.oy * s,
    w: BOSS_HIT_BASE.w * s,
    h: BOSS_HIT_BASE.h * s
  };
}

function chooseRandomBossDir() {
  // 4 Richtungen (grid-like). Du kannst hier leicht auf 8 Richtungen erweitern.
  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];
  return dirs[(Math.random() * dirs.length) | 0];
}

/* =========================
   BOSS: UPDATE + FIRE
   ========================= */
function updateBoss(dt) {
  if (!boss) return;

  // Speed-Phase: ab 10 HP verdoppeln
  const wantedSpeed = (window.BOSS_HP <= 10) ? (boss.baseSpeed * 2) : boss.baseSpeed;
  if (boss.speed !== wantedSpeed) {
    boss.speed = wantedSpeed;
    boss.vx = boss.dirX * boss.speed;
    boss.vy = boss.dirY * boss.speed;
  }

  const now = performance.now();

  // Richtungswechsel random
  if (now >= boss.nextTurnAt) {
    const d = chooseRandomBossDir();
    setBossDir(d.dx, d.dy);
    boss.nextTurnAt = now + (boss.turnMinMs + Math.random() * (boss.turnMaxMs - boss.turnMinMs));
  }

  // Move mit Wall-Collision (Boss-Hitbox)
  const tryMove = (nx, ny) => !rectIntersectsWall(
    bossHitRectAt(nx, ny).x,
    bossHitRectAt(nx, ny).y,
    bossHitRectAt(nx, ny).w,
    bossHitRectAt(nx, ny).h
  );

  let nx = boss.x + boss.vx * dt;
  let ny = boss.y + boss.vy * dt;

  // X
  if (boss.vx !== 0) {
    if (tryMove(nx, boss.y)) boss.x = nx;
    else {
      // Bounce: Richtung invertieren
      setBossDir(-boss.dirX, 0);
    }
  }

  // Y
  if (boss.vy !== 0) {
    if (tryMove(boss.x, ny)) boss.y = ny;
    else {
      setBossDir(0, -boss.dirY);
    }
  }

  applyBossTransform();

  // Player-Kollision => Tod
  const p = getPlayerHitRect();
  const br = bossHitRectAt(boss.x, boss.y);
  if (rectsOverlap(p, br)) {
    restartGame();
    return;
  }

  // Schießen random
  if (now >= boss.nextShotAt) {
    bossShootRandomFireball();
    boss.nextShotAt = now + (boss.shotMinMs + Math.random() * (boss.shotMaxMs - boss.shotMinMs));
  }
}

function bossShootRandomFireball() {
  if (!boss) return;

  // Startpunkt: Boss-Mitte
  const s = boss.scale;
  const cx = boss.x + (64 * s) / 2 - 6;
  const cy = boss.y + (64 * s) / 2 - 6;

  // Random Richtung (8 Wege)
  const dirs = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
  ];
  const d = dirs[(Math.random() * dirs.length) | 0];
  const len = Math.hypot(d.dx, d.dy) || 1;
  const dx = d.dx / len;
  const dy = d.dy / len;

  const el = document.createElement("div");
  el.className = "boss-fireball";
  game.appendChild(el);

  const fb = {
    el,
    x: cx,
    y: cy,
    vx: dx * BOSS_FIREBALL_SPEED,
    vy: dy * BOSS_FIREBALL_SPEED,
    born: performance.now()
  };

  bossFireballs.push(fb);
  el.style.transform = `translate(${fb.x}px, ${fb.y}px)`;
}

function updateBossFireballs(dt) {
  if (!bossFireballs.length) return;

  const p = getPlayerHitRect();

  for (let i = bossFireballs.length - 1; i >= 0; i--) {
    const f = bossFireballs[i];

    if (performance.now() - f.born > BOSS_FIREBALL_LIFETIME) {
      f.el.remove();
      bossFireballs.splice(i, 1);
      continue;
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // Wall collision (12x12)
    if (rectIntersectsWall(f.x, f.y, 12, 12)) {
      f.el.remove();
      bossFireballs.splice(i, 1);
      continue;
    }

    // Player collision
    const fr = { x: f.x, y: f.y, w: 12, h: 12 };
    if (rectsOverlap(fr, p)) {
      restartGame();
      return;
    }

    f.el.style.transform = `translate(${f.x}px, ${f.y}px)`;
  }
}

/* =========================
   BOSS: DEATH -> CHEST
   ========================= */
function spawnChestAtBoss() {
  if (!boss) return;

  const s = boss.scale;
  const cx = boss.x + (64 * s) / 2;
  const cy = boss.y + (64 * s) / 2;

  const tx = Math.max(0, Math.min(currentLevel.cols - 1, Math.floor(cx / TILE)));
  const ty = Math.max(0, Math.min(currentLevel.rows - 1, Math.floor(cy / TILE)));

  // falls schon eine Boss-Truhe existiert, erst entfernen
  if (bossChest?.el) bossChest.el.remove();

  const el = spawnChestAtTile(tx, ty, { className: "boss-chest", z: 22, scale: 2 });
  bossChest = { el, tx, ty };
}


function removeAllCowDecos() {
  document.querySelectorAll(".cow-deco").forEach(el => el.remove());
  cows.length = 0;
}

function spawnCow(tx, ty, cfg) {
  const el = cowTpl.cloneNode(false);
  el.id = "";
  el.style.display = "block";
  el.classList.add("anim");
  el.classList.add("cow-deco");

  // Sprite + Frame (wie Bat/Granny: 96x128)
  const frameW = cfg.frameW ?? 96;
  const frameH = cfg.frameH ?? 128;

  // Sheet im Spiel immer 4x2 Frames
  const sheetW = (cfg.sheetW ?? (frameW * 4));
  const sheetH = (cfg.sheetH ?? (frameH * 2));

  el.style.setProperty("--cowSprite", `url("${encodeURI(cfg.sprite)}")`);
  el.style.setProperty("--cowFrameW", `${frameW}px`);
  el.style.setProperty("--cowFrameH", `${frameH}px`);
  el.style.setProperty("--cowSheetW", `${sheetW}px`);
  el.style.setProperty("--cowSheetH", `${sheetH}px`);
  el.style.setProperty("--cowAnimDur", `${cfg.animDur ?? 0.8}s`);

  if (cfg.behindPlayer) game.insertBefore(el, player);
  else game.appendChild(el);

  // Position: mittig auf dem Tile (wie bei dir), dann scale
  const s = cfg.scale ?? 1;
  const x = tx * TILE + (TILE - frameW * s) / 2 + (cfg.ox ?? 0);
  const y = ty * TILE + (TILE - frameH * s) / 2 + (cfg.oy ?? 0);

  el.style.transformOrigin = "top left";
  el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;

  cows.push({ el });
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
    dir: 1,
    startX: x,
    maxX: x,
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
    e.dir = dx > 0 ? 1 : -1;
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
        el.style.top = (ty * TILE) + "px";
        decor.appendChild(el);
      }
    }
  }
}

/* =========================
   DEBUG WALLS (per level)
   ========================= */
function renderDebugWalls(level) {
  let tiles = document.getElementById("tiles");
  if (!tiles) {
    tiles = document.createElement("div");
    tiles.id = "tiles";
    game.insertBefore(tiles, player);
  }
  tiles.innerHTML = "";

  if (!level?.renderWalls) return;

  for (let ty = 0; ty < level.rows; ty++) {
    for (let tx = 0; tx < level.cols; tx++) {
      if (wallGrid?.[ty]?.[tx]) {
        const el = document.createElement("div");
        el.className = "tile wall";
        el.style.position = "absolute";
        el.style.left = (tx * TILE) + "px";
        el.style.top = (ty * TILE) + "px";
        el.style.width = TILE + "px";
        el.style.height = TILE + "px";
        tiles.appendChild(el);
      }
    }
  }
}

/* =========================
   LEVEL LOADER
   ========================= */
function loadLevel(level) {
  const puzzleLayer = document.getElementById("puzzleLayer");
if (puzzleLayer) puzzleLayer.remove();

  // alte Layer löschen (falls vorhanden)
  const decor = document.getElementById("decor");
  if (decor) decor.innerHTML = "";
  const tiles = document.getElementById("tiles");
  if (tiles) tiles.innerHTML = "";

  // Level klonen (Original nicht mutieren)
  currentLevel = {
    ...level,
    walls: level.walls.map(r => ("" + r)),
    flags: level.flags ? structuredClone(level.flags) : undefined,
    _spentTriggers: level._spentTriggers ? new Set(level._spentTriggers) : undefined
  };
  level = currentLevel;

  TILE = level.tileSize;

  // rows/cols ableiten (falls nicht gesetzt)
  level.rows = level.walls.length;
  level.cols = level.walls[0]?.length ?? 0;

  // Background pro Level (optional)
  if (level.background) {
    const bg = encodeURI(level.background);
    game.style.backgroundImage = `url("${bg}")`;
    game.style.backgroundSize = "cover";
    game.style.backgroundPosition = "center";
    game.style.backgroundRepeat = "no-repeat";
  }
  // kein else: wenn background fehlt, CSS-Background beibehalten

  // Spawn-Char pro Level (optional)
  const spawnChar = level.spawnChar || "2";

  // Spawn suchen (Marker, sonst fallback)
  let spawn = null;
  for (let y = 0; y < level.walls.length; y++) {
    const x = level.walls[y].indexOf(spawnChar);
    if (x !== -1) { spawn = { tx: x, ty: y }; break; }
  }
  if (!spawn) spawn = level.spawn;

  // Enemies aus Markern
  clearEnemies();
  clearCows();
  clearBoss();

  


  const wolfSpawns = level.enemies?.wolf ? findAllMarkers(level, "W") : [];
  const batSpawns  = level.enemies?.bat  ? findAllMarkers(level, "F") : [];

  // NEU: Kuh-Spawns über "K" (bleibt im Grid für Interactions!)
  const cowCfg = getCowCfg(level);
  const cowSpawns = (cowCfg.enabled && level?.cows?.cow) ? findAllMarkers(level, "K") : [];

  // Marker entfernen (spawn + enemy marker -> "0")
  // WICHTIG: "K" NICHT entfernen, sonst geht interactions["K"] nicht mehr
  level.walls = level.walls.map(r =>
    r.replaceAll(spawnChar, "0").replaceAll("W", "0").replaceAll("F", "0")
  );

  // wallGrid NACH cleanup bauen
  wallGrid = level.walls.map(rowStr => [...rowStr].map(c => c === "1"));
  spawnGunChestsFromP(level);


  // Debug-Walls pro Level
  renderDebugWalls(level);

  renderTile8Sprites(level);

  // Player setzen
  px = spawn.tx * TILE + (TILE - player.clientWidth) / 2;
  py = spawn.ty * TILE + (TILE - player.clientHeight) / 2;
  player.style.transform = `translate(${px}px, ${py}px)`;
  // Boss nur wenn Level es aktiviert
spawnBossFromLevel(currentLevel);

  update._lastTime = null; // wichtig nach loadLevel

  // Enemies spawnen
  for (const s of wolfSpawns) spawnEnemy("wolf", s.tx, s.ty);
  for (const s of batSpawns)  spawnEnemy("bat", s.tx, s.ty);

  // NEU: Kühe spawnen (Deko, keine Hitbox)
  for (const s of cowSpawns)  spawnCow(s.tx, s.ty, cowCfg);

  SAFE_UNTIL = performance.now() + 1200;

  // Trigger am Spawn
  const { tx: spawnTx, ty: spawnTy } = getPlayerTilePos();
  if (typeof currentLevel.checkTriggers === "function") {
    currentLevel.checkTriggers(spawnTx, spawnTy);
  }

  update._lastTx = spawnTx;
  update._lastTy = spawnTy;

  if (typeof currentLevel.onLoad === "function") {
  currentLevel.onLoad({
    level: currentLevel,
    showTempMessage,
    playerEl: player,
    gameEl: game
  });
}

}

/* =========================
   GAME LOOP
   ========================= */
function update(now = performance.now()) {
  if (!gameStarted || !currentLevel) return;

  // dt (Sekunden) berechnen
  if (update._lastTime == null) update._lastTime = now;
  let dt = (now - update._lastTime) / 1000;
  update._lastTime = now;

  // dt begrenzen (Tab-Wechsel / Lags)
  if (dt > 0.05) dt = 0.05;

  if (currentLevel?.flags?.carrying) player.classList.add("carrying");
  else player.classList.remove("carrying");

  // =========================
  // MOVEMENT (nur wenn nicht gelocked)
  // =========================
  if (!PLAYER_LOCKED) {
    let vx = 0, vy = 0;
    if (keys.right) vx += SPEED * dt;
    if (keys.left)  vx -= SPEED * dt;
    if (keys.down)  vy += SPEED * dt;
    if (keys.up)    vy -= SPEED * dt;

    // diagonal normalisieren
    const len = Math.hypot(vx, vy);
    if (len > 0) {
      const max = SPEED * dt;
      vx = (vx / len) * max;
      vy = (vy / len) * max;
    }

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

    if (vx > 0) { facing = "right"; setWalkClass(player, "right"); }
    else if (vx < 0) { facing = "left"; setWalkClass(player, "left"); }
    else if (vy < 0) { facing = "up"; setWalkClass(player, "up"); }
    else if (vy > 0) { facing = "down"; setWalkClass(player, "down"); }
    else setWalkClass(player, null);

    player.style.transform = `translate(${px}px, ${py}px)`;
  }

  // =========================
  // Tile / Trigger / Levelwechsel (IMMER prüfen)
  // =========================
  const { tx: ptx, ty: pty } = getPlayerTilePos();

  if (update._lastTx !== ptx || update._lastTy !== pty) {
    update._lastTx = ptx;
    update._lastTy = pty;
    if (typeof currentLevel.checkTriggers === "function") {
      currentLevel.checkTriggers(ptx, pty);
    }
  }

  const tileHere = getTileAt(currentLevel, ptx, pty);

  if (tileHere === "Z" && window.LEVEL2 && currentLevel.id === "level1") {
    loadLevel(window.LEVEL2);
    requestAnimationFrame(update);
    return;
  }

  if (tileHere === "Y" && window.LEVEL3 && currentLevel.id === "level2") {
    loadLevel(window.LEVEL3);
    requestAnimationFrame(update);
    return;
  }

  // Level 3 -> Level 4 (du nutzt jetzt "Q")
  if (tileHere === "Q" && window.LEVEL4 && currentLevel.id === "level3") {
    loadLevel(window.LEVEL4);
    requestAnimationFrame(update);
    return;
  }

  if (tileHere === "S" && window.LEVEL5 && currentLevel.id === "level4") {
  loadLevel(window.LEVEL5);
  requestAnimationFrame(update);
  return;
}

  // =========================
  // Enemies bewegen + Collision (IMMER laufen lassen)
  // =========================
  for (const e of enemies) updateEnemy(e);

  updateBoss(dt);
updateBossFireballs(dt);

  updateBullets(dt);

  if (performance.now() > SAFE_UNTIL) {
    const p = getPlayerHitRect();
    for (const e of enemies) {
      if (rectsOverlap(p, getEnemyHitRect(e))) {
        restartGame();
        return;
      }
    }
  }

  // WICHTIG: Loop immer weiter laufen lassen
  requestAnimationFrame(update);
}

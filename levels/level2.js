(function () {
  window.LEVEL2 = {
    id: "level2",
    cols: 45,
    rows: 45,
    tileSize: 32,

    background: "assets/LEVEL2.png",

    spawnChar: "Z",
    spawn: { tx: 25, ty: 42 },

    enemyConfig: {
      wolf: { mode: "patrolX", distance: 10, speed: 1.4, scale: 4 },
      bat: { mode: "infinity", a: 8000, b: 5000, speed: 0.01, scale: 0.9 }
    },

    // NEU: Kuh-Konfig (Deko, ohne Hitbox), wird auf jedem "K" Tile gerendert
    cowConfig: {
      enabled: true,
      sprite: "assets/Cow.png",
      spritePatched: "assets/Cow_pflaster.png", // <-- NEU: Kuh mit Pflaster

      frameW: 96,
      frameH: 128,

      sheetW: 384,
      sheetH: 256,

      animDur: 0.8,
      scale: 1,
      ox: 0,
      oy: 0,
      behindPlayer: true
    },

    fullConfig: {
  enabled: true,
  sprite: "assets/voll.png",

  // Größenanpassung wie bei cowConfig
  scale: 1,     // z.B. 1.2 = größer
  ox: 1100,        // Pixel-Offset X
  oy: -10,        // Pixel-Offset Y

  behindPlayer: true, // true => hinter Player, false => davor

  wTiles: 8,
  hTiles: 6
},


    cows: { cow: true },

    enemies: { bat: true, wolf: false },

    renderWalls: false,

    walls: [
      "000000000000000000000000000000000000000000000",
      "001111111111111111111111111111111111111111100",
      "00133220II000000000000000666600000MMMMMMMM100",
      "00133220II000000000000000666600000MMMMMMMM100",
      "00133220II000000000000000666600000MMMMMMMM100",
      "0010000000000000000000000000000000MMMMM000100",
      "001000000000000000000000000044000000000555100",
      "001000000000000000001111110044000000000555100",
      "001000000000000000001100010044000000000555100",
      "111111111100001111111000011111110001111111111",
      "000000000100001000000000000000010001000000000",
      "000000000100001000000000000000010001000000000",
      "000000000100001000000000000000010001000000000",
      "000000000100001000000000000000010001000000000",
      "000000000100001000000000000000010001000000000",
      "000000000100001000000000000000010001100000000",
      "000000000100001000000000000000010001000000000",
      "001111111100001111111000011111110001111111100",
      "0010000001k00000000011111100AAA0000000CCC0100",
      "0010000001k00000000000000000AAA0000000CCC0100",
      "0010000001k00000000000000000AAA0000000CCC0100",
      "001000K001k0000000000000000000000000000000100",
      "0011111111k0000000000000000000000000000000100",
      "001kkkkkkkk0000000001000001000000000000000100",
      "001000000000001111111000001111110001111111100",
      "001000000000001000000000000000000000BBB000100",
      "001000000000001000000000000000000000BBB000100",
      "001000000000001000000000000000000000BBB000100",
      "001000000000001000000000000000000000000000100",
      "001000000000001000000000000000000000000000100",
      "001000000000001000000000000000000000000000100",
      "0011111111000011111100000000000F0000000001100",
      "001000000000000000000000000000000000000000100",
      "001000000000000000000000000000000000000000100",
      "0010HHHHHH00000000000000000000000000000000UY0",
      "0010HHVHHH000000000000000000000000000000NNUY0",
      "0010HHHHHH000000000000000000000000000000NNUY0",
      "0010HHHHHH00000000000000000000000000000000111",
      "111111111111111111111000011111111111111111111",
      "1YYYY0000000000000000000000000000000000000001",
      "1YYYY0000000000000000000000000000000000000001",
      "1YYYY0000000000000000000000000000000000000001",
      "1000000000000000000000000Z0000000000000000001",
      "100000000000000000000000000000000000000000001",
      "111111111111111111111111111111111111111111111"
    ],

    _spentTriggers: new Set(),

    flags: {  uUnlocked: false,     // U bleibt solid bis N nach Phase6 triggert
  hackCollected: false  // damit Hack nur einmal eingesammelt wird
 },

    getTile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return "1";
      const row = this.walls[ty];
      if (!row) return "1";
      return row[tx] ?? "1";
    },

    isSolid(tx, ty) {
  const t = this.getTile(tx, ty);
  if (t === "1") return true;

  // U ist solid, bis wir es explizit freischalten (nach Fade + N Trigger)
  if (t === "U" && !this.flags?.uUnlocked) return true;

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


      "M": (ctx) => {
        if (phase === 1) return msg(ctx.showTempMessage, "Maschie ist wohl kaputt ...");
        if (phase === 2) return msg(ctx.showTempMessage, "Irgendwas stimmt mit den Sicherungen nicht.");
        if (phase === 3) return msg(ctx.showTempMessage, "Repariert und bereit");
        if (phase === 4 || phase === 5) return msg(ctx.showTempMessage, "Repariert und bereit");
        return;
      },

      "A": (ctx) => {
        if (phase >= 6) return;
        if (phase === 5) {
          if (sysStep !== 0) {
            msg(ctx.showTempMessage, "Error 404---Abbruch");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Maschine aktiviert");
          sysStep = 1;
          return;
        }
        msg(ctx.showTempMessage, "Ein Computer");
      },

      "B": (ctx) => {
        if (phase >= 6) return;
        if (phase === 5) {
          if (sysStep !== 1) {
            msg(ctx.showTempMessage, "Error 404---Abbruch");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Kuh integriert");
          sysStep = 2;
          return;
        }
        msg(ctx.showTempMessage, "Ein Computer");
      },

      "C": (ctx) => {
        if (phase >= 6) return;

        if (phase === 5) {
          if (sysStep !== 2) {
            msg(ctx.showTempMessage, "Error 404---Abbruch");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Container initialisiert");
          sysStep = 3;

          // NEU: Schwarzblende + Phase6 + Kuh-Sprite swap
          triggerPhase6Transition(ctx);
          return;
        }

        msg(ctx.showTempMessage, "Ein Computer");
      },

      // Container (H) - NEU: ab Phase 6 "voll mit hack"
      "H": (ctx) => {
  if (phase < 6) {
    return msg(ctx.showTempMessage, "Container leer");
  }

  const L = ctx.level || window.LEVEL2;
  L.flags = L.flags || {};

  // Hack nur einmal einsammeln
  if (!L.flags.hackCollected) {
    L.flags.hackCollected = true;

    // ✅ U erst JETZT freigeben
    L.flags.uUnlocked = true;

    // Popup über Player
    if (typeof window.showItemPopup === "function") {
      window.showItemPopup("assets/Hack.png");
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
        const el = spawnChestAtTile(tx, ty, { className: "gun-chest", z: 6, scale: 2.6 });
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

  /* =========================================================
     PHASEN-LOGIK
     ========================================================= */
  let phase = 1;

  let fuseStep = 0;
  let itemHeld = null;
  let pendingPickup = null;
  let sysStep = 0;

  function msg(showTempMessage, text, duration, extra = {}) {
  // 🔒 erlaubt auch: msg(fn, "Text", { lockPlayer: true })
  if (duration && typeof duration === "object") {
    extra = duration;
    duration = undefined;
  }

  const charDelay = extra.charDelay ?? 40;     // einheitlich
  const base = extra.baseTime ?? 900;          // Mindestanzeigezeit
  const minTime = text.length * charDelay + base;

  // wenn duration nicht gesetzt oder zu klein: minTime nehmen
  const finalDuration =
    (typeof duration === "number" && duration > 0)
      ? Math.max(duration, minTime)
      : minTime;

  showTempMessage(text, finalDuration, {
    x: "50%",
    y: "50%",
    center: true,
    typewriter: true,
    charDelay,               // <-- wichtig: nicht hart 40 überschreiben
    ...extra
  });
}

  function tileToItem(tile) {
    if (tile === "I") return "boots";
    if (tile === "2") return "hay";
    if (tile === "3") return "carrots";
    return null;
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

/* =========================
   Item POPUP 
   ========================= */
function showItemPopup(src, ms = 1200) {
  const img = document.createElement("img");
  img.src = src;
  img.className = "key-popup"; // gleiche CSS/Animation wie Schlüssel damit man keine neue CSS braucht

  // Position relativ zum #game Container (gleich wie showKeyPopup)
  const playerRect = player.getBoundingClientRect();
  const gameRect = game.getBoundingClientRect();

  img.style.left =
    (playerRect.left - gameRect.left) + (playerRect.width / 2) - 20 + "px";
  img.style.top =
    (playerRect.top - gameRect.top) - 45 + "px";

  game.appendChild(img);
  setTimeout(() => img.remove(), ms);
}
window.showItemPopup = showItemPopup;

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

  function removeAllFullDecos() {
    document.querySelectorAll(".full-deco").forEach(el => el.remove());
  }

  function renderFullDecosFromV(level, ctx) {
    const L = level || window.LEVEL2;
    if (!L || !L.fullConfig || !L.fullConfig.enabled) return;

    removeAllFullDecos();

    const tileSize = L.tileSize || 32;
    const cfg = L.fullConfig;

    const host =
      document.getElementById("gameContainer") ||
      document.querySelector("canvas")?.parentElement ||
      document.body;

    const hostStyle = getComputedStyle(host);
    if (hostStyle.position === "static") host.style.position = "relative";

    for (let ty = 0; ty < L.rows; ty++) {
      const row = L.walls?.[ty] || "";
      for (let tx = 0; tx < L.cols; tx++) {
        if (row[tx] !== "V") continue;

        const el = document.createElement("img");
        el.className = "full-deco";
        el.src = cfg.sprite;
        el.alt = "full";

        el.style.position = "absolute";
        el.style.left = `${tx * tileSize + (cfg.ox || 0)}px`;
        el.style.top  = `${ty * tileSize + (cfg.oy || 0)}px`;

        if (cfg.wTiles) el.style.width = `${cfg.wTiles * tileSize}px`;
        if (cfg.hTiles) el.style.height = `${cfg.hTiles * tileSize}px`;

        el.style.transformOrigin = "top left";
        el.style.transform = `scale(${cfg.scale ?? 1})`;

        el.style.transformOrigin = "top left";
        el.style.transform = `scale(${cfg.scale ?? 1})`;

        el.style.pointerEvents = "none";
        el.style.imageRendering = "pixelated";
        el.style.zIndex = cfg.behindPlayer ? "2" : "20";

        host.appendChild(el);
      }
    }
  }

  function triggerPhase6Transition(ctx) {
    // Wenn dein game.js eine Fade-Funktion hat, nutze sie (falls vorhanden)
    if (ctx && typeof ctx.fadeToBlack === "function") {
      ctx.fadeToBlack(700, () => {
        phase = 6;
        applyPhase6WorldChanges(ctx?.level, ctx);
        renderFullDecosFromV(ctx?.level, ctx);
      });
      return;
    }

  // Exit freischalten (unsichtbare Wand entfernen)
  unlockBossExit(currentLevel);

  bossChest.el.remove();
  bossChest = null;
  return;
}


  // 0b) P-Truhe (Gun) öffnen
  // P-Truhe in Reichweite finden (max 1 Tile Entfernung)
if (!HAS_GUN) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ntx = tx + dx;
      const nty = ty + dy;
      if (getTileAt(currentLevel, ntx, nty) === "P") {
        pickupGunFromChest(currentLevel, ntx, nty);
        return;
      }
    }
  }
}


    setTimeout(() => {
      phase = 6;
      applyPhase6WorldChanges(ctx?.level, ctx);
      renderFullDecosFromV(ctx?.level, ctx);

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

    if (phase === 2) {
      const steps = [
        { expected: "4", text: "Widerstand repariert", lockPlayer: true },
        { expected: "5", text: "Leitungen überprüft", lockPlayer: true },
        { expected: "6", text: "Sicherung repariert", lockPlayer: true }
      ];

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

      if (tile !== current.expected) {
        msg(ctx.showTempMessage, "Kurzschluss", {lockPlayer: true});
        resetFuseSequence();
        return;
      }

      msg(ctx.showTempMessage, current.text, 300, { lockPlayer: true });

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

  const el = spawnChestAtTile(tx, ty, { className: "boss-chest", z: 6, scale: 3 });
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

      if (!itemHeld) {
        if (pendingPickup !== tile) {
          pendingPickup = tile;
          if (tile === "I") return msg(ctx.showTempMessage, "Gummistiefel ?!...mitnehmen?",{lockPlayer: true});
          if (tile === "2") return msg(ctx.showTempMessage, "Heu?!...mitnehmen",{lockPlayer: true});
          if (tile === "3") return msg(ctx.showTempMessage, "Karotten?!...mitnehmen",{lockPlayer: true});
          return;
        } else {
          itemHeld = candidate;
          pendingPickup = null;

          // Popup-Bild über Player anzeigen
          if (typeof window.showItemPopup === "function") {
            if (tile === "I") window.showItemPopup("assets/gummi.png");
            if (tile === "2") window.showItemPopup("assets/heu.png");
            if (tile === "3") window.showItemPopup("assets/Karotten.png");
          }

          if (tile === "I") return msg(ctx.showTempMessage, "Gummistiefel genommen");
          if (tile === "2") return msg(ctx.showTempMessage, "Heu genommen");
          if (tile === "3") return msg(ctx.showTempMessage, "Karotten genommen");
          return;
        }
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

    if (phase === 1) {
      msg(ctx.showTempMessage, "Muh...Bin bereit, aber maschine kaputt",{lockPlayer: true});
      phase = 2;
      resetFuseSequence();
      resetPendingPickup();
      return;
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
player.style.animation = "";

    if (phase === 3) {
      msg(ctx.showTempMessage, "Muh.. bin hungrig vom warten",{lockPlayer: true});
      phase = 4;
      itemHeld = null;
      resetPendingPickup();
      return;
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

      if (itemHeld === "hay") {
        msg(ctx.showTempMessage, "Das sieht lecker aus .......", { lockPlayer: true });

        setTimeout(() => {
        msg(
         ctx.showTempMessage,
        "Nun ist alles bereit, aktiviere das System",
        { lockPlayer: true }
         );

        phase = 5;
        itemHeld = null;
        resetPendingPickup();
        resetSysSequence();
        }, 2000); // kleine Pause zwischen den Texten

      return;
      }

    }
  }

  // WICHTIG: Loop immer weiter laufen lassen
  requestAnimationFrame(update);
}

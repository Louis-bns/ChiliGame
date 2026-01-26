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
 
flags: {
  uUnlocked: false,     // U bleibt solid bis N nach Phase6 triggert
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
 
  return false;
},
 
    checkTriggers(playerTx, playerTy, ctx) {
      const t = this.getTile(playerTx, playerTy);
      const key = `${t}:${playerTx},${playerTy}`;
      if (this._spentTriggers.has(key)) return;
 
      if ([1, 2, 3, 4, 5].includes(phase) && t === "N") {
  this._spentTriggers.add(key);
  if (ctx?.showTempMessage) msg(ctx.showTempMessage, "ohne hack nicht weiter");
  return;
}
 
// N nach der Schwarzblende: neue Message + U freischalten
if (phase >= 6 && t === "N") {
  this._spentTriggers.add(key);
 
 
 
  if (ctx?.showTempMessage) {
    msg(ctx.showTempMessage, "Sammle das Hack ein");
  }
  return;
}
<<<<<<< HEAD

// N nach der Schwarzblende: neue Message + U freischalten
if (phase >= 6 && t === "N") {
  this._spentTriggers.add(key);

 

  if (ctx?.showTempMessage) {
    msg(ctx.showTempMessage, "Collect the ground beef");
  }
  return;
}
    },

    interactions: {
      "F": (ctx) => msg(ctx.showTempMessage, "damaged"),

=======
    },
 
    interactions: {
      "F": (ctx) => msg(ctx.showTempMessage, "Förderband kaputt"),
 
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
      "M": (ctx) => {
        if (phase === 1) return msg(ctx.showTempMessage, "The machine appears to be demaged ...");
        if (phase === 2) return msg(ctx.showTempMessage, "Something is wrong with the fuse boxes.");
        if (phase === 3) return msg(ctx.showTempMessage, "Repaired and ready");
        if (phase === 4 || phase === 5) return msg(ctx.showTempMessage, "Repaired and ready");
        return;
      },
 
      "A": (ctx) => {
        if (phase >= 6) return;
        if (phase === 5) {
          if (sysStep !== 0) {
            msg(ctx.showTempMessage, "Error 404---Interruption");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Machine activated");
          sysStep = 1;
          return;
        }
        msg(ctx.showTempMessage, "A Computer");
      },
 
      "B": (ctx) => {
        if (phase >= 6) return;
        if (phase === 5) {
          if (sysStep !== 1) {
            msg(ctx.showTempMessage, "Error 404---Interruption");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Cow integrated");
          sysStep = 2;
          return;
        }
        msg(ctx.showTempMessage, "A Computer");
      },
 
      "C": (ctx) => {
        if (phase >= 6) return;
 
        if (phase === 5) {
          if (sysStep !== 2) {
            msg(ctx.showTempMessage, "Error 404---Interruption");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Container initialized");
          sysStep = 3;
 
          // NEU: Schwarzblende + Phase6 + Kuh-Sprite swap
          triggerPhase6Transition(ctx);
          return;
        }
<<<<<<< HEAD

        msg(ctx.showTempMessage, "A Computer");
=======
 
        msg(ctx.showTempMessage, "Ein Computer");
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
      },
 
      // Container (H) - NEU: ab Phase 6 "voll mit hack"
      "H": (ctx) => {
  if (phase < 6) {
    return msg(ctx.showTempMessage, "Container empty");
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
<<<<<<< HEAD

=======
 
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
    // Liste2
    if (typeof window.setListStep === "function") {
      window.setListStep(2);
    } else if (typeof setListStep === "function") {
      setListStep(2);
    }
<<<<<<< HEAD

    return msg(ctx.showTempMessage, "Ground beef collected");
  }

  return msg(ctx.showTempMessage, "full of ground beef");
},

      "I": (ctx) => handleItemInteract(ctx, "I"),
      "2": (ctx) => handleItemInteract(ctx, "2"),
      "3": (ctx) => handleItemInteract(ctx, "3"),

      "4": (ctx) => handleFuseInteract(ctx, "4"),
      "5": (ctx) => handleFuseInteract(ctx, "5"),
      "6": (ctx) => handleFuseInteract(ctx, "6"),

      "k": (ctx) => handleCowInteract(ctx),
      "K": (ctx) => handleCowInteract(ctx),

      "8": (ctx) => {
        if (phase >= 6) return;
        if (phase === 1) msg(ctx.showTempMessage, "you can't pass without some ground beef");
      }
    }
  };

=======
 
    return msg(ctx.showTempMessage, "Hack eingesammelt");
  }
 
  return msg(ctx.showTempMessage, "voll mit hack");
},
 
      "I": (ctx) => handleItemInteract(ctx, "I"),
      "2": (ctx) => handleItemInteract(ctx, "2"),
      "3": (ctx) => handleItemInteract(ctx, "3"),
 
      "4": (ctx) => handleFuseInteract(ctx, "4"),
      "5": (ctx) => handleFuseInteract(ctx, "5"),
      "6": (ctx) => handleFuseInteract(ctx, "6"),
 
      "k": (ctx) => handleCowInteract(ctx),
      "K": (ctx) => handleCowInteract(ctx),
 
      "8": (ctx) => {
        if (phase >= 6) return;
        if (phase === 1) msg(ctx.showTempMessage, "ohne hack nicht weiter");
      }
    }
  };
 
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
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
 
  function resetPendingPickup() { pendingPickup = null; }
  function resetFuseSequence() { fuseStep = 0; }
  function resetSysSequence() { sysStep = 0; }
 
  function applyPhase6WorldChanges(level, ctx) {
  const L = level || window.LEVEL2;
  if (!L) return;
 
  if (L.cowConfig) L.cowConfig.enabled = false;
  if (L.cows) L.cows.cow = false;
 
  if (Array.isArray(L.walls)) {
    L.walls = L.walls.map(row => row.replace(/k/g, "0").replace(/K/g, "0"));
  }
 
  if (ctx && typeof ctx.removeAllCowDecos === "function") {
    ctx.removeAllCowDecos();
  } else {
    document.querySelectorAll(".cow-deco").forEach(el => el.remove());
  }
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
 
    // Fallback: Overlay-DIV über dem Canvas
    const id = "lvlFadeOverlay";
    let ov = document.getElementById(id);
    if (!ov) {
      ov = document.createElement("div");
      ov.id = id;
      ov.style.position = "fixed";
      ov.style.left = "0";
      ov.style.top = "0";
      ov.style.width = "100vw";
      ov.style.height = "100vh";
      ov.style.background = "black";
      ov.style.opacity = "0";
      ov.style.pointerEvents = "none";
      ov.style.zIndex = "999999";
      ov.style.transition = "opacity 700ms linear";
      document.body.appendChild(ov);
    }
 
    requestAnimationFrame(() => {
      ov.style.opacity = "1";
    });
 
    setTimeout(() => {
      phase = 6;
      applyPhase6WorldChanges(ctx?.level, ctx);
      renderFullDecosFromV(ctx?.level, ctx);
 
      // kurz schwarz lassen, dann wieder aufblenden
      setTimeout(() => {
        ov.style.opacity = "0";
      }, 250);
    }, 720);
  }
 
  function handleFuseInteract(ctx, tile) {
    if (phase >= 6) return;
 
    if (phase === 1) {
      msg(ctx.showTempMessage, "Ein Sicherungskasten....");
      return;
    }
<<<<<<< HEAD
  }
  return false;
}
      // kurz schwarz lassen, dann wieder aufblenden
      setTimeout(() => {
        ov.style.opacity = "0";
      }, 250);
    }, 720);
  }

  function handleFuseInteract(ctx, tile) {
    if (phase >= 6) return;

    if (phase === 1) {
      msg(ctx.showTempMessage, "A fuse box....");
      return;
    }

=======
 
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
    if (phase === 2) {
      const steps = [
        { expected: "4", text: "Resistance repaired", lockPlayer: true },
        { expected: "5", text: "Lines checked", lockPlayer: true },
        { expected: "6", text: "Fuse fixed", lockPlayer: true }
      ];
 
      const current = steps[fuseStep];
 
      if (tile !== current.expected) {
        msg(ctx.showTempMessage, "Short circuit", {lockPlayer: true});
        resetFuseSequence();
        return;
      }
 
      msg(ctx.showTempMessage, current.text, 300, { lockPlayer: true });
<<<<<<< HEAD

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
      fuseStep++;

      if (fuseStep >= steps.length) {
        setTimeout(() => {
          msg(ctx.showTempMessage, "Machine lights up");
        }, 600);

        phase = 3;
        resetFuseSequence();
      }

      return;
    }
  }

  function handleItemInteract(ctx, tile) {
    if (phase >= 6) return;

    if (phase === 1 || phase === 2 || phase === 3) {
      if (tile === "I") return msg(ctx.showTempMessage, "Rubber boots?!");
      if (tile === "2") return msg(ctx.showTempMessage, "Hay?!");
      if (tile === "3") return msg(ctx.showTempMessage, "Carrots?!");
      return;
    }

    if (phase === 5) {
      return msg(ctx.showTempMessage, "Empty");
    }

    if (phase === 4) {
      const candidate = tileToItem(tile);

      if (itemHeld) {
        msg(ctx.showTempMessage, "Your bag is full");
        resetPendingPickup();
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
=======
 
      fuseStep++;
 
      if (fuseStep >= steps.length) {
        setTimeout(() => {
          msg(ctx.showTempMessage, "Maschine leuchtet");
        }, 600);
 
        phase = 3;
        resetFuseSequence();
      }
 
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
      return;
    }
  }
 
  function handleItemInteract(ctx, tile) {
    if (phase >= 6) return;
 
    if (phase === 1 || phase === 2 || phase === 3) {
      if (tile === "I") return msg(ctx.showTempMessage, "Gummistiefel?!");
      if (tile === "2") return msg(ctx.showTempMessage, "Heu?!");
      if (tile === "3") return msg(ctx.showTempMessage, "Karotten?!");
      return;
    }
 
    if (phase === 5) {
      return msg(ctx.showTempMessage, "leer");
    }
 
    if (phase === 4) {
      const candidate = tileToItem(tile);
 
      if (itemHeld) {
        msg(ctx.showTempMessage, "Tasche voll");
        resetPendingPickup();
        return;
      }
 
      if (!itemHeld) {
        if (pendingPickup !== tile) {
          pendingPickup = tile;
          if (tile === "I") return msg(ctx.showTempMessage, "Rubber boots ?!...take along?",{lockPlayer: true});
          if (tile === "2") return msg(ctx.showTempMessage, "Hay?!...take along?",{lockPlayer: true});
          if (tile === "3") return msg(ctx.showTempMessage, "Carrots?!...take laong?",{lockPlayer: true});
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
<<<<<<< HEAD

          if (tile === "I") return msg(ctx.showTempMessage, "Rubber boots taken");
          if (tile === "2") return msg(ctx.showTempMessage, "Hayeu taken");
          if (tile === "3") return msg(ctx.showTempMessage, "Carrots taken");
=======
 
          if (tile === "I") return msg(ctx.showTempMessage, "Gummistiefel genommen");
          if (tile === "2") return msg(ctx.showTempMessage, "Heu genommen");
          if (tile === "3") return msg(ctx.showTempMessage, "Karotten genommen");
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
          return;
        }
      }
    }
  }
 
  function handleCowInteract(ctx) {
    if (phase >= 6) return;
 
    if (phase === 1) {
      msg(ctx.showTempMessage, "Moo...I am ready, but the machine isn't working",{lockPlayer: true});
      phase = 2;
      resetFuseSequence();
      resetPendingPickup();
      return;
    }
<<<<<<< HEAD

    if (phase === 2) {
      msg(ctx.showTempMessage, "Machine needs to be repaired");
      return;
    const hitOX = (player.clientWidth - PLAYER_HIT.w) / 2;
    const hitOY = (player.clientHeight - PLAYER_HIT.h) / 2;

    const canMoveTo = (nx, ny) =>
      !rectIntersectsWall(nx + hitOX, ny + hitOY, PLAYER_HIT.w, PLAYER_HIT.h);

    if (vx) {
      const nx = px + vx;
      if (canMoveTo(nx, py)) px = nx;
=======
 
    if (phase === 2) {
      msg(ctx.showTempMessage, "Maschine muss repariert werden");
      return;
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
    }
 
    if (phase === 3) {
      msg(ctx.showTempMessage, "Moo... I'm hungry from waiting.",{lockPlayer: true});
      phase = 4;
      itemHeld = null;
      resetPendingPickup();
      return;
    }
<<<<<<< HEAD
  }

    if (phase === 4) {
      if (!itemHeld) {
        msg(ctx.showTempMessage, "Moo... I'm hungry from waiting.");
        return;
      }
  const tileHere = getTileAt(currentLevel, ptx, pty);

  if (tileHere === "Z" && window.LEVEL2 && currentLevel.id === "level1") {
    loadLevel(window.LEVEL2);
    requestAnimationFrame(update);
    return;
  }

      if (itemHeld === "boots") {
        msg(ctx.showTempMessage, "Moo..what should I do with that?");
=======
 
    if (phase === 4) {
      if (!itemHeld) {
        msg(ctx.showTempMessage, "Muh.. bin hungrig vom warten");
        return;
      }
 
      if (itemHeld === "boots") {
        msg(ctx.showTempMessage, "Was soll ich damit ");
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
        itemHeld = null;
        resetPendingPickup();
        return;
      }
<<<<<<< HEAD
  if (tileHere === "Y" && window.LEVEL3 && currentLevel.id === "level2") {
    loadLevel(window.LEVEL3);
    requestAnimationFrame(update);
    return;
  }

      if (itemHeld === "carrots") {
        msg(ctx.showTempMessage, "Moo... I don't like those");
=======
 
      if (itemHeld === "carrots") {
        msg(ctx.showTempMessage, "Ne mag ich nicht");
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
        itemHeld = null;
        resetPendingPickup();
        return;
      }
<<<<<<< HEAD
  // Level 3 -> Level 4 (du nutzt jetzt "Q")
  if (tileHere === "Q" && window.LEVEL4 && currentLevel.id === "level3") {
    loadLevel(window.LEVEL4);
    requestAnimationFrame(update);
    return;
  }

      if (itemHeld === "hay") {
        msg(ctx.showTempMessage, "Moo...that looks delicious", { lockPlayer: true });

=======
 
      if (itemHeld === "hay") {
        msg(ctx.showTempMessage, "Das sieht lecker aus .......", { lockPlayer: true });
 
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1
        setTimeout(() => {
        msg(
         ctx.showTempMessage,
        "Everything is now ready, activate the system.",
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
 
    if (phase === 5) {
      msg(ctx.showTempMessage, "Computer starten das System");
      return;
    }
  }
<<<<<<< HEAD

    if (phase === 5) {
      msg(ctx.showTempMessage, "The computers start the system");
      return;
    }
  }
})();
  // WICHTIG: Loop immer weiter laufen lassen
  requestAnimationFrame(update);
}
=======
})();
 
>>>>>>> dfbc466d93957d84f00889176197f400a2a876f1

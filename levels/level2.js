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

    cows: { cow: true },

    enemies: { bat: true, wolf: false },

    renderWalls: false,

    walls: [
      "000000000000000000000000000000000000000000000",
      "001111111111111111111111111111111111111111100",
      "00133220II000000000000000666000000MMMMMMMM100",
      "00133220II000000000000000666000000MMMMMMMM100",
      "00133220II000000000000000666000000MMMMMMMM100",
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
      "0010HHHHHH000000000000000000000000000000NNUY0",
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

        if (ctx?.showTempMessage) {
          msg(ctx.showTempMessage, "You forgot the ground Beef!");
        }
      }
    },

    interactions: {

      "M": (ctx) => {
        if (phase === 1) return msg(ctx.showTempMessage, "Machine seems broken...");
        if (phase === 2) return msg(ctx.showTempMessage, "Something is wrong with the fuses...");
        if (phase === 3) return msg(ctx.showTempMessage, "Repared and ready!");
        if (phase === 4 || phase === 5) return msg(ctx.showTempMessage, "Repared and ready!");
        return;
      },

      "A": (ctx) => {
        if (phase >= 6) return;
        if (phase === 5) {
          if (sysStep !== 0) {
            msg(ctx.showTempMessage, "Error 404---restart.");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Machine activated.");
          sysStep = 1;
          return;
        }
        msg(ctx.showTempMessage, "Computer.");
      },

      "B": (ctx) => {
        if (phase >= 6) return;
        if (phase === 5) {
          if (sysStep !== 1) {
            msg(ctx.showTempMessage, "Error 404---restart.");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Cow integrated.");
          sysStep = 2;
          return;
        }
        msg(ctx.showTempMessage, "Computer.");
      },

      "C": (ctx) => {
        if (phase >= 6) return;

        if (phase === 5) {
          if (sysStep !== 2) {
            msg(ctx.showTempMessage, "Error 404---restart.");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Sytem initialized.");
          sysStep = 3;

          // NEU: Schwarzblende + Phase6 + Kuh-Sprite swap
          triggerPhase6Transition(ctx);
          return;
        }

        msg(ctx.showTempMessage, "Computer.");
      },

      // Container (H) - NEU: ab Phase 6 "voll mit hack"
      "H": (ctx) => {
        if (phase >= 6) return msg(ctx.showTempMessage, "Loaded with lots of ground Beef!");
        return msg(ctx.showTempMessage, "Container leer");
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
        if (phase === 1) msg(ctx.showTempMessage, "You forgot the ground Beef!");
      }
    }
  };

  /* =========================================================
     PHASEN-LOGIK
     ========================================================= */
  let phase = 1;

  let fuseStep = 0;
  let itemHeld = null;
  let pendingPickup = null;
  let sysStep = 0;

  function msg(showTempMessage, text, duration = 2200, extra = {}) {
    showTempMessage(text, duration, {
      x: "50%",
      y: "50%",
      center: true,
      typewriter: true,
      charDelay: 26,
      ...extra
    });
  }

  function tileToItem(tile) {
    if (tile === "I") return "Boots";
    if (tile === "2") return "Hay";
    if (tile === "3") return "Carrots";
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

  function triggerPhase6Transition(ctx) {
    // Wenn dein game.js eine Fade-Funktion hat, nutze sie (falls vorhanden)
    if (ctx && typeof ctx.fadeToBlack === "function") {
      ctx.fadeToBlack(700, () => {
        phase = 6;
        applyPhase6WorldChanges(ctx?.level, ctx);
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

      // kurz schwarz lassen, dann wieder aufblenden
      setTimeout(() => {
        ov.style.opacity = "0";
      }, 250);
    }, 720);
  }

  function handleFuseInteract(ctx, tile) {
    if (phase >= 6) return;

    if (phase === 1) {
      msg(ctx.showTempMessage, "Fuse box...");
      return;
    }

    if (phase === 2) {
      const steps = [
        { expected: "4", text: "Resistance repaired.", duration: 1000 },
        { expected: "5", text: "Line checked.", duration: 1000 },
        { expected: "6", text: "Fuse repaired.", duration: 1000 }
      ];

      const current = steps[fuseStep];

      if (tile !== current.expected) {
        msg(ctx.showTempMessage, "Short circuit...");
        resetFuseSequence();
        return;
      }

      msg(ctx.showTempMessage, current.text, current.duration ?? 2200);

      fuseStep++;

      if (fuseStep >= steps.length) {
        setTimeout(() => {
          msg(ctx.showTempMessage, "Machine illuminates.");
        }, 1200);

        phase = 3;
        resetFuseSequence();
      }

      return;
    }
  }

  function handleItemInteract(ctx, tile) {
    if (phase >= 6) return;

    if (phase === 1 || phase === 2 || phase === 3) {
      if (tile === "I") return msg(ctx.showTempMessage, "Boots?!");
      if (tile === "2") return msg(ctx.showTempMessage, "Hay?!");
      if (tile === "3") return msg(ctx.showTempMessage, "Carrots?!");
      return;
    }

    if (phase === 5) {
      return msg(ctx.showTempMessage, "empty...");
    }

    if (phase === 4) {
      const candidate = tileToItem(tile);

      if (itemHeld) {
        msg(ctx.showTempMessage, "Backpack is full...");
        resetPendingPickup();
        return;
      }

      if (!itemHeld) {
        if (pendingPickup !== tile) {
          pendingPickup = tile;
          if (tile === "I") return msg(ctx.showTempMessage, "Boots, press 'Space' to collect.");
          if (tile === "2") return msg(ctx.showTempMessage, "Hay, press 'Space' to collect.");
          if (tile === "3") return msg(ctx.showTempMessage, "Carrots, press 'Space' to collect.");
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

          if (tile === "I") return msg(ctx.showTempMessage, "Boots collected.");
          if (tile === "2") return msg(ctx.showTempMessage, "Hay collected.");
          if (tile === "3") return msg(ctx.showTempMessage, "Carrots collected.");
          return;
        }
      }
    }
  }

  function handleCowInteract(ctx) {
    if (phase >= 6) return;

    if (phase === 1) {
      msg(ctx.showTempMessage, "Muh...I'm ready, but the machine seems broken.");
      phase = 2;
      resetFuseSequence();
      resetPendingPickup();
      return;
    }

    if (phase === 2) {
      msg(ctx.showTempMessage, "Machine must be repaired");
      return;
    }

    if (phase === 3) {
      msg(ctx.showTempMessage, "Muh.. I'm hungry...");
      phase = 4;
      itemHeld = null;
      resetPendingPickup();
      return;
    }

    if (phase === 4) {
      if (!itemHeld) {
        msg(ctx.showTempMessage, "Muh.. I'm hungry...");
        return;
      }

      if (itemHeld === "boots") {
        msg(ctx.showTempMessage, "What's that for???");
        itemHeld = null;
        resetPendingPickup();
        return;
      }

      if (itemHeld === "carrots") {
        msg(ctx.showTempMessage, "Nah... I don't like that...");
        itemHeld = null;
        resetPendingPickup();
        return;
      }

      if (itemHeld === "hay") {
        msg(ctx.showTempMessage, "Mhhhh... that's nice! Now I'm ready... activate the System!");
        phase = 5;
        itemHeld = null;
        resetPendingPickup();
        resetSysSequence();
        return;
      }
    }

    if (phase === 5) {
      msg(ctx.showTempMessage, "Computer starting the System.");
      return;
    }
  }
})();
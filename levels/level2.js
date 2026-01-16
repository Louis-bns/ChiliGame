(function () {
  window.LEVEL2 = {
    id: "level2",
    cols: 45,
    rows: 45,
    tileSize: 32,

    background: "assets/LEVEL2.png",

    // Spawnchar für Level2 ist "Z"
    spawnChar: "Z",
    // optionaler Fallback-Spawn (falls Z mal fehlt)
    spawn: { tx: 25, ty: 42 },

    // Gegner-Konfig (wird nur genutzt wenn enemies.* true ist UND Marker im Grid existieren)
    enemyConfig: {
      wolf: {
        mode: "patrolX",
        distance: 10,
        speed: 1.4,
        scale: 4
      },
      bat: {
        mode: "infinity",
        a: 8000,
        b: 5000,
        speed: 0.01,
        scale: 0.9
      }
    },

    // NEU: Kuh-Konfig (Deko, ohne Hitbox), wird auf jedem "K" Tile gerendert
cowConfig: {
  enabled: true,
  sprite: "assets/Cow.png",

  // wie Koch/Bat/Granny
  frameW: 96,
  frameH: 128,

  // optional: falls du es explizit willst (sonst wird es automatisch berechnet)
  sheetW: 384,
  sheetH: 256,

  animDur: 0.8,
  scale: 1,          // wenn sie exakt so groß wie Bat sein soll -> 1
  ox: 0,
  oy: 0,
  behindPlayer: true
},

    // Toggle wie bei enemies
    cows: {
      cow: true
    },

    // ACHTUNG: In deinem game.js ist "F" Bat-Spawnmarker.
    // Wenn du "F" als Förderband im Level nutzen willst, dann muss bat:false bleiben.
    enemies: {
      bat: true,
      wolf: false,
    },

    renderWalls: true,

    walls: [
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "000000000000000000000000000000000000000000000",
      "001111111100001111111000011111110001111111100",
      "0010000001k0000000001111110000000000000000100",
      "0010000001k0000000000000000000000000000000100",
      "0010000001k0000000000000000000000000000000100",
      "001000K001k0000000000000000000000000000000100",
      "0011111111k0000000000000000000000000000000100",
      "001kkkkkkkk0000000001000001000000000000000100",
      "001000000000001111111000001111110001111111100",
      "001000000000001000000000000000000000000000100",
      "001000000000001000000000000000000000000000100",
      "001000000000001000000000000000000000000000100",
      "001000000000001000000000000000000000000000100",
      "001000000000001000000000000000000000000000100",
      "001000000000001000000000000000000000000000100",
      "001111111100001111110000000000000000000001100",
      "001000000000000000000000000000000000000000100",
      "001000000000000000000000000000000000000000001",
      "00100000000000000000000000000F000000000000100",
      "001000000000000000000000000000000000000000000",
      "001000000000000000000000000000000000000000000",
      "001000000000000000000000000000000000000000111",
      "111111111111111111111000011111111111111111111",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "1000000000000000000000000Z0000000000000000001",
      "100000000000000000000000000000000000000000001",
      "111111111111111111111111111111111111111111111",
    ],

    _spentTriggers: new Set(),

    flags: {
      // hier kannst du später etwas persistent speichern – analog zu Level1
    },

    getTile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return "1";
      const row = this.walls[ty];
      if (!row) return "1";
      return row[tx] ?? "1";
    },

    // SOLID LOGIK:
    // - "1" immer Wand
    // - "W" ist unsichtbare Wand bis Phase 6, danach passierbar
    isSolid(tx, ty) {
      const t = this.getTile(tx, ty);
      if (t === "1") return true;
      if (t === "U" && phase < 6) return true;
      return false;
    },

    checkTriggers(playerTx, playerTy) {
      const t = this.getTile(playerTx, playerTy);

      // optional: damit Trigger nicht spammt (wie Level1)
      const key = `${t}:${playerTx},${playerTy}`;
      if (this._spentTriggers.has(key)) return;

      // Phase 1: Wenn 8 berührt -> Text (einmalig)
      if (phase === 1 && t === "8") {
        this._spentTriggers.add(key);
        showTempMessage("ohne hack nicht weiter", 2200, { typewriter: false, x: "50%", y: "15%", center: true });
      }
    },

    interactions: {
      // Förderband
      "F": (ctx) => msg(ctx.showTempMessage, "Förderband kaputt"),

      // Maschine
      "M": (ctx) => {
        if (phase === 1) return msg(ctx.showTempMessage, "Maschie ist wohl kaputt ...");
        if (phase === 2) return msg(ctx.showTempMessage, "Irgendwas stimmt mit den Sicherungen nicht.");
        if (phase === 3) return msg(ctx.showTempMessage, "Repariert und bereit");
        if (phase === 4 || phase === 5) return msg(ctx.showTempMessage, "Repariert und bereit");
        return;
      },

      // Computer A/B/C
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
          msg(ctx.showTempMessage, "Förderband initialisiert");
          sysStep = 3;

          phase = 6;
          return;
        }

        msg(ctx.showTempMessage, "Ein Computer");
      },

      // Container (H)
      "H": (ctx) => {
        if (phase >= 6) return;
        return msg(ctx.showTempMessage, "Container leer");
      },

      // Items
      "I": (ctx) => handleItemInteract(ctx, "I"),
      "2": (ctx) => handleItemInteract(ctx, "2"),
      "3": (ctx) => handleItemInteract(ctx, "3"),

      // Sicherungen
      "4": (ctx) => handleFuseInteract(ctx, "4"),
      "5": (ctx) => handleFuseInteract(ctx, "5"),
      "6": (ctx) => handleFuseInteract(ctx, "6"),

      // Kuh
      "K": (ctx) => handleCowInteract(ctx),

      // Event Tile 8 per Interact (zusätzlich zu Trigger)
      "8": (ctx) => {
        if (phase >= 6) return;
        if (phase === 1) msg(ctx.showTempMessage, "ohne hack nicht weiter");
      }
    },
  };

  /* =========================================================
     PHASEN-LOGIK (wie vorher – nur unterhalb, wie Level1-Style)
     ========================================================= */
  let phase = 1;

  let fuseStep = 0; // 0=noch nicht begonnen, 1=4 ok, 2=5 ok, 3=6 ok -> phase3
  let itemHeld = null; // null | "boots" | "hay" | "carrots"
  let pendingPickup = null; // "I"|"2"|"3"|null
  let sysStep = 0; // 0=noch nicht begonnen, 1=A ok, 2=B ok, 3=C ok -> phase6

  function msg(showTempMessage, text) {
    showTempMessage(text, 2200, { typewriter: false, x: "50%", y: "15%", center: true });
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

  function handleFuseInteract(ctx, tile) {
    if (phase >= 6) return;

    if (phase === 1) {
      msg(ctx.showTempMessage, "Ein Sicherungskasten....");
      return;
    }

    if (phase === 2) {
      const expected = fuseStep === 0 ? "4" : fuseStep === 1 ? "5" : "6";

      if (tile !== expected) {
        msg(ctx.showTempMessage, "Kurzschluss");
        resetFuseSequence();
        return;
      }

      msg(ctx.showTempMessage, "Sicherung repariert");
      fuseStep++;

      if (fuseStep >= 3) {
        phase = 3;
        resetFuseSequence();
      }
      return;
    }
  }

  function handleItemInteract(ctx, tile) {
    if (phase >= 6) return;

    if (phase === 1) {
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
          if (tile === "I") return msg(ctx.showTempMessage, "Gummistiefel ?!...mitnehmen?");
          if (tile === "2") return msg(ctx.showTempMessage, "Heu?!...mitnehmen");
          if (tile === "3") return msg(ctx.showTempMessage, "KArotten?!...mitnehmen");
          return;
        } else {
          itemHeld = candidate;
          pendingPickup = null;

          if (tile === "I") return msg(ctx.showTempMessage, "Gummistiefel genommen");
          if (tile === "2") return msg(ctx.showTempMessage, "Heu genommen");
          if (tile === "3") return msg(ctx.showTempMessage, "Karotten genommen");
          return;
        }
      }
    }
  }

  function handleCowInteract(ctx) {
    if (phase >= 6) return;

    if (phase === 1) {
      msg(ctx.showTempMessage, "Muh...Bin bereit, aber maschine kaputt");
      phase = 2;
      resetFuseSequence();
      resetPendingPickup();
      return;
    }

    if (phase === 2) {
      msg(ctx.showTempMessage, "Maschine muss repariert werden");
      return;
    }

    if (phase === 3) {
      msg(ctx.showTempMessage, "Muh.. bin hungrig vom warten");
      phase = 4;
      itemHeld = null;
      resetPendingPickup();
      return;
    }

    if (phase === 4) {
      if (!itemHeld) {
        msg(ctx.showTempMessage, "Muh.. bin hungrig vom warten");
        return;
      }

      if (itemHeld === "boots") {
        msg(ctx.showTempMessage, "Was soll ich damit ");
        itemHeld = null;
        resetPendingPickup();
        return;
      }

      if (itemHeld === "carrots") {
        msg(ctx.showTempMessage, "Ne mag ich nicht");
        itemHeld = null;
        resetPendingPickup();
        return;
      }

      if (itemHeld === "hay") {
        msg(ctx.showTempMessage, "Das sieht lecker aus ....... Nun ist alles bereit, aktiviere das System");
        phase = 5;
        itemHeld = null;
        resetPendingPickup();
        resetSysSequence();
        return;
      }
    }

    if (phase === 5) {
      msg(ctx.showTempMessage, "Computer starten das System");
      return;
    }
  }
})();

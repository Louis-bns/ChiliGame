// levels/level2.js
(() => {
  // =========================================================
  // LEVEL 2 – Platzhalter-Grid (du passt es später an)
  // 0 = begehbar
  // 1 = Wand (sichtbar wenn debugWalls=true)
  //
  // Spezial-Tiles :
  // Z = Spawn (Level2 spawnChar)
  // 8 = Event-Tile ("ohne hack nicht weiter") – in Phase 6 deaktiviert
  // A,B,C = Computer
  // H = Container (statt C)
  // F = Förderband
  // M = Maschine
  // K = Kuh
  // I,2,3 = Items
  // 4,5,6 = Sicherungskästen
  // =========================================================

  const TILE = 32;

  // Hilfsfunktion: char an Position setzen
  function setChar(grid, x, y, ch) {
    const row = grid[y];
    grid[y] = row.substring(0, x) + ch + row.substring(x + 1);
  }

  const walls = [
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
    "001000000000000000001111110000000000000000100",
    "001000000000000000000000000000000000000000100",
    "001000000000000000000000000000000000000000100",
    "001000000000000000000000000000000000000000100",
    "001000000000000000000000000000000000000000100",
    "001000000000000000001000001000000000000000100",
    "001000000000001111111000001111110001111111100",
    "001000000000001000000000000000000000000000100",
    "001000000000001000000000000000000000000000100",
    "001000000000001000000000000000000000000000100",
    "001000000000001000000000000000000000000000100",
    "001000000000001000000000000000000000000000100",
    "001000000000001000000000000000000000000000100",
    "001111111100001111110000000000000000000001100",
    "001000000000000000000000000000000000000000100",
    "001000000000000000000000000000000000000000100",
    "001000000000000000000000000000000000000000100",
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
  ];

  // Spawn setzen
  

  // =========================================================
  // PHASEN-LOGIK
  // =========================================================
  let phase = 1;

  // Phase 2: Sicherungen-Reihenfolge 4 -> 5 -> 6
  let fuseStep = 0; // 0=noch nicht begonnen, 1=4 ok, 2=5 ok, 3=6 ok -> phase3

  // Phase 4: Inventar-System
  // itemHeld: null | "boots" | "hay" | "carrots"
  let itemHeld = null;
  // "double tap" auf I/2/3: erst Nachfrage, beim direkten zweiten Mal: nehmen
  let pendingPickup = null; // "I"|"2"|"3"|null

  // Phase 5: System-Start Reihenfolge A -> B -> C
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

  function resetPendingPickup() {
    pendingPickup = null;
  }

  function resetFuseSequence() {
    fuseStep = 0;
  }

  function resetSysSequence() {
    sysStep = 0;
  }

  // =========================================================
  // LEVEL OBJEKT
  // =========================================================
  const LEVEL2 = {
    tileSize: TILE,
    background: "assets/LEVEL2.png",

    // Wände sichtbar
    debugWalls: true,

    // Spawnchar für Level2 ist "Z"
    spawnChar: "Z",

    // Keine Gegner
    enemies: {},

    walls: walls,

    // eigener Tile Zugriff
    getTile(tx, ty) {
      if (ty < 0 || tx < 0 || ty >= this.walls.length || tx >= this.walls[0].length) return "1";
      return this.walls[ty][tx];
    },

    // SOLID LOGIK:
    // - "1" immer Wand
    // - "W" ist unsichtbare Wand bis Phase 6, danach passierbar
    isSolid(tx, ty) {
      const t = this.getTile(tx, ty);
      if (t === "1") return true;
      if (t === "W" && phase < 6) return true;
      return false;
    },

    // Trigger, wenn Spieler auf ein Tile läuft
    checkTriggers(tx, ty) {
      const t = this.getTile(tx, ty);

      // Phase 1: Wenn 8 berührt -> Text
      if (phase === 1 && t === "8") {
        if (typeof LEVEL2._hud === "function") {
          LEVEL2._hud("ohne hack nicht weiter");
        }
      }
      // Phase 6: Event 8 "verschwindet" einfach, weil wir nicht mehr reagieren.
    },

    // Interaktionen: werden über game.js handleInteract() aufgerufen
    interactions: {
      // -------------------------------
      // Phase-unabhängige Objekttexte
      // -------------------------------
      "F": (ctx) => msg(ctx.showTempMessage, "Förderband kaputt"),
      "M": (ctx) => {
        if (phase === 1) return msg(ctx.showTempMessage, "Maschie ist wohl kaputt ...");
        if (phase === 2) return msg(ctx.showTempMessage, "Irgendwas stimmt mit den Sicherungen nicht.");
        if (phase === 3) return msg(ctx.showTempMessage, "Repariert und bereit");
        if (phase === 4 || phase === 5) return msg(ctx.showTempMessage, "Repariert und bereit");
        return; // Phase 6: keine Interaktion
      },

      // -------------------------------
      // Computer A, B, C (C ist NUR Computer)
      // -------------------------------
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

        // Phase 5: Reihenfolge A -> B -> C
        if (phase === 5) {
          if (sysStep !== 2) {
            msg(ctx.showTempMessage, "Error 404---Abbruch");
            resetSysSequence();
            return;
          }
          msg(ctx.showTempMessage, "Förderband initialisiert");
          sysStep = 3;

          // Phase 6 Start
          phase = 6;
          return;
        }

        // In allen anderen Phasen: nur Computer-Text
        msg(ctx.showTempMessage, "Ein Computer");
      },

      // -------------------------------
      // Container (NEU) auf H statt C
      // -------------------------------
      "H": (ctx) => {
        if (phase >= 6) return;
        // Du hattest den Container-Text vorher in Phase 1 bei C
        if (phase === 1) return msg(ctx.showTempMessage, "Container leer");
        // Optional: in anderen Phasen auch zeigen (wenn du willst)
        return msg(ctx.showTempMessage, "Container leer");
      },

      // Items 1/2/3
      "I": (ctx) => handleItemInteract(ctx, "1"),
      "2": (ctx) => handleItemInteract(ctx, "2"),
      "3": (ctx) => handleItemInteract(ctx, "3"),

      // Sicherungen 4/5/6
      "4": (ctx) => handleFuseInteract(ctx, "4"),
      "5": (ctx) => handleFuseInteract(ctx, "5"),
      "6": (ctx) => handleFuseInteract(ctx, "6"),

      // Kuh K
      "K": (ctx) => handleCowInteract(ctx),

      // Event Tile 8
      "8": (ctx) => {
        if (phase >= 6) return;
        if (phase === 1) msg(ctx.showTempMessage, "ohne hack nicht weiter");
      }
    }
  };

  // =========================================================
  // Sicherungen
  // =========================================================
  function handleFuseInteract(ctx, tile) {
    if (phase >= 6) return;

    // Phase 1: nur Text
    if (phase === 1) {
      if (tile === "4" || tile === "5" || tile === "6") {
        msg(ctx.showTempMessage, "Ein Sicherungskasten....");
      }
      return;
    }

    // Phase 2: Reihenfolge 4->5->6
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

    // Phase 3+: 4/5/6 nicht mehr möglich
    if (phase >= 3) return;
  }

  // =========================================================
  // HANDLER: Items (Phase 1/4/5)
  // =========================================================
  function handleItemInteract(ctx, tile) {
    if (phase >= 6) return;

    // Phase 1: fixe Texte
    if (phase === 1) {
      if (tile === "I") return msg(ctx.showTempMessage, "Gummistiefel?!");
      if (tile === "2") return msg(ctx.showTempMessage, "Heu?!");
      if (tile === "3") return msg(ctx.showTempMessage, "Karotten?!");
      return;
    }

    // Phase 5: Items leer
    if (phase === 5) {
      return msg(ctx.showTempMessage, "leer");
    }

    // Phase 4: aufnehmen per "zweites Mal direkt hintereinander"
    if (phase === 4) {
      const candidate = tileToItem(tile);

      // Tasche voll?
      if (itemHeld && pendingPickup === tile) {
        msg(ctx.showTempMessage, "Tasche voll");
        resetPendingPickup();
        return;
      }

      if (itemHeld && !pendingPickup) {
        msg(ctx.showTempMessage, "Tasche voll");
        resetPendingPickup();
        return;
      }

      // noch kein Item
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

  // =========================================================
  // Kuh
  // =========================================================
  function handleCowInteract(ctx) {
    if (phase >= 6) return;

    // Phase 1
    if (phase === 1) {
      msg(ctx.showTempMessage, "Muh...Bin bereit, aber maschine kaputt");
      phase = 2;
      resetFuseSequence();
      resetPendingPickup();
      return;
    }

    // Phase 2
    if (phase === 2) {
      msg(ctx.showTempMessage, "Maschine muss repariert werden");
      return;
    }

    // Phase 3
    if (phase === 3) {
      msg(ctx.showTempMessage, "Muh.. bin hungrig vom warten");
      phase = 4;
      itemHeld = null;
      resetPendingPickup();
      return;
    }

    // Phase 4: abhängig vom Item
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

    // Phase 5
    if (phase === 5) {
      msg(ctx.showTempMessage, "Computer starten das System");
      return;
    }
  }

  // Expose
  window.LEVEL2 = LEVEL2;
})();

// level1.js – 45×45 Grid
// 1 = Wand (Kollision, unsichtbar)
// 0 = frei
// 3/4 = Trigger (unsichtbar, nicht solid, nur 1x aktiv)
// 5..9 = Beispiel: Interaktionen per Leertaste (einfach erweiterbar)

(function () {
  window.LEVEL1 = {
    id: "level1",
    cols: 45,
    rows: 45,
    tileSize: 32,

    spawn: { tx: 18, ty: 16 },

    enemies: {
      bat: false
    },

    renderWalls: false,

    walls: [
      "111111111111111111111111111111111111111111111",
      "100000000000000000001000010000000000000000001",
      "100000000000000000001000010000000000000000001",
      "100000000000000000001000010000000000000000001",
      "100000000000000000001000010000000000000000001",
      "100001111111111111111000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001000011111111111111110000000000000000001",
      "100001000010000000000000000000000000000000001",
      "100001000010000000000000000000000000000000001",
      "100001000010000000000000000000000000000000001",
      "111111000011111110000000000000000000000000001",
      "100000000000000010000000000000000000000000001",
      "100000000000000010000000000000000000000000001",
      "100000000000000010000000000000000000000000001",
      "100000000000000010000000000000000000000000001",
      "100000000000000010000000000000000000000000001",
      "100000000000000010000111111111100000000000001",
      "100000000000000010000100000000100000000000001",
      "100000000000000010000100000000111111111111111",
      "100000000000000010000100000000000000000000001",
      "100000000000000010000100020000000000000000001",
      "100000000000000010000100000000000000000000001",
      "111111100011111110000100000000000000000000001",
      "000000100010000000000100000000111111113333331",
      "000000100010000000000100000000100000010000001",
      "000000100010000000000111111111100000010000001",
      "000000100010000000000000000000000000010000001",
      "000000166610000000000000000000000000010000001",
      "111111100011111111111000000000000000010000001",
      "100000077700000000001000000000000000010000001",
      "100000000000000000001000000000000000010000001",
      "100000000000000000001000000000000000010000001",
      "100000000000000000001000000000000000010000001",
      "105555550000000000001000000000000000010000001",
      "100000050000000000001000000000000000010000001",
      "1000800500000000000001111111111111111110000001",
      "100000050000000000000000400000000000000000001",
      "105555550000000000000000400000000000000000001",
      "100000000000000000000000400000000000000000001",
      "111111111111111111111111111111111111111111111",
      "111111111111111111111111111111111111111111111"
    ],

    _spentTriggers: new Set(),

    flags: {
      talkedToOma: false
    },

    getTile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return "1";
      const row = this.walls[ty];
      if (!row) return "1";

      let t = row[tx] ?? "1";

      // ✅ WICHTIG: Tile 7 soll nur angezeigt/existieren, solange NICHT mit Oma (5) interagiert wurde
      // Sobald talkedToOma true ist, behandeln wir 7 wie 0 (frei/unsichtbar/kein Trigger).
      if (t === "7" && this.flags.talkedToOma === true) return "0";

      return t;
    },

    isSolid(tx, ty) {
      const t = this.getTile(tx, ty);

      // normale Wand
      if (t === "1") return true;

      // "6" ist Tür/Blockade: erst nach Oma-Gespräch passierbar
      if (t === "6") return this.flags.talkedToOma !== true;

      // alles andere frei
      return false;
    },

    checkTriggers(playerTx, playerTy) {
      const t = this.getTile(playerTx, playerTy);
      if (t !== "3" && t !== "4" && t !== "7") return;

      const key = `${t}:${playerTx},${playerTy}`;
      if (this._spentTriggers.has(key)) return;

      this._spentTriggers.add(key);

      if (t === "3") {
        showTempMessage("Komm in die Küche, die Oma brauch dich mal!", 3000);
      }

      if (t === "4") {
        showTempMessage(
          "Interagiere mit Hilfe von Leertaste mit deiner Umgebung, probiere gleich mal mit Oma zu reden.",
          3000
        );
      }

      // ✅ Trigger 7: Meldung nur solange Oma noch nicht gesprochen wurde
      if (t === "7") {
        if (!this.flags.talkedToOma) {
          showTempMessage("Rede erst mit Oma!", 3000);
        }
      }
    },

    /* ===================================
       INTERACTIONS (SPACE)
       =================================== */
    interactions: {
      // Tile 5: Oma -> schaltet den "6"-Block frei + lässt "7" verschwinden (über getTile)
      "5": ({ level, showTempMessage }) => {
        if (!level.flags.talkedToOma) {
          level.flags.talkedToOma = true;
          showTempMessage("Die Chili Zutaten fehlen, geh los", 2500);
        } else {
          showTempMessage("Oma: Viel Erfolg da draußen!", 2000);
        }
      },

      // Tile 6: Blockade/Tür
      "6": ({ level, showTempMessage }) => {
        if (!level.flags.talkedToOma) {
          showTempMessage("Rede erst mit Oma!", 2000);
        } else {
          showTempMessage("Du kannst jetzt hier durch.", 1500);
        }
      }
    }

    // Optionaler Fallback:
    // onInteract: ({ tile, showTempMessage }) => {
    //   if (tile !== "0") showTempMessage(`Nichts definiert für Tile ${tile}`, 2000);
    // }
  };
})();

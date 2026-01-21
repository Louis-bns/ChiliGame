(function () {
  window.LEVEL4 = {
    id: "level4",
    cols: 45,
    rows: 45,
    tileSize: 32,
    background: "assets/Level4.png",

    spawn: { tx: 18, ty: 16 },

    enemyConfig: {
  wolf: {
    mode: "patrolX",     // Wolf läuft links<->rechts
    distance: 10,        // in TILES (hier 12 Tiles weit)
    speed: 1.4,          // px pro Frame
    scale: 4             // Wolf-Größe
  },
  bat: {
    mode: "infinity",    // Bat fliegt Schleife
    a: 800,              // horizontaler Radius (Pixel)
    b: 600,              // vertikaler Radius (Pixel)
    speed: 0.07,         // Kurven-Speed
    scale: 0.5           // Bat-Größe
  }
},

renderWalls:true,
    enemies: {
      bat: false,
      wolf: false,
    },

    renderWalls: false,

    walls: [
      "111111111111111111111111111111111111111111111",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "100000000000000000000000000000000000000000001",
      "111111111111111111111111111111111111111111111"
    ],

    _spentTriggers: new Set(),

    flags: {
      talkedToOma: false,
      tookKey: false
    },

    getTile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return "1";
      const row = this.walls[ty];
      if (!row) return "1";

      let t = row[tx] ?? "1";

      // Spawn-Marker fuer Gegner sind immer frei
      if (t === "W" || t === "F") return "0";

      if (t === "7" && this.flags.talkedToOma === true) return "0";
      if (t === "A" && this.flags.tookKey === true) return "0";

      return t;
    },

    isSolid(tx, ty) {
      const t = this.getTile(tx, ty);

      if (t === "1") return true;
      if (t === "6") return this.flags.talkedToOma !== true;
      if (t === "B") return this.flags.tookKey !== true;

      return false;
    },

    checkTriggers(playerTx, playerTy) {
      const t = this.getTile(playerTx, playerTy);
      if (t !== "3" && t !== "4" && t !== "7" && t !== "A") return;

      const key = `${t}:${playerTx},${playerTy}`;
      if (this._spentTriggers.has(key)) return;

      this._spentTriggers.add(key);

      if (t === "3") {
        showTempMessage("Komm in die Küche, die Oma brauch dich mal!", 3000, { typewriter: true, charDelay: 26 });
      }

      if (t === "4") {
        showTempMessage(
          "Interagiere mit Hilfe von Leertaste mit deiner Umgebung, probiere gleich mal mit Oma zu reden.",
          3000, { typewriter: true, charDelay: 26 }
        );
      }

      if (t === "7") {
        if (!this.flags.talkedToOma) {
          showTempMessage("Rede erst mit Oma!", 3000, { typewriter: true, charDelay: 26 });
        }
      }

      if (t === "A") {
        if (!this.flags.tookKey) {
          showTempMessage("vergiss die schlüssel nicht!", 3000, { typewriter: true, charDelay: 26 });
        }
      }
    },

    interactions: {
      "5": ({ level, showTempMessage }) => {
        if (!level.flags.talkedToOma) {
          level.flags.talkedToOma = true;
          showTempMessage("Die Chili Zutaten fehlen, geh los", 2500, { typewriter: true, charDelay: 26 });
        } else {
          showTempMessage("Oma: Viel Erfolg da draußen!", 2000, { typewriter: true, charDelay: 26 });
        }
      },

      "9": ({ level, showTempMessage }) => {
        if (!level.flags.tookKey) {
          level.flags.tookKey = true;
          showTempMessage("Schlüssel gefunden", 2500, { typewriter: true, charDelay: 26 });
        } else {
          showTempMessage("Schublade ist leer", 2000, { typewriter: true, charDelay: 26 });
        }
      },

      "6": ({ level, showTempMessage }) => {
        if (!level.flags.talkedToOma) {
          showTempMessage("Rede erst mit Oma!", 2000, { typewriter: true, charDelay: 26 });
        } else {
          showTempMessage("Du kannst jetzt hier durch.", 1500);
        }
      },

      "B": ({ level, showTempMessage }) => {
        if (!level.flags.tookKey) {
          showTempMessage("Vergiss den Schlüssel aus der Schublade nicht", 2000, { typewriter: true, charDelay: 26 });
        } else {
          showTempMessage("Du kannst jetzt hier durch.", 1500);
        }
      },
    },
  };
})();

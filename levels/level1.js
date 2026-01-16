(function () {
  
  window.LEVEL1 = {
    id: "level1",
    cols: 45,
    rows: 45,
    tileSize: 32,

    background: "assets/Intro lvl.png",

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

    enemies: {
      bat: true,
      wolf: true,
    },

    renderWalls: false,

    walls: [
      "111111111111111111111111111111111111111111111",
      "100000000000000000000100001000000000000000001",
      "100000000000000000001000010000000000000000001",
      "100000000000000000001ZZZZ10000000000000000001",
      "100000000000000000001000010000000000000000001",
      "100000000000W00000001000010000000000000000001",
      "100000000000000000001000010000000000000000001",
      "100001111111111111111000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001BBBB11111111111111110000000F00000000001",
      "100001000010000000000000000000000000000000001",
      "100001AAAA10000000000000000000000000000000001",
      "100001000010000000000000000000000000000000001",
      "111111000011111110000000000000000000000000001",
      "100000000000099910000000000000000000000000001",
      "100000000000099910000000000000000000000000001",
      "100000000000099910000000000000000000000000001",
      "100000000000000010000000000000000000000000001",
      "1W000000000000010000000000000000000000000001",
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
      "1555550000000000F0001000000000000000010000001",
      "155555000000000000001000000000000000010000001",
      "185555000000000000001000000000000000010000001",
      "155555000000000000001111111111111111110000001",
      "155555000000000000000000400000000000000000001",
      "100000000000000000000000400000000000000000001",
      "100000000000000000000000400000000000000000001",
      "111111111111111111111111111111111111111111111",
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

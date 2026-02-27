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
        mode: "patrolX", // Wolf läuft links<->rechts
        distance: 10, // in TILES
        speed: 1.4, // px pro Frame
        scale: 4, // Wolf-Größe
      },
      bat: {
        mode: "infinity", // Bat fliegt Schleife
        a: 800, // horizontaler Radius (Pixel)
        b: 600, // vertikaler Radius (Pixel)
        speed: 0.07, // Kurven-Speed
        scale: 0.5, // Bat-Größe
      },
    },

    enemies: {
      bat: false,
      wolf: false,
    },

    renderWalls: false,

    walls: [
      "111111111111111111100000011111111111111111111",
      "1000000000000000001ZZZZZZ10000000000000000001",
      "100000000000000000100000010000000000000000001",
      "100000000000000000100000010000000000000000001",
      "100000000000000000100000010000000000000000001",
      "100001111111111111100000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001000000000000000000010000000000000000001",
      "100001BBBB00000000000000010000000F00000000001",
      "100001000011111111111111110000000000000000001",
      "100001AAAA10000000000000000000000000000000001",
      "100001000010000000000000000000000000000000001",
      "111111000011111110000000000000000000000000001",
      "100000000000999910000000000000000000000000001",
      "100000000000999910000000000000000000000000001",
      "100000000000999910000000000000000000000000001",
      "1SSSSSSSSS00999910000000000000000000000000001",
      "1SSSSSSSSS00000010000000000000000000000000001",
      "1SSSSSSSSS00000010000111111111100000000000001",
      "1SSSSSSSSS00000010000100000000100000000000001",
      "100000000000000010000100000000111111111111111",
      "100000000000000010000100000000000000000000001",
      "100000000000000010000100020000000000000000001",
      "100000000000000010000100000000000000000000001",
      "111111100001111110000100000000000000000000001",
      "000000100001000000000100000000000000003333331",
      "000000100001000000000100000000111111110000001",
      "000000100001000000000111111111100000010000001",
      "000000100001000000000000000000000000010000001",
      "000000166601000000000000000000000000010000001",
      "111111100001111111111000000000000000010000001",
      "100000077770000000001000000000000000010000001",
      "100000000000000000001000000000000000010000001",
      "100000000000000000001000000000000000010000001",
      "1555550000000000F0001000000000000000010000001",
      "155555000000000000001000000000000000010000001",
      "108555000000000000001000000000000000010000001",
      "155555000000000000001111111111111111110000001",
      "155555000000000000000000400000000000000000001",
      "100000000000000000000000400000000000000000001",
      "100000000000000000000000400000000000000000001",
      "111111111111111111111111111111111111111111111",
      "111111111111111111111111111111111111111111111",
    ],

    _spentTriggers: new Set(),

    flags: {
      talkedToOma: false,
      tookKey: false,
      ingredientsShown: false,
    },

    getTile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return "1";
      const row = this.walls[ty];
      if (!row) return "1";

      let t = row[tx] ?? "1";

      // Spawn-Marker fürr Gegner immer frei
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
        showTempMessage("'Grandson! Please come in the kitchen...'", 4000, {
          typewriter: true,
          charDelay: 26,
        });
      }

      if (t === "4") {
        showTempMessage(
          "Using 'Spacebar', u can interact with your sorroundings",
          4000,
          { typewriter: true, charDelay: 26, lockPlayer: true }
        );
        setTimeout(() => {
          showTempMessage("Try talking to Grandma right away", 3000, {
            typewriter: true,
            charDelay: 26,
            lockPlayer: true,
          });
        }, 4000);
      }

      if (t === "7") {
        if (!this.flags.talkedToOma) {
          showTempMessage("Talk to Grandma first", 3000, {
            typewriter: true,
            charDelay: 26,
          });
        }
      }

      if (t === "A") {
        if (!this.flags.tookKey) {
          showTempMessage("'Hey Kid, don't forget the keys...'", 3000, {
            typewriter: true,
            charDelay: 26,
          });
        }
      }
    },

    interactions: {
      5: ({ level, showTempMessage }) => {
        if (!level.flags.talkedToOma) {
          level.flags.talkedToOma = true;

          // Zutatenliste erst nach Oma-Gespräch zeigen (einmalig)
          if (!level.flags.ingredientsShown) {
            level.flags.ingredientsShown = true;
          }

          showTempMessage(
            "'I started cooking CHILI CON CARNE, but I am missing almost all ingriedients...'",
            8000,
            { typewriter: true, charDelay: 26, lockPlayer: true }
          );
          setTimeout(() => {
            showTempMessage(
              "'Here... please take that list and get me the missing ones...'",
              3000,
              { typewriter: true, charDelay: 26, lockPlayer: true }
            );
            setListStep(1); // Liste1.png anzeigen
          }, 6000);
        } else {
          showTempMessage("'I'm so forgetful'", 3000, {
            typewriter: true,
            charDelay: 26,
          });
        }
      },

      9: ({ level, showTempMessage }) => {
        if (!level.flags.tookKey) {
          level.flags.tookKey = true;
          showKeyPopup(); //Bild über dem Kopf
          showTempMessage("Keys found", 2500, {
            typewriter: true,
            charDelay: 26,
          });
        } else {
          showTempMessage("Drawer is empty", 2000, {
            typewriter: true,
            charDelay: 26,
          });
        }
      },

      6: ({ level, showTempMessage }) => {
        if (!level.flags.talkedToOma) {
          showTempMessage("Talk to Grandma first", 2000, {
            typewriter: true,
            charDelay: 26,
          });
        } else {
          showTempMessage("You can pass now", 1500);
        }
      },

      S: ({ level, showTempMessage }) => {
        showTempMessage("Nothing here", 2000, {
          typewriter: true,
          charDelay: 26,
        });
      },

      B: ({ level, showTempMessage }) => {
        if (!level.flags.tookKey) {
          showTempMessage("Don't forget the Key!", 2000, {
            typewriter: true,
            charDelay: 26,
          });
        } else {
          showTempMessage("You can pass now.", 1500);
        }
      },
    },
  };
})();

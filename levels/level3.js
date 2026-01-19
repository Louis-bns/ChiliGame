(function () {
  window.LEVEL3 = {
    id: "level3",
    cols: 45,
    rows: 45,
    tileSize: 32,

    background: "assets/level3.png",

    // Spawnmarker (wird vom Loader zu "0" ersetzt)
    spawnChar: "Y",
    spawn: { tx: 2, ty: 43 },

    flags: {
      solved: false
    },

    renderWalls: true,

    // Targets werden beim Laden aus walls herausgescannt, damit sie sichtbar bleiben,
    // auch wenn später ein Block drauf steht.
    _targets: [], // [{tx,ty, want:"B"|"G"|"R"}]

    /* =========================
       TILE ACCESS
       ========================= */
    getTile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return "1";
      const row = this.walls[ty];
      if (!row) return "1";
      return row[tx] ?? "1";
    },

    setTile(tx, ty, ch) {
      if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return;
      const row = this.walls[ty];
      if (!row) return;
      this.walls[ty] = row.substring(0, tx) + ch + row.substring(tx + 1);
    },

    /* =========================
       SOLID
       ========================= */
    // 1 = Wand solid
    // X = Tuer solid bis solved
    // B/G/R = Bloecke solid (pushbar)
    isSolid(tx, ty) {
      const t = this.getTile(tx, ty);
      if (t === "1") return true;
      if (t === "X" && !this.flags.solved) return true;
      if (t === "B" || t === "G" || t === "R" || t === "L") return true;
      return false;
    },

    /* =========================
       LOAD HOOK
       ========================= */
    onLoad(ctx) {
      this.flags = this.flags || {};
      if (typeof this.flags.solved !== "boolean") this.flags.solved = false;

      // Targets scannen: b/g/r werden zu 0 gemacht und als Ziel gespeichert
      // Mapping: b->B, g->G, r->R
      const map = { b: "B", g: "G", r: "R" };
      this._targets = [];

      for (let ty = 0; ty < this.rows; ty++) {
        for (let tx = 0; tx < this.cols; tx++) {
          const t = this.getTile(tx, ty);
          if (t === "b" || t === "g" || t === "r") {
            this._targets.push({ tx, ty, want: map[t] });
            this.setTile(tx, ty, "0");
          }
        }
      }

      this.renderPuzzle(ctx);

      ctx.showTempMessage(
        "LEVEL 3\n\nSPACE: Block vor dir schieben\nB auf b, G auf g, R auf r\nFalsches Schieben kann Softlocks erzeugen -> Neustart!",
        4200,
        { typewriter: false, x: "50%", y: "15%", center: true }
      );
    },

    /* =========================
       VISUAL RENDER
       ========================= */
    renderPuzzle(ctx) {
      const gameEl = ctx.gameEl;

      const old = document.getElementById("puzzleLayer");
      if (old) old.remove();

      const layer = document.createElement("div");
      layer.id = "puzzleLayer";
      layer.style.position = "absolute";
      layer.style.left = "0";
      layer.style.top = "0";
      layer.style.width = "100%";
      layer.style.height = "100%";
      layer.style.pointerEvents = "none";
      layer.style.zIndex = "7";
      gameEl.appendChild(layer);

      // Targets
      for (const t of this._targets) {
        const el = document.createElement("div");
        el.className =
          t.want === "B" ? "tile-target tile-target-blue" :
          t.want === "G" ? "tile-target tile-target-green" :
                           "tile-target tile-target-red";
        el.style.left = (t.tx * this.tileSize) + "px";
        el.style.top  = (t.ty * this.tileSize) + "px";
        layer.appendChild(el);
      }

      // Blocks
      for (let ty = 0; ty < this.rows; ty++) {
        for (let tx = 0; tx < this.cols; tx++) {
          const t = this.getTile(tx, ty);
          if (t === "B" || t === "G" || t === "R" || t === "L") {
           const el = document.createElement("div");
            el.className =
             t === "B" ? "tile-push tile-push-blue" :
             t === "G" ? "tile-push tile-push-green" :
             t === "R" ? "tile-push tile-push-red" :
              "tile-push tile-push-locked";

            el.style.left = (tx * this.tileSize) + "px";
            el.style.top  = (ty * this.tileSize) + "px";
            layer.appendChild(el);
          }
        }
      }
    },

    /* =========================
       SOLVED CHECK (matching!)
       ========================= */
    lockBlocksOnTargets(ctx) {
  // Wenn ein farbiger Block auf seinem passenden Target steht -> zu "L" machen
  for (const t of this._targets) {
    const here = this.getTile(t.tx, t.ty);
    if (here === t.want) {
      this.setTile(t.tx, t.ty, "L");
    }
  }
  this.renderPuzzle(ctx);
},
  
    checkSolved(ctx) {
      for (const t of this._targets) {
  if (this.getTile(t.tx, t.ty) !== "L") return false;
}


      if (!this.flags.solved) {
        this.flags.solved = true;
        ctx.showTempMessage("ALLES MATCHED! TUER IST OFFEN.", 2200, { x: "50%", y: "15%", center: true });
      }
      return true;
    },

    _dir(facing) {
      if (facing === "left") return { dx: -1, dy: 0 };
      if (facing === "right") return { dx: 1, dy: 0 };
      if (facing === "up") return { dx: 0, dy: -1 };
      return { dx: 0, dy: 1 };
    },

    /* =========================
       INTERACT (SPACE) = PUSH
       Optional forgiving: prueft auch leicht links/rechts
       ========================= */
    onInteract(ctx) {
      const { tx, ty } = ctx.playerTile;
      const { dx, dy } = this._dir(ctx.facing);

      // 3 Kandidaten: direkt davor, leicht links, leicht rechts
      const candidates = [
        { x: tx + dx,           y: ty + dy },
        { x: tx + dx + dy,      y: ty + dy + dx },
        { x: tx + dx - dy,      y: ty + dy - dx }
      ];

      let bx = null, by = null, block = null;

      for (const c of candidates) {
        const t = this.getTile(c.x, c.y);
        if (t === "B" || t === "G" || t === "R") {
          bx = c.x; by = c.y; block = t;
          break;
        }
      }

      if (!block) {
        // Optional: Feedback an der Tuer
        const front = this.getTile(tx + dx, ty + dy);
        if (front === "X" && !this.flags.solved) ctx.showTempMessage("TUER GESPERRT", 900, { y: "15%" });
        return;
      }

      const nx = bx + dx;
      const ny = by + dy;

      // Destination muss frei sein
      const dest = this.getTile(nx, ny);
      if (dest !== "0" || this.isSolid(nx, ny)) {
        ctx.showTempMessage("BLOCK BLOCKIERT", 900, { y: "15%" });
        return;
      }

      // Push
      this.setTile(nx, ny, block);
this.setTile(bx, by, "0");

// Nach jedem Zug: passende Blöcke "einrasten" und unverschiebbar machen
this.lockBlocksOnTargets(ctx);

// Danach solved prüfen (Targets sind erfüllt, wenn alle "L" an Target-Positionen liegen)
this.checkSolved(ctx);

    },

    /* =========================
       45x45 GRID
       1 = Wand, 0 = frei
       B/G/R = Bloecke
       b/g/r = farbige Ziele
       Y = Spawn unten links
       X = Tuer (optional, bleibt solid bis solved)
       ========================= */
walls: [
  "000000000000000000000000000000000000000000000",
  "111111111111111111111111111111111111111111111",
  "100001100000110000000000000011000000000000001",
  "100001100000110000000000000011000000000000001",
  "100000000000110000000000000011000000000000001",
  "10000B0000001100000000000000110000G0000000001",
  "100011111111111111110000000011111111111000001",
  "100011111111111111110000000011111111111000001",
  "100000000000000000000000000011000000001000001",
  "100000000000000000000000000011000000001000001",
  "100000000000011000000000000011000000000000001",
  "10000b000000011000000000000011000000000000001",
  "100000000000011000000000000011000000000000001",
  "111110011111111111000111111111111001111100011",
  "111110011111111111000111111111111001111100011",
  "100000000000010000000110000g110000000R0000001",
  "100000000000010000000110000011000000000000001",
  "100000000000010000000110000011000000000000001",
  "111111110000010000000000000000000000000000001",
  "111111110000010000000000000000000001100000001",
  "100000000000011111111000011111000001100000001",
  "100000000000011111111000011111000001100000001",
  "100000000000010000000000000011000001100000001",
  "100000011100010000000000000011111111100000001",
  "100000000000010000000000000011111111100000001",
  "100000000000010000000000000011000000000000001",
  "100000000000010000000000000r11000000000000001",
  "111111110001111111110001111111110001111111111",
  "111111110001111111110001111111110001111111111",
  "10000B000000011000110000000011000000000000001",
  "100000000000011000110000000011000000000000001",
  "1000000000000110G0110000000011000000000000001",
  "100000000000011000111111000011000001111111111",
  "100000000000011000111111000011000001111111111",
  "100000000000011000000000000011000000000000001",
  "100000000000011000000000000011000000000000001",
  "100000000000011111111110000011000000000000001",
  "100000000000011111111110000011000R00000000001",
  "100000000000010000000110000011111111111000001",
  "10000000000001000000r110000011111111111000001",
  "100000000000010000111110000011000000000000001",
  "100000000000010000111110000011000000000000001",
  "100Y00000000010000000000000011000000000000001",
  "100000000000010000000000000011g00000000000001",
  "111111111111111111111111111111111111111111111"
]



  };
})();

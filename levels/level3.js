(function () {
  window.LEVEL3 = {
    id: "level3",
    cols: 45,
    rows: 45,
    tileSize: 32,

    background: "assets/Level3.png",

    // Spawnmarker (wird vom Loader zu "0" ersetzt)
    spawnChar: "Y",
    spawn: { tx: 2, ty: 43 },

    flags: {
      solved: false,
    },

    renderWalls: false,

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
    // X = Tür solid bis solved
    // B/G/R = Blöcke solid (pushbar)
    isSolid(tx, ty) {
      const t = this.getTile(tx, ty);
      if (t === "1") return true;
      if (t === "X" && !this.flags.solved) return true;
      if (t === "B" || t === "G" || t === "R" || t === "L") return true;
      // C bewusst NICHT solid
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
        "Use the SPACEBAR to move the boxes to the correct spaces.\nBe careful! Sometimes there's no going back!\n\nIf you get stuck, press 'R'",
        2000,
        { typewriter: true, x: "50%", y: "50%", center: true, lockPlayer: true }
      );
    },

    /* =========================
       VISUAL RENDER
       ========================= */
    renderPuzzle(ctx) {
      const gameEl =
        ctx && ctx.gameEl ? ctx.gameEl : document.getElementById("game");

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
          t.want === "B"
            ? "tile-target tile-target-blue"
            : t.want === "G"
            ? "tile-target tile-target-green"
            : "tile-target tile-target-red";
        el.style.left = t.tx * this.tileSize + "px";
        el.style.top = t.ty * this.tileSize + "px";
        layer.appendChild(el);
      }

      // Blocks + X + C
      for (let ty = 0; ty < this.rows; ty++) {
        for (let tx = 0; tx < this.cols; tx++) {
          const t = this.getTile(tx, ty);

          // X sichtbar
          if (t === "X") {
            if (this.flags.solved) continue; // <<< WICHTIG: optisch weg nach Solve
            const el = document.createElement("div");
            el.className = "tile-x tile-x-sprite";
            el.style.left = tx * this.tileSize + "px";
            el.style.top = ty * this.tileSize + "px";
            layer.appendChild(el);
            continue;
          }
          // C = Truhe
          if (t === "C") {
            const el = document.createElement("div");
            el.className = "tile-chest";
            el.style.left = tx * this.tileSize + "px";
            el.style.top = ty * this.tileSize + "px";
            layer.appendChild(el);
            continue;
          }

          // Push-Blocks
          if (t === "B" || t === "G" || t === "R" || t === "L") {
            const el = document.createElement("div");
            el.className =
              t === "B"
                ? "tile-push tile-push-blue"
                : t === "G"
                ? "tile-push tile-push-green"
                : t === "R"
                ? "tile-push tile-push-red"
                : "tile-push tile-push-locked";
            el.style.left = tx * this.tileSize + "px";
            el.style.top = ty * this.tileSize + "px";
            layer.appendChild(el);
          }
        }
      }
    },

    /* =========================
       SOLVED CHECK
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

        // X wirklich aus dem Grid entfernen
        for (let ty = 0; ty < this.rows; ty++) {
          for (let tx = 0; tx < this.cols; tx++) {
            if (this.getTile(tx, ty) === "X") this.setTile(tx, ty, "0");
          }
        }

        this.renderPuzzle(ctx);

        ctx.showTempMessage(
          "Every Box is in the right Place!\n\nQuick, check the Chest!",
          2200,
          { typewriter: true, x: "50%", y: "50%", center: true }
        );
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
       Optional forgiving: prüft auch leicht links/rechts
       ========================= */

    onInteract(ctx) {
      const { tx, ty } = getPlayerTilePos(12);
      const { dx, dy } = this._dir(ctx.facing);

      // Truhe: "nah genug" (aktuelles Tile + Umgebung) statt pixelgenau
      const around = [
        { x: tx, y: ty }, // unter dir
        { x: tx + dx, y: ty + dy }, // vor dir

        // 8er-Nachbarschaft
        { x: tx + 1, y: ty },
        { x: tx - 1, y: ty },
        { x: tx, y: ty + 1 },
        { x: tx, y: ty - 1 },
        { x: tx + 1, y: ty + 1 },
        { x: tx - 1, y: ty - 1 },
        { x: tx + 1, y: ty - 1 },
        { x: tx - 1, y: ty + 1 },
      ];

      let chestFound = false;
      for (const p of around) {
        if (this.getTile(p.x, p.y) === "C") {
          chestFound = true;
          break;
        }
      }

      if (chestFound) {
        setListStep(3); // Liste3.png
        ctx.showTempMessage(
          "You open the Chest...\nIt seems empty...\nNo wait...\n\nLook! You've found the 🫘!",
          3000,
          { typewriter: true, x: "50%", y: "50%", center: true }
        );
        return;
      }

      const front = { x: tx + dx, y: ty + dy };

      // senkrecht zur Blickrichtung
      const leftSide = { x: front.x - dy, y: front.y + dx };
      const rightSide = { x: front.x + dy, y: front.y - dx };

      const candidates = [front, leftSide, rightSide];

      let bx = null,
        by = null,
        block = null;

      for (const c of candidates) {
        const t = this.getTile(c.x, c.y);
        if (t === "B" || t === "G" || t === "R") {
          bx = c.x;
          by = c.y;
          block = t;
          break;
        }
      }

      if (!block) {
        // Feedback an der Tür
        const front = this.getTile(tx + dx, ty + dy);
        if (front === "X" && !this.flags.solved)
          ctx.showTempMessage("It seems blocked. Finish the Level.", 900, {
            typewriter: true,
            y: "50%",
            x: "50",
          });
        return;
      }

      const nx = bx + dx;
      const ny = by + dy;

      // Destination muss frei sein
      const dest = this.getTile(nx, ny);
      if (dest !== "0" || this.isSolid(nx, ny)) {
        ctx.showTempMessage("Box is blocked!", 900, {
          typewriter: true,
          y: "%",
        });
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

    walls: [
      "111111111111111111111111111111111111111111111",
      "100000100000110000000000000011000000000000001",
      "100000100000110000000000000011000000000000001",
      "100000100000110000000000000011000000000000XX1",
      "100000000000110000000000000011000000000000XQQ",
      "10000B00000011r0000000000000110000G0000000XQQ",
      "100011111111111111100000000011111111111000XQQ",
      "100000000000000000000000000011111111111000XX1",
      "100000000000000000000000000011000000001000001",
      "100000000000000000000000000011000000001000001",
      "10000b000000011000000000000011000000000000001",
      "100000000000011000000000000011000000000000001",
      "111110011111111111000111111111110001111100011",
      "111110011111111111000111111110000001111100011",
      "100000000000010000000100000010000000000000001",
      "10000000000001000000010000g0100000000R0000001",
      "100000000000010000000000000000000000000000001",
      "111111110000010000000000000000000001000000001",
      "111111110000010000000000000000000001000000001",
      "100000000000011111110000111110000001000000001",
      "100000000000011111110000111110000001000000001",
      "100000000000010000000000000010000001000000001",
      "100000000000010000000000000011111111000000001",
      "1000000110000X0000000000000010000000000000001",
      "1000000000000X0000000000000010000000000000001",
      "1000000000000X0000000000000r10000000000000001",
      "1000000000000X0000000000000010000000000000001",
      "1111111000111X1111100001111111110001111111111",
      "100000000000010001100000000010000000000000001",
      "100000000000010001100000000010000000000000001",
      "10000B0000000100G1100000000010000000000000001",
      "100000000000010001100000000010000000000000001",
      "100000000000010001111111000010000001111111111",
      "100000000000010000000000000010000000000000001",
      "100000000000010000000000000010000000000000001",
      "100000000000010000000000000010000000000000001",
      "100000000000011111111100000010000R00000000001",
      "100000000000010000000100000010000000000000001",
      "100000000000010000000100000011111111111000001",
      "1000000XXXXXX10000000100000011111111111000001",
      "1000000X0000010000111100000010000000000000001",
      "1000000X00C0010000000000000010000000000000001",
      "10Y0000X000001b000000000000010g00000000000001",
      "1000000X0000010000000000000010000000000000001",
      "111111111111111111111111111111111111111111111",
    ],
  };
})();

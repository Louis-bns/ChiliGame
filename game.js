const game = document.getElementById('game');
const player = document.getElementById('player');

/* Startposition ungefähr mittig platzieren */
let px = (game.clientWidth  - player.clientWidth)  / 2;
let py = (game.clientHeight - player.clientHeight) / 2;

/* Bewegungsgeschwindigkeit (px pro Frame) */
const SPEED = 1;

/* Eingabestatus */
const keys = { left:false, right:false, up:false, down:false };

/* Hilfen */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function setWalkClass(dir) {
  // alle Walk-Klassen entfernen → verhindert Misch-Frames
  player.classList.remove('walk-left', 'walk-right', 'walk-up', 'walk-down');
  if (dir) player.classList.add('walk-' + dir);
}

function update() {
  let vx = 0, vy = 0;

  if (keys.right) vx += SPEED;
  if (keys.left)  vx -= SPEED;
  if (keys.down)  vy += SPEED;
  if (keys.up)    vy -= SPEED;

  // Position aktualisieren
  px += vx;
  py += vy;

  // In den sichtbaren Bereich clampen
  px = clamp(px, 0, game.clientWidth  - player.clientWidth);
  py = clamp(py, 0, game.clientHeight - player.clientHeight);

  // Richtungsklasse setzen (Priorität: horizontal vor vertikal)
  if (vx > 0)      setWalkClass('right');
  else if (vx < 0) setWalkClass('left');
  else if (vy < 0) setWalkClass('up');
  else if (vy > 0) setWalkClass('down');
  else             setWalkClass(null); // keine Animation im Stand

  // Rendern
  player.style.transform = `translate(${px}px, ${py}px)`;

  requestAnimationFrame(update);
}

/* Tastatur-Handling */
document.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'arrowright':
    case 'd': keys.right = true; break;
    case 'arrowleft':
    case 'a': keys.left  = true; break;
    case 'arrowup':
    case 'w': keys.up    = true; break;
    case 'arrowdown':
    case 's': keys.down  = true; break;
    default: return;
  }
  e.preventDefault();
});

document.addEventListener('keyup', (e) => {
  switch (e.key.toLowerCase()) {
    case 'arrowright':
    case 'd': keys.right = false; break;
    case 'arrowleft':
    case 'a': keys.left  = false; break;
    case 'arrowup':
    case 'w': keys.up    = false; break;
    case 'arrowdown':
    case 's': keys.down  = false; break;
    default: return;
  }
  e.preventDefault();
});

/* Start */
player.style.transform = `translate(${px}px, ${py}px)`;
requestAnimationFrame(update);

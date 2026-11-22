const player = { x: 0, z: 85, eyeY: 78, yaw: 0, pitch: -0.10, speed: 3.3, walkAnim: 0 };
const keys = new Set();
let lookedTarget = null;

window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyE' && !isGamePaused) {
    handleInteractE();
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

window.addEventListener('mousemove', (e) => {
  if (isGamePaused) return;
  player.yaw += e.movementX * 0.0025;
  player.pitch += e.movementY * 0.0022;

  if (player.pitch > 0.7) player.pitch = 0.7;
  if (player.pitch < -0.7) player.pitch = -0.7;
});

window.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') return;
  const gameCanvas = document.getElementById('game3d');
  if (!isGamePaused && document.pointerLockElement !== gameCanvas) {
    gameCanvas.requestPointerLock();
  }
});

function updatePlayer() {
  if (isGamePaused) return;

  let forward = 0;
  let strafe = 0;

  if (keys.has('KeyW') || keys.has('ArrowUp')) forward += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) forward -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) strafe += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) strafe -= 1;

  if (forward !== 0 || strafe !== 0) {
    const sin = Math.sin(player.yaw);
    const cos = Math.cos(player.yaw);

    let dx = forward * sin + strafe * cos;
    let dz = -forward * cos + strafe * sin;

    const len = Math.hypot(dx, dz);
    dx = (dx / len) * player.speed;
    dz = (dz / len) * player.speed;

    let nextX = player.x + dx;
    let nextZ = player.z + dz;

    if (nextX < -158) nextX = -158;
    if (nextX > 158) nextX = 158;
    if (nextZ < -12) nextZ = -12;
    if (nextZ > 142) nextZ = 142;

    if (nextZ < 28 && (nextX < -42 || nextX > 42)) {
      nextZ = player.z;
    }

    // Не проходим сквозь стол с компьютером слева
    if (nextX < -128 && nextZ > 35 && nextZ < 95) {
      nextX = player.x;
    }

    player.x = nextX;
    player.z = nextZ;
    player.walkAnim += 0.22;
  } else {
    player.walkAnim = 0;
  }

  detectLookTarget();
}

function detectLookTarget() {
  const promptEl = document.getElementById('interact-prompt');
  const gameCanvas = document.getElementById('game3d');
  const stations = new Array(
    { id: 'stove', x: -135, z: -10, label: 'Пожарить / Снять котлету' },
    { id: 'buns', x: -75, z: -10, label: 'Положить булку (низ / верх)' },
    { id: 'customer', x: 0, z: -65, label: 'Отдать заказ покупателю' },
    { id: 'cheese', x: 75, z: -10, label: 'Добавить ломтик сыра' },
    { id: 'salad', x: 135, z: -10, label: 'Добавить свежий салат' },
    { id: 'trash', x: 165, z: 55, label: 'Выбросить бургер в ведро' },
    { id: 'computer', x: -165, z: 65, label: 'Открыть сайт ПоварБургер.com' }
  );

  let best = null;
  let bestScore = 999;

  stations.forEach(st => {
    if (st.id === 'customer' && !currentCustomer) return;

    const dist = Math.hypot(player.x - st.x, player.z - st.z);
    if (dist > 155) return;

    const screenPos = project3D(st.x, 30, st.z);
    if (!screenPos.visible) return;

    const centerDist = Math.hypot(screenPos.x - gameCanvas.width / 2, screenPos.y - gameCanvas.height / 2);
    if (centerDist < 100 && centerDist < bestScore) {
      bestScore = centerDist;
      best = st;
    }
  });

  lookedTarget = best;
  if (best) {
    promptEl.style.display = 'block';
    promptEl.innerText = 'Нажми [E] — ' + best.label;
  } else {
    promptEl.style.display = 'none';
  }
}

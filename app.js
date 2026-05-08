const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const controls = document.getElementById('controls');
const speedInput = document.getElementById('speed');
const sizeInput = document.getElementById('size');
const angleInput = document.getElementById('angle');
const installBtn = document.getElementById('install');
const modeBtn = document.getElementById('mode');
const installModal = document.getElementById('installModal');
const installText = document.getElementById('installText');
const installClose = document.getElementById('installClose');

const palette = [
  getCss('--dvd-c1'),
  getCss('--dvd-c2'),
  getCss('--dvd-c3'),
  getCss('--dvd-c4'),
  getCss('--dvd-c5'),
  getCss('--dvd-c6'),
];

const state = {
  dpr: window.devicePixelRatio || 1,
  w: 0,
  h: 0,
  baseSpeed: 0,
  speedMul: parseFloat(speedInput.value),
  sizePct: parseFloat(sizeInput.value) / 100,
  angleDeg: parseFloat(angleInput.value),
  colorIndex: 0,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  svgImg: null,
  aspect: 500 / 300,
  lastTime: 0,
  uiVisible: false,
  uiHideTimer: null,
  isDay: false,
};

function getCss(varName){
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function resize(){
  state.dpr = window.devicePixelRatio || 1;
  state.w = window.innerWidth;
  state.h = window.innerHeight;
  canvas.width = Math.floor(state.w * state.dpr);
  canvas.height = Math.floor(state.h * state.dpr);
  canvas.style.width = state.w + 'px';
  canvas.style.height = state.h + 'px';
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  state.baseSpeed = Math.min(state.w, state.h) / 9;
}

function angleToVector(angleDeg){
  const angle = (angleDeg * Math.PI) / 180;
  return { vx: Math.cos(angle), vy: Math.sin(angle) };
}

function randomDir(){
  const angle = (Math.random() * (75 - 15) + 15);
  const vec = angleToVector(angle);
  const vx = vec.vx * (Math.random() > 0.5 ? 1 : -1);
  const vy = vec.vy * (Math.random() > 0.5 ? 1 : -1);
  return { vx, vy };
}

function resetPosition(){
  const size = getLogoSize();
  state.x = Math.random() * (state.w - size.w);
  state.y = Math.random() * (state.h - size.h);
  const dir = randomDir();
  state.vx = dir.vx;
  state.vy = dir.vy;
}

function getLogoSize(){
  const w = state.w * state.sizePct;
  const h = w / state.aspect;
  return { w, h };
}

function nextColor(){
  state.colorIndex = (state.colorIndex + 1) % palette.length;
}

function step(dt){
  const { w, h } = getLogoSize();
  const speed = state.baseSpeed * state.speedMul;
  state.x += state.vx * speed * dt;
  state.y += state.vy * speed * dt;

  let hit = false;
  if (state.x <= 0){
    state.x = 0;
    state.vx *= -1;
    hit = true;
  } else if (state.x + w >= state.w){
    state.x = state.w - w;
    state.vx *= -1;
    hit = true;
  }
  if (state.y <= 0){
    state.y = 0;
    state.vy *= -1;
    hit = true;
  } else if (state.y + h >= state.h){
    state.y = state.h - h;
    state.vy *= -1;
    hit = true;
  }
  if (hit) nextColor();
}

function draw(){
  ctx.clearRect(0, 0, state.w, state.h);
  const { w, h } = getLogoSize();
  if (!state.svgImg) return;
  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.drawImage(state.svgImg, 0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = palette[state.colorIndex];
  ctx.fillRect(state.x, state.y, w, h);
  ctx.restore();
}

function tick(ts){
  if (!state.lastTime) state.lastTime = ts;
  const dt = Math.min((ts - state.lastTime) / 1000, 0.05);
  state.lastTime = ts;
  step(dt);
  draw();
  requestAnimationFrame(tick);
}

function showControls(){
  state.uiVisible = true;
  controls.classList.remove('hidden');
  controls.setAttribute('aria-hidden', 'false');
  resetUiHideTimer();
}

function hideControls(){
  state.uiVisible = false;
  controls.classList.add('hidden');
  controls.setAttribute('aria-hidden', 'true');
}

function resetUiHideTimer(){
  clearTimeout(state.uiHideTimer);
  state.uiHideTimer = setTimeout(() => {
    hideControls();
  }, 3000);
}

function updateSliderFill(input){
  const min = parseFloat(input.min || 0);
  const max = parseFloat(input.max || 100);
  const val = parseFloat(input.value || 0);
  const pct = max === min ? 0 : ((val - min) / (max - min)) * 100;
  input.style.setProperty('--fill', `${pct}%`);
}

function toggleControls(){
  if (state.uiVisible) hideControls();
  else showControls();
}

function initDoubleTap(){
  let lastTap = 0;
  window.addEventListener('touchend', () => {
    const now = Date.now();
    if (now - lastTap < 300){
      toggleControls();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  }, { passive: true });

  window.addEventListener('dblclick', () => {
    toggleControls();
  });
}

window.addEventListener('pointerdown', () => {
  if (state.uiVisible) resetUiHideTimer();
});

function isMobileUA(){
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getInstallInstructions(){
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua);
  const isSafari = /Safari\//i.test(ua) && !/Chrome\//i.test(ua) && !/CriOS\//i.test(ua);
  const isCriOS = /CriOS\//i.test(ua);

  if (isIOS && (isSafari || isCriOS)) {
    return 'Tap Share (square with arrow) → Add to Home Screen.';
  }
  if (isAndroid && isChrome) {
    return 'Open menu (⋮) → Add to Home screen / Install app.';
  }
  return 'Use your browser menu to add this page to your Home Screen.';
}

function showInstallModal(){
  installText.textContent = getInstallInstructions();
  installModal.classList.remove('hidden');
  installModal.setAttribute('aria-hidden', 'false');
}

function hideInstallModal(){
  installModal.classList.add('hidden');
  installModal.setAttribute('aria-hidden', 'true');
}

installBtn.addEventListener('click', () => {
  resetUiHideTimer();
  if (!isMobileUA()) return;
  showInstallModal();
});

installModal.addEventListener('click', () => {
  hideInstallModal();
});

installClose.addEventListener('click', (e) => {
  e.stopPropagation();
  hideInstallModal();
});

speedInput.addEventListener('input', () => {
  state.speedMul = parseFloat(speedInput.value);
  updateSliderFill(speedInput);
  resetUiHideTimer();
});

angleInput.addEventListener('input', () => {
  state.angleDeg = parseFloat(angleInput.value);
  const signX = Math.sign(state.vx) || 1;
  const signY = Math.sign(state.vy) || 1;
  const vec = angleToVector(state.angleDeg);
  state.vx = vec.vx * signX;
  state.vy = vec.vy * signY;
  updateSliderFill(angleInput);
  resetUiHideTimer();
});

sizeInput.addEventListener('input', () => {
  state.sizePct = parseFloat(sizeInput.value) / 100;
  updateSliderFill(sizeInput);
  resetUiHideTimer();
});

modeBtn.addEventListener('click', () => {
  resetUiHideTimer();
  state.isDay = !state.isDay;
  document.body.classList.toggle('day', state.isDay);
  modeBtn.textContent = state.isDay ? 'Day' : 'Night';
  modeBtn.setAttribute('aria-pressed', String(state.isDay));
});

window.addEventListener('resize', () => {
  resize();
  resetPosition();
});

function loadSvg(url){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function init(){
  resize();
  initDoubleTap();
  installBtn.disabled = !isMobileUA();
  [speedInput, sizeInput, angleInput].forEach(updateSliderFill);
  const svg = await loadSvg('./assets/dvd-video-logo.svg');
  state.svgImg = svg;
  resetPosition();
  requestAnimationFrame(tick);
}

init();

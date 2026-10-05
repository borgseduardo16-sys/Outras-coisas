/*
 * Boneco humano 3D (procedural) com poses animadas por exercício.
 * Fonte do bundle js/vendor/figure3d.js — gere com: npm run build:3d
 *
 * Convenções: figura olha para +Z, Y para cima. Lados "A" (x>0) e "B" (x<0).
 * Para trocar o modelo por um GLB real no futuro, substitua buildFigure().
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Object3D, Mesh, MeshStandardMaterial, MeshBasicMaterial,
  ShadowMaterial, SphereGeometry, BoxGeometry, CylinderGeometry, LatheGeometry, TorusGeometry, CircleGeometry,
  RingGeometry, HemisphereLight, DirectionalLight, Vector2, CanvasTexture, ACESFilmicToneMapping, PCFSoftShadowMap,
  SRGBColorSpace, DoubleSide,
} from 'three';

/* ---------- Geometrias auxiliares ---------- */
function tapered(len, r0, r1, bulge = 0.07, cap0 = 0.8, cap1 = 0.8) {
  const pts = [];
  const n = 6;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new Vector2(Math.max(0.0001, r0 * Math.sin(a)), r0 * cap0 * Math.cos(a))); }
  const m = 10;
  for (let i = 1; i < m; i++) {
    const t = i / m;
    pts.push(new Vector2((r0 + (r1 - r0) * t) * (1 + bulge * Math.sin(Math.PI * t)), -len * t));
  }
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new Vector2(Math.max(0.0001, r1 * Math.cos(a)), -len - r1 * cap1 * Math.sin(a))); }
  pts.reverse();
  return new LatheGeometry(pts, 28);
}

function mesh(geo, mat, { x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0 } = {}) {
  const m = new Mesh(geo, mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.x = rx;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

const J = (parent, x = 0, y = 0, z = 0) => { const o = new Object3D(); o.position.set(x, y, z); parent.add(o); return o; };

/* ---------- Medidas ---------- */
const HIP_Y = 0.93, THIGH = 0.45, SHIN = 0.43, ANKLE_H = 0.07;

function buildFigure() {
  const mat = (color, rough = 0.62, metal = 0) => new MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const skin = mat(0xe6b896, 0.55), shirt = mat(0x178079, 0.7), shirtDark = mat(0x0e5a5a, 0.7);
  const pants = mat(0x27364f, 0.75), shoe = mat(0xf5f2ec, 0.5), sole = mat(0x178079, 0.6), hair = mat(0xdadee1, 0.8);
  const dark = mat(0x1d2a2a, 0.4);

  const figure = new Group();
  const root = J(figure, 0, HIP_Y, 0);
  const spine = J(root);
  const chest = J(spine, 0, 0.22, 0);
  const neck = J(chest, 0, 0.31, 0);
  const head = J(neck, 0, 0.06, 0);

  /* Tronco */
  root.add(mesh(new SphereGeometry(0.15, 28, 20), pants, { sx: 1.12, sy: 0.85, sz: 0.82, y: -0.02 }));
  spine.add(mesh(tapered(0.30, 0.135, 0.145, 0.05, 0.3, 0.3), shirt, { y: 0.26, sx: 1.12, sz: 0.8 }));
  chest.add(mesh(tapered(0.40, 0.175, 0.14, 0.09, 0.55, 0.3), shirt, { y: 0.31, sx: 1.18, sz: 0.78 }));
  chest.add(mesh(new CylinderGeometry(0.075, 0.085, 0.08, 20), skin, { y: 0.31 }));
  neck.add(mesh(new CylinderGeometry(0.052, 0.058, 0.13, 20), skin, { y: 0.02 }));

  /* Cabeça */
  head.add(mesh(new SphereGeometry(0.105, 32, 24), skin, { y: 0.14, sy: 1.14, sz: 1.04 }));
  head.add(mesh(new SphereGeometry(0.113, 32, 20, 0, Math.PI * 2, 0, 1.55), hair, { y: 0.155, z: -0.012, sy: 1.12, sz: 1.04, rx: -0.42 }));
  [-1, 1].forEach((s) => {
    head.add(mesh(new SphereGeometry(0.012, 12, 10), dark, { x: s * 0.037, y: 0.16, z: 0.098, sz: 0.6 }));
    head.add(mesh(new SphereGeometry(0.022, 12, 10), skin, { x: s * 0.106, y: 0.14, sx: 0.5, sy: 1.2 }));
  });
  head.add(mesh(new SphereGeometry(0.018, 12, 10), skin, { y: 0.135, z: 0.108, sz: 1.2 }));
  const smile = new Mesh(new TorusGeometry(0.03, 0.0045, 8, 16, Math.PI), dark);
  smile.position.set(0, 0.108, 0.098); smile.rotation.z = Math.PI; smile.scale.z = 0.5; head.add(smile);

  /* Braços */
  const arms = [1, -1].map((s) => {
    const clav = J(chest, s * 0.0, 0.26, 0);               // deslocamento do ombro (encolher/circular)
    const shoulder = J(clav, s * 0.205, 0, 0);
    shoulder.add(mesh(new SphereGeometry(0.066, 20, 16), shirt));
    shoulder.add(mesh(tapered(0.30, 0.066, 0.052, 0.05), skin, { y: -0.02 }));
    shoulder.add(mesh(tapered(0.14, 0.074, 0.068, 0.02, 0.5, 0.9), shirt, { y: -0.02 })); // manga curta
    const elbow = J(shoulder, 0, -0.30, 0);
    elbow.add(mesh(new SphereGeometry(0.05, 16, 12), skin));
    elbow.add(mesh(tapered(0.26, 0.05, 0.038, 0.06), skin, { y: -0.01 }));
    const wrist = J(elbow, 0, -0.27, 0);
    wrist.add(mesh(new SphereGeometry(0.045, 16, 12), skin, { y: -0.055, sx: 0.85, sy: 1.4, sz: 0.55 }));
    return { clav, shoulder, elbow, wrist };
  });

  /* Pernas */
  const legs = [1, -1].map((s) => {
    const hip = J(root, s * 0.095, -0.03, 0);
    hip.add(mesh(tapered(THIGH, 0.098, 0.064, 0.06), pants, { y: 0.02 }));
    const knee = J(hip, 0, -THIGH, 0);
    knee.add(mesh(new SphereGeometry(0.064, 16, 12), pants));
    knee.add(mesh(tapered(SHIN, 0.062, 0.044, 0.05), pants, { y: -0.01 }));
    const ankle = J(knee, 0, -SHIN, 0);
    ankle.add(mesh(new SphereGeometry(0.045, 16, 12), skin, { y: 0.02 }));
    ankle.add(mesh(new SphereGeometry(0.5, 20, 14), shoe, { x: 0, y: -0.03, z: 0.06, sx: 0.19, sy: 0.14, sz: 0.52 }));
    ankle.add(mesh(new BoxGeometry(0.095, 0.022, 0.25), sole, { y: -0.062, z: 0.065 }));
    return { hip, knee, ankle };
  });

  /* Adereços */
  const cadeira = new Group();
  const wood = mat(0xc89a62, 0.6), woodDark = mat(0xa87b46, 0.6);
  cadeira.add(mesh(new BoxGeometry(0.34, 0.04, 0.44), wood, { x: 0.72, y: 0.46 }));
  cadeira.add(mesh(new BoxGeometry(0.04, 0.5, 0.44), wood, { x: 0.55, y: 0.72 }));
  cadeira.add(mesh(new BoxGeometry(0.05, 0.05, 0.48), woodDark, { x: 0.55, y: 0.97 }));
  [[0.55, 0.2], [0.55, -0.2], [0.88, 0.2], [0.88, -0.2]].forEach(([x, z]) => cadeira.add(mesh(new BoxGeometry(0.04, 0.46, 0.04), woodDark, { x, y: 0.23, z })));
  const parede = new Group();
  parede.add(mesh(new BoxGeometry(2.4, 2.2, 0.1), mat(0xe9e2d4, 0.9), { y: 1.1, z: 0.9 }));
  figure.add(cadeira, parede);

  return { figure, root, spine, chest, neck, head, arms, legs, cadeira, parede };
}

/* ---------- Poses: parâmetros -> articulações ---------- */
const NEUTRO = () => ({
  bodyRX: 0, rootX: 0, rootY: 0, rootZ: 0, rootRX: 0, rootRY: 0, rootRZ: 0,
  spX: 0, spY: 0, spZ: 0, chX: 0, chY: 0, chZ: 0, neckX: 0, headY: 0, breath: 0,
  aAbd: 0.13, aFlex: 0, aElb: 0.12, aRz: 0, aShY: 0, aShZ: 0,
  bAbd: 0.13, bFlex: 0, bElb: 0.12, bRz: 0, bShY: 0, bShZ: 0,
  aHip: 0, aHAbd: 0, aKnee: 0, aAnkX: 0, aAnkZ: 0,
  bHip: 0, bHAbd: 0, bKnee: 0, bAnkX: 0, bAnkZ: 0,
});

const sm = (x) => (1 - Math.cos(x)) / 2;         // 0..1 suave
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const CAD_ARM = { aAbd: 0.56, aElb: 0.05, aFlex: 0 }; // mão apoiada na cadeira (lado A)

/* ajuste de pés fixos para flexões de quadril/joelho (cinemática simples) */
function legIK(P, h, k) {
  P.rootY += THIGH * Math.cos(h) + SHIN * Math.cos(h - k) - (THIGH + SHIN);
  P.rootZ += -(THIGH * Math.sin(h) + SHIN * Math.sin(h - k));
}

const ANIMS = {
  respirar: (P, p) => {
    const e = sm(p * 1.25);
    P.breath = e; P.aAbd = P.bAbd = 0.14 + 0.28 * e; P.aElb = P.bElb = 0.15; P.neckX = -0.04 * e; P.aShY = P.bShY = 0.012 * e;
  },
  ombros: (P, p) => {
    const r = 0.035;
    P.aShY = r * Math.sin(p * 1.6); P.aShZ = r * Math.cos(p * 1.6);
    P.bShY = r * Math.sin(p * 1.6 + 0.0); P.bShZ = r * Math.cos(p * 1.6);
    P.aAbd = P.bAbd = 0.12; P.headY = 0.04 * Math.sin(p * 0.4);
  },
  bracos: (P, p) => {
    const e = sm(p * 0.9); P.aAbd = P.bAbd = 0.12 + 2.75 * e; P.aElb = P.bElb = 0.1;
    P.spX = -0.04 * e; P.neckX = -0.05 * e;
  },
  inclinacao: (P, p) => {
    const s = Math.sin(p * 0.8);
    P.spZ = s * 0.16; P.chZ = s * 0.2; P.rootX = -s * 0.03; P.headY = 0;
    P.aAbd = 0.15 + 2.5 * Math.max(0, s); P.bAbd = 0.15 + 2.5 * Math.max(0, -s);
    P.aElb = P.bElb = 0.08;
  },
  rotacao: (P, p) => {
    const s = Math.sin(p * 0.8);
    P.spY = s * 0.3; P.chY = s * 0.4; P.headY = s * 0.1;
    P.aFlex = P.bFlex = 1.15; P.aElb = P.bElb = 1.95; P.aAbd = P.bAbd = -0.12; P.aRz = -0.9; P.bRz = 0.9;
  },
  marcha: (P, p, ctx) => {
    const w = p * 2.2, a = Math.max(0, Math.sin(w)), b = Math.max(0, -Math.sin(w));
    P.aHip = a * 0.95; P.aKnee = a * 1.15; P.bHip = b * 0.95; P.bKnee = b * 1.15;
    P.rootY = 0.012 * Math.sin(w * 2);
    P.bFlex = Math.sin(w) * 0.5; P.bElb = 0.5; P.bAbd = 0.1;
    if (!ctx.apoio) { P.aFlex = -Math.sin(w) * 0.5; P.aElb = 0.5; P.aAbd = 0.1; }
  },
  calcanhares: (P, p) => {
    const e = sm(p * 0.9); const th = 0.8 * e;
    P.aAnkX = P.bAnkX = th; P.rootY = 0.1 * Math.sin(th) + 0.012 * e; P.neckX = -0.02;
  },
  quadril: (P, p) => {
    const w = p * 1.1, a = 0.1;
    P.rootRZ = a * Math.sin(w); P.rootRX = a * Math.cos(w); P.rootX = 0.045 * Math.sin(w); P.rootZ = 0.04 * Math.cos(w);
    P.spZ = -a * Math.sin(w) * 0.7; P.spX = -a * Math.cos(w) * 0.7;
    P.aHAbd = -P.rootRZ; P.bHAbd = -P.rootRZ; P.aHip = P.bHip = -P.rootRX;
  },
  equilibrio: (P, p, ctx) => {
    const s = Math.sin(p * 0.7), a = clamp(s * 1.7, 0, 1), b = clamp(-s * 1.7, 0, 1);
    const la = sm(a * Math.PI), lb = sm(b * Math.PI);
    P.aHip = la * 0.6; P.aKnee = la * 1.0; P.bHip = lb * 0.6; P.bKnee = lb * 1.0;
    P.rootX = -la * 0.05 + lb * 0.05; P.spZ = la * 0.03 - lb * 0.03;
    if (ctx.tandem) { P.aHip = P.bHip = 0; P.aKnee = P.bKnee = 0; P.rootX = 0; P.rootZ = 0; }
    P.bAbd = 0.35 + 0.2 * Math.max(la, lb); P.bElb = 0.2;
  },
  peitoral: (P, p) => {
    const e = sm(p * 0.9);
    P.aAbd = P.bAbd = 1.15 + 0.3 * e; P.aFlex = P.bFlex = -(0.2 + 0.55 * e); P.aElb = P.bElb = 0.15 + 0.1 * e;
    P.chX = -0.1 * e; P.neckX = -0.1 * e; P.headY = 0;
  },
  tornozelo: (P, p) => {
    P.aHip = 0.45; P.aKnee = 0.7; P.aAnkX = 0.55 * Math.sin(p * 2.2); P.aAnkZ = 0.5 * Math.cos(p * 2.2);
    P.rootX = -0.04; P.spZ = 0.03;
  },
  agachar: (P, p) => {
    const e = sm(p * 0.9), h = 0.5 * e, k = 0.85 * e;
    P.aHip = P.bHip = h; P.aKnee = P.bKnee = k; legIK(P, h, k);
    P.spX = -0.18 * e; P.chX = -0.1 * e; P.neckX = 0.12 * e;
  },
  parede: (P, p) => {
    const e = sm(p * 0.9);
    P.bodyRX = 0.2 + 0.27 * e;
    P.aAbd = P.bAbd = 0.22; P.aFlex = P.bFlex = 1.52 - P.bodyRX * 0.0 - 0.05 * e; P.aElb = P.bElb = 0.2 + 1.25 * e;
    P.aRz = 0; P.bRz = 0; P.neckX = -0.1;
  },
  perna: (P, p) => {
    const s = Math.sin(p * 0.7);
    const la = sm(clamp(s * 1.6, 0, 1) * Math.PI), lb = sm(clamp(-s * 1.6, 0, 1) * Math.PI);
    P.aHAbd = la * 0.55; P.bHAbd = lb * 0.55; P.rootX = -la * 0.045 + lb * 0.045; P.spZ = la * 0.08 - lb * 0.08;
    P.bAbd = 0.4 + 0.1 * (la + lb); P.bElb = 0.2;
  },
};
const COM_CADEIRA = new Set(['marcha', 'calcanhares', 'quadril', 'equilibrio', 'tornozelo', 'agachar', 'perna']);
const COM_PAREDE = new Set(['parede']);

/* ---------- Visualizador ---------- */
export function criarFigura3D(container, opcoes = {}) {
  const o = { animacao: 'respirar', tandem: false, giro: 'oscilar', angulo: 0.5, zoom: 1, ...opcoes };
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.domElement.className = 'fig3d-canvas';
  container.append(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  scene.add(new HemisphereLight(0xffffff, 0xbfd9d4, 1.15));
  const key = new DirectionalLight(0xfff3e0, 2.3); key.position.set(2.2, 4, 3.2); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 5; key.shadow.camera.left = -2; key.shadow.camera.right = 2;
  key.shadow.camera.top = 2.5; key.shadow.camera.bottom = -1; key.shadow.bias = -0.0005;
  scene.add(key);
  const fill = new DirectionalLight(0xcfe8ff, 0.8); fill.position.set(-3, 2, 1.5); scene.add(fill);
  const rim = new DirectionalLight(0xffffff, 1.0); rim.position.set(-1, 2.5, -3.5); scene.add(rim);

  /* Piso */
  const glow = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 10, 128, 128, 126);
    gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.6, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return new CanvasTexture(c);
  })();
  const disco = new Mesh(new CircleGeometry(1.5, 48), new MeshBasicMaterial({ map: glow, transparent: true, opacity: .75, depthWrite: false }));
  disco.rotation.x = -Math.PI / 2; disco.position.y = 0.002; scene.add(disco);
  const sombra = new Mesh(new CircleGeometry(1.6, 48), new ShadowMaterial({ opacity: 0.22 }));
  sombra.rotation.x = -Math.PI / 2; sombra.receiveShadow = true; scene.add(sombra);
  const anel = new Mesh(new RingGeometry(0.98, 1.0, 64), new MeshBasicMaterial({ color: 0x17a398, transparent: true, opacity: .55, side: DoubleSide }));
  anel.rotation.x = -Math.PI / 2; anel.position.y = 0.004; scene.add(anel);

  const fig = buildFigure(); scene.add(fig.figure);

  /* Estado */
  let tz = 0, az = o.angulo, alvoAz = az, el = 0.12, velAz = 0, zoom = o.zoom, arrastando = false, ultimoToque = -99;
  let velocidade = 1, t = 0, vivo = true, pausado = false, ultimo = performance.now();
  let anim = o.animacao, ctx = { apoio: false, tandem: !!o.tandem };
  const cur = NEUTRO();
  function configurarAnim(nome, extra = {}) {
    anim = ANIMS[nome] ? nome : 'respirar'; ctx = { apoio: COM_CADEIRA.has(anim), tandem: !!extra.tandem };
    fig.cadeira.visible = COM_CADEIRA.has(anim); fig.parede.visible = COM_PAREDE.has(anim);
    if (extra.mudou) alvoAz = COM_PAREDE.has(anim) ? 1.35 : o.angulo;
  }
  configurarAnim(anim, o);

  /* Controles de arraste (horizontal gira; vertical continua rolando a página) */
  const dom = renderer.domElement; dom.style.touchAction = 'pan-y'; dom.style.cursor = 'grab';
  let lx = 0;
  dom.addEventListener('pointerdown', (e) => { arrastando = true; lx = e.clientX; velAz = 0; dom.setPointerCapture(e.pointerId); dom.style.cursor = 'grabbing'; ultimoToque = performance.now(); });
  dom.addEventListener('pointermove', (e) => {
    if (!arrastando) return; const dx = e.clientX - lx; lx = e.clientX;
    az -= dx * 0.011; alvoAz = az; velAz = -dx * 0.011; ultimoToque = performance.now();
  });
  const solta = () => { arrastando = false; dom.style.cursor = 'grab'; };
  dom.addEventListener('pointerup', solta); dom.addEventListener('pointercancel', solta);
  dom.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); zoom = clamp(zoom - e.deltaY * 0.004, 0.7, 1.6); }, { passive: false });

  function redimensionar() {
    const w = container.clientWidth || 300, h = container.clientHeight || 300;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(redimensionar); ro.observe(container); redimensionar();

  function aplicar(P) {
    const { figure, root, spine, chest, neck, head, arms, legs } = fig;
    figure.rotation.x = P.bodyRX;
    root.position.set(P.rootX, HIP_Y + P.rootY, P.rootZ); root.rotation.set(P.rootRX, P.rootRY, P.rootRZ);
    spine.rotation.set(P.spX, P.spY, P.spZ); chest.rotation.set(P.chX, P.chY, P.chZ);
    chest.scale.y = 1 + 0.025 * P.breath; chest.scale.z = 1 + 0.05 * P.breath;
    neck.rotation.x = P.neckX; head.rotation.y = P.headY;
    const lado = [['a', arms[0], legs[0], 1], ['b', arms[1], legs[1], -1]];
    lado.forEach(([k, a, l, s]) => {
      a.shoulder.rotation.set(-P[k + 'Flex'], 0, s * P[k + 'Abd']); a.shoulder.rotation.y = s * P[k + 'Rz'];
      a.clav.position.set(0, 0.26 + P[k + 'ShY'], P[k + 'ShZ']);
      a.elbow.rotation.set(-P[k + 'Elb'], 0, 0);
      l.hip.rotation.set(-P[k + 'Hip'], 0, s * P[k + 'HAbd']); l.knee.rotation.x = P[k + 'Knee'];
      l.ankle.rotation.set(P[k + 'AnkX'], 0, P[k + 'AnkZ']);
    });
  }

  function quadro(agora) {
    if (!vivo) return;
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    if (!pausado) t += dt * velocidade;
    const alvo = NEUTRO(); ANIMS[anim](alvo, t, ctx);
    if (ctx.apoio) Object.assign(alvo, CAD_ARM, { aAbd: CAD_ARM.aAbd, aRz: 0 });
    const k = 1 - Math.exp(-dt * 9);
    for (const key in alvo) cur[key] += (alvo[key] - cur[key]) * k;
    aplicar(cur);

    /* Câmera */
    const ocioso = (agora - ultimoToque) > 3500;
    if (!arrastando) {
      if (Math.abs(velAz) > 0.0005) { az += velAz; velAz *= 0.93; alvoAz = az; }
      else if (o.giro === 'oscilar' && ocioso) { alvoAz = o.angulo + Math.sin(agora / 2600) * 0.55; az += (alvoAz - az) * 0.02; }
      else if (o.giro === 'girar' && ocioso) { az += dt * 0.5; alvoAz = az; }
      else { az += (alvoAz - az) * 0.1; }
    }
    const dist = 4.7 / zoom, cy = 0.9;
    tz += ((COM_PAREDE.has(anim) ? 0.4 : 0) - tz) * 0.08;
    camera.position.set(Math.sin(az) * Math.cos(el) * dist, cy + Math.sin(el) * dist, tz + Math.cos(az) * Math.cos(el) * dist);
    camera.lookAt(0, cy, tz);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(quadro);
  }
  let raf = requestAnimationFrame(quadro);

  return {
    definirAnimacao(nome, extra = {}) { configurarAnim(nome, { ...extra, mudou: true }); },
    angulo(rad) { alvoAz = rad; velAz = 0; ultimoToque = performance.now(); az = az; },
    anguloAtual: () => az,
    velocidade(v) { velocidade = v; },
    pausar(p) { pausado = p; },
    modoGiro(m) { o.giro = m; ultimoToque = performance.now() - 5000; },
    definirTempo(s) { t = s; },
    giroAutomatico(modo) { o.giro = modo; },
    destruir() {
      vivo = false; cancelAnimationFrame(raf); ro.disconnect();
      scene.traverse((n) => { if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose && n.material.dispose(); });
      renderer.dispose(); renderer.forceContextLoss && renderer.forceContextLoss(); dom.remove();
    },
  };
}

window.D31 = window.D31 || {};
D31.criarFigura3D = criarFigura3D;

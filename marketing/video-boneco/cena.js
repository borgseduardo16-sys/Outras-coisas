/*
 * Vídeo "coluna": manequim 3D detalhado (estilo estúdio, fundo escuro).
 * Renderização determinística quadro a quadro: window.cena.quadro(t) desenha o instante t (s).
 * Build: npx esbuild marketing/video-boneco/cena.js --bundle --format=iife --outfile=marketing/video-boneco/cena.bundle.js
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Object3D, Mesh, MeshPhysicalMaterial, MeshStandardMaterial,
  MeshBasicMaterial, ShadowMaterial, SphereGeometry, CylinderGeometry, LatheGeometry, TorusGeometry, CircleGeometry,
  RingGeometry, PlaneGeometry, CapsuleGeometry, SpotLight, DirectionalLight, HemisphereLight, Vector2, Color, CanvasTexture,
  Sprite, SpriteMaterial, AdditiveBlending, Vector3, Quaternion, Matrix4, ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, PMREMGenerator, DoubleSide,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ================= Parâmetros do vídeo ================= */
const BPM = 135, BEAT = 60 / BPM, BAR = BEAT * 4;
export const T_DROP = BAR * 2;        // 3,556 s — virada (transição)
export const T_FIM3D = BAR * 6;       // 10,667 s — fim da parte 3D
const T_TWIST = T_DROP + BAR, T_RUN = T_DROP + BAR * 2, T_FINAL = T_DROP + BAR * 3;

/* ================= Geometrias ================= */
const SEG = 48;
function lathe(len, r0, r1, bulge = 0.08, bulgeAt = 0.4, cap0 = 0.6, cap1 = 0.6) {
  const pts = [], n = 10, m = 24;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new Vector2(Math.max(1e-4, r0 * Math.sin(a)), r0 * cap0 * Math.cos(a))); }
  for (let i = 1; i < m; i++) {
    const t = i / m, b = Math.exp(-Math.pow((t - bulgeAt) / 0.28, 2));
    pts.push(new Vector2((r0 + (r1 - r0) * t) * (1 + bulge * b), -len * t));
  }
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new Vector2(Math.max(1e-4, r1 * Math.cos(a)), -len - r1 * cap1 * Math.sin(a))); }
  pts.reverse();
  return new LatheGeometry(pts, 56);
}
const esfera = new SphereGeometry(1, 64, 48);

/* ================= Materiais ================= */
const pele = new MeshPhysicalMaterial({ color: 0xa7abb2, roughness: 0.5, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.55, envMapIntensity: 0.15 });
const tecido = new MeshPhysicalMaterial({ color: 0x1e3a8a, roughness: 0.62, sheen: 0.6, sheenColor: new Color(0x6d8cff), sheenRoughness: 0.5, envMapIntensity: 0.4 });
const tecidoEsc = new MeshStandardMaterial({ color: 0x172d6b, roughness: 0.7 });
const VERMELHO = new Color(0xff5a48);
const vertMat = new MeshPhysicalMaterial({ color: 0xa7abb2, roughness: 0.45, emissive: new Color(0xff2a1a), emissiveIntensity: 0, clearcoat: 0.2, envMapIntensity: 0.5 });

function m(geo, mat, p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) {
  const o = new Mesh(geo, mat); o.position.set(...p); o.scale.set(...s); o.rotation.set(...r);
  o.castShadow = true; o.receiveShadow = true; return o;
}
const E = (parent, p, s, r, mat = pele) => { const o = m(esfera, mat, p, s, r); parent.add(o); return o; };
const J = (parent, x = 0, y = 0, z = 0) => { const o = new Object3D(); o.position.set(x, y, z); parent.add(o); return o; };

/* ================= Manequim ================= */
const HIP_Y = 0.95, THIGH = 0.44, SHIN = 0.43;
function criarManequim() {
  const fig = new Group();
  const root = J(fig, 0, HIP_Y, 0);
  // Pelve, glúteos e bermuda
  E(root, [0, -0.01, 0], [0.155, 0.115, 0.112], [0, 0, 0], tecido);
  E(root, [0.07, -0.05, -0.05], [0.085, 0.09, 0.078], [0, 0, 0], tecido);
  E(root, [-0.07, -0.05, -0.05], [0.085, 0.09, 0.078], [0, 0, 0], tecido);
  E(root, [0, 0.06, 0], [0.152, 0.05, 0.112], [0, 0, 0], tecidoEsc);
  const cord = m(new CylinderGeometry(0.004, 0.004, 0.07, 8), pele, [0.015, 0.03, 0.115], [1, 1, 1], [0, 0, 0.1]); root.add(cord);
  const cord2 = m(new CylinderGeometry(0.004, 0.004, 0.065, 8), pele, [-0.012, 0.03, 0.115], [1, 1, 1], [0, 0, -0.12]); root.add(cord2);

  const spine = J(root, 0, 0.06, 0);
  // Abdômen + oblíquos + "gomos" discretos
  E(spine, [0, 0.1, 0.0], [0.138, 0.155, 0.103]);
  E(spine, [0.095, 0.08, 0.0], [0.042, 0.105, 0.072]); E(spine, [-0.095, 0.08, 0.0], [0.042, 0.105, 0.072]);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) E(spine, [s * 0.033, 0.045 + i * 0.058, 0.094 - i * 0.003], [0.03, 0.026, 0.009]);
  E(spine, [0, 0.12, -0.078], [0.07, 0.13, 0.03]); // lombar

  const chest = J(spine, 0, 0.18, 0);
  // Caixa torácica, peitorais, dorsais, escápulas, trapézio
  E(chest, [0, 0.13, -0.005], [0.165, 0.2, 0.118]);
  E(chest, [0.068, 0.22, 0.072], [0.076, 0.052, 0.038], [0.15, 0, -0.18]); E(chest, [-0.068, 0.22, 0.072], [0.076, 0.052, 0.038], [0.15, 0, 0.18]);
  E(chest, [0.125, 0.11, -0.035], [0.046, 0.13, 0.055], [0, 0, 0.12]); E(chest, [-0.125, 0.11, -0.035], [0.046, 0.13, 0.055], [0, 0, -0.12]);
  E(chest, [0.075, 0.22, -0.098], [0.07, 0.08, 0.028], [0, 0, -0.2]); E(chest, [-0.075, 0.22, -0.098], [0.07, 0.08, 0.028], [0, 0, 0.2]);
  E(chest, [0, 0.31, -0.035], [0.13, 0.055, 0.07]);
  E(chest, [0.1, 0.305, -0.01], [0.09, 0.04, 0.06], [0, 0, -0.35]); E(chest, [-0.1, 0.305, -0.01], [0.09, 0.04, 0.06], [0, 0, 0.35]);
  const neck = J(chest, 0, 0.33, -0.012);
  neck.add(m(lathe(0.12, 0.054, 0.062, 0.02, 0.5, 0.2, 0.2), pele, [0, 0.11, 0]));
  E(neck, [0.035, 0.03, 0.025], [0.018, 0.07, 0.018], [0.4, 0, -0.35]); E(neck, [-0.035, 0.03, 0.025], [0.018, 0.07, 0.018], [0.4, 0, 0.35]);
  const head = J(neck, 0, 0.08, 0);
  // Cabeça de manequim: ovo + mandíbula + leve nariz e arco superciliar
  E(head, [0, 0.1, 0.005], [0.095, 0.122, 0.106]);
  E(head, [0, 0.045, 0.03], [0.072, 0.06, 0.07]);
  E(head, [0, 0.095, 0.098], [0.011, 0.022, 0.012], [0.25, 0, 0]);
  E(head, [0.093, 0.09, -0.005], [0.012, 0.028, 0.018]); E(head, [-0.093, 0.09, -0.005], [0.012, 0.028, 0.018]);

  // Coluna (vértebras) — brilham em vermelho na fase de dor
  const vert = [];
  const addV = (par, y, z, s) => { const v = E(par, [0, y, z], [0.017 * s, 0.012 * s, 0.012 * s], [0, 0, 0], vertMat); vert.push(v); };
  for (let i = 0; i < 6; i++) { const y = 0.02 + i * 0.034; addV(spine, y, -0.103 - 0.004 * Math.sin(i / 5 * Math.PI), 1.05); }
  for (let i = 0; i < 9; i++) { const y = 0.0 + i * 0.037; const z = -0.005 - 0.118 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 0.13) / 0.205, 2))) - 0.004; addV(chest, y, Math.min(z, -0.06), 1); }
  for (let i = 0; i < 3; i++) addV(neck, 0.03 + i * 0.03, -0.045, 0.85);

  // Braços
  const bracos = [1, -1].map((s) => {
    const clav = J(chest, 0, 0.29, 0);
    const ombro = J(clav, s * 0.19, 0, 0);
    E(ombro, [s * 0.008, 0.005, 0], [0.068, 0.078, 0.07]);                         // deltoide
    ombro.add(m(lathe(0.29, 0.056, 0.042, 0.12, 0.42), pele, [0, -0.02, 0]));     // braço
    E(ombro, [0, -0.12, 0.022], [0.038, 0.075, 0.035]);                            // bíceps
    E(ombro, [0, -0.11, -0.025], [0.04, 0.08, 0.035]);                             // tríceps
    const cot = J(ombro, 0, -0.3, 0);
    E(cot, [0, 0, 0], [0.042, 0.042, 0.042]);
    cot.add(m(lathe(0.255, 0.046, 0.031, 0.12, 0.25), pele, [0, -0.01, 0]));       // antebraço
    const pulso = J(cot, 0, -0.265, 0);
    E(pulso, [0, 0, 0], [0.03, 0.022, 0.024]);
    E(pulso, [0, -0.05, 0.004], [0.021, 0.048, 0.04]);        // palma
    E(pulso, [s * 0.004, -0.105, 0.006], [0.017, 0.045, 0.036], [0.18, 0, 0]);     // dedos (manequim)
    pulso.add(m(new CapsuleGeometry(0.01, 0.034, 8, 16), pele, [s * 0.012, -0.045, 0.038], [1, 1, 1], [0.55, 0, -s * 0.25])); // polegar
    return { clav, ombro, cot, pulso };
  });

  // Pernas
  const pernas = [1, -1].map((s) => {
    const quadril = J(root, s * 0.088, -0.035, 0);
    quadril.add(m(lathe(0.29, 0.104, 0.096, 0.03, 0.4, 0.3, 0.15), tecido, [0, 0.03, 0]));    // perna da bermuda
    quadril.add(m(lathe(THIGH, 0.088, 0.058, 0.1, 0.32), pele, [0, 0.0, 0]));            // coxa
    E(quadril, [0, -0.31, 0.035], [0.05, 0.09, 0.04]);                                    // quadríceps
    const joelho = J(quadril, 0, -THIGH, 0);
    E(joelho, [0, 0, 0], [0.055, 0.055, 0.056]);
    E(joelho, [0, 0.0, 0.045], [0.032, 0.036, 0.018]);                                   // patela
    joelho.add(m(lathe(SHIN, 0.054, 0.034, 0.16, 0.24), pele, [0, -0.01, 0]));           // canela
    E(joelho, [0, -0.13, -0.03], [0.045, 0.1, 0.045]);                                   // panturrilha
    const tornozelo = J(joelho, 0, -SHIN, 0);
    E(tornozelo, [0, 0, 0], [0.035, 0.03, 0.036]);
    E(tornozelo, [0, -0.03, 0.045], [0.045, 0.028, 0.105]);                               // pé
    E(tornozelo, [0, -0.04, 0.135], [0.042, 0.02, 0.035]);                                // dedos
    E(tornozelo, [0, -0.032, -0.03], [0.03, 0.025, 0.035]);                               // calcanhar
    return { quadril, joelho, tornozelo };
  });
  return { fig, root, spine, chest, neck, head, bracos, pernas, vert };
}

/* ================= IK do braço (mão na lombar) ================= */
const L1 = 0.30, L2 = 0.3;
const _T = new Vector3(), _E = new Vector3(), _u = new Vector3(), _f = new Vector3(), _p = new Vector3(), _x = new Vector3(), _y = new Vector3(), _z = new Vector3(), _m4 = new Matrix4();
function ikBraco(S, T, pole) { // S, T e pole no espaço da clavícula
  _T.copy(T).sub(S); const d = Math.min(_T.length(), L1 + L2 - 1e-3); const dir = _T.normalize();
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  _p.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
  _E.copy(dir).multiplyScalar(a).addScaledVector(_p, h);
  _u.copy(_E).normalize();
  _f.copy(dir).multiplyScalar(d).sub(_E).normalize();
  _z.copy(_f).addScaledVector(_u, -_f.dot(_u)); if (_z.lengthSq() < 1e-8) _z.copy(_p); _z.normalize();
  _y.copy(_u).negate(); _x.crossVectors(_y, _z).normalize();
  _m4.makeBasis(_x, _y, _z);
  return { q: new Quaternion().setFromRotationMatrix(_m4), elb: Math.acos(clamp(_u.dot(_f), -1, 1)) };
}

/* ================= Poses ================= */
const NEUTRO = () => ({
  rootX: 0, rootY: 0, rootZ: 0, rootRX: 0, rootRY: 0, rootRZ: 0,
  spX: 0, spY: 0, spZ: 0, chX: 0, chY: 0, chZ: 0, neckX: 0, neckY: 0, headX: 0,
  aAbd: 0.12, aFlex: 0, aRy: 0, aElb: 0.15, aWr: 0, bAbd: 0.12, bFlex: 0, bRy: 0, bElb: 0.15, bWr: 0,
  aShY: 0, bShY: 0,
  aHip: 0, aHAbd: 0, aKnee: 0, aAnk: 0, bHip: 0, bHAbd: 0, bKnee: 0, bAnk: 0,
  bIK: 0, bTx: -0.12, bTy: -0.07, bTz: -0.16, bPx: -1, bPy: 0.2, bPz: -0.3,
});
const sm = (x) => (1 - Math.cos(x)) / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function legIK(P, h, k) { // mantém os pés no chão ao dobrar quadril/joelho (as duas pernas)
  P.rootY += THIGH * Math.cos(h) + SHIN * Math.cos(h - k) - (THIGH + SHIN);
  P.rootZ += -(THIGH * Math.sin(h) + SHIN * Math.sin(h - k));
}

function pose(t) {
  const P = NEUTRO();
  if (t < T_DROP) {                      // Dor: curvado, mão na lombar
    const w = Math.sin(t * 1.9);
    P.spX = 0.3 + 0.03 * w; P.chX = 0.12; P.neckX = 0.22; P.headX = 0.05; P.spZ = 0.05; P.rootRZ = -0.02;
    const h = 0.16, k = 0.3; P.aHip = P.bHip = h; P.aKnee = P.bKnee = k; legIK(P, h, k);
    P.rootZ += 0.06; // compensa o peso para trás
    P.bIK = 1; P.bWr = 0.25;                                                            // mão na lombar (IK)
    P.aFlex = 0.55 - 0.03 * w; P.aAbd = 0.05; P.aElb = 0.28;                            // mão apoiada na coxa
    P.aShY = 0.015; P.bShY = 0.02;
  } else if (t < T_TWIST) {              // Alongamento: braços acima, inclinação lateral no ritmo
    const u = (t - T_DROP) / (BEAT * 2), s = Math.sin(u * Math.PI);
    P.aAbd = P.bAbd = 2.85; P.aElb = P.bElb = 0.12; P.aRy = 0; P.bRy = 0;
    P.spZ = 0.14 * s; P.chZ = 0.12 * s; P.rootX = -0.025 * s; P.neckX = -0.05; P.chX = -0.04;
  } else if (t < T_RUN) {                // Rotação de tronco
    const u = (t - T_TWIST) / (BEAT * 2), s = Math.sin(u * Math.PI);
    P.aFlex = P.bFlex = 1.25; P.aElb = P.bElb = 1.9; P.aAbd = P.bAbd = 0.25; P.aRy = -0.6; P.bRy = 0.6;
    P.spY = 0.3 * s; P.chY = 0.38 * s; P.neckY = 0.1 * s;
    const h = 0.06, k = 0.12; P.aHip = P.bHip = h; P.aKnee = P.bKnee = k; legIK(P, h, k);
  } else if (t < T_FINAL) {              // Corrida no lugar
    const ph = (t - T_RUN) / BEAT * Math.PI, a = Math.sin(ph);
    const la = Math.max(0, a), lb = Math.max(0, -a);
    P.aHip = 1.05 * la - 0.25 * lb; P.aKnee = 1.5 * la + 0.6 * lb;
    P.bHip = 1.05 * lb - 0.25 * la; P.bKnee = 1.5 * lb + 0.6 * la;
    P.rootY = 0.035 * Math.abs(Math.sin(ph)) - 0.03; P.spX = 0.12; P.neckX = -0.06;
    P.aFlex = -0.65 * a + 0.2; P.bFlex = 0.65 * a + 0.2; P.aElb = P.bElb = 1.55; P.aAbd = P.bAbd = 0.14;
    P.aAnk = 0.5 * la; P.bAnk = 0.5 * lb;
  } else {                               // Final: postura confiante, braços em V
    const u = clamp((t - T_FINAL) / 0.6, 0, 1), b = Math.sin((t - T_FINAL) / BEAT * Math.PI) * 0.01;
    P.aAbd = P.bAbd = 2.45 * sm(u * Math.PI); P.aFlex = P.bFlex = 0.25; P.aElb = P.bElb = 0.25;
    P.chX = -0.07; P.neckX = -0.08; P.rootY = b;
  }
  return P;
}

/* ================= Cena ================= */
function gradienteFundo() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 910;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(256, 380, 40, 256, 420, 620);
  r.addColorStop(0, '#2a2c33'); r.addColorStop(0.45, '#15161a'); r.addColorStop(1, '#050506');
  g.fillStyle = r; g.fillRect(0, 0, 512, 910);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
function texturaRadial(cores) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  cores.forEach(([p, col]) => r.addColorStop(p, col)); g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

export function iniciar(canvas, W, H) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 0.86;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  scene.background = gradienteFundo();
  const pm = new PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new PerspectiveCamera(30, W / H, 0.1, 50);

  // Luzes de estúdio
  scene.add(new HemisphereLight(0xbfc8d8, 0x101014, 0.05));
  const key = new SpotLight(0xffffff, 17, 12, 0.45, 0.65, 1.4); key.position.set(1.6, 4.2, 2.6); key.target.position.set(0, 0.9, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.radius = 6;
  scene.add(key, key.target);
  const rimA = new DirectionalLight(0x9fc4ff, 1.6); rimA.position.set(-3, 2.5, -3); scene.add(rimA);
  const rimB = new DirectionalLight(0xffffff, 1.1); rimB.position.set(3, 2, -2.5); scene.add(rimB);
  const fill = new DirectionalLight(0xffffff, 0.12); fill.position.set(-2, 1.5, 3); scene.add(fill);

  // Piso: poça de luz + sombra
  const piso = new Mesh(new CircleGeometry(3.2, 64), new MeshBasicMaterial({ map: texturaRadial([[0, 'rgba(30,31,36,1)'], [0.4, 'rgba(16,17,20,1)'], [1, 'rgba(6,6,8,1)']]), transparent: true }));
  piso.rotation.x = -Math.PI / 2; scene.add(piso);
  const sombra = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ opacity: 0.55 })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.002; sombra.receiveShadow = true; scene.add(sombra);

  // Anéis luminosos sob os pés (fase saudável)
  const aneis = [0.12, -0.12].map((x) => {
    const r = new Mesh(new RingGeometry(0.15, 0.172, 96), new MeshBasicMaterial({ color: 0x2ee6c8, transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false }));
    r.rotation.x = -Math.PI / 2; r.position.set(x, 0.004, 0.04); scene.add(r);
    const g = new Mesh(new RingGeometry(0.12, 0.21, 96), new MeshBasicMaterial({ color: 0x2ee6c8, transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false }));
    g.rotation.x = -Math.PI / 2; g.position.set(x, 0.003, 0.04); scene.add(g);
    return [r, g];
  });

  const M = criarManequim(); scene.add(M.fig);

  // Brilho da coluna (sprites aditivos ao longo das vértebras)
  const glowTex = texturaRadial([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
  const glows = M.vert.map((v, i) => {
    const s = new Sprite(new SpriteMaterial({ map: glowTex, color: 0xff2a1a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
    s.scale.set(0.09, 0.09, 1); s.position.copy(v.position); s.position.z -= 0.012; v.parent.add(s); return s;
  });
  // brilho maior na lombar
  const lomb = new Sprite(new SpriteMaterial({ map: glowTex, color: 0xff3020, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
  lomb.scale.set(0.34, 0.42, 1); lomb.position.set(0, 0.1, -0.13); M.spine.add(lomb);

  const cur = NEUTRO(); let primeiro = true;

  function aplicar(P) {
    const { root, spine, chest, neck, head, bracos, pernas } = M;
    root.position.set(P.rootX, HIP_Y + P.rootY, P.rootZ); root.rotation.set(P.rootRX, P.rootRY, P.rootRZ);
    spine.rotation.set(P.spX, P.spY, P.spZ); chest.rotation.set(P.chX, P.chY, P.chZ);
    neck.rotation.set(P.neckX, P.neckY, 0); head.rotation.x = P.headX;
    [['a', bracos[0], pernas[0], 1], ['b', bracos[1], pernas[1], -1]].forEach(([k, b, l, s]) => {
      b.ombro.rotation.order = 'YZX';
      b.ombro.rotation.set(-P[k + 'Flex'], s * P[k + 'Ry'], s * P[k + 'Abd']);
      b.clav.position.y = 0.29 + P[k + 'ShY'];
      let elb = P[k + 'Elb'];
      if (k === 'b' && P.bIK > 0.001) {
        const ik = ikBraco(new Vector3(s * 0.19, 0, 0), new Vector3(P.bTx, P.bTy - 0.29 - P.bShY, P.bTz), new Vector3(P.bPx, P.bPy, P.bPz));
        const w = clamp(P.bIK, 0, 1); b.ombro.quaternion.slerp(ik.q, w); elb = elb + (ik.elb - elb) * w;
      }
      b.cot.rotation.set(-elb, 0, 0);
      b.pulso.rotation.set(-P[k + 'Wr'], 0, 0);
      l.quadril.rotation.set(-P[k + 'Hip'], 0, s * P[k + 'HAbd']);
      l.joelho.rotation.x = P[k + 'Knee'];
      l.tornozelo.rotation.x = P[k + 'Ank'];
    });
  }

  function camera_(t) {
    let az, dist, alvoY, alt, fov = 30;
    if (t < T_DROP) {
      const u = t / T_DROP; az = Math.PI + 0.75 - 0.35 * u; dist = 3.6 - 0.3 * u; alvoY = 1.18; alt = 1.3;
    } else if (t < T_FINAL) {
      const u = (t - T_DROP) / (T_FINAL - T_DROP); az = 0.65 - 1.25 * u; dist = 5.1; alvoY = 1.12; alt = 1.15;
    } else {
      const u = (t - T_FINAL) / (T_FIM3D - T_FINAL); az = -0.25 + 0.4 * u; dist = 5.0 - 0.5 * u; alvoY = 1.15; alt = 1.2;
    }
    // "zoom punch" na virada
    const d = t - T_DROP; if (d >= 0 && d < 0.45) fov = 30 - 7 * Math.exp(-d * 9);
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(Math.sin(az) * dist, alt, Math.cos(az) * dist); camera.lookAt(0, alvoY, 0);
  }

  function quadro(t, dt = 1 / 30) {
    const alvo = pose(t);
    const k = primeiro ? 1 : 1 - Math.exp(-dt * (Math.abs(t - T_DROP) < 0.5 ? 11 : 8));
    for (const key in alvo) cur[key] += (alvo[key] - cur[key]) * k;
    primeiro = false;
    aplicar(cur);
    // Dor: brilho vermelho pulsando; some suavemente após a virada
    const dor = t < T_DROP ? 0.75 + 0.25 * Math.sin(t * 5.2) : Math.max(0, 1 - (t - T_DROP) / 0.6);
    const entrada = Math.min(1, t / 0.6);
    const g = dor * entrada;
    vertMat.emissiveIntensity = 1.6 * g; vertMat.color.copy(pele.color).lerp(VERMELHO, 0.55 * g);
    glows.forEach((s) => { s.material.opacity = 0.55 * g; });
    lomb.material.opacity = 0.5 * g;
    // Anéis teal na fase saudável
    const on = t > T_DROP + 0.2 ? Math.min(1, (t - T_DROP - 0.2) / 0.5) : 0;
    const pulso = 0.85 + 0.15 * Math.sin(t / BEAT * Math.PI * 2);
    aneis.forEach(([r, gl]) => { r.material.opacity = 0.95 * on * pulso; gl.material.opacity = 0.25 * on * pulso; });
    camera_(t);
    renderer.render(scene, camera);
  }
  return { quadro, snap() { primeiro = true; } };
}

window.cena = { iniciar, T_DROP, T_FIM3D, BPM };

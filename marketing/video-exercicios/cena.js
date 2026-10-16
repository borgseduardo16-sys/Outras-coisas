/*
 * Vídeo "3 exercícios para a coluna" — cena 3D determinística: window.cenaEx.iniciar(canvas, W, H) -> { quadro(t) }.
 * Os tempos seguem a narração (voz.mp3, 48,7 s).
 * Bundle: npx esbuild marketing/video-exercicios/cena.js --bundle --format=iife --outfile=marketing/video-exercicios/cena.bundle.js
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, BoxGeometry,
  CylinderGeometry, SphereGeometry, HemisphereLight, DirectionalLight, SpotLight, PointLight, Fog, Color, Vector3,
  CanvasTexture, RepeatWrapping, ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, DoubleSide,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { criarBoneco, ik2, dirMembro, HIP_Y, THIGH, SHIN, UARM, FARM, TORSO } from './boneco.js';

export const T_FIM = 44.0;
const PI = Math.PI;
const sm = (x) => x * x * (3 - 2 * x);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const PISO_TORNOZELO = 0.078;   // altura da articulação do tornozelo com o tênis apoiado no chão

/** Interpola chaves [[t, v], ...] com suavização. */
function chaves(t, ks) {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i][0]) { const [t0, v0] = ks[i - 1], [t1, v1] = ks[i]; return lerp(v0, v1, sm((t - t0) / (t1 - t0))); }
  }
  return ks[ks.length - 1][1];
}

/* ---------- Cenário: estúdio escuro e aconchegante, com profundidade ---------- */
function texturaPiso() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#2b2622'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {                      // tábuas
    const x = i * 64, tom = 38 + ((i * 37) % 13);
    g.fillStyle = `rgb(${tom + 6},${tom},${tom - 6})`; g.fillRect(x + 1, 0, 62, 512);
    for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(0,0,0,${0.03 + Math.random() * 0.05})`; g.fillRect(x + Math.random() * 62, 0, 1, 512); }
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, 0, 1.5, 512);
    g.fillRect(x, (i * 173) % 512, 64, 1.5);
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(4, 4); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function montarCenario(scene) {
  const m = (color, rough = 0.85, extra = {}) => new MeshStandardMaterial({ color, roughness: rough, ...extra });
  const piso = new Mesh(new PlaneGeometry(14, 14), m(0xffffff, 0.62, { map: texturaPiso() }));
  piso.rotation.x = -PI / 2; piso.receiveShadow = true; scene.add(piso);

  const paredeMat = m(0x1c1f23, 0.95);
  const W = 5.2;
  [[0, 0, -W, 0], [0, 0, W, PI], [-W, 0, 0, PI / 2], [W, 0, 0, -PI / 2]].forEach(([x, , z, ry]) => {
    const p = new Mesh(new PlaneGeometry(2 * W, 4), paredeMat); p.position.set(x, 2, z); p.rotation.y = ry; p.receiveShadow = true; scene.add(p);
  });
  // rodapé
  [[0, -W + 0.01, 0], [0, W - 0.01, PI], [-W + 0.01, 0, PI / 2], [W - 0.01, 0, -PI / 2]].forEach(([x, z, ry]) => {
    const r = new Mesh(new BoxGeometry(2 * W, 0.1, 0.02), m(0x121417, 0.7)); r.position.set(x, 0.05, z); r.rotation.y = ry; scene.add(r);
  });

  // janelas com luz suave (fora de foco no fundo)
  const janela = (x, z, ry, w = 1.5, h = 2.0) => {
    const g = new Group();
    g.add(new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: 0xbcc8d8 })));
    const caixilho = new MeshBasicMaterial({ color: 0x15181c });
    g.add(new Mesh(new PlaneGeometry(0.05, h), caixilho).translateZ(0.01));
    const hz = new Mesh(new PlaneGeometry(w, 0.05), caixilho); hz.position.set(0, 0.25, 0.01); g.add(hz);
    const moldura = new Mesh(new BoxGeometry(w + 0.12, h + 0.12, 0.04), caixilho); moldura.position.z = -0.03; g.add(moldura);
    g.position.set(x, 1.55, z); g.rotation.y = ry; scene.add(g);
    const luz = new SpotLight(0xa9bcd6, 14, 11, 0.75, 0.9, 1.4);
    luz.position.set(x * 0.92, 2.3, z * 0.92); luz.target.position.set(x * 0.2, 0, z * 0.2); scene.add(luz, luz.target);
  };
  janela(-W + 0.02, -0.6, PI / 2);
  janela(-0.9, -W + 0.02, 0, 1.3, 1.9);

  // vaso com planta (folhas alongadas)
  const planta = (x, z, s = 1) => {
    const g = new Group();
    g.add(new Mesh(new CylinderGeometry(0.2, 0.16, 0.42, 24), m(0xd8d2c8, 0.7)).translateY(0.21));
    const folha = m(0x2f4a33, 0.7, { side: DoubleSide });
    for (let i = 0; i < 16; i++) {
      const a = i * 2.4, inc = 0.35 + (i % 5) * 0.12, len = 0.55 + (i % 4) * 0.18;
      const f = new Mesh(new SphereGeometry(0.5, 12, 8), folha);
      f.scale.set(0.09, len, 0.025);
      f.position.set(Math.sin(a) * 0.12, 0.42 + len * 0.45 * Math.cos(inc), Math.cos(a) * 0.12);
      f.rotation.set(Math.cos(a) * inc, 0, -Math.sin(a) * inc);
      f.castShadow = true; g.add(f);
    }
    g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  };
  planta(-2.7, -2.6, 1.15);
  planta(2.6, 2.7, 1.0);
  planta(-2.8, 2.4, 0.9);

  // luminária de piso acesa (ponto quente no fundo)
  const lum = new Group();
  lum.add(new Mesh(new CylinderGeometry(0.015, 0.015, 1.5, 8), m(0x111111, 0.4)).translateY(0.75));
  lum.add(new Mesh(new CylinderGeometry(0.16, 0.22, 0.3, 24, 1, true), new MeshBasicMaterial({ color: 0xffd9a8, side: DoubleSide })).translateY(1.6));
  lum.position.set(2.7, 0, -2.7); scene.add(lum);
  const pl = new PointLight(0xffb070, 3.5, 4, 1.6); pl.position.set(2.7, 1.55, -2.7); scene.add(pl);

  // quadro na parede e prateleira
  const quadro = new Mesh(new BoxGeometry(0.9, 0.6, 0.03), m(0x3a3530, 0.6)); quadro.position.set(1.2, 1.7, W - 0.03); scene.add(quadro);
  const arte = new Mesh(new PlaneGeometry(0.78, 0.48), m(0x6b7a72, 0.9)); arte.position.set(1.2, 1.7, W - 0.05); arte.rotation.y = PI; scene.add(arte);
  const prat = new Mesh(new BoxGeometry(1.2, 0.04, 0.25), m(0x3b2f26, 0.6)); prat.position.set(W - 0.14, 1.3, 1.0); prat.rotation.y = PI / 2; scene.add(prat);
  for (let i = 0; i < 4; i++) {
    const l = new Mesh(new BoxGeometry(0.16, 0.24 + (i % 2) * 0.05, 0.05), m([0x7c6a58, 0x4a5560, 0x8a8478, 0x5d4c3f][i], 0.8));
    l.position.set(W - 0.14, 1.45, 0.65 + i * 0.07); l.rotation.y = PI / 2; scene.add(l);
  }

  // tapete de exercício (cinza-azulado, discreto)
  const tapete = new Mesh(new BoxGeometry(0.66, 0.012, 1.95), m(0x3d4852, 0.9));
  tapete.position.set(0, 0.006, 0); tapete.receiveShadow = true; scene.add(tapete);
}

/* ---------- Aplicação de pose (ângulos absolutos no plano sagital) ---------- */
function aplicarTronco(B, P) {
  B.root.position.set(0, P.root[0], P.root[1]);
  B.root.rotation.set(P.pel, 0, 0);
  B.spine.rotation.set(P.spi - P.pel, 0, P.spiZ || 0);
  B.chest.rotation.set(P.che - P.spi, P.cheY || 0, 0);
  B.chest.scale.set(1, 1 + 0.02 * (P.breath || 0), 1 + 0.045 * (P.breath || 0));
  B.neck.rotation.set(P.nec - P.che, 0, 0);
  B.head.rotation.set(P.cab || 0, P.cabY || 0, 0);
  B.figure.updateMatrixWorld(true);
}
const _v = new Vector3();
const pos = (obj) => { obj.getWorldPosition(_v); return [_v.y, _v.z]; };

function aplicarMembros(B, P) {
  [0, 1].forEach((i) => {
    const s = i === 0 ? 1 : -1, a = P.arms[i], l = P.legs[i];
    B.arms[i].shoulder.rotation.set(a.u - P.che, 0, s * (a.abd ?? 0.12));
    B.arms[i].elbow.rotation.set(a.f - a.u, 0, 0);
    B.arms[i].wrist.rotation.set((a.h ?? a.f) - a.f, 0, 0);
    B.legs[i].hip.rotation.set(l.t - P.pel, 0, s * (l.abd ?? 0));
    B.legs[i].knee.rotation.set(l.s - l.t, 0, 0);
    B.legs[i].ankle.rotation.set((l.f ?? 0) - l.s, 0, 0);
  });
}

/** Pernas e braços por IK a partir dos alvos (após posicionar o tronco). */
function pernasIK(B, alvos, lado, pes) {
  return [0, 1].map((i) => {
    const [t, s] = ik2(pos(B.legs[i].hip), alvos[i], THIGH, SHIN, lado);
    return { t, s, f: typeof pes === 'function' ? pes(s) : pes };
  });
}
function bracosIK(B, alvos, lado, mao, abd) {
  return [0, 1].map((i) => {
    const [u, f] = ik2(pos(B.arms[i].shoulder), alvos[i], UARM, FARM, lado);
    return { u, f, h: typeof mao === 'function' ? mao(f) : mao, abd };
  });
}

/* ---------- Poses ---------- */
// Em pé. dor: 0..1 (curvado com a mão na lombar); bracos: 0..1 (alongamento acima da cabeça); breath 0..1
function poseEmPe(B, { dor = 0, bracos = 0, breath = 0, olhar = 0 } = {}) {
  const P = {
    root: [HIP_Y + 0.075 - 0.02 * dor, -0.03 * dor], pel: 0.12 * dor - 0.03 * bracos,
    spi: 0.34 * dor - 0.05 * bracos, che: 0.5 * dor - 0.1 * bracos, nec: 0.55 * dor - 0.12 * bracos + olhar,
    breath, cab: -0.1 * dor,
  };
  aplicarTronco(B, P);
  P.legs = pernasIK(B, [[PISO_TORNOZELO, 0.0], [PISO_TORNOZELO, 0.0]], -1, 0);
  const sobe = sm(bracos);
  P.arms = [
    // lado a: mão apoiada na lombar; lado b: mão na coxa
    { u: lerp(lerp(0.02, P.che + 0.8, dor), -2.95, sobe), f: lerp(lerp(-0.12, P.che - 0.35, dor), -2.95, sobe), abd: lerp(lerp(0.13, 0.55, dor), 0.22, sobe) },
    { u: lerp(lerp(0.02, P.che - 0.75, dor), -2.95, sobe), f: lerp(lerp(-0.12, P.che - 0.45, dor), -2.95, sobe), abd: lerp(0.13, 0.22, sobe) },
  ];
  aplicarMembros(B, P);
}

// Gato-camelo, quatro apoios. s: -1 camelo (costas afundam, olha para frente) .. +1 gato (costas arredondadas)
const GATO = { base: [1.42, 1.40, 1.30, 1.55], gato: [1.16, 1.02, 1.86, 2.45], camelo: [1.66, 1.74, 1.04, 0.78] };
let alvosMaos = null;
function poseGato(B, s, breath = 0) {
  const k = Math.abs(s), alvo = s > 0 ? GATO.gato : GATO.camelo;
  const [pel, spi, che, nec] = GATO.base.map((b, i) => lerp(b, alvo[i], k));
  const P = { root: [0.53, -0.2], pel, spi, che, nec, breath };
  if (!alvosMaos) {                     // mãos fixas sob os ombros da pose neutra
    aplicarTronco(B, { ...P, pel: GATO.base[0], spi: GATO.base[1], che: GATO.base[2], nec: GATO.base[3] });
    alvosMaos = [0, 1].map((i) => [0.07, pos(B.arms[i].shoulder)[1] - 0.02]);
  }
  aplicarTronco(B, P);
  const hz = pos(B.legs[0].hip)[1];
  P.legs = pernasIK(B, [[0.045, hz - 0.43], [0.045, hz - 0.43]], -1, PI);
  P.arms = bracosIK(B, alvosMaos, 1, -PI / 2, 0.08);
  aplicarMembros(B, P);
}

// Deitado de barriga para cima, cabeça para -Z.
const SUP_Y = 0.125;
// Joelhos ao peito. s: 0 (joelhos dobrados, pés no chão) .. 1 (abraçando os joelhos)
function poseJoelhos(B, s, breath = 0, balanco = 0) {
  const P = { root: [SUP_Y, 0.15], pel: -PI / 2 + 0.12 * s, spi: -PI / 2 + 0.05 * s, che: -PI / 2 - 0.02, nec: -PI / 2 - 0.1 - 0.15 * s, breath };
  aplicarTronco(B, P);
  const [hy, hz] = pos(B.legs[0].hip);
  const alvo = [lerp(PISO_TORNOZELO, 0.36 + balanco, s), lerp(hz + 0.62, hz + 0.14, s)];
  P.legs = pernasIK(B, [alvo, alvo], -1, 0);
  P.legs.forEach((l) => { l.f = lerp(0, l.s + 1.75, s); });
  // ponto na canela, logo abaixo do joelho
  const dk = dirMembro(P.legs[0].t), joelho = [hy + dk[0] * THIGH, hz + dk[1] * THIGH];
  const canela = [lerp(joelho[0], alvo[0], 0.3) + 0.03, lerp(joelho[1], alvo[1], 0.3)];
  const shz = pos(B.arms[0].shoulder)[1];
  const chao = [0.05, shz + 0.56];
  const mao = [lerp(chao[0], canela[0], sm(clamp(s * 1.15, 0, 1))), lerp(chao[1], canela[1], sm(clamp(s * 1.15, 0, 1)))];
  P.arms = bracosIK(B, [mao, mao], -1, (f) => lerp(-PI / 2, f - 0.4, s), lerp(0.16, 0.3, s));
  aplicarMembros(B, P);
}

// Ponte. h: 0 (deitado, pés no chão) .. 1 (quadril elevado)
function posePonte(B, h, breath = 0) {
  const ombro = [SUP_Y, 0.15 - TORSO];
  const hR = SUP_Y + 0.32 * h;
  const th = -Math.acos(clamp((ombro[0] - hR) / TORSO, -1, 1));
  const root = [ombro[0] - TORSO * Math.cos(th), ombro[1] - TORSO * Math.sin(th)];
  const P = { root, pel: th, spi: th, che: th + 0.06 * h, nec: -PI / 2 - 0.08, breath };
  aplicarTronco(B, P);
  const pe = [PISO_TORNOZELO, 0.15 + 0.6];
  P.legs = pernasIK(B, [pe, pe], -1, 0);
  const shz = pos(B.arms[0].shoulder)[1];
  P.arms = bracosIK(B, [[0.05, shz + 0.55], [0.05, shz + 0.55]], -1, -PI / 2, 0.16);
  aplicarMembros(B, P);
}

/* ---------- Linha do tempo (segundos da narração) ---------- */
export const CENAS = [
  { ini: 0.0, fim: 1.35, nome: 'gancho' },
  { ini: 1.35, fim: 2.3, nome: 'previa1' },
  { ini: 2.3, fim: 3.25, nome: 'previa2' },
  { ini: 3.25, fim: 4.3, nome: 'previa3' },
  { ini: 4.3, fim: 9.45, nome: 'dor' },
  { ini: 9.45, fim: 19.5, nome: 'gato' },
  { ini: 19.5, fim: 26.9, nome: 'joelhos' },
  { ini: 26.9, fim: 34.15, nome: 'ponte' },
  { ini: 34.15, fim: T_FIM, nome: 'segredo' },
];

const respiro = (t, per = 4) => 0.5 - 0.5 * Math.cos((2 * PI * t) / per);

function animar(B, nome, t, t0) {
  const u = t - t0;
  let xr = 0, cor = 0xff3b30, foco = 1;
  switch (nome) {
    case 'gancho': {
      poseEmPe(B, { dor: 1, breath: respiro(t, 2.2) });
      xr = 0.75 + 0.25 * Math.sin(t * 9); break;
    }
    case 'previa1': poseGato(B, Math.sin(u * 2 * PI / 0.95 + PI / 2) * 0.95); break;
    case 'previa2': poseJoelhos(B, sm(clamp(u / 0.6, 0, 1))); break;
    case 'previa3': posePonte(B, sm(clamp(u / 0.6, 0, 1))); break;
    case 'dor': {
      const d = chaves(t, [[4.3, 0.55], [5.6, 1], [9.45, 1]]);
      poseEmPe(B, { dor: d, breath: respiro(t, 2.6) });
      xr = chaves(t, [[4.3, 0.25], [6.0, 0.35], [7.6, 0.4], [8.3, 1], [9.45, 1]]) * (0.82 + 0.18 * Math.sin(t * 8));
      break;
    }
    case 'gato': {
      const s = chaves(t, [[9.45, 0], [11.7, 0], [13.5, 1], [15.3, 1], [17.0, -1], [18.2, 0.85], [19.5, -0.7]]);
      poseGato(B, s, respiro(t, 3.4));
      xr = 0.0; break;
    }
    case 'joelhos': {
      const s = chaves(t, [[19.5, 0], [20.6, 0], [22.3, 1], [26.9, 1]]);
      const bal = s > 0.95 ? 0.025 * Math.sin((t - 22.3) * 1.6) : 0;
      poseJoelhos(B, s, respiro(t - 22, 3.2), bal); break;
    }
    case 'ponte': {
      const h = chaves(t, [[26.9, 0], [29.4, 0], [31.3, 1], [31.95, 1], [32.95, 0], [33.25, 0], [34.15, 0.85]]);
      posePonte(B, h, respiro(t, 3)); break;
    }
    case 'segredo': {
      const b = chaves(t, [[34.15, 0], [35.4, 0], [37.2, 1], [40.4, 1], [42.4, 0]]);
      poseEmPe(B, { bracos: b, breath: respiro(t, 3.6), olhar: -0.12 * b });
      xr = chaves(t, [[34.15, 0], [35.0, 0], [36.2, 0.9], [42.5, 0.9], [43.6, 0]]) * (0.85 + 0.15 * Math.sin(t * 3));
      cor = 0x2ee6c8; foco = 0.35; break;
    }
  }
  B.xray.definir(xr, cor, foco);
}

/* ---------- Câmera por cena (posição, alvo, fov) com pequeno balanço "de mão" ---------- */
function orbita(az, el, dist, alvo) {
  return [alvo[0] + Math.sin(az) * Math.cos(el) * dist, alvo[1] + Math.sin(el) * dist, alvo[2] + Math.cos(az) * Math.cos(el) * dist];
}
function cameraDe(nome, t, t0, t1) {
  const k = clamp((t - t0) / (t1 - t0), 0, 1), e = sm(k);
  switch (nome) {
    case 'gancho': return { p: orbita(lerp(2.55, 2.75, e), 0.02, lerp(3.4, 2.8, e), [0, 1.38, 0]), a: [0, 1.38, 0], fov: 32 };
    case 'previa1': return { p: orbita(1.15, 0.22, 3.2, [0, 0.42, 0.1]), a: [0, 0.42, 0.1], fov: 34 };
    case 'previa2': return { p: orbita(1.0, 0.42, 3.2, [0, 0.25, 0.0]), a: [0, 0.25, 0.0], fov: 42 };
    case 'previa3': return { p: orbita(1.1, 0.3, 3.2, [0, 0.25, 0.0]), a: [0, 0.25, 0.0], fov: 42 };
    case 'dor': return { p: orbita(lerp(1.7, 2.6, e), lerp(0.05, 0.12, e), lerp(4.2, 3.3, e), [0, 1.05, 0]), a: [0, 1.05, 0], fov: 34 };
    case 'gato': return { p: orbita(lerp(1.05, 1.4, e), lerp(0.18, 0.26, e), lerp(3.5, 3.1, e), [0, 0.42, 0.12]), a: [0, 0.42, 0.12], fov: 36 };
    case 'joelhos': return { p: orbita(lerp(0.95, 1.2, e), lerp(0.42, 0.5, e), lerp(3.6, 3.2, e), [0, 0.22, -0.05]), a: [0, 0.22, -0.05], fov: 42 };
    case 'ponte': return { p: orbita(lerp(1.3, 1.02, e), lerp(0.26, 0.32, e), lerp(3.7, 3.3, e), [0, 0.25, 0.0]), a: [0, 0.25, 0.0], fov: 42 };
    case 'segredo': return { p: orbita(lerp(2.25, 2.6, e), lerp(0.04, 0.1, e), lerp(3.9, 3.3, e), [0, 1.15, 0]), a: [0, 1.15, 0], fov: 38 };
  }
  return { p: [3, 1.5, 3], a: [0, 1, 0], fov: 35 };
}

export function cenaEm(t) { return CENAS.find((c) => t >= c.ini && t < c.fim) || CENAS[CENAS.length - 1]; }

export async function iniciar(canvas, W, H) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  scene.background = new Color(0x0c0e11);
  scene.fog = new Fog(0x0c0e11, 5, 13);
  scene.add(new HemisphereLight(0x8fa3b8, 0x2a221c, 0.55));
  const key = new SpotLight(0xffe2c4, 42, 12, 0.62, 0.65, 1.6);
  key.position.set(1.6, 4.2, 2.0); key.target.position.set(0, 0.5, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 4; key.shadow.bias = -0.0004;
  key.shadow.camera.near = 1; key.shadow.camera.far = 9;
  scene.add(key, key.target);
  const rim = new DirectionalLight(0x9fc0ff, 1.6); rim.position.set(-3, 2.4, -2.6); scene.add(rim);
  const fill = new DirectionalLight(0xffe9d6, 0.45); fill.position.set(3, 1.2, -1); scene.add(fill);

  montarCenario(scene);
  const B = criarBoneco(); scene.add(B.figure);

  const camera = new PerspectiveCamera(35, W / H, 0.05, 40);
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 3.3, aperture: 0.0016, maxblur: 0.007 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());

  function quadro(t) {
    const c = cenaEm(t);
    animar(B, c.nome, t, c.ini);
    const cam = window.camFixa || cameraDe(c.nome, t, c.ini, c.fim);
    const sway = [Math.sin(t * 0.9) * 0.02 + Math.sin(t * 2.3) * 0.006, Math.sin(t * 1.3 + 1) * 0.012, Math.cos(t * 0.7) * 0.02];
    camera.position.set(cam.p[0] + sway[0], cam.p[1] + sway[1], cam.p[2] + sway[2]);
    camera.fov = cam.fov; camera.updateProjectionMatrix();
    camera.lookAt(cam.a[0], cam.a[1], cam.a[2]);
    bokeh.uniforms.focus.value = camera.position.distanceTo(new Vector3(...cam.a));
    composer.render();
  }
  return { quadro, cenaEm };
}

window.cenaEx = { iniciar, T_FIM, CENAS };

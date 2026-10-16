/*
 * Vídeo sem narração (só música do TikTok): tenta pegar um livro, trava, faz "não" com o dedo,
 * transição, exercícios fluidos e, no fim, pega o livro sem esforço. Cenário: sala de estar clara.
 * window.cenaSemVoz.iniciar(canvas, W, H) -> { quadro(t) }
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
import { criarBoneco, HIP_Y } from './boneco.js';
import {
  aplicarTronco, aplicarMembros, pernasIK, bracosIK, poseEmPe, poseGato, poseJoelhos, posePonte,
  chaves, orbita, sm, clamp, lerp, PISO_TORNOZELO, respiro,
} from './cena.js';

export const T_FIM = 15.6;
const PI = Math.PI;
const LIVRO = [0.2, 0.02, 0.36];
const _w = new Vector3();

/* ---------- Sala de estar clara (luz do dia) ---------- */
function texturaMadeira() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    const x = i * 64, tom = 150 + ((i * 29) % 22);
    g.fillStyle = `rgb(${tom},${tom - 32},${tom - 70})`; g.fillRect(x, 0, 64, 512);
    for (let k = 0; k < 50; k++) { g.fillStyle = `rgba(80,50,20,${0.04 + Math.random() * 0.06})`; g.fillRect(x + Math.random() * 62, 0, 1, 512); }
    g.fillStyle = 'rgba(60,40,20,.5)'; g.fillRect(x, 0, 1.5, 512); g.fillRect(x, (i * 173) % 512, 64, 1.5);
  }
  const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(5, 5); t.colorSpace = SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function montarSala(scene) {
  const m = (color, rough = 0.85, extra = {}) => new MeshStandardMaterial({ color, roughness: rough, ...extra });
  const piso = new Mesh(new PlaneGeometry(14, 14), m(0xffffff, 0.55, { map: texturaMadeira() }));
  piso.rotation.x = -PI / 2; piso.receiveShadow = true; scene.add(piso);
  const W = 4.6;
  const parede = m(0xcfc3b3, 0.95);
  [[0, -W, 0], [0, W, PI], [-W, 0, PI / 2], [W, 0, -PI / 2]].forEach(([x, z, ry]) => {
    const p = new Mesh(new PlaneGeometry(2 * W, 4.2), parede); p.position.set(x, 2.1, z); p.rotation.y = ry; p.receiveShadow = true; scene.add(p);
    const r = new Mesh(new BoxGeometry(2 * W, 0.12, 0.02), m(0xf2eee8, 0.6)); r.position.set(x * 0.998, 0.06, z * 0.998); r.rotation.y = ry; scene.add(r);
  });
  // janela grande com luz do dia
  const jan = new Group();
  jan.add(new Mesh(new PlaneGeometry(2.2, 2.0), new MeshBasicMaterial({ color: 0xf4f7fb })));
  const cx = new MeshBasicMaterial({ color: 0xece6dc });
  [-0.55, 0.55].forEach((x) => { const v = new Mesh(new PlaneGeometry(0.06, 2.0), cx); v.position.set(x, 0, 0.01); jan.add(v); });
  const hz = new Mesh(new PlaneGeometry(2.2, 0.06), cx); hz.position.set(0, 0.3, 0.01); jan.add(hz);
  const mold = new Mesh(new BoxGeometry(2.36, 2.16, 0.06), m(0xece6dc, 0.6)); mold.position.z = -0.04; jan.add(mold);
  // cortinas de linho
  [-1.35, 1.35].forEach((x) => { const c = new Mesh(new BoxGeometry(0.45, 2.6, 0.06), m(0xe9e1d3, 0.95)); c.position.set(x, -0.05, 0.08); c.castShadow = true; jan.add(c); });
  jan.position.set(-W + 0.03, 1.6, -0.4); jan.rotation.y = PI / 2; scene.add(jan);
  const sol = new SpotLight(0xfff1dc, 60, 12, 0.6, 0.6, 1.3);
  sol.position.set(-W + 0.4, 2.6, -0.4); sol.target.position.set(0.6, 0, 0.1);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.radius = 6; sol.shadow.bias = -0.0004;
  scene.add(sol, sol.target);

  // sofá cinza-claro
  const sofa = new Group(); const tec = m(0x9a958d, 0.95);
  sofa.add(new Mesh(new BoxGeometry(2.2, 0.42, 0.9), tec).translateY(0.21));
  sofa.add(new Mesh(new BoxGeometry(2.2, 0.5, 0.22), tec).translateY(0.62).translateZ(-0.34));
  [-1.0, 1.0].forEach((x) => sofa.add(new Mesh(new BoxGeometry(0.22, 0.6, 0.9), tec).translateX(x).translateY(0.3)));
  [-0.5, 0.5].forEach((x) => sofa.add(new Mesh(new BoxGeometry(0.95, 0.14, 0.62), m(0xa8a39b, 0.95)).translateX(x).translateY(0.49).translateZ(0.06)));
  sofa.add(new Mesh(new BoxGeometry(0.38, 0.32, 0.12), m(0x7f8a76, 0.95)).translateX(-0.62).translateY(0.68).translateZ(-0.16));
  sofa.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  sofa.position.set(0.4, 0, -2.8); scene.add(sofa);

  // tapete
  const tap = new Mesh(new BoxGeometry(2.6, 0.012, 3.0), m(0xb9ab98, 1.0)); tap.position.set(0, 0.006, 0); tap.receiveShadow = true; scene.add(tap);
  const tap2 = new Mesh(new BoxGeometry(2.4, 0.013, 2.8), m(0xd8ccbb, 1.0)); tap2.position.set(0, 0.007, 0); tap2.receiveShadow = true; scene.add(tap2);

  // estante com livros e vasos
  const est = new Group(); const mad = m(0x8a6a4a, 0.6);
  [0.0, 0.55, 1.1, 1.65].forEach((y) => est.add(new Mesh(new BoxGeometry(1.2, 0.04, 0.32), mad).translateY(y + 0.02)));
  [-0.6, 0.6].forEach((x) => est.add(new Mesh(new BoxGeometry(0.04, 1.7, 0.32), mad).translateX(x).translateY(0.85)));
  const cores = [0x6d7b8a, 0xb7a58c, 0x8c5e4a, 0x5f6b58, 0xd2c6b2, 0x404850];
  for (let n = 0; n < 3; n++) for (let i = 0; i < 6; i++) {
    const l = new Mesh(new BoxGeometry(0.06, 0.24 + (i % 3) * 0.03, 0.22), m(cores[(i + n) % 6], 0.8));
    l.position.set(-0.45 + i * 0.075, 0.6 + n * 0.55 + 0.13, 0); est.add(l);
  }
  est.add(new Mesh(new CylinderGeometry(0.07, 0.06, 0.18, 16), m(0xf0ece4, 0.5)).translateX(0.35).translateY(0.15));
  est.traverse((o) => { o.castShadow = true; o.receiveShadow = true; });
  est.position.set(W - 0.2, 0, 1.2); est.rotation.y = -PI / 2; scene.add(est);

  // plantas
  const planta = (x, z, s = 1) => {
    const g = new Group();
    g.add(new Mesh(new CylinderGeometry(0.2, 0.16, 0.4, 24), m(0x6b5b4b, 0.8)).translateY(0.2));
    const folha = m(0x4f7350, 0.7, { side: DoubleSide });
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4, inc = 0.3 + (i % 5) * 0.12, len = 0.5 + (i % 4) * 0.17;
      const f = new Mesh(new SphereGeometry(0.5, 12, 8), folha); f.scale.set(0.1, len, 0.025);
      f.position.set(Math.sin(a) * 0.12, 0.4 + len * 0.45 * Math.cos(inc), Math.cos(a) * 0.12);
      f.rotation.set(Math.cos(a) * inc, 0, -Math.sin(a) * inc); f.castShadow = true; g.add(f);
    }
    g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  };
  planta(-3.6, -3.4, 1.2); planta(3.5, -3.3, 1.0); planta(-3.7, 3.4, 0.9);

  // luminária de piso
  const lum = new Group();
  lum.add(new Mesh(new CylinderGeometry(0.015, 0.015, 1.5, 8), m(0x222222, 0.4)).translateY(0.75));
  lum.add(new Mesh(new CylinderGeometry(0.17, 0.23, 0.3, 24, 1, true), new MeshBasicMaterial({ color: 0xfff0d8, side: DoubleSide })).translateY(1.6));
  lum.position.set(-2.2, 0, -3.6); scene.add(lum);
  const pl = new PointLight(0xffc68a, 3, 4, 1.5); pl.position.set(-2.2, 1.55, -3.6); scene.add(pl);

  // quadro
  const q = new Mesh(new BoxGeometry(1.1, 0.75, 0.03), m(0x2d2a26, 0.6)); q.position.set(0.4, 1.85, -W + 0.03); scene.add(q);
  const arte = new Mesh(new PlaneGeometry(0.98, 0.63), m(0x9fae9b, 0.9)); arte.position.set(0.4, 1.85, -W + 0.05); scene.add(arte);
}

/* ---------- Pose: abaixar para pegar o livro (travado ou agachando direito) ---------- */
function poseAbaixar(B, k, { bom = 0, alcance = 1, costas = 0, breath = 0 } = {}) {
  const P = {
    root: [HIP_Y + 0.075 - lerp(0.05, 0.53, bom) * k, -lerp(0.06, 0.22, bom) * k],
    pel: lerp(0.25, 0.75, bom) * k, spi: lerp(0.7, 0.85, bom) * k, che: 0.95 * k,
    nec: lerp(1.0, 0.75, bom) * k, breath, cab: -0.15 * costas,
  };
  aplicarTronco(B, P);
  P.legs = pernasIK(B, [[PISO_TORNOZELO, 0.0], [PISO_TORNOZELO, 0.0]], -1, 0);
  B.arms[0].shoulder.getWorldPosition(_w);
  const solto = [_w.y - 0.56, _w.z + 0.05];
  const alvo = [lerp(solto[0], LIVRO[1] + 0.12, alcance * sm(k)), lerp(solto[1], LIVRO[2], alcance * sm(k))];
  const [a] = bracosIK(B, [alvo, alvo], 1, (f) => f, 0.2);
  const lombar = { u: P.che + 0.8, f: P.che - 0.35, h: P.che - 0.35, abd: 0.55 };
  P.arms = [
    { u: lerp(a.u, lombar.u, costas), f: lerp(a.f, lombar.f, costas), h: lerp(a.h, lombar.h, costas), abd: lerp(a.abd, lombar.abd, costas) },
    { u: P.che * 0.55 - 0.25 * k, f: P.che * 0.55 - 0.7 * k, abd: 0.14 },
  ];
  aplicarMembros(B, P);
}

/* Em pé, olhando para a câmera, com a mão na lombar e fazendo "não" com o dedo (braço b). */
function poseNao(B, t, g, dorK) {
  poseEmPe(B, { dor: 0.35 * dorK, breath: respiro(t, 2) });
  const B1 = B.arms[1];
  // braço b sobe: antebraço para cima, dedo para cima, balançando de um lado para o outro
  const u = lerp(0.02, -0.45, g), f = lerp(-0.12, -2.55, g), h = lerp(-0.12, -2.75, g);
  B1.shoulder.rotation.set(u - (0.5 * 0.35 * dorK), 0, -lerp(0.13, 0.32, g));
  B1.elbow.rotation.set(f - u, 0, 0);
  B1.wrist.rotation.set(h - f, 0, 0);
  B1.elbow.rotation.z = g * 0.32 * Math.sin(t * 13);
  B1.dedo.visible = g > 0.4;
  B.head.rotation.y = g * 0.22 * Math.sin(t * 9 + 0.6);
}

/* ---------- Linha do tempo ---------- */
export const CENAS = [
  { ini: 0.0, fim: 4.1, nome: 'trava' },
  { ini: 4.1, fim: 6.0, nome: 'nao' },
  { ini: 6.0, fim: 8.1, nome: 'gato' },
  { ini: 8.1, fim: 10.1, nome: 'joelhos' },
  { ini: 10.1, fim: 12.1, nome: 'ponte' },
  { ini: 12.1, fim: T_FIM + 1, nome: 'pega' },
];
export const cenaEm = (t) => CENAS.find((c) => t >= c.ini && t < c.fim) || CENAS[CENAS.length - 1];

let segurando = false;
function animar(B, nome, t, t0) {
  const u = t - t0;
  let xr = 0, cor = 0xff3b30, foco = 1;
  segurando = false;
  B.arms.forEach((a) => { a.dedo.visible = false; });
  switch (nome) {
    case 'trava': {
      const k = chaves(t, [[0, 0], [0.7, 0], [1.9, 0.62], [2.1, 0.55], [2.7, 0.42], [4.1, 0.3]]);
      const costas = chaves(t, [[1.95, 0], [2.45, 1]]);
      poseAbaixar(B, k, { bom: 0, alcance: 1 - costas, costas, breath: respiro(t, 1.5) });
      xr = chaves(t, [[1.85, 0], [2.1, 1], [4.1, 0.85]]) * (0.8 + 0.2 * Math.sin(t * 10));
      break;
    }
    case 'nao': {
      const g = chaves(t, [[4.1, 0], [4.55, 1], [5.75, 1], [6.0, 0.6]]);
      poseNao(B, t, g, chaves(t, [[4.1, 1], [5.0, 0.6]]));
      xr = 0; break;
    }
    case 'gato': poseGato(B, Math.sin(u * 2 * PI / 1.05 + PI / 2) * 0.95, respiro(t, 2)); break;
    case 'joelhos': {
      const s = chaves(t, [[8.1, 0], [8.75, 1], [9.4, 1], [9.75, 0.75], [10.1, 1]]);
      poseJoelhos(B, s, respiro(t, 1.6), 0.02 * Math.sin(u * 4)); break;
    }
    case 'ponte': posePonte(B, 0.5 - 0.5 * Math.cos(u * 2 * PI / 1.0)); break;
    case 'pega': {
      const k = chaves(t, [[12.1, 0], [12.35, 0], [13.15, 1], [13.4, 1], [14.15, 0]]);
      segurando = t >= 13.3;
      if (t < 14.15) poseAbaixar(B, k, { bom: 1, alcance: 1, breath: respiro(t, 3) });
      else poseEmPe(B, { bracos: chaves(t, [[14.15, 0], [14.9, 0.9], [T_FIM, 0.9]]), breath: respiro(t, 3), olhar: -0.08 });
      xr = chaves(t, [[13.5, 0], [14.3, 0.95]]) * (0.88 + 0.12 * Math.sin(t * 3));
      cor = 0x2ee6c8; foco = 0.35; break;
    }
  }
  B.xray.definir(xr, cor, foco);
}

function cameraDe(nome, t, t0, t1) {
  const e = sm(clamp((t - t0) / (t1 - t0), 0, 1));
  switch (nome) {
    case 'trava': return { p: orbita(lerp(1.0, 1.35, e), lerp(0.08, 0.05, e), lerp(3.4, 2.7, e), [0, lerp(1.0, 0.95, e), 0.05]), a: [0, lerp(1.0, 0.95, e), 0.05], fov: 40 };
    case 'nao': return { p: orbita(lerp(0.45, 0.25, e), 0.02, lerp(2.25, 2.0, e), [-0.08, 1.42, 0]), a: [-0.08, 1.42, 0], fov: 40 };
    case 'gato': return { p: orbita(lerp(0.95, 1.3, e), lerp(0.18, 0.24, e), lerp(3.7, 3.4, e), [0, 0.42, 0.15]), a: [0, 0.42, 0.15], fov: 40 };
    case 'joelhos': return { p: orbita(lerp(0.9, 1.2, e), lerp(0.45, 0.4, e), lerp(3.3, 3.0, e), [0, 0.22, -0.05]), a: [0, 0.22, -0.05], fov: 42 };
    case 'ponte': return { p: orbita(lerp(1.2, 0.95, e), 0.3, lerp(3.8, 3.5, e), [0, 0.25, 0.0]), a: [0, 0.25, 0.0], fov: 42 };
    case 'pega': return { p: orbita(lerp(1.1, 0.55, e), lerp(0.1, 0.05, e), lerp(3.4, 3.0, e), [0, lerp(0.95, 1.15, e), 0.05]), a: [0, lerp(0.95, 1.15, e), 0.05], fov: 42 };
  }
  return { p: [3, 1.5, 3], a: [0, 1, 0], fov: 40 };
}

export async function iniciar(canvas, W, H) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  scene.background = new Color(0xcfc3b3);
  scene.fog = new Fog(0xcfc3b3, 7, 16);
  scene.add(new HemisphereLight(0xf2f5fa, 0x8a7458, 1.25));
  const key = new SpotLight(0xfff4e6, 30, 12, 0.75, 0.8, 1.5);
  key.position.set(2.0, 4.0, 2.4); key.target.position.set(0, 0.6, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.radius = 6; key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const fill = new DirectionalLight(0xffffff, 0.6); fill.position.set(3, 2, 3); scene.add(fill);

  montarSala(scene);
  const B = criarBoneco({ camiseta: 0xcbbfa9, calca: 0x3d4045 });   // camiseta areia, calça grafite
  scene.add(B.figure);

  const livro = new Group();
  livro.add(new Mesh(new BoxGeometry(0.17, 0.035, 0.24), new MeshStandardMaterial({ color: 0x5b6f86, roughness: 0.7 })));
  const paginas = new Mesh(new BoxGeometry(0.16, 0.028, 0.232), new MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.9 }));
  paginas.position.x = 0.006; livro.add(paginas);
  livro.traverse((o) => { o.castShadow = true; }); scene.add(livro);

  const camera = new PerspectiveCamera(40, W / H, 0.05, 40);
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.0012, maxblur: 0.005 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());

  function quadro(t) {
    const c = cenaEm(t);
    animar(B, c.nome, t, c.ini);
    livro.visible = ['trava', 'nao', 'pega'].includes(c.nome);
    if (segurando) {
      B.arms[0].wrist.updateMatrixWorld(true);
      livro.position.copy(B.arms[0].wrist.localToWorld(new Vector3(0, -0.09, 0.03)));
      B.arms[0].wrist.getWorldQuaternion(livro.quaternion); livro.rotateX(PI / 2);
    } else { livro.position.set(...LIVRO); livro.rotation.set(0, 0.6, 0); }

    const cam = window.camFixa || cameraDe(c.nome, t, c.ini, c.fim);
    const sway = [Math.sin(t * 0.9) * 0.015, Math.sin(t * 1.3 + 1) * 0.01, Math.cos(t * 0.7) * 0.015];
    camera.position.set(cam.p[0] + sway[0], cam.p[1] + sway[1], cam.p[2] + sway[2]);
    camera.fov = cam.fov; camera.updateProjectionMatrix();
    camera.lookAt(...cam.a);
    bokeh.uniforms.focus.value = camera.position.distanceTo(new Vector3(...cam.a));
    composer.render();
  }
  return { quadro };
}

window.cenaSemVoz = { iniciar, T_FIM };

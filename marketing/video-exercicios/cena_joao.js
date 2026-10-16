/*
 * Vídeo "A jornada do João" — cena 3D determinística: window.cenaJoao.iniciar(canvas, W, H) -> { quadro(t) }.
 * Tempos seguem a narração (voz de 17,3 s). Reaproveita boneco, cenário e exercícios do vídeo anterior.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, MeshStandardMaterial, BoxGeometry, HemisphereLight, DirectionalLight,
  SpotLight, Fog, Color, Vector3, ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { criarBoneco, HIP_Y } from './boneco.js';
import {
  montarCenario, aplicarTronco, aplicarMembros, pernasIK, bracosIK, poseEmPe, poseGato, poseJoelhos, posePonte,
  chaves, orbita, sm, clamp, lerp, PISO_TORNOZELO, respiro,
} from './cena.js';

export const T_FIM = 15.8;
const PI = Math.PI;
const OBJ = [0.2, 0.012, 0.36];          // celular no chão (x, y, z)
const _w = new Vector3();

/**
 * Abaixar para pegar algo no chão.
 * k: 0 (em pé) .. 1 (no ponto mais baixo); bom: 0 = travado (curva só a coluna) .. 1 = agacha com as pernas.
 * alcance: o braço "a" vai até o celular; costas: 0..1 leva a mão "a" à lombar (dor).
 */
function poseAbaixar(B, k, { bom = 0, alcance = 1, costas = 0, breath = 0 } = {}) {
  const P = {
    root: [HIP_Y + 0.075 - lerp(0.05, 0.53, bom) * k, -lerp(0.06, 0.22, bom) * k],
    pel: lerp(0.25, 0.75, bom) * k, spi: lerp(0.7, 0.85, bom) * k, che: lerp(0.95, 0.95, bom) * k,
    nec: lerp(1.0, 0.75, bom) * k, breath, cab: -0.15 * costas,
  };
  aplicarTronco(B, P);
  P.legs = pernasIK(B, [[PISO_TORNOZELO, 0.0], [PISO_TORNOZELO, 0.0]], -1, 0);
  // braço a: pendurado -> celular; ou mão na lombar
  const [oy, oz] = [OBJ[1] + 0.11, OBJ[2]];
  B.arms[0].shoulder.getWorldPosition(_w);
  const solto = [_w.y - 0.56, _w.z + 0.05];
  const alvo = [lerp(solto[0], oy, alcance * sm(k)), lerp(solto[1], oz, alcance * sm(k))];
  const [a] = bracosIK(B, [alvo, alvo], 1, (f) => f, 0.2);
  const lombar = { u: P.che + 0.8, f: P.che - 0.35, h: P.che - 0.35, abd: 0.55 };
  const armA = { u: lerp(a.u, lombar.u, costas), f: lerp(a.f, lombar.f, costas), h: lerp(a.h, lombar.h, costas), abd: lerp(a.abd, lombar.abd, costas) };
  // braço b: apoia na coxa
  const armB = { u: P.che * 0.55 - 0.25 * k, f: P.che * 0.55 - 0.7 * k, abd: 0.14 };
  P.arms = [armA, armB];
  aplicarMembros(B, P);
}

/* ---------- Linha do tempo ---------- */
export const CENAS = [
  { ini: 0.0, fim: 1.3, nome: 'apresenta' },
  { ini: 1.3, fim: 5.5, nome: 'trava' },
  { ini: 5.5, fim: 6.65, nome: 'm_gato' },
  { ini: 6.65, fim: 7.8, nome: 'm_joelhos' },
  { ini: 7.8, fim: 8.95, nome: 'm_ponte' },
  { ini: 8.95, fim: 10.1, nome: 'm_gato2' },
  { ini: 10.1, fim: 14.1, nome: 'dia10' },
  { ini: 14.1, fim: T_FIM + 1, nome: 'final' },
];
export const cenaEm = (t) => CENAS.find((c) => t >= c.ini && t < c.fim) || CENAS[CENAS.length - 1];

let segurando = false;
function animar(B, nome, t, t0) {
  const u = t - t0;
  let xr = 0, cor = 0xff3b30, foco = 1;
  segurando = false;
  switch (nome) {
    case 'apresenta': poseEmPe(B, { breath: respiro(t, 3.2) }); break;
    case 'trava': {
      const k = chaves(t, [[1.3, 0], [1.7, 0], [2.85, 0.62], [3.05, 0.55], [3.6, 0.42], [5.5, 0.38]]);
      const costas = chaves(t, [[2.9, 0], [3.4, 1]]);
      poseAbaixar(B, k, { bom: 0, alcance: 1 - costas, costas, breath: respiro(t, 1.6) });
      xr = chaves(t, [[2.8, 0], [3.05, 1], [5.5, 0.9]]) * (0.8 + 0.2 * Math.sin(t * 10));
      break;
    }
    case 'm_gato': poseGato(B, Math.sin(u * 2 * PI / 1.1 + PI / 2) * 0.95); break;
    case 'm_joelhos': poseJoelhos(B, sm(clamp(u / 0.65, 0, 1)), 0, 0); break;
    case 'm_ponte': posePonte(B, sm(clamp(u / 0.6, 0, 1))); break;
    case 'm_gato2': poseGato(B, Math.sin(u * 2 * PI / 1.1 - PI / 2) * 0.95); break;
    case 'dia10': {
      const k = chaves(t, [[10.1, 0], [10.5, 0], [11.45, 1], [11.75, 1], [12.6, 0], [14.1, 0]]);
      segurando = t >= 11.6;
      if (t < 12.6) poseAbaixar(B, k, { bom: 1, alcance: t < 11.75 ? 1 : 1, breath: respiro(t, 3) });
      else poseEmPe(B, { bracos: chaves(t, [[12.6, 0], [13.4, 1], [14.1, 1]]), breath: respiro(t, 3), olhar: -0.1 });
      xr = chaves(t, [[12.0, 0], [12.8, 0.95], [14.1, 0.95]]) * (0.88 + 0.12 * Math.sin(t * 3));
      cor = 0x2ee6c8; foco = 0.35; break;
    }
    case 'final': {
      const b = chaves(t, [[14.1, 1], [14.9, 0]]);
      poseEmPe(B, { bracos: b, breath: respiro(t, 3), olhar: -0.05 });
      segurando = true;
      xr = 0.9 * (0.88 + 0.12 * Math.sin(t * 3)); cor = 0x2ee6c8; foco = 0.35; break;
    }
  }
  B.xray.definir(xr, cor, foco);
}

function cameraDe(nome, t, t0, t1) {
  const e = sm(clamp((t - t0) / (t1 - t0), 0, 1));
  switch (nome) {
    case 'apresenta': return { p: orbita(lerp(0.75, 0.95, e), 0.03, lerp(3.5, 3.0, e), [0, 1.22, 0]), a: [0, 1.22, 0], fov: 38 };
    case 'trava': return { p: orbita(lerp(1.2, 1.4, e), lerp(0.1, 0.06, e), lerp(3.3, 2.8, e), [0, 0.95, 0.05]), a: [0, 0.95, 0.05], fov: 40 };
    case 'm_gato': case 'm_gato2': return { p: orbita(lerp(1.05, 1.25, e), 0.22, 3.1, [0, 0.42, 0.12]), a: [0, 0.42, 0.12], fov: 38 };
    case 'm_joelhos': return { p: orbita(lerp(0.95, 1.1, e), 0.45, 3.2, [0, 0.22, -0.05]), a: [0, 0.22, -0.05], fov: 42 };
    case 'm_ponte': return { p: orbita(lerp(1.2, 1.05, e), 0.3, 3.3, [0, 0.25, 0.0]), a: [0, 0.25, 0.0], fov: 42 };
    case 'dia10': return { p: orbita(lerp(1.15, 1.6, e), lerp(0.1, 0.05, e), lerp(3.4, 3.1, e), [0, 1.0, 0.05]), a: [0, 1.0, 0.05], fov: 42 };
    case 'final': return { p: orbita(lerp(0.9, 0.45, e), 0.04, lerp(3.3, 2.5, e), [0, 1.25, 0]), a: [0, 1.25, 0], fov: 38 };
  }
  return { p: [3, 1.5, 3], a: [0, 1, 0], fov: 40 };
}

export async function iniciar(canvas, W, H) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  scene.background = new Color(0x10131a);
  scene.fog = new Fog(0x10131a, 6, 15);
  // luz mais clara e natural: céu suave + sol de fim de tarde entrando pela janela + preenchimento quente
  scene.add(new HemisphereLight(0xb9cbe0, 0x3a2e24, 0.95));
  const key = new SpotLight(0xffe6cc, 55, 13, 0.7, 0.7, 1.5);
  key.position.set(1.8, 4.3, 2.2); key.target.position.set(0, 0.6, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 5; key.shadow.bias = -0.0004;
  key.shadow.camera.near = 1; key.shadow.camera.far = 10;
  scene.add(key, key.target);
  const sol = new DirectionalLight(0xffd2a1, 1.1); sol.position.set(-4, 2.6, -1); scene.add(sol);
  const rim = new DirectionalLight(0xa9c6ff, 1.3); rim.position.set(-3, 2.4, -2.6); scene.add(rim);
  const fill = new DirectionalLight(0xfff0e0, 0.75); fill.position.set(3, 1.5, 2.5); scene.add(fill);

  montarCenario(scene);
  const B = criarBoneco(); scene.add(B.figure);

  const cel = new Mesh(new BoxGeometry(0.075, 0.011, 0.155), new MeshStandardMaterial({ color: 0x15171b, roughness: 0.25, metalness: 0.4 }));
  cel.castShadow = true; scene.add(cel);
  const tela = new Mesh(new BoxGeometry(0.066, 0.002, 0.14), new MeshStandardMaterial({ color: 0x223040, emissive: 0x1b3a52, emissiveIntensity: 0.6, roughness: 0.2 }));
  tela.position.y = 0.0065; cel.add(tela);

  const camera = new PerspectiveCamera(40, W / H, 0.05, 40);
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bokeh = new BokehPass(scene, camera, { focus: 3.2, aperture: 0.0014, maxblur: 0.006 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());

  function quadro(t) {
    const c = cenaEm(t);
    animar(B, c.nome, t, c.ini);
    // celular: no chão até ser pego no dia 10; depois acompanha a mão
    const noChao = ['apresenta', 'trava', 'dia10'].includes(c.nome) && !segurando;
    cel.visible = noChao || segurando;
    if (segurando) {
      B.arms[0].wrist.updateMatrixWorld(true);
      cel.position.copy(B.arms[0].wrist.localToWorld(new Vector3(0, -0.075, 0.03)));
      cel.quaternion.copy(B.arms[0].wrist.getWorldQuaternion(cel.quaternion)); cel.rotateX(PI / 2);
    } else { cel.position.set(...OBJ); cel.rotation.set(0, 0.5, 0); }

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

window.cenaJoao = { iniciar, T_FIM };

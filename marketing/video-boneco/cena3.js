/*
 * Vídeo "coluna" v3 (cinematográfico): várias tomadas com cortes na batida, profundidade de campo e bloom.
 * Base: v2 — boneco Y Bot do Mixamo com animações de captura de movimento.
 * Estúdio escuro, coluna com brilho vermelho na fase de dor, anéis luminosos na fase ativa.
 * Determinístico: window.cena2.quadro(t) desenha o instante t (s).
 * Build: npx esbuild marketing/video-boneco/cena3.js --bundle --format=iife --outfile=marketing/video-boneco/cena3.bundle.js
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, ShadowMaterial,
  CircleGeometry, RingGeometry, PlaneGeometry, SpotLight, DirectionalLight, HemisphereLight, Color, CanvasTexture,
  Sprite, SpriteMaterial, AdditiveBlending, ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, PMREMGenerator,
  DoubleSide, AnimationMixer, LoopRepeat, Vector3, Quaternion, BufferAttribute,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Vector2 } from 'three';

const BPM = 130, BEAT = 60 / BPM, BAR = BEAT * 4;
export const T_DROP = BAR * 2, T_FIM3D = BAR * 7;
// Linha do tempo (corte seco a cada compasso): [clipe, início, fim, deslocamento no clipe, velocidade]
const SEGMENTOS = [
  ['dor', -1, T_DROP, 0.0, 0.96],
  ['alongamento', T_DROP, BAR * 3, 1.2, 1.0],
  ['corrida', BAR * 3, BAR * 4, 0.0, 1.0],
  ['polichinelo', BAR * 4, BAR * 5, 0.0, 1.0],
  ['corrida', BAR * 5, BAR * 6, 0.6, 1.0],
  ['alongamento', BAR * 6, 99, 3.4, 1.0],
];
const FADE = 0.06, FADE_DROP = 0.06;

function gradienteFundo() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 910;
  const g = c.getContext('2d'), r = g.createRadialGradient(256, 400, 30, 256, 440, 640);
  r.addColorStop(0, '#2b2d34'); r.addColorStop(0.45, '#141519'); r.addColorStop(1, '#040405');
  g.fillStyle = r; g.fillRect(0, 0, 512, 910);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
}
function texturaRadial(cores) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  cores.forEach(([p, col]) => r.addColorStop(p, col)); g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function iniciar(canvas, W, H) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputColorSpace = SRGBColorSpace; renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  let composer, bokeh;
  scene.background = gradienteFundo();
  scene.environment = new PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new PerspectiveCamera(30, W / H, 0.1, 50);

  scene.add(new HemisphereLight(0xc8d0e0, 0x0c0c10, 0.12));
  const key = new SpotLight(0xffffff, 20, 12, 0.5, 0.7, 1.4); key.position.set(1.4, 4.4, 2.4); key.target.position.set(0, 0.9, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 6;
  scene.add(key, key.target);
  const rimA = new DirectionalLight(0xa9c8ff, 1.9); rimA.position.set(-3, 2.6, -3); scene.add(rimA);
  const rimB = new DirectionalLight(0xffffff, 1.3); rimB.position.set(3, 2.2, -2.6); scene.add(rimB);
  const fill = new DirectionalLight(0xffffff, 0.18); fill.position.set(-2, 1.4, 3); scene.add(fill);

  const piso = new Mesh(new CircleGeometry(3.4, 72), new MeshBasicMaterial({ map: texturaRadial([[0, 'rgba(34,35,41,1)'], [0.4, 'rgba(18,19,22,1)'], [1, 'rgba(5,5,7,1)']]) }));
  piso.rotation.x = -Math.PI / 2; scene.add(piso);
  const sombra = new Mesh(new PlaneGeometry(8, 8), new ShadowMaterial({ opacity: 0.6 })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.002; sombra.receiveShadow = true; scene.add(sombra);
  const aneis = [0.13, -0.13].map((x) => {
    const mk = (r0, r1, op) => { const r = new Mesh(new RingGeometry(r0, r1, 96), new MeshBasicMaterial({ color: 0x2ee6c8, transparent: true, opacity: 0, side: DoubleSide, blending: AdditiveBlending, depthWrite: false })); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.004, 0.02); r.userData.op = op; scene.add(r); return r; };
    return [mk(0.15, 0.17, 0.95), mk(0.12, 0.21, 0.25)];
  });

  /* ---------- Boneco + animações ---------- */
  const loader = new FBXLoader();
  const nomes = ['dor', 'alongamento', 'corrida', 'polichinelo'];
  const fbx = await Promise.all(nomes.map((n) => loader.loadAsync(`anim/${n}.fbx`)));
  const boneco = fbx[0]; boneco.scale.setScalar(0.01); scene.add(boneco);

  const corpoBase = new Color(0xb7bbc2), juntas = new Color(0x8a8f97), shorts = new Color(0x1e3a8a), vermelho = new Color(0xff3a26);
  let superficie;
  boneco.traverse((c) => {
    if (!c.isMesh) return;
    c.castShadow = true; c.receiveShadow = true; c.frustumCulled = false;
    if (c.name === 'Alpha_Surface') superficie = c;
    c.material = new MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: c.name === 'Alpha_Surface' ? 0.48 : 0.42, clearcoat: 0.2, clearcoatRoughness: 0.5, envMapIntensity: 0.25 });
  });

  // Cores por vértice: bermuda (região do quadril/coxas), juntas e máscara da coluna (para o vermelho)
  const masks = [];
  boneco.traverse((c) => {
    if (!c.isMesh) return;
    const pos = c.geometry.attributes.position, n = pos.count;
    const cor = new Float32Array(n * 3), base = new Float32Array(n * 3), coluna = new Float32Array(n);
    // bermuda: triângulos cujo osso dominante é o quadril ou as coxas (bordas limpas, seguindo as peças do boneco)
    const si = c.geometry.attributes.skinIndex, sw = c.geometry.attributes.skinWeight;
    const nomesOssos = c.skeleton.bones.map((b) => b.name.replace('mixamorig', ''));
    const dom = (i) => { let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } } return nomesOssos[best]; };
    const BERMUDA = new Set(['Hips', 'LeftUpLeg', 'RightUpLeg']);
    const CINTURA = 107;
    for (let t = 0; t < n; t += 3) {
      let votos = 0; for (let k = 0; k < 3; k++) if (BERMUDA.has(dom(t + k))) votos++;
      const cy = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3;
      const cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3;
      const naBermuda = cy < CINTURA && Math.abs(cx) < 24 && (votos >= 2 || cy > 90);
      for (let k = 0; k < 3; k++) {
        const i = t + k, x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const col = naBermuda ? shorts : (c.name === 'Alpha_Surface' ? corpoBase : juntas);
        base[i * 3] = col.r; base[i * 3 + 1] = col.g; base[i * 3 + 2] = col.b;
        const w = Math.exp(-Math.pow(x / 2.7, 2)) * smooth(-2, -7, z) * smooth(106, 111, y) * (1 - smooth(150, 158, y));
        coluna[i] = c.name === 'Alpha_Surface' && !naBermuda ? w : 0;
      }
    }
    cor.set(base);
    c.geometry.setAttribute('color', new BufferAttribute(cor, 3));
    masks.push({ geo: c.geometry, cor, base, coluna, ativo: coluna.some((v) => v > 0.01) });
  });

  // Clipes: remove o deslocamento do quadril (corrida no lugar, sem "pular" entre clipes)
  const clips = fbx.map((f, i) => {
    const clip = f.animations.find((a) => a.tracks.length > 0);
    const tr = clip.tracks.find((t) => t.name.endsWith('Hips.position'));
    if (tr) {
      const v = tr.values, x0 = v[0], z0 = v[2];
      for (let k = 0; k < v.length; k += 3) {
        if (nomes[i] === 'corrida' || nomes[i] === 'polichinelo') { v[k] = x0; v[k + 2] = z0; }
        v[k] -= x0; v[k + 2] -= z0;
      }
    }
    return clip;
  });
  const mixer = new AnimationMixer(boneco);
  const acoes = clips.map((c) => { const a = mixer.clipAction(c); a.setLoop(LoopRepeat, Infinity); a.play(); a.enabled = true; return a; });

  // Ossos da coluna e direção "para trás" de cada um (calculada na pose de repouso)
  const ossos = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck'].map((n) => boneco.getObjectByName('mixamorig' + n));
  boneco.updateMatrixWorld(true);
  const tras = ossos.map((o) => { const q = o.getWorldQuaternion(new Quaternion()).invert(); return new Vector3(0, 0, -1).applyQuaternion(q); });
  const glowTex = texturaRadial([[0, 'rgba(255,255,255,1)'], [0.28, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]);
  const brilhos = [];
  for (let s = 0; s < ossos.length - 1; s++) for (let k = 0; k < 3; k++) {
    const sp = new Sprite(new SpriteMaterial({ map: glowTex, color: 0xff2a1a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
    sp.userData = { s, f: k / 3 }; sp.scale.set(0.1, 0.1, 1); scene.add(sp); brilhos.push(sp);
  }
  const lomb = new Sprite(new SpriteMaterial({ map: glowTex, color: 0xff3a22, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }));
  lomb.scale.set(0.22, 0.3, 1); scene.add(lomb);

  const _a = new Vector3(), _b = new Vector3(), _q = new Quaternion(), _d = new Vector3(), _d2 = new Vector3();
  function posicionarBrilhos(intens, t) {
    const P = ossos.map((o) => o.getWorldPosition(new Vector3()));
    const D = ossos.map((o, i) => tras[i].clone().applyQuaternion(o.getWorldQuaternion(_q)));
    brilhos.forEach((sp) => {
      const { s, f } = sp.userData;
      _a.copy(P[s]).lerp(P[s + 1], f); _d.copy(D[s]).lerp(D[s + 1], f).normalize();
      sp.position.copy(_a).addScaledVector(_d, 0.115);
      const pulso = 0.8 + 0.2 * Math.sin(t * 5.2 + s * 0.9 + f * 2);
      sp.material.opacity = 0.55 * intens * pulso;
    });
    _b.copy(P[0]).lerp(P[1], 0.6); _d2.copy(D[0]).lerp(D[1], 0.6).normalize();
    lomb.position.copy(_b).addScaledVector(_d2, 0.12); lomb.material.opacity = 0.42 * intens * (0.85 + 0.15 * Math.sin(t * 5.2));
  }
  function pintarColuna(intens) {
    masks.forEach((m) => {
      if (!m.ativo) return;
      const { cor, base, coluna } = m;
      for (let i = 0; i < coluna.length; i++) {
        const k = coluna[i] * intens * 0.75; if (k === 0 && cor[i * 3] === base[i * 3]) continue;
        cor[i * 3] = base[i * 3] + (vermelho.r - base[i * 3]) * k;
        cor[i * 3 + 1] = base[i * 3 + 1] + (vermelho.g - base[i * 3 + 1]) * k;
        cor[i * 3 + 2] = base[i * 3 + 2] + (vermelho.b - base[i * 3 + 2]) * k;
      }
      m.geo.attributes.color.needsUpdate = true;
    });
  }

  const _alvo = new Vector3(), _pos = new Vector3();
  const ease = (x) => x * x * (3 - 2 * x);
  function tomada(t) {
    const k = Math.floor(t / BAR), u = ease(Math.min(1, (t - k * BAR) / BAR)), sp = ossos[2].getWorldPosition(new Vector3());
    let az, dist, alt, ty, fov = 32, foco = null, shake = 0;
    switch (k) {
      case 0: az = Math.PI + 0.22; dist = 1.6 - 0.4 * u; alt = 1.38 - 0.06 * u; ty = sp.y; fov = 34; foco = sp; break;      // close na coluna
      case 1: az = Math.PI * 0.62 + 0.3 * u; dist = 2.7; alt = 0.5; ty = 1.0; fov = 30; break;                              // ângulo baixo lateral
      case 2: az = 0.55 - 0.15 * u; dist = 4.7 - 0.7 * u; alt = 1.25; ty = 1.0; fov = 30; break;                           // plano aberto, dolly-in
      case 3: az = 0.12 + 0.1 * u; dist = 3.9; alt = 0.35; ty = 1.25; fov = 34; shake = 1; break;                         // herói, de baixo
      case 4: az = -0.95 + 0.85 * u; dist = 4.3; alt = 2.9; ty = 0.85; fov = 30; break;                                    // de cima, órbita
      case 5: az = Math.PI / 2 + 0.05 - 0.1 * u; dist = 4.4 - 0.3 * u; alt = 1.05; ty = 1.15; fov = 30; shake = 0.6; break; // perfil
      default: az = -0.5 + 0.75 * u; dist = 4.5 - 0.5 * u; alt = 1.45; ty = 1.12; fov = 30; break;                        // final: órbita lenta
    }
    const d = t - T_DROP; if (d >= 0 && d < 0.45) fov -= 7 * Math.exp(-d * 9);
    const sx = shake * 0.025 * Math.sin(t * 13.1) * Math.sin(t * 3.7), sy = shake * 0.018 * Math.sin(t * 11.3 + 1);
    camera.fov = fov; camera.updateProjectionMatrix();
    _pos.set(Math.sin(az) * dist + sx, alt + sy, Math.cos(az) * dist);
    camera.position.copy(_pos); _alvo.set(0, ty, 0); if (foco) _alvo.copy(foco); camera.lookAt(_alvo);
    if (bokeh) {
      const fd = foco ? _pos.distanceTo(foco) : _pos.distanceTo(_alvo);
      bokeh.uniforms.focus.value = fd; bokeh.uniforms.aperture.value = k === 0 ? 0.0035 : 0.0016; bokeh.uniforms.maxblur.value = 0.008;
    }
  }

  function quadro(t) {
    // pesos e tempos por clipe (o mesmo clipe pode aparecer em mais de um segmento)
    const peso = nomes.map(() => 0), tempo = nomes.map(() => 0);
    SEGMENTOS.forEach(([n, a, z, off, vel]) => {
      const i = nomes.indexOf(n);
      const w = Math.min(smooth(a - FADE / 2, a + FADE / 2, t), 1 - smooth(z - FADE / 2, z + FADE / 2, t));
      if (w > peso[i]) { peso[i] = w; tempo[i] = off + Math.max(0, t - Math.max(0, a)) * vel; }
    });
    acoes.forEach((ac, i) => { ac.setEffectiveWeight(peso[i]); ac.time = tempo[i]; });
    mixer.update(0);
    boneco.updateMatrixWorld(true);
    // brilho da coluna
    const dor = t < T_DROP ? 1 : Math.max(0, 1 - (t - T_DROP) / 0.6);
    const g = dor * Math.min(1, t / 0.5);
    pintarColuna(g); posicionarBrilhos(g, t);
    const on = t > T_DROP + 0.2 ? Math.min(1, (t - T_DROP - 0.2) / 0.5) : 0, pul = 0.85 + 0.15 * Math.sin(t / BEAT * Math.PI * 2);
    aneis.flat().forEach((r) => { r.material.opacity = r.userData.op * on * pul; });
    tomada(t);
    composer.render();
  }
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.002, maxblur: 0.008 });
  composer.addPass(bokeh);
  composer.addPass(new OutputPass());
  return { quadro };
}

window.cena3 = { iniciar, T_DROP, T_FIM3D };


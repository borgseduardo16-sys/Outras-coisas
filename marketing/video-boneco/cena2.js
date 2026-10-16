/*
 * Vídeo "coluna" v2 — boneco Y Bot do Mixamo com animações de captura de movimento.
 * Estúdio escuro, coluna com brilho vermelho na fase de dor, anéis luminosos na fase ativa.
 * Determinístico: window.cena2.quadro(t) desenha o instante t (s).
 * Build: npx esbuild marketing/video-boneco/cena2.js --bundle --format=iife --outfile=marketing/video-boneco/cena2.bundle.js
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, ShadowMaterial,
  CircleGeometry, RingGeometry, PlaneGeometry, SpotLight, DirectionalLight, HemisphereLight, Color, CanvasTexture,
  Sprite, SpriteMaterial, AdditiveBlending, ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace, PMREMGenerator,
  DoubleSide, AnimationMixer, LoopRepeat, Vector3, Quaternion, BufferAttribute,
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const BPM = 135, BEAT = 60 / BPM, BAR = BEAT * 4;
export const T_DROP = BAR * 2, T_FIM3D = BAR * 6;
// Linha do tempo: [nome, início, fim, deslocamento no clipe, velocidade]
const SEGMENTOS = [
  ['dor', -1, T_DROP, 0.0, 1.0],
  ['alongamento', T_DROP, T_DROP + BAR, 1.2, 1.0],
  ['corrida', T_DROP + BAR, T_DROP + BAR * 2.5, 0.0, 1.0],
  ['polichinelo', T_DROP + BAR * 2.5, 99, 0.0, 1.0],
];
const FADE = 0.3, FADE_DROP = 0.1;

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
  lomb.scale.set(0.36, 0.44, 1); scene.add(lomb);

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
    lomb.position.copy(_b).addScaledVector(_d2, 0.14); lomb.material.opacity = 0.42 * intens * (0.85 + 0.15 * Math.sin(t * 5.2));
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

  function camera_(t) {
    let az, dist, alvoY, alt, fov = 30;
    if (t < T_DROP) { const u = t / T_DROP; az = Math.PI + 0.7 - 0.35 * u; dist = 3.7 - 0.35 * u; alvoY = 1.12; alt = 1.3; }
    else { const u = (t - T_DROP) / (T_FIM3D - T_DROP); az = 0.6 - 1.1 * u; dist = 5.2 - 0.5 * u; alvoY = 1.1; alt = 1.2; }
    const d = t - T_DROP; if (d >= 0 && d < 0.45) fov = 30 - 7 * Math.exp(-d * 9);
    camera.fov = fov; camera.updateProjectionMatrix();
    camera.position.set(Math.sin(az) * dist, alt, Math.cos(az) * dist); camera.lookAt(0, alvoY, 0);
  }

  function quadro(t) {
    // pesos e tempos das animações (crossfade)
    SEGMENTOS.forEach(([n, a, z, off, vel], i) => {
      const fIn = Math.abs(a - T_DROP) < 1e-6 ? FADE_DROP : FADE;
      const fOut = Math.abs(z - T_DROP) < 1e-6 ? FADE_DROP : FADE;
      const w = Math.min(smooth(a - fIn / 2, a + fIn / 2, t), 1 - smooth(z - fOut / 2, z + fOut / 2, t));
      acoes[i].setEffectiveWeight(w);
      acoes[i].time = off + Math.max(0, t - Math.max(0, a)) * vel;
    });
    mixer.update(0);
    boneco.updateMatrixWorld(true);
    // brilho da coluna
    const dor = t < T_DROP ? 1 : Math.max(0, 1 - (t - T_DROP) / 0.6);
    const g = dor * Math.min(1, t / 0.5);
    pintarColuna(g); posicionarBrilhos(g, t);
    const on = t > T_DROP + 0.2 ? Math.min(1, (t - T_DROP - 0.2) / 0.5) : 0, pul = 0.85 + 0.15 * Math.sin(t / BEAT * Math.PI * 2);
    aneis.flat().forEach((r) => { r.material.opacity = r.userData.op * on * pul; });
    camera_(t);
    renderer.render(scene, camera);
  }
  return { quadro };
}

window.cena2 = { iniciar, T_DROP, T_FIM3D };


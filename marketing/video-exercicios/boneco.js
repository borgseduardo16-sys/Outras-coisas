/*
 * Boneco adulto (procedural), inspirado no boneco do app, para o vídeo "3 exercícios para a coluna".
 * Figura olha para +Z, Y para cima. Lado "a" = x>0, "b" = x<0.
 * Inclui uma coluna em "raio-X" (vértebras + brilho) que pode acender por cima da roupa.
 */
import {
  Group, Object3D, Mesh, MeshStandardMaterial, MeshBasicMaterial, SphereGeometry, BoxGeometry,
  CylinderGeometry, LatheGeometry, Vector2, Sprite, SpriteMaterial, CanvasTexture, AdditiveBlending, Color,
} from 'three';

export const HIP_Y = 0.93, THIGH = 0.45, SHIN = 0.43, UARM = 0.30, FARM = 0.27, TORSO = 0.48;

function tapered(len, r0, r1, bulge = 0.07, cap0 = 0.8, cap1 = 0.8, seg = 28) {
  const pts = [];
  const n = 7;
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new Vector2(Math.max(0.0001, r0 * Math.sin(a)), r0 * cap0 * Math.cos(a))); }
  const m = 12;
  for (let i = 1; i < m; i++) {
    const t = i / m;
    pts.push(new Vector2((r0 + (r1 - r0) * t) * (1 + bulge * Math.sin(Math.PI * t)), -len * t));
  }
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; pts.push(new Vector2(Math.max(0.0001, r1 * Math.cos(a)), -len - r1 * cap1 * Math.sin(a))); }
  pts.reverse();
  return new LatheGeometry(pts, seg);
}

function mesh(geo, mat, { x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0 } = {}) {
  const m = new Mesh(geo, mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const J = (parent, x = 0, y = 0, z = 0) => { const o = new Object3D(); o.position.set(x, y, z); parent.add(o); return o; };

function texturaBrilho() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

export function criarBoneco({ camiseta = 0x7d838b, calca = 0x202328 } = {}) {
  const mat = (color, rough = 0.7, metal = 0) => new MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const skin = mat(0xc98d68, 0.52);
  const shirt = mat(camiseta, 0.88);        // camiseta (padrão: cinza mescla)
  const pants = mat(calca, 0.85);           // calça de moletom (padrão: preta)
  const shoe = mat(0xe9e9e6, 0.55), sole = mat(0x55595f, 0.6);
  const hair = mat(0x2b211b, 0.75);         // castanho escuro
  const dark = mat(0x1a1512, 0.4);

  const figure = new Group();
  const root = J(figure, 0, HIP_Y, 0);
  const spine = J(root);
  const chest = J(spine, 0, 0.22, 0);
  const neck = J(chest, 0, 0.31, 0);
  const head = J(neck, 0, 0.06, 0);

  /* Tronco: quadril, abdômen e peito (ombros mais largos, cintura mais fina) */
  root.add(mesh(new SphereGeometry(0.15, 32, 22), pants, { sx: 1.1, sy: 0.82, sz: 0.8, y: -0.02 }));
  spine.add(mesh(tapered(0.31, 0.142, 0.15, 0.03, 0.3, 0.22), shirt, { y: 0.265, sx: 1.08, sz: 0.77 }));
  chest.add(mesh(tapered(0.38, 0.19, 0.142, 0.05, 0.42, 0.3), shirt, { y: 0.30, sx: 1.12, sz: 0.74 }));
  chest.add(mesh(new CylinderGeometry(0.07, 0.08, 0.06, 20), shirt, { y: 0.305 }));                  // gola
  neck.add(mesh(new CylinderGeometry(0.047, 0.056, 0.18, 20), skin, { y: 0.06 }));          // entra na cabeça

  /* Cabeça: formato oval, cabelo curto, rosto simples */
  // cabeça em perfil de "ovo": crânio mais largo afinando suavemente até o queixo (sem bola no queixo)
  const perfil = [[0.032, 0.0001], [0.035, 0.022], [0.042, 0.04], [0.055, 0.057], [0.075, 0.074], [0.1, 0.087], [0.13, 0.095],
    [0.16, 0.099], [0.19, 0.097], [0.215, 0.088], [0.237, 0.068], [0.252, 0.04], [0.259, 0.0001]].map(([y, r]) => new Vector2(r, y));
  head.add(mesh(new LatheGeometry(perfil, 40), skin, { sx: 0.93, sz: 1.05, z: 0.004 }));
  // cabelo curto colado ao crânio: calota que acompanha o topo da cabeça, mais baixa atrás
  head.add(mesh(new SphereGeometry(0.106, 40, 24, 0, Math.PI * 2, 0, 1.62), hair, { y: 0.158, z: -0.004, sx: 0.97, sy: 1.0, sz: 1.08, rx: -0.65 }));
  head.add(mesh(new SphereGeometry(0.05, 24, 12), hair, { y: 0.228, z: 0.04, sx: 1.5, sy: 0.38, sz: 1.1 }));    // topete discreto
  [-1, 1].forEach((s) => {
    head.add(mesh(new SphereGeometry(0.011, 12, 10), dark, { x: s * 0.034, y: 0.158, z: 0.093, sz: 0.55 }));       // olhos
    head.add(mesh(new BoxGeometry(0.03, 0.006, 0.01), hair, { x: s * 0.035, y: 0.181, z: 0.094, rz: s * -0.12 })); // sobrancelhas
    head.add(mesh(new SphereGeometry(0.016, 12, 10), skin, { x: s * 0.092, y: 0.148, sx: 0.45, sy: 1.35 }));       // orelhas
  });
  head.add(mesh(new SphereGeometry(0.011, 12, 10), skin, { y: 0.137, z: 0.1, sx: 0.9, sy: 1.5, sz: 0.95 }));      // nariz
  head.add(mesh(new BoxGeometry(0.032, 0.005, 0.008), mat(0x7a4a3a, 0.5), { y: 0.103, z: 0.094 }));               // boca neutra

  /* Braços com manga curta e mãos com polegar */
  const arms = [1, -1].map((s) => {
    const clav = J(chest, 0, 0.26, 0);
    const shoulder = J(clav, s * 0.2, 0, 0);
    shoulder.add(mesh(new SphereGeometry(0.068, 20, 16), shirt, { sx: 1.05 }));
    shoulder.add(mesh(tapered(0.30, 0.062, 0.05, 0.08), skin, { y: -0.02 }));
    shoulder.add(mesh(tapered(0.13, 0.074, 0.067, 0.02, 0.5, 0.6), shirt, { y: -0.01 }));
    const elbow = J(shoulder, 0, -UARM, 0);
    elbow.add(mesh(new SphereGeometry(0.048, 16, 12), skin));
    elbow.add(mesh(tapered(0.25, 0.047, 0.035, 0.08), skin, { y: -0.01 }));
    const wrist = J(elbow, 0, -FARM, 0);
    wrist.add(mesh(new SphereGeometry(0.05, 16, 12), skin, { y: -0.06, sx: 0.88, sy: 1.35, sz: 0.48 }));
    wrist.add(mesh(new SphereGeometry(0.016, 10, 8), skin, { x: s * -0.035, y: -0.045, z: 0.022, sy: 2.0, rz: s * 0.5 }));
    // dedo indicador estendido (só aparece em gestos, ex.: "não" com o dedo)
    const dedo = mesh(new CylinderGeometry(0.0095, 0.011, 0.07, 10), skin, { y: -0.135, z: 0.0 });
    dedo.add(mesh(new SphereGeometry(0.0095, 10, 8), skin, { y: -0.035 }));
    dedo.visible = false; wrist.add(dedo);
    return { clav, shoulder, elbow, wrist, dedo };
  });

  /* Pernas com calça de moletom (punho) e tênis */
  const legs = [1, -1].map((s) => {
    const hip = J(root, s * 0.092, -0.03, 0);
    hip.add(mesh(tapered(THIGH, 0.1, 0.068, 0.05), pants, { y: 0.02 }));
    const knee = J(hip, 0, -THIGH, 0);
    knee.add(mesh(new SphereGeometry(0.066, 16, 12), pants));
    knee.add(mesh(tapered(SHIN - 0.03, 0.064, 0.05, 0.06), pants, { y: -0.01 }));
    const ankle = J(knee, 0, -SHIN, 0);
    ankle.add(mesh(new CylinderGeometry(0.05, 0.05, 0.05, 16), pants, { y: 0.045 }));                // punho da calça
    ankle.add(mesh(new SphereGeometry(0.5, 24, 14), shoe, { y: -0.03, z: 0.05, sx: 0.105, sy: 0.085, sz: 0.27 }));
    ankle.add(mesh(new BoxGeometry(0.092, 0.02, 0.25), sole, { y: -0.066, z: 0.05 }));
    return { hip, knee, ankle };
  });

  /* Coluna em raio-X: vértebras + brilho aditivo; fica por cima da roupa (sem teste de profundidade) */
  const glowTex = texturaBrilho();
  const xray = { vertebras: [], brilhos: [], cor: new Color(0xff3b30) };
  const vMat = new MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const addVert = (parent, y, w, z = -0.055) => {
    const v = new Mesh(new BoxGeometry(w, 0.016, 0.02), vMat); v.position.set(0, y, z); v.renderOrder = 20; parent.add(v); xray.vertebras.push(v);
    const sp = new Sprite(new SpriteMaterial({ map: glowTex, color: 0xff3b30, transparent: true, opacity: 0, blending: AdditiveBlending, depthTest: false, depthWrite: false }));
    sp.scale.set(0.14, 0.14, 1); sp.position.set(0, y, z); sp.renderOrder = 19; parent.add(sp); xray.brilhos.push(sp);
  };
  for (let i = 0; i < 5; i++) addVert(spine, 0.03 + i * 0.042, 0.05 - i * 0.002, -0.07);   // lombar
  for (let i = 0; i < 8; i++) addVert(chest, 0.0 + i * 0.036, 0.042 - i * 0.0015, -0.075 + i * 0.002); // torácica
  for (let i = 0; i < 3; i++) addVert(neck, -0.02 + i * 0.035, 0.03, -0.02);              // cervical
  const lombar = new Sprite(new SpriteMaterial({ map: glowTex, color: 0xff2a1f, transparent: true, opacity: 0, blending: AdditiveBlending, depthTest: false, depthWrite: false }));
  lombar.scale.set(0.34, 0.34, 1); lombar.position.set(0, 0.12, -0.07); lombar.renderOrder = 18; spine.add(lombar);
  xray.lombar = lombar;

  /** intensidade 0..1, cor (hex), foco lombar 0..1 */
  xray.definir = (intens, corHex = 0xff3b30, focoLombar = 1) => {
    vMat.opacity = Math.min(1, intens * 1.1);
    vMat.color.set(corHex).lerp(new Color(0xffffff), 0.25);
    xray.brilhos.forEach((b) => { b.material.opacity = intens * 0.75; b.material.color.set(corHex); });
    lombar.material.opacity = intens * 0.9 * focoLombar; lombar.material.color.set(corHex);
  };

  return { figure, root, spine, chest, neck, head, arms, legs, xray };
}

/* ---------- Pose no plano sagital (ângulos absolutos) ----------
 * Membro com ângulo θ aponta para (y=-cosθ, z=-sinθ); tronco com θ aponta para (y=cosθ, z=sinθ).
 * Rotação local em X de cada filho = θ_filho - θ_pai.
 */
export const dirMembro = (th) => [-Math.cos(th), -Math.sin(th)];
export const angMembro = (vy, vz) => Math.atan2(-vz, -vy);

/** IK de 2 ossos no plano (y,z). Retorna [θ1, θ2]. lado = +1/-1 escolhe para onde dobra. */
export function ik2(o, alvo, L1, L2, lado) {
  let vy = alvo[0] - o[0], vz = alvo[1] - o[1];
  let D = Math.hypot(vy, vz);
  const Dc = Math.min(L1 + L2 - 1e-4, Math.max(Math.abs(L1 - L2) + 1e-4, D));
  const a = Math.acos((L1 * L1 + Dc * Dc - L2 * L2) / (2 * L1 * Dc));
  const th1 = angMembro(vy, vz) + lado * a;
  const d1 = dirMembro(th1);
  const k = [o[0] + d1[0] * L1, o[1] + d1[1] * L1];
  const th2 = angMembro(alvo[0] - k[0], alvo[1] - k[1]);
  return [th1, th2];
}

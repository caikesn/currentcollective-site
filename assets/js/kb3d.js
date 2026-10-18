/* Work page: real-looking 3D keyboard (three.js r149) */
(function () {
  var stage = document.querySelector('.kb-stage');
  if (!stage || !window.THREE) return;
  var T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  var test = document.createElement('canvas');
  if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Layout (units = one key) ----
  var ORANGE = { esc: 1, W: 1, O: 1, R: 1, K: 1, '5': 1, '↵': 1, opt: 1, cmd: 1, '→': 1 };
  var GREY = { A: 1, T: 1, H: 1, M: 1, '2': 1, '8': 1, '.': 1, del: 1, '': 1 };
  var ROWS = [
    [['esc', 1], ['1', 1], ['2', 1], ['3', 1], ['4', 1], ['5', 1], ['6', 1], ['7', 1], ['8', 1], ['9', 1], ['0', 1], ['-', 1], ['=', 1], ['del', 2]],
    [['tab', 1.5], ['W', 1], ['O', 1], ['R', 1], ['K', 1], ['E', 1], ['T', 1], ['Y', 1], ['U', 1], ['I', 1], ['P', 1], ['[', 1], [']', 1], ['\\', 1.5]],
    [['caps lock', 1.75], ['A', 1], ['S', 1], ['D', 1], ['F', 1], ['G', 1], ['H', 1], ['J', 1], ['Q', 1], ['L', 1], [';', 1], ["'", 1], ['↵', 2.25]],
    [['shift', 2.25], ['Z', 1], ['X', 1], ['C', 1], ['V', 1], ['B', 1], ['N', 1], ['M', 1], [',', 1], ['.', 1], ['/', 1], ['shift', 1.75], ['↑', 1]],
    [['fn', 1.25], ['ctrl', 1.25], ['opt', 1.25], ['cmd', 1.25], ['', 5], ['cmd', 1.25], ['←', 1], ['↓', 1], ['→', 1]]
  ];
  var COLS = {
    dark: { cap: 0x232628, txt: '#ECE8E0', mod: '#E8803A' },
    orange: { cap: 0xE0661C, txt: 'rgba(255,226,204,.95)', mod: 'rgba(255,226,204,.95)' },
    grey: { cap: 0xDCD8D0, txt: '#D9661E', mod: '#D9661E' }
  };

  // ---- Renderer / scene ----
  var renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  var small = window.innerWidth <= 980;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(26, 1, 0.1, 200);

  // Studio environment for reflections: soft white box above, warm orange panel to one side
  (function () {
    var env = new T.Scene();
    var room = new T.Mesh(new T.BoxGeometry(40, 20, 40), new T.MeshBasicMaterial({ color: 0x0a0a0a, side: T.BackSide }));
    env.add(room);
    function panel(w, h, c, s, pos, rot) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(s), side: T.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]); m.rotation.set(rot[0], rot[1], rot[2]); env.add(m);
    }
    panel(14, 6, 0xffffff, 0.9, [0, 9.5, 2], [Math.PI / 2, 0, 0]);
    panel(10, 6, 0xff7a2a, 0.6, [-18, 3, -4], [0, Math.PI / 2, 0]);
    panel(8, 4, 0xbfd0ff, 0.25, [18, 4, 6], [0, -Math.PI / 2, 0]);
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.035).texture;
  })();

  var key = new T.DirectionalLight(0xfff6ee, 1.7);
  key.position.set(-6, 14, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(window.innerWidth <= 980 ? 1024 : 2048, window.innerWidth <= 980 ? 1024 : 2048);
  var sc = key.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 40;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  scene.add(key);
  var rim = new T.PointLight(0xff7a2a, 14, 22, 2); rim.position.set(8, 2.5, -5); scene.add(rim);
  scene.add(new T.HemisphereLight(0xffffff, 0x221a14, 0.12));

  // ---- Keycap geometry: tapered sides, rounded top edge, slight dish ----
  var geoCache = {};
  function rrect(hw, hd, r, K) {
    var pts = [], cs = [[hw - r, hd - r, 0], [-(hw - r), hd - r, 1], [-(hw - r), -(hd - r), 2], [hw - r, -(hd - r), 3]];
    cs.forEach(function (c) { for (var i = 0; i <= K; i++) { var a = (c[2] + i / K) * Math.PI / 2; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } });
    return pts;
  }
  function capGeo(w) {
    if (geoCache[w]) return geoCache[w];
    var gap = 0.075, hw = (w - gap) / 2, hd = (1 - gap) / 2, K = 5;
    // profile: [inset, height]
    var prof = [[0, 0], [0.025, 0.16], [0.075, 0.36]];
    var r = 0.07, cx = 0.075 + r, cy = 0.36;
    for (var i = 1; i <= 5; i++) { var a = i / 5 * Math.PI / 2; prof.push([cx - r * Math.cos(a), cy + r * Math.sin(a)]); }
    var topH = cy + r;
    [0.19, 0.24, 0.30].forEach(function (ins, j) { prof.push([ins, topH - 0.012 * (j + 1) / 3]); });
    var pos = [], idx = [], ringN = 0;
    prof.forEach(function (p) {
      var ins = Math.min(p[0], hd - 0.02), rr = Math.max(0.02, Math.min(0.1 - ins * 0.15, hw - ins, hd - ins) - 0.0);
      var ring = rrect(hw - ins, hd - ins, Math.max(0.015, Math.min(rr, hd - ins - 0.001)), K);
      ringN = ring.length;
      ring.forEach(function (q) { pos.push(q[0], p[1], q[1]); });
    });
    for (var ri = 0; ri < prof.length - 1; ri++) for (var k = 0; k < ringN; k++) {
      var a0 = ri * ringN + k, a1 = ri * ringN + (k + 1) % ringN, b0 = a0 + ringN, b1 = a1 + ringN;
      idx.push(a0, b0, a1, a1, b0, b1);
    }
    var c = pos.length / 3; pos.push(0, topH - 0.014, 0);
    var bc = pos.length / 3; pos.push(0, 0, 0);
    for (k = 0; k < ringN; k++) idx.push(k, (k + 1) % ringN, bc);
    var last = (prof.length - 1) * ringN;
    for (k = 0; k < ringN; k++) idx.push(last + k, c, last + (k + 1) % ringN);
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx); g.computeVertexNormals();
    g.userData = { topH: topH, tw: (hw - 0.17) * 2, td: (hd - 0.17) * 2 };
    return (geoCache[w] = g);
  }

  var redraws = [];
  var redraws = [];
  function label(text, w, col, isMod) {
    var g = capGeo(w), s = 256, cw = Math.round(g.userData.tw * s), ch = Math.round(g.userData.td * s);
    var cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    var x = cv.getContext('2d');
    var draw = function () { x.clearRect(0, 0, cw, ch);
    x.fillStyle = isMod ? col.mod : col.txt;
    if (isMod) {
      x.font = '500 ' + Math.round(s * 0.15) + 'px Archivo, Arial, sans-serif';
      x.textBaseline = 'bottom'; x.textAlign = 'left';
      x.fillText(text, s * 0.02, ch - s * 0.02);
    } else {
      x.font = '600 ' + Math.round(s * 0.36) + 'px Archivo, Arial, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(text, cw / 2, ch / 2 + s * 0.01);
    } if (tex) tex.needsUpdate = true; };
    var tex = null; draw(); redraws.push(draw);
    tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var m = new T.Mesh(new T.PlaneGeometry(g.userData.tw, g.userData.td), new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.x = -Math.PI / 2; m.position.y = g.userData.topH - 0.004;
    return m;
  }

  var mats = {};
  function capMat(name) {
    if (mats[name]) return mats[name];
    return (mats[name] = new T.MeshPhysicalMaterial({ color: COLS[name].cap, roughness: name === 'grey' ? 0.5 : 0.56, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.6 }));
  }

  // ---- Build board ----
  var board = new T.Group(); scene.add(board);
  var keys = [], byLetter = {}, W = 15, H = ROWS.length;
  var switchMat = new T.MeshStandardMaterial({ color: 0xE86A1C, roughness: 0.4, emissive: 0x401400, emissiveIntensity: 0.6 });
  var switchGeo = new T.BoxGeometry(0.62, 0.26, 0.62);
  ROWS.forEach(function (row, ri) {
    var x = 0;
    row.forEach(function (k) {
      var t = k[0], w = k[1];
      var cname = ORANGE[t] ? 'orange' : GREY[t] ? 'grey' : 'dark';
      var isMod = t.length > 1 && !/^[↵←→↑↓]$/.test(t);
      var grp = new T.Group();
      var cap = new T.Mesh(capGeo(w), capMat(cname)); cap.castShadow = true; cap.receiveShadow = true;
      grp.add(cap);
      if (t) grp.add(label(t, w, COLS[cname], isMod));
      var cxp = x + w / 2 - W / 2, czp = ri + 0.5 - H / 2;
      grp.position.set(cxp, 0.12, czp);
      var sw = new T.Mesh(switchGeo, switchMat); sw.position.set(cxp, 0.02, czp); board.add(sw);
      board.add(grp);
      var rec = { g: grp, y: 0.12, cur: 0, target: 0, t: 0, mesh: cap };
      cap.userData.rec = rec; keys.push(rec);
      if (t.length === 1 && /[A-Z]/.test(t)) byLetter[t] = rec;
      x += w;
    });
  });

  // case + plate
  (function () {
    var pad = 0.42, cw = W + pad * 2, cd = H + pad * 2, r = 0.5;
    var sh = new T.Shape(), hw = cw / 2, hd = cd / 2;
    sh.moveTo(-hw + r, -hd); sh.lineTo(hw - r, -hd); sh.quadraticCurveTo(hw, -hd, hw, -hd + r); sh.lineTo(hw, hd - r);
    sh.quadraticCurveTo(hw, hd, hw - r, hd); sh.lineTo(-hw + r, hd); sh.quadraticCurveTo(-hw, hd, -hw, hd - r); sh.lineTo(-hw, -hd + r); sh.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    var hole = new T.Path(), ih = W / 2 + 0.06, id = H / 2 + 0.06, r2 = 0.14;
    hole.moveTo(-ih + r2, -id); hole.lineTo(ih - r2, -id); hole.quadraticCurveTo(ih, -id, ih, -id + r2); hole.lineTo(ih, id - r2);
    hole.quadraticCurveTo(ih, id, ih - r2, id); hole.lineTo(-ih + r2, id); hole.quadraticCurveTo(-ih, id, -ih, id - r2); hole.lineTo(-ih, -id + r2); hole.quadraticCurveTo(-ih, -id, -ih + r2, -id);
    sh.holes.push(hole);
    var g = new T.ExtrudeGeometry(sh, { depth: 0.75, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 6, curveSegments: 10 });
    g.rotateX(-Math.PI / 2);
    var caseMat = new T.MeshPhysicalMaterial({ color: 0x1B1D1E, metalness: 0.85, roughness: 0.34, clearcoat: 0.3, clearcoatRoughness: 0.4 });
    var cs = new T.Mesh(g, caseMat); cs.position.y = -0.55; cs.castShadow = true; cs.receiveShadow = true; board.add(cs);
    var plate = new T.Mesh(new T.BoxGeometry(W + 0.2, 0.1, H + 0.2), new T.MeshStandardMaterial({ color: 0x141515, roughness: 0.7, metalness: 0.4 }));
    plate.position.y = -0.12; plate.receiveShadow = true; board.add(plate);
  })();

  // two loose keycaps floating above
  var loose = [];
  [['C', 'orange', [-5.2, 1.35, -2.6], [0.22, 0.45, 0.16]], ['C', 'dark', [-2.3, 0.95, -2.75], [-0.18, -0.5, -0.14]]].forEach(function (l, i) {
    var g = new T.Group(), cap = new T.Mesh(capGeo(1), capMat(l[1])); cap.castShadow = true; g.add(cap); g.add(label(l[0], 1, COLS[l[1]], false));
    g.position.set(l[2][0], l[2][1], l[2][2]); g.rotation.set(l[3][0], l[3][1], l[3][2]); board.add(g); loose.push({ g: g, y: l[2][1], ph: i * 2.4 });
  });

  board.rotation.y = 0.42;

  // ---- Sizing / camera ----
  var canvas = renderer.domElement; canvas.className = 'kb3d';
  stage.appendChild(canvas); stage.classList.add('is-3d');
  var aim = new T.Vector3(-3.6, 0, 2.4), mx = 0, my = 0, cmx = 0, cmy = 0;
  function size() {
    var w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    var narrow = window.innerWidth <= 980;
    camera.fov = narrow ? 32 : 30;
    camera.updateProjectionMatrix();
    stage._dist = narrow ? 13 : 19;
  }
  function placeCam() {
    var d = stage._dist || 30;
    camera.position.set(aim.x - d * 0.12 + cmx * 0.8, d * 0.80 - cmy * 0.6, aim.z + d * 0.58);
    camera.lookAt(aim);
  }
  size(); addEventListener('resize', size);

  // ---- Interaction ----
  var ray = new T.Raycaster(), ptr = new T.Vector2(), hovered = null, meshes = keys.map(function (k) { return k.mesh; });
  stage.addEventListener('pointermove', function (e) {
    var b = canvas.getBoundingClientRect();
    ptr.x = (e.clientX - b.left) / b.width * 2 - 1; ptr.y = -(e.clientY - b.top) / b.height * 2 + 1;
    mx = ptr.x; my = ptr.y;
    ray.setFromCamera(ptr, camera);
    var hit = ray.intersectObjects(meshes, false)[0];
    var rec = hit ? hit.object.userData.rec : null;
    if (hovered && hovered !== rec) hovered.target = 0;
    hovered = rec; if (rec) rec.target = 1;
    stage.style.cursor = rec ? 'pointer' : '';
  });
  stage.addEventListener('pointerleave', function () { if (hovered) hovered.target = 0; hovered = null; mx = my = 0; });
  function tap(rec) { rec.target = 1; setTimeout(function () { if (rec !== hovered) rec.target = 0; }, 150); }
  if (!reduce) {
    var seq = ['W', 'O', 'R', 'K'], si = 0;
    (function typeNext() {
      tap(byLetter[seq[si % 4]]); si++;
      setTimeout(typeNext, si % 4 === 0 ? 2400 : 230);
    })();
  }

  // ---- Loop (only while visible) ----
  var visible = true, raf = 0, clock = new T.Clock();
  var skip = false;
  function frame() {
    if (small && (skip = !skip)) { raf = visible ? requestAnimationFrame(frame) : 0; return; }
    var dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    keys.forEach(function (k) { k.cur += (k.target - k.cur) * Math.min(1, dt * 28); k.g.position.y = k.y - k.cur * 0.13; });
    if (!reduce) loose.forEach(function (l) { l.g.position.y = l.y + Math.sin(t * 1.1 + l.ph) * 0.18; l.g.rotation.y += dt * 0.15; });
    cmx += (mx - cmx) * Math.min(1, dt * 3); cmy += (my - cmy) * Math.min(1, dt * 3);
    placeCam();
    renderer.render(scene, camera);
    raf = visible ? requestAnimationFrame(frame) : 0;
  }
  function start() {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  }
  var started = false;
  function go() {
    if (started) return; started = true;
    redraws.forEach(function (d) { d(); });
    frame();
  }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible && started && !raf) { clock.getDelta(); frame(); } }).observe(stage);
  start();
})();

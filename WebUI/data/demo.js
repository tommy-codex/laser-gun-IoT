// Virtual pan/tilt rig rendered with plain CSS 3D transforms (no WebGL, no
// external libraries) so it can be uploaded to the ESP's SPIFFS alongside
// the rest of the pad without pulling in a graphics engine.
//
// Mirrors the real assembly: a base servo rotates the whole arm left/right
// (pan), a second servo mounted on top of the first tilts the laser tube
// up/down (tilt) - see B_ServoLaserMotor.ino's rangeX/rangeY.
// Used both in Demo mode (fed by a local loop) and in Hardware mode
// (mirrors what is actually being sent to the ESP).

const PAN_RANGE_DEG = 30;  // mirrors rangeX in B_ServoLaserMotor.ino
const TILT_RANGE_DEG = 30; // mirrors rangeY in B_ServoLaserMotor.ino

function shadeColor(hex, factor) {
  const c = hex.replace('#', '');
  const r = Math.min(255, Math.round(parseInt(c.substring(0, 2), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(c.substring(2, 4), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(c.substring(4, 6), 16) * factor));
  return `rgb(${r},${g},${b})`;
}

function el(cls) {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}

function mkFace(w, h, transform, bg) {
  const f = el('face3d');
  f.style.width = w + 'px';
  f.style.height = h + 'px';
  f.style.left = (-w / 2) + 'px';
  f.style.top = (-h / 2) + 'px';
  f.style.transform = transform;
  f.style.background = bg;
  return f;
}

// A solid cuboid, faces shaded to fake a light coming from front/top/right.
function box(w, h, d, baseColor) {
  const wrap = el('grp3d');
  wrap.appendChild(mkFace(w, h, `translateZ(${d / 2}px)`, shadeColor(baseColor, 1.0)));
  wrap.appendChild(mkFace(w, h, `rotateY(180deg) translateZ(${d / 2}px)`, shadeColor(baseColor, 0.55)));
  wrap.appendChild(mkFace(d, h, `rotateY(90deg) translateZ(${w / 2}px)`, shadeColor(baseColor, 0.8)));
  wrap.appendChild(mkFace(d, h, `rotateY(-90deg) translateZ(${w / 2}px)`, shadeColor(baseColor, 0.65)));
  wrap.appendChild(mkFace(w, d, `rotateX(90deg) translateZ(${h / 2}px)`, shadeColor(baseColor, 1.25)));
  wrap.appendChild(mkFace(w, d, `rotateX(-90deg) translateZ(${h / 2}px)`, shadeColor(baseColor, 0.4)));
  return wrap;
}

// A round tube, axis along local X, spanning -length/2..+length/2, built
// from N flat side panels fanned around the axis (the standard CSS-only
// approximation of a cylinder).
function cylinderX(radius, length, segments, baseColor) {
  const wrap = el('grp3d');
  const segAngle = 360 / segments;
  const chord = 2 * radius * Math.sin((segAngle * Math.PI / 180) / 2) + 0.6;
  for (let i = 0; i < segments; i++) {
    const ang = i * segAngle;
    const shade = 0.55 + 0.45 * Math.cos((ang - 300) * Math.PI / 180);
    wrap.appendChild(mkFace(length, chord, `rotateX(${ang}deg) translateZ(${radius}px)`, shadeColor(baseColor, shade)));
  }
  [-90, 90].forEach((rot) => {
    const cap = el('face3d');
    cap.style.width = cap.style.height = (radius * 2) + 'px';
    cap.style.left = (-radius) + 'px';
    cap.style.top = (-radius) + 'px';
    cap.style.borderRadius = '50%';
    cap.style.transform = `rotateY(${rot}deg) translateZ(${length / 2}px)`;
    cap.style.background = shadeColor(baseColor, rot > 0 ? 0.9 : 0.6);
    wrap.appendChild(cap);
  });
  return wrap;
}

function mount(parent, child, x, y, z, extra) {
  child.style.transform = `translate3d(${x}px,${y}px,${z}px) ${extra || ''}`;
  parent.appendChild(child);
  return child;
}

function buildRobot(cam) {
  const CASE = { w: 130, h: 55, d: 95 };
  const PAN_SERVO = { w: 30, h: 26, d: 26 };
  const BRACKET = { w: 14, h: 46, d: 14 };
  const TILT_SERVO = { w: 32, h: 22, d: 22 };
  const LASER = { r: 11, len: 78 };
  const TIP = { r: 12.5, len: 12 };

  const ground = box(420, 4, 420, '#12181d');
  mount(cam, ground, 0, CASE.h / 2 + 2, 0);

  const gunCase = box(CASE.w, CASE.h, CASE.d, '#2e7d32');
  mount(cam, gunCase, 0, 0, 0);

  // Pivot sitting on top of the case - this whole group rotates for PAN.
  const panJoint = el('grp3d');
  const panPivotY = -CASE.h / 2;
  cam.appendChild(panJoint);

  const panServo = box(PAN_SERVO.w, PAN_SERVO.h, PAN_SERVO.d, '#1565c0');
  mount(panJoint, panServo, 0, -PAN_SERVO.h / 2, 0);

  const bracket = box(BRACKET.w, BRACKET.h, BRACKET.d, '#66bb6a');
  mount(panJoint, bracket, 0, -PAN_SERVO.h - BRACKET.h / 2, 0);

  // Pivot on top of the bracket - this group rotates for TILT, matching the
  // second servo mounted above the first in the real build.
  const tiltJoint = el('grp3d');
  const tiltPivotY = -PAN_SERVO.h - BRACKET.h;
  mount(panJoint, tiltJoint, 0, tiltPivotY, 0);

  const tiltServo = box(TILT_SERVO.w, TILT_SERVO.h, TILT_SERVO.d, '#1976d2');
  mount(tiltJoint, tiltServo, 0, 0, 0);

  const laser = cylinderX(LASER.r, LASER.len, 14, '#7b1fa2');
  mount(tiltJoint, laser, TILT_SERVO.w / 2 + LASER.len / 2, 0, 0);

  const tip = cylinderX(TIP.r, TIP.len, 14, '#cfd3d8');
  tip.classList.add('laser-tip');
  mount(tiltJoint, tip, TILT_SERVO.w / 2 + LASER.len + TIP.len / 2, 0, 0);

  const beam = cylinderX(2.6, 260, 8, '#ff2d3a');
  beam.classList.add('beam3d');
  beam.style.opacity = 0;
  mount(tiltJoint, beam, TILT_SERVO.w / 2 + LASER.len + TIP.len + 130, 0, 0);

  return { panJoint, panPivotY, tiltJoint, tiltPivotY, tip, beam };
}

function createRobotView(stageEl) {
  stageEl.innerHTML = '';
  const cam = el('grp3d cam3d');
  stageEl.appendChild(cam);

  let camX = -18, camY = -30;
  function applyCam() {
    cam.style.transform = `translate3d(-50%,-50%,0) rotateX(${camX}deg) rotateY(${camY}deg)`;
  }
  applyCam();

  let dragging = false, lastX = 0, lastY = 0, pointerId = null;
  stageEl.addEventListener('pointerdown', (e) => {
    dragging = true;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    stageEl.setPointerCapture(pointerId);
  });
  stageEl.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    camY += (e.clientX - lastX) * 0.3;
    camX = Math.max(-75, Math.min(5, camX - (e.clientY - lastY) * 0.3));
    lastX = e.clientX;
    lastY = e.clientY;
    applyCam();
  });
  ['pointerup', 'pointercancel'].forEach((t) => stageEl.addEventListener(t, () => { dragging = false; }));

  const rig = buildRobot(cam);

  let target = { x: 0, y: 0, fire: false };
  const shown = { x: 0, y: 0, fire: 0 };

  function render(state) {
    target = state;
  }

  function frame() {
    shown.x += (target.x - shown.x) * 0.2;
    shown.y += (target.y - shown.y) * 0.2;
    shown.fire += ((target.fire ? 1 : 0) - shown.fire) * 0.35;

    const panDeg = shown.x * PAN_RANGE_DEG;
    const tiltDeg = -shown.y * TILT_RANGE_DEG;

    rig.panJoint.style.transform = `translate3d(0,${rig.panPivotY}px,0) rotateY(${panDeg}deg)`;
    rig.tiltJoint.style.transform = `translate3d(0,${rig.tiltPivotY}px,0) rotateX(${tiltDeg}deg)`;

    rig.beam.style.opacity = shown.fire.toFixed(2);
    rig.tip.classList.toggle('firing', shown.fire > 0.5);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { render };
}

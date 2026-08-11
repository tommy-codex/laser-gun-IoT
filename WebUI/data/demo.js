// Virtual robot renderer, used both in Demo mode (fed by the local
// simulation loop) and in Hardware mode (mirrors what is being sent to the
// ESP), so the pad behaves the same with or without real hardware attached.
function createRobotView(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  let target = { x: 0, y: 0, fire: false };
  const shown = { x: 0, y: 0 };

  function render(state) {
    target = state;
  }

  function drawGrid(w, h) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let gx = 0; gx < w; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }
    for (let gy = 0; gy < h; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
  }

  function frame() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;

    shown.x += (target.x - shown.x) * 0.18;
    shown.y += (target.y - shown.y) * 0.18;

    ctx.clearRect(0, 0, w, h);
    drawGrid(w, h);

    const pivotX = w / 2, pivotY = h * 0.72;
    const maxReach = Math.min(w, h) * 0.42;
    const angle = Math.atan2(-shown.y, shown.x);
    const mag = Math.min(1, Math.hypot(shown.x, shown.y));
    const barrelLen = 46 + mag * 18;

    ctx.beginPath();
    ctx.ellipse(pivotX, pivotY, 34, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1b2128';
    ctx.fill();
    ctx.strokeStyle = '#3a4350';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(58,160,242,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, maxReach, 0, Math.PI * 2);
    ctx.stroke();

    const tipX = pivotX + Math.cos(angle) * barrelLen;
    const tipY = pivotY + Math.sin(angle) * barrelLen;

    ctx.strokeStyle = '#8a94a0';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    if (target.fire) {
      const beamX = pivotX + Math.cos(angle) * maxReach * 1.6;
      const beamY = pivotY + Math.sin(angle) * maxReach * 1.6;
      ctx.save();
      ctx.strokeStyle = '#ff2d3a';
      ctx.shadowColor = '#ff2d3a';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(beamX, beamY);
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(tipX, tipY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8a90';
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { render };
}

(function () {
  const state = { x: 0, y: 0, fire: false };
  const robotView = createRobotView(document.getElementById('robotCanvas'));

  const statusDot = document.getElementById('statusDot');
  const statusLabel = document.getElementById('statusLabel');
  const hardwareBtn = document.getElementById('modeHardwareBtn');
  const demoBtn = document.getElementById('modeDemoBtn');

  let mode = localStorage.getItem('laserGunMode') || 'demo';
  let ws = null;
  let wsReconnectTimer = null;
  let lastSent = 0;

  function setStatus(kind) {
    const labels = { connected: 'Connesso', connecting: 'Connessione...', demo: 'Demo', offline: 'Disconnesso' };
    statusDot.className = 'dot ' + kind;
    statusLabel.textContent = labels[kind] || kind;
  }

  function connectWS() {
    if (ws) return;
    setStatus('connecting');
    ws = new WebSocket('ws://' + location.hostname + ':81/');
    ws.onopen = () => setStatus('connected');
    ws.onclose = () => {
      ws = null;
      setStatus('offline');
      if (mode === 'hardware') {
        wsReconnectTimer = setTimeout(connectWS, 2000);
      }
    };
    ws.onerror = () => { if (ws) ws.close(); };
  }

  function disconnectWS() {
    clearTimeout(wsReconnectTimer);
    if (ws) {
      try { ws.send(JSON.stringify({ fire: false })); } catch (e) { /* socket already gone */ }
      ws.close();
      ws = null;
    }
  }

  function setMode(newMode) {
    mode = newMode;
    localStorage.setItem('laserGunMode', mode);
    hardwareBtn.classList.toggle('active', mode === 'hardware');
    demoBtn.classList.toggle('active', mode === 'demo');
    if (mode === 'hardware') {
      connectWS();
    } else {
      disconnectWS();
      setStatus('demo');
    }
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function sendState() {
    if (mode !== 'hardware' || !ws || ws.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    if (now - lastSent < 40) return; // ~25Hz throttle
    lastSent = now;
    ws.send(JSON.stringify({ x: round2(state.x), y: round2(state.y), fire: state.fire }));
  }

  function updateState(patch) {
    Object.assign(state, patch);
    robotView.render({ x: state.x, y: state.y, fire: state.fire });
    sendState();
  }

  function setupStick(zoneId, knobId, maxRadius, onChange) {
    const zone = document.getElementById(zoneId);
    const base = zone.querySelector('.stick-base');
    const knob = document.getElementById(knobId);
    let pointerId = null;

    function setKnobPos(dx, dy) {
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    function handleMove(e) {
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      setKnobPos(dx, dy);
      onChange(dx / maxRadius, dy / maxRadius, true);
    }

    function endDrag(e) {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      setKnobPos(0, 0);
      knob.classList.remove('active');
      onChange(0, 0, false);
    }

    base.addEventListener('pointerdown', (e) => {
      pointerId = e.pointerId;
      base.setPointerCapture(pointerId);
      knob.classList.add('active');
      handleMove(e);
    });
    base.addEventListener('pointermove', (e) => {
      if (pointerId !== null && e.pointerId === pointerId) handleMove(e);
    });
    base.addEventListener('pointerup', endDrag);
    base.addEventListener('pointercancel', endDrag);
  }

  setupStick('aimStick', 'aimKnob', 43, (nx, ny) => {
    updateState({ x: nx, y: ny });
  });

  setupStick('fireStick', 'fireKnob', 43, (nx, ny, active) => {
    updateState({ fire: active });
  });

  hardwareBtn.addEventListener('click', () => setMode('hardware'));
  demoBtn.addEventListener('click', () => setMode('demo'));

  setMode(mode);
  robotView.render(state);
})();

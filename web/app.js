import { planScan, afterApiOutcome } from './scan-feedback.js';

const COOLDOWN_MS = 1500;
const CUSTOM_VALUE = '__custom__';

const el = {
  apiUrl: document.getElementById('apiUrl'),
  batchSelect: document.getElementById('batchSelect'),
  customSheetWrap: document.getElementById('customSheetWrap'),
  sheetUrl: document.getElementById('sheetUrl'),
  btnConnect: document.getElementById('btnConnect'),
  btnStart: document.getElementById('btnStart'),
  btnStop: document.getElementById('btnStop'),
  flash: document.getElementById('flash'),
  stats: document.getElementById('stats'),
  pendingList: document.getElementById('pendingList'),
};

const cfg = window.RECEIVING_CONFIG || {
  apiUrl: window.RECEIVING_API_URL || '',
  batches: [],
};

let sheetId = null;
let coolingUntil = 0;
let scanner = null;
let latchedCode = '';
let scanInFlight = false;

function setFlash(text, kind) {
  el.flash.textContent = text;
  el.flash.className = kind || '';
}

function setStats(data) {
  if (!data) {
    el.stats.textContent = '已收 — / 共 —';
    return;
  }
  el.stats.textContent = `已收 ${data.received} / 共 ${data.total}`;
  const codes = data.pendingCodes || [];
  el.pendingList.innerHTML =
    codes.map((c) => `<li>${escapeHtml(c)}</li>`).join('') || '<li>（无）</li>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fillBatches() {
  const batches = Array.isArray(cfg.batches) ? cfg.batches : [];
  el.batchSelect.innerHTML = '';
  batches.forEach((b, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = b.name || `批次 ${i + 1}`;
    el.batchSelect.appendChild(opt);
  });
  const custom = document.createElement('option');
  custom.value = CUSTOM_VALUE;
  custom.textContent = '自定义表链接…';
  el.batchSelect.appendChild(custom);
  syncCustomVisibility();
}

function syncCustomVisibility() {
  const isCustom = el.batchSelect.value === CUSTOM_VALUE;
  el.customSheetWrap.hidden = !isCustom;
}

function selectedSheetUrl() {
  if (el.batchSelect.value === CUSTOM_VALUE) {
    return el.sheetUrl.value.trim();
  }
  const idx = Number(el.batchSelect.value);
  const b = (cfg.batches || [])[idx];
  return b && b.sheetUrl ? String(b.sheetUrl).trim() : '';
}

async function api(payload) {
  const url = el.apiUrl.value.trim();
  if (!url) throw new Error('请配置 Web App URL（高级选项或 config.js）');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('API 返回非 JSON，请检查部署权限与 URL');
  }
  return data;
}

function beep(freq, ms) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + ms / 1000);
    o.stop(ctx.currentTime + ms / 1000);
  } catch (_) {
    /* ignore */
  }
}

function showOutcome(display, code) {
  if (display === '新已收') {
    setFlash('新已收\n' + code, 'ok');
    beep(880, 120);
  } else if (display === '已收过') {
    setFlash('已收过\n' + code, 'dup');
    beep(440, 80);
  } else if (display === '不在清单') {
    setFlash('不在清单\n' + code, 'miss');
    beep(330, 60);
  } else if (display === '识别中') {
    setFlash('识别中…\n' + code, 'wait');
  } else if (display) {
    setFlash(String(display), '');
  }
}

el.apiUrl.value = cfg.apiUrl || window.RECEIVING_API_URL || '';
fillBatches();
el.batchSelect.addEventListener('change', syncCustomVisibility);

el.btnConnect.addEventListener('click', async () => {
  el.btnConnect.disabled = true;
  setFlash('挂载中…', 'wait');
  latchedCode = '';
  try {
    const sheetUrl = selectedSheetUrl();
    if (!sheetUrl) {
      setFlash('请选择有表链接的批次，或填写自定义链接', 'err');
      return;
    }
    const data = await api({ action: 'connect', sheetUrl });
    if (!data.ok) {
      const detail = (data.errors || [])
        .map((e) => {
          if (e.type === '非法状态') return `行${e.row} ${e.code} 状态=${e.value}`;
          if (e.type === '重复单号') return `重复 ${e.code} 行${(e.rows || []).join(',')}`;
          return JSON.stringify(e);
        })
        .join('；');
      setFlash(data.error + (detail ? '：' + detail : ''), 'err');
      sheetId = null;
      el.btnStart.disabled = true;
      return;
    }
    sheetId = data.sheetId;
    setFlash('挂载成功', 'ok');
    setStats(data);
    el.btnStart.disabled = false;
    const st = await api({ action: 'stats', sheetId });
    if (st.ok) setStats(st);
  } catch (err) {
    setFlash(String(err.message || err), 'err');
  } finally {
    el.btnConnect.disabled = false;
  }
});

async function onScan(decoded) {
  const now = Date.now();
  if (now < coolingUntil) return;
  if (!sheetId || scanInFlight) return;

  const planned = planScan(latchedCode, decoded);
  latchedCode = planned.nextLatch;

  if (!planned.code) return;

  if (!planned.callApi) {
    if (planned.display === '新已收') {
      showOutcome('新已收', planned.code);
    }
    return;
  }

  showOutcome('识别中', planned.code);
  scanInFlight = true;
  try {
    const data = await api({ action: 'scan', sheetId, code: planned.code });
    if (!data.ok) {
      setFlash(data.error || '写表失败', 'err');
      beep(200, 200);
      latchedCode = '';
      return;
    }
    const applied = afterApiOutcome(planned.code, data.outcome);
    latchedCode = applied.nextLatch;
    if (data.outcome === '新已收' || data.outcome === '已收过') {
      coolingUntil = Date.now() + COOLDOWN_MS;
    }
    showOutcome(applied.display, planned.code);
    setStats(data);
  } catch (err) {
    setFlash(String(err.message || err), 'err');
    latchedCode = '';
  } finally {
    scanInFlight = false;
  }
}

el.btnStart.addEventListener('click', async () => {
  if (!sheetId) {
    setFlash('请先挂载', 'err');
    return;
  }
  if (!window.isSecureContext) {
    setFlash(
      '当前不是 HTTPS 安全上下文，浏览器禁止摄像头。请用 GitHub Pages 等 HTTPS 打开本页',
      'err'
    );
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setFlash('本浏览器无摄像头 API。请用 iPhone Safari + HTTPS', 'err');
    return;
  }
  if (!window.Html5Qrcode) {
    setFlash('扫码库未加载（检查网络能否访问 unpkg.com）', 'err');
    return;
  }
  scanner = new Html5Qrcode('reader');
  el.btnStart.disabled = true;
  el.btnStop.disabled = false;
  latchedCode = '';
  try {
    const formats = window.Html5QrcodeSupportedFormats
      ? [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
        ]
      : undefined;
    await scanner.start(
      { facingMode: 'environment' },
      {
        fps: 8,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.333,
        ...(formats ? { formatsToSupport: formats } : {}),
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        videoConstraints: { facingMode: 'environment' },
      },
      (decoded) => {
        onScan(decoded);
      },
      () => {}
    );
    const video = document.querySelector('#reader video');
    if (video) {
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
    }
    setFlash('请对准一维条码', '');
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    let tip = msg;
    if (/streaming not supported|NotAllowedError|secure/i.test(msg)) {
      tip = msg + ' → 请确认地址栏是 https://，并用 Safari 打开';
    }
    setFlash('无法启动摄像头：' + tip, 'err');
    el.btnStart.disabled = false;
    el.btnStop.disabled = true;
    scanner = null;
  }
});

el.btnStop.addEventListener('click', async () => {
  if (scanner) {
    try {
      await scanner.stop();
      await scanner.clear();
    } catch (_) {}
    scanner = null;
  }
  el.btnStart.disabled = !sheetId;
  el.btnStop.disabled = true;
  latchedCode = '';
  setFlash('已停止扫码', '');
});

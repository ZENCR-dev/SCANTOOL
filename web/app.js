import { planScan } from './scan-feedback.js';
import { applyScan, revertReceived, stats } from './scan-outcome.js';

const COOLDOWN_MS = 500;
const SCAN_FPS = 15;
const CUSTOM_VALUE = '__custom__';

const el = {
  apiUrl: document.getElementById('apiUrl'),
  batchSelect: document.getElementById('batchSelect'),
  customSheetWrap: document.getElementById('customSheetWrap'),
  sheetUrl: document.getElementById('sheetUrl'),
  btnConnect: document.getElementById('btnConnect'),
  btnStop: document.getElementById('btnStop'),
  btnResume: document.getElementById('btnResume'),
  btnSwapBatch: document.getElementById('btnSwapBatch'),
  flash: document.getElementById('flash'),
  pendingList: document.getElementById('pendingList'),
  sessionBar: document.getElementById('session-bar'),
  sessionTitle: document.getElementById('sessionTitle'),
  sessionStats: document.getElementById('sessionStats'),
};

const cfg = window.RECEIVING_CONFIG || {
  apiUrl: window.RECEIVING_API_URL || '',
  batches: [],
};

let sheetId = null;
let sheetTitle = '';
let coolingUntil = 0;
let scanner = null;
let latchedCode = '';
/** @type {{ lines: { code: string, status: string }[] }} */
let localState = { lines: [] };
const pendingWrites = new Set();

function setFlash(text, kind) {
  el.flash.textContent = text;
  el.flash.className = kind || '';
}

function pendingCodesFromState() {
  return localState.lines.filter((l) => l.status === '未收').map((l) => l.code);
}

function refreshStatsUi() {
  const s = stats(localState);
  el.sessionStats.textContent = `已收 ${s.received} / ${s.total}`;
  const codes = pendingCodesFromState();
  el.pendingList.innerHTML =
    codes.map((c) => `<li>${escapeHtml(c)}</li>`).join('') || '<li>（无）</li>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setPaused(paused) {
  document.body.classList.toggle('paused', paused);
}

function enterScanScreen() {
  document.body.classList.add('scanning');
  el.sessionBar.classList.add('visible');
  el.sessionTitle.textContent = sheetTitle || '已挂载';
  el.sessionTitle.title = sheetTitle || '';
  refreshStatsUi();
}

function leaveScanScreen() {
  document.body.classList.remove('scanning');
  setPaused(false);
  el.sessionBar.classList.remove('visible');
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
  el.customSheetWrap.hidden = el.batchSelect.value !== CUSTOM_VALUE;
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
  } else if (display) {
    setFlash(String(display), '');
  }
}

function revertLocalReceived(code) {
  localState = revertReceived(localState, code);
  if (latchedCode === code) latchedCode = '';
  refreshStatsUi();
}

async function persistNewReceive(code) {
  if (pendingWrites.has(code)) return;
  pendingWrites.add(code);
  try {
    const data = await api({ action: 'scan', sheetId, code });
    if (!data.ok || data.outcome !== '新已收') {
      revertLocalReceived(code);
      setFlash(
        (data && data.error) || '写表失败，已撤销本地已收\n' + code,
        'err'
      );
      beep(200, 200);
    }
  } catch (err) {
    revertLocalReceived(code);
    setFlash(String(err.message || err) + '\n' + code, 'err');
    beep(200, 200);
  } finally {
    pendingWrites.delete(code);
  }
}

async function stopScanner() {
  if (scanner) {
    try {
      await scanner.stop();
      await scanner.clear();
    } catch (_) {}
    scanner = null;
  }
  latchedCode = '';
  setPaused(true);
}

async function startScanner() {
  if (!sheetId) {
    setFlash('请先挂载', 'err');
    return false;
  }
  if (!window.isSecureContext) {
    setFlash('请用 HTTPS（如 GitHub Pages）打开本页', 'err');
    return false;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    setFlash('本浏览器无摄像头 API', 'err');
    return false;
  }
  if (!window.Html5Qrcode) {
    setFlash('扫码库未加载', 'err');
    return false;
  }
  if (scanner) {
    await stopScanner();
  }
  scanner = new Html5Qrcode('reader');
  latchedCode = '';
  setPaused(false);
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
        fps: SCAN_FPS,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.333,
        ...(formats ? { formatsToSupport: formats } : {}),
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        videoConstraints: { facingMode: 'environment' },
      },
      (decoded) => onScan(decoded),
      () => {}
    );
    const video = document.querySelector('#reader video');
    if (video) {
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
    }
    setFlash('请对准条码', '');
    return true;
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    setFlash('无法启动摄像头：' + msg, 'err');
    scanner = null;
    setPaused(true);
    return false;
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
      leaveScanScreen();
      return;
    }
    sheetId = data.sheetId;
    sheetTitle = data.sheetTitle || '已挂载';
    localState = {
      lines: (data.lines || []).map((l) => ({
        code: l.code,
        status: l.status === '已收' ? '已收' : '未收',
      })),
    };
    enterScanScreen();
    setFlash('开摄中…', 'wait');
    const ok = await startScanner();
    if (!ok) {
      setFlash('挂载成功，但摄像头未开。点「继续扫码」', 'err');
    }
  } catch (err) {
    setFlash(String(err.message || err), 'err');
  } finally {
    el.btnConnect.disabled = false;
  }
});

el.btnSwapBatch.addEventListener('click', async () => {
  await stopScanner();
  sheetId = null;
  sheetTitle = '';
  localState = { lines: [] };
  latchedCode = '';
  leaveScanScreen();
  setFlash('请重新选择批次并挂载', '');
});

function onScan(decoded) {
  const now = Date.now();
  if (now < coolingUntil) return;
  if (!sheetId) return;

  const planned = planScan(latchedCode, decoded);
  if (!planned.code) return;

  if (!planned.callApi) {
    showOutcome('新已收', planned.code);
    return;
  }

  latchedCode = '';
  const result = applyScan(localState, planned.code);
  localState = result.state;
  refreshStatsUi();

  if (result.outcome === '忽略') return;

  showOutcome(result.outcome, result.code);

  if (result.outcome === '新已收') {
    latchedCode = result.code;
    coolingUntil = Date.now() + COOLDOWN_MS;
    void persistNewReceive(result.code);
  } else if (result.outcome === '已收过') {
    coolingUntil = Date.now() + COOLDOWN_MS;
  }
}

el.btnStop.addEventListener('click', async () => {
  await stopScanner();
  setFlash('已停止\n点「继续扫码」恢复', '');
});

el.btnResume.addEventListener('click', async () => {
  el.btnResume.disabled = true;
  try {
    await startScanner();
  } finally {
    el.btnResume.disabled = false;
  }
});

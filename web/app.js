(() => {
  const COOLDOWN_MS = 1500;

  const el = {
    apiUrl: document.getElementById('apiUrl'),
    sheetUrl: document.getElementById('sheetUrl'),
    btnConnect: document.getElementById('btnConnect'),
    btnStart: document.getElementById('btnStart'),
    btnStop: document.getElementById('btnStop'),
    flash: document.getElementById('flash'),
    stats: document.getElementById('stats'),
    pendingList: document.getElementById('pendingList'),
  };

  let sheetId = null;
  let coolingUntil = 0;
  let scanner = null;

  if (window.RECEIVING_API_URL) {
    el.apiUrl.value = window.RECEIVING_API_URL;
  }

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
    el.pendingList.innerHTML = codes.map((c) => `<li>${escapeHtml(c)}</li>`).join('') || '<li>（无）</li>';
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  async function api(payload) {
    const url = el.apiUrl.value.trim();
    if (!url) throw new Error('请填写 Web App URL');
    const res = await fetch(url, {
      method: 'POST',
      // text/plain 避免 CORS 预检（Apps Script 常见写法）
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

  el.btnConnect.addEventListener('click', async () => {
    el.btnConnect.disabled = true;
    setFlash('挂载中…', '');
    try {
      const data = await api({
        action: 'connect',
        sheetUrl: el.sheetUrl.value.trim(),
      });
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
    if (!sheetId) return;

    try {
      const data = await api({ action: 'scan', sheetId, code: decoded });
      if (!data.ok) {
        setFlash(data.error || '写表失败', 'err');
        beep(200, 200);
        return;
      }
      const outcome = data.outcome;
      if (outcome === '新已收' || outcome === '已收过') {
        coolingUntil = Date.now() + COOLDOWN_MS;
      }
      if (outcome === '新已收') {
        setFlash('新已收\n' + data.code, 'ok');
        beep(880, 120);
      } else if (outcome === '已收过') {
        setFlash('已收过\n' + data.code, 'dup');
        beep(440, 80);
      } else if (outcome === '不在清单') {
        setFlash('不在清单\n' + data.code, 'miss');
        beep(330, 60);
      } else {
        setFlash(outcome || '忽略', '');
      }
      setStats(data);
    } catch (err) {
      setFlash(String(err.message || err), 'err');
    }
  }

  el.btnStart.addEventListener('click', async () => {
    if (!sheetId) {
      setFlash('请先挂载', 'err');
      return;
    }
    if (!window.Html5Qrcode) {
      setFlash('扫码库未加载', 'err');
      return;
    }
    scanner = new Html5Qrcode('reader');
    el.btnStart.disabled = true;
    el.btnStop.disabled = false;
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
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.5,
          ...(formats ? { formatsToSupport: formats } : {}),
        },
        (decoded) => {
          onScan(decoded);
        },
        () => {}
      );
      setFlash('请对准一维条码', '');
    } catch (err) {
      setFlash('无法启动摄像头：' + (err.message || err), 'err');
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
    setFlash('已停止扫码', '');
  });
})();

/**
 * 同码闩 / 扫码展示反馈（可测纯逻辑）。
 * 台账判定仍在 scan-outcome；此处只决定是否 callApi 与屏幕展示。
 */

/**
 * @param {string} latchedCode
 * @param {string} rawDecoded
 * @returns {{ callApi: boolean, display: string|null, nextLatch: string, code: string }}
 */
export function planScan(latchedCode, rawDecoded) {
  const code = String(rawDecoded ?? '').trim();
  const latch = String(latchedCode ?? '').trim();
  if (!code) {
    return { callApi: false, display: null, nextLatch: latch, code: '' };
  }
  if (latch && code === latch) {
    return { callApi: false, display: '新已收', nextLatch: latch, code };
  }
  return { callApi: true, display: '识别中', nextLatch: '', code };
}

/**
 * @param {string} code
 * @param {string} outcome
 * @returns {{ display: string, nextLatch: string }}
 */
export function afterApiOutcome(code, outcome) {
  const c = String(code ?? '').trim();
  if (outcome === '新已收') {
    return { display: '新已收', nextLatch: c };
  }
  if (outcome === '已收过') {
    return { display: '已收过', nextLatch: '' };
  }
  if (outcome === '不在清单') {
    return { display: '不在清单', nextLatch: '' };
  }
  return { display: outcome || '忽略', nextLatch: '' };
}

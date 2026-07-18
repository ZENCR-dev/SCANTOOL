/**
 * 扫码展示反馈文案组合（可测纯逻辑）。
 * 领域词见 CONTEXT.md（货品描述、结果水印）。
 */

/** @typedef {'新已收' | '已收过' | '不在清单' | '忽略'} ScanOutcome */

/**
 * @param {ScanOutcome} outcome
 * @param {string} code
 * @param {string} [description]
 * @returns {{ update: false } | { update: true, kind: string, watermark: string, primary: string, secondary: string }}
 */
export function composeScanFlash(outcome, code, description) {
  if (outcome === '忽略') {
    return { update: false };
  }

  const trimmedCode = String(code ?? '').trim();

  if (outcome === '不在清单') {
    return {
      update: true,
      kind: 'miss',
      watermark: '不在清单',
      primary: trimmedCode,
      secondary: '',
    };
  }

  if (outcome === '新已收' || outcome === '已收过') {
    const desc = String(description ?? '').trim();
    return {
      update: true,
      kind: outcome === '新已收' ? 'ok' : 'dup',
      watermark: outcome,
      primary: desc || '（无货品描述）',
      secondary: trimmedCode,
    };
  }

  return { update: false };
}

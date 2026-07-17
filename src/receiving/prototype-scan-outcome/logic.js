/**
 * PROTOTYPE — pure scan-outcome logic (portable; lift later).
 * Question: given expected tracking lines, what is the scan outcome?
 */

/** @typedef {'未收' | '已收'} LineStatus */
/** @typedef {'新已收' | '已收过' | '不在清单' | '忽略'} ScanOutcome */

/**
 * @typedef {{ code: string, status: LineStatus }} ExpectedLine
 * @typedef {{ lines: ExpectedLine[] }} ReceivingState
 */

/**
 * @param {ReceivingState} state
 * @param {string} rawCode
 * @returns {{ state: ReceivingState, outcome: ScanOutcome, code: string }}
 */
export function applyScan(state, rawCode) {
  const code = String(rawCode ?? '').trim();
  if (!code) {
    return { state, outcome: '忽略', code: '' };
  }

  const idx = state.lines.findIndex((l) => l.code === code);
  if (idx === -1) {
    return { state, outcome: '不在清单', code };
  }

  const line = state.lines[idx];
  if (line.status === '已收') {
    return { state, outcome: '已收过', code };
  }

  const lines = state.lines.map((l, i) =>
    i === idx ? { ...l, status: /** @type {LineStatus} */ ('已收') } : l
  );
  return { state: { lines }, outcome: '新已收', code };
}

/** @param {ReceivingState} state */
export function stats(state) {
  const total = state.lines.length;
  const received = state.lines.filter((l) => l.status === '已收').length;
  const pending = total - received;
  return { total, received, pending };
}

/** @param {string[]} codes */
export function initialState(codes) {
  return {
    lines: codes.map((code) => ({
      code: String(code).trim(),
      status: /** @type {LineStatus} */ ('未收'),
    })),
  };
}

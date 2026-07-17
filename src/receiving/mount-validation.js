/**
 * 挂载校验（可测纯逻辑）。
 */

/** @typedef {'未收' | '已收'} LineStatus */
/**
 * @typedef {{ row: number, code: string, status: string }} RawMountRow
 * @typedef {{ code: string, status: LineStatus, row: number }} ExpectedLine
 * @typedef {{ type: string, row?: number, rows?: number[], code?: string, value?: string }} MountError
 */

/**
 * @param {RawMountRow[]} rows
 * @returns {{ ok: true, lines: ExpectedLine[] } | { ok: false, errors: MountError[] }}
 */
export function validateMountRows(rows) {
  /** @type {MountError[]} */
  const errors = [];
  /** @type {ExpectedLine[]} */
  const lines = [];
  /** @type {Map<string, number[]>} */
  const codeRows = new Map();

  for (const raw of rows) {
    const code = String(raw.code ?? '').trim();
    const statusRaw = String(raw.status ?? '').trim();
    const row = raw.row;

    if (!code) continue;

    const list = codeRows.get(code) ?? [];
    list.push(row);
    codeRows.set(code, list);

    if (statusRaw !== '' && statusRaw !== '未收' && statusRaw !== '已收') {
      errors.push({ type: '非法状态', row, code, value: statusRaw });
      continue;
    }

    const status = /** @type {LineStatus} */ (statusRaw === '已收' ? '已收' : '未收');
    lines.push({ code, status, row });
  }

  for (const [code, rowsForCode] of codeRows) {
    if (rowsForCode.length > 1) {
      errors.push({ type: '重复单号', code, rows: rowsForCode });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, lines };
}

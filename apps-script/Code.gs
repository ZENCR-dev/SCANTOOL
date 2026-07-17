/**
 * 收货扫码 — Apps Script Web App API
 * 部署：执行身份「我」、访问权限「任何人」。
 * 客户端请用 Content-Type: text/plain 发送 JSON，避免 CORS 预检。
 *
 * 纯逻辑与 src/receiving 保持同规则（手工同步）。
 */

var HEADER_CODE = '单号';
var HEADER_STATUS = '状态';
var HEADER_TIME = '扫码时间';

function doGet(e) {
  return json_({
    ok: true,
    service: 'receiving-scan',
    hint: 'POST JSON { action: connect|scan|stats, ... } with Content-Type text/plain',
  });
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    var action = body.action;
    if (action === 'connect') {
      return json_(connect_(body.sheetUrl || body.sheetId));
    }
    if (action === 'scan') {
      return json_(scan_(body.sheetId, body.code));
    }
    if (action === 'stats') {
      return json_(statsApi_(body.sheetId));
    }
    return json_({ ok: false, error: '未知 action：' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function connect_(sheetUrlOrId) {
  var sheetId = extractSheetId_(sheetUrlOrId);
  var sheet = openFirstSheet_(sheetId);
  ensureHeaders_(sheet);
  var validated = validateSheet_(sheet);
  if (!validated.ok) {
    return { ok: false, error: '挂载校验失败', errors: validated.errors };
  }
  var s = computeStats_(validated.lines);
  var ss = SpreadsheetApp.openById(sheetId);
  return {
    ok: true,
    sheetId: sheetId,
    sheetTitle: ss.getName(),
    total: s.total,
    received: s.received,
    pending: s.pending,
    lines: validated.lines.map(function (l) {
      return { code: l.code, status: l.status };
    }),
    pendingCodes: validated.lines
      .filter(function (l) {
        return l.status === '未收';
      })
      .map(function (l) {
        return l.code;
      }),
  };
}

function scan_(sheetId, rawCode) {
  if (!sheetId) {
    return { ok: false, error: '缺少 sheetId，请先挂载' };
  }
  var sheet = openFirstSheet_(sheetId);
  ensureHeaders_(sheet);
  var validated = validateSheet_(sheet);
  if (!validated.ok) {
    return { ok: false, error: '收货表校验失败，请重新挂载', errors: validated.errors };
  }

  var state = { lines: validated.lines.map(function (l) {
    return { code: l.code, status: l.status };
  }) };
  var result = applyScan_(state, rawCode);

  if (result.outcome === '新已收') {
    var row = findRowForCode_(validated.lines, result.code);
    if (!row) {
      return { ok: false, error: '内部错误：找不到要写入的行' };
    }
    try {
      sheet.getRange(row, 2).setValue('已收');
      sheet.getRange(row, 3).setValue(new Date());
    } catch (writeErr) {
      return {
        ok: false,
        error: '写表失败：' + (writeErr.message || writeErr),
        outcome: null,
      };
    }
  }

  var after = validateSheet_(sheet);
  if (!after.ok) {
    return {
      ok: true,
      outcome: result.outcome,
      code: result.code,
      warning: '扫码已处理但重新读表校验失败',
      errors: after.errors,
    };
  }
  var s = computeStats_(after.lines);
  return {
    ok: true,
    outcome: result.outcome,
    code: result.code,
    total: s.total,
    received: s.received,
    pending: s.pending,
    pendingCodes: after.lines
      .filter(function (l) {
        return l.status === '未收';
      })
      .map(function (l) {
        return l.code;
      }),
  };
}

function statsApi_(sheetId) {
  if (!sheetId) {
    return { ok: false, error: '缺少 sheetId' };
  }
  var sheet = openFirstSheet_(sheetId);
  ensureHeaders_(sheet);
  var validated = validateSheet_(sheet);
  if (!validated.ok) {
    return { ok: false, error: '收货表校验失败', errors: validated.errors };
  }
  var s = computeStats_(validated.lines);
  return {
    ok: true,
    total: s.total,
    received: s.received,
    pending: s.pending,
    pendingCodes: validated.lines.filter(function (l) { return l.status === '未收'; }).map(function (l) { return l.code; }),
  };
}

function findRowForCode_(lines, code) {
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].code === code) return lines[i].row;
  }
  return null;
}

function openFirstSheet_(sheetId) {
  var ss = SpreadsheetApp.openById(sheetId);
  return ss.getSheets()[0];
}

function extractSheetId_(urlOrId) {
  var s = String(urlOrId || '').trim();
  if (!s) throw new Error('请提供表格链接或 ID');
  var m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]+$/.test(s)) return s;
  throw new Error('无法解析表格 ID');
}

function ensureHeaders_(sheet) {
  var r1 = sheet.getRange(1, 1, 1, 3).getValues()[0];
  var c0 = String(r1[0] || '').trim();
  var c1 = String(r1[1] || '').trim();
  var c2 = String(r1[2] || '').trim();
  if (c0 !== HEADER_CODE || c1 !== HEADER_STATUS || c2 !== HEADER_TIME) {
    if (!c0 && !c1 && !c2) {
      sheet.getRange(1, 1, 1, 3).setValues([[HEADER_CODE, HEADER_STATUS, HEADER_TIME]]);
      return;
    }
    if (c0 && c0 !== HEADER_CODE) {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, 3).setValues([[HEADER_CODE, HEADER_STATUS, HEADER_TIME]]);
      return;
    }
    sheet.getRange(1, 1, 1, 3).setValues([[HEADER_CODE, HEADER_STATUS, HEADER_TIME]]);
  }
}

function validateSheet_(sheet) {
  var last = sheet.getLastRow();
  if (last < 2) {
    return { ok: true, lines: [] };
  }
  var values = sheet.getRange(2, 1, last, 3).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var statusCell = values[i][1];
    var statusStr = statusCell === '' || statusCell === null ? '' : String(statusCell).trim();
    rows.push({
      row: i + 2,
      code: values[i][0],
      status: statusStr,
    });
  }
  return validateMountRows_(rows);
}

/** —— 与 src/receiving/mount-validation.js 同规则 —— */
function validateMountRows_(rows) {
  var errors = [];
  var lines = [];
  var codeRows = {};

  for (var i = 0; i < rows.length; i++) {
    var raw = rows[i];
    var code = String(raw.code == null ? '' : raw.code).trim();
    var statusRaw = String(raw.status == null ? '' : raw.status).trim();
    var row = raw.row;

    if (!code) continue;

    if (!codeRows[code]) codeRows[code] = [];
    codeRows[code].push(row);

    if (statusRaw !== '' && statusRaw !== '未收' && statusRaw !== '已收') {
      errors.push({ type: '非法状态', row: row, code: code, value: statusRaw });
      continue;
    }

    lines.push({
      code: code,
      status: statusRaw === '已收' ? '已收' : '未收',
      row: row,
    });
  }

  Object.keys(codeRows).forEach(function (code) {
    if (codeRows[code].length > 1) {
      errors.push({ type: '重复单号', code: code, rows: codeRows[code] });
    }
  });

  if (errors.length > 0) return { ok: false, errors: errors };
  return { ok: true, lines: lines };
}

/** —— 与 src/receiving/scan-outcome.js 同规则 —— */
function applyScan_(state, rawCode) {
  var code = String(rawCode == null ? '' : rawCode).trim();
  if (!code) {
    return { state: state, outcome: '忽略', code: '' };
  }
  var idx = -1;
  for (var i = 0; i < state.lines.length; i++) {
    if (state.lines[i].code === code) {
      idx = i;
      break;
    }
  }
  if (idx === -1) {
    return { state: state, outcome: '不在清单', code: code };
  }
  if (state.lines[idx].status === '已收') {
    return { state: state, outcome: '已收过', code: code };
  }
  var lines = state.lines.map(function (l, i) {
    if (i !== idx) return l;
    return { code: l.code, status: '已收' };
  });
  return { state: { lines: lines }, outcome: '新已收', code: code };
}

function computeStats_(lines) {
  var total = lines.length;
  var received = 0;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].status === '已收') received++;
  }
  return { total: total, received: received, pending: total - received };
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('空请求体');
  }
  return JSON.parse(e.postData.contents);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

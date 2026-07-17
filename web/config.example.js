/**
 * 前端默认配置（提交到 git，随 GitHub Pages 发布）。
 * 实现预置批次后：页面主路径为「选批次 → 挂载」。
 *
 * apiUrl: Apps Script Web App 的 …/exec
 * batches: 约 3～4 项；name 为下拉文案，sheetUrl 为收货表链接或 ID
 */
window.RECEIVING_CONFIG = {
  apiUrl: 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_DEPLOYMENT_ID/exec',
  batches: [
    { name: '批次 1', sheetUrl: 'https://docs.google.com/spreadsheets/d/REPLACE_SHEET_ID_1/edit' },
    { name: '批次 2', sheetUrl: 'https://docs.google.com/spreadsheets/d/REPLACE_SHEET_ID_2/edit' },
    { name: '批次 3', sheetUrl: 'https://docs.google.com/spreadsheets/d/REPLACE_SHEET_ID_3/edit' },
    { name: '批次 4', sheetUrl: 'https://docs.google.com/spreadsheets/d/REPLACE_SHEET_ID_4/edit' },
  ],
};

// 兼容旧字段（实现迁移期可读；新代码应使用 RECEIVING_CONFIG）
window.RECEIVING_API_URL = window.RECEIVING_CONFIG.apiUrl;

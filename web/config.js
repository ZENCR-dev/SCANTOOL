/**
 * 本地/将提交的默认配置（ADR-0003）。
 * 把各批次 sheetUrl 换成真实收货表链接后 commit + push。
 */
window.RECEIVING_CONFIG = {
  apiUrl:
    'https://script.google.com/macros/s/AKfycbzvvpkw0MhBBGsYPTut5e1G_QfMk3i5AsiObZ2DK50tq-rDMaxwZmRl-8g8AWCqc18/exec',
  batches: [
    { name: '批次 1', sheetUrl: 'https://docs.google.com/spreadsheets/d/1yzZyLneoka48attHdTTgbodxF9gvg7ikj9CnRiSTRSg/edit?usp=sharing' },
    { name: '批次 2', sheetUrl: 'https://docs.google.com/spreadsheets/d/1RVp19PziTpyfEDtAx3ID7ZegLhiNRVyOBztqpFNmS5g/edit?usp=sharing' },
    { name: '批次 3', sheetUrl: '' },
    { name: '批次 4', sheetUrl: '' },
  ],
};
window.RECEIVING_API_URL = window.RECEIVING_CONFIG.apiUrl;

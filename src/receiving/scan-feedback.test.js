import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planScan, afterApiOutcome } from './scan-feedback.js';

describe('同码闩 planScan', () => {
  it('空解码 → 不调 API，保持闩', () => {
    const r = planScan('A1', '  ');
    assert.equal(r.callApi, false);
    assert.equal(r.display, null);
    assert.equal(r.nextLatch, 'A1');
  });

  it('与闩相同 → 不调 API，展示新已收', () => {
    const r = planScan('A1', 'A1');
    assert.equal(r.callApi, false);
    assert.equal(r.display, '新已收');
    assert.equal(r.nextLatch, 'A1');
  });

  it('与闩不同（含不在清单码）→ 调 API，解除闩，展示识别中', () => {
    const r = planScan('A1', 'UNKNOWN');
    assert.equal(r.callApi, true);
    assert.equal(r.display, '识别中');
    assert.equal(r.nextLatch, '');
    assert.equal(r.code, 'UNKNOWN');
  });

  it('无闩时新码 → 调 API', () => {
    const r = planScan('', 'B2');
    assert.equal(r.callApi, true);
    assert.equal(r.code, 'B2');
    assert.equal(r.nextLatch, '');
  });
});

describe('同码闩 afterApiOutcome', () => {
  it('新已收 → 闩住该码', () => {
    const r = afterApiOutcome('A1', '新已收');
    assert.equal(r.display, '新已收');
    assert.equal(r.nextLatch, 'A1');
  });

  it('已收过 → 清空闩', () => {
    const r = afterApiOutcome('A1', '已收过');
    assert.equal(r.display, '已收过');
    assert.equal(r.nextLatch, '');
  });

  it('不在清单 → 清空闩', () => {
    const r = afterApiOutcome('X', '不在清单');
    assert.equal(r.display, '不在清单');
    assert.equal(r.nextLatch, '');
  });
});

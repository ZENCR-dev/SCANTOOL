import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyScan, initialState, stats } from './scan-outcome.js';

describe('扫码结果判定', () => {
  it('trim 后空串 → 忽略，清单不变', () => {
    const state = initialState(['A1']);
    const result = applyScan(state, '   ');
    assert.equal(result.outcome, '忽略');
    assert.deepEqual(result.state, state);
  });

  it('无命中 → 不在清单，清单不变', () => {
    const state = initialState(['A1']);
    const result = applyScan(state, 'UNKNOWN');
    assert.equal(result.outcome, '不在清单');
    assert.equal(result.code, 'UNKNOWN');
    assert.deepEqual(result.state.lines, state.lines);
  });

  it('命中且已是已收 → 已收过，清单不变', () => {
    let state = initialState(['A1']);
    state = applyScan(state, 'A1').state;
    const result = applyScan(state, 'A1');
    assert.equal(result.outcome, '已收过');
    assert.equal(stats(result.state).received, 1);
  });

  it('命中且未收 → 新已收；统计正确', () => {
    const state = initialState(['A1', 'B2']);
    const result = applyScan(state, ' A1 ');
    assert.equal(result.outcome, '新已收');
    assert.equal(result.code, 'A1');
    assert.equal(stats(result.state).received, 1);
    assert.equal(stats(result.state).total, 2);
    assert.equal(stats(result.state).pending, 1);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateMountRows } from './mount-validation.js';

describe('挂载校验', () => {
  it('合法行：空与未收均为未收；已收保留；得到总数', () => {
    const result = validateMountRows([
      { row: 2, code: 'A1', status: '' },
      { row: 3, code: 'B2', status: '未收' },
      { row: 4, code: 'C3', status: '已收' },
    ]);
    assert.equal(result.ok, true);
    assert.equal(result.lines.length, 3);
    assert.equal(result.lines[0].status, '未收');
    assert.equal(result.lines[1].status, '未收');
    assert.equal(result.lines[2].status, '已收');
  });

  it('空行跳过，不报错', () => {
    const result = validateMountRows([
      { row: 2, code: 'A1', status: '' },
      { row: 3, code: '  ', status: '' },
      { row: 4, code: 'B2', status: '' },
    ]);
    assert.equal(result.ok, true);
    assert.equal(result.lines.length, 2);
  });

  it('0 条应收也允许成功', () => {
    const result = validateMountRows([{ row: 2, code: '', status: '' }]);
    assert.equal(result.ok, true);
    assert.equal(result.lines.length, 0);
  });

  it('非法状态 → 整表失败，含行号单号原值', () => {
    const result = validateMountRows([
      { row: 2, code: 'A1', status: '' },
      { row: 3, code: 'B2', status: 'OK' },
    ]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.type === '非法状态'));
    const err = result.errors.find((e) => e.type === '非法状态');
    assert.equal(err.row, 3);
    assert.equal(err.code, 'B2');
    assert.equal(err.value, 'OK');
  });

  it('重复单号 → 整表失败，含行号', () => {
    const result = validateMountRows([
      { row: 2, code: 'A1', status: '' },
      { row: 3, code: 'A1', status: '' },
    ]);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.type === '重复单号'));
    const err = result.errors.find((e) => e.type === '重复单号');
    assert.equal(err.code, 'A1');
    assert.deepEqual(err.rows, [2, 3]);
  });
});

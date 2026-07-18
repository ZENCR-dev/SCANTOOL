import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { composeScanFlash } from './compose-scan-flash.js';

describe('扫码展示反馈组合', () => {
  it('忽略 → 不更新', () => {
    assert.deepEqual(composeScanFlash('忽略', 'A1', '货'), { update: false });
  });

  it('新已收：有描述 → 水印结果词、主文案描述、次要单号', () => {
    assert.deepEqual(composeScanFlash('新已收', 'A1', '蓝牙耳机'), {
      update: true,
      kind: 'ok',
      watermark: '新已收',
      primary: '蓝牙耳机',
      secondary: 'A1',
    });
  });

  it('新已收：空描述 → 占位', () => {
    assert.deepEqual(composeScanFlash('新已收', 'A1', '  '), {
      update: true,
      kind: 'ok',
      watermark: '新已收',
      primary: '（无货品描述）',
      secondary: 'A1',
    });
  });

  it('已收过：同规则不同 kind', () => {
    assert.deepEqual(composeScanFlash('已收过', 'B2', '充电器'), {
      update: true,
      kind: 'dup',
      watermark: '已收过',
      primary: '充电器',
      secondary: 'B2',
    });
  });

  it('不在清单：主文案为扫到的码，次要空', () => {
    assert.deepEqual(composeScanFlash('不在清单', 'ZZ9', 'ignored'), {
      update: true,
      kind: 'miss',
      watermark: '不在清单',
      primary: 'ZZ9',
      secondary: '',
    });
  });
});

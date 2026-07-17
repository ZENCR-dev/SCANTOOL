#!/usr/bin/env node
/**
 * PROTOTYPE TUI — throwaway shell over ./logic.js
 * Run: node src/receiving/prototype-scan-outcome/tui.js
 */
import readline from 'node:readline';
import { applyScan, initialState, stats } from '../scan-outcome.js';

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

const DEMO_CODES = ['SF1234567890', 'YT9876543210', 'JT5556667778'];

let state = initialState(DEMO_CODES);
let lastOutcome = '(尚未扫码)';
let lastCode = '';

function render() {
  console.clear();
  const s = stats(state);
  console.log(bold('PROTOTYPE — 扫码结果逻辑'));
  console.log(dim('问题：扫一条码后，清单与扫码结果应如何变化？'));
  console.log('');
  console.log(bold('进度'));
  console.log(`  已收 ${s.received} / 共 ${s.total}  ${dim(`未收 ${s.pending}`)}`);
  console.log('');
  console.log(bold('上次扫码结果'));
  console.log(`  outcome: ${lastOutcome}`);
  console.log(`  code:    ${lastCode || dim('(无)')}`);
  console.log('');
  console.log(bold('应收清单'));
  for (const line of state.lines) {
    const mark = line.status === '已收' ? '✓' : '·';
    console.log(`  ${mark} ${line.code}  ${dim(line.status)}`);
  }
  console.log('');
  console.log(bold('操作'));
  console.log(`  ${bold('1')} 扫未收单  ${dim(DEMO_CODES[0])}`);
  console.log(`  ${bold('2')} 再扫同一单（应为已收过）`);
  console.log(`  ${bold('3')} 扫另一未收单  ${dim(DEMO_CODES[1])}`);
  console.log(`  ${bold('4')} 扫不在清单  ${dim('UNKNOWN999')}`);
  console.log(`  ${bold('5')} 扫空白/空格`);
  console.log(`  ${bold('r')} 重置演示清单`);
  console.log(`  ${bold('q')} 退出`);
  console.log('');
  process.stdout.write('> ');
}

function dispatch(key) {
  const k = key.trim().toLowerCase();
  if (k === 'q') process.exit(0);
  if (k === 'r') {
    state = initialState(DEMO_CODES);
    lastOutcome = '(已重置)';
    lastCode = '';
    return;
  }
  const map = {
    '1': DEMO_CODES[0],
    '2': DEMO_CODES[0],
    '3': DEMO_CODES[1],
    '4': 'UNKNOWN999',
    '5': '   ',
  };
  if (!(k in map)) return;
  const result = applyScan(state, map[k]);
  state = result.state;
  lastOutcome = result.outcome;
  lastCode = result.code || '(空)';
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
render();
rl.on('line', (line) => {
  dispatch(line);
  render();
});

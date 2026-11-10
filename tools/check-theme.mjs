import * as fs from 'node:fs';
import * as path from 'node:path';

const srcRoot = path.resolve('src');
const violations = [];

const walk = (directory) => {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === 'dist') return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
};

const relativePath = (filePath) => path.relative(process.cwd(), filePath);
const snippet = (value) => value.replace(/\s+/g, ' ').trim().slice(0, 60);
const lineNumberAt = (text, index) => text.slice(0, index).split('\n').length;

const stringLiterals = (text) => {
  const literals = [];
  let index = 0;

  while (index < text.length) {
    if (text.startsWith('//', index)) {
      const newline = text.indexOf('\n', index + 2);
      index = newline === -1 ? text.length : newline + 1;
      continue;
    }
    if (text.startsWith('/*', index)) {
      const end = text.indexOf('*/', index + 2);
      index = end === -1 ? text.length : end + 2;
      continue;
    }

    const quote = text[index];
    if (quote !== '"' && quote !== "'" && quote !== '`') {
      index += 1;
      continue;
    }

    const start = index;
    index += 1;
    while (index < text.length) {
      if (text[index] === '\\') {
        index += 2;
      } else if (text[index] === quote) {
        literals.push({
          line: lineNumberAt(text, start),
          value: text.slice(start + 1, index),
        });
        index += 1;
        break;
      } else {
        index += 1;
      }
    }
  }

  return literals;
};

const files = walk(srcRoot);

for (const filePath of files) {
  const extension = path.extname(filePath);
  if (!['.ts', '.tsx', '.css'].includes(extension)) continue;

  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n');

  if (extension === '.tsx') {
    for (const literal of stringLiterals(text)) {
      const hasDarkPanel = literal.value.includes('bg-accent-panel') || literal.value.includes('bg-[#');
      const hasInk = /text-ink(?![-\w])/.test(literal.value);
      if (hasDarkPanel && hasInk) {
        violations.push({
          file: relativePath(filePath),
          line: literal.line,
          rule: 'R1',
          snippet: literal.value,
        });
      }
    }
  }

  if (path.basename(filePath) !== 'index.css') {
    lines.forEach((line, offset) => {
      if (/bg-\[#|text-\[#|border-\[#/.test(line)) {
        violations.push({
          file: relativePath(filePath),
          line: offset + 1,
          rule: 'R2',
          snippet: line,
        });
      }
    });
  }
}

const pointsFile = path.join(srcRoot, 'components', 'PointsLedgerView.tsx');
if (fs.existsSync(pointsFile)) {
  const lines = fs.readFileSync(pointsFile, 'utf8').split('\n');
  lines.forEach((line, offset) => {
    if (/modern_editorial|cosmic_explorer|activeTheme/.test(line)) {
      violations.push({
        file: relativePath(pointsFile),
        line: offset + 1,
        rule: 'R3',
        snippet: line,
      });
    }
  });
}

for (const violation of violations) {
  console.log(`${violation.file}:${violation.line}  ${violation.rule}  ${snippet(violation.snippet)}`);
}
console.log(`共 ${violations.length} 条违规`);
console.log(violations.length === 0 ? 'THEME_CHECK: PASS' : 'THEME_CHECK: FAIL');
process.exitCode = violations.length === 0 ? 0 : 1;

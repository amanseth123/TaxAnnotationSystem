/**
 * Instead Tax Form Annotation System — Verification & Demo Script
 * 
 * Demonstrates programmatic loading of an annotation definition,
 * JSONPath resolution against taxpayer data, and field value formatting.
 * 
 * Usage:
 *   node scripts/verify.js
 */

const fs = require('fs');
const path = require('path');

// ─── Native JSONPath Resolver ───────────────────────────────────────────────
function resolvePath(jsonPath, data) {
  if (!jsonPath || !data) return undefined;
  let p = jsonPath.replace(/^\$\./, '').replace(/^\$/, '');
  const parts = p.match(/([^.\[\]]+)(?:\[(\d+)\])?/g) || [];
  let curr = data;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    const m = part.match(/^([^.\[\]]+)(?:\[(\d+)\])?$/);
    if (!m) continue;
    const key = m[1];
    const idx = m[2] !== undefined ? parseInt(m[2], 10) : undefined;
    curr = curr[key];
    if (idx !== undefined && Array.isArray(curr)) {
      curr = curr[idx];
    }
  }
  return curr;
}

// ─── Value Formatter per IRS Pub 1167 Rules ─────────────────────────────────
function formatFieldValue(field, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return '(empty)';
  }

  switch (field.type) {
    case 'text':
      return String(rawValue);

    case 'currency': {
      const num = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
      if (isNaN(num)) return String(rawValue);
      const absVal = Math.abs(num).toLocaleString('en-US', {
        minimumFractionDigits: field.formatting?.numberFormat?.decimals ?? 0,
        maximumFractionDigits: field.formatting?.numberFormat?.decimals ?? 0,
      });
      return num < 0 ? `(${absVal})` : absVal;
    }

    case 'integer': {
      const num = typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10);
      return isNaN(num) ? String(rawValue) : num.toLocaleString('en-US');
    }

    case 'percentage': {
      const num = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
      return isNaN(num) ? String(rawValue) : `${num.toFixed(1)}%`;
    }

    case 'checkbox':
      return (rawValue === true || rawValue === 'true' || rawValue === 'X') ? '[✓]' : '[ ]';

    case 'ssn': {
      const d = String(rawValue).replace(/\D/g, '');
      return d.length === 9 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : String(rawValue);
    }

    case 'ein': {
      const d = String(rawValue).replace(/\D/g, '');
      return d.length === 9 ? `${d.slice(0, 2)}-${d.slice(2)}` : String(rawValue);
    }

    case 'date':
      return String(rawValue);

    case 'comb': {
      const d = String(rawValue).replace(/\D/g, '');
      return `[${d.split('').join('][')}]`;
    }

    case 'enum':
      return `[Option: ${rawValue}]`;

    default:
      return String(rawValue);
  }
}

// ─── Main Execution ──────────────────────────────────────────────────────────
function main() {
  console.log('=================================================================');
  console.log('  Instead Tax Form Annotation System — Verification Runner');
  console.log('=================================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const formPath = path.join(rootDir, 'examples', 'form-1040-2024.annotation.json');
  const dataPath = path.join(rootDir, 'examples', 'taxpayer-data.example.json');

  console.log(`📂 Loading annotation: ${path.relative(rootDir, formPath)}`);
  console.log(`📂 Loading taxpayer data: ${path.relative(rootDir, dataPath)}\n`);

  const annotation = JSON.parse(fs.readFileSync(formPath, 'utf8'));
  const taxpayerData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`📋 Form Title:   ${annotation.metadata.title}`);
  console.log(`🗓  Tax Year:     ${annotation.metadata.taxYear}`);
  console.log(`📄 Page Count:   ${annotation.pages.length}`);
  console.log(`📐 Page Size:    ${annotation.pages[0].dimensions.width} x ${annotation.pages[0].dimensions.height} pts (US Letter)\n`);

  let resolvedCount = 0;
  let totalFields = 0;

  annotation.pages.forEach((page) => {
    console.log(`--- Page ${page.pageNumber} (${page.fields.length} fields) ---`);
    console.log(
      'ID'.padEnd(34) +
      'Type'.padEnd(14) +
      'Position (x,y,w,h)'.padEnd(22) +
      'Data Path'.padEnd(42) +
      'Formatted Output'
    );
    console.log('-'.repeat(125));

    page.fields.forEach((field) => {
      totalFields++;
      const posStr = `(${field.position.x},${field.position.y},${field.position.width},${field.position.height})`;
      let resolvedVal = undefined;
      if (field.dataRef) {
        resolvedVal = resolvePath(field.dataRef, taxpayerData);
        if (resolvedVal !== undefined) resolvedCount++;
      }
      const formatted = formatFieldValue(field, resolvedVal);

      console.log(
        field.id.padEnd(34) +
        field.type.padEnd(14) +
        posStr.padEnd(22) +
        (field.dataRef || '(none)').padEnd(42) +
        formatted
      );
    });
    console.log('');
  });

  console.log('=================================================================');
  console.log(`✅ Verification Complete: ${totalFields} fields processed.`);
  console.log(`🔗 Data References Resolved: ${resolvedCount} / ${totalFields} fields.`);
  console.log('=================================================================\n');
}

main();

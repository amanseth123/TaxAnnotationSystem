# Instead Tax Form Annotation System

A declarative JSON-based specification for annotating field locations, formatting rules, and data bindings on U.S. tax forms.

## Overview

This defines a data structure for tax form field annotations, enabling programmatic rendering of taxpayer values onto official IRS form templates (PDFs or images).

Key capabilities defined in the specification:
- **PDF-Native Geometry**: Uses 72 DPI bottom-left origin coordinates (`{ x, y, width, height }`), mapping directly to PDF rectangle specifications.
- **Decoupled Data Binding**: Uses `dataRef` JSONPath expressions to resolve values from arbitrary taxpayer JSON data models.
- **IRS Pub 1167 Formatting**: Enforces monospaced font defaults (Courier 10pt), right-aligned currency formatting, SSN/EIN patterns, and comb boxes.
- **Multi-Type Support**: 10 semantic field types (`text`, `currency`, `checkbox`, `ssn`, `ein`, `date`, `percentage`, `integer`, `enum`, `comb`).

---

## Repository Structure

```
InsteadTaxDS/
├── README.md                            ← Overview & Video script guide
├── schema/
│   ├── form-annotation.schema.json      ← Formal JSON Schema for form annotations
│   └── taxpayer-data.schema.json        ← JSON Schema for canonical taxpayer data
├── types/
│   └── index.ts                         ← TypeScript type definitions
├── examples/
│   ├── form-1040-2024.annotation.json   ← Representative Form 1040 annotation (22 fields)
│   └── taxpayer-data.example.json       ← Sample taxpayer JSON data
├── scripts/
│   └── verify.js                        ← CLI runner resolving & formatting annotations
└── docs/
    └── SPECIFICATION.md                 ← Technical specification & PDF integration guides
```

---

## How to Test

Run the verification script using Node.js:

```bash
node scripts/verify.js
```

This runner will:
1. Load `examples/form-1040-2024.annotation.json`.
2. Load `examples/taxpayer-data.example.json`.
3. Resolve all `dataRef` JSONPath paths.
4. Format values per IRS Pub 1167 rules (currency, SSN, comb digits, checkboxes).
5. Output a structured table of PDF coordinates, data paths, and rendered values.

---

## Technical Specification & Design Trade-offs

Read [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) for full documentation on:
- Coordinate origin conversion (CSS top-left vs PDF bottom-left).
- Formatting calculation formulas & font alignment rules.
- Complete PDF integration examples in **JavaScript (`pdf-lib`)** and **Python (`ReportLab`)**.

---


- Explain how a production backend service consumes this JSON with `pdf-lib` or `ReportLab` to produce printed PDF forms.

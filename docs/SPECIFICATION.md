# Instead Tax Form Annotation System Specification

## Introduction

The Instead Tax Form Annotation System defines a standardized, declarative JSON format for annotating fields and boxes on U.S. tax forms. Its primary purpose is to enable programmatic rendering and printing of taxpayer values onto official IRS form templates with precise positioning, while maintaining strict adherence to IRS Publication 1167 formatting requirements.

This specification outlines the schema mechanics, positioning mathematics, data resolution patterns, and rendering behaviors required to implement a compliant form generation engine.

## Coordinate System

The system uses a mathematical coordinate space optimized for direct PDF generation rather than screen display.

- **Origin**: Bottom-Left corner of the page.
- **Unit of Measurement**: PDF Points (72 points = 1 inch).
- **Standard Page Size**: US Letter (612 × 792 points).

### Coordinate Conversion Diagram

```text
CSS/Screen Coordinates (Top-Left Origin)         PDF Coordinates (Bottom-Left Origin)
(0,0) +------------------------+ (612,0)         (0,792)+------------------------+ (612,792)
      |                        |                        |                        |
      |   (x, y)               |                        |                        |
      |   +--------+           |                        |                        |
      |   |        | height    |                        |   +--------+           |
      |   +--------+           |                        |   |        | height    |
      |      width             |                        |   +--------+           |
      |                        |                        |   (x, y) width         |
      |                        |                        |                        |
(0,792)+------------------------+ (612,792)       (0,0)  +------------------------+ (612,0)

```

**Conversion Formula (Top-Left to Bottom-Left):**
```
pdfX = cssX
pdfY = pageHeight - cssY - fieldHeight
```

## Field Type Reference

The `FieldType` dictates the semantic meaning of the field, its default formatting, and how values are interpreted before rendering.

| Type | Default Formatting | Rendering Rules | Example Value | When to Use |
|------|--------------------|-----------------|---------------|-------------|
| `text` | Courier, 10pt, Left align, Bottom align | Render string as-is. Truncate if overflowing by default. | `"John Doe"` | Names, addresses, open text |
| `currency` | Courier, 10pt, Right align | Format with commas, 0 decimals (or as configured). Negative in parentheses. | `1234.56` -> `"1,234"` | Dollar amounts (W-2 Box 1, 1040 Line 1) |
| `checkbox` | Helvetica, 10pt, Center | Render `X` or `checkmark` if value is truthy. | `true` -> `"X"` | Yes/No toggles, boolean selections |
| `ssn` | Courier, 10pt, Left align, 2pt tracking | Strip non-digits, format as XXX-XX-XXXX. | `"123456789"` -> `"123-45-6789"` | Social Security Numbers |
| `ein` | Courier, 10pt, Left align, 2pt tracking | Strip non-digits, format as XX-XXXXXXX. | `"123456789"` -> `"12-3456789"` | Employer Identification Numbers |
| `date` | Courier, 10pt, Left align | Format per `dateFormat` (default `MM/DD/YYYY`). | `"2024-04-15"` -> `"04/15/2024"` | Birthdates, signature dates |
| `percentage` | Courier, 10pt, Right align | Append `%` symbol. Default 1 decimal. | `0.052` -> `"5.2%"` | Tax rates, ownership percentages |
| `integer` | Courier, 10pt, Right align | Format with commas. No decimals. | `1234` -> `"1,234"` | Counts, whole numbers |
| `enum` | Helvetica, 10pt, Center | Match value to option list. Render check/radio. | `"single"` -> `"X"` | Filing status, radio groups |
| `comb` | Courier, 10pt, Center | Split string into characters. Render one char per box. Requires `combDigits`. | `"123"` | Routing numbers, grid-based fields |

## Data Reference System

Fields bind to taxpayer data using a subset of JSONPath syntax, stored in the `dataRef` property. This cleanly separates the visual annotation definition from the underlying data model.

### Syntax Guide
- **Object Access**: `$.taxpayer.primary.firstName`
- **Array Access**: `$.income.wages[0].amount` (References the first W-2's wages)
- **Deep Nesting**: `$.schedules.scheduleC[0].expenses.advertising`

### Consumer Mapping
Consumers map their proprietary backend data structures to the `TaxpayerData` schema shape prior to rendering. The renderer evaluates the JSONPath expressions against this canonical shape.

## Formatting Rules

Formatting adheres to IRS Publication 1167.

### Font Requirements
- **Standard**: Courier (10-12 point preferred, 8 point minimum).
- **Alternative**: Helvetica/Arial permitted for non-numeric data, but Courier is heavily enforced for numbers to ensure OCR compatibility.

### Alignment Calculation Formulas
Assuming `[x, y]` represents the bottom-left coordinate of the field.

- **Left Alignment**: `renderX = field.x + padding.left`
- **Right Alignment**: `renderX = field.x + field.width - padding.right - textWidth`
- **Center Alignment**: `renderX = field.x + (field.width / 2) - (textWidth / 2)`

- **Bottom Alignment**: `renderY = field.y + padding.bottom`
- **Middle Alignment**: `renderY = field.y + (field.height / 2) - (fontHeight / 2) + fontDescent`

## Position System

The `Position` object `{x, y, width, height}` maps to the page using a bottom-left origin.

### Converting to PDF Rect `[llx, lly, urx, ury]`
PDF libraries often require a rectangular bound (Lower-Left X, Lower-Left Y, Upper-Right X, Upper-Right Y).

```javascript
const llx = position.x;
const lly = position.y;
const urx = position.x + position.width;
const ury = position.y + position.height;
```

## Overflow Handling

When text exceeds `field.width - padding.left - padding.right`, the `overflow.strategy` dictates behavior:

1. **`truncate`** (Default): String is clipped at the boundary. Use for generic strings where space is fixed.
2. **`scale`**: Font size is recursively reduced down to `minFontSize` (e.g., 6pt). Use for long names or addresses.
3. **`wrap`**: Text breaks at word boundaries onto a new line. Use for multi-line description fields.
4. **`continue`**: Text that doesn't fit flows into `continuationFieldId`. Use for itemized lists that span pages.

## Computed Fields

Fields can derive their value from other fields without touching the underlying data.
Formulas use the prefix `$` to reference field IDs.

```json
{
  "computation": {
    "formula": "$f1040.page1.line9 - $f1040.page1.line14",
    "dependencies": ["f1040.page1.line9", "f1040.page1.line14"]
  }
}
```
*Evaluators must topologically sort dependencies before execution.*

## Conditional Visibility

Fields are hidden unless conditions are met.

```json
{
  "conditionalVisibility": {
    "dependsOn": "f1040.page1.filingStatus",
    "condition": "equals",
    "value": "marriedFilingJointly"
  }
}
```
*Use Case: Only printing spouse SSN if the filing status requires it.*

## Multi-Page Forms

Pages are tracked via a 1-based `pageNumber`. 
Cross-page references are supported by ensuring every field ID is globally unique across the entire form definition (e.g., `f1040.page1.line1`, `f1040.page2.line16`).

## Versioning Strategy

- **Form Updates**: IRS forms update annually. The annotation schema requires a `taxYear` property.
- **Migration**: Field IDs remain stable across years where possible. If a line number changes (e.g., Line 8 becomes Line 9), the internal `id` stays semantically stable (`f1040.otherIncome`), while the `irsLine` label updates.

## Integration Guide

### 1. JavaScript / pdf-lib Example

```javascript
import { PDFDocument, StandardFonts } from 'pdf-lib';
import jp from 'jsonpath';

async function renderTaxForm(pdfBytes, annotation, taxpayerData) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  
  for (const pageDef of annotation.pages) {
    const pdfPage = pdfDoc.getPage(pageDef.pageNumber - 1);
    
    for (const field of pageDef.fields) {
      if (field.dataRef) {
        // Resolve data using JSONPath
        const match = jp.query(taxpayerData, field.dataRef);
        if (match.length > 0) {
          let text = String(match[0]);
          
          // Apply formatting (simplified)
          if (field.type === 'currency') text = formatCurrency(text);
          
          // Draw text using bottom-left coordinates
          pdfPage.drawText(text, {
            x: field.position.x + (field.formatting?.padding?.left || 2),
            y: field.position.y + (field.formatting?.padding?.bottom || 2),
            size: field.formatting?.fontSize || 10,
            font: font,
          });
        }
      }
    }
  }
  return await pdfDoc.save();
}
```

### 2. Python / ReportLab Example

```python
from reportlab.pdfgen import canvas
from jsonpath_ng import parse

def draw_field(c, field, data):
    if 'dataRef' in field:
        jsonpath_expr = parse(field['dataRef'])
        match = jsonpath_expr.find(data)
        
        if match:
            val = str(match[0].value)
            # Default Courier 10pt
            c.setFont("Courier", field.get('formatting', {}).get('fontSize', 10))
            
            x = field['position']['x']
            y = field['position']['y']
            
            # ReportLab uses bottom-left origin natively
            c.drawString(x + 2, y + 2, val)
```

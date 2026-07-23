/**
 * Instead Tax Form Annotation System — TypeScript Type Definitions
 *
 * These types mirror the JSON Schema (schema/form-annotation.schema.json)
 * and provide type-safe access to the annotation data structure.
 *
 * Usage:
 *   import { FormAnnotation, Field, FieldType } from './types';
 *   const annotation: FormAnnotation = JSON.parse(fs.readFileSync('form-1040.annotation.json', 'utf-8'));
 */

// =============================================================================
// Enums
// =============================================================================

/**
 * Semantic field types that determine default formatting and rendering behavior.
 *
 * - `text`:       Left-aligned plain text (names, addresses, descriptions)
 * - `currency`:   Right-aligned numeric with comma separators (dollar amounts)
 * - `checkbox`:   Renders checkmark or "X" centered in the box
 * - `ssn`:        Social Security Number formatted as XXX-XX-XXXX
 * - `ein`:        Employer Identification Number formatted as XX-XXXXXXX
 * - `date`:       Date value formatted per dateFormat pattern
 * - `percentage`: Right-aligned numeric with "%" suffix
 * - `integer`:    Right-aligned whole number with comma separators
 * - `enum`:       One-of-many selection (e.g., filing status radio buttons)
 * - `comb`:       Individual character boxes (e.g., SSN digits, routing numbers)
 */
export enum FieldType {
  Text = 'text',
  Currency = 'currency',
  Checkbox = 'checkbox',
  SSN = 'ssn',
  EIN = 'ein',
  Date = 'date',
  Percentage = 'percentage',
  Integer = 'integer',
  Enum = 'enum',
  Comb = 'comb',
}

/** Horizontal text alignment within a field box */
export enum TextAlignment {
  Left = 'left',
  Right = 'right',
  Center = 'center',
}

/** Vertical text alignment within a field box */
export enum VerticalAlignment {
  Top = 'top',
  Middle = 'middle',
  Bottom = 'bottom',
}

/**
 * Strategy for handling values that exceed field box dimensions.
 *
 * - `truncate`:  Clip text at the field boundary
 * - `scale`:     Reduce font size until the value fits (down to minFontSize)
 * - `wrap`:      Wrap text to the next line within the field box
 * - `continue`:  Flow overflow into a continuation field (specified by continuationFieldId)
 */
export enum OverflowStrategy {
  Truncate = 'truncate',
  Scale = 'scale',
  Wrap = 'wrap',
  Continue = 'continue',
}

/**
 * Font families available for form rendering.
 * Courier is the IRS standard for data entry per Publication 1167.
 */
export enum FontFamily {
  Courier = 'Courier',
  Helvetica = 'Helvetica',
  CourierBold = 'Courier-Bold',
  HelveticaBold = 'Helvetica-Bold',
  TimesRoman = 'Times-Roman',
  TimesBold = 'Times-Bold',
}

/** Checkbox rendering styles */
export enum CheckboxStyle {
  X = 'X',
  Checkmark = 'checkmark',
  Filled = 'filled',
}

/** How to render negative numbers */
export enum NegativeStyle {
  Minus = 'minus',
  Parentheses = 'parentheses',
}

/** Coordinate system origin location */
export enum CoordinateOrigin {
  BottomLeft = 'bottom-left',
  TopLeft = 'top-left',
}

/** Measurement units for coordinates */
export enum CoordinateUnits {
  Points = 'points',
  Inches = 'inches',
  Millimeters = 'millimeters',
}

/** Standard page sizes */
export enum PageSize {
  Letter = 'letter',
  Legal = 'legal',
  A4 = 'a4',
}

/** Text case transformations */
export enum TextTransform {
  None = 'none',
  Uppercase = 'uppercase',
  Lowercase = 'lowercase',
}

/** Conditional visibility comparison operators */
export enum VisibilityCondition {
  Equals = 'equals',
  NotEquals = 'notEquals',
  GreaterThan = 'greaterThan',
  LessThan = 'lessThan',
  IsNotEmpty = 'isNotEmpty',
  IsEmpty = 'isEmpty',
  In = 'in',
}

/** Filing status options for Form 1040 */
export enum FilingStatus {
  Single = 'single',
  MarriedFilingJointly = 'marriedFilingJointly',
  MarriedFilingSeparately = 'marriedFilingSeparately',
  HeadOfHousehold = 'headOfHousehold',
  QualifyingSurvivingSpouse = 'qualifyingSurvivingSpouse',
}

// =============================================================================
// Core Annotation Types
// =============================================================================

/**
 * Root type for a tax form annotation file.
 * A complete annotation defines every field on every page of a tax form,
 * including positioning, formatting, and data binding.
 */
export interface FormAnnotation {
  /** Optional JSON Schema reference for editor support */
  $schema?: string;
  /** Metadata about the form and this annotation version */
  metadata: FormMetadata;
  /** Ordered list of pages, each containing field annotations */
  pages: Page[];
  /** Optional logical groupings of fields */
  fieldGroups?: FieldGroup[];
}

/**
 * Metadata identifying the form and the annotation version.
 */
export interface FormMetadata {
  /** Unique identifier for this annotation (e.g., 'irs-1040-2024-v1') */
  formId: string;
  /** Official IRS form number (e.g., '1040', 'W-2', 'Schedule C') */
  formNumber: string;
  /** Human-readable form title */
  title: string;
  /** Tax year this annotation applies to */
  taxYear: number;
  /** IRS form revision identifier (e.g., 'Rev. January 2024') */
  revision?: string;
  /** Semantic version of this annotation file (e.g., '1.0.0') */
  version: string;
  /** Optional description */
  description?: string;
  /** Standard page size name */
  pageSize?: PageSize;
  /** Coordinate system configuration */
  coordinateSystem?: CoordinateSystem;
}

/**
 * Defines the coordinate system used for all position values.
 * Defaults to standard PDF coordinates: bottom-left origin, points.
 */
export interface CoordinateSystem {
  /** Origin location — 'bottom-left' is PDF standard */
  origin?: CoordinateOrigin;
  /** Unit of measurement — 'points' is PDF standard (72 pts/inch) */
  units?: CoordinateUnits;
  /** Points per inch (standard PDF = 72) */
  pointsPerInch?: number;
}

/**
 * A single page of the form containing field annotations.
 */
export interface Page {
  /** 1-based page number */
  pageNumber: number;
  /** Page dimensions in coordinate units */
  dimensions: Dimensions;
  /** Optional path/URL to form template image for this page */
  templateImage?: string;
  /** All annotated fields on this page */
  fields: Field[];
}

/** Page dimensions in coordinate units. US Letter = 612×792 points. */
export interface Dimensions {
  /** Page width */
  width: number;
  /** Page height */
  height: number;
}

// =============================================================================
// Field Definition
// =============================================================================

/**
 * Annotation for a single field/box on the tax form.
 *
 * This is the core type — it defines where a field is, what type of data it holds,
 * how to format the value, and where to resolve the value from taxpayer data.
 */
export interface Field {
  /** Unique hierarchical identifier (e.g., 'f1040.page1.line1a') */
  id: string;
  /** Human-readable field label */
  label?: string;
  /** Official IRS line number (e.g., '1a', '7', 'Box 1') */
  irsLine?: string;
  /** Semantic field type — determines default formatting */
  type: FieldType;
  /** Position and dimensions on the page */
  position: Position;
  /** Formatting overrides (type-specific defaults apply if omitted) */
  formatting?: Formatting;
  /** JSONPath expression to resolve value from taxpayer data */
  dataRef?: string;
  /** Computation formula for derived/calculated fields */
  computation?: Computation;
  /** Validation rules */
  validation?: Validation;
  /** Overflow handling configuration */
  overflow?: OverflowConfig;
  /** Whether this field is computed/system-generated */
  readOnly?: boolean;
  /** Conditional visibility rules */
  conditionalVisibility?: ConditionalVisibility;
  /** Available options for enum-type fields */
  options?: EnumOption[];
  /** Number of character boxes for comb-type fields */
  combDigits?: number;
  /** Logical section name (e.g., 'Income', 'Deductions') */
  section?: string;
}

// =============================================================================
// Positioning
// =============================================================================

/**
 * Position and dimensions of a field on the page.
 *
 * Coordinates are in the annotation's coordinate system (default: PDF points,
 * origin at bottom-left corner). x,y represents the bottom-left corner of the
 * field box in bottom-left origin mode.
 *
 * US Letter page: 612pt wide × 792pt tall
 * 1 point = 1/72 inch
 *
 * @example
 * // A field 1 inch from the left, 2 inches from the bottom, 3 inches wide, 0.25 inches tall
 * { x: 72, y: 144, width: 216, height: 18 }
 */
export interface Position {
  /** Horizontal distance from the left edge of the page */
  x: number;
  /** Vertical distance from the origin */
  y: number;
  /** Width of the field box */
  width: number;
  /** Height of the field box */
  height: number;
}

// =============================================================================
// Formatting
// =============================================================================

/**
 * Controls how a field value is rendered within its box.
 * All properties are optional — sensible defaults are applied based on field type.
 */
export interface Formatting {
  /** Font family (default: Courier per IRS Pub 1167) */
  fontFamily?: FontFamily;
  /** Font size in points (default: 10, IRS minimum: 8) */
  fontSize?: number;
  /** Font weight */
  fontWeight?: 'normal' | 'bold';
  /** Horizontal alignment (default: left for text, right for currency/integer) */
  alignment?: TextAlignment;
  /** Vertical alignment (default: bottom) */
  verticalAlignment?: VerticalAlignment;
  /** Text color as hex (default: '#000000') */
  color?: string;
  /** Background fill color as hex */
  backgroundColor?: string;
  /** Internal padding between field edges and text */
  padding?: Padding;
  /** Additional character spacing in points */
  letterSpacing?: number;
  /** Line height for multi-line fields */
  lineHeight?: number;
  /** Text case transformation */
  textTransform?: TextTransform;
  /** Number formatting rules (for currency, integer, percentage types) */
  numberFormat?: NumberFormat;
  /** Date format pattern (for date type fields) */
  dateFormat?: string;
  /** Checkbox rendering style */
  checkboxStyle?: CheckboxStyle;
}

/** Internal padding between field box edges and rendered text, in points */
export interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

/** Formatting rules for numeric field types */
export interface NumberFormat {
  /** Number of decimal places (0 = whole dollars, 2 = dollars+cents) */
  decimals?: number;
  /** Whether to show comma separators (e.g., '1,234,567') */
  thousandsSeparator?: boolean;
  /** Text prefix (e.g., '$') */
  prefix?: string;
  /** Text suffix (e.g., '%') */
  suffix?: string;
  /** How to render negative numbers (IRS typically uses parentheses) */
  negativeStyle?: NegativeStyle;
}

// =============================================================================
// Data Binding & Computation
// =============================================================================

/**
 * Formula definition for computed/derived fields.
 *
 * The formula uses field IDs prefixed with $ as variables.
 * @example
 * {
 *   formula: "$f1040.page1.line9 - $f1040.page1.line14",
 *   dependencies: ["f1040.page1.line9", "f1040.page1.line14"]
 * }
 */
export interface Computation {
  /** Arithmetic expression using $fieldId references */
  formula: string;
  /** Field IDs this computation depends on (for evaluation ordering) */
  dependencies: string[];
}

// =============================================================================
// Validation
// =============================================================================

/** Validation rules to enforce on field values */
export interface Validation {
  /** Whether this field must have a non-empty value */
  required?: boolean;
  /** Minimum character length */
  minLength?: number;
  /** Maximum character length */
  maxLength?: number;
  /** Minimum numeric value */
  min?: number;
  /** Maximum numeric value */
  max?: number;
  /** Regular expression pattern */
  pattern?: string;
  /** Exhaustive list of allowed values */
  allowedValues?: (string | number | boolean)[];
}

// =============================================================================
// Overflow Handling
// =============================================================================

/** Controls behavior when the rendered value exceeds the field box */
export interface OverflowConfig {
  /** Overflow handling strategy */
  strategy?: OverflowStrategy;
  /** Field ID to continue into (for 'continue' strategy) */
  continuationFieldId?: string;
  /** Minimum font size before falling back to truncation (for 'scale' strategy) */
  minFontSize?: number;
}

// =============================================================================
// Conditional Visibility
// =============================================================================

/**
 * Makes a field visible only when a condition is met.
 * @example
 * // Show spouse SSN only when filing jointly
 * {
 *   dependsOn: "f1040.page1.filingStatus",
 *   condition: "equals",
 *   value: "marriedFilingJointly"
 * }
 */
export interface ConditionalVisibility {
  /** Field ID or JSONPath dataRef to evaluate */
  dependsOn: string;
  /** Comparison operator */
  condition: VisibilityCondition;
  /** Value to compare against (not needed for isEmpty/isNotEmpty) */
  value?: string | number | boolean | string[];
}

// =============================================================================
// Enum Options
// =============================================================================

/**
 * An option for enum-type fields (e.g., individual radio buttons).
 * Each option can have its own position on the form.
 */
export interface EnumOption {
  /** Data value that selects this option */
  value: string;
  /** Human-readable label */
  label: string;
  /** Position of this option's checkbox/radio on the form */
  position?: Position;
}

// =============================================================================
// Field Groups
// =============================================================================

/** Logical grouping of related fields */
export interface FieldGroup {
  /** Unique group identifier */
  id: string;
  /** Human-readable group name */
  label: string;
  /** Optional description */
  description?: string;
  /** Ordered list of field IDs in this group */
  fieldIds: string[];
}

// =============================================================================
// Taxpayer Data Types (for JSONPath dataRef resolution)
// =============================================================================

/** Root taxpayer data structure that dataRef JSONPath expressions resolve against */
export interface TaxpayerData {
  taxpayer: TaxpayerInfo;
  income: IncomeData;
  adjustments?: AdjustmentsData;
  schedules?: SchedulesData;
  deductions?: DeductionsData;
  credits?: CreditsData;
  payments?: PaymentsData;
  refundOrOwed?: RefundOrOwedData;
}

export interface TaxpayerInfo {
  primary: PersonInfo;
  spouse?: PersonInfo;
  address: AddressInfo;
  filingStatus: FilingStatus;
  dependents?: DependentInfo[];
  digitalAssets?: boolean;
  presidentialElectionFund?: boolean;
}

export interface PersonInfo {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  ssn: string;
  dateOfBirth?: string;
  occupation?: string;
}

export interface AddressInfo {
  street: string;
  apt?: string;
  city: string;
  state: string;
  zipCode: string;
  foreignCountry?: string;
  foreignProvince?: string;
  foreignPostalCode?: string;
}

export interface DependentInfo {
  firstName: string;
  lastName: string;
  ssn: string;
  relationship: string;
  childTaxCredit?: boolean;
  otherDependentCredit?: boolean;
}

export interface W2Data {
  employerName: string;
  employerEin: string;
  employerAddress?: AddressInfo;
  controlNumber?: string;
  amount: number;
  federalWithheld: number;
  socialSecurityWages?: number;
  socialSecurityWithheld?: number;
  medicareWages?: number;
  medicareWithheld?: number;
  socialSecurityTips?: number;
  allocatedTips?: number;
  dependentCareBenefits?: number;
  nonqualifiedPlans?: number;
  box12?: Array<{ code: string; amount: number }>;
  statutoryEmployee?: boolean;
  retirementPlan?: boolean;
  thirdPartySickPay?: boolean;
  stateWages?: Array<{
    state: string;
    stateId?: string;
    stateWages: number;
    stateWithheld: number;
  }>;
}

export interface IncomeData {
  wages?: W2Data[];
  totalWages?: number;
  householdEmployeeWages?: number;
  tipIncome?: number;
  medicaidWaiver?: number;
  dependentCareBenefits?: number;
  adoptionBenefits?: number;
  form8919Wages?: number;
  strikeDisasterBenefits?: number;
  totalWagesAll?: number;
  taxExemptInterest?: number;
  taxableInterest?: number;
  qualifiedDividends?: number;
  ordinaryDividends?: number;
  iraDistributions?: number;
  taxableIraDistributions?: number;
  pensionsAnnuities?: number;
  taxablePensionsAnnuities?: number;
  socialSecurity?: number;
  taxableSocialSecurity?: number;
  capitalGainOrLoss?: number;
  otherIncome?: number;
  totalIncome?: number;
}

export interface AdjustmentsData {
  totalAdjustments?: number;
  adjustedGrossIncome?: number;
}

export interface SchedulesData {
  scheduleC?: ScheduleCData[];
}

export interface ScheduleCData {
  businessName: string;
  proprietorName?: string;
  businessEin?: string;
  businessAddress?: AddressInfo;
  principalBusinessCode?: string;
  principalBusinessDescription?: string;
  accountingMethod?: 'cash' | 'accrual' | 'other';
  materiallyParticipated?: boolean;
  startedInCurrentYear?: boolean;
  paymentsRequiring1099?: boolean;
  filed1099s?: boolean;
  grossReceipts: number;
  returns?: number;
  costOfGoodsSold?: number;
  grossIncome?: number;
  otherIncome?: number;
  grossIncomeTotal?: number;
  expenses?: ScheduleCExpenses;
  totalExpenses?: number;
  tentativeProfit?: number;
  homeBusinessExpense?: number;
  netProfit?: number;
}

export interface ScheduleCExpenses {
  advertising?: number;
  carAndTruck?: number;
  commissions?: number;
  contractLabor?: number;
  depletion?: number;
  depreciation?: number;
  employeeBenefits?: number;
  insurance?: number;
  interestMortgage?: number;
  interestOther?: number;
  legalAndProfessional?: number;
  officeExpense?: number;
  pensionAndProfitSharing?: number;
  rentVehicles?: number;
  rentOther?: number;
  repairs?: number;
  supplies?: number;
  taxesAndLicenses?: number;
  travel?: number;
  meals?: number;
  utilities?: number;
  wages?: number;
  otherExpenses?: number;
  otherExpensesList?: Array<{ description: string; amount: number }>;
}

export interface DeductionsData {
  type?: 'standard' | 'itemized';
  standardAmount?: number;
  itemized?: ItemizedDeductions;
  qualifiedBusinessIncome?: number;
  totalDeductions?: number;
  taxableIncome?: number;
}

export interface ItemizedDeductions {
  medicalExpenses?: number;
  stateAndLocalTaxes?: number;
  mortgageInterest?: number;
  charitableContributions?: number;
  casualtyLosses?: number;
  otherItemizedDeductions?: number;
  total?: number;
}

export interface CreditsData {
  childTaxCredit?: number;
  otherCredits?: number;
  totalCredits?: number;
}

export interface PaymentsData {
  federalWithheld?: number;
  estimatedPayments?: Array<{
    quarter: number;
    date?: string;
    amount: number;
  }>;
  totalEstimatedPayments?: number;
  earnedIncomeCredit?: number;
  additionalChildTaxCredit?: number;
  americanOpportunityCredit?: number;
  otherPayments?: number;
  totalPayments?: number;
}

export interface RefundOrOwedData {
  overpayment?: number;
  refundAmount?: number;
  routingNumber?: string;
  accountType?: 'checking' | 'savings';
  accountNumber?: string;
  appliedToNextYear?: number;
  amountOwed?: number;
  estimatedPenalty?: number;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Page dimension constants for common page sizes (in points).
 */
export const PAGE_DIMENSIONS = {
  letter: { width: 612, height: 792 } as Dimensions,
  legal: { width: 612, height: 1008 } as Dimensions,
  a4: { width: 595.28, height: 841.89 } as Dimensions,
} as const;

/**
 * Default formatting per field type.
 * Implementations should merge these defaults with field-specific formatting.
 */
export const DEFAULT_FORMATTING: Record<FieldType, Partial<Formatting>> = {
  [FieldType.Text]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Left,
    verticalAlignment: VerticalAlignment.Bottom,
  },
  [FieldType.Currency]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Right,
    verticalAlignment: VerticalAlignment.Bottom,
    numberFormat: { decimals: 0, thousandsSeparator: true, negativeStyle: NegativeStyle.Parentheses },
  },
  [FieldType.Checkbox]: {
    fontFamily: FontFamily.Helvetica,
    fontSize: 10,
    alignment: TextAlignment.Center,
    verticalAlignment: VerticalAlignment.Middle,
    checkboxStyle: CheckboxStyle.X,
  },
  [FieldType.SSN]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Left,
    letterSpacing: 2,
  },
  [FieldType.EIN]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Left,
    letterSpacing: 2,
  },
  [FieldType.Date]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Left,
    dateFormat: 'MM/DD/YYYY',
  },
  [FieldType.Percentage]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Right,
    numberFormat: { decimals: 1, suffix: '%' },
  },
  [FieldType.Integer]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Right,
    numberFormat: { decimals: 0, thousandsSeparator: true },
  },
  [FieldType.Enum]: {
    fontFamily: FontFamily.Helvetica,
    fontSize: 10,
    alignment: TextAlignment.Center,
    checkboxStyle: CheckboxStyle.X,
  },
  [FieldType.Comb]: {
    fontFamily: FontFamily.Courier,
    fontSize: 10,
    alignment: TextAlignment.Center,
    verticalAlignment: VerticalAlignment.Middle,
    letterSpacing: 0,
  },
};

/**
 * Indian Financial Year utilities for GST-compliant invoice numbering.
 *
 * Indian FY runs April 1 → March 31 in IST (UTC+05:30).
 * Invoice format: TRD/YY-YY/NNNNNN  (exactly 16 chars, GST Rule 46(b))
 * Example: TRD/26-27/000001
 */

/**
 * Comprehensive mapping of Indian state names / codes / GSTINs to 2-digit state codes.
 */
export const INDIAN_STATE_GST_CODES: Record<string, string> = {
  // Delhi variants
  delhi: '07',
  newdelhi: '07',
  'new delhi': '07',
  nctofdelhi: '07',
  'nct of delhi': '07',
  delhincr: '07',
  // Numbered codes (pass-through normalisation)
  '01': '01', '02': '02', '03': '03', '04': '04', '05': '05',
  '06': '06', '07': '07', '08': '08', '09': '09', '10': '10',
  '11': '11', '12': '12', '13': '13', '14': '14', '15': '15',
  '16': '16', '17': '17', '18': '18', '19': '19', '20': '20',
  '21': '21', '22': '22', '23': '23', '24': '24', '25': '25',
  '26': '26', '27': '27', '28': '28', '29': '29', '30': '30',
  '31': '31', '32': '32', '33': '33', '34': '34', '35': '35',
  '36': '36', '37': '37', '38': '38',
  // States by normalised name (lowercase, no spaces/punctuation)
  jammuandkashmir: '01', 'jammu and kashmir': '01', 'j&k': '01',
  himachalpradesh: '02', 'himachal pradesh': '02',
  punjab: '03',
  chandigarh: '04',
  uttarakhand: '05', uttaranchal: '05',
  haryana: '06',
  rajasthan: '08',
  uttarpradesh: '09', 'uttar pradesh': '09', up: '09',
  bihar: '10',
  sikkim: '11',
  arunachalpradesh: '12', 'arunachal pradesh': '12',
  nagaland: '13',
  manipur: '14',
  mizoram: '15',
  tripura: '16',
  meghalaya: '17',
  assam: '18',
  westbengal: '19', 'west bengal': '19',
  jharkhand: '20',
  odisha: '21', orissa: '21',
  chhattisgarh: '22',
  madhyapradesh: '23', 'madhya pradesh': '23', mp: '23',
  gujarat: '24',
  // 25 Daman & Diu (old)
  dadraandnagarhavelianddamandiu: '26', 'dadra and nagar haveli and daman and diu': '26',
  maharashtra: '27',
  andhra: '28', andhrapradesh: '37', 'andhra pradesh': '37',
  karnataka: '29',
  goa: '30',
  lakshadweep: '31',
  kerala: '32',
  tamilnadu: '33', 'tamil nadu': '33', tamilnadhu: '33',
  puducherry: '34', pondicherry: '34', 'pondichery': '34',
  andamanandnicobarislands: '35', 'andaman and nicobar islands': '35', 'andaman': '35',
  telangana: '36',
  ladakh: '38',
};

export interface IndianFinancialYear {
  /** Calendar year when the FY starts (e.g. 2026 for FY 26-27) */
  startYear: number;
  /** Calendar year when the FY ends (e.g. 2027 for FY 26-27) */
  endYear: number;
  /** 2-digit label used in invoice numbers, e.g. "26-27" */
  fyLabel: string;
}

/**
 * Returns the Indian Financial Year for a given date (defaults to now).
 * All computation is performed in IST (Asia/Kolkata, UTC+05:30).
 */
export function getIndianFinancialYear(date: Date = new Date()): IndianFinancialYear {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = parseInt(partMap.year, 10);
  const month = parseInt(partMap.month, 10); // 1 = January, 4 = April

  // FY starts on April 1.  If month >= 4 we are in startYear/endYear; else startYear = year-1.
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  const startYY = String(startYear).slice(-2);
  const endYY = String(endYear).slice(-2);
  const fyLabel = `${startYY}-${endYY}`;

  return { startYear, endYear, fyLabel };
}

/**
 * Formats a GST-compliant invoice number.
 * Format: TRD/YY-YY/NNNNNN  (e.g. TRD/26-27/000001 = 16 chars)
 *
 * @param prefix   - 'TRD'
 * @param fyLabel  - '26-27'
 * @param sequence - atomic sequence number from InvoiceSequence table
 */
export function formatInvoiceNumber(prefix: string, fyLabel: string, sequence: number): string {
  const padded = String(sequence).padStart(6, '0');
  return `${prefix}/${fyLabel}/${padded}`;
}

/**
 * Normalises a raw buyer state value to a 2-digit Indian GST state code.
 *
 * Accepts:
 *  - Full state names (e.g. "Delhi", "Maharashtra")
 *  - 2-digit state codes (e.g. "07")
 *  - 15-char GSTINs (extracts first 2 digits)
 *
 * Returns null when the value cannot be resolved (fail-closed → treat as inter-state).
 */
export function normalizeIndianStateCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const cleaned = input.trim();
  if (!cleaned) return null;

  // GSTIN format: 2 digits + 10 alphanum + 1 + 1 + Z + 1 (15 chars)
  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(cleaned)) {
    return cleaned.slice(0, 2);
  }

  // Plain 2-digit code
  if (/^[0-9]{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Single digit (rare edge case)
  if (/^[0-9]$/.test(cleaned)) {
    return cleaned.padStart(2, '0');
  }

  // Full name lookup
  const key = cleaned.toLowerCase();
  if (INDIAN_STATE_GST_CODES[key]) return INDIAN_STATE_GST_CODES[key];

  // Try stripped (remove spaces, punctuation)
  const stripped = key.replace(/[^a-z0-9]/g, '');
  return INDIAN_STATE_GST_CODES[stripped] ?? null;
}

/**
 * Determines whether a transaction is intra-state (Delhi→Delhi = CGST + SGST)
 * or inter-state (IGST).
 *
 * @param buyerStateOrGstin - buyer's state name, state code, or GSTIN
 * @param sellerStateCode   - seller's state code (default '07' = Delhi)
 * @returns true if intra-state (both parties in Delhi / same state)
 */
export function isDelhiIntraState(
  buyerStateOrGstin: string | null | undefined,
  sellerStateCode = '07',
): boolean {
  const buyerCode = normalizeIndianStateCode(buyerStateOrGstin);
  if (!buyerCode) return false; // fail-closed → inter-state
  return buyerCode === sellerStateCode;
}

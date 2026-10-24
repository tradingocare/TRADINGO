// Password policy helpers mirroring the backend class-validator contracts.
// Keep the regexes byte-identical to the API DTOs so the frontend rejects
// exactly what the backend rejects (E2E-04 contract alignment).
//   - signup /register           → RegisterDto        (any non-alphanumeric special)
//   - vendor & buyer wizards     → CreateVendorDto / CreateBuyerDto (explicit whitelist)
// Both require: min 8 chars + uppercase + lowercase + number + special character.

const UPPERCASE = /[A-Z]/
const LOWERCASE = /[a-z]/
const DIGIT = /\d/
// Non-alphanumeric special char (RegisterDto / ChangePasswordDto class).
const SPECIAL_ANY = /[^a-zA-Z\d]/
// Explicit special-char whitelist (CreateVendorDto / CreateBuyerDto class).
const SPECIAL_WHITELIST = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/

export interface PasswordCheck {
  valid: boolean
  missing: string[]
}

function check(pw: string, specialRe: RegExp): PasswordCheck {
  const missing: string[] = []
  if (pw.length < 8) missing.push('at least 8 characters')
  if (!UPPERCASE.test(pw)) missing.push('an uppercase letter')
  if (!LOWERCASE.test(pw)) missing.push('a lowercase letter')
  if (!DIGIT.test(pw)) missing.push('a number')
  if (!specialRe.test(pw)) missing.push('a special character')
  return { valid: missing.length === 0, missing }
}

/** Exact rule for POST /auth/register (RegisterDto). */
export function validateSignupPassword(pw: string): PasswordCheck {
  return check(pw, SPECIAL_ANY)
}

/** Exact rule for POST /auth/register/vendor & /auth/register/buyer (Create*Dto). */
export function validateRegistrationPassword(pw: string): PasswordCheck {
  return check(pw, SPECIAL_WHITELIST)
}

/** Human-readable message matching the backend error style. */
export function passwordErrorMessage(missing: string[]): string {
  return `Password must contain ${missing.join(', ')}`
}

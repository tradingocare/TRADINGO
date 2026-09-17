import { EXISTING_EMAIL_SIGNIN_URL, isEmailAlreadyRegisteredError } from '../registration-errors';

describe('isEmailAlreadyRegisteredError', () => {
  it('detects a 409 "Email already registered" response', () => {
    expect(
      isEmailAlreadyRegisteredError({
        response: { status: 409, data: { message: 'Email already registered' } },
      }),
    ).toBe(true);
  });

  it('rejects other 409 messages (e.g. PAN conflict)', () => {
    expect(
      isEmailAlreadyRegisteredError({
        response: { status: 409, data: { message: 'PAN number already registered' } },
      }),
    ).toBe(false);
  });

  it('rejects the message under a different status', () => {
    expect(
      isEmailAlreadyRegisteredError({
        response: { status: 401, data: { message: 'Email already registered' } },
      }),
    ).toBe(false);
  });

  it('rejects non-axios payloads', () => {
    expect(isEmailAlreadyRegisteredError(null)).toBe(false);
    expect(isEmailAlreadyRegisteredError(undefined)).toBe(false);
    expect(isEmailAlreadyRegisteredError(new Error('boom'))).toBe(false);
    expect(isEmailAlreadyRegisteredError('Email already registered')).toBe(false);
  });
});

describe('EXISTING_EMAIL_SIGNIN_URL', () => {
  it('points to login with the seller-onboarding next target', () => {
    expect(EXISTING_EMAIL_SIGNIN_URL).toBe('/login?next=/seller/onboarding');
  });
});
/** Maps API auth error codes to dictionary keys. */
export function authErrorKey(code: string): string {
  switch (code) {
    case "invalid_credentials":
      return "auth.error.invalid";
    case "email_exists":
      return "auth.error.exists";
    case "password_too_short":
      return "auth.error.passwordShort";
    case "referral_invalid":
      return "auth.error.referralInvalid";
    default:
      return "auth.error.generic";
  }
}

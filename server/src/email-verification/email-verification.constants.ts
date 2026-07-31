export const EMAIL_CONFIRMATION = {
  FEATURE_FLAG: 'auth.email_confirmation',
  SUBJECT: 'Email Confirmation - AgroSense',
  TEMPLATES: {
    VERIFICATION: 'verification',
    CONFIRMATION: 'confirmation',
  },
  EXPIRY: {
    TOKEN: 'JWT_VERIFICATION_TOKEN_EXPIRATION_TIME',
    DEFAULT: 3600, // 1 hour
  },
};
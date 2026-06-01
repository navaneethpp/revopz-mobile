/**
 * src/utils/passwordValidator.ts
 *
 * Password strength validator for new passwords.
 * Checks length, uppercase, lowercase, numbers, and special characters.
 */

export interface PasswordRequirements {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
}

/**
 * Evaluates a password against complexity rules.
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
    return {
        hasMinLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
}

/**
 * Returns true if all password requirements are satisfied.
 */
export function isPasswordValid(reqs: PasswordRequirements): boolean {
    return (
        reqs.hasMinLength &&
        reqs.hasUppercase &&
        reqs.hasLowercase &&
        reqs.hasNumber &&
        reqs.hasSpecialChar
    );
}

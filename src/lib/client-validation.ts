export type ValidationResult = { valid: true } | { valid: false; error: string };

export interface ClientValidationConfig {
    passwordMinLength?: number;
    passwordMaxLength?: number;
    usernameMinLength?: number;
    usernameMaxLength?: number;
    forbiddenChars?: RegExp;
    emailPattern?: RegExp;
}

export const DEFAULT_CONFIG: Required<ClientValidationConfig> = {
    passwordMinLength: 8,
    passwordMaxLength: 128,
    usernameMinLength: 3,
    usernameMaxLength: 50,
    forbiddenChars: /[<>"'`;={}()\[\]$\\]/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export function hasForbiddenChars(input: string, cfg: ClientValidationConfig = {}): boolean {
    if (typeof input !== 'string' || input.length === 0) return false;
    const re = cfg.forbiddenChars ?? DEFAULT_CONFIG.forbiddenChars;
    return re.test(input);
}

export function escapeHtml(text?: string | null): string {
    if (!text || typeof text !== 'string') return '';
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
    };
    return text.replace(/[&<>"'`/]/g, (ch) => map[ch] ?? ch);
}

export function validatePassword(password: unknown, cfg: ClientValidationConfig = {}): ValidationResult {
    const c = { ...DEFAULT_CONFIG, ...cfg };
    if (typeof password !== 'string') return { valid: false, error: 'Password is required' };

    const len = password.length;
    if (len < c.passwordMinLength) return { valid: false, error: `Password must be at least ${c.passwordMinLength} characters long` };
    if (len > c.passwordMaxLength) return { valid: false, error: `Password must be less than ${c.passwordMaxLength} characters` };

    const passwordForbidden = /[<>"'`;={}\[\]\\]/;
    if (passwordForbidden.test(password)) return { valid: false, error: 'Password contains invalid characters' };

    const PASSWORD_REGEX = /^[A-Za-z0-9@#\-_!$%^&*()+=]+$/;
    if (!PASSWORD_REGEX.test(password)) {
        return { valid: false, error: 'Password contains invalid characters (allowed: letters, numbers, @#-_!$%^&*()+=)' };
    }

    return { valid: true };
}

export function validateEmail(email: unknown, cfg: ClientValidationConfig = {}): ValidationResult {
    const c = { ...DEFAULT_CONFIG, ...cfg };
    if (typeof email !== 'string' || email.trim().length === 0) return { valid: false, error: 'Email is required' };
    if (hasForbiddenChars(email, c)) return { valid: false, error: 'Email contains invalid characters' };
    if (!c.emailPattern.test(email.trim().toLowerCase())) return { valid: false, error: 'Invalid email format' };
    return { valid: true };
}

export function validateUsername(username: unknown, cfg: ClientValidationConfig = {}): ValidationResult {
    const c = { ...DEFAULT_CONFIG, ...cfg };
    if (typeof username !== 'string' || username.trim().length === 0) return { valid: false, error: 'Username is required' };
    const trimmed = username.trim();
    if (hasForbiddenChars(trimmed, c)) return { valid: false, error: 'Username contains invalid characters' };
    if (trimmed.length < c.usernameMinLength || trimmed.length > c.usernameMaxLength) {
        return { valid: false, error: `Username must be ${c.usernameMinLength}-${c.usernameMaxLength} characters` };
    }
    const USERNAME_REGEX = /^[a-zA-Z0-9_\-\u0600-\u06FF]+$/;
    if (!USERNAME_REGEX.test(trimmed)) {
        return { valid: false, error: 'Username may contain letters, numbers, underscores, hyphens, or Arabic characters' };
    }
    return { valid: true };
}

export function sanitizeInput(input: string, cfg: ClientValidationConfig = {}): string {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/\s{2,}/g, ' ');
}

export default {
    validatePassword,
    validateEmail,
    validateUsername,
    hasForbiddenChars,
    escapeHtml,
    sanitizeInput,
};

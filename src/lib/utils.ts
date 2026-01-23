import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* -------------------------------------------------
   Tailwind Class Combiner
-------------------------------------------------- */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/* -------------------------------------------------
   Price Formatters
-------------------------------------------------- */
export function formatPrice(
    price: number | null | undefined,
    locale: string = 'ar-EG',
    language: string = 'ar'
): string {
    // Handle invalid values (NaN, null, undefined)
    if (price === null || price === undefined || isNaN(Number(price))) {
        const formatted = '0';
        if (language === 'ar') {
            return `ج.م ${formatted}`;
        } else {
            return `EGP ${formatted}`;
        }
    }

    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    const formatted = formatter.format(Number(price));

    if (language === 'ar') {
        return `ج.م ${formatted}`;
    } else {
        return `EGP ${formatted}`;
    }
}

export const formatPriceWithLanguage = formatPrice;

/* -------------------------------------------------
   Discount Calculator
-------------------------------------------------- */
export function calculateDiscountedPrice(price: number, discountPercent: number): number {
    const discountAmount = (price * discountPercent) / 100;
    return Math.max(0, price - discountAmount);
}

/* -------------------------------------------------
   Debounce & Throttle
-------------------------------------------------- */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number) {
    let inThrottle = false;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

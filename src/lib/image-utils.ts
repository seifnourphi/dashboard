/**
 * Image utility functions for handling both Base64 and URL-based images
 */

export interface ImageData {
    data?: string;
    contentType?: string;
    url?: string;
    alt?: string;
    altAr?: string;
}

export const getImageSrc = (
    image: ImageData | string | null | undefined,
    fallback: string = '/uploads/good.png'
): string => {
    if (!image) return fallback;

    if (typeof image === 'string') {
        let trimmed = image.trim().replace(/\\/g, '/'); // Normalize slashes
        if (!trimmed) return fallback;

        // If it starts with uploads/ (without /), add the leading /
        if (trimmed.startsWith('uploads/')) {
            trimmed = `/${trimmed}`;
        }

        // If it's a full URL or data URL or starts with /, return as is
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
            return trimmed;
        }

        // Otherwise return as is (might be a relative path or other format)
        return trimmed;
    }

    if (typeof image !== 'object' || Array.isArray(image)) {
        return fallback;
    }

    if (image.data && image.contentType) {
        if (typeof image.data === 'string' && typeof image.contentType === 'string') {
            return `data:${image.contentType};base64,${image.data}`;
        }
    }

    if (image.url && typeof image.url === 'string') {
        return getImageSrc(image.url, fallback); // Recursively process the URL
    }

    return fallback;
};

export const getFirstImageSrc = (
    images: (ImageData | string)[] | null | undefined,
    fallback: string = '/uploads/good.png'
): string => {
    if (!images || images.length === 0) return fallback;
    return getImageSrc(images[0], fallback);
};

export const getImageAtIndex = (
    images: (ImageData | string)[] | null | undefined,
    index: number,
    fallback: string = '/uploads/good.png'
): string => {
    if (!images || images.length <= index) return fallback;
    return getImageSrc(images[index], fallback);
};

export const fileToBase64 = (file: File): Promise<{ data: string; contentType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({
                data: base64,
                contentType: file.type
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const getImageAlt = (
    image: ImageData | string | null | undefined,
    lang: 'en' | 'ar' = 'en',
    fallback: string = ''
): string => {
    if (!image || typeof image === 'string') return fallback;

    if (lang === 'ar' && image.altAr) return image.altAr;
    if (image.alt) return image.alt;

    return fallback;
};

export const isBase64Image = (image: ImageData | string | null | undefined): boolean => {
    if (!image || typeof image === 'string') return false;
    return !!(image.data && image.contentType);
};

export const isUrlImage = (image: ImageData | string | null | undefined): boolean => {
    if (!image) return false;
    if (typeof image === 'string') return true;
    return !!image.url;
};

export const getDefaultImage = (productName?: string): string => {
    return '/uploads/good.png';
};

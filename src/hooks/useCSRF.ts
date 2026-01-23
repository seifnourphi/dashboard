/**
 * React Hook for CSRF Token
 */

'use client';

import { useState, useEffect } from 'react';
import { getCSRFToken } from '@/lib/csrf-client';

export function useCSRF(): {
    csrfToken: string | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
} {
    const [csrfToken, setCsrfToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        getCSRFToken()
            .then((token) => {
                setCsrfToken(token);
                setLoading(false);
            })
            .catch((err) => {
                setError(err instanceof Error ? err : new Error(String(err)));
                setLoading(false);
            });
    }, []);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const { refreshCSRFToken } = await import('@/lib/csrf-client');
            const token = await refreshCSRFToken();
            setCsrfToken(token);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setLoading(false);
        }
    };

    return { csrfToken, loading, error, refresh };
}

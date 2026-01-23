/**
 * Hardened Client-side CSRF Token Manager
 */

let csrfTokenCache: string | null = null;
let tokenExpiry: number | null = null;
let tokenFetchPromise: Promise<string> | null = null;

const TOKEN_TTL = 1000 * 60 * 10; // 10 minutes
const CSRF_ENDPOINT = "/api/csrf-token";

function isTokenValid(): boolean {
    if (!csrfTokenCache || !tokenExpiry) return false;
    return Date.now() < tokenExpiry;
}

async function fetchCSRFToken(): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
        const res = await fetch(CSRF_ENDPOINT, {
            method: "GET",
            credentials: "include",
            signal: controller.signal
        });

        if (!res.ok) throw new Error("Failed to fetch CSRF token");

        const data = await res.json();
        if (!data?.csrfToken) throw new Error("Unable to verify your session. Please refresh the page.");

        csrfTokenCache = data.csrfToken;
        tokenExpiry = Date.now() + TOKEN_TTL;

        return csrfTokenCache!;
    } finally {
        clearTimeout(timeout);
    }
}

export async function getCSRFToken(): Promise<string> {
    if (isTokenValid()) return csrfTokenCache!;

    if (tokenFetchPromise) return tokenFetchPromise;

    tokenFetchPromise = fetchCSRFToken()
        .catch((error) => {
            tokenFetchPromise = null;
            csrfTokenCache = null;
            tokenExpiry = null;
            throw error;
        })
        .finally(() => {
            tokenFetchPromise = null;
        });

    return tokenFetchPromise;
}

export async function refreshCSRFToken(): Promise<string> {
    csrfTokenCache = null;
    tokenExpiry = null;
    tokenFetchPromise = null;
    return getCSRFToken();
}

export function clearCSRFToken(): void {
    csrfTokenCache = null;
    tokenExpiry = null;
    tokenFetchPromise = null;
}

import { useState, useEffect } from "react";

export function useCSRFToken(): string | null {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        getCSRFToken()
            .then((t) => mounted && setToken(t))
            .catch((err) => {
                console.error("Error loading CSRF token:", err);
            });

        return () => {
            mounted = false;
        };
    }, []);

    return token;
}

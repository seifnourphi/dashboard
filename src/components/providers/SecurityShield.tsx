'use client';

import React, { useEffect } from 'react';

/**
 * SecurityShield Component
 * Implements frontend-level security by blocking dangerous characters 
 * directly at the input level to prevent XSS and injection attempts.
 */
export const SecurityShield = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        // List of characters often used in XSS or injection scripts
        // Blocking these prevents users from even typing them in inputs
        const blockedChars = ['<', '>', '\\', '{', '}', '[', ']'];

        // Patterns that are definitely dangerous
        const dangerousPatterns = [
            /script/i,
            /onerror/i,
            /onload/i,
            /javascript:/i,
            /eval\(/i,
            /alert\(/i
        ];

        const handleKeyDown = (e: KeyboardEvent) => {
            // Allow these if Ctrl/Cmd is pressed (for copy/paste, though we'll handle paste separately)
            if (e.ctrlKey || e.metaKey) return;

            if (blockedChars.includes(e.key)) {
                e.preventDefault();
                return false;
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            const pastedText = e.clipboardData?.getData('text') || '';

            // If pasted text contains blocked chars or dangerous patterns, block the paste or clean it
            const containsBlocked = blockedChars.some(char => pastedText.includes(char));
            const containsDangerous = dangerousPatterns.some(pattern => pattern.test(pastedText));

            if (containsBlocked || containsDangerous) {
                e.preventDefault();

                // Optional: Clean and paste manually, but for maximum security, just block it
                // and notify the system/user if needed.
                console.warn('Security Shield: Blocked content due to potentially dangerous characters.');
            }
        };

        // Attach to document to catch all inputs (event delegation)
        document.addEventListener('keydown', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                handleKeyDown(e as any);
            }
        }, true);

        document.addEventListener('paste', (e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                handlePaste(e as any);
            }
        }, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown as any);
            document.removeEventListener('paste', handlePaste as any);
        };
    }, []);

    return <>{children}</>;
};

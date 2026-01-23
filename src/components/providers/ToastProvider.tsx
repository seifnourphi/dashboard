'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui/Toast';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error' | 'info';
        duration: number;
    }>({
        isOpen: false,
        message: '',
        type: 'success',
        duration: 3000,
    });

    const showToast = useCallback((
        message: string,
        type: 'success' | 'error' | 'info' = 'success',
        duration: number = 3000
    ) => {
        setToast({
            isOpen: true,
            message,
            type,
            duration,
        });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={hideToast}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

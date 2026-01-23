'use client';

import { useEffect } from 'react';
import { CheckCircle, X, ShoppingCart } from 'lucide-react';

interface ToastProps {
    isOpen: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export function Toast({
    isOpen,
    message,
    type = 'success',
    onClose,
    duration = 3000
}: ToastProps) {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-white" />;
            case 'error':
                return <X className="w-6 h-6 text-white" />;
            case 'info':
                return <ShoppingCart className="w-6 h-6 text-white" />;
            default:
                return <CheckCircle className="w-6 h-6 text-white" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-gradient-to-r from-green-500 to-emerald-600';
            case 'error':
                return 'bg-gradient-to-r from-red-500 to-red-600';
            case 'info':
                return 'bg-gradient-to-r from-[#9333EA] to-[#7c3aed]';
            default:
                return 'bg-gradient-to-r from-green-500 to-emerald-600';
        }
    };

    return (
        <div
            className={`fixed top-4 right-4 z-[9999] transform transition-all duration-300 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
                }`}
        >
            <div
                className={`${getBgColor()} text-white rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[420px] flex items-center gap-3 backdrop-blur-sm border border-white/20`}
            >
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors duration-200"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

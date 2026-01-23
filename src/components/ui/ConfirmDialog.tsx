'use client';

import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'success' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    type = 'confirm',
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-12 h-12 text-green-500" />;
            case 'alert':
                return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
            case 'info':
                return <Info className="w-12 h-12 text-blue-500" />;
            default:
                return <AlertTriangle className="w-12 h-12 text-[#9333EA]" />;
        }
    };

    const getConfirmButtonColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-600 hover:bg-green-700';
            case 'alert':
                return 'bg-yellow-600 hover:bg-yellow-700';
            case 'info':
                return 'bg-blue-600 hover:bg-blue-700';
            default:
                return 'bg-[#9333EA] hover:bg-[#7c3aed]';
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4 backdrop-blur-sm animate-in fade-in-0"
            onClick={(e) => {
                if (e.target === e.currentTarget && type !== 'confirm' && type !== 'success') {
                    onCancel();
                }
            }}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
                <div className="flex flex-col items-center pt-8 px-6 pb-4">
                    <div className="mb-4 animate-in zoom-in-95 duration-300">{getIcon()}</div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-3">{title}</h3>
                    <p className="text-gray-600 text-center text-sm leading-relaxed whitespace-pre-line">{message}</p>
                </div>
                <div className="px-6 pb-6 pt-4 flex gap-3">
                    {(type === 'confirm' || type === 'alert') && (
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 active:scale-95"
                        >
                            {cancelText || 'Cancel'}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`${(type === 'confirm' || type === 'alert') ? 'flex-1' : 'w-full'} px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 active:scale-95 ${getConfirmButtonColor()}`}
                    >
                        {confirmText || (type === 'confirm' || type === 'alert' ? 'Confirm' : 'OK')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

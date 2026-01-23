'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

function LoginForm() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [redirectUrl, setRedirectUrl] = useState('/');

    useEffect(() => {
        const redirect = searchParams.get('redirect');
        if (redirect) {
            if (redirect.startsWith('/') &&
                !redirect.includes('://') &&
                !redirect.includes('javascript:') &&
                !redirect.includes('data:') &&
                !redirect.includes('//')) {
                if (!redirect.includes('..') && !redirect.includes('\\')) {
                    setRedirectUrl(redirect);
                }
            }
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!formData.username || !formData.password) {
            setError(t('admin.fillFields'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const safeRedirect = redirectUrl && redirectUrl.startsWith('/') && !redirectUrl.includes('://')
                    ? redirectUrl
                    : '/';
                window.location.href = safeRedirect;
            } else {
                if (response.status === 429) {
                    const retryAfter = data.retryAfter || 900;
                    const errorMsg = `محاولات دخول كثيرة جداً. حاول مرة أخرى بعد ${Math.ceil(retryAfter / 60)} دقيقة.`;
                    setError(errorMsg);
                } else {
                    const errorMessage = data.error || t('admin.invalidCredentials');
                    setError(errorMessage);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('common.error');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}
            <div>
                <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.username')}
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        id="admin-username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="input pl-10"
                        placeholder="admin"
                        required
                        autoComplete="username"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.password')}
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        id="admin-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="input pl-10 pr-10"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#DAA520] hover:bg-[#c2931b] text-white font-medium py-3 px-4 rounded-lg transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{t('common.loading')}</span>
                    </div>
                ) : (
                    t('admin.loginButton')
                )}
            </button>
        </form>
    );
}

export default function AdminLoginPage() {
    const { language, t } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#DAA520] rounded-lg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                        ع
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {t('admin.loginButton')}
                    </h1>
                    <p className="text-gray-600">
                        {t('admin.loginTitle')}
                    </p>
                </div>

                <Suspense fallback={<div className="flex justify-center p-12"><div className="w-10 h-10 border-4 border-yellow-100 border-t-[#DAA520] animate-spin rounded-full" /></div>}>
                    <LoginForm />
                </Suspense>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Ridaa Admin. {t('admin.allRightsReserved')}
                    </p>
                </div>
            </div>
        </div>
    );
}

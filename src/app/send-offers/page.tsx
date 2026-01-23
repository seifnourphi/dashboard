'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { getCSRFToken } from '@/lib/csrf-client';
import { useToast } from '@/components/providers/ToastProvider';
import {
    Mail,
    Send,
    Users,
    CheckCircle,
    AlertCircle,
    Loader,
    Upload,
    X,
    Target,
    Sparkles,
    Zap,
    Info
} from 'lucide-react';

export default function SendOffersPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [formData, setFormData] = useState({ subject: '', message: '', image: '' });
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

    const fetchCount = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/newsletter/subscribers/count', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setSubscriberCount(data.success && data.data?.count !== undefined ? data.data.count : data.count || 0);
            }
        } catch (error) { console.error(error); }
    }, []);

    useEffect(() => { fetchCount(); }, [fetchCount]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingImage(true);
        try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            const token = await getCSRFToken();
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': token || ''
                },
                credentials: 'include',
                body: uploadFormData
            });
            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({ ...prev, image: data.url }));
                showToast(t('admin.imageUploaded'), 'success');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSend = async (isTest: boolean) => {
        if (!formData.subject || !formData.message) {
            showToast(t('admin.fillFields'), 'error');
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const token = await getCSRFToken();
            const endpoint = isTest ? '/api/admin/newsletter/test' : '/api/admin/newsletter/send';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                credentials: 'include',
                body: JSON.stringify({ ...formData, csrfToken: token })
            });
            const data = await response.json();
            setResult(data);
            if (data.success) {
                showToast(t('admin.sendSuccess'), 'success');
                if (!isTest) {
                    setFormData({ subject: '', message: '', image: '' });
                    fetchCount();
                }
            } else {
                showToast(data.message || 'Error', 'error');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Target className="w-8 h-8 text-[#DAA520]" />
                            {t('admin.marketingHub')}
                        </h1>
                        <p className="text-gray-500 mt-2">{t('admin.marketingHubDesc')}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-[#DAA520]">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.activeAudience')}</p>
                            <p className="text-xl font-black text-gray-900">{subscriberCount ?? '...'} <span className="text-xs font-normal text-gray-400">{t('admin.subscribers')}</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#DAA520]" /> {t('admin.campaignSubject')}</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder={t('admin.campaignSubjectPlaceholder')}
                                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-lg placeholder:font-normal placeholder:text-gray-300"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Mail className="w-4 h-4 text-[#DAA520]" /> {t('admin.messageContent')}</label>
                                <textarea
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                    rows={12}
                                    className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#DAA520] outline-none font-medium resize-none shadow-inner placeholder:text-gray-300"
                                    placeholder={t('admin.messagePlaceholder')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> {t('admin.visualAsset')}</h3>
                            <div className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group flex items-center justify-center">
                                {formData.image ? (
                                    <>
                                        <img src={formData.image} className="w-full h-full object-cover" />
                                        <button onClick={() => setFormData({ ...formData, image: '' })} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                                    </>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-gray-300 group-hover:text-[#DAA520] transition-colors" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{t('admin.bannerImage')}</span>
                                        <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                                    </label>
                                )}
                                {isUploadingImage && <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm"><Loader className="w-8 h-8 text-[#DAA520] animate-spin" /></div>}
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-bold uppercase text-center tracking-tighter">{t('admin.recommendBannerSize')}</p>
                        </div>

                        <div className="bg-gray-900 rounded-2xl p-8 space-y-4 shadow-xl shadow-gray-200">
                            <button
                                onClick={() => handleSend(true)}
                                disabled={isLoading}
                                className="w-full py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all text-sm border border-white/10 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Info className="w-4 h-4" />}
                                {t('admin.sendTestEmail')}
                            </button>
                            <button
                                onClick={() => handleSend(false)}
                                disabled={isLoading}
                                className="w-full py-4 bg-[#DAA520] text-white rounded-xl font-black hover:bg-[#B8860B] transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-3 group"
                            >
                                <Send className={`w-5 h-5 transition-transform ${!isLoading && 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} />
                                {isLoading ? t('admin.processing') : t('admin.launchCampaign')}
                            </button>
                        </div>

                        {result && (
                            <div className={`p-4 rounded-xl border-2 flex gap-3 ${result.success ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                {result.success ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                <div>
                                    <p className="text-xs font-bold uppercase mb-1">{result.success ? t('common.success') : t('common.error')}</p>
                                    <p className="text-sm font-medium">{result.message || result.error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

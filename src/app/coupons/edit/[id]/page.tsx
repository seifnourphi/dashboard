'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { getCSRFToken } from '@/lib/csrf-client';
import { Save, ArrowLeft, Gift, Zap, ShieldCheck, Clock } from 'lucide-react';

interface CouponFormData {
    code: string;
    description: string;
    descriptionAr: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number | '';
    minOrderAmount: number | '';
    maxUses: number | '';
    isActive: boolean;
    startDate: string;
    endDate: string;
}

export default function EditCouponPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const params = useParams();
    const couponId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<CouponFormData>({
        code: '',
        description: '',
        descriptionAr: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        minOrderAmount: '',
        maxUses: '',
        isActive: true,
        startDate: '',
        endDate: '',
    });

    const fetchCoupon = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/coupons/${couponId}`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                const coupon = data.success && data.data?.coupon ? data.data.coupon : data.coupon;
                if (coupon) {
                    setFormData({
                        code: coupon.code || '',
                        description: coupon.description || '',
                        descriptionAr: coupon.descriptionAr || '',
                        discountType: coupon.discountType || 'PERCENTAGE',
                        discountValue: coupon.discountValue || '',
                        minOrderAmount: coupon.minOrderAmount || '',
                        maxUses: coupon.maxUses || '',
                        isActive: coupon.isActive !== undefined ? coupon.isActive : true,
                        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
                        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
                    });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [couponId]);

    useEffect(() => {
        if (couponId) fetchCoupon();
    }, [couponId, fetchCoupon]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const token = await getCSRFToken();
            const response = await fetch(`/api/admin/coupons/${couponId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    discountValue: Number(formData.discountValue),
                    minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
                    maxUses: formData.maxUses ? Number(formData.maxUses) : null,
                    csrfToken: token
                })
            });

            if (response.ok) {
                showToast(t('admin.couponUpdated'), 'success');
                router.push('/coupons');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <AdminLayout><div className="p-12 flex justify-center"><div className="w-12 h-12 border-4 border-yellow-100 border-t-[#DAA520] animate-spin rounded-full" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"><ArrowLeft className="w-6 h-6" /></button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('admin.editCoupon')}</h1>
                            <p className="text-sm text-gray-500 mt-1">{t('admin.editingCouponCode')}: <span className="font-mono font-bold text-black">{formData.code}</span></p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Gift className="w-5 h-5 text-[#DAA520]" />
                                    <h2 className="font-bold text-gray-900 uppercase tracking-widest text-xs">{t('admin.primarySettings')}</h2>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{t('admin.couponCode')}</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-mono text-lg font-black tracking-widest"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.descriptionEn')}</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none text-sm"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.descriptionAr')}</label>
                                        <textarea
                                            value={formData.descriptionAr}
                                            onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none text-sm"
                                            rows={2}
                                            dir="rtl"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.discountType')}</label>
                                        <select
                                            value={formData.discountType}
                                            onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-gray-600"
                                        >
                                            <option value="PERCENTAGE">{t('admin.percentage')} (%)</option>
                                            <option value="FIXED">{t('admin.fixedAmount')} ({t('admin.unit.egp')})</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.discountValue')}</label>
                                        <input
                                            type="number"
                                            value={formData.discountValue}
                                            onChange={e => setFormData({ ...formData, discountValue: e.target.value === '' ? '' : Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldCheck className="w-5 h-5 text-[#DAA520]" />
                                    <h2 className="font-bold text-gray-900 uppercase tracking-widest text-xs">{t('admin.usageRules')}</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.minOrderValue')}</label>
                                        <input
                                            type="number"
                                            value={formData.minOrderAmount}
                                            onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value === '' ? '' : Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.usageLimit')}</label>
                                        <input
                                            type="number"
                                            value={formData.maxUses}
                                            onChange={e => setFormData({ ...formData, maxUses: e.target.value === '' ? '' : Number(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Clock className="w-5 h-5 text-[#DAA520]" />
                                    <h2 className="font-bold text-gray-900 uppercase tracking-widest text-xs">{t('admin.timing')}</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.startDate')}</label>
                                        <input type="datetime-local" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#DAA520] outline-none text-xs font-bold text-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">{t('admin.endDate')}</label>
                                        <input type="datetime-local" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-[#DAA520] outline-none text-xs font-bold text-gray-600" />
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <label className="flex items-center justify-between cursor-pointer">
                                        <span className="font-bold text-gray-700 text-sm">{t('admin.couponActive')}</span>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-5 h-5 accent-[#DAA520]"
                                        />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-[#DAA520] text-white rounded-2xl font-bold hover:bg-[#B8860B] transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-5 h-5" />
                                {isSaving ? t('admin.updating') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

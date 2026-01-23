'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { getCSRFToken } from '@/lib/csrf-client';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    Ticket,
    Eye,
    EyeOff,
    Tag,
    Gift
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Coupon {
    id: string;
    code: string;
    name: string | null;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrderAmount: number | null;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
}

export default function CouponsPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, id: string, code: string }>({ isOpen: false, id: '', code: '' });

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/coupons', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                const list = data.success && data.data?.coupons ? data.data.coupons : data.coupons || [];
                setCoupons(Array.isArray(list) ? list : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleToggleActive = async (coupon: Coupon) => {
        try {
            const token = await getCSRFToken();
            const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                credentials: 'include',
                body: JSON.stringify({ isActive: !coupon.isActive, csrfToken: token })
            });
            if (response.ok) {
                setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !coupon.isActive } : c));
                showToast(t('admin.statusUpdated'), 'success');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async () => {
        try {
            const token = await getCSRFToken();
            const response = await fetch(`/api/admin/coupons/${confirmDialog.id}?csrfToken=${token}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': token || ''
                },
                credentials: 'include'
            });
            if (response.ok) {
                setCoupons(prev => prev.filter(c => c.id !== confirmDialog.id));
                setConfirmDialog({ isOpen: false, id: '', code: '' });
                showToast(t('common.success'), 'success');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const filteredCoupons = coupons.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Gift className="w-8 h-8 text-[#DAA520]" />
                            {t('admin.coupons')}
                        </h1>
                        <p className="text-gray-500 mt-2">{t('admin.manageCouponsDesc')}</p>
                    </div>
                    <button
                        onClick={() => router.push('/coupons/add')}
                        className="px-6 py-3 bg-[#DAA520] text-white rounded-xl font-bold hover:bg-[#B8860B] transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {t('admin.newCoupon')}
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('admin.searchCouponsPlaceholder')}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">{t('admin.internalNameCode')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">{t('admin.discountDetails')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">{t('admin.usageInfo')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">{t('admin.expiry')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">{t('admin.status')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan={6} className="h-16 bg-gray-50/50 animate-pulse" /></tr>)
                                ) : filteredCoupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-[#DAA520] border border-yellow-100 italic font-black">CP</div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">{coupon.name || t('admin.autoGenerated')}</p>
                                                    <p className="text-[10px] font-mono font-bold text-[#DAA520] uppercase tracking-widest bg-yellow-50 px-2 py-0.5 rounded-md inline-block mt-1">{coupon.code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 text-sm">
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% ${t('admin.percentageOff')}` : `${coupon.discountValue} ${t('admin.fixedOff')}`}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{t('admin.minOrder')}: {coupon.minOrderAmount || 0} {t('admin.unit.egp')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${coupon.maxUses ? (coupon.usedCount / coupon.maxUses) * 100 : 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500">{coupon.usedCount}/{coupon.maxUses || '∞'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-gray-600">{coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : t('admin.never')}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleActive(coupon)}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${coupon.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                            >
                                                {coupon.isActive ? t('admin.active') : t('admin.inactive')}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button onClick={() => router.push(`/coupons/edit/${coupon.id}`)} className="p-2 hover:bg-white hover:shadow-sm text-gray-400 hover:text-blue-600 rounded-lg"><Edit3 className="w-5 h-5" /></button>
                                                <button onClick={() => setConfirmDialog({ isOpen: true, id: coupon.id, code: coupon.code })} className="p-2 hover:bg-white hover:shadow-sm text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={t('admin.deleteCoupon')}
                message={t('admin.confirmDeleteCoupon')}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, id: '', code: '' })}
            />
        </AdminLayout>
    );
}

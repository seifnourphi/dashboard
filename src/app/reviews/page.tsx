'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { getCSRFToken } from '@/lib/csrf-client';
import { useToast } from '@/components/providers/ToastProvider';
import { getImageSrc } from '@/lib/image-utils';
import {
    MessageSquare,
    Star,
    Trash2,
    Eye,
    EyeOff,
    Package,
    Home,
    Filter,
    Search,
    X,
    User,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Review {
    id: string;
    rating: number;
    comment: string;
    commentAr?: string;
    isActive: boolean;
    createdAt: string;
    productId?: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
    };
    product?: {
        id: string;
        name: string;
        nameAr: string;
        slug: string;
        images?: Array<{ url: string; alt?: string }>;
    };
}

export default function ReviewsManagementPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'home' | 'product'>('all');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filterType !== 'all') params.append('type', filterType);
            if (filterActive !== 'all') params.append('isActive', filterActive === 'active' ? 'true' : 'false');

            const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const list = data.success && data.data?.reviews ? data.data.reviews : data.reviews || [];
                setReviews(Array.isArray(list) ? list : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [filterType, filterActive]);

    const handleToggleActive = async (review: Review) => {
        try {
            const token = await getCSRFToken();
            const response = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token || ''
                },
                credentials: 'include',
                body: JSON.stringify({ id: review.id, isActive: !review.isActive, csrfToken: token })
            });

            if (response.ok) {
                setReviews(prev => prev.map(r => r.id === review.id ? { ...r, isActive: !review.isActive } : r));
                if (selectedReview?.id === review.id) setSelectedReview({ ...selectedReview, isActive: !review.isActive });
                showToast(t('admin.statusUpdated'), 'success');
            }
        } catch (error) {
            showToast(t('admin.errorUpdatingStatus'), 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!reviewToDelete) return;
        try {
            const token = await getCSRFToken();
            const response = await fetch(`/api/admin/reviews?id=${reviewToDelete.id}&csrfToken=${token}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': token || ''
                },
                credentials: 'include'
            });

            if (response.ok) {
                fetchReviews();
                setShowDeleteDialog(false);
                if (selectedReview?.id === reviewToDelete.id) setShowDetailModal(false);
                showToast(t('common.success'), 'success');
            }
        } catch (error) {
            showToast(t('common.error'), 'error');
        }
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-[#DAA520] fill-current' : 'text-gray-300'}`} />
        ));
    };

    const filteredReviews = reviews.filter(r => {
        const search = searchTerm.toLowerCase();
        const userName = r.user ? `${r.user.firstName} ${r.user.lastName}`.toLowerCase() : '';
        const userEmail = r.user?.email?.toLowerCase() || '';
        const comment = (r.commentAr || r.comment || '').toLowerCase();
        const productName = (r.product?.nameAr || r.product?.name || '').toLowerCase();

        return (
            userName.includes(search) ||
            userEmail.includes(search) ||
            comment.includes(search) ||
            productName.includes(search)
        );
    });

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <MessageSquare className="w-8 h-8 text-[#DAA520]" />
                            {t('admin.reviews')}
                        </h1>
                        <p className="text-gray-500 mt-2">{t('admin.reviewsDesc')}</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'all' ? 'bg-[#DAA520] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{t('admin.allStatus')}</button>
                        <button onClick={() => setFilterType('home')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'home' ? 'bg-[#DAA520] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{t('admin.home')}</button>
                        <button onClick={() => setFilterType('product')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'product' ? 'bg-[#DAA520] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{t('admin.products')}</button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('admin.searchReviews')}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none"
                            />
                        </div>
                        <select
                            value={filterActive}
                            onChange={e => setFilterActive(e.target.value as any)}
                            className="px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm text-gray-600"
                        >
                            <option value="all">{t('admin.allStatus')}</option>
                            <option value="active">{t('admin.approved')}</option>
                            <option value="inactive">{t('admin.hidden')}</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.customer')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.status')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.comment')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.target')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.status')}</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => <tr key={i} className="animate-pulse lg:table-row"><td colSpan={6} className="h-16 bg-gray-50/50" /></tr>)
                                ) : filteredReviews.map(review => (
                                    <tr key={review.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-[#DAA520] font-bold border border-yellow-100">
                                                    {review.user?.avatar ? <img src={getImageSrc(review.user.avatar)} className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{review.user ? `${review.user.firstName} ${review.user.lastName}` : t('admin.unknownUser')}</p>
                                                    <p className="text-xs text-gray-400">{review.user?.email || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm text-gray-600 line-clamp-1">{review.commentAr || review.comment}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {review.productId ? (
                                                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase">
                                                    <Package className="w-3.5 h-3.5" /> {t('admin.products')}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-[#DAA520] font-bold text-xs uppercase">
                                                    <Home className="w-3.5 h-3.5" /> {t('admin.home')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${review.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {review.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {review.isActive ? t('admin.approved') : t('admin.hidden')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setSelectedReview(review); setShowDetailModal(true); }} className="p-2 hover:bg-white hover:shadow-sm text-gray-400 hover:text-[#DAA520] rounded-lg transition-all"><Eye className="w-5 h-5" /></button>
                                                <button onClick={() => handleToggleActive(review)} className={`p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all ${review.isActive ? 'text-gray-400 hover:text-orange-500' : 'text-gray-400 hover:text-green-500'}`}>{review.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
                                                <button onClick={() => { setReviewToDelete(review); setShowDeleteDialog(true); }} className="p-2 hover:bg-white hover:shadow-sm text-gray-400 hover:text-red-500 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showDetailModal && selectedReview && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowDetailModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-8" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center text-[#DAA520] border-2 border-yellow-100">
                                    {selectedReview.user?.avatar ? <img src={getImageSrc(selectedReview.user.avatar)} className="w-full h-full rounded-2xl object-cover" /> : <User className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{selectedReview.user ? `${selectedReview.user.firstName} ${selectedReview.user.lastName}` : t('admin.unknownUser')}</h2>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex gap-0.5">{renderStars(selectedReview.rating)}</div>
                                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedReview.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-6 relative">
                                    <MessageSquare className="absolute -top-3 -left-3 w-8 h-8 text-gray-100" />
                                    <p className="text-gray-700 leading-relaxed italic">"{selectedReview.commentAr || selectedReview.comment}"</p>
                                </div>

                                {selectedReview.product && (
                                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                        <Package className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{t('admin.products')}</p>
                                            <p className="text-sm font-bold text-blue-900">{selectedReview.product.nameAr || selectedReview.product.name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-10">
                                <button onClick={() => handleToggleActive(selectedReview)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${selectedReview.isActive ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                    {selectedReview.isActive ? t('admin.hideReview') : t('admin.approveReview')}
                                </button>
                                <button onClick={() => setShowDetailModal(false)} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">{t('common.cancel')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmDialog
                isOpen={showDeleteDialog}
                title={t('admin.deleteReview')}
                message={t('admin.confirmDeleteReview')}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteDialog(false)}
            />
        </AdminLayout>
    );
}

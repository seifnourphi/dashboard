'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, Upload, Image as ImageIcon, X, Crop } from 'lucide-react';
import { getCSRFToken, refreshCSRFToken } from '@/lib/csrf-client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ImageCropper } from '@/components/ui/ImageCropper';

interface AdvertisementImage {
    id: string;
    url: string;
    alt?: string;
    altAr?: string;
    name?: string;
    nameAr?: string;
    price?: number;
    sortOrder: number;
}

interface Advertisement {
    id: string;
    title: string;
    titleAr: string;
    subtitle?: string;
    subtitleAr?: string;
    badge?: string;
    badgeAr?: string;
    badgeColor?: string;
    description: string;
    descriptionAr: string;
    buttonText?: string;
    buttonTextAr?: string;
    image: string;
    price?: number;
    originalPrice?: number;
    displayType: string;
    sortOrder: number;
    isActive: boolean;
    images: AdvertisementImage[];
    highlightedWord?: string;
    highlightedWordAr?: string;
    highlightedWordColor?: string;
    highlightedWordUnderline?: boolean;
    showDiscountBadge?: boolean;
    discountBadgePosition?: string;
    features?: Array<{
        title: string;
        titleAr: string;
        icon?: string;
        sortOrder: number;
    }>;
    testimonialText?: string;
    testimonialTextAr?: string;
    testimonialAuthor?: string;
    testimonialAuthorAr?: string;
    promotionalBadges?: Array<{
        text: string;
        textAr: string;
        icon?: string;
        backgroundColor?: string;
        textColor?: string;
    }>;
    buttons?: Array<{
        text: string;
        textAr: string;
        href: string;
        variant: 'primary' | 'secondary' | 'outline';
    }>;
}

export default function AdvertisementsPage() {
    const { t, language } = useLanguage();
    const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
    const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [cropImageType, setCropImageType] = useState<'single' | 'multiple' | null>(null);
    const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const [formData, setFormData] = useState({
        title: '',
        titleAr: '',
        subtitle: '',
        subtitleAr: '',
        badge: '',
        badgeAr: '',
        badgeColor: '#DAA520',
        description: '',
        descriptionAr: '',
        buttonText: '',
        buttonTextAr: '',
        image: '',
        price: '',
        originalPrice: '',
        displayType: 'SINGLE',
        sortOrder: 0,
        isActive: true,
        images: [] as AdvertisementImage[],
        highlightedWord: '',
        highlightedWordAr: '',
        highlightedWordColor: '#DAA520',
        highlightedWordUnderline: false,
        showDiscountBadge: true,
        discountBadgePosition: 'top-right',
        features: [] as Array<{ title: string; titleAr: string; icon?: string; sortOrder: number }>,
        testimonialText: '',
        testimonialTextAr: '',
        testimonialAuthor: '',
        testimonialAuthorAr: '',
        promotionalBadges: [] as Array<{ text: string; textAr: string; icon?: string; backgroundColor?: string; textColor?: string }>,
        buttons: [] as Array<{ text: string; textAr: string; href: string; variant: 'primary' | 'secondary' | 'outline' }>
    });

    const fetchAdvertisements = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/advertisements', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const list = data.success && data.data?.advertisements ? data.data.advertisements : data.advertisements || [];
                setAdvertisements(list.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdvertisements();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setCropImage(reader.result as string);
            setCropImageType('single');
            setCropImageIndex(null);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleCropComplete = async (croppedImage: string) => {
        try {
            const token = await getCSRFToken();
            const response = await fetch(croppedImage);
            const blob = await response.blob();
            const fd = new FormData();
            fd.append('file', blob, 'ad-image.jpg');
            fd.append('csrfToken', token || '');

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': token || '',
                },
                credentials: 'include',
                body: fd
            });

            if (uploadRes.ok) {
                const data = await uploadRes.json();
                if (cropImageType === 'single') {
                    setFormData(prev => ({ ...prev, image: data.url }));
                } else if (cropImageType === 'multiple' && cropImageIndex !== null) {
                    const newImages = [...formData.images];
                    newImages[cropImageIndex] = { ...newImages[cropImageIndex], url: data.url };
                    setFormData(prev => ({ ...prev, images: newImages }));
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCropImage(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = await getCSRFToken();
            const method = editingAd ? 'PUT' : 'POST';
            const payload = {
                ...formData,
                price: formData.price ? parseFloat(formData.price) : undefined,
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                id: editingAd?.id,
                csrfToken: token
            };

            const response = await fetch('/api/admin/advertisements', {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token || ''
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchAdvertisements();
                setIsModalOpen(false);
                resetForm();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const resetForm = () => {
        setEditingAd(null);
        setFormData({
            title: '', titleAr: '', subtitle: '', subtitleAr: '', badge: '', badgeAr: '', badgeColor: '#DAA520',
            description: '', descriptionAr: '', buttonText: '', buttonTextAr: '', image: '', price: '', originalPrice: '',
            displayType: 'SINGLE', sortOrder: 0, isActive: true, images: [], highlightedWord: '', highlightedWordAr: '',
            highlightedWordColor: '#DAA520', highlightedWordUnderline: false, showDiscountBadge: true, discountBadgePosition: 'top-right',
            features: [], testimonialText: '', testimonialTextAr: '', testimonialAuthor: '', testimonialAuthorAr: '',
            promotionalBadges: [], buttons: []
        });
    };

    const handleEdit = (ad: Advertisement) => {
        setEditingAd(ad);
        setFormData({
            ...ad,
            price: ad.price?.toString() || '',
            originalPrice: ad.originalPrice?.toString() || '',
            badgeColor: ad.badgeColor || '#DAA520',
            images: ad.images || [],
            features: ad.features || [],
            promotionalBadges: ad.promotionalBadges || [],
            buttons: ad.buttons || [],
            subtitle: ad.subtitle || '',
            subtitleAr: ad.subtitleAr || '',
            badge: ad.badge || '',
            badgeAr: ad.badgeAr || '',
            highlightedWord: ad.highlightedWord || '',
            highlightedWordAr: ad.highlightedWordAr || '',
            highlightedWordColor: ad.highlightedWordColor || '#DAA520',
            testimonialText: ad.testimonialText || '',
            testimonialTextAr: ad.testimonialTextAr || '',
            testimonialAuthor: ad.testimonialAuthor || '',
            testimonialAuthorAr: ad.testimonialAuthorAr || '',
        } as any);
        setIsModalOpen(true);
    };

    const handleMove = async (id: string, direction: 'up' | 'down') => {
        const index = advertisements.findIndex(ad => ad.id === id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === advertisements.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const currentAd = advertisements[index];
        const targetAd = advertisements[targetIndex];

        try {
            const token = await getCSRFToken();
            // Swap sort orders
            const p1 = fetch('/api/admin/advertisements', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token || '' },
                credentials: 'include',
                body: JSON.stringify({ id: currentAd.id, sortOrder: targetAd.sortOrder || index + 1, csrfToken: token })
            });

            const p2 = fetch('/api/admin/advertisements', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token || '' },
                credentials: 'include',
                body: JSON.stringify({ id: targetAd.id, sortOrder: currentAd.sortOrder || index, csrfToken: token })
            });

            await Promise.all([p1, p2]);
            fetchAdvertisements();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmDialog({
            isOpen: true,
            title: t('admin.deleteAd'),
            message: t('admin.confirmDeleteAd'),
            onConfirm: async () => {
                const token = await getCSRFToken();
                await fetch(`/api/admin/advertisements/${id}?csrfToken=${token}`, {
                    method: 'DELETE',
                    headers: { 'X-CSRF-Token': token || '' },
                    credentials: 'include'
                });
                fetchAdvertisements();
                setConfirmDialog(p => ({ ...p, isOpen: false }));
            }
        });
    };

    const addFeature = () => {
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, { title: '', titleAr: '', sortOrder: prev.features.length }]
        }));
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const addPromotionalBadge = () => {
        setFormData(prev => ({
            ...prev,
            promotionalBadges: [...(prev.promotionalBadges || []), { text: '', textAr: '', backgroundColor: '#DAA520', textColor: '#FFFFFF' }]
        }));
    };

    const removePromotionalBadge = (index: number) => {
        setFormData(prev => ({
            ...prev,
            promotionalBadges: (prev.promotionalBadges || []).filter((_, i) => i !== index)
        }));
    };

    const addButton = () => {
        setFormData(prev => ({
            ...prev,
            buttons: [...(prev.buttons || []), { text: '', textAr: '', href: '', variant: 'primary' }]
        }));
    };

    const removeButton = (index: number) => {
        setFormData(prev => ({
            ...prev,
            buttons: (prev.buttons || []).filter((_, i) => i !== index)
        }));
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <ImageIcon className="w-8 h-8 text-[#DAA520]" />
                            {t('admin.advertisements')}
                        </h1>
                        <p className="text-gray-500 mt-2">{t('admin.manageAds')}</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="px-6 py-3 bg-[#DAA520] text-white rounded-xl font-bold hover:bg-[#B8860B] transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {t('admin.addAd')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => <div key={i} className="bg-gray-100 animate-pulse h-64 rounded-2xl" />)
                    ) : advertisements.map(ad => (
                        <div key={ad.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                            <div className="relative h-48 overflow-hidden bg-gray-50">
                                <img src={ad.image || '/uploads/good.png'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${ad.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {ad.isActive ? t('admin.active') : t('admin.inactive')}
                                    </span>
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {ad.displayType}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-gray-900 mb-1 truncate">{ad.titleAr || ad.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{ad.descriptionAr || ad.description}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEdit(ad)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(ad.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleMove(ad.id, 'up')} className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg group-hover:text-amber-600 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                                        <button onClick={() => handleMove(ad.id, 'down')} className="p-2 hover:bg-gray-100 text-gray-400 rounded-lg group-hover:text-amber-600 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold">{editingAd ? t('admin.editAd') : t('admin.newAd')}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest">{t('admin.mainDetailsEn')}</label>
                                        <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]" placeholder={t('admin.adTitle')} required />
                                        <input type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]" placeholder={t('admin.subtitle')} />
                                        <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]" placeholder={t('admin.adDescription')} rows={3} required />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" value={formData.badge} onChange={e => setFormData({ ...formData, badge: e.target.value })} className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]" placeholder={t('admin.badge')} />
                                            <input type="color" value={formData.badgeColor} onChange={e => setFormData({ ...formData, badgeColor: e.target.value })} className="w-full h-12 p-1 border rounded-xl outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest">{t('admin.mainDetailsAr')}</label>
                                        <input type="text" value={formData.titleAr} onChange={e => setFormData({ ...formData, titleAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520] text-right" placeholder={t('admin.adTitle')} required />
                                        <input type="text" value={formData.subtitleAr} onChange={e => setFormData({ ...formData, subtitleAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520] text-right" placeholder={t('admin.subtitle')} />
                                        <textarea value={formData.descriptionAr} onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520] text-right" placeholder={t('admin.adDescription')} rows={3} required />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" value={formData.badgeAr} onChange={e => setFormData({ ...formData, badgeAr: e.target.value })} className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520] text-right" placeholder={t('admin.badge')} />
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" checked={formData.showDiscountBadge} onChange={e => setFormData({ ...formData, showDiscountBadge: e.target.checked })} className="w-4 h-4" />
                                                <span className="text-xs font-bold">{t('admin.showDiscountBadge')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50/50 p-6 rounded-2xl space-y-4 border border-amber-100">
                                    <h3 className="font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4 text-amber-600" /> {t('admin.highlightedWord')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <input type="text" value={formData.highlightedWord} onChange={e => setFormData({ ...formData, highlightedWord: e.target.value })} className="md:col-span-1 px-4 py-2 border rounded-xl outline-none" placeholder="EN" />
                                        <input type="text" value={formData.highlightedWordAr} onChange={e => setFormData({ ...formData, highlightedWordAr: e.target.value })} className="md:col-span-1 px-4 py-2 border rounded-xl outline-none text-right" placeholder="AR" />
                                        <input type="color" value={formData.highlightedWordColor} onChange={e => setFormData({ ...formData, highlightedWordColor: e.target.value })} className="w-full h-10 p-1 border rounded-lg" />
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked={formData.highlightedWordUnderline} onChange={e => setFormData({ ...formData, highlightedWordUnderline: e.target.checked })} className="w-4 h-4" />
                                            <span className="text-sm">{t('admin.highlightedWordUnderline')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                                        <h3 className="font-bold border-b pb-2">{t('admin.features')}</h3>
                                        <div className="space-y-3">
                                            {formData.features.map((feature, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input type="text" value={feature.title} onChange={e => {
                                                        const newF = [...formData.features];
                                                        newF[idx].title = e.target.value;
                                                        setFormData({ ...formData, features: newF });
                                                    }} className="flex-1 px-3 py-2 border rounded-lg text-xs" placeholder="Feature EN" />
                                                    <input type="text" value={feature.titleAr} onChange={e => {
                                                        const newF = [...formData.features];
                                                        newF[idx].titleAr = e.target.value;
                                                        setFormData({ ...formData, features: newF });
                                                    }} className="flex-1 px-3 py-2 border rounded-lg text-xs text-right" placeholder="الميزة" />
                                                    <button type="button" onClick={() => removeFeature(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={addFeature} className="w-full py-2 border-2 border-dashed rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-100">+ {t('admin.addFeature')}</button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                                        <h3 className="font-bold border-b pb-2">{t('admin.testimonialText')}</h3>
                                        <input type="text" value={formData.testimonialAuthor} onChange={e => setFormData({ ...formData, testimonialAuthor: e.target.value })} className="w-full px-4 py-2 border rounded-xl outline-none text-sm" placeholder={t('admin.testimonialAuthor')} />
                                        <input type="text" value={formData.testimonialAuthorAr} onChange={e => setFormData({ ...formData, testimonialAuthorAr: e.target.value })} className="w-full px-4 py-2 border rounded-xl outline-none text-right text-sm" placeholder={t('admin.testimonialAuthor')} />
                                        <textarea value={formData.testimonialText} onChange={e => setFormData({ ...formData, testimonialText: e.target.value })} className="w-full px-4 py-2 border rounded-xl outline-none text-sm" placeholder="Testimonial EN" rows={2} />
                                        <textarea value={formData.testimonialTextAr} onChange={e => setFormData({ ...formData, testimonialTextAr: e.target.value })} className="w-full px-4 py-2 border rounded-xl outline-none text-right text-sm" placeholder="نص التوصية" rows={2} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                                        <h3 className="font-bold border-b pb-2">{t('admin.promotionalBadges')}</h3>
                                        <div className="space-y-3">
                                            {formData.promotionalBadges?.map((badge, idx) => (
                                                <div key={idx} className="p-3 border rounded-xl bg-white space-y-2">
                                                    <div className="flex gap-2">
                                                        <input type="text" value={badge.text} onChange={e => {
                                                            const newB = [...(formData.promotionalBadges || [])];
                                                            newB[idx].text = e.target.value;
                                                            setFormData({ ...formData, promotionalBadges: newB });
                                                        }} className="flex-1 px-3 py-1 border rounded-lg text-xs" placeholder="Badge EN" />
                                                        <input type="text" value={badge.textAr} onChange={e => {
                                                            const newB = [...(formData.promotionalBadges || [])];
                                                            newB[idx].textAr = e.target.value;
                                                            setFormData({ ...formData, promotionalBadges: newB });
                                                        }} className="flex-1 px-3 py-1 border rounded-lg text-xs text-right" placeholder="العربي" />
                                                        <button type="button" onClick={() => removePromotionalBadge(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="color" value={badge.backgroundColor} onChange={e => {
                                                            const newB = [...(formData.promotionalBadges || [])];
                                                            newB[idx].backgroundColor = e.target.value;
                                                            setFormData({ ...formData, promotionalBadges: newB });
                                                        }} className="w-full h-8 p-1 border rounded-lg" />
                                                        <input type="color" value={badge.textColor} onChange={e => {
                                                            const newB = [...(formData.promotionalBadges || [])];
                                                            newB[idx].textColor = e.target.value;
                                                            setFormData({ ...formData, promotionalBadges: newB });
                                                        }} className="w-full h-8 p-1 border rounded-lg" />
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={addPromotionalBadge} className="w-full py-2 border-2 border-dashed rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-100">+ {t('admin.addAd')}</button>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                                        <h3 className="font-bold border-b pb-2">{t('admin.buttons')}</h3>
                                        <div className="space-y-3">
                                            {formData.buttons?.map((btn, idx) => (
                                                <div key={idx} className="p-3 border rounded-xl bg-white space-y-2">
                                                    <div className="flex gap-2">
                                                        <input type="text" value={btn.text} onChange={e => {
                                                            const newB = [...(formData.buttons || [])];
                                                            newB[idx].text = e.target.value;
                                                            setFormData({ ...formData, buttons: newB });
                                                        }} className="flex-1 px-3 py-1 border rounded-lg text-xs" placeholder="Btn EN" />
                                                        <input type="text" value={btn.textAr} onChange={e => {
                                                            const newB = [...(formData.buttons || [])];
                                                            newB[idx].textAr = e.target.value;
                                                            setFormData({ ...formData, buttons: newB });
                                                        }} className="flex-1 px-3 py-1 border rounded-lg text-xs text-right" placeholder="العربي" />
                                                        <button type="button" onClick={() => removeButton(idx)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input type="text" value={btn.href} onChange={e => {
                                                            const newB = [...(formData.buttons || [])];
                                                            newB[idx].href = e.target.value;
                                                            setFormData({ ...formData, buttons: newB });
                                                        }} className="px-3 py-1 border rounded-lg text-xs" placeholder={t('admin.href')} />
                                                        <select value={btn.variant} onChange={e => {
                                                            const newB = [...(formData.buttons || [])];
                                                            newB[idx].variant = e.target.value as any;
                                                            setFormData({ ...formData, buttons: newB });
                                                        }} className="px-3 py-1 border rounded-lg text-xs">
                                                            <option value="primary">{t('admin.primary')}</option>
                                                            <option value="secondary">{t('admin.secondary')}</option>
                                                            <option value="outline">{t('admin.outline')}</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                            <button type="button" onClick={addButton} className="w-full py-2 border-2 border-dashed rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-100">+ {t('admin.addAd')}</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">{t('admin.displayMode')}</label>
                                        <select value={formData.displayType} onChange={e => setFormData({ ...formData, displayType: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]">
                                            <option value="SINGLE">{t('admin.singleHero')}</option>
                                            <option value="MULTIPLE">{t('admin.gridGallery')}</option>
                                            <option value="CAROUSEL">{t('admin.carouselSlider')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">{t('admin.priceOptional')}</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]" placeholder={t('admin.salePrice')} />
                                            <input type="number" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]" placeholder={t('admin.price')} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2">{t('admin.discountBadgePosition')}</label>
                                        <select value={formData.discountBadgePosition} onChange={e => setFormData({ ...formData, discountBadgePosition: e.target.value })} className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520]">
                                            <option value="top-right">{t('admin.posTopRight')}</option>
                                            <option value="top-left">{t('admin.posTopLeft')}</option>
                                            <option value="bottom-right">{t('admin.posBottomRight')}</option>
                                            <option value="bottom-left">{t('admin.posBottomLeft')}</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end h-full">
                                        <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl w-full">
                                            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 accent-[#DAA520]" />
                                            <span className="font-bold text-gray-700">{t('admin.publishAd')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest">{t('admin.bannerMedia')}</label>
                                    <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <div className="w-32 h-32 bg-white rounded-xl border-2 border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                                            {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-3">{t('admin.recommendImageSize')}</p>
                                            <input type="file" id="ad-img" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                            <label htmlFor="ad-img" className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-50 cursor-pointer inline-flex items-center gap-2 transition-all shadow-sm">
                                                <Upload className="w-4 h-4" /> {t('admin.chooseFile')}
                                            </label>
                                        </div>
                                    </div>

                                    {formData.displayType !== 'SINGLE' && (
                                        <div className="mt-6 space-y-4">
                                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-widest">{t('admin.gridGallery')}</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                                {formData.images.map((img, idx) => (
                                                    <div key={idx} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group border">
                                                        <img src={img.url} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <button type="button" onClick={() => {
                                                                setCropImage(img.url);
                                                                setCropImageType('multiple');
                                                                setCropImageIndex(idx);
                                                            }} className="p-1.5 bg-white text-gray-700 rounded-lg hover:bg-gray-100"><Crop className="w-4 h-4" /></button>
                                                            <button type="button" onClick={() => {
                                                                const newI = [...formData.images];
                                                                newI.splice(idx, 1);
                                                                setFormData({ ...formData, images: newI });
                                                            }} className="p-1.5 bg-white text-red-500 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = (e: any) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onload = () => {
                                                                setCropImage(reader.result as string);
                                                                setCropImageType('multiple');
                                                                setCropImageIndex(formData.images.length);
                                                                // Pre-add empty slot
                                                                const newI = [...formData.images, { id: Date.now().toString(), url: '', sortOrder: formData.images.length }];
                                                                setFormData(p => ({ ...p, images: newI }));
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    };
                                                    input.click();
                                                }} className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                                                    <Plus className="w-6 h-6 mb-1" />
                                                    <span className="text-[10px] font-bold uppercase">{t('common.add')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t font-bold">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">{t('common.cancel')}</button>
                                    <button type="submit" className="px-10 py-3 bg-[#DAA520] text-white rounded-xl shadow-lg shadow-yellow-500/20 hover:bg-[#B8860B] transition-all">
                                        {editingAd ? t('common.save') : t('common.add')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
            />
            {cropImage && (
                <ImageCropper
                    image={cropImage}
                    onCropComplete={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                    aspectRatio={formData.displayType === 'SINGLE' ? 16 / 9 : 1}
                />
            )}
        </AdminLayout>
    );
}

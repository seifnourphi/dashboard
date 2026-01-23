'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { getCSRFToken } from '@/lib/csrf-client';
import { useToast } from '@/components/providers/ToastProvider';
import {
    Save,
    Settings,
    Eye,
    EyeOff,
    Search,
    X,
    Layers,
    MoveUp,
    MoveDown,
    Layout,
    CheckCircle2,
    Package
} from 'lucide-react';
import { getImageSrc } from '@/lib/image-utils';

interface SectionSettings {
    id: string;
    name: string;
    nameAr: string;
    isEnabled: boolean;
    sortOrder: number;
    maxProducts: number;
    showTitle: boolean;
    showViewAll: boolean;
    selectedProductIds?: string[];
}

export default function SectionsPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [sections, setSections] = useState<SectionSettings[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState<{ [key: string]: string }>({});
    const [showProductSelector, setShowProductSelector] = useState<{ [key: string]: boolean }>({});

    const fetchProducts = useCallback(async () => {
        try {
            const response = await fetch('/api/admin/products?limit=100', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setAllProducts(data.success && data.data?.products ? data.data.products : data.products || []);
            }
        } catch (error) { console.error(error); }
    }, []);

    const loadSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/sections', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                const list = data.success && data.data?.sections ? data.data.sections : data.sections || [];
                setSections(Array.isArray(list) ? list.sort((a, b) => a.sortOrder - b.sortOrder) : []);
            } else {
                const data = await response.json().catch(() => ({}));
                const errorMessage = data.error || `Error ${response.status}: Failed to load sections`;
                console.error('❌ Failed to load sections:', errorMessage);
                showToast(errorMessage, 'error');

                if (response.status === 401 || response.status === 403) {
                    // Potential session issue, might need redirect or refresh
                    console.warn('⚠️ Authentication issue detected:', response.status);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
        fetchProducts();
    }, [loadSettings, fetchProducts]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = await getCSRFToken();
            const response = await fetch('/api/admin/sections', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                credentials: 'include',
                body: JSON.stringify({ sections, csrfToken: token })
            });
            if (response.ok) {
                showToast(t('admin.saveSuccess'), 'success');
            }
        } catch (error) {
            showToast(t('admin.saveError'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const updateSection = (id: string, updates: Partial<SectionSettings>) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sections.length) return;
        [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
        setSections(newSections.map((s, i) => ({ ...s, sortOrder: i + 1 })));
    };

    const toggleProductSelection = (sectionId: string, productId: string) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const currentSelected = s.selectedProductIds || [];
            const isSelected = currentSelected.includes(productId);
            return {
                ...s,
                selectedProductIds: isSelected
                    ? currentSelected.filter(id => id !== productId)
                    : [...currentSelected, productId]
            };
        }));
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Layout className="w-8 h-8 text-[#DAA520]" />
                            {t('admin.storeArchitecture')}
                        </h1>
                        <p className="text-gray-500 mt-2">{t('admin.storeArchitectureDesc')}</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-4 bg-[#DAA520] text-white rounded-2xl font-bold hover:bg-[#B8860B] transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2 group disabled:opacity-50"
                    >
                        <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
                        {isSaving ? t('admin.saving') : t('admin.saveStructure')}
                    </button>
                </div>

                <div className="space-y-4 max-w-4xl">
                    {isLoading ? (
                        Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)
                    ) : sections.map((section, index) => (
                        <div key={section.id} className={`group bg-white rounded-2xl shadow-sm border border-gray-100 transition-all ${section.isEnabled ? 'p-6' : 'p-4 bg-gray-50 opacity-75'}`}>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-20"><MoveUp className="w-4 h-4" /></button>
                                    <button onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1} className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-20"><MoveDown className="w-4 h-4" /></button>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold transition-all ${section.isEnabled ? 'bg-[#DAA520] shadow-md' : 'bg-gray-300'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900">{section.nameAr || section.name}</p>
                                                {index === 0 && (
                                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded-full border border-indigo-200 shadow-sm">
                                                        {language === 'ar' ? 'البداية' : 'Hero / First'}
                                                    </span>
                                                )}
                                                {section.id === 'latest' && (
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black uppercase rounded-full border border-orange-200">
                                                        {language === 'ar' ? 'تنسيق البطاقات' : 'Cards Layout'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{section.id} {t('admin.block')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {section.id !== 'latest' && (
                                        <div className="hidden lg:flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{t('admin.capacity')}</span>
                                            <input
                                                type="number"
                                                value={section.maxProducts}
                                                onChange={e => updateSection(section.id, { maxProducts: parseInt(e.target.value) || 8 })}
                                                className="w-16 px-2 py-1 bg-gray-50 border-none rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-[#DAA520] outline-none"
                                            />
                                        </div>
                                    )}
                                    <div className="h-10 w-px bg-gray-100" />
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={section.isEnabled}
                                            onChange={e => updateSection(section.id, { isEnabled: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#DAA520]"></div>
                                    </label>
                                </div>
                            </div>

                            {section.isEnabled && (
                                <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> {t('admin.displayLabels')}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('admin.arabicTitle')}</label>
                                                <input
                                                    type="text"
                                                    value={section.nameAr}
                                                    onChange={e => updateSection(section.id, { nameAr: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-[#DAA520] text-sm font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('admin.englishTitle')}</label>
                                                <input
                                                    type="text"
                                                    value={section.name}
                                                    onChange={e => updateSection(section.id, { name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-1 focus:ring-[#DAA520] text-sm font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> {t('admin.visibilityRules')}</h3>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => updateSection(section.id, { showTitle: !section.showTitle })}
                                                className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all ${section.showTitle ? 'bg-[#DAA520]/5 border-[#DAA520] text-[#DAA520]' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                            >
                                                {section.showTitle ? t('admin.titleVisible') : t('admin.titleHidden')}
                                            </button>
                                            {section.id !== 'latest' && (
                                                <button
                                                    onClick={() => updateSection(section.id, { showViewAll: !section.showViewAll })}
                                                    className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-bold uppercase tracking-wider transition-all ${section.showViewAll ? 'bg-[#DAA520]/5 border-[#DAA520] text-[#DAA520]' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                                >
                                                    {section.showViewAll ? t('admin.ctaVisible') : t('admin.ctaHidden')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {section.isEnabled && section.id === 'latest' && (
                                <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-[#DAA520] bg-[#DAA520]/5 px-2 py-0.5 rounded-full border border-[#DAA520]/10">
                                            {(section.selectedProductIds || []).length} {t('admin.manualSelection')}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-[#DAA520] bg-[#DAA520]/5 px-2 py-0.5 rounded-full border border-[#DAA520]/10">
                                                {(section.selectedProductIds || []).length} {t('admin.selectedProducts')}
                                            </span>
                                            {(section.selectedProductIds || []).length > 0 && (
                                                <button
                                                    onClick={() => updateSection(section.id, { selectedProductIds: [] })}
                                                    className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase"
                                                >
                                                    {t('admin.clearAll')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={t('admin.searchPlaceholder')}
                                            value={productSearchTerm[section.id] || ''}
                                            onChange={e => setProductSearchTerm({ ...productSearchTerm, [section.id]: e.target.value })}
                                            onFocus={() => setShowProductSelector({ ...showProductSelector, [section.id]: true })}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm"
                                        />

                                        {showProductSelector[section.id] && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-[400px] overflow-y-auto p-2">
                                                <div className="flex justify-between items-center p-3 border-b border-gray-50 mb-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase">{language === 'ar' ? 'نتائج البحث' : 'Search Results'}</span>
                                                    <button onClick={() => setShowProductSelector({ ...showProductSelector, [section.id]: false })} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-400" /></button>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {(productSearchTerm[section.id]
                                                        ? allProducts.filter(p =>
                                                            (p.name && p.name.toLowerCase().includes(productSearchTerm[section.id].toLowerCase())) ||
                                                            (p.nameAr && p.nameAr.includes(productSearchTerm[section.id])) ||
                                                            (p.sku && p.sku.toLowerCase().includes(productSearchTerm[section.id].toLowerCase()))
                                                        )
                                                        : allProducts.slice(0, 10)
                                                    ).map(product => {
                                                        const isSelected = (section.selectedProductIds || []).includes(product.id);
                                                        return (
                                                            <div
                                                                key={product.id}
                                                                onClick={() => toggleProductSelection(section.id, product.id)}
                                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[#DAA520]/5 border-[#DAA520] shadow-sm shadow-[#DAA520]/10' : 'hover:bg-gray-50 border-transparent'}`}
                                                            >
                                                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-50 flex-shrink-0">
                                                                    <img src={getImageSrc(product.images?.[0])} alt="" className="w-full h-full object-cover" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-gray-900 text-xs truncate">{product.nameAr || product.name}</p>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{product.sku || 'NO-SKU'} • {product.price} {t('admin.unit.egp')}</p>
                                                                </div>
                                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#DAA520]" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Products Preview */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {(section.selectedProductIds || []).map(productId => {
                                            const product = allProducts.find(p => p.id === productId);
                                            if (!product) return null;
                                            return (
                                                <div key={productId} className="group/item relative bg-gray-50 rounded-xl p-2 border border-gray-100">
                                                    <div className="aspect-square bg-white rounded-lg overflow-hidden mb-2">
                                                        <img src={getImageSrc(product.images?.[0])} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <p className="text-[9px] font-bold text-gray-700 truncate">{product.nameAr || product.name}</p>
                                                    <button
                                                        onClick={() => toggleProductSelection(section.id, productId)}
                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/item:opacity-100 transition-all scale-75 group-hover/item:scale-100"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        {(section.selectedProductIds || []).length === 0 && (
                                            <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                                <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'سيتم عرض المنتجات تلقائياً' : 'Automatic mode active'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}

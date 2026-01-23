'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCSRF } from '@/hooks/useCSRF';
import {
    Save,
    ArrowLeft,
    Upload,
    X,
    Plus,
    Minus,
    Info,
    Image as ImageIcon,
    Tag,
    Layers,
    Search,
    Globe
} from 'lucide-react';
import { getImageSrc } from '@/lib/image-utils';

interface Category {
    id: string;
    name: string;
    nameAr: string;
}

interface ProductFormData {
    name: string;
    nameAr: string;
    slug: string;
    sku: string;
    description: string;
    descriptionAr: string;
    shortDescription: string;
    shortDescriptionAr: string;
    price: number;
    salePrice: number | null;
    discountPercent: number | null;
    categoryId: string;
    isActive: boolean;
    isFeatured: boolean;
    isNew: boolean;
    isBestseller: boolean;
    stockQuantity: number;
    gender: string;
    metaTitle: string;
    metaTitleAr: string;
    metaDescription: string;
    metaDescriptionAr: string;
    tags: string;
}

interface VariantRow {
    id: string;
    size: string;
    colorFields: Array<{ color: string; stock: number }>;
}

export default function AddProductPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const { csrfToken } = useCSRF();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        nameAr: '',
        slug: '',
        sku: '',
        description: '',
        descriptionAr: '',
        shortDescription: '',
        shortDescriptionAr: '',
        price: 0,
        salePrice: null,
        discountPercent: null,
        categoryId: '',
        isActive: true,
        isFeatured: false,
        isNew: false,
        isBestseller: false,
        stockQuantity: 0,
        gender: 'UNISEX',
        metaTitle: '',
        metaTitleAr: '',
        metaDescription: '',
        metaDescriptionAr: '',
        tags: '',
    });

    const [images, setImages] = useState<string[]>([]);
    const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Auto-calculate discount percent when price or salePrice changes
    useEffect(() => {
        if (formData.price > 0 && formData.salePrice !== null && formData.salePrice > 0 && formData.salePrice < formData.price) {
            const calculatedDiscount = Math.round(((formData.price - formData.salePrice) / formData.price) * 100);
            setFormData(prev => ({
                ...prev,
                discountPercent: calculatedDiscount
            }));
        } else if (formData.salePrice === null || formData.salePrice === 0) {
            setFormData(prev => ({
                ...prev,
                discountPercent: null
            }));
        }
    }, [formData.price, formData.salePrice]);

    // Auto-calculate total stock from variants
    useEffect(() => {
        const totalStock = variantRows.reduce((sum, row) =>
            sum + row.colorFields.reduce((rowSum, field) => rowSum + (field.stock || 0), 0), 0
        );
        setFormData(prev => ({
            ...prev,
            stockQuantity: totalStock
        }));
    }, [variantRows]);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/categories', {
                credentials: 'include',
                cache: 'no-store',
            });

            if (response.ok) {
                const data = await response.json();

                const categoriesList = data.success && data.data?.categories
                    ? data.data.categories
                    : data.categories || [];

                const validCategories = Array.isArray(categoriesList) ? categoriesList : [];
                setCategories(validCategories);
            } else {
                console.error('Failed to fetch categories');
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleInputChange = (field: keyof ProductFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (field === 'name' && typeof value === 'string') {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }
    };

    const addVariant = () => {
        setVariantRows(prev => [...prev, {
            id: Date.now().toString(),
            size: '',
            colorFields: [{ color: '', stock: 0 }]
        }]);
    };

    const addColorField = (rowIndex: number) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === rowIndex
                ? { ...row, colorFields: [...row.colorFields, { color: '', stock: 0 }] }
                : row
        ));
    };

    const removeColorField = (rowIndex: number, fieldIndex: number) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === rowIndex
                ? { ...row, colorFields: row.colorFields.filter((_, fi) => fi !== fieldIndex) }
                : row
        ));
    };

    const removeRow = (index: number) => {
        setVariantRows(prev => prev.filter((_, i) => i !== index));
    };

    const updateRowSize = (index: number, value: string) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === index ? { ...row, size: value } : row
        ));
    };

    const updateColorField = (rowIndex: number, fieldIndex: number, field: 'color' | 'stock', value: string | number) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === rowIndex
                ? {
                    ...row, colorFields: row.colorFields.map((fieldData, fi) =>
                        fi === fieldIndex ? { ...fieldData, [field]: value } : fieldData
                    )
                }
                : row
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.nameAr || !formData.sku || !formData.categoryId) {
            showToast(t('admin.fillRequiredFields'), 'error', 3000);
            return;
        }

        setIsSaving(true);
        try {
            let finalSalePrice = formData.salePrice;
            let finalDiscountPercent = formData.discountPercent;

            if (finalSalePrice !== null && finalSalePrice > 0 && formData.price > 0) {
                if (finalDiscountPercent === null) {
                    finalDiscountPercent = Math.round(((formData.price - finalSalePrice) / formData.price) * 100);
                }
            } else {
                finalSalePrice = null;
                finalDiscountPercent = null;
            }

            const convertedVariants: Array<{
                type: 'SIZE' | 'COLOR';
                value: string;
                valueAr: string;
                stock: number;
            }> = [];

            const sizes = new Set<string>();
            const colors = new Set<string>();
            const variantCombinations: Array<{ size?: string; color?: string; stock: number }> = [];

            variantRows.forEach(row => {
                if (row.size && row.size.trim()) {
                    sizes.add(row.size);
                    row.colorFields.forEach(field => {
                        if (field.color && field.color.trim()) {
                            colors.add(field.color);
                            variantCombinations.push({
                                size: row.size,
                                color: field.color,
                                stock: field.stock || 0
                            });
                        }
                    });
                }
            });

            sizes.forEach(size => {
                const sizeCombos = variantCombinations.filter(c => c.size === size);
                const maxStock = sizeCombos.reduce((max, c) => Math.max(max, c.stock || 0), 0);

                convertedVariants.push({
                    type: 'SIZE',
                    value: size,
                    valueAr: size,
                    stock: maxStock
                });
            });

            colors.forEach(color => {
                convertedVariants.push({
                    type: 'COLOR',
                    value: color,
                    valueAr: color,
                    stock: 0
                });
            });

            if (!csrfToken) {
                showToast(t('admin.sessionExpired'), 'error', 3000);
                return;
            }

            const productData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                salePrice: finalSalePrice || null,
                discountPercent: finalDiscountPercent || null,
                images: images.map((url, index) => ({
                    url,
                    sortOrder: index,
                    alt: formData.name || 'Product Image',
                    altAr: formData.nameAr || 'صورة المنتج'
                })),
                variants: convertedVariants,
                variantCombinations: variantCombinations.map((combo) => ({
                    size: combo.size || null,
                    color: combo.color || null,
                    stock: combo.stock || 0
                })),
                csrfToken
            };

            console.log('📦 Product Data to be saved:', productData);

            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify(productData),
            });

            if (response.ok) {
                showToast(t('admin.productCreated'), 'success', 3000);
                router.push('/products');
            } else {
                const error = await response.json();
                const errorMessage = error.success === false
                    ? error.error
                    : error.error || t('admin.errorCreatingProduct');
                showToast(errorMessage, 'error', 4000);
            }
        } catch (error) {
            console.error('Error creating product:', error);
            showToast(t('admin.errorCreatingProduct'), 'error', 4000);
        } finally {
            setIsSaving(false);
        }
    };

    const addImageUrl = () => {
        const url = prompt(t('admin.enterImageURL'));
        if (url && url.trim()) {
            setImages(prev => [...prev, url.trim()]);
        }
    };

    const addImageFromFile = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) {
                const uploadPromises = Array.from(files).map(async (file) => {
                    try {
                        const formData = new FormData();
                        formData.append('file', file);

                        // Use query parameter instead of body since multer can't access body.type
                        const response = await fetch('/api/upload?type=product', {
                            method: 'POST',
                            headers: {
                                'X-CSRF-Token': csrfToken || '',
                            },
                            credentials: 'include',
                            body: formData,
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.url) {
                                setImages(prev => [...prev, data.url]);
                                console.log('Image uploaded successfully:', data.url);
                            }
                        } else {
                            showToast(`فشل رفع ${file.name}`, 'error');
                        }
                    } catch (error) {
                        console.error('Error uploading image:', error);
                        showToast(`خطأ في رفع ${file.name}`, 'error');
                    }
                });

                // Start all uploads at once!
                await Promise.all(uploadPromises);
            }
        };
        input.click();
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <AdminLayout>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('admin.back')}
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('admin.addProduct')}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-gray-200 mb-6 space-x-8 overflow-x-auto">
                    {[
                        { id: 'general', label: t('admin.basicInfo'), icon: Info },
                        { id: 'media', label: t('admin.media'), icon: ImageIcon },
                        { id: 'variants', label: t('admin.variants'), icon: Layers },
                        { id: 'seo', label: t('admin.seoAndTags'), icon: Globe },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'border-[#DAA520] text-[#DAA520]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('admin.basicInformation')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.productName')} (English) *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.productName')} (العربية) *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nameAr}
                                            onChange={(e) => handleInputChange('nameAr', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                            dir="rtl"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.slug')} *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.slug}
                                            onChange={(e) => handleInputChange('slug', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.sku')} *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.sku}
                                            onChange={(e) => handleInputChange('sku', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.category')} *
                                        </label>
                                        <select
                                            required
                                            value={formData.categoryId}
                                            onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                        >
                                            <option value="">{t('admin.selectCategory')}</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.nameAr || category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.gender')}
                                        </label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                        >
                                            <option value="UNISEX">{t('admin.unisex')}</option>
                                            <option value="MALE">{t('admin.male')}</option>
                                            <option value="FEMALE">{t('admin.female')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('admin.descriptions')}
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('admin.shortDescription')} (English)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={formData.shortDescription}
                                                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('admin.shortDescription')} (العربية)
                                            </label>
                                            <textarea
                                                rows={3}
                                                value={formData.shortDescriptionAr}
                                                onChange={(e) => handleInputChange('shortDescriptionAr', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('admin.description')} (English) *
                                            </label>
                                            <textarea
                                                rows={6}
                                                required
                                                value={formData.description}
                                                onChange={(e) => handleInputChange('description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {t('admin.description')} (العربية) *
                                            </label>
                                            <textarea
                                                rows={6}
                                                required
                                                value={formData.descriptionAr}
                                                onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('admin.pricingInventory')}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.price')} (EGP) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={formData.price}
                                            onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.salePrice')} (EGP)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.salePrice ?? ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                handleInputChange('salePrice', value === '' ? null : parseFloat(value) || null);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('admin.discountPercent')} (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.discountPercent ?? ''}
                                            readOnly
                                            disabled
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {t('admin.productSettings')}
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                            className="h-4 w-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                                        />
                                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 font-medium">
                                            {t('admin.activeProduct')}
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isFeatured"
                                            checked={formData.isFeatured}
                                            onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                                            className="h-4 w-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                                        />
                                        <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900 font-medium">
                                            {t('admin.featuredProduct')}
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isNew"
                                            checked={formData.isNew}
                                            onChange={(e) => handleInputChange('isNew', e.target.checked)}
                                            className="h-4 w-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                                        />
                                        <label htmlFor="isNew" className="ml-2 block text-sm text-gray-900 font-medium">
                                            {t('admin.newProduct')}
                                        </label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isBestseller"
                                            checked={formData.isBestseller}
                                            onChange={(e) => handleInputChange('isBestseller', e.target.checked)}
                                            className="h-4 w-4 text-[#DAA520] border-gray-300 rounded focus:ring-[#DAA520]"
                                        />
                                        <label htmlFor="isBestseller" className="ml-2 block text-sm text-gray-900 font-medium">
                                            {t('admin.bestsellerProduct')}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="bg-white shadow rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {t('admin.productImages')}
                                    {images.length > 0 && (
                                        <span className="ml-2 text-sm text-gray-500">
                                            ({images.length} {images.length === 1 ? 'صورة' : 'صور'})
                                        </span>
                                    )}
                                </h3>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        onClick={addImageFromFile}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {t('admin.uploadFile')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addImageUrl}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        {t('admin.addURL')}
                                    </button>
                                </div>
                            </div>

                            {images.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-500">لم يتم رفع أي صور بعد</p>
                                    <p className="text-xs text-gray-400 mt-1">اضغط على "رفع ملف" لإضافة صور المنتج</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {images.map((url, index) => (
                                        <div
                                            key={index}
                                            className="relative group aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50 hover:border-[#DAA520] transition-all"
                                        >
                                            <img
                                                src={getImageSrc(url)}
                                                alt={`Product image ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/uploads/good.png';
                                                    console.error('Image load error:', url);
                                                }}
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg transform scale-90 group-hover:scale-100"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-white text-xs font-medium text-center">
                                                    صورة {index + 1}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {images.length > 0 && (
                                <p className="mt-4 text-xs text-gray-500 text-center">
                                    💡 نصيحة: الصورة الأولى ستكون الصورة الرئيسية للمنتج
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div className="bg-white shadow rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {language === 'ar' ? 'إدارة المنتج: المقاسات والألوان والمخزون' : 'Product Management: Sizes, Colors & Stock'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {language === 'ar' ? 'إضافة شريط جديد' : 'Add New Row'}
                                </button>
                            </div>

                            {/* Professional Color Palette Helper */}
                            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    {language === 'ar' ? '🎨 لوحة الألوان الجاهزة - اضغط للتحديد' : '🎨 Quick Color Palette - Click to Select'}
                                </h4>
                                <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
                                    {[
                                        { name: 'أبيض / White', value: 'white', hex: '#FFFFFF' },
                                        { name: 'أسود / Black', value: 'black', hex: '#000000' },
                                        { name: 'أحمر / Red', value: 'red', hex: '#FF0000' },
                                        { name: 'أزرق / Blue', value: 'blue', hex: '#0066FF' },
                                        { name: 'أخضر / Green', value: 'green', hex: '#00AA00' },
                                        { name: 'أصفر / Yellow', value: 'yellow', hex: '#FFDD00' },
                                        { name: 'برتقالي / Orange', value: 'orange', hex: '#FF6600' },
                                        { name: 'بنفسجي / Purple', value: 'purple', hex: '#9900FF' },
                                        { name: 'وردي / Pink', value: 'pink', hex: '#FF33CC' },
                                        { name: 'بني / Brown', value: 'brown', hex: '#8B4513' },
                                        { name: 'رمادي / Gray', value: 'gray', hex: '#808080' },
                                        { name: 'كحلي / Navy', value: 'navy', hex: '#000066' },
                                        { name: 'بيج / Beige', value: 'beige', hex: '#DDCCAA' },
                                        { name: 'كريمي / Cream', value: 'cream', hex: '#FFFAA0' },
                                        { name: 'ذهبي / Gold', value: 'gold', hex: '#FFCC00' },
                                        { name: 'فضي / Silver', value: 'silver', hex: '#C0C0C0' },
                                        { name: 'كستنائي / Burgundy', value: 'burgundy', hex: '#800020' },
                                        { name: 'مرجاني / Coral', value: 'coral', hex: '#FF6347' },
                                        { name: 'طرطوزي / Turquoise', value: 'turquoise', hex: '#00CED1' },
                                        { name: 'عاجي / Ivory', value: 'ivory', hex: '#FFFFAA' },
                                        { name: 'خاكي / Khaki', value: 'khaki', hex: '#C3B091' },
                                        { name: 'زيتوني / Olive', value: 'olive', hex: '#556B2F' },
                                        { name: 'كموني / Tan', value: 'tan', hex: '#D2B48C' },
                                        { name: 'لافندر / Lavender', value: 'lavender', hex: '#9966CC' },
                                        { name: 'بيسون / Peach', value: 'peach', hex: '#FFCC99' },
                                        { name: 'سالمون / Salmon', value: 'salmon', hex: '#FF6666' },
                                        { name: 'كحل / Charcoal', value: 'charcoal', hex: '#36454F' },
                                        { name: 'رماد / Ash', value: 'ash', hex: '#B2BEB5' },
                                        { name: 'حجر / Stone', value: 'stone', hex: '#928E85' },
                                        { name: 'نبيذ / Wine', value: 'wine', hex: '#922C3C' },
                                        { name: 'كونياك / Cognac', value: 'cognac', hex: '#B87333' },
                                        { name: 'موف / Taupe', value: 'taupe', hex: '#708090' },
                                    ].map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => {
                                                if (variantRows.length > 0) {
                                                    const lastRow = variantRows[variantRows.length - 1];
                                                    const emptyFieldIdx = lastRow.colorFields.findIndex(f => !f.color || f.color.trim() === '');
                                                    if (emptyFieldIdx !== -1) {
                                                        updateColorField(variantRows.length - 1, emptyFieldIdx, 'color', color.value);
                                                    } else {
                                                        addColorField(variantRows.length - 1);
                                                        setTimeout(() => {
                                                            updateColorField(variantRows.length - 1, lastRow.colorFields.length, 'color', color.value);
                                                        }, 0);
                                                    }
                                                }
                                            }}
                                            className="relative group"
                                            title={color.name}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-[#DAA520] transition-all shadow-md hover:shadow-lg transform hover:scale-110 cursor-pointer"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                                {color.name.split(' / ')[language === 'ar' ? 0 : 1]}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-600 mt-3 text-center">
                                    {language === 'ar'
                                        ? '💡 نصيحة: اضغط على أي لون لتحديده، سيتم إضافته تلقائياً إلى الشريط'
                                        : '💡 Tip: Click any color to select it, it will be automatically added to the row'
                                    }
                                </p>
                            </div>

                            {variantRows.length > 0 ? (
                                <div className="space-y-4">
                                    {variantRows.map((row, rowIndex) => {
                                        // Color mapping function
                                        const getColorHex = (colorName: string): string => {
                                            const colorMap: { [key: string]: string } = {
                                                'white': '#FFFFFF', 'أبيض': '#FFFFFF',
                                                'black': '#000000', 'أسود': '#000000',
                                                'red': '#FF0000', 'أحمر': '#FF0000',
                                                'blue': '#0066FF', 'أزرق': '#0066FF',
                                                'green': '#00AA00', 'أخضر': '#00AA00',
                                                'yellow': '#FFDD00', 'أصفر': '#FFDD00',
                                                'orange': '#FF6600', 'برتقالي': '#FF6600',
                                                'purple': '#9900FF', 'بنفسجي': '#9900FF',
                                                'pink': '#FF33CC', 'وردي': '#FF33CC',
                                                'brown': '#8B4513', 'بني': '#8B4513',
                                                'gray': '#808080', 'رمادي': '#808080',
                                                'navy': '#000066', 'كحلي': '#000066',
                                                'beige': '#DDCCAA', 'بيج': '#DDCCAA',
                                                'cream': '#FFFAA0', 'كريمي': '#FFFAA0',
                                                'gold': '#FFCC00', 'ذهبي': '#FFCC00',
                                                'silver': '#C0C0C0', 'فضي': '#C0C0C0',
                                                'burgundy': '#800020', 'كستنائي': '#800020',
                                                'coral': '#FF6347', 'مرجاني': '#FF6347',
                                                'turquoise': '#00CED1', 'طرطوزي': '#00CED1',
                                                'ivory': '#FFFFAA', 'عاجي': '#FFFFAA',
                                                'khaki': '#C3B091', 'خاكي': '#C3B091',
                                                'olive': '#556B2F', 'زيتوني': '#556B2F',
                                                'tan': '#D2B48C', 'كموني': '#D2B48C',
                                                'lavender': '#9966CC', 'لافندر': '#9966CC',
                                                'peach': '#FFCC99', 'بيسون': '#FFCC99',
                                                'salmon': '#FF6666', 'سالمون': '#FF6666',
                                                'charcoal': '#36454F', 'كحل': '#36454F',
                                                'ash': '#B2BEB5', 'رماد': '#B2BEB5',
                                                'stone': '#928E85', 'حجر': '#928E85',
                                                'wine': '#922C3C', 'نبيذ': '#922C3C',
                                                'cognac': '#B87333', 'كونياك': '#B87333',
                                                'taupe': '#708090', 'موف': '#708090',
                                            };
                                            const normalizedColor = colorName?.toLowerCase().trim();
                                            if (!normalizedColor) return '#808080';
                                            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorName || '')) {
                                                return colorName || '#808080';
                                            }
                                            return colorMap[normalizedColor] || '#808080';
                                        };

                                        return (
                                            <div key={row.id} className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg">
                                                <input
                                                    type="text"
                                                    placeholder={language === 'ar' ? 'المقاس' : 'Size'}
                                                    value={row.size}
                                                    onChange={(e) => updateRowSize(rowIndex, e.target.value)}
                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => addColorField(rowIndex)}
                                                    disabled={!row.size}
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                    title={language === 'ar' ? 'إضافة لون جديد لهذا المقاس' : 'Add color for this size'}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>

                                                {row.colorFields.map((field, fieldIndex) => (
                                                    <div key={fieldIndex} className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder={language === 'ar' ? 'اللون' : 'Color'}
                                                            value={field.color}
                                                            onChange={(e) => updateColorField(rowIndex, fieldIndex, 'color', e.target.value)}
                                                            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                                        />
                                                        {field.color && (
                                                            <div
                                                                className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-md flex-shrink-0"
                                                                style={{ backgroundColor: getColorHex(field.color) }}
                                                                title={field.color}
                                                            />
                                                        )}
                                                        <input
                                                            type="number"
                                                            placeholder={language === 'ar' ? 'المخزون' : 'Stock'}
                                                            value={field.stock}
                                                            onChange={(e) => updateColorField(rowIndex, fieldIndex, 'stock', parseInt(e.target.value) || 0)}
                                                            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DAA520]"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeColorField(rowIndex, fieldIndex)}
                                                            className="p-1.5 text-red-600 hover:text-red-800"
                                                            title={language === 'ar' ? 'حذف هذا اللون' : 'Remove this color'}
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(rowIndex)}
                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded ml-auto"
                                                    title={language === 'ar' ? 'حذف المقاس بالكامل' : 'Remove entire size row'}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">
                                    {language === 'ar' ? 'لا توجد متغيرات مضافة. انقر على "إضافة شريط جديد" لإضافة المقاسات والألوان.' : 'No variants added. Click "Add New Row" to add sizes and colors.'}
                                </p>
                            )}
                        </div>
                    )}



                    {activeTab === 'seo' && (
                        <div className="bg-white shadow rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                {t('admin.seoAndTags')}
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('admin.metaTitle')} (Search Engine Title)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Best Morrocan Djellaba..."
                                        value={formData.metaTitle}
                                        onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#DAA520] focus:border-transparent outline-none transition-all font-medium"
                                    />
                                    <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.recommendedLength')}: 50-60 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('admin.metaTitleAr')}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="أفضل جلابية مغربية..."
                                        value={formData.metaTitleAr}
                                        onChange={(e) => handleInputChange('metaTitleAr', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#DAA520] focus:border-transparent outline-none transition-all font-medium"
                                        dir="rtl"
                                    />
                                    <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.recommendedLength')}: 50-60 {t('admin.characters')}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('admin.metaDescription')} (English)
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Shop premium Morrocan Djellaba..."
                                        value={formData.metaDescription}
                                        onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#DAA520] focus:border-transparent outline-none transition-all font-medium"
                                    />
                                    <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.recommendedLength')}: 150-160 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('admin.metaDescriptionAr')}
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="تسوق أفضل الجلابيات المغربية..."
                                        value={formData.metaDescriptionAr}
                                        onChange={(e) => handleInputChange('metaDescriptionAr', e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#DAA520] focus:border-transparent outline-none transition-all font-medium"
                                        dir="rtl"
                                    />
                                    <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest">{t('admin.recommendedLength')}: 150-160 {t('admin.characters')}</p>
                                </div>

                                <div className="pt-6 border-t border-gray-50">
                                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                                        <span>{t('admin.tags')}</span>
                                        <span className="text-[10px] font-normal text-gray-400 uppercase tracking-widest">{t('admin.commaSeparated')}</span>
                                    </label>
                                    <div className="relative group">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#DAA520] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="djellaba, ramadan, premium..."
                                            value={formData.tags}
                                            onChange={(e) => handleInputChange('tags', e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#DAA520] focus:border-transparent outline-none transition-all font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end space-x-4 pt-6 mt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all"
                        >
                            {t('admin.cancelAction')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-gray-900 hover:bg-black transition-all disabled:opacity-50 shadow-lg"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? t('admin.saving') : t('admin.saveProduct')}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

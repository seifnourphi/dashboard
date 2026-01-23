'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { getCSRFToken } from '@/lib/csrf-client';
import {
    Info,
    Image as ImageIcon,
    Layers,
    Globe,
    Search,
    Tag,
    Save,
    ArrowLeft,
    Upload,
    X,
    Plus,
    Minus,
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

export default function EditProductPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const params = useParams();
    const productId = (params?.id as string) || '';

    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(true);
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

    interface VariantRow {
        id: string;
        size: string;
        colorFields: Array<{ color: string; stock: number }>;
    }

    const [images, setImages] = useState<string[]>([]);
    const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

    useEffect(() => {
        if (!productId) {
            showToast(t('admin.errorLoadingProduct'), 'error', 3000);
            router.push('/products');
            return;
        }
        fetchCategories();
        fetchProduct();
    }, [productId]);

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
            sum + row.colorFields.reduce((cSum, cf) => cSum + (cf.stock || 0), 0), 0
        );
        setFormData(prev => ({
            ...prev,
            stockQuantity: totalStock
        }));
    }, [variantRows]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const categoriesList = data.success && data.data?.categories
                    ? data.data.categories
                    : data.categories || [];
                const validCategories = Array.isArray(categoriesList) ? categoriesList : [];
                setCategories(validCategories);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    const fetchProduct = async () => {
        if (!productId) {
            router.push('/products');
            return;
        }

        try {
            setIsLoadingProduct(true);
            const response = await fetch(`/api/admin/products/${productId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                showToast(t('admin.errorLoadingProduct'), 'error', 3000);
                router.push('/products');
                return;
            }

            const data = await response.json();

            let product = null;
            if (data?.success && data?.data) {
                if (data.data?.product) {
                    product = data.data.product;
                } else {
                    product = data.data;
                }
            } else if (data?.product) {
                product = data.product;
            }

            if (!product) {
                showToast(t('admin.errorLoadingProduct'), 'error', 3000);
                router.push('/products');
                return;
            }

            let categoryId = '';
            if (product?.category) {
                if (typeof product.category === 'object' && product.category !== null) {
                    const catId = product.category._id || product.category.id;
                    categoryId = catId ? String(catId) : '';
                } else {
                    categoryId = String(product.category);
                }
            }

            setFormData({
                name: product?.name || '',
                nameAr: product?.nameAr || '',
                slug: product?.slug || '',
                sku: product?.sku || '',
                description: product?.description || '',
                descriptionAr: product?.descriptionAr || '',
                shortDescription: product?.shortDescription || '',
                shortDescriptionAr: product?.shortDescriptionAr || '',
                price: product?.price || 0,
                salePrice: product?.salePrice && product.salePrice > 0 ? product.salePrice : null,
                discountPercent: product?.discountPercent && product.discountPercent > 0 ? product.discountPercent : null,
                categoryId: categoryId,
                isActive: product?.isActive !== undefined ? product.isActive : true,
                isFeatured: product?.isFeatured !== undefined ? product.isFeatured : false,
                isNew: product?.isNew !== undefined ? product.isNew : false,
                isBestseller: product?.isBestseller !== undefined ? product.isBestseller : false,
                stockQuantity: product?.stockQuantity || 0,
                gender: product?.gender || 'UNISEX',
                metaTitle: product?.metaTitle || '',
                metaTitleAr: product?.metaTitleAr || '',
                metaDescription: product?.metaDescription || '',
                metaDescriptionAr: product?.metaDescriptionAr || '',
                tags: Array.isArray(product?.tags) ? product.tags.join(', ') : (product?.tags || ''),
            });

            const imageUrls = product.images?.map((img: any) => {
                if (typeof img === 'string') return img;
                return img?.url || img?.path || '';
            }).filter((url: string) => url) || [];
            setImages(imageUrls);

            if (product?.variantCombinations && Array.isArray(product.variantCombinations) && product.variantCombinations.length > 0) {
                // Group by size
                const groupedBySize: { [key: string]: Array<{ color: string; stock: number }> } = {};
                product.variantCombinations.forEach((combo: any) => {
                    const size = combo.size || '';
                    if (!groupedBySize[size]) groupedBySize[size] = [];
                    groupedBySize[size].push({
                        color: combo.color || '',
                        stock: combo.stock || 0
                    });
                });

                const rows: VariantRow[] = Object.entries(groupedBySize).map(([size, colorFields], idx) => ({
                    id: String(idx + 1),
                    size: size,
                    colorFields: colorFields
                }));
                setVariantRows(rows);
            } else {
                setVariantRows([{ id: '1', size: '', colorFields: [{ color: '', stock: 0 }] }]);
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            showToast(t('admin.errorLoadingProduct'), 'error', 4000);
            router.push('/products');
        } finally {
            setIsLoadingProduct(false);
        }
    };

    const addVariant = () => {
        setVariantRows(prev => [...prev, {
            id: String(Date.now()),
            size: '',
            colorFields: [{ color: '', stock: 0 }]
        }]);
    };

    const removeRow = (index: number) => {
        setVariantRows(prev => prev.filter((_, i) => i !== index));
    };

    const updateRowSize = (index: number, size: string) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === index ? { ...row, size } : row
        ));
    };

    const addColorField = (rowIndex: number) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === rowIndex ? {
                ...row,
                colorFields: [...row.colorFields, { color: '', stock: 0 }]
            } : row
        ));
    };

    const removeColorField = (rowIndex: number, fieldIndex: number) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === rowIndex ? {
                ...row,
                colorFields: row.colorFields.filter((_, fi) => fi !== fieldIndex)
            } : row
        ));
    };

    const updateColorField = (rowIndex: number, fieldIndex: number, field: string, value: any) => {
        setVariantRows(prev => prev.map((row, i) =>
            i === rowIndex ? {
                ...row,
                colorFields: row.colorFields.map((cf, fi) =>
                    fi === fieldIndex ? { ...cf, [field]: value } : cf
                )
            } : row
        ));
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

            // Convert variantRows back to flat variantCombinations
            const flatCombinations: Array<{ size: string; color: string; stock: number }> = [];
            variantRows.forEach(row => {
                row.colorFields.forEach(cf => {
                    if (cf.color || cf.stock > 0) {
                        flatCombinations.push({
                            size: row.size,
                            color: cf.color,
                            stock: cf.stock
                        });
                    }
                });
            });

            const convertedVariants: Array<{
                type: 'SIZE' | 'COLOR';
                value: string;
                valueAr: string;
                stock: number;
            }> = [];

            const uniqueSizes = new Set<string>();
            const uniqueColors = new Set<string>();

            flatCombinations.forEach(combo => {
                if (combo.size && combo.size.trim()) uniqueSizes.add(combo.size);
                if (combo.color && combo.color.trim()) uniqueColors.add(combo.color);
            });

            uniqueSizes.forEach(size => {
                const sizeCombos = flatCombinations.filter(c => c.size === size);
                const maxStock = sizeCombos.reduce((max, c) => Math.max(max, c.stock), 0);
                convertedVariants.push({ type: 'SIZE', value: size, valueAr: size, stock: maxStock });
            });

            uniqueColors.forEach(color => {
                convertedVariants.push({ type: 'COLOR', value: color, valueAr: color, stock: 0 });
            });

            const csrfToken = await getCSRFToken();

            const productData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                salePrice: finalSalePrice,
                discountPercent: finalDiscountPercent,
                images: images.map((url, index) => ({
                    url,
                    sortOrder: index,
                    alt: formData.name || 'Product Image',
                    altAr: formData.nameAr || 'صورة المنتج'
                })),
                variants: convertedVariants,
                variantCombinations: flatCombinations.map(c => ({
                    size: c.size || null,
                    color: c.color || null,
                    stock: c.stock || 0
                })),
                csrfToken,
            };

            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(productData),
            });

            if (response.ok) {
                showToast(t('admin.productUpdated'), 'success', 3000);
                router.push('/products');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || t('admin.errorUpdatingProduct'), 'error', 4000);
            }
        } catch (error) {
            console.error('Error updating product:', error);
            showToast(t('admin.errorUpdatingProduct'), 'error', 4000);
        } finally {
            setIsSaving(false);
        }
    };

    const addImageUrl = () => {
        const url = prompt(t('admin.enterImageUrl'));
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
                for (const file of Array.from(files)) {
                    try {
                        const token = await getCSRFToken();
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);

                        // Use query parameter instead of body
                        const response = await fetch('/api/upload?type=product', {
                            method: 'POST',
                            headers: {
                                'X-CSRF-Token': token || '',
                            },
                            credentials: 'include',
                            body: formDataUpload,
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.url) {
                                setImages(prev => [...prev, data.url]);
                                console.log('Image uploaded successfully:', data.url);
                            }
                        }
                    } catch (error) {
                        console.error('Error uploading image:', error);
                    }
                }
            }
        };
        input.click();
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    if (isLoadingProduct) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DAA520]"></div>
                </div>
            </AdminLayout>
        );
    }

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
                                {t('admin.editProduct')}
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

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((url, index) => (
                                    <div key={index} className="relative group aspect-square overflow-hidden rounded-lg border border-gray-100">
                                        <img
                                            src={getImageSrc(url)}
                                            alt={`Product image ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'variants' && (
                        <div className="bg-white shadow rounded-lg p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {t('admin.variantsDesc')}
                                </h3>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="inline-flex items-center px-4 py-2 border border-[#DAA520] rounded-md shadow-sm text-sm font-medium text-[#DAA520] bg-white hover:bg-[#FFF8E7] transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('admin.addVariant')}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {variantRows.map((row, rowIndex) => (
                                    <div key={row.id} className="p-6 border border-gray-100 rounded-xl bg-gray-50/50">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="flex-1 max-w-[200px]">
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('admin.size')}</label>
                                                <input
                                                    type="text"
                                                    placeholder="S, M, L, 42..."
                                                    value={row.size}
                                                    onChange={(e) => updateRowSize(rowIndex, e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#DAA520] outline-none transition-all font-bold"
                                                />
                                            </div>
                                            <div className="flex-1 flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={() => addColorField(rowIndex)}
                                                    className="inline-flex items-center px-4 py-2 text-sm font-bold text-[#DAA520] hover:bg-[#FFF8E7] rounded-lg transition-all"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> {t('admin.addColor')}
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeRow(rowIndex)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all self-end"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {row.colorFields.map((field, fieldIndex) => {
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
                                                    <div key={fieldIndex} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                                                        {field.color && (
                                                            <div
                                                                className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                                                                style={{ backgroundColor: getColorHex(field.color) }}
                                                                title={field.color}
                                                            />
                                                        )}
                                                        <input
                                                            type="text"
                                                            placeholder={t('admin.color')}
                                                            value={field.color}
                                                            onChange={(e) => updateColorField(rowIndex, fieldIndex, 'color', e.target.value)}
                                                            className="flex-1 min-w-0 px-2 py-1 border-none bg-transparent focus:ring-0 font-bold placeholder:font-normal"
                                                        />
                                                        <div className="flex items-center gap-2 border-l pl-3">
                                                            <input
                                                                type="number"
                                                                placeholder={t('admin.stock')}
                                                                value={field.stock}
                                                                onChange={(e) => updateColorField(rowIndex, fieldIndex, 'stock', parseInt(e.target.value) || 0)}
                                                                className="w-16 px-1 py-1 border-none bg-transparent focus:ring-0 font-bold text-center"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeColorField(rowIndex, fieldIndex)}
                                                                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {variantRows.length === 0 && (
                                    <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-100 rounded-xl">
                                        <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-400">{t('admin.noVariantsYet')}</p>
                                    </div>
                                )}
                            </div>
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
                            {isSaving ? t('admin.saving') : t('admin.updateProduct')}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

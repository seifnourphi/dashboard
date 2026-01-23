'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { getCSRFToken } from '@/lib/csrf-client';
import {
    Save,
    ArrowLeft,
    FolderOpen
} from 'lucide-react';

interface CategoryFormData {
    name: string;
    nameAr: string;
    slug: string;
    description: string;
    descriptionAr: string;
    isActive: boolean;
    sortOrder: number;
    image: string;
    parentId: string;
}

export default function AddCategoryPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const { csrfToken } = useCSRF();
    const [isSaving, setIsSaving] = useState(false);

    const [categories, setCategories] = useState<{ id: string, name: string, nameAr: string }[]>([]);
    const [formData, setFormData] = useState<CategoryFormData>({
        name: '',
        nameAr: '',
        slug: '',
        description: '',
        descriptionAr: '',
        isActive: true,
        sortOrder: 0,
        image: '',
        parentId: '',
    });

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setCategories(data.data?.categories || []);
            }
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchCategories(); }, []);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleInputChange = (field: keyof CategoryFormData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Auto-generate slug from name
        if (field === 'name' && typeof value === 'string') {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.nameAr || !formData.slug) {
            showToast(t('admin.fillRequiredFields'), 'error', 3000);
            return;
        }

        if (!csrfToken) {
            showToast(t('admin.sessionExpired'), 'error', 3000);
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    csrfToken,
                }),
            });

            if (response.ok) {
                showToast(t('admin.categoryCreated'), 'success', 3000);
                router.push('/categories');
            } else {
                const error = await response.json();
                showToast(error.error || t('admin.errorCreatingCategory'), 'error', 4000);
            }
        } catch (error) {
            console.error('Error creating category:', error);
            showToast(t('admin.errorCreatingCategory'), 'error', 4000);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('admin.back')}
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('admin.addCategory')}
                            </h1>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.basicInformation')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.categoryName')} (English) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.categoryName')} (العربية) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nameAr}
                                    onChange={(e) => handleInputChange('nameAr', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.sortOrder')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.sortOrder}
                                    onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.parentCategory')}
                                </label>
                                <select
                                    value={formData.parentId}
                                    onChange={(e) => handleInputChange('parentId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">{t('admin.none')}</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>{language === 'ar' ? c.nameAr : c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.categoryImage')}
                        </h3>
                        <div className="flex items-center space-x-6">
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                {formData.image ? (
                                    <img src={formData.image} className="w-full h-full object-cover" />
                                ) : (
                                    <FolderOpen className="w-12 h-12 text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    id="cat-img"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const body = new FormData();
                                            body.append('file', file);
                                            const token = await getCSRFToken();
                                            body.append('csrfToken', token || '');
                                            const res = await fetch('/api/upload', {
                                                method: 'POST',
                                                body,
                                                credentials: 'include'
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                handleInputChange('image', data.url);
                                            }
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="cat-img"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                                >
                                    {t('admin.chooseFile')}
                                </label>
                                <p className="mt-2 text-xs text-gray-500">{t('admin.recommendImageSize')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.descriptions')}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.description')} (English)
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.description')} (العربية)
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.descriptionAr}
                                    onChange={(e) => handleInputChange('descriptionAr', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.categorySettings')}
                        </h3>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                {t('admin.activeCategory')}
                            </label>
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {t('admin.cancelAction')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 rounded-md text-white bg-[#DAA520] hover:bg-[#B8860B] disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? t('admin.saving') : t('admin.saveCategory')}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

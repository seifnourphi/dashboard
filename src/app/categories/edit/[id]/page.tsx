'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { useToast } from '@/components/providers/ToastProvider';
import { getCSRFToken } from '@/lib/csrf-client';
import {
    Save,
    ArrowLeft,
    FolderOpen
} from 'lucide-react';

interface Category {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
    description?: string;
    descriptionAr?: string;
    isActive: boolean;
    sortOrder: number;
    image?: string;
    parentId?: string;
}

export default function EditCategoryPage() {
    const { t, language } = useLanguage();
    const { csrfToken } = useCSRF();
    const { showToast } = useToast();
    const router = useRouter();
    const params = useParams();
    const categoryId = params.id as string;
    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [categories, setCategories] = useState<{ id: string, name: string, nameAr: string }[]>([]);

    useEffect(() => {
        fetchCategories();
        if (categoryId) {
            fetchCategory();
        }
    }, [categoryId]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setCategories(data.data?.categories || []);
            }
        } catch (error) { console.error(error); }
    };

    const fetchCategory = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const categoryData = data.success && data.data?.category
                    ? data.data.category
                    : data.category;

                if (categoryData) {
                    setCategory(categoryData);
                } else {
                    showToast(t('admin.categoryNotFound'), 'error', 3000);
                    router.push('/categories');
                }
            } else {
                showToast(t('admin.errorFetchingCategory'), 'error', 3000);
                router.push('/categories');
            }
        } catch (error) {
            console.error('Error fetching category:', error);
            showToast(t('admin.errorFetchingCategory'), 'error', 3000);
            router.push('/categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!category || !csrfToken) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    ...category,
                    csrfToken
                }),
                credentials: 'include',
            });

            if (response.ok) {
                showToast(t('admin.categoryUpdated'), 'success');
                router.push('/categories');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || t('admin.errorSavingChanges'), 'error');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            showToast(t('admin.errorSavingChanges'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!category) return null;

    return (
        <AdminLayout>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => router.push('/categories')}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('admin.back')}
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('admin.editCategory')}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 bg-[#DAA520] text-white rounded-md hover:bg-[#B8860B] disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? t('admin.saving') : t('admin.save')}
                    </button>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.categoryName')} (English) *
                            </label>
                            <input
                                type="text"
                                value={category.name}
                                onChange={(e) => setCategory({ ...category, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.categoryName')} (العربية) *
                            </label>
                            <input
                                type="text"
                                value={category.nameAr}
                                onChange={(e) => setCategory({ ...category, nameAr: e.target.value })}
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
                                value={category.slug}
                                onChange={(e) => setCategory({ ...category, slug: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.sortOrder')}
                            </label>
                            <input
                                type="number"
                                value={category.sortOrder}
                                onChange={(e) => setCategory({ ...category, sortOrder: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.parentCategory')}
                            </label>
                            <select
                                value={category.parentId || ''}
                                onChange={(e) => setCategory({ ...category, parentId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">{t('admin.none')}</option>
                                {categories.filter(c => c.id !== categoryId).map(c => (
                                    <option key={c.id} value={c.id}>{language === 'ar' ? c.nameAr : c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {t('admin.categoryImage')}
                        </h3>
                        <div className="flex items-center space-x-6">
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                                {category.image ? (
                                    <img src={category.image} className="w-full h-full object-cover" />
                                ) : (
                                    <FolderOpen className="w-12 h-12 text-gray-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    id="cat-img-edit"
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
                                                setCategory({ ...category, image: data.url });
                                            }
                                        }
                                    }}
                                />
                                <label
                                    htmlFor="cat-img-edit"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                                >
                                    {t('admin.chooseFile')}
                                </label>
                                <p className="mt-2 text-xs text-gray-500">{t('admin.recommendImageSize')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.description')} (English)
                            </label>
                            <textarea
                                rows={4}
                                value={category.description || ''}
                                onChange={(e) => setCategory({ ...category, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('admin.description')} (العربية)
                            </label>
                            <textarea
                                rows={4}
                                value={category.descriptionAr || ''}
                                onChange={(e) => setCategory({ ...category, descriptionAr: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={category.isActive}
                                onChange={(e) => setCategory({ ...category, isActive: e.target.checked })}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-900">{t('admin.activeCategory')}</span>
                        </label>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

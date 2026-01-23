'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { getCSRFToken } from '@/lib/csrf-client';
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    FolderOpen,
    Eye,
    EyeOff,
    Grid3X3,
    List,
    MoveUp,
    MoveDown
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
    productCount: number;
    createdAt: string;
    updatedAt: string;
}

export default function CategoriesPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const { csrfToken } = useCSRF();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/categories', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const categoriesList = data.success && data.data?.categories
                    ? data.data.categories
                    : data.categories || [];
                setCategories(Array.isArray(categoriesList) ? categoriesList.sort((a, b) => a.sortOrder - b.sortOrder) : []);
            } else {
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        const categoryName = category?.nameAr || category?.name;

        if (!confirm(t('admin.confirmDeleteCategory').replace('{name}', categoryName || ''))) return;

        if (!csrfToken) {
            showToast(t('admin.csrfTokenMissing'), 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
            });

            if (response.ok) {
                setCategories(categories.filter(c => c.id !== categoryId));
                showToast(t('admin.categoryDeleted').replace('{name}', categoryName || ''), 'success', 3000);
            } else {
                const errorData = await response.json();
                showToast(errorData.error || t('admin.errorDeletingCategory'), 'error', 4000);
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast(t('admin.errorDeletingCategory'), 'error', 4000);
        }
    };

    const handleToggleStatus = async (categoryId: string, isActive: boolean) => {
        if (!csrfToken) return;

        try {
            const response = await fetch(`/api/admin/categories/${categoryId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({ isActive: !isActive }),
                credentials: 'include',
            });

            if (response.ok) {
                setCategories(categories.map(c =>
                    c.id === categoryId ? { ...c, isActive: !isActive } : c
                ));
            }
        } catch (error) {
            console.error('Error updating category status:', error);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newCategories = [...categories];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= categories.length) return;

        const category1 = newCategories[index];
        const category2 = newCategories[targetIndex];

        const tempOrder = category1.sortOrder;
        category1.sortOrder = category2.sortOrder;
        category2.sortOrder = tempOrder;

        [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
        setCategories(newCategories);

        try {
            const token = await getCSRFToken();
            await Promise.all([
                fetch(`/api/admin/categories/${category1.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
                    body: JSON.stringify({ sortOrder: category1.sortOrder }),
                    credentials: 'include'
                }),
                fetch(`/api/admin/categories/${category2.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
                    body: JSON.stringify({ sortOrder: category2.sortOrder }),
                    credentials: 'include'
                })
            ]);
            showToast(t('common.success'), 'success');
        } catch (error) {
            showToast(t('common.error'), 'error');
            fetchCategories();
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.nameAr.includes(searchTerm)
    );

    const CategoryCard = ({ category }: { category: Category }) => (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex flex-col gap-1 mr-2 invisible group-hover:visible">
                            <button onClick={(e) => { e.stopPropagation(); handleMove(categories.indexOf(category), 'up'); }} disabled={categories.indexOf(category) === 0} className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-20"><MoveUp className="w-3 h-3 text-gray-400" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleMove(categories.indexOf(category), 'down'); }} disabled={categories.indexOf(category) === categories.length - 1} className="p-1 hover:bg-gray-100 rounded-md disabled:opacity-20"><MoveDown className="w-3 h-3 text-gray-400" /></button>
                        </div>
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {category.nameAr || category.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {category.productCount} {t('admin.products')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleToggleStatus(category.id, category.isActive)}
                            className={`p-2 rounded-md ${category.isActive
                                ? 'text-green-600 bg-green-100 hover:bg-green-200'
                                : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                                }`}
                        >
                            {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        <button
                            onClick={() => router.push(`/categories/edit/${category.id}`)}
                            className="p-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {category.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {category.descriptionAr || category.description}
                    </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>#{category.sortOrder}</span>
                    <span className={`px-2 py-1 rounded-full ${category.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {category.isActive ? t('admin.active') : t('admin.inactive')}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <AdminLayout>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('admin.categories')}</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('admin.manageCategoriesDesc')}
                        </p>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => router.push('/categories/add')}
                            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-[#DAA520] hover:bg-[#B8860B]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('admin.addCategory')}
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder={t('admin.searchCategories')}
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.noCategories')}</h3>
                        <div className="mt-6">
                            <button
                                onClick={() => router.push('/categories/add')}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {t('admin.addCategory')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map((category) => (
                            <div key={category.id} className="group">
                                <CategoryCard category={category} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

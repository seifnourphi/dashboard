'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    Plus,
    Search,
    Filter,
    Edit3,
    Trash2,
    Eye,
    Package,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    MoreHorizontal,
    Download,
    Upload,
    Star,
    Sparkles,
    Crown
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    nameAr: string;
    slug: string;
    sku: string;
    price: number;
    salePrice?: number;
    discountPercent?: number;
    stockQuantity: number;
    isActive: boolean;
    isFeatured: boolean;
    isNew: boolean;
    isBestseller: boolean;
    views: number;
    whatsappClicks: number;
    category: {
        id: string;
        name: string;
        nameAr: string;
    };
    images: Array<{
        id: string;
        url: string;
        alt?: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface ProductsStats {
    total: number;
    active: number;
    outOfStock: number;
    featured: number;
}

export default function ProductsPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const { csrfToken } = useCSRF();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<ProductsStats>({
        total: 0,
        active: 0,
        outOfStock: 0,
        featured: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [categories, setCategories] = useState<Array<{ id: string; name: string; nameAr: string }>>([]);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'confirm' | 'alert' | 'success' | 'info';
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm',
        onConfirm: () => { },
    });

    useEffect(() => {
        fetchProducts();
        fetchStats();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/products', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                // Handle structured response format: {success: true, data: {products: [...]}}
                const productsList = data.success && data.data?.products
                    ? data.data.products
                    : data.products || []; // Fallback for old format
                setProducts(Array.isArray(productsList) ? productsList : []);
            } else {
                console.error('Failed to fetch products:', response.status, response.statusText);
                setProducts([]); // Ensure products is always an array
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]); // Ensure products is always an array
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/products/stats', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                // Handle structured response format: {success: true, data: {stats: {...}}}
                const statsData = data.success && data.data?.stats
                    ? data.data.stats
                    : data.stats || { total: 0, active: 0, outOfStock: 0, featured: 0 };
                setStats(statsData);
            } else {
                console.error('Failed to fetch stats:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/admin/categories', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                // Handle structured response format: {success: true, data: {categories: [...]}}
                const categoriesList = data.success && data.data?.categories
                    ? data.data.categories
                    : data.categories || [];
                setCategories(Array.isArray(categoriesList) ? categoriesList : []);
            } else {
                console.error('Failed to fetch categories:', response.status, response.statusText);
                setCategories([]); // Ensure categories is always an array
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]); // Ensure categories is always an array
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        const product = products.find(p => p.id === productId);
        const productName = product ? (product.nameAr || product.name) : '';

        setConfirmDialog({
            isOpen: true,
            title: t('admin.confirmDelete'),
            message: t('admin.confirmStatusChangeDesc').replace('{status}', productName),
            type: 'confirm',
            confirmText: t('admin.delete'),
            cancelText: t('admin.cancel'),
            onConfirm: async () => {
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));

                if (!csrfToken) {
                    showToast(t('admin.csrfTokenMissing'), 'error');
                    return;
                }

                try {
                    const response = await fetch(`/api/admin/products/${productId}?csrfToken=${encodeURIComponent(csrfToken)}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-Token': csrfToken
                        },
                        credentials: 'include',
                    });

                    if (response.ok) {
                        setProducts(products.filter(p => p.id !== productId));
                        fetchStats();
                        showToast(t('admin.productDeleted'), 'success');
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        showToast(errorData.error || t('admin.errorDeletingProduct'), 'error');
                    }
                } catch (error) {
                    console.error('Error deleting product:', error);
                    showToast(t('admin.errorDeletingProduct'), 'error');
                }
            },
        });
    };

    const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
        if (!csrfToken) {
            showToast(t('admin.csrfTokenMissing'), 'error');
            return;
        }

        try {
            const newStatus = !currentStatus;
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    isActive: newStatus,
                    csrfToken: csrfToken
                }),
            });

            if (response.ok) {
                setProducts(products.map(p =>
                    p.id === productId ? { ...p, isActive: newStatus } : p
                ));
                fetchStats();
            } else {
                console.error('Failed to update product status:', response.status, response.statusText);
                showToast(t('admin.updateError'), 'error', 4000);
            }
        } catch (error) {
            console.error('Error updating product status:', error);
            showToast(t('admin.updateError'), 'error', 4000);
        }
    };

    const handleToggleFeatured = async (productId: string, currentStatus: boolean) => {
        if (!csrfToken) {
            showToast(t('admin.csrfTokenMissing'), 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    isFeatured: !currentStatus,
                    csrfToken: csrfToken
                }),
            });

            if (response.ok) {
                setProducts(products.map(p =>
                    p.id === productId ? { ...p, isFeatured: !currentStatus } : p
                ));
            }
        } catch (error) {
            console.error('Error updating featured status:', error);
        }
    };

    const handleToggleNew = async (productId: string, currentStatus: boolean) => {
        if (!csrfToken) {
            showToast(t('admin.csrfTokenMissing'), 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    isNew: !currentStatus,
                    csrfToken: csrfToken
                }),
            });

            if (response.ok) {
                setProducts(products.map(p =>
                    p.id === productId ? { ...p, isNew: !currentStatus } : p
                ));
            }
        } catch (error) {
            console.error('Error updating new status:', error);
        }
    };

    const handleToggleBestseller = async (productId: string, currentStatus: boolean) => {
        if (!csrfToken) {
            showToast(t('admin.csrfTokenMissing'), 'error');
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken || ''
                },
                credentials: 'include',
                body: JSON.stringify({
                    isBestseller: !currentStatus,
                    csrfToken: csrfToken
                }),
            });

            if (response.ok) {
                setProducts(products.map(p =>
                    p.id === productId ? { ...p, isBestseller: !currentStatus } : p
                ));
            }
        } catch (error) {
            console.error('Error updating bestseller status:', error);
        }
    };

    const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
        if (!product || !product.category) return false;

        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.nameAr?.includes(searchTerm) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = !selectedCategory || product.category?.id === selectedCategory;

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && product.isActive) ||
            (statusFilter === 'inactive' && !product.isActive) ||
            (statusFilter === 'outOfStock' && product.stockQuantity === 0) ||
            (statusFilter === 'featured' && product.isFeatured) ||
            (statusFilter === 'new' && product.isNew) ||
            (statusFilter === 'bestseller' && product.isBestseller);

        return matchesSearch && matchesCategory && matchesStatus;
    });

    const formatPrice = (price: number | null | undefined) => {
        // Handle invalid values (NaN, null, undefined)
        if (price === null || price === undefined || isNaN(Number(price))) {
            return `${t('admin.unit.egp')} 0`;
        }

        // Always use en-US locale for numbers to avoid Arabic numerals (١٠٠ instead of 100)
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(Number(price));

        return `${t('admin.unit.egp')} ${formatted}`;
    };

    const handleExport = () => {
        if (filteredProducts.length === 0) {
            showToast(t('admin.noProducts'), 'info');
            return;
        }

        // Helper function to escape CSV values properly
        const escapeCSV = (value: any): string => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            // Escape quotes by doubling them
            const escaped = str.replace(/"/g, '""');
            // Wrap in quotes if contains comma, newline, or quote
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${escaped}"`;
            }
            return escaped;
        };

        // Create CSV data with proper encoding
        const headers = [
            'Name (EN)',
            'Name (AR)',
            'SKU',
            'Price',
            'Sale Price',
            'Stock',
            'Category',
            'Status',
            'Featured'
        ];

        const rows = filteredProducts.map(product => [
            escapeCSV(product.name),
            escapeCSV(product.nameAr),
            escapeCSV(product.sku),
            escapeCSV(product.price),
            escapeCSV(product.salePrice || ''),
            escapeCSV(product.stockQuantity),
            escapeCSV(product.category.nameAr || product.category.name),
            escapeCSV(product.isActive ? t('admin.active') : t('admin.inactive')),
            escapeCSV(product.isFeatured ? t('common.yes') : t('common.no'))
        ]);

        // Build CSV content
        const csvRows = [
            headers.map(escapeCSV).join(','),
            ...rows.map(row => row.join(','))
        ];

        const csvContent = csvRows.join('\n');

        // Add UTF-8 BOM for proper Arabic encoding in Excel
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;

        // Download CSV with UTF-8 BOM
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `products-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(
            t('admin.exportSuccess').replace('{count}', String(filteredProducts.length)),
            'success'
        );
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                showToast(`سيتم تفعيل خاصية الاستيراد لملف ${file.name} قريباً!`, 'info', 3000);
            }
        };
        input.click();
    };

    const getStatusBadge = (product: Product) => {
        if (!product.isActive) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    {t('admin.inactive')}
                </span>
            );
        }

        if (product.stockQuantity === 0) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {t('admin.outOfStock')}
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t('admin.active')}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('admin.products')}</h1>
                        <nav className="mt-1 text-sm text-gray-500">
                            <ol className="inline-flex items-center space-x-1 rtl:space-x-reverse">
                                <li>
                                    <a href="/" className="hover:text-gray-700">{t('admin.home')}</a>
                                </li>
                                <li className="text-gray-700 font-medium">{t('admin.products')}</li>
                            </ol>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-3 mt-0">
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {t('admin.export')}
                        </button>

                        <button
                            onClick={handleImport}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {t('admin.import')}
                        </button>
                        <button
                            onClick={() => router.push('/products/add')}
                            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-[#DAA520] hover:bg-[#c2931b]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {t('admin.add')}
                        </button>
                    </div>
                </div>

                {/* Quick Add Product Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {t('admin.addProduct')}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {t('admin.addProductDesc')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/products/add')}
                            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105 transition-all duration-200"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            {t('admin.addProduct')}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Package className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('admin.totalProducts')}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.total}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('admin.activeProducts')}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.active}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-6 w-6 text-yellow-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('admin.outOfStock')}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.outOfStock}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="h-6 w-6 text-blue-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {t('admin.featuredProducts')}
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.featured}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex-1 min-w-0">
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                        placeholder={t('admin.searchProducts')}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Filter className="w-4 h-4 mr-2" />
                                    {t('admin.filters')}
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                >
                                    <option value="">{t('admin.allCategories')}</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.nameAr || category.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                >
                                    <option value="all">{t('admin.allStatuses')}</option>
                                    <option value="active">{t('admin.active')}</option>
                                    <option value="inactive">{t('admin.inactive')}</option>
                                    <option value="outOfStock">{t('admin.outOfStock')}</option>
                                    <option value="featured">{t('admin.featured')}</option>
                                    <option value="new">{t('admin.new')}</option>
                                    <option value="bestseller">{t('admin.bestseller')}</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Products Table */}
                    <div className="overflow-hidden">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    لا توجد منتجات
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    ابدأ بإضافة منتجك الأول
                                </p>
                                <div className="mt-8">
                                    <button
                                        onClick={() => router.push('/products/add')}
                                        className="inline-flex items-center px-8 py-4 border border-transparent shadow-xl text-lg font-bold rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transform hover:scale-110 transition-all duration-300"
                                    >
                                        <Plus className="w-6 h-6 mr-3" />
                                        إضافة أول منتج
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                المنتج
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                القسم
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                السعر
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                المخزون
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                الحالة
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                الأداء
                                            </th>
                                            <th className="relative px-6 py-3">
                                                <span className="sr-only">الإجراءات</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredProducts.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            {product.images.length > 0 ? (
                                                                <img
                                                                    className="h-10 w-10 rounded-lg object-cover"
                                                                    src={product.images[0].url}
                                                                    alt={product.images[0].alt || product.name}
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                                                    <Package className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {product.nameAr || product.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {product.sku}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {product.category.nameAr || product.category.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {product.salePrice ? (
                                                            <div>
                                                                <span className="font-medium text-green-600">
                                                                    {formatPrice(product.salePrice)}
                                                                </span>
                                                                <span className="ml-2 text-gray-500 line-through">
                                                                    {formatPrice(product.price)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="font-medium">
                                                                {formatPrice(product.price)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {product.stockQuantity}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(product)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex items-center">
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            {product.views}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <TrendingUp className="w-4 h-4 mr-1" />
                                                            {product.whatsappClicks}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        {/* Featured Toggle */}
                                                        <button
                                                            onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${product.isFeatured
                                                                ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                                                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                                                }`}
                                                            title={product.isFeatured ? 'إزالة من المميز' : 'إضافة للمميز'}
                                                        >
                                                            <Star className="w-3 h-3 mr-1" />
                                                            مميز
                                                        </button>

                                                        {/* New Toggle */}
                                                        <button
                                                            onClick={() => handleToggleNew(product.id, product.isNew)}
                                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${product.isNew
                                                                ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                                                }`}
                                                            title={product.isNew ? 'إزالة من الجديد' : 'إضافة للجديد'}
                                                        >
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            جديد
                                                        </button>

                                                        {/* Bestseller Toggle */}
                                                        <button
                                                            onClick={() => handleToggleBestseller(product.id, product.isBestseller)}
                                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${product.isBestseller
                                                                ? 'text-green-700 bg-green-100 hover:bg-green-200'
                                                                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                                                                }`}
                                                            title={product.isBestseller ? 'إزالة من الأكثر مبيعاً' : 'إضافة للأكثر مبيعاً'}
                                                        >
                                                            <Crown className="w-3 h-3 mr-1" />
                                                            الأكثر مبيعاً
                                                        </button>

                                                        {/* Status Toggle */}
                                                        <button
                                                            onClick={() => handleToggleStatus(product.id, product.isActive)}
                                                            className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded ${product.isActive
                                                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                                                                }`}
                                                        >
                                                            {product.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                                                        </button>

                                                        <button
                                                            onClick={() => router.push(`/products/edit/${product.id}`)}
                                                            className="text-primary-600 hover:text-primary-900"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            />
        </AdminLayout >
    );
}

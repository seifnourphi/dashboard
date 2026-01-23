'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { escapeHtml } from '@/lib/client-validation';
import { getImageSrc } from '@/lib/image-utils';
import {
    Search,
    Filter,
    RefreshCw,
    Eye,
    Package,
    User,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Download,
    X,
    MessageSquare,
    Phone,
    MapPin,
    ChevronDown,
    ChevronRight,
    Trash2
} from 'lucide-react';

interface Order {
    id: string;
    orderReference: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress: string;
    city?: string;
    postalCode?: string;
    quantity: number;
    totalPrice: number;
    subtotal: number;
    shippingPrice: number;
    couponCode?: string | null;
    couponDiscount?: number;
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
    cancellationReason?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    items: Array<{
        productId: string;
        name: string;
        nameAr: string;
        price: number;
        quantity: number;
        size?: string | null;
        color?: string | null;
        image: string;
        sku: string;
        product?: {
            id: string;
            name: string;
            nameAr: string;
            sku: string;
            images: Array<{ url: string; alt?: string }>;
        } | null;
    }>;
    paymentMethod?: 'cash_on_delivery' | 'instapay' | 'vodafone';
    paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
    paymentProofUrl?: string | { data: string; contentType: string; url?: string };
    notes?: string;
    trackingNumber?: string;
    selectedSize?: string | null;
    selectedColor?: string | null;
    name?: string;
    sku?: string;
    image?: string;
    size?: string | null;
    color?: string | null;
    product?: {
        id: string;
        name: string;
        nameAr: string;
        sku: string;
        images: Array<{ url: string; alt?: string }>;
    } | null;
}

interface OrderStats {
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
    todayOrders: number;
    todayRevenue: number;
}

interface GroupedOrder {
    baseReference: string;
    items: Order[];
}

interface ZoomImageState {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
}

const StatusTimeline = ({ status }: { status: Order['status'] }) => {
    const { t } = useLanguage();

    const statusSteps = [
        { key: 'PENDING', label: t('admin.pending'), icon: Clock },
        { key: 'CONFIRMED', label: t('admin.confirmed'), icon: CheckCircle },
        { key: 'SHIPPED', label: t('admin.shipped'), icon: Truck },
        { key: 'OUT_FOR_DELIVERY', label: t('admin.outForDelivery'), icon: Truck },
        { key: 'DELIVERED', label: t('admin.delivered'), icon: CheckCircle },
    ];

    const normalizedStatus = (status || 'PENDING').toUpperCase().trim() as Order['status'];
    const statusIndex = statusSteps.findIndex(s => s.key === normalizedStatus);
    const currentStep = statusIndex >= 0 ? statusIndex : 0;

    return (
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-2">
            {statusSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;

                return (
                    <React.Fragment key={step.key}>
                        <div className={`flex flex-col items-center gap-1 min-w-[60px] ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                            <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-blue-600 scale-125' : ''}`} />
                            <span className="text-[10px] text-center leading-tight whitespace-nowrap">{step.label}</span>
                        </div>
                        {index < statusSteps.length - 1 && (
                            <div className={`w-4 sm:w-8 h-0.5 mt-[-15px] ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default function OrdersPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const { csrfToken } = useCSRF();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<OrderStats>({
        total: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        outForDelivery: 0,
        delivered: 0,
        cancelled: 0,
        todayOrders: 0,
        todayRevenue: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [zoomImage, setZoomImage] = useState<ZoomImageState | null>(null);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
    });
    const [adminUpdates, setAdminUpdates] = useState({
        trackingNumber: '',
        paymentStatus: ''
    });

    useEffect(() => {
        if (selectedOrder) {
            setAdminUpdates({
                trackingNumber: selectedOrder.trackingNumber || '',
                paymentStatus: selectedOrder.paymentStatus || 'pending'
            });
        }
    }, [selectedOrder]);

    const handleAdminUpdate = async () => {
        if (!selectedOrder || !csrfToken) return;
        try {
            const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                    trackingNumber: adminUpdates.trackingNumber,
                    paymentStatus: adminUpdates.paymentStatus,
                }),
            });

            if (response.ok) {
                showToast(t('admin.saveSuccess'), 'success');
                fetchOrders();
                fetchStats();
            } else {
                showToast(t('admin.saveError'), 'error');
            }
        } catch (error) {
            showToast(t('admin.saveError'), 'error');
        }
    };
    const [showLanguageModal, setShowLanguageModal] = useState(false);
    const [orderForInvoice, setOrderForInvoice] = useState<Order | null>(null);

    useEffect(() => {
        fetchOrders();
        fetchStats();
    }, []);

    const formatPrice = (price: number | null | undefined) => {
        if (price === null || price === undefined || isNaN(Number(price))) {
            return `${t('admin.unit.egp')} 0`;
        }
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(Number(price));
        return `${t('admin.unit.egp')} ${formatted}`;
    };

    const formatDate = (dateString: any) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const fetchOrders = async (): Promise<Order[]> => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/orders?limit=1000&page=1', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const responseData = data.success && data.data ? data.data : data;
                let ordersList: Order[] = [];

                if (responseData.orders) {
                    ordersList = responseData.orders;
                }

                setOrders(ordersList);
                return ordersList;
            }
            return [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/orders/stats', {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data.success && data.data?.stats ? data.data.stats : data.stats || {});
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (!csrfToken) return;
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus, csrfToken }),
            });

            if (response.ok) {
                showToast(t('admin.statusUpdated'), 'success');
                fetchOrders();
                fetchStats();
            } else {
                const error = await response.json();
                showToast(error.error || t('admin.errorUpdatingStatus'), 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showToast(t('admin.errorUpdatingStatus'), 'error');
        }
    };

    const askBeforeStatusChange = (order: Order, newStatus: Order['status']) => {
        setConfirmState({
            isOpen: true,
            title: t('admin.confirmStatusChange'),
            message: t('admin.confirmStatusChangeDesc').replace('{status}', t(`admin.${newStatus.toLowerCase()}`)),
            onConfirm: () => {
                handleStatusUpdate(order.id, newStatus);
                setConfirmState({ isOpen: false, title: '', message: '' });
            },
        });
    };

    const getBaseReference = (ref: string) => {
        if (!ref) return '';
        return ref.split('-').slice(0, -2).join('-') || ref.replace(/-[^-]+$/, '');
    };

    const groupedOrders: GroupedOrder[] = useMemo(() => {
        const map = new Map<string, Order[]>();
        orders.forEach(order => {
            const key = order.orderReference;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(order);
        });

        return Array.from(map.entries()).map(([key, items]) => ({
            baseReference: key,
            items: items[0].items.map(item => ({
                ...items[0],
                ...item,
                selectedSize: item.size,
                selectedColor: item.color,
                id: `${items[0].id}-${items[0].items.indexOf(item)}`
            }))
        })).filter(group => {
            const first = group.items[0];
            const matchesSearch = !searchTerm ||
                group.baseReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                first.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                first.customerPhone.includes(searchTerm);

            const matchesStatus = statusFilter === 'all' || first.status === statusFilter.toUpperCase();

            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.items[0].createdAt).getTime() - new Date(a.items[0].createdAt).getTime());
    }, [orders, searchTerm, statusFilter]);

    const modalData = useMemo(() => {
        if (!selectedOrder) return null;
        const base = selectedOrder.orderReference;
        const related = orders.filter(o => o.orderReference === base);
        const first = related[0] || selectedOrder;

        // Aggregate all items from all related orders
        const allItems = related.flatMap(order =>
            order.items.map((item, index) => ({
                ...item,
                orderId: order.id,
                uniqueId: `${order.id}-${index}`
            }))
        );

        const subTotal = allItems.reduce((s, item) => s + (item.price * item.quantity), 0);
        const shipping = related.reduce((s, o) => s + (o.shippingPrice || 0), 0);
        const discount = first.couponDiscount || 0;

        return {
            base,
            related,
            allItems,
            first,
            subTotal,
            shipping,
            discount,
            total: subTotal + shipping - discount,
            totalQty: allItems.reduce((s, item) => s + item.quantity, 0)
        };
    }, [selectedOrder, orders]);

    const getStatusBadge = (status: string) => {
        const config: any = {
            PENDING: { color: 'bg-yellow-100 text-yellow-800', text: t('admin.pending') },
            CONFIRMED: { color: 'bg-blue-100 text-blue-800', text: t('admin.confirmed') },
            SHIPPED: { color: 'bg-purple-100 text-purple-800', text: t('admin.shipped') },
            OUT_FOR_DELIVERY: { color: 'bg-orange-100 text-orange-800', text: t('admin.outForDelivery') },
            DELIVERED: { color: 'bg-green-100 text-green-800', text: t('admin.delivered') },
            CANCELLED: { color: 'bg-red-100 text-red-800', text: t('admin.cancelled') },
        };
        const s = config[status.toUpperCase()] || config.PENDING;
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.text}</span>;
    };

    const handleDownloadInvoice = (order: Order) => {
        setOrderForInvoice(order);
        setShowLanguageModal(true);
    };

    const downloadInvoice = async (lang: 'ar' | 'en') => {
        if (!orderForInvoice) return;

        try {
            showToast(t('admin.generatingInvoice'), 'info');
            const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
            const response = await fetch(`/api/account/orders/${orderForInvoice.id}/invoice?lang=${lang}&format=pdf`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${orderForInvoice.orderReference}-${lang}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast(t('admin.invoiceDownloaded'), 'success');
        } catch (error) {
            console.error('Invoice download error:', error);
            showToast(t('admin.errorDownloadingInvoice'), 'error');
        } finally {
            setShowLanguageModal(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{t('admin.manageOrders')}</h1>
                        <p className="text-sm text-gray-500">{t('admin.manageOrdersDesc')}</p>
                    </div>
                    <button onClick={() => { fetchOrders(); fetchStats(); }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {t('admin.refreshData')}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { label: t('admin.total'), value: stats.total, color: 'text-gray-900' },
                        { label: t('admin.pending'), value: stats.pending, color: 'text-yellow-600' },
                        { label: t('admin.confirmed'), value: stats.confirmed, color: 'text-blue-600' },
                        { label: t('admin.shipped'), value: stats.shipped, color: 'text-purple-600' },
                        { label: t('admin.delivered'), value: stats.delivered, color: 'text-green-600' },
                        { label: t('admin.cancelled'), value: stats.cancelled, color: 'text-red-600' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-xs text-gray-500 font-medium mb-1">{s.label}</div>
                            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('admin.searchOrders')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                                <Filter className="w-4 h-4" />
                                {t('admin.filters')}
                            </button>
                        </div>
                        {showFilters && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-lg outline-none">
                                    <option value="all">{t('admin.allStatuses')}</option>
                                    {['PENDING', 'CONFIRMED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(s => (
                                        <option key={s} value={s}>{t(`admin.${s.toLowerCase()}`)}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right sm:text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
                                <tr>
                                    <th className="px-6 py-4">{t('admin.order')}</th>
                                    <th className="px-6 py-4">{t('admin.customer')}</th>
                                    <th className="px-6 py-4">{t('admin.total')}</th>
                                    <th className="px-6 py-4">{t('admin.status')}</th>
                                    <th className="px-6 py-4">{t('admin.date')}</th>
                                    <th className="px-6 py-4 text-center">{t('admin.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {groupedOrders.map((group) => {
                                    const first = group.items[0];
                                    const isExpanded = expandedGroups.has(group.baseReference);
                                    return (
                                        <React.Fragment key={group.baseReference}>
                                            <tr className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {group.items.length > 1 && (
                                                            <button onClick={() => {
                                                                const newSet = new Set(expandedGroups);
                                                                isExpanded ? newSet.delete(group.baseReference) : newSet.add(group.baseReference);
                                                                setExpandedGroups(newSet);
                                                            }} className="p-1 hover:bg-gray-200 rounded transition-colors">
                                                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            </button>
                                                        )}
                                                        <span className="font-bold text-gray-900">#{group.baseReference}</span>
                                                    </div>
                                                    {group.items.length > 1 && <div className="text-[10px] text-blue-600 font-medium mt-1">{`${group.items.length} ${t('admin.items')}`}</div>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{escapeHtml(first.customerName)}</div>
                                                    <div className="text-xs text-gray-500">{first.customerPhone}</div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-[#DAA520]">{formatPrice(group.items.reduce((s, o) => s + o.totalPrice, 0) + (first.shippingPrice || 0) - (first.couponDiscount || 0))}</td>
                                                <td className="px-6 py-4">{getStatusBadge(first.status)}</td>
                                                <td className="px-6 py-4 text-xs text-gray-500">{formatDate(first.createdAt)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setSelectedOrder(first)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => window.open(`https://wa.me/${first.customerPhone.replace(/\D/g, '')}`, '_blank')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && group.items.map((item, idx) => (
                                                <tr key={idx} className="bg-gray-50/50 text-[13px] border-l-4 border-blue-400">
                                                    <td className="px-6 py-3 pl-12 text-gray-400">#{item.orderReference.split('-').pop()}</td>
                                                    <td className="px-6 py-3" colSpan={3}>
                                                        <div className="flex items-center gap-3">
                                                            {item.product?.images?.[0]?.url && <img src={item.product.images[0].url} className="w-8 h-8 rounded object-cover" />}
                                                            <div>
                                                                <div className="font-medium">{item.product?.nameAr || item.product?.name || item.name}</div>
                                                                <div className="text-[11px] text-gray-500">{t('admin.quantity')}: {item.quantity} | {item.selectedSize || item.size} | {item.selectedColor || item.color}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 font-bold">{formatPrice(item.totalPrice)}</td>
                                                    <td className="px-6 py-3 text-center">
                                                        <button onClick={() => setSelectedOrder(item)} className="text-blue-500 hover:underline">{t('admin.viewDetails')}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {modalData && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 sm:px-6 py-4 border-b flex justify-between items-center text-right sm:text-left">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">#{modalData.base}</h2>
                                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{formatDate(modalData.first.createdAt)}</div>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-6 custom-scrollbar">
                                <div className="space-y-8">
                                    {/* Order Info Summary */}
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 sm:hidden">
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{t('admin.order')}</div>
                                            <div className="text-sm font-black text-gray-900">#{modalData.first.orderReference}</div>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{t('admin.status')}</div>
                                            {getStatusBadge(modalData.first.status)}
                                        </div>
                                    </div>

                                    {/* Status Section */}
                                    <div className="hidden sm:block">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xs font-black border-l-4 border-blue-500 pl-3 uppercase tracking-tighter text-gray-400">{t('admin.status')}</h3>
                                            {getStatusBadge(modalData.first.status)}
                                        </div>
                                        <StatusTimeline status={modalData.first.status} />
                                    </div>

                                    <div className="sm:hidden">
                                        <StatusTimeline status={modalData.first.status} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">
                                                {language === 'ar' ? 'الحالة' : 'Status'}
                                            </h3>
                                            {getStatusBadge(modalData.first.status)}
                                        </div>
                                        <StatusTimeline status={modalData.first.status} />
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">
                                            {language === 'ar' ? 'تم الإنشاء بواسطة' : 'Created By'}
                                        </h3>
                                        <div className="flex items-center justify-end gap-2 text-gray-700">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="font-bold">{escapeHtml(modalData.first.customerName)}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{escapeHtml(modalData.first.customerPhone)}</div>
                                    </div>
                                </div>

                                {/* Customer & Shipping Info */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-sm font-bold border-l-4 border-[#DAA520] pl-3 mb-4">{t('admin.customerInfo')}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('admin.customer')}</div>
                                                    <div className="text-sm font-bold text-gray-900">{escapeHtml(modalData.first.customerName)}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('admin.phone')}</div>
                                                    <div className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => window.open(`tel:${modalData.first.customerPhone}`, '_self')}>
                                                        {escapeHtml(modalData.first.customerPhone)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100/50">
                                            <div className="bg-white p-1.5 rounded-lg shadow-sm">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('admin.address')}</div>
                                                <div className="text-sm font-bold text-gray-900 leading-relaxed">{escapeHtml(modalData.first.customerAddress)}</div>
                                                <div className="text-xs text-gray-500 mt-1.5 bg-gray-100/50 px-2 py-1 rounded inline-block">
                                                    {modalData.first.city && `${escapeHtml(modalData.first.city)}`}
                                                    {modalData.first.postalCode && ` (${escapeHtml(modalData.first.postalCode)})`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Products Info */}
                                <div className="border-t border-gray-100 pt-6">
                                    <div className="text-sm font-bold border-l-4 border-blue-500 pl-3 mb-4">{t('admin.orderItems')} ({modalData.allItems.length})</div>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                        {modalData.allItems.map(item => (
                                            <div key={item.uniqueId} className="flex flex-col xs:flex-row items-start xs:items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-blue-100 transition-all group hover:shadow-md bg-white">
                                                <div
                                                    className="relative flex-shrink-0 cursor-zoom-in group/img mx-auto xs:mx-0"
                                                    onClick={() => setZoomImage({ url: getImageSrc(item.product?.images?.[0]?.url || item.image) })}
                                                >
                                                    <img
                                                        src={getImageSrc(item.product?.images?.[0]?.url || item.image)}
                                                        className="w-20 h-20 xs:w-16 xs:h-16 rounded-xl object-cover bg-gray-50 border border-gray-100 transition-transform group-hover/img:scale-105"
                                                        alt={item.product?.name || item.name}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                                        <div className="bg-white/90 p-1.5 rounded-full shadow-lg">
                                                            <Eye className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 w-full xs:w-auto text-center xs:text-left">
                                                    <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                                        {item.product?.nameAr || item.product?.name || item.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap justify-center xs:justify-start gap-x-2 gap-y-1">
                                                        <span className="flex items-center gap-1 font-semibold text-gray-700"><Package className="w-3 h-3" /> {item.quantity} x {formatPrice(item.price)}</span>
                                                        {(item.size || item.color) && (
                                                            <div className="flex gap-1.5">
                                                                {item.size && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter uppercase whitespace-nowrap">SIZE: {item.size}</span>}
                                                                {item.color && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[9px] font-black tracking-tighter uppercase whitespace-nowrap">COLOR: {item.color}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.sku && <div className="text-[10px] text-gray-400 mt-1.5 font-mono">SKU: {item.sku}</div>}
                                                </div>
                                                <div className="text-right font-black text-lg text-gray-900 w-full xs:w-auto border-t xs:border-t-0 pt-2 xs:pt-0 mt-2 xs:mt-0">{formatPrice(item.price * item.quantity)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Section */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-sm font-bold border-l-4 border-green-500 pl-3 mb-4">{t('admin.paymentMethod')}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="bg-green-50 p-2 rounded-xl">
                                                    <Clock className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase">{t('admin.method')}</div>
                                                    <div className="font-bold text-gray-900">{t(`admin.${modalData.first.paymentMethod || 'cash_on_delivery'}`)}</div>
                                                </div>
                                                {modalData.first.paymentStatus && (
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${modalData.first.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                                        modalData.first.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {t(`admin.${modalData.first.paymentStatus}`)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t('admin.trackingNumber')}</div>
                                                    <div className="px-3 py-2 text-sm bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-700 font-mono inline-block">
                                                        {modalData.first.trackingNumber || modalData.first.orderReference || t('admin.autoGenerated')}
                                                    </div>
                                                </div>
                                                {modalData.first.notes && (
                                                    <div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">{t('admin.orderNotes')}</div>
                                                        <div className="text-xs text-gray-600 bg-blue-50/50 p-3 rounded-xl border-l-4 border-blue-400 italic leading-relaxed">
                                                            "{modalData.first.notes}"
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {modalData.first.paymentProofUrl && (
                                            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-100 rounded-3xl group bg-gray-50/30">
                                                <div className="text-[10px] text-gray-400 font-bold uppercase mb-3 flex items-center gap-2">
                                                    <Eye className="w-3 h-3" />
                                                    {t('admin.paymentProof')}
                                                </div>
                                                <div
                                                    className="relative cursor-zoom-in w-full max-w-[160px] transform transition-all group-hover:scale-105 active:scale-95"
                                                    onClick={() => setZoomImage({ url: getImageSrc(modalData.first.paymentProofUrl!) })}
                                                >
                                                    <img
                                                        src={getImageSrc(modalData.first.paymentProofUrl)}
                                                        className="w-full aspect-square object-cover rounded-2xl shadow-xl border-4 border-white group-hover:border-blue-400 transition-colors"
                                                        alt={t('admin.paymentProof')}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                        <div className="bg-white p-2 rounded-full shadow-lg">
                                                            <Eye className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setZoomImage({ url: getImageSrc(modalData.first.paymentProofUrl!) })}
                                                    className="mt-4 text-[10px] bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm text-blue-600 font-bold hover:shadow-md transition-all active:scale-95"
                                                >
                                                    {t('admin.viewLargeImage')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Order Summary - synced with old style */}
                                <div className="border-t border-gray-100 pt-8">
                                    <div className="max-w-xs sm:max-w-sm ml-auto space-y-4">
                                        <div className="flex justify-between items-center text-gray-500">
                                            <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">{t('admin.subtotal')}</span>
                                            <span className="font-black text-gray-900">{formatPrice(modalData.subTotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-gray-500">
                                            <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px]">{t('admin.shipping')}</span>
                                            <span className="font-black text-gray-900">{formatPrice(modalData.shipping)}</span>
                                        </div>
                                        {modalData.discount > 0 && (
                                            <div className="flex justify-between items-center text-green-600 bg-green-50/50 px-3 py-2 rounded-xl border border-dashed border-green-200">
                                                <span className="font-bold uppercase tracking-widest text-[10px]">{t('admin.discount')}</span>
                                                <span className="font-black">-{formatPrice(modalData.discount)}</span>
                                            </div>
                                        )}
                                        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-2">
                                            <span className="text-xl font-black text-gray-900 uppercase tracking-tighter">{t('admin.grandTotal')}</span>
                                            <div className="text-center sm:text-right">
                                                <div className="text-3xl font-black text-[#DAA520] tracking-tighter leading-none">{formatPrice(modalData.total)}</div>
                                                <div className="text-[10px] text-gray-400 font-black uppercase mt-2 tracking-widest opacity-60">{language === 'ar' ? 'شامل الضرائب والخدمة' : 'INCL. TAXES & FEES'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100 pb-4">
                                    <div className="w-full sm:w-auto">
                                        <button
                                            onClick={() => handleDownloadInvoice(modalData.first)}
                                            className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200 flex items-center justify-center gap-3 group"
                                        >
                                            <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                            <span className="uppercase tracking-widest text-xs">{t('admin.invoice')}</span>
                                        </button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        {modalData.first.status === 'PENDING' && (
                                            <>
                                                <button onClick={() => askBeforeStatusChange(modalData.first, 'CONFIRMED')} className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200 uppercase tracking-widest text-xs">{t('admin.confirmOrder')}</button>
                                                <button onClick={() => askBeforeStatusChange(modalData.first, 'CANCELLED')} className="w-full sm:w-auto px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-100 transition-all active:scale-95 uppercase tracking-widest text-xs">{t('admin.cancel')}</button>
                                            </>
                                        )}
                                        {modalData.first.status === 'CONFIRMED' && <button onClick={() => askBeforeStatusChange(modalData.first, 'SHIPPED')} className="w-full sm:w-auto px-10 py-4 bg-purple-600 text-white rounded-2xl font-black hover:bg-purple-700 transition-all active:scale-95 shadow-xl shadow-purple-200 uppercase tracking-widest text-xs">{t('admin.markShipped')}</button>}
                                        {modalData.first.status === 'SHIPPED' && <button onClick={() => askBeforeStatusChange(modalData.first, 'OUT_FOR_DELIVERY')} className="w-full sm:w-auto px-10 py-4 bg-orange-600 text-white rounded-2xl font-black hover:bg-orange-700 transition-all active:scale-95 shadow-xl shadow-orange-200 uppercase tracking-widest text-xs">{t('admin.outForDelivery')}</button>}
                                        {modalData.first.status === 'OUT_FOR_DELIVERY' && <button onClick={() => askBeforeStatusChange(modalData.first, 'DELIVERED')} className="w-full sm:w-auto px-10 py-4 bg-green-600 text-white rounded-2xl font-black hover:bg-green-700 transition-all active:scale-95 shadow-xl shadow-green-200 uppercase tracking-widest text-xs">{t('admin.markDelivered')}</button>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showLanguageModal && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowLanguageModal(false)}>
                        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-10 transform scale-100 transition-transform active:scale-95" onClick={e => e.stopPropagation()}>
                            <div className="bg-primary-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Download className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-2xl font-black mb-2 text-center text-gray-900">{t('admin.invoiceLanguage')}</h3>
                            <p className="text-sm text-gray-500 text-center mb-8">{language === 'ar' ? 'اختر اللغة المفضلة لتحميل الفاتورة' : 'Choose your preferred language for the invoice'}</p>
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => downloadInvoice('ar')} className="py-4 bg-[#DAA520] text-white rounded-2xl font-black hover:bg-[#c2931b] transition-all active:scale-95 shadow-lg shadow-primary-100">العربية</button>
                                <button onClick={() => downloadInvoice('en')} className="py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all active:scale-95 shadow-lg shadow-gray-200">English</button>
                            </div>
                            <button onClick={() => setShowLanguageModal(false)} className="mt-6 w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">{t('common.cancel')}</button>
                        </div>
                    </div>
                )}

                <ConfirmDialog
                    isOpen={confirmState.isOpen}
                    type="confirm"
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    onConfirm={confirmState.onConfirm || (() => { })}
                    onCancel={() => setConfirmState({ isOpen: false, title: '', message: '' })}
                />

                {/* Advanced Zoom Modal */}
                {zoomImage && (
                    <div
                        className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md overflow-hidden"
                        onClick={() => setZoomImage(null)}
                    >
                        <div className="absolute top-6 right-6 flex items-center gap-4 z-[110]">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement('a');
                                    link.href = zoomImage.url;
                                    link.download = 'payment-proof.png';
                                    link.click();
                                }}
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-xl backdrop-blur-sm border border-white/10 active:scale-90"
                                title="Download"
                            >
                                <Download className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setZoomImage(null)}
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all shadow-xl backdrop-blur-sm border border-white/10 active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div
                            className="relative w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={zoomImage.url}
                                alt="Zoomed"
                                className="max-w-[95%] max-h-[95%] object-contain rounded-xl shadow-2xl transition-transform duration-300"
                                style={{
                                    transform: `scale(${zoomImage.scale || 1}) translate(${zoomImage.x || 0}px, ${zoomImage.y || 0}px)`,
                                    cursor: zoomImage.scale && zoomImage.scale > 1 ? 'grab' : 'zoom-in'
                                }}
                                onDoubleClick={() => {
                                    setZoomImage(prev => prev ? {
                                        ...prev,
                                        scale: (prev.scale || 1) > 1 ? 1 : 2.5,
                                        x: 0,
                                        y: 0
                                    } : null);
                                }}
                            />

                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl z-[110]">
                                <button
                                    onClick={() => setZoomImage(prev => prev ? { ...prev, scale: Math.max((prev.scale || 1) - 0.5, 1), x: 0, y: 0 } : null)}
                                    className="p-2 text-white/60 hover:text-white transition-colors"
                                >
                                    <ChevronDown className="w-8 h-8" />
                                </button>
                                <span className="text-white font-black text-xl min-w-[4rem] text-center">
                                    {Math.round((zoomImage.scale || 1) * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoomImage(prev => prev ? { ...prev, scale: Math.min((prev.scale || 1) + 0.5, 4), x: 0, y: 0 } : null)}
                                    className="p-2 text-white/60 hover:text-white transition-colors"
                                >
                                    <ChevronDown className="w-8 h-8 transform rotate-180" />
                                </button>
                                <div className="w-px h-6 bg-white/10 mx-2" />
                                <button
                                    onClick={() => setZoomImage(prev => prev ? { ...prev, scale: 1, x: 0, y: 0 } : null)}
                                    className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                                >
                                    {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

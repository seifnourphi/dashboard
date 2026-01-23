'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    Eye,
    MousePointer,
    Calendar,
    BarChart3,
    PieChart,
    Activity,
    Target,
    Award,
    Clock,
    MapPin,
    Smartphone,
    Download,
    RefreshCw,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';

interface AnalyticsData {
    summary: {
        totalRevenue: number;
        totalOrders: number;
        totalViews: number;
        totalWhatsappClicks: number;
        conversionRate: number;
        averageOrderValue: number;
        revenueGrowth: number;
        ordersGrowth: number;
    };
    topProducts: Array<{
        id: string;
        name: string;
        nameAr: string;
        sku: string;
        views: number;
        whatsappClicks: number;
        orders: number;
        revenue: number;
        conversionRate: number;
    }>;
    recentOrders: Array<{
        id: string;
        orderReference: string;
        customerName: string;
        totalPrice: number;
        status: string;
        createdAt: string;
        product: {
            name: string;
            nameAr: string;
        };
    }>;
    dailyStats: Array<{
        date: string;
        revenue: number;
        orders: number;
        views: number;
        clicks: number;
    }>;
    topCountries: Array<{
        country: string;
        orders: number;
        revenue: number;
    }>;
    deviceStats: {
        mobile: number;
        desktop: number;
        tablet: number;
    };
}

export default function AnalyticsPage() {
    const { t, language } = useLanguage();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                const analyticsData = data.success && data.data?.analytics
                    ? data.data.analytics
                    : data.analytics || data;
                setAnalytics(analyticsData);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const RevenueAreaChart = ({ values }: { values: number[] }) => {
        const width = 600;
        const height = 240;
        const padding = 32;
        const max = Math.max(1, ...values);
        const min = Math.min(0, ...values);
        const range = Math.max(1, max - min);
        const stepX = (width - padding * 2) / Math.max(1, values.length - 1);
        const points = values.map((v, i) => {
            const x = padding + i * stepX;
            const y = padding + (height - padding * 2) * (1 - (v - min) / range);
            return [x, y] as const;
        });
        const path = points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
        const areaPath = `${path} L ${padding + (values.length - 1) * stepX} ${height - padding} L ${padding} ${height - padding} Z`;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
                <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {Array.from({ length: 5 }).map((_, i) => {
                    const y = padding + ((height - padding * 2) / 4) * i;
                    return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />;
                })}
                <path d={areaPath} fill="url(#revFill)" />
                <path d={path} fill="none" stroke="#3b82f6" strokeWidth="3" />
                {points.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />
                ))}
            </svg>
        );
    };

    const OrdersLineChart = ({ values }: { values: number[] }) => {
        const width = 600;
        const height = 240;
        const padding = 32;
        const max = Math.max(1, ...values);
        const min = Math.min(0, ...values);
        const range = Math.max(1, max - min);
        const stepX = (width - padding * 2) / Math.max(1, values.length - 1);
        const points = values.map((v, i) => {
            const x = padding + i * stepX;
            const y = padding + (height - padding * 2) * (1 - (v - min) / range);
            return [x, y] as const;
        });
        const path = points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
                {Array.from({ length: 5 }).map((_, i) => {
                    const y = padding + ((height - padding * 2) / 4) * i;
                    return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />;
                })}
                <path d={path} fill="none" stroke="#10b981" strokeWidth="3" />
                {points.map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#10b981" />
                ))}
            </svg>
        );
    };

    const ViewsClicksChart = ({ views, clicks }: { views: number[]; clicks: number[] }) => {
        const width = 600;
        const height = 240;
        const padding = 32;
        const max = Math.max(1, ...views, ...clicks);
        const min = Math.min(0, ...views, ...clicks);
        const range = Math.max(1, max - min);
        const stepX = (width - padding * 2) / Math.max(1, views.length - 1);

        const viewsPoints = views.map((v, i) => [padding + i * stepX, padding + (height - padding * 2) * (1 - (v - min) / range)]);
        const clicksPoints = clicks.map((v, i) => [padding + i * stepX, padding + (height - padding * 2) * (1 - (v - min) / range)]);

        const viewsPath = viewsPoints.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
        const clicksPath = clicksPoints.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
                {Array.from({ length: 5 }).map((_, i) => {
                    const y = padding + ((height - padding * 2) / 4) * i;
                    return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,2" />;
                })}
                <path d={viewsPath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
                <path d={clicksPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
            </svg>
        );
    };

    const formatPrice = (price: number | null | undefined) => {
        if (price === null || price === undefined || isNaN(Number(price))) {
            return t('admin.unit.egp') + ' 0';
        }
        const formatted = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Number(price));
        return `${formatted} ${t('admin.unit.egp')}`;
    };

    const formatPercentage = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        }).format(value / 100);
    };

    const getGrowthIndicator = (growth: number) => {
        if (growth > 0) return <div className="flex items-center text-green-600 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold"><TrendingUp className="w-3 h-3 mr-1" />+{growth.toFixed(1)}%</div>;
        if (growth < 0) return <div className="flex items-center text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold"><TrendingDown className="w-3 h-3 mr-1" />{growth.toFixed(1)}%</div>;
        return <div className="text-gray-400 text-xs">0%</div>;
    };

    const exportToCSV = () => {
        if (!analytics) return;
        const rows = [
            ['Date', 'Revenue', 'Orders', 'Views', 'Clicks'],
            ...analytics.dailyStats.map(s => [s.date, s.revenue, s.orders, s.views, s.clicks])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <RefreshCw className="w-12 h-12 text-[#DAA520] animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">{t('admin.crunchingNumbers')}</p>
                </div>
            </AdminLayout>
        );
    }

    if (!analytics) return null;

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('admin.analyticsGrowth')}</h1>
                        <p className="text-gray-500 mt-1">{t('admin.monitorPerformance')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-4 py-2 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#DAA520] font-medium"
                        >
                            <option value="1d">{t('admin.today')}</option>
                            <option value="7d">{t('admin.last7Days')}</option>
                            <option value="30d">{t('admin.last30Days')}</option>
                            <option value="90d">{t('admin.lastQuarter')}</option>
                        </select>
                        <button onClick={exportToCSV} className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: t('admin.revenue'), value: formatPrice(analytics.summary.totalRevenue), growth: analytics.summary.revenueGrowth, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: t('admin.orders'), value: analytics.summary.totalOrders, growth: analytics.summary.ordersGrowth, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: t('admin.visits'), value: analytics.summary.totalViews.toLocaleString(), growth: 0, icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: t('admin.converRate'), value: formatPercentage(analytics.summary.conversionRate), growth: 0, icon: Target, color: 'text-[#DAA520]', bg: 'bg-yellow-50' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                {item.growth !== 0 && getGrowthIndicator(item.growth)}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 mb-1">{item.value}</div>
                            <div className="text-sm font-medium text-gray-500">{item.label}</div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50 group-hover:bg-[#DAA520] transition-colors" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            {t('admin.revenueTrend')}
                        </h3>
                        <RevenueAreaChart values={analytics.dailyStats.map(s => s.revenue)} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-green-500" />
                            {t('admin.ordersTrend')}
                        </h3>
                        <OrdersLineChart values={analytics.dailyStats.map(s => s.orders)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-6">{t('admin.topPerformingProducts')}</h3>
                        <div className="space-y-4">
                            {analytics.topProducts.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center font-bold text-gray-400">#{i + 1}</div>
                                        <div>
                                            <div className="font-bold text-gray-900">{p.nameAr || p.name}</div>
                                            <div className="text-xs text-gray-500">SKU: {p.sku}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-green-600">{formatPrice(p.revenue)}</div>
                                        <div className="text-xs text-gray-500">{p.orders} {t('admin.unit.orders')}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold mb-6">{t('admin.conversionFunnel')}</h3>
                        <div className="space-y-6">
                            {[
                                { label: t('admin.mobileUsers'), value: analytics.deviceStats.mobile, color: 'bg-blue-500' },
                                { label: t('admin.desktopUsers'), value: analytics.deviceStats.desktop, color: 'bg-[#DAA520]' },
                                { label: t('admin.tabletUsers'), value: analytics.deviceStats.tablet, color: 'bg-purple-500' },
                            ].map((item, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>{item.label}</span>
                                        <span>{item.value}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                            <div className="mt-8 pt-6 border-t">
                                <p className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">{t('admin.growthSummary')}</p>
                                <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm leading-relaxed">
                                    {t('admin.analyticsSummary')
                                        .replace('{revenueGrowth}', analytics.summary.revenueGrowth.toFixed(1))
                                        .replace('{mobilePercent}', analytics.deviceStats.mobile.toString())}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
    ShoppingBag,
    Users,
    TrendingUp,
    MessageSquare,
    Eye,
    Search,
    RefreshCw,
    Image as ImageIcon,
    Plus,
    ArrowRight,
    Zap,
    Ticket,
    Layout,
    Star,
    Settings,
    Bell
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const fetchStats = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/analytics?range=30d', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setStats(data.success && data.data?.analytics ? data.data.analytics : data.analytics || data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const cards = [
        { title: t('admin.totalRevenue'), value: stats?.summary?.totalRevenue ?? 0, icon: TrendingUp, color: 'text-green-500', unit: t('admin.unit.egp') },
        { title: t('admin.totalOrders'), value: stats?.summary?.totalOrders ?? 0, icon: ShoppingBag, color: 'text-blue-500', unit: t('admin.unit.orders') },
        { title: t('admin.globalViews'), value: stats?.summary?.totalViews ?? 0, icon: Eye, color: 'text-[#DAA520]', unit: t('admin.unit.visits') },
        { title: t('admin.customerBase'), value: stats?.summary?.totalUsers ?? '...', icon: Users, color: 'text-purple-500', unit: t('admin.unit.users') },
    ];

    return (
        <AdminLayout>
            <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gray-900 rounded-[32px] p-8 md:p-12 text-white shadow-2xl">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md mb-6 border border-white/5 text-[#DAA520]">
                            <Zap className="w-3 h-3 fill-[#DAA520]" /> {t('admin.systemOperational')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            {t('admin.welcomeAdmin')}
                        </h1>
                        <p className="text-gray-400 font-medium text-lg leading-relaxed">
                            {t('admin.dashboardDesc')}
                        </p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-yellow-500/10 to-transparent pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#DAA520] rounded-full blur-[120px] opacity-20" />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                    {cards.map((card, i) => (
                        <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex items-start justify-between group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{card.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-2xl font-black text-gray-900">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</h2>
                                    <span className="text-[10px] font-bold text-gray-400">{card.unit}</span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-2xl bg-gray-50 ${card.color} group-hover:scale-110 transition-transform`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Operations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] px-2">{t('admin.coreOperations')}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { title: t('admin.inventoryManagement'), desc: t('admin.inventoryDesc'), link: '/products', icon: ShoppingBag, color: 'bg-blue-600', plus: '/products/add' },
                                { title: t('admin.orderProcessing'), desc: t('admin.orderDesc'), link: '/orders', icon: Zap, color: 'bg-green-600' },
                                { title: t('admin.marketplaceTrends'), desc: t('admin.trendsDesc'), link: '/analytics', icon: TrendingUp, color: 'bg-purple-600' },
                                { title: t('admin.promoEngine'), desc: t('admin.promoDesc'), link: '/coupons', icon: Ticket, color: 'bg-[#DAA520]', plus: '/coupons/add' },
                            ].map((op, i) => (
                                <div key={i} className="group relative bg-white p-6 rounded-[24px] shadow-sm border border-gray-50 hover:border-[#DAA520]/20 transition-all cursor-pointer overflow-hidden" onClick={() => router.push(op.link)}>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${op.color} shadow-lg shadow-current/20`}>
                                            <op.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{op.title}</h3>
                                            <p className="text-xs text-gray-400">{op.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-4">
                                        <span className="text-[10px] font-bold text-[#DAA520] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">{t('admin.goToModule')} <ArrowRight className="w-3 h-3" /></span>
                                        {op.plus && (
                                            <button onClick={(e) => { e.stopPropagation(); router.push(op.plus!); }} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[#DAA520]"><Plus className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] px-2">{t('admin.globalSettings')}</h2>
                        <div className="bg-gray-50 rounded-[32px] p-8 space-y-6 border border-gray-100">
                            {[
                                { title: t('admin.interfaceLocalization'), link: '/sections', icon: Layout },
                                { title: t('admin.marketingCommunications'), link: '/send-offers', icon: Bell },
                                { title: t('admin.systemSecurity'), link: '/settings', icon: Settings },
                            ].map((item, i) => (
                                <button key={i} onClick={() => router.push(item.link)} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#DAA520] transition-colors"><item.icon className="w-4 h-4" /></div>
                                        <span className="text-sm font-bold text-gray-700">{item.title}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#DAA520] transition-all group-hover:translate-x-1" />
                                </button>
                            ))}

                            <div className="pt-6 border-t border-gray-200 mt-6">
                                <div className="bg-white rounded-2xl p-4 border border-yellow-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-[#DAA520]"><Zap className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.activeTask')}</p>
                                        <p className="text-xs font-bold text-gray-900 leading-tight">{t('admin.migrationStatus')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

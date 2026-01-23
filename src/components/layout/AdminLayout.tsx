'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import {
    LayoutDashboard,
    ShoppingBag,
    FolderOpen,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    Users,
    Image as ImageIcon,
    Star,
    Layers,
    Ticket,
    Mail,
} from 'lucide-react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [admin, setAdmin] = useState<{ username: string } | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);

    const navigation = [
        { name: t('admin.dashboard'), href: '/', icon: LayoutDashboard },
        { name: t('admin.products'), href: '/products', icon: ShoppingBag },
        { name: t('admin.categories'), href: '/categories', icon: FolderOpen },
        { name: t('admin.orders'), href: '/orders', icon: MessageSquare },
        { name: t('admin.coupons'), href: '/coupons', icon: Ticket },
        { name: t('admin.users'), href: '/users', icon: Users },
        { name: t('admin.advertisements'), href: '/advertisements', icon: ImageIcon },
        { name: t('admin.reviews'), href: '/reviews', icon: Star },
        { name: t('admin.sendOffers'), href: '/send-offers', icon: Mail },
        { name: t('admin.sections'), href: '/sections', icon: Layers },
        { name: t('admin.analytics'), href: '/analytics', icon: BarChart3 },
        { name: t('admin.settings'), href: '/settings', icon: Settings },
    ];

    useEffect(() => {
        setIsClient(true);
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            setIsAuthChecking(true);
            await new Promise(resolve => setTimeout(resolve, 300));

            const apiUrl = typeof window !== 'undefined'
                ? `${window.location.protocol}//${window.location.host}/api/admin/me`
                : '/api/admin/me';

            const response = await fetch(apiUrl, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.admin) {
                    setAdmin(data.data.admin);
                    setIsAuthChecking(false);
                    return;
                }
                if (data.admin) {
                    setAdmin(data.admin);
                    setIsAuthChecking(false);
                    return;
                }
                setIsAuthChecking(false);
                router.replace('/login');
            } else {
                setIsAuthChecking(false);
                router.replace('/login');
            }
        } catch (error) {
            setIsAuthChecking(false);
            router.replace('/login');
        }
    };

    const isRtl = language === 'ar';

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (isClient && isAuthChecking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative mb-6">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#DAA520]/20 border-t-[#DAA520] mx-auto"></div>
                        <div className="absolute inset-0 bg-[#DAA520]/10 rounded-full blur-xl animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 font-medium text-lg">
                        {t('admin.verifyingPermissions')}
                    </p>
                </div>
            </div>
        );
    }

    if (isClient && !isAuthChecking && !admin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        {t('admin.accessDenied')}
                    </p>
                    <p className="text-sm text-gray-400">
                        {t('admin.redirecting')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''} ${isRtl ? 'admin-sidebar-rtl' : 'admin-sidebar-ltr'}`}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#DAA520] rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            ع
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-white">
                                {t('header.title')}
                            </span>
                            <span className="text-sm text-gray-300">
                                {t('admin.dashboardSubtitle')}
                            </span>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800">
                    {isClient && admin && (
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[#DAA520] rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {admin.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">
                                    {admin.username}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {t('admin.systemAdmin')}
                                </p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>{t('admin.logout')}</span>
                    </button>
                </div>
            </div>

            <div className={`admin-content flex-1 transition-all duration-300 ${isSidebarOpen ? (isRtl ? 'mr-0' : 'ml-0') : (isRtl ? 'sm:mr-64' : 'sm:ml-64')}`}>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`md:hidden fixed top-4 ${isRtl ? 'right-4' : 'left-4'} z-50 p-2 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all active:scale-90 border border-white/10`}
                >
                    {isSidebarOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </button>

                <main className="flex-1">
                    {children}
                </main>
            </div>

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}

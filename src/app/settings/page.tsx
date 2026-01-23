'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { getCSRFToken, refreshCSRFToken } from '@/lib/csrf-client';
import {
    User,
    Lock,
    Globe,
    Shield,
    Save,
    Settings as SettingsIcon,
    Palette,
    FileText,
    Bell,
    Store,
    Share2,
    Search,
    Mail,
    Phone,
    MapPin,
    ShieldCheck,
    Zap,
    Layout,
    Target,
    CheckCircle2,
    Trash2,
    Plus,
    Eye,
    EyeOff,
    Clock,
    Star,
    Ticket,
    MessageCircle,
    ImageIcon,
    Upload
} from 'lucide-react';

export default function SettingsPage() {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('profile');
    const [activePageSubTab, setActivePageSubTab] = useState('about');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [settings, setSettings] = useState<any>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/settings', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setSettings(data.success && data.data?.settings ? data.data.settings : data.settings);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const handleSave = async (section: string) => {
        setIsSaving(true);
        try {
            const token = await getCSRFToken();
            let dataToSend = settings[section];

            if (section === 'profile') {
                if (passwords.newPassword) {
                    if (passwords.newPassword !== passwords.confirmPassword) {
                        showToast(t('admin.passwordsDontMatch'), 'error');
                        setIsSaving(false);
                        return;
                    }
                    dataToSend = {
                        ...dataToSend,
                        oldPassword: passwords.oldPassword,
                        newPassword: passwords.newPassword
                    };
                }
            }

            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': token
                },
                credentials: 'include',
                body: JSON.stringify({
                    section,
                    data: dataToSend,
                    csrfToken: token
                })
            });

            if (response.ok) {
                showToast(t('admin.statusUpdated'), 'success');
            } else {
                // If 403, try to refresh token for next attempt
                if (response.status === 403) {
                    await refreshCSRFToken();
                }
                showToast(t('common.error'), 'error');
            }
        } catch (error) {
            showToast(t('common.error'), 'error');
        } finally {
            // Always refresh token for next operation
            await refreshCSRFToken();
            setIsSaving(false);
        }
    };

    const updateNested = (section: string, field: string, value: any) => {
        setSettings((prev: any) => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const updateSubNested = (section: string, subSection: string, field: string, value: any) => {
        setSettings((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subSection]: { ...prev[section][subSection], [field]: value }
            }
        }));
    };

    const addArrayItem = (subSection: string, field: string, defaultItem: any) => {
        setSettings((prev: any) => {
            const currentArray = prev.pagesContent[subSection][field] || [];
            return {
                ...prev,
                pagesContent: {
                    ...prev.pagesContent,
                    [subSection]: {
                        ...prev.pagesContent[subSection],
                        [field]: [...currentArray, defaultItem]
                    }
                }
            };
        });
    };

    const removeArrayItem = (subSection: string, field: string, index: number) => {
        setSettings((prev: any) => {
            const currentArray = [...prev.pagesContent[subSection][field]];
            currentArray.splice(index, 1);
            return {
                ...prev,
                pagesContent: {
                    ...prev.pagesContent,
                    [subSection]: {
                        ...prev.pagesContent[subSection],
                        [field]: currentArray
                    }
                }
            };
        });
    };

    const updateArrayItem = (subSection: string, field: string, index: number, itemField: string, value: any) => {
        setSettings((prev: any) => {
            const currentArray = [...prev.pagesContent[subSection][field]];
            currentArray[index] = { ...currentArray[index], [itemField]: value };
            return {
                ...prev,
                pagesContent: {
                    ...prev.pagesContent,
                    [subSection]: {
                        ...prev.pagesContent[subSection],
                        [field]: currentArray
                    }
                }
            };
        });
    };

    const handleImageUpload = async (subTab: string, field: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                try {
                    const csrfToken = await getCSRFToken();
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await fetch('/api/upload?type=ad', {
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
                            updateSubNested('pagesContent', subTab, field, data.url);
                            showToast(t('admin.imageUploaded') || 'Image uploaded successfully', 'success');
                        }
                    } else {
                        showToast(t('admin.uploadFailed') || 'Upload failed', 'error');
                    }
                } catch (error) {
                    console.error('Error uploading image:', error);
                    showToast(t('admin.uploadError') || 'Error uploading image', 'error');
                }
            }
        };
        input.click();
    };

    if (isLoading) return <AdminLayout><div className="p-12 flex justify-center"><div className="w-12 h-12 border-4 border-yellow-100 border-t-[#DAA520] animate-spin rounded-full" /></div></AdminLayout>;

    return (
        <AdminLayout>
            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-64 space-y-2">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">{t('admin.controlPanel')}</h2>
                        {[
                            { id: 'profile', icon: User, label: t('admin.adminProfile') },
                            { id: 'store', icon: SettingsIcon, label: t('admin.storeCore') },
                            { id: 'social', icon: Zap, label: t('admin.socialAndAnnouncement') },
                            { id: 'seo', icon: Globe, label: t('admin.seoAnalytics') },
                            { id: 'notifications', icon: Bell, label: t('admin.notifications') },
                            { id: 'pages', icon: Layout, label: t('admin.pagesContent') },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-[#DAA520] text-white shadow-lg shadow-yellow-500/20' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            {activeTab === 'profile' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900">{t('admin.adminIdentity')}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{t('admin.adminIdentityDesc')}</p>
                                        </div>
                                        <button onClick={() => handleSave('profile')} disabled={isSaving} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2">
                                            <Save className="w-4 h-4" /> {isSaving ? t('admin.saving') : t('admin.updateProfile')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('admin.fullLegalName')}</label>
                                            <input type="text" value={settings.profile.fullName} onChange={e => updateNested('profile', 'fullName', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('admin.authorizedEmail')}</label>
                                            <input type="email" value={settings.profile.email} onChange={e => updateNested('profile', 'email', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('admin.loginUsername')}</label>
                                            <input type="text" value={settings.profile.username} onChange={e => updateNested('profile', 'username', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('admin.adminHotline')}</label>
                                            <input type="text" value={settings.profile.phone} onChange={e => updateNested('profile', 'phone', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-gray-50">
                                        <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-[#DAA520]" /> {t('admin.changePassword')}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('admin.oldPassword')}</label>
                                                <input type="password" value={passwords.oldPassword} onChange={e => setPasswords({ ...passwords, oldPassword: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('admin.newPassword')}</label>
                                                <input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('admin.confirmPassword')}</label>
                                                <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <button
                                                onClick={async () => {
                                                    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
                                                        showToast(t('admin.allFieldsRequired'), 'error');
                                                        return;
                                                    }
                                                    await handleSave('profile');
                                                    setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                                }}
                                                disabled={isSaving}
                                                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
                                            >
                                                <ShieldCheck className="w-4 h-4" /> {isSaving ? t('admin.saving') : t('admin.updatePassword')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'store' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900">{t('admin.brandParameters')}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{t('admin.brandParametersDesc')}</p>
                                        </div>
                                        <button onClick={() => handleSave('store')} disabled={isSaving} className="px-6 py-2.5 bg-[#DAA520] text-white rounded-xl font-bold text-sm hover:bg-[#B8860B] transition-all flex items-center gap-2">
                                            <Save className="w-4 h-4" /> {isSaving ? t('admin.saving') : t('common.save')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">{t('admin.nomenclature')}</h4>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.arabicStoreName')}</label>
                                                    <input type="text" value={settings.store.nameAr} onChange={e => updateNested('store', 'nameAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-lg" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.englishStoreName')}</label>
                                                    <input type="text" value={settings.store.name} onChange={e => updateNested('store', 'name', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-lg" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">{t('admin.financials')}</h4>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.defaultShippingFee')} ({t('admin.unit.egp')})</label>
                                                    <input type="number" value={settings.store.shippingPrice} onChange={e => updateNested('store', 'shippingPrice', parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-[#DAA520] text-white rounded-lg flex items-center justify-center font-bold text-xs uppercase">ADS</div>
                                                        <p className="text-xs font-bold text-yellow-900">{t('admin.showHomepageAds')}</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" checked={settings.store.showAdvertisements} onChange={e => updateNested('store', 'showAdvertisements', e.target.checked)} />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#DAA520] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">{t('admin.financials')}</h4>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.instaPayNumber')}</label>
                                                    <input type="text" value={settings.store.instaPayNumber || ''} onChange={e => updateNested('store', 'instaPayNumber', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.instaPayAccountName')}</label>
                                                    <input type="text" value={settings.store.instaPayAccountName || ''} onChange={e => updateNested('store', 'instaPayAccountName', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.vodafoneNumber')}</label>
                                                    <input type="text" value={settings.store.vodafoneNumber || ''} onChange={e => updateNested('store', 'vodafoneNumber', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">{t('admin.contactMessageAr')}</h4>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.publicPhone')}</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        <input type="text" value={settings.store.phone} onChange={e => updateNested('store', 'phone', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.whatsAppLine')}</label>
                                                    <div className="relative">
                                                        <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                                        <input type="text" value={settings.store.whatsapp} onChange={e => updateNested('store', 'whatsapp', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.publicEmail')}</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                                        <input type="text" value={settings.store.email} onChange={e => updateNested('store', 'email', e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'social' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900">{t('admin.socialAndAnnouncement')}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{t('admin.brandParametersDesc')}</p>
                                        </div>
                                        <button onClick={() => handleSave('store')} disabled={isSaving} className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2">
                                            <Save className="w-4 h-4" /> {isSaving ? t('admin.saving') : t('common.save')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{t('admin.socialMedia')}</h4>
                                            {['facebook', 'instagram', 'twitter', 'youtube'].map(platform => (
                                                <div key={platform} className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-xs font-bold text-gray-700 capitalize">{platform}</label>
                                                        <label className="relative inline-flex items-center cursor-pointer scale-75">
                                                            <input type="checkbox" className="sr-only peer" checked={settings.store.socialMedia[platform]?.enabled} onChange={e => updateSubNested('store', 'socialMedia', platform, { ...settings.store.socialMedia[platform], enabled: e.target.checked })} />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#DAA520] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                        </label>
                                                    </div>
                                                    <input type="text" value={settings.store.socialMedia[platform]?.url || ''} onChange={e => updateSubNested('store', 'socialMedia', platform, { ...settings.store.socialMedia[platform], url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-white border-none rounded-lg focus:ring-2 focus:ring-[#DAA520] outline-none text-sm font-medium" />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">{t('admin.announcementBar')}</h4>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={settings.store.announcement.enabled} onChange={e => updateSubNested('store', 'announcement', 'enabled', e.target.checked)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#DAA520] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.speed')}</label>
                                                    <input type="number" value={settings.store.announcement.speed} onChange={e => updateSubNested('store', 'announcement', 'speed', parseInt(e.target.value) || 0)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.messagesAr')}</label>
                                                    <textarea value={settings.store.announcement.messagesAr.join('\n')} onChange={e => updateSubNested('store', 'announcement', 'messagesAr', e.target.value.split('\n').filter(s => s.trim()))} rows={4} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm" dir="rtl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-700">{t('admin.messagesEn')}</label>
                                                    <textarea value={settings.store.announcement.messagesEn.join('\n')} onChange={e => updateSubNested('store', 'announcement', 'messagesEn', e.target.value.split('\n').filter(s => s.trim()))} rows={4} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'seo' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900">{t('admin.searchPresence')}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{t('admin.searchPresenceDesc')}</p>
                                        </div>
                                        <button onClick={() => handleSave('seo')} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2">
                                            <Save className="w-4 h-4" /> {t('admin.saveMetadata')}
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-700">{t('admin.globalKeywords')}</label>
                                            <textarea value={settings.seo.keywords} onChange={e => updateNested('seo', 'keywords', e.target.value)} rows={3} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">{t('admin.arabicMetaDescription')}</label>
                                                <textarea value={settings.seo.metaDescriptionAr} onChange={e => updateNested('seo', 'metaDescriptionAr', e.target.value)} rows={6} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-700">{t('admin.englishMetaDescription')}</label>
                                                <textarea value={settings.seo.metaDescriptionEn} onChange={e => updateNested('seo', 'metaDescriptionEn', e.target.value)} rows={6} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900">{t('admin.systemAlerts')}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{t('admin.systemAlertsDesc')}</p>
                                        </div>
                                        <button onClick={() => handleSave('notifications')} disabled={isSaving} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all flex items-center gap-2">
                                            <Save className="w-4 h-4" /> {t('admin.saveRules')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { key: 'emailNotifications', label: t('admin.emailNotificationsLabel'), desc: t('admin.allowEmailsDesc') },
                                            { key: 'orderNotifications', label: t('admin.newOrderAlertsLabel'), desc: t('admin.newOrderAlertsDesc') },
                                            { key: 'lowStockAlerts', label: t('admin.lowStockWarningsLabel'), desc: t('admin.lowStockWarningsDesc') },
                                            { key: 'dailyReports', label: t('admin.dailyReportsLabel'), desc: t('admin.dailyReportsDesc') },
                                        ].map(item => (
                                            <div key={item.key} className="p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-gray-100 transition-all flex items-center justify-between group">
                                                <div>
                                                    <p className="font-bold text-gray-900 group-hover:text-[#DAA520] transition-colors">{item.label}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={settings.notifications[item.key]} onChange={e => updateNested('notifications', item.key, e.target.checked)} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#DAA520] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'pages' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900">{t('admin.pagesContent')}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{t('admin.brandParametersDesc')}</p>
                                        </div>
                                        <button onClick={() => handleSave('pagesContent')} disabled={isSaving} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all flex items-center gap-2">
                                            <Save className="w-4 h-4" /> {isSaving ? t('admin.saving') : t('common.save')}
                                        </button>
                                    </div>

                                    {/* Sub-tabs Navigation */}
                                    <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl">
                                        {[
                                            { id: 'about', icon: Layout, label: t('admin.aboutUs') || 'About Us', color: 'text-[#DAA520]' },
                                            { id: 'contact', icon: Mail, label: t('admin.contactPage') || 'Contact', color: 'text-blue-500' },
                                            { id: 'terms', icon: FileText, label: t('admin.termsAndPrivacy') || 'Terms', color: 'text-green-600' },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActivePageSubTab(tab.id)}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activePageSubTab === tab.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <tab.icon className={`w-4 h-4 ${activePageSubTab === tab.id ? tab.color : ''}`} />
                                                {tab.label}
                                                {/* Visibility indicator */}
                                                <span className={`w-2 h-2 rounded-full ${(tab.id === 'about' && settings.pagesContent.about.enabled) ||
                                                    (tab.id === 'contact' && settings.pagesContent.contact.enabled) ||
                                                    (tab.id === 'terms' && settings.pagesContent.terms.enabled)
                                                    ? 'bg-green-500' : 'bg-gray-300'
                                                    }`} />
                                            </button>
                                        ))}
                                    </div>

                                    {/* About Us Sub-Tab */}
                                    {activePageSubTab === 'about' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="flex items-center gap-2 text-xl font-black text-gray-900">
                                                    <Layout className="w-6 h-6 text-[#DAA520]" /> {t('admin.aboutUs') || 'About Us'}
                                                </h4>
                                                <button
                                                    onClick={() => updateSubNested('pagesContent', 'about', 'enabled', !settings.pagesContent.about.enabled)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${settings.pagesContent.about.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {settings.pagesContent.about.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                    {settings.pagesContent.about.enabled ? t('admin.pageEnabled') : t('admin.pageDisabled')}
                                                </button>
                                            </div>
                                            {/* Hero Section */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-yellow-500" />
                                                    {t('admin.heroSection')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2 space-y-4">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.heroImage') || 'Hero Image'}</label>
                                                        <div className="flex flex-col md:flex-row gap-6">
                                                            <div className="w-full md:w-64 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative group">
                                                                {settings.pagesContent.about.heroImage ? (
                                                                    <>
                                                                        <img src={settings.pagesContent.about.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                                                                            <button onClick={() => handleImageUpload('about', 'heroImage')} className="p-2 bg-white text-gray-900 rounded-lg shadow-lg hover:scale-110 transition-transform">
                                                                                <Upload className="w-4 h-4" />
                                                                            </button>
                                                                            <button onClick={() => updateSubNested('pagesContent', 'about', 'heroImage', '')} className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform">
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <button onClick={() => handleImageUpload('about', 'heroImage')} className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 transition-colors">
                                                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                                            <Upload className="w-5 h-5" />
                                                                        </div>
                                                                        <span className="text-xs font-bold uppercase tracking-wider">{t('admin.uploadImage') || 'Upload Hero'}</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 space-y-4">
                                                                <div className="relative">
                                                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    <input type="text" value={settings.pagesContent.about.heroImage || ''} onChange={e => updateSubNested('pagesContent', 'about', 'heroImage', e.target.value)} placeholder="/uploads/..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 font-medium italic">
                                                                    {t('admin.imageFieldHint') || 'Recommended size: 1920x1080px. You can either upload a file or paste a path.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.heroTitleAr')}</label>
                                                        <input type="text" value={settings.pagesContent.about.heroTitleAr} onChange={e => updateSubNested('pagesContent', 'about', 'heroTitleAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.heroTitleEn')}</label>
                                                        <input type="text" value={settings.pagesContent.about.heroTitleEn} onChange={e => updateSubNested('pagesContent', 'about', 'heroTitleEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.heroSubtitleAr')}</label>
                                                        <input type="text" value={settings.pagesContent.about.heroSubtitleAr} onChange={e => updateSubNested('pagesContent', 'about', 'heroSubtitleAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.heroSubtitleEn')}</label>
                                                        <input type="text" value={settings.pagesContent.about.heroSubtitleEn} onChange={e => updateSubNested('pagesContent', 'about', 'heroSubtitleEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Story Section */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-500" />
                                                    {t('admin.storySection')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.storyTitleAr')}</label>
                                                        <input type="text" value={settings.pagesContent.about.storyTitleAr} onChange={e => updateSubNested('pagesContent', 'about', 'storyTitleAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.storyTitleEn')}</label>
                                                        <input type="text" value={settings.pagesContent.about.storyTitleEn} onChange={e => updateSubNested('pagesContent', 'about', 'storyTitleEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.description')} (AR)</label>
                                                    <textarea value={settings.pagesContent.about.storyContentAr} onChange={e => updateSubNested('pagesContent', 'about', 'storyContentAr', e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.description')} (EN)</label>
                                                    <textarea value={settings.pagesContent.about.storyContentEn} onChange={e => updateSubNested('pagesContent', 'about', 'storyContentEn', e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.storyImageTextAr')}</label>
                                                        <input type="text" value={settings.pagesContent.about.storyImageTextAr} onChange={e => updateSubNested('pagesContent', 'about', 'storyImageTextAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.storyImageTextEn')}</label>
                                                        <input type="text" value={settings.pagesContent.about.storyImageTextEn} onChange={e => updateSubNested('pagesContent', 'about', 'storyImageTextEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.storySubtextAr') || 'Story Subtext (AR)'}</label>
                                                        <input type="text" value={settings.pagesContent.about.storyImageSubtextAr} onChange={e => updateSubNested('pagesContent', 'about', 'storyImageSubtextAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.storySubtextEn') || 'Story Subtext (EN)'}</label>
                                                        <input type="text" value={settings.pagesContent.about.storyImageSubtextEn} onChange={e => updateSubNested('pagesContent', 'about', 'storyImageSubtextEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mission & Vision */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-6">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-orange-500" />
                                                    {t('admin.missionAndVision')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Our Mission</h6>
                                                        <div className="space-y-2">
                                                            <input type="text" placeholder="Mission Title (AR)" value={settings.pagesContent.about.missionTitleAr} onChange={e => updateSubNested('pagesContent', 'about', 'missionTitleAr', e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm" dir="rtl" />
                                                            <textarea placeholder="Mission Content (AR)" value={settings.pagesContent.about.missionContentAr} onChange={e => updateSubNested('pagesContent', 'about', 'missionContentAr', e.target.value)} rows={4} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium text-xs text-gray-500" dir="rtl" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <input type="text" placeholder="Mission Title (EN)" value={settings.pagesContent.about.missionTitleEn} onChange={e => updateSubNested('pagesContent', 'about', 'missionTitleEn', e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm" />
                                                            <textarea placeholder="Mission Content (EN)" value={settings.pagesContent.about.missionContentEn} onChange={e => updateSubNested('pagesContent', 'about', 'missionContentEn', e.target.value)} rows={4} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium text-xs text-gray-500" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Our Vision</h6>
                                                        <div className="space-y-2">
                                                            <input type="text" placeholder="Vision Title (AR)" value={settings.pagesContent.about.visionTitleAr} onChange={e => updateSubNested('pagesContent', 'about', 'visionTitleAr', e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm" dir="rtl" />
                                                            <textarea placeholder="Vision Content (AR)" value={settings.pagesContent.about.visionContentAr} onChange={e => updateSubNested('pagesContent', 'about', 'visionContentAr', e.target.value)} rows={4} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium text-xs text-gray-500" dir="rtl" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <input type="text" placeholder="Vision Title (EN)" value={settings.pagesContent.about.visionTitleEn} onChange={e => updateSubNested('pagesContent', 'about', 'visionTitleEn', e.target.value)} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-bold text-sm" />
                                                            <textarea placeholder="Vision Content (EN)" value={settings.pagesContent.about.visionContentEn} onChange={e => updateSubNested('pagesContent', 'about', 'visionContentEn', e.target.value)} rows={4} className="w-full px-3 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-medium text-xs text-gray-500" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Features Section */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    {t('admin.featuresSection')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.title')} (AR)</label>
                                                        <input type="text" value={settings.pagesContent.about.featuresTitleAr} onChange={e => updateSubNested('pagesContent', 'about', 'featuresTitleAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.title')} (EN)</label>
                                                        <input type="text" value={settings.pagesContent.about.featuresTitleEn} onChange={e => updateSubNested('pagesContent', 'about', 'featuresTitleEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.description')} (AR)</label>
                                                        <textarea value={settings.pagesContent.about.featuresDescriptionAr} onChange={e => updateSubNested('pagesContent', 'about', 'featuresDescriptionAr', e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.description')} (EN)</label>
                                                        <textarea value={settings.pagesContent.about.featuresDescriptionEn} onChange={e => updateSubNested('pagesContent', 'about', 'featuresDescriptionEn', e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                                    {settings.pagesContent.about.features.map((feature: any, index: number) => (
                                                        <div key={index} className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.feature')} {index + 1}</span>
                                                            <div className="space-y-2">
                                                                <input type="text" placeholder="Title (AR)" value={feature.titleAr} onChange={e => {
                                                                    const newFeatures = [...settings.pagesContent.about.features];
                                                                    newFeatures[index].titleAr = e.target.value;
                                                                    updateSubNested('pagesContent', 'about', 'features', newFeatures);
                                                                }} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold" dir="rtl" />
                                                                <input type="text" placeholder="Title (EN)" value={feature.titleEn} onChange={e => {
                                                                    const newFeatures = [...settings.pagesContent.about.features];
                                                                    newFeatures[index].titleEn = e.target.value;
                                                                    updateSubNested('pagesContent', 'about', 'features', newFeatures);
                                                                }} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold" />
                                                                <textarea placeholder="Description (AR)" value={feature.descriptionAr} onChange={e => {
                                                                    const newFeatures = [...settings.pagesContent.about.features];
                                                                    newFeatures[index].descriptionAr = e.target.value;
                                                                    updateSubNested('pagesContent', 'about', 'features', newFeatures);
                                                                }} rows={2} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 outline-none text-xs" dir="rtl" />
                                                                <textarea placeholder="Description (EN)" value={feature.descriptionEn} onChange={e => {
                                                                    const newFeatures = [...settings.pagesContent.about.features];
                                                                    newFeatures[index].descriptionEn = e.target.value;
                                                                    updateSubNested('pagesContent', 'about', 'features', newFeatures);
                                                                }} rows={2} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-purple-500 outline-none text-xs" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* CTA Section */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-red-500" />
                                                    {t('admin.ctaSection')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.ctaTitleAr')}</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaTitleAr} onChange={e => updateSubNested('pagesContent', 'about', 'ctaTitleAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.ctaTitleEn')}</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaTitleEn} onChange={e => updateSubNested('pagesContent', 'about', 'ctaTitleEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.ctaButton1TextAr')}</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaButton1TextAr} onChange={e => updateSubNested('pagesContent', 'about', 'ctaButton1TextAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.ctaButton1TextEn')}</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaButton1TextEn} onChange={e => updateSubNested('pagesContent', 'about', 'ctaButton1TextEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.ctaButton1Link') || 'CTA Button 1 Link'}</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaButton1Link || ''} onChange={e => updateSubNested('pagesContent', 'about', 'ctaButton1Link', e.target.value)} placeholder="/products" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">CTA Button 2 Text (AR)</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaButton2TextAr} onChange={e => updateSubNested('pagesContent', 'about', 'ctaButton2TextAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">CTA Button 2 Text (EN)</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaButton2TextEn} onChange={e => updateSubNested('pagesContent', 'about', 'ctaButton2TextEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('admin.ctaButton2Link') || 'CTA Button 2 Link'}</label>
                                                        <input type="text" value={settings.pagesContent.about.ctaButton2Link || ''} onChange={e => updateSubNested('pagesContent', 'about', 'ctaButton2Link', e.target.value)} placeholder="/contact" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact Us Sub-Tab */}
                                    {activePageSubTab === 'contact' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="flex items-center gap-2 text-xl font-black text-gray-900">
                                                    <Mail className="w-5 h-5 text-blue-500" /> {t('admin.contactPage')}
                                                </h4>
                                                <button
                                                    onClick={() => updateSubNested('pagesContent', 'contact', 'enabled', !settings.pagesContent.contact.enabled)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${settings.pagesContent.contact.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {settings.pagesContent.contact.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                    {settings.pagesContent.contact.enabled ? t('admin.pageEnabled') : t('admin.pageDisabled')}
                                                </button>
                                            </div>
                                            {/* Hero Section */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-yellow-500" />
                                                    {t('admin.heroSection')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">AR Hero Title</label>
                                                        <input type="text" value={settings.pagesContent.contact.heroTitleAr} onChange={e => updateSubNested('pagesContent', 'contact', 'heroTitleAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">EN Hero Title</label>
                                                        <input type="text" value={settings.pagesContent.contact.heroTitleEn} onChange={e => updateSubNested('pagesContent', 'contact', 'heroTitleEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">AR Hero Description</label>
                                                        <textarea value={settings.pagesContent.contact.heroDescriptionAr} onChange={e => updateSubNested('pagesContent', 'contact', 'heroDescriptionAr', e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">EN Hero Description</label>
                                                        <textarea value={settings.pagesContent.contact.heroDescriptionEn} onChange={e => updateSubNested('pagesContent', 'contact', 'heroDescriptionEn', e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location & Hours */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-red-500" />
                                                    {t('admin.address')} & {t('admin.workingHours')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-700">{t('admin.addressAr') || 'العنوان بالعربية'}</label>
                                                        <input type="text" value={settings.pagesContent.contact.addressAr} onChange={e => updateSubNested('pagesContent', 'contact', 'addressAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-700">{t('admin.addressEn') || 'Address In English'}</label>
                                                        <input type="text" value={settings.pagesContent.contact.addressEn} onChange={e => updateSubNested('pagesContent', 'contact', 'addressEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-700">{t('admin.workingHoursAr') || 'ساعات العمل بالعربية'}</label>
                                                        <input type="text" value={settings.pagesContent.contact.workingHoursAr} onChange={e => updateSubNested('pagesContent', 'contact', 'workingHoursAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-700">{t('admin.workingHoursEn') || 'Working Hours In English'}</label>
                                                        <input type="text" value={settings.pagesContent.contact.workingHoursEn} onChange={e => updateSubNested('pagesContent', 'contact', 'workingHoursEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* WhatsApp Support Section */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <MessageCircle className="w-4 h-4 text-green-500" />
                                                    WhatsApp Support
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">AR Description</label>
                                                        <input type="text" value={settings.pagesContent.contact.whatsappDescriptionAr} onChange={e => updateSubNested('pagesContent', 'contact', 'whatsappDescriptionAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">EN Description</label>
                                                        <input type="text" value={settings.pagesContent.contact.whatsappDescriptionEn} onChange={e => updateSubNested('pagesContent', 'contact', 'whatsappDescriptionEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">AR Button Text</label>
                                                        <input type="text" value={settings.pagesContent.contact.whatsappButtonTextAr} onChange={e => updateSubNested('pagesContent', 'contact', 'whatsappButtonTextAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">EN Button Text</label>
                                                        <input type="text" value={settings.pagesContent.contact.whatsappButtonTextEn} onChange={e => updateSubNested('pagesContent', 'contact', 'whatsappButtonTextEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pre-filled Message (AR)</label>
                                                        <textarea value={settings.pagesContent.contact.whatsappMessageAr} onChange={e => updateSubNested('pagesContent', 'contact', 'whatsappMessageAr', e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Facebook Contact Section */}
                                            <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4">
                                                <h5 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Share2 className="w-4 h-4 text-blue-600" />
                                                    Facebook Contact
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2 space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Facebook Page URL</label>
                                                        <input type="text" value={settings.pagesContent.contact.facebookUrl} onChange={e => updateSubNested('pagesContent', 'contact', 'facebookUrl', e.target.value)} placeholder="https://facebook.com/your-page" className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">AR Description</label>
                                                        <input type="text" value={settings.pagesContent.contact.facebookDescriptionAr} onChange={e => updateSubNested('pagesContent', 'contact', 'facebookDescriptionAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">EN Description</label>
                                                        <input type="text" value={settings.pagesContent.contact.facebookDescriptionEn} onChange={e => updateSubNested('pagesContent', 'contact', 'facebookDescriptionEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">AR Button Text</label>
                                                        <input type="text" value={settings.pagesContent.contact.facebookButtonTextAr} onChange={e => updateSubNested('pagesContent', 'contact', 'facebookButtonTextAr', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">EN Button Text</label>
                                                        <input type="text" value={settings.pagesContent.contact.facebookButtonTextEn} onChange={e => updateSubNested('pagesContent', 'contact', 'facebookButtonTextEn', e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Terms & Privacy Sub-Tab */}
                                    {activePageSubTab === 'terms' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="flex items-center gap-2 text-xl font-black text-gray-900">
                                                    <FileText className="w-6 h-6 text-[#DAA520]" /> {t('admin.termsAndPrivacy')}
                                                </h4>
                                                <button
                                                    onClick={() => updateSubNested('pagesContent', 'terms', 'enabled', !settings.pagesContent.terms.enabled)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${settings.pagesContent.terms.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    {settings.pagesContent.terms.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                    {settings.pagesContent.terms.enabled ? t('admin.pageEnabled') : t('admin.pageDisabled')}
                                                </button>
                                            </div>

                                            {/* Hero Info */}
                                            <div className="bg-gray-50/50 p-6 rounded-2xl space-y-4">
                                                <h5 className="font-bold text-gray-900 flex items-center gap-2 opacity-50 text-xs uppercase tracking-widest">
                                                    <Target className="w-4 h-4" /> {t('admin.heroTitle')} & {t('admin.lastUpdated')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">AR Title</label>
                                                        <input type="text" value={settings.pagesContent.terms.heroTitleAr} onChange={e => updateSubNested('pagesContent', 'terms', 'heroTitleAr', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">EN Title</label>
                                                        <input type="text" value={settings.pagesContent.terms.heroTitleEn} onChange={e => updateSubNested('pagesContent', 'terms', 'heroTitleEn', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">AR Last Updated</label>
                                                        <input type="text" value={settings.pagesContent.terms.termsLastUpdatedAr} onChange={e => updateSubNested('pagesContent', 'terms', 'termsLastUpdatedAr', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">EN Last Updated</label>
                                                        <input type="text" value={settings.pagesContent.terms.termsLastUpdatedEn} onChange={e => updateSubNested('pagesContent', 'terms', 'termsLastUpdatedEn', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-bold" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">AR Hero Description</label>
                                                        <textarea value={settings.pagesContent.terms.heroDescriptionAr} onChange={e => updateSubNested('pagesContent', 'terms', 'heroDescriptionAr', e.target.value)} rows={3} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter ml-1">EN Hero Description</label>
                                                        <textarea value={settings.pagesContent.terms.heroDescriptionEn} onChange={e => updateSubNested('pagesContent', 'terms', 'heroDescriptionEn', e.target.value)} rows={3} className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#DAA520] outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Terms Sections */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <Shield className="w-5 h-5 text-green-500" /> {t('admin.termsAndConditions')}
                                                    </h5>
                                                    <button onClick={() => addArrayItem('terms', 'termsSections', { subtitleAr: '', subtitleEn: '', textAr: '', textEn: '' })} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold text-xs hover:bg-green-100 transition-colors">
                                                        <Plus className="w-4 h-4" /> {t('admin.addSection')}
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    {(settings.pagesContent.terms.termsSections || []).map((section: any, idx: number) => (
                                                        <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl relative group">
                                                            <button onClick={() => removeArrayItem('terms', 'termsSections', idx)} className="absolute -top-2 -left-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-100 hover:bg-red-500 hover:text-white">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-3">
                                                                    <input type="text" placeholder={t('admin.sectionSubtitle') + ' (Ar)'} value={section.subtitleAr} onChange={e => updateArrayItem('terms', 'termsSections', idx, 'subtitleAr', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold" dir="rtl" />
                                                                    <textarea placeholder={t('admin.sectionText') + ' (Ar)'} value={section.textAr} onChange={e => updateArrayItem('terms', 'termsSections', idx, 'textAr', e.target.value)} rows={3} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium" dir="rtl" />
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <input type="text" placeholder={t('admin.sectionSubtitle') + ' (En)'} value={section.subtitleEn} onChange={e => updateArrayItem('terms', 'termsSections', idx, 'subtitleEn', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold" />
                                                                    <textarea placeholder={t('admin.sectionText') + ' (En)'} value={section.textEn} onChange={e => updateArrayItem('terms', 'termsSections', idx, 'textEn', e.target.value)} rows={3} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Privacy Sections */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h5 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <Lock className="w-5 h-5 text-blue-500" /> {t('admin.privacyPolicy')}
                                                    </h5>
                                                    <button onClick={() => addArrayItem('terms', 'privacySections', { subtitleAr: '', subtitleEn: '', textAr: '', textEn: '' })} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors">
                                                        <Plus className="w-4 h-4" /> {t('admin.addSection')}
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    {(settings.pagesContent.terms.privacySections || []).map((section: any, idx: number) => (
                                                        <div key={idx} className="bg-white border border-gray-100 p-4 rounded-2xl relative group">
                                                            <button onClick={() => removeArrayItem('terms', 'privacySections', idx)} className="absolute -top-2 -left-2 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-red-100 hover:bg-red-500 hover:text-white">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-3">
                                                                    <input type="text" placeholder={t('admin.sectionSubtitle') + ' (Ar)'} value={section.subtitleAr} onChange={e => updateArrayItem('terms', 'privacySections', idx, 'subtitleAr', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold" dir="rtl" />
                                                                    <textarea placeholder={t('admin.sectionText') + ' (Ar)'} value={section.textAr} onChange={e => updateArrayItem('terms', 'privacySections', idx, 'textAr', e.target.value)} rows={3} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium" dir="rtl" />
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <input type="text" placeholder={t('admin.sectionSubtitle') + ' (En)'} value={section.subtitleEn} onChange={e => updateArrayItem('terms', 'privacySections', idx, 'subtitleEn', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold" />
                                                                    <textarea placeholder={t('admin.sectionText') + ' (En)'} value={section.textEn} onChange={e => updateArrayItem('terms', 'privacySections', idx, 'textEn', e.target.value)} rows={3} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Important notice */}
                                            <div className="bg-amber-50 p-6 rounded-2xl space-y-4 border border-amber-100">
                                                <h5 className="font-bold text-amber-900 flex items-center gap-2">
                                                    <Bell className="w-5 h-5" /> {t('admin.noticeTitle')} & {t('admin.noticeText')}
                                                </h5>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-amber-800/50 ml-1">AR Notice Title</label>
                                                        <input type="text" value={settings.pagesContent.terms.importantNoticeTitleAr} onChange={e => updateSubNested('pagesContent', 'terms', 'importantNoticeTitleAr', e.target.value)} className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-amber-800/50 ml-1">EN Notice Title</label>
                                                        <input type="text" value={settings.pagesContent.terms.importantNoticeTitleEn} onChange={e => updateSubNested('pagesContent', 'terms', 'importantNoticeTitleEn', e.target.value)} className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-amber-800/50 ml-1">AR Notice Content</label>
                                                        <textarea value={settings.pagesContent.terms.importantNoticeTextAr} onChange={e => updateSubNested('pagesContent', 'terms', 'importantNoticeTextAr', e.target.value)} rows={3} className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-sm" dir="rtl" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-amber-800/50 ml-1">EN Notice Content</label>
                                                        <textarea value={settings.pagesContent.terms.importantNoticeTextEn} onChange={e => updateSubNested('pagesContent', 'terms', 'importantNoticeTextEn', e.target.value)} rows={3} className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
}

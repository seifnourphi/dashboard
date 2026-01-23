'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useCSRF } from '@/hooks/useCSRF';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { getImageSrc } from '@/lib/image-utils';
import {
    Users,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    RefreshCw,
    Plus,
    Download,
    Upload,
    Bell,
    BellOff,
    MapPin,
    X
} from 'lucide-react';

interface Address {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    isDefault?: boolean;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    emailVerified: boolean;
    isActive: boolean;
    subscribedToNewsletter?: boolean;
    createdAt: string;
    lastLoginAt?: string;
    avatar?: string;
    addresses?: Address[];
}

export default function UsersManagementPage() {
    const { t, language } = useLanguage();
    const { csrfToken, loading: csrfLoading } = useCSRF();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [newsletterFilter, setNewsletterFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        verified: 0,
        unverified: 0,
        subscribed: 0,
        unsubscribed: 0
    });

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/users', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (response.ok) {
                const usersList = data.success && data.data?.users
                    ? data.data.users
                    : data.users || [];
                const usersArray = Array.isArray(usersList) ? usersList : [];

                setUsers(usersArray);
                setFilteredUsers(usersArray);

                const total = usersArray.length;
                const active = usersArray.filter((u: User) => u.isActive).length;
                const inactive = total - active;
                const verified = usersArray.filter((u: User) => u.emailVerified).length;
                const unverified = total - verified;
                const subscribed = usersArray.filter((u: User) => u.subscribedToNewsletter).length;
                const unsubscribed = total - subscribed;

                setStats({ total, active, inactive, verified, unverified, subscribed, unsubscribed });
            } else {
                setUsers([]);
                setFilteredUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (user.phone && user.phone.includes(searchTerm))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(user =>
                statusFilter === 'active' ? user.isActive : !user.isActive
            );
        }

        if (verificationFilter !== 'all') {
            filtered = filtered.filter(user =>
                verificationFilter === 'verified' ? user.emailVerified : !user.emailVerified
            );
        }

        if (newsletterFilter !== 'all') {
            filtered = filtered.filter(user =>
                newsletterFilter === 'subscribed' ? user.subscribedToNewsletter : !user.subscribedToNewsletter
            );
        }

        setFilteredUsers(filtered);
    }, [users, searchTerm, statusFilter, verificationFilter, newsletterFilter]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        if (!csrfToken) {
            alert(t('admin.sessionExpired'));
            return;
        }

        try {
            const newStatus = !currentStatus;
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                    isActive: newStatus,
                    csrfToken: csrfToken
                }),
            });

            if (!response.ok) {
                let errorMessage = t('admin.errorUpdatingUser');
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                alert(`${t('admin.errorUpdatingUser')}: ${errorMessage}`);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, isActive: newStatus } : user
                ));

                if (selectedUser && selectedUser.id === userId) {
                    setSelectedUser({ ...selectedUser, isActive: newStatus });
                }
            } else {
                alert(`${t('admin.errorUpdatingUser')}: ${data.error || t('common.error')}`);
            }
        } catch (error) {
            alert(t('admin.errorUpdatingUser'));
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm(t('admin.confirmDeleteUser'))) {
            return;
        }

        if (!csrfToken) {
            alert(t('admin.sessionExpired'));
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                credentials: 'include',
                body: JSON.stringify({
                    csrfToken: csrfToken
                }),
            });

            if (response.ok) {
                setUsers(users.filter(user => user.id !== userId));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getUserInitials = (user: User) => {
        return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    };

    const exportToCSV = () => {
        if (filteredUsers.length === 0) {
            alert(t('admin.noDataExport'));
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];

        const csvData = [
            [t('admin.usersReport'), ''],
            ['', ''],
            [t('admin.firstName'), t('admin.lastName'), t('admin.email'), t('admin.phone'), t('common.status'), t('admin.verified'), t('admin.newsletter'), t('admin.date'), t('admin.lastLogin')],
            ...filteredUsers.map(user => [
                user.firstName,
                user.lastName,
                user.email,
                user.phone || '-',
                user.isActive ? t('admin.active') : t('admin.inactive'),
                user.emailVerified ? t('common.yes') : t('common.no'),
                user.subscribedToNewsletter ? t('common.yes') : t('common.no'),
                new Date(user.createdAt).toLocaleDateString('ar-EG'),
                user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ar-EG') : '-'
            ])
        ];

        const csvContent = csvData.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-report-${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Users className="w-8 h-8 text-[#DAA520]" />
                                {t('admin.manageUsers')}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                {t('admin.manageUsersDesc')}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchUsers}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                {t('admin.refresh')}
                            </button>
                            <button
                                onClick={exportToCSV}
                                disabled={isLoading || filteredUsers.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-[#DAA520] text-white rounded-lg hover:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                {t('admin.export')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: t('admin.total'), value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: t('admin.active'), value: stats.active, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: t('admin.inactive'), value: stats.inactive, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
                        { label: t('admin.verified'), value: stats.verified, icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: t('admin.newsletter'), value: stats.subscribed, icon: Bell, color: 'text-[#DAA520]', bg: 'bg-yellow-50' },
                    ].map((s, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-500">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('admin.searchUsers')}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#DAA520] outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none">
                                <option value="all">{t('admin.statusAll')}</option>
                                <option value="active">{t('admin.active')}</option>
                                <option value="inactive">{t('admin.inactive')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none">
                                <option value="all">{t('admin.verifAll')}</option>
                                <option value="verified">{t('admin.verified')}</option>
                                <option value="unverified">{t('admin.unverified')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <select value={newsletterFilter} onChange={(e) => setNewsletterFilter(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none">
                                <option value="all">{t('admin.newsAll')}</option>
                                <option value="subscribed">{t('admin.subscribed')}</option>
                                <option value="unsubscribed">{t('admin.notSubscribed')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <button
                                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setVerificationFilter('all'); setNewsletterFilter('all'); }}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-10 h-10 animate-spin text-[#DAA520] mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">{t('admin.loadingUsers')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right sm:text-left">
                                <thead>
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('admin.customer')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('admin.email')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('common.status')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{t('admin.newsletter')}</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#DAA520]/10 rounded-full flex items-center justify-center text-[#DAA520] font-bold border border-[#DAA520]/20 overflow-hidden">
                                                        {user.avatar ? (
                                                            <img src={getImageSrc(user.avatar, '')} className="w-full h-full object-cover" />
                                                        ) : getUserInitials(user)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{user.firstName} {user.lastName}</div>
                                                        <div className="text-[11px] text-gray-500 mt-0.5">{user.phone || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${user.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'
                                                        }`}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {user.isActive ? t('admin.active') : t('admin.inactive')}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.subscribedToNewsletter ? (
                                                    <span className="text-[#DAA520]"><Bell className="w-4 h-4" /></span>
                                                ) : (
                                                    <span className="text-gray-300"><BellOff className="w-4 h-4" /></span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const response = await fetch(`/api/admin/users/${user.id}`, { credentials: 'include' });
                                                                if (response.ok) {
                                                                    const data = await response.json();
                                                                    setSelectedUser(data.success && data.data?.user ? data.data.user : user);
                                                                } else {
                                                                    setSelectedUser(user);
                                                                }
                                                                setShowUserModal(true);
                                                            } catch (error) {
                                                                setSelectedUser(user);
                                                                setShowUserModal(true);
                                                            }
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteUser(user.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

                {showUserModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowUserModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold">{t('admin.userDetails')}</h2>
                                <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-24 h-24 bg-[#DAA520]/10 rounded-2xl flex items-center justify-center text-[#DAA520] text-3xl font-bold border-2 border-[#DAA520]/20 overflow-hidden shadow-inner">
                                        {selectedUser.avatar ? (
                                            <img src={getImageSrc(selectedUser.avatar, '')} className="w-full h-full object-cover" />
                                        ) : getUserInitials(selectedUser)}
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h3 className="text-2xl font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                        <p className="text-gray-500 font-medium">{selectedUser.email}</p>
                                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {selectedUser.isActive ? t('admin.active') : t('admin.inactive')}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedUser.emailVerified ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {selectedUser.emailVerified ? t('admin.verified') : t('admin.unverified')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.phone')}</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2"><Phone className="w-4 h-4 text-gray-300" /> {selectedUser.phone || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.date')}</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-300" /> {formatDate(selectedUser.createdAt)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.lastLogin')}</p>
                                        <p className="font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-300" /> {formatDate(selectedUser.lastLoginAt)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.newsletter')}</p>
                                        <p className={`font-bold flex items-center gap-2 ${selectedUser.subscribedToNewsletter ? 'text-[#DAA520]' : 'text-gray-400'}`}>
                                            {selectedUser.subscribedToNewsletter ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                                            {selectedUser.subscribedToNewsletter ? t('admin.subscribed') : t('admin.notSubscribed')}
                                        </p>
                                    </div>
                                </div>

                                {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold border-l-4 border-[#DAA520] pl-3 uppercase tracking-wider">{t('admin.address')}</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {selectedUser.addresses.map((addr, i) => (
                                                <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group overflow-hidden">
                                                    {addr.isDefault && <div className="absolute top-0 right-0 bg-[#DAA520] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">{t('admin.default')}</div>}
                                                    <div className="flex gap-4">
                                                        <div className="mt-1 p-2 bg-white rounded-lg border text-gray-400 group-hover:text-[#DAA520] transition-colors"><MapPin className="w-5 h-5" /></div>
                                                        <div className="flex-1 space-y-1">
                                                            <p className="font-bold text-gray-900">{addr.name}</p>
                                                            <p className="text-sm text-gray-600 leading-relaxed">{addr.address}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{addr.city}, {addr.postalCode} • {addr.phone}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => toggleUserStatus(selectedUser.id, selectedUser.isActive)}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-transform active:scale-95 shadow-sm ${selectedUser.isActive ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                    >
                                        {selectedUser.isActive ? t('admin.deactivateAccount') : t('admin.activateAccount')}
                                    </button>
                                    <button onClick={() => setShowUserModal(false)} className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">{t('common.cancel')}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

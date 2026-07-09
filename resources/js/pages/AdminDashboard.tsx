import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToastFeedback } from '@/hooks/use-toast-feedback';
import {
    Activity, AlertTriangle, CheckCircle2, ChevronRight, Clock, Eye, EyeOff,
    Filter, Globe, GraduationCap, KeyRound, Layers, Lock, LogIn,
    MoreVertical, Plus, RefreshCw, Search, Shield, ShieldAlert,
    ShieldCheck, Unlock, User, UserCheck, UserCog, UserMinus,
    UserPlus, Users, UserX, X, Building2, MapPin, School,
    ChevronDown, Info, Monitor, Smartphone, Globe2, Wifi,
    ArrowLeft, ArrowRight, Download, Edit2, Trash2, RotateCcw,
    Terminal, Database, AlertCircle,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
interface SystemUser {
    id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    name: string;
    email: string;
    phone?: string;
    roles?: { name: string }[];
    permissions?: { name: string }[];
    role?: string;
    region?: { id: string; name: string };
    district?: { id: string; name: string };
    school?: { id: string; name: string };
    status: 'active' | 'inactive' | 'locked' | 'suspended' | 'archived' | 'pending';
    last_login_at?: string;
    failed_login_attempts?: number;
}

interface RoleData {
    name: string;
    scope: string;
    color: string;
    description: string;
    permissions: string[];
    users_count: number;
}

interface AuditEntry {
    id: string;
    user?: { id: string; name: string; email: string; role?: string };
    user_email?: string;
    user_name?: string;
    module: string;
    action: string;
    description: string;
    status: 'success' | 'failed';
    ip_address?: string;
    browser?: string;
    device?: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    time_ago: string;
    created_at: string;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
const apiHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const abbreviateRole = (role: string): string => {
    if (!role) return '—';
    if (role === 'Regional Education Officer (REO)') return 'REO';
    if (role === 'District Education Officer (DEO)') return 'DEO';
    if (role === 'District Academic Officer') return 'DAO';
    if (role === 'Head of School') return 'HOS';
    if (role === 'Academic Master/Mistress') return 'Academic';
    if (role === 'Subject Teacher') return 'Teacher';
    if (role === 'Super Administrator') return 'Super Admin';
    return role;
};

const STATUS_BADGE: Record<string, string> = {
    active:    'bg-emerald-100 text-emerald-800',
    inactive:  'bg-gray-100 text-gray-600',
    locked:    'bg-red-100 text-red-800',
    suspended: 'bg-amber-100 text-amber-800',
    archived:  'bg-slate-100 text-slate-600',
    pending:   'bg-blue-100 text-blue-800',
    success:   'bg-emerald-100 text-emerald-700',
    failed:    'bg-red-100 text-red-700',
};

const ROLE_COLOR: Record<string, string> = {
    red:    'bg-red-500',
    blue:   'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    emerald:'bg-emerald-500',
    teal:   'bg-teal-500',
    cyan:   'bg-cyan-500',
    yellow: 'bg-amber-400',
    orange: 'bg-orange-400',
};

const ROLE_GRADIENT: Record<string, string> = {
    red:    'from-red-50 to-red-100 border-red-200',
    blue:   'from-blue-50 to-blue-100 border-blue-200',
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200',
    violet: 'from-violet-50 to-violet-100 border-violet-200',
    emerald:'from-emerald-50 to-emerald-100 border-emerald-200',
    teal:   'from-teal-50 to-teal-100 border-teal-200',
    cyan:   'from-cyan-50 to-cyan-100 border-cyan-200',
    yellow: 'from-amber-50 to-amber-100 border-amber-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200',
};

// ──────────────────────────────────────────────────────────────
// Audit Log Detail Modal
// ──────────────────────────────────────────────────────────────
function AuditDetailModal({ log, onClose }: { log: AuditEntry; onClose: () => void }) {
    const formatJson = (obj?: Record<string, any>) => {
        if (!obj || Object.keys(obj).length === 0) return null;
        return JSON.stringify(obj, null, 2);
    };

    const userInfo = log.user || { name: log.user_name ?? 'System', email: log.user_email ?? '—', role: '—' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 ${log.status === 'failed' ? 'bg-red-600' : 'bg-[#0F4C81]'}`}>
                    <div className="flex items-center gap-3">
                        <Terminal className="h-5 w-5 text-white opacity-80" />
                        <div>
                            <p className="text-xs font-medium text-white/70 uppercase tracking-widest">{log.module}</p>
                            <h3 className="text-base font-bold text-white">{log.action}</h3>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 text-white/70 hover:bg-white/20 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Summary row */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        {[
                            { label: 'User', value: userInfo.name, icon: <User className="h-3.5 w-3.5" /> },
                            { label: 'Email', value: userInfo.email, icon: <Globe2 className="h-3.5 w-3.5" /> },
                            { label: 'Role', value: userInfo.role ?? '—', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
                            { label: 'IP Address', value: log.ip_address ?? '—', icon: <Wifi className="h-3.5 w-3.5" /> },
                            { label: 'Browser', value: log.browser ?? '—', icon: <Monitor className="h-3.5 w-3.5" /> },
                            { label: 'Device', value: log.device ?? '—', icon: <Smartphone className="h-3.5 w-3.5" /> },
                        ].map(({ label, value, icon }) => (
                            <div key={label} className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                                <div className="flex items-center gap-1.5 text-slate-400 mb-1">{icon}<span className="text-xs">{label}</span></div>
                                <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-slate-700">{log.description}</p>
                    </div>

                    {/* Before / After diff */}
                    {(log.old_values || log.new_values) && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {log.old_values && (
                                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                    <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <ArrowLeft className="h-3 w-3" /> Before
                                    </p>
                                    <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap break-all">{formatJson(log.old_values)}</pre>
                                </div>
                            )}
                            {log.new_values && (
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <ArrowRight className="h-3 w-3" /> After
                                    </p>
                                    <pre className="text-xs text-emerald-800 font-mono whitespace-pre-wrap break-all">{formatJson(log.new_values)}</pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status + time */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold ${STATUS_BADGE[log.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {log.status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            {log.status}
                        </span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{log.time_ago} · {new Date(log.created_at).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// User Form Modal
// ──────────────────────────────────────────────────────────────
function UserFormModal({ onClose, onSaved, editUser }: {
    onClose: () => void;
    onSaved: () => void;
    editUser?: SystemUser | null;
}) {
    const [formData, setFormData] = useState({
        first_name: editUser?.first_name ?? '',
        middle_name: editUser?.middle_name ?? '',
        last_name: editUser?.last_name ?? '',
        email: editUser?.email ?? '',
        phone: editUser?.phone ?? '',
        password: '',
        role: editUser?.roles?.[0]?.name ?? editUser?.role ?? '',
        region_id: editUser?.region?.id ?? '',
        district_id: editUser?.district?.id ?? '',
        school_id: editUser?.school?.id ?? '',
        status: editUser?.status ?? 'active',
        permissions: editUser?.permissions?.map(p => p.name) ?? [],
    });
    const [formMeta, setFormMeta] = useState<any>({ regions: [], districts: [], schools: [], roles: [], permissions: [] });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useToastFeedback({
        error,
        clearError: () => setError(''),
    });

    useEffect(() => {
        fetch('/api/v1/users/form-data', { headers: apiHeaders() })
            .then(r => r.json()).then(setFormMeta).catch(() => {});
    }, []);

    const set = (k: string, v: string | string[]) => setFormData(p => ({ ...p, [k]: v }));

    const togglePermission = (perm: string) => {
        setFormData(p => {
            const current = p.permissions;
            return {
                ...p,
                permissions: current.includes(perm) 
                    ? current.filter(x => x !== perm) 
                    : [...current, perm]
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const method = editUser ? 'PUT' : 'POST';
            const url = editUser ? `/api/v1/users/${editUser.id}` : '/api/v1/users';
            const res = await fetch(url, { method, headers: apiHeaders(), body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Failed to save user.');
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between bg-[#0F4C81] px-6 py-4">
                    <h3 className="text-base font-bold text-white">{editUser ? 'Edit User' : 'Create New User'}</h3>
                    <button onClick={onClose} className="rounded-full p-1 text-white/70 hover:bg-white/20"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hover">
                    {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2"><AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}</div>}

                    <div className="grid grid-cols-3 gap-3">
                        {(['first_name', 'middle_name', 'last_name'] as const).map(f => (
                            <div key={f}>
                                <label className="block text-xs font-semibold text-slate-600 mb-1 capitalize">{f.replace('_', ' ')}</label>
                                <input value={formData[f]} onChange={e => set(f, e.target.value)} required={f !== 'middle_name'}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F4C81] focus:ring-1 focus:ring-[#0F4C81]/20" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={e => set('email', e.target.value)} required
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F4C81]" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                            <input type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F4C81]" />
                        </div>
                    </div>

                    {!editUser && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={formData.password} 
                                    onChange={e => set('password', e.target.value)} 
                                    required 
                                    minLength={8}
                                    className="w-full rounded-xl border border-slate-200 pl-3 pr-10 py-2 text-sm outline-none focus:border-[#0F4C81]" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                        <SearchableSelect
                            value={formData.role}
                            onValueChange={(value) => set('role', value)}
                            placeholder="Select role"
                            searchPlaceholder="Search role..."
                            options={formMeta.roles.map((r: any) => ({ value: r.name, label: abbreviateRole(r.name) }))}
                            className="mt-1"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Region</label>
                            <SearchableSelect
                                value={formData.region_id}
                                onValueChange={(value) => set('region_id', value)}
                                placeholder="Any"
                                searchPlaceholder="Search region..."
                                options={formMeta.regions.map((r: any) => ({ value: r.id, label: r.name }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">District</label>
                            <SearchableSelect
                                value={formData.district_id}
                                onValueChange={(value) => set('district_id', value)}
                                placeholder="Any"
                                searchPlaceholder="Search district..."
                                options={formMeta.districts.map((d: any) => ({ value: d.id, label: d.name }))}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">School</label>
                            <SearchableSelect
                                value={formData.school_id}
                                onValueChange={(value) => set('school_id', value)}
                                placeholder="Any"
                                searchPlaceholder="Search school..."
                                options={formMeta.schools.map((s: any) => ({ value: s.id, label: s.name }))}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                        <SearchableSelect
                            value={formData.status}
                            onValueChange={(value) => set('status', value)}
                            placeholder="Select status"
                            searchPlaceholder="Search status..."
                            options={['active', 'pending', 'inactive'].map(s => ({ value: s, label: s }))}
                            className="mt-1"
                        />
                    </div>

                    {formMeta.permissions?.length > 0 && (
                        <div className="border-t border-slate-100 pt-3 mt-2">
                            <label className="block text-xs font-semibold text-slate-600 mb-2">Direct Permissions (Optional)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50 scrollbar-hover">
                                {formMeta.permissions.map((p: string) => (
                                    <label key={p} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded transition">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.permissions.includes(p)}
                                            onChange={() => togglePermission(p)}
                                            className="rounded border-slate-300 text-[#0F4C81] focus:ring-[#0F4C81]"
                                        />
                                        <span className="truncate" title={p}>{p}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Assign granular permissions directly to this user beyond their role.</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-[#0F4C81] py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66] transition disabled:opacity-60">
                            {saving ? 'Saving…' : editUser ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Users Tab
// ──────────────────────────────────────────────────────────────
function UsersTab() {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editUser, setEditUser] = useState<SystemUser | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), per_page: '20' });
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`/api/v1/users?${params}`, { headers: apiHeaders() });
            const data = await res.json();
            setUsers(data.data ?? []);
            setTotalPages(data.last_page ?? 1);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [page, search, statusFilter]);

    useEffect(() => { load(); }, [load]);

    const changeStatus = async (id: string, status: string) => {
        setActionLoading(id + status);
        await fetch(`/api/v1/users/${id}/status`, {
            method: 'PATCH', headers: apiHeaders(), body: JSON.stringify({ status }),
        });
        setActionLoading(null);
        load();
    };

    const resetPwd = async (id: string) => {
        const pwd = prompt('Enter new password (min 8 chars):');
        if (!pwd) return;
        setActionLoading(id + 'reset');
        await fetch(`/api/v1/users/${id}/reset-password`, {
            method: 'POST', headers: apiHeaders(),
            body: JSON.stringify({ password: pwd, password_confirmation: pwd }),
        });
        setActionLoading(null);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-1 min-w-0 gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search users…"
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F4C81]" />
                    </div>
                    <SearchableSelect
                        value={statusFilter}
                        onValueChange={(value) => { setStatusFilter(value); setPage(1); }}
                        placeholder="All statuses"
                        searchPlaceholder="Search status..."
                        options={['active', 'inactive', 'locked', 'suspended', 'archived', 'pending'].map(s => ({ value: s, label: s }))}
                        className="min-w-[220px]"
                    />
                </div>
                <button onClick={() => { setEditUser(null); setShowForm(true); }}
                    className="flex items-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c3c66] transition shadow-sm">
                    <UserPlus className="h-4 w-4" /> Add User
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm scrollbar-hover">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                            {['User', 'Role', 'Scope', 'Status', 'Last Login', 'Actions'].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" />
                            </td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-slate-400 text-sm">No users found.</td></tr>
                        ) : users.map(u => {
                            const roleName = abbreviateRole(u.roles?.[0]?.name ?? u.role ?? '—');
                            const scope = [u.school?.name, u.district?.name, u.region?.name].filter(Boolean).join(' › ') || 'System-wide';
                            const isLocked = actionLoading?.startsWith(u.id);
                            return (
                                <tr key={u.id} className="group hover:bg-slate-50/80 transition">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F4C81]/10 text-xs font-black text-[#0F4C81] border border-[#0F4C81]/10 shadow-sm">
                                                {(u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-800">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="rounded-full bg-[#0F4C81]/10 px-2.5 py-0.5 text-xs font-medium text-[#0F4C81] w-fit">
                                                {roleName}
                                            </span>
                                            {u.permissions && u.permissions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                                                    {u.permissions.map(p => (
                                                        <span key={p.name} className="inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold font-mono bg-amber-50 text-amber-700 border border-amber-200" title="Direct Permission">
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-500">{scope}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[u.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {u.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                                            {u.status === 'locked' && <Lock className="h-3 w-3" />}
                                            {u.status === 'suspended' && <AlertTriangle className="h-3 w-3" />}
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-400">
                                        {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => { setEditUser(u); setShowForm(true); }}
                                                title="Edit" disabled={isLocked}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            {u.status === 'locked' ? (
                                                <button onClick={() => changeStatus(u.id, 'active')} title="Unlock" disabled={isLocked}
                                                    className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 transition">
                                                    <Unlock className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button onClick={() => changeStatus(u.id, 'locked')} title="Lock" disabled={isLocked}
                                                    className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50 transition">
                                                    <Lock className="h-4 w-4" />
                                                </button>
                                            )}
                                            {u.status === 'suspended' ? (
                                                <button onClick={() => changeStatus(u.id, 'active')} title="Activate" disabled={isLocked}
                                                    className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 transition">
                                                    <UserCheck className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button onClick={() => changeStatus(u.id, 'suspended')} title="Suspend" disabled={isLocked}
                                                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 transition">
                                                    <UserX className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button onClick={() => resetPwd(u.id)} title="Reset Password" disabled={isLocked}
                                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition">
                                                <KeyRound className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 text-sm">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50 transition">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="text-slate-600">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50 transition">
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {showForm && <UserFormModal onClose={() => setShowForm(false)} onSaved={load} editUser={editUser} />}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Roles & Permissions Tab
// ──────────────────────────────────────────────────────────────
function RolesTab() {
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/roles/hierarchy', { headers: apiHeaders() })
            .then(r => r.json()).then(data => { setRoles(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" /></div>;

    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Role cards */}
            <div className="lg:col-span-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">System Role Hierarchy</p>
                <div className="space-y-2">
                    {roles.map((role, idx) => (
                        <button key={role.name} onClick={() => setSelectedRole(selectedRole?.name === role.name ? null : role)}
                            className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 bg-gradient-to-r ${ROLE_GRADIENT[role.color] ?? 'from-slate-50 to-slate-100 border-slate-200'} ${selectedRole?.name === role.name ? 'ring-2 ring-[#0F4C81]/40 shadow-md' : 'hover:shadow-sm'}`}>
                            <div className="flex items-center gap-3">
                                {/* Indentation indicator */}
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                    {Array.from({ length: Math.min(idx, 4) }).map((_, i) => (
                                        <div key={i} className="h-4 w-1 rounded-full bg-slate-200" />
                                    ))}
                                </div>
                                <div className={`h-3 w-3 rounded-full flex-shrink-0 ${ROLE_COLOR[role.color] ?? 'bg-gray-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-800 text-sm">{abbreviateRole(role.name)}</span>
                                        <span className="rounded-full bg-white/70 border border-slate-200 px-2 py-0.5 text-xs text-slate-500">{role.scope}</span>
                                        <span className="ml-auto text-xs text-slate-400">{role.users_count} user{role.users_count !== 1 ? 's' : ''}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">{role.description}</p>
                                </div>
                                <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${selectedRole?.name === role.name ? 'rotate-180' : ''}`} />
                            </div>

                            {/* Expanded permissions */}
                            {selectedRole?.name === role.name && role.permissions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-white/60">
                                    <p className="text-xs font-semibold text-slate-500 mb-2">Assigned Permissions ({role.permissions.length})</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {role.permissions.map(p => (
                                            <span key={p} className="rounded-full bg-white/80 border border-slate-200 px-2.5 py-0.5 text-xs font-mono text-slate-600">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sidebar detail */}
            <div className="lg:col-span-1">
                {selectedRole ? (
                    <div className="sticky top-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r ${ROLE_GRADIENT[selectedRole.color]}`}>
                            <div className={`h-2 w-2 rounded-full ${ROLE_COLOR[selectedRole.color]}`} />
                            {selectedRole.scope}
                        </div>
                        <h4 className="text-base font-bold text-slate-800">{abbreviateRole(selectedRole.name)}</h4>
                        <p className="mt-1 text-sm text-slate-500">{selectedRole.description}</p>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Users with this role</span>
                                <span className="font-bold text-[#0F4C81]">{selectedRole.users_count}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Total permissions</span>
                                <span className="font-bold text-[#0F4C81]">{selectedRole.permissions.length}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="sticky top-4 flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                        <Shield className="h-8 w-8 mb-2 opacity-30" />
                        Click a role to see details
                    </div>
                )}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Permissions Tab
// ──────────────────────────────────────────────────────────────
function PermissionsTab() {
    const [grouped, setGrouped] = useState<Record<string, string[]>>({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/permissions', { headers: apiHeaders() })
            .then(r => r.json()).then(data => { setGrouped(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = Object.entries(grouped).reduce<Record<string, string[]>>((acc, [cat, perms]) => {
        const f = perms.filter(p => p.toLowerCase().includes(search.toLowerCase()));
        if (f.length) acc[cat] = f;
        return acc;
    }, {});

    const total = Object.values(grouped).reduce((s, p) => s + p.length, 0);

    if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" /></div>;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-slate-500">{total} granular permissions across {Object.keys(grouped).length} categories</p>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter permissions…"
                        className="w-64 rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F4C81]" />
                </div>
            </div>
            <div className="space-y-5">
                {Object.entries(filtered).map(([category, perms]) => (
                    <div key={category}>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <span className="h-px flex-1 bg-slate-100" />
                            {category}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-500 normal-case">{perms.length}</span>
                            <span className="h-px flex-1 bg-slate-100" />
                        </h4>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                            {perms.map(perm => (
                                <div key={perm} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 hover:border-[#0F4C81]/30 hover:bg-[#0F4C81]/5 transition">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                    <span className="text-xs font-mono text-slate-700 truncate" title={perm}>{perm}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Activity Logs Tab
// ──────────────────────────────────────────────────────────────
function ActivityLogsTab() {
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditEntry | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [modules, setModules] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), per_page: '25' });
            if (search) params.set('search', search);
            if (statusFilter) params.set('status', statusFilter);
            if (moduleFilter) params.set('module', moduleFilter);
            const res = await fetch(`/api/v1/audit-logs?${params}`, { headers: apiHeaders() });
            const data = await res.json();
            setLogs(data.data ?? []);
            setTotalPages(data.last_page ?? 1);
        } catch { /* silent */ } finally { setLoading(false); }
    }, [page, search, statusFilter, moduleFilter]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        fetch('/api/v1/audit-logs/modules', { headers: apiHeaders() })
            .then(r => r.json()).then(setModules).catch(() => {});
    }, []);

    // Auto-refresh every 15s when enabled
    useEffect(() => {
        if (!autoRefresh) return;
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, [autoRefresh, load]);

    const openDetail = async (log: AuditEntry) => {
        try {
            const res = await fetch(`/api/v1/audit-logs/${log.id}`, { headers: apiHeaders() });
            const data = await res.json();
            setSelectedLog(data);
        } catch {
            setSelectedLog(log);
        }
    };

    const MODULE_ICON: Record<string, React.ReactNode> = {
        Authentication: <LogIn className="h-3.5 w-3.5" />,
        Users:          <Users className="h-3.5 w-3.5" />,
        Schools:        <School className="h-3.5 w-3.5" />,
        Districts:      <Building2 className="h-3.5 w-3.5" />,
        Regions:        <Globe className="h-3.5 w-3.5" />,
        Students:       <GraduationCap className="h-3.5 w-3.5" />,
        Examinations:   <Database className="h-3.5 w-3.5" />,
        Results:        <Activity className="h-3.5 w-3.5" />,
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search logs…"
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#0F4C81]" />
                </div>
                <SearchableSelect
                    value={moduleFilter}
                    onValueChange={(value) => { setModuleFilter(value); setPage(1); }}
                    placeholder="All modules"
                    searchPlaceholder="Search module..."
                    options={modules.map(m => ({ value: m, label: m }))}
                    className="min-w-[220px]"
                />
                <SearchableSelect
                    value={statusFilter}
                    onValueChange={(value) => { setStatusFilter(value); setPage(1); }}
                    placeholder="All statuses"
                    searchPlaceholder="Search status..."
                    options={[{ value: 'success', label: 'Success' }, { value: 'failed', label: 'Failed' }]}
                    className="min-w-[220px]"
                />
                <button onClick={load} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50 transition" title="Refresh">
                    <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setAutoRefresh(v => !v)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${autoRefresh ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    <Wifi className="h-3.5 w-3.5" /> {autoRefresh ? 'Live' : 'Live Off'}
                </button>
            </div>

            {/* Log list */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm scrollbar-hover">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/80">
                            {['Time', 'User', 'Module', 'Action / Description', 'IP', 'Status'].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center">
                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" />
                            </td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-slate-400 text-sm">No activity logs found.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} onClick={() => openDetail(log)}
                                className="cursor-pointer hover:bg-blue-50/50 transition group">
                                <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{log.time_ago}</div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <p className="font-medium text-slate-800 text-xs">{log.user?.email ?? log.user_email ?? 'system'}</p>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                        {MODULE_ICON[log.module] ?? <Activity className="h-3.5 w-3.5" />}
                                        {log.module ?? '—'}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5 max-w-xs">
                                    <p className="font-mono text-xs text-slate-500">{log.action}</p>
                                    <p className="text-xs text-slate-700 line-clamp-1 mt-0.5">{log.description}</p>
                                </td>
                                <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">{log.ip_address ?? '—'}</td>
                                <td className="px-5 py-3.5">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[log.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                        {log.status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 text-sm">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50 transition">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <span className="text-slate-600">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 hover:bg-slate-50 transition">
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            )}

            {selectedLog && <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Security Tab
// ──────────────────────────────────────────────────────────────
function SecurityTab() {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
                {
                    icon: <Lock className="h-5 w-5 text-red-500" />,
                    title: 'Account Lockout Policy',
                    items: ['Lock account after 5 failed login attempts', 'Administrator must manually unlock locked accounts', 'Reset password automatically clears lock status'],
                    color: 'border-red-100 bg-red-50/50',
                },
                {
                    icon: <KeyRound className="h-5 w-5 text-[#0F4C81]" />,
                    title: 'Password Requirements',
                    items: ['Minimum 8 characters required', 'Must contain uppercase and lowercase letters', 'Must contain at least one number', 'Must contain at least one special character', 'New user must change password on first login'],
                    color: 'border-blue-100 bg-blue-50/50',
                },
                {
                    icon: <Shield className="h-5 w-5 text-emerald-500" />,
                    title: 'Session Security',
                    items: ['Session expires after 120 minutes of inactivity', 'All sessions invalidated on logout', 'Each login generates a new Sanctum token'],
                    color: 'border-emerald-100 bg-emerald-50/50',
                },
                {
                    icon: <Activity className="h-5 w-5 text-violet-500" />,
                    title: 'Audit Trail',
                    items: ['All user actions are logged with IP and device info', 'Login attempts (success and failed) are recorded', 'Account status changes are captured in audit logs', 'Before/After values stored for all data modifications'],
                    color: 'border-violet-100 bg-violet-50/50',
                },
            ].map(({ icon, title, items, color }) => (
                <div key={title} className={`rounded-2xl border p-5 ${color}`}>
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-white p-2 shadow-sm">{icon}</div>
                        <h4 className="font-bold text-slate-800">{title}</h4>
                    </div>
                    <ul className="space-y-2">
                        {items.map(item => (
                            <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
}

// ──────────────────────────────────────────────────────────────
// Main AdminDashboard
// ──────────────────────────────────────────────────────────────
const TABS = [
    { id: 'users',       label: 'Users',         icon: Users },
    { id: 'roles',       label: 'Roles',         icon: ShieldCheck },
    { id: 'permissions', label: 'Permissions',   icon: KeyRound },
    { id: 'activity',    label: 'Activity Logs', icon: Activity },
    { id: 'security',    label: 'Security',      icon: ShieldAlert },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminDashboard() {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<TabId>('users');
    const [summary, setSummary] = useState({ total: 0, active: 0, locked: 0, recent: 0 });

    useEffect(() => {
        const path = location.pathname;
        if (path === '/roles') {
            setActiveTab('roles');
        } else if (path === '/permissions') {
            setActiveTab('permissions');
        } else if (path === '/audit-logs' || path === '/audit/user-activities') {
            setActiveTab('activity');
        } else if (path === '/security') {
            setActiveTab('security');
        } else {
            setActiveTab('users');
        }
    }, [location.pathname]);

    useEffect(() => {
        // Load quick stats from the users endpoint
        fetch('/api/v1/users?per_page=1', { headers: apiHeaders() })
            .then(r => r.json())
            .then(data => setSummary(s => ({ ...s, total: data.total ?? 0 })))
            .catch(() => {});
        fetch('/api/v1/users?status=active&per_page=1', { headers: apiHeaders() })
            .then(r => r.json())
            .then(data => setSummary(s => ({ ...s, active: data.total ?? 0 })))
            .catch(() => {});
        fetch('/api/v1/users?status=locked&per_page=1', { headers: apiHeaders() })
            .then(r => r.json())
            .then(data => setSummary(s => ({ ...s, locked: data.total ?? 0 })))
            .catch(() => {});
        fetch('/api/v1/audit-logs?per_page=1', { headers: apiHeaders() })
            .then(r => r.json())
            .then(data => setSummary(s => ({ ...s, recent: data.total ?? 0 })))
            .catch(() => {});
    }, []);

    const stats = [
        { label: 'Total Users',     value: summary.total,  icon: Users,       bgTint: 'bg-[#0F4C81]/10', textStyle: 'text-[#0F4C81]' },
        { label: 'Active Accounts',  value: summary.active, icon: UserCheck,   bgTint: 'bg-emerald-500/10', textStyle: 'text-emerald-700' },
        { label: 'Locked Accounts',  value: summary.locked, icon: Lock,        bgTint: 'bg-rose-500/10', textStyle: 'text-rose-700' },
        { label: 'Audit Events',    value: summary.recent, icon: Activity,    bgTint: 'bg-violet-500/10', textStyle: 'text-violet-700' },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Administration Console</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage user accounts, roles, permissions, and monitor system activity.
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    System Operational
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map(({ label, value, icon: Icon, bgTint, textStyle }) => (
                    <div key={label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{label}</p>
                                <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                            </div>
                            <div className={`rounded-xl ${bgTint} p-3 flex-shrink-0`}>
                                <Icon className={`h-6 w-6 ${textStyle}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'users'       && <UsersTab />}
                {activeTab === 'roles'       && <RolesTab />}
                {activeTab === 'permissions' && <PermissionsTab />}
                {activeTab === 'activity'    && <ActivityLogsTab />}
                {activeTab === 'security'    && <SecurityTab />}
            </div>
        </div>
    );
}

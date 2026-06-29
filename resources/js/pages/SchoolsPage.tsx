import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    School, Plus, Pencil, Trash2, Search, RefreshCw, X, Check,
    BarChart3, ChartColumn, MapPin, Layers3, Tag, Phone, Mail, Building2
} from 'lucide-react';

interface Region { id: string; name: string; code: string; }
interface District { id: string; name: string; code: string; region_id: string; region?: Region; }
interface SchoolItem {
    id: string;
    name: string;
    registration_number: string;
    type: string;
    level: string;
    phone_number?: string;
    email?: string;
    address?: string;
    district_id: string;
    district?: District;
}

interface SchoolForm {
    district_id: string;
    name: string;
    registration_number: string;
    type: string;
    level: string;
    phone_number: string;
    email: string;
    address: string;
}

const emptyForm: SchoolForm = {
    district_id: '', name: '', registration_number: '', type: 'government',
    level: 'secondary', phone_number: '', email: '', address: '',
};

type TabId = 'schools' | 'categories' | 'statistics' | 'performance';

const TABS: { id: TabId; label: string; path: string }[] = [
    { id: 'schools', label: 'Schools List', path: '/schools' },
    { id: 'categories', label: 'School Categories', path: '/school-categories' },
    { id: 'statistics', label: 'Statistics', path: '/school-statistics' },
    { id: 'performance', label: 'Performance History', path: '/school-performance-history' },
];

export default function SchoolsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [schools, setSchools] = useState<SchoolItem[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [filteredDistricts, setFilteredDistricts] = useState<District[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterType, setFilterType] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [activeTab, setActiveTab] = useState<TabId>('schools');
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<SchoolForm>(emptyForm);
    const [formErrors, setFormErrors] = useState<Partial<SchoolForm>>({});
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    // Sync tab from URL
    useEffect(() => {
        const path = location.pathname;
        const tab = TABS.find(t => t.path === path);
        setActiveTab(tab?.id ?? 'schools');
    }, [location.pathname]);

    // Filter districts by selected region in filter bar
    useEffect(() => {
        if (filterRegion) {
            setFilteredDistricts(districts.filter(d => d.region_id === filterRegion));
            setFilterDistrict('');
        } else {
            setFilteredDistricts(districts);
        }
    }, [filterRegion, districts]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [regRes, distRes] = await Promise.all([
                fetch('/api/v1/regions', { headers }),
                fetch('/api/v1/districts', { headers }),
            ]);
            const regData = await regRes.json();
            const distData = await distRes.json();
            setRegions(Array.isArray(regData) ? regData : regData.data || []);
            setDistricts(Array.isArray(distData) ? distData : distData.data || []);

            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterDistrict) params.append('district_id', filterDistrict);
            if (filterRegion) params.append('region_id', filterRegion);
            if (filterType) params.append('type', filterType);
            const url = `/api/v1/schools${params.toString() ? '?' + params.toString() : ''}`;
            const schRes = await fetch(url, { headers });
            const schData = await schRes.json();
            setSchools(Array.isArray(schData) ? schData : schData.data || []);
        } catch {
            setError('Imeshindwa kupakia data ya shule.');
        } finally {
            setLoading(false);
        }
    }, [search, filterDistrict, filterRegion, filterType]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError('');
        setShowModal(true);
    };

    const openEdit = (school: SchoolItem) => {
        setEditId(school.id);
        setForm({
            district_id: school.district_id,
            name: school.name,
            registration_number: school.registration_number,
            type: school.type,
            level: school.level,
            phone_number: school.phone_number || '',
            email: school.email || '',
            address: school.address || '',
        });
        setFormErrors({});
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError('');
    };

    const validate = (): boolean => {
        const errs: Partial<SchoolForm> = {};
        if (!form.district_id) errs.district_id = 'Chagua wilaya.';
        if (!form.name.trim()) errs.name = 'Jina la shule linahitajika.';
        if (!form.registration_number.trim()) errs.registration_number = 'Nambari ya usajili inahitajika.';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        setError('');
        try {
            const url = editId ? `/api/v1/schools/${editId}` : '/api/v1/schools';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kuhifadhi.');
            setSuccess(body.message || 'Shule imehifadhiwa.');
            closeModal();
            fetchAll();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        setError('');
        try {
            const res = await fetch(`/api/v1/schools/${id}`, { method: 'DELETE', headers });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kufuta.');
            setSuccess(body.message || 'Shule imefutwa.');
            setConfirmDelete(null);
            fetchAll();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(null);
        }
    };

    // Modal form: district filtered by region selection in form
    const [formRegion, setFormRegion] = useState('');
    const formDistricts = formRegion
        ? districts.filter(d => d.region_id === formRegion)
        : districts;

    const totalGov = schools.filter(s => s.type === 'government').length;
    const totalPrivate = schools.filter(s => s.type === 'private').length;
    const districtsCovered = new Set(schools.map(s => s.district_id)).size;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Schools Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Register, manage and track schools across all districts.</p>
                </div>
                {activeTab === 'schools' && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] transition"
                    >
                        <Plus className="h-4 w-4" /> Register School
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); navigate(tab.path); }}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${activeTab === tab.id ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Alerts */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
                    <X className="h-4 w-4 shrink-0" /> {error}
                </div>
            )}
            {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0" /> {success}
                </div>
            )}

            {/* SCHOOLS TAB */}
            {activeTab === 'schools' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                            { label: 'Total Schools', value: schools.length, color: 'text-[#0F4C81]', bg: 'bg-blue-50' },
                            { label: 'Government', value: totalGov, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                            { label: 'Private', value: totalPrivate, color: 'text-amber-700', bg: 'bg-amber-50' },
                            { label: 'Districts', value: districtsCovered, color: 'text-purple-700', bg: 'bg-purple-50' },
                        ].map(stat => (
                            <div key={stat.label} className={`rounded-2xl border ${stat.bg} px-5 py-4`}>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                                <p className={`mt-1 text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Search + filters */}
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
                            <div className="relative flex-1 min-w-[180px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search schools..."
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-[#0F4C81] focus:outline-none focus:bg-white"
                                />
                            </div>
                            <select
                                value={filterRegion}
                                onChange={e => setFilterRegion(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#0F4C81] focus:outline-none"
                            >
                                <option value="">All Regions</option>
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <select
                                value={filterDistrict}
                                onChange={e => setFilterDistrict(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#0F4C81] focus:outline-none"
                            >
                                <option value="">All Districts</option>
                                {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#0F4C81] focus:outline-none"
                            >
                                <option value="">All Types</option>
                                <option value="government">Government</option>
                                <option value="private">Private</option>
                            </select>
                            <button onClick={fetchAll} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                                <RefreshCw className="h-4 w-4" /> Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" />
                            </div>
                        ) : (
                            <div className="derms-table-wrap rounded-none border-0 shadow-none">
                                <table className="min-w-full divide-y divide-gray-100 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">#</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">School Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Reg No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">District / Region</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Type</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {schools.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-16 text-center text-gray-400">
                                                    <School className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                                    No schools found. Register one using the button above.
                                                </td>
                                            </tr>
                                        ) : schools.map((school, idx) => (
                                            <React.Fragment key={school.id}>
                                                <tr
                                                    className="hover:bg-blue-50/30 transition cursor-pointer"
                                                    onClick={() => setExpandedSchool(expandedSchool === school.id ? null : school.id)}
                                                >
                                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                                    <td className="px-6 py-4 font-semibold text-gray-900">{school.name}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{school.registration_number}</td>
                                                    <td className="px-6 py-4 text-gray-600 text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <Layers3 className="h-3 w-3 text-gray-400" />
                                                            {school.district?.name ?? '—'}
                                                        </div>
                                                        {school.district?.region && (
                                                            <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                                                                <MapPin className="h-3 w-3" />
                                                                {school.district.region.name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${school.type === 'government' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                            {school.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => openEdit(school)}
                                                                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:border-[#0F4C81] hover:text-[#0F4C81] transition"
                                                                title="Edit school"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(school.id)}
                                                                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:border-red-400 hover:text-red-600 transition"
                                                                title="Delete school"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Expanded row */}
                                                {expandedSchool === school.id && (
                                                    <tr className="bg-blue-50/40">
                                                        <td colSpan={6} className="px-8 py-4">
                                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-gray-600">
                                                                {school.phone_number && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                                                                        {school.phone_number}
                                                                    </div>
                                                                )}
                                                                {school.email && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                                        {school.email}
                                                                    </div>
                                                                )}
                                                                {school.address && (
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                                        {school.address}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2">
                                                                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                                                                    Level: <span className="font-semibold capitalize">{school.level}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === 'categories' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-900">School Category Breakdown</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: 'Government Secondary', count: schools.filter(s => s.type === 'government' && s.level === 'secondary').length, color: 'bg-green-100 text-green-800' },
                            { label: 'Private Secondary', count: schools.filter(s => s.type === 'private' && s.level === 'secondary').length, color: 'bg-yellow-100 text-yellow-800' },
                            { label: 'Government Primary', count: schools.filter(s => s.type === 'government' && s.level === 'primary').length, color: 'bg-blue-100 text-blue-800' },
                            { label: 'Private Primary', count: schools.filter(s => s.type === 'private' && s.level === 'primary').length, color: 'bg-purple-100 text-purple-800' },
                        ].map(cat => (
                            <div key={cat.label} className="rounded-2xl border p-5">
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.color}`}>{cat.label}</span>
                                <p className="mt-3 text-3xl font-extrabold text-gray-900">{cat.count}</p>
                                <p className="text-xs text-gray-500 mt-0.5">schools</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* STATISTICS TAB */}
            {activeTab === 'statistics' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-[#0F4C81]" />
                        <h3 className="text-lg font-bold text-gray-900">School Statistics</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl bg-blue-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Total Schools</p>
                            <p className="mt-1 text-4xl font-extrabold text-[#0F4C81]">{schools.length}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Government</p>
                            <p className="mt-1 text-4xl font-extrabold text-emerald-700">{totalGov}</p>
                            <p className="text-xs text-emerald-600 mt-1">{schools.length > 0 ? Math.round((totalGov / schools.length) * 100) : 0}% of total</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 p-5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Private</p>
                            <p className="mt-1 text-4xl font-extrabold text-amber-700">{totalPrivate}</p>
                            <p className="text-xs text-amber-600 mt-1">{schools.length > 0 ? Math.round((totalPrivate / schools.length) * 100) : 0}% of total</p>
                        </div>
                    </div>

                    {/* Per-district breakdown */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3">Schools per District</h4>
                        <div className="space-y-2">
                            {districts.map(d => {
                                const count = schools.filter(s => s.district_id === d.id).length;
                                const pct = schools.length > 0 ? Math.round((count / schools.length) * 100) : 0;
                                return (
                                    <div key={d.id} className="flex items-center gap-3">
                                        <div className="w-32 text-xs text-gray-600 truncate">{d.name}</div>
                                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-[#0F4C81] h-2 rounded-full transition-all"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600 w-8 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* PERFORMANCE TAB */}
            {activeTab === 'performance' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <ChartColumn className="h-6 w-6 text-[#0F4C81]" />
                        <h3 className="text-lg font-bold text-gray-900">School Performance History</h3>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                        ⚠ School performance rankings will populate here once examination results have been processed and published. Go to <strong>Results Management → Process Results</strong> to generate rankings.
                    </div>
                    <div className="overflow-hidden rounded-xl border">
                        <div className="overflow-x-auto w-full">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Rank', 'School', 'District', 'Exam', 'GPA', 'Division I', 'Pass Rate'].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        No performance data available yet.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Create / Edit Modal ─────────────────────────────────────────── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-gray-900">{editId ? 'Edit School' : 'Register School'}</h2>
                            <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">School Name <span className="text-red-500">*</span></label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    type="text"
                                    placeholder="e.g. Kinondoni Secondary School"
                                    className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Registration No. <span className="text-red-500">*</span></label>
                                    <input
                                        value={form.registration_number}
                                        onChange={e => setForm(f => ({ ...f, registration_number: e.target.value }))}
                                        type="text"
                                        placeholder="e.g. S0102"
                                        className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${formErrors.registration_number ? 'border-red-400' : 'border-gray-300'}`}
                                    />
                                    {formErrors.registration_number && <p className="mt-1 text-xs text-red-600">{formErrors.registration_number}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Ownership</label>
                                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none">
                                        <option value="government">Government</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Region</label>
                                    <select
                                        value={formRegion}
                                        onChange={e => { setFormRegion(e.target.value); setForm(f => ({ ...f, district_id: '' })); }}
                                        className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none"
                                    >
                                        <option value="">Select Region</option>
                                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">District <span className="text-red-500">*</span></label>
                                    <select
                                        value={form.district_id}
                                        onChange={e => setForm(f => ({ ...f, district_id: e.target.value }))}
                                        className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${formErrors.district_id ? 'border-red-400' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select District</option>
                                        {formDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    {formErrors.district_id && <p className="mt-1 text-xs text-red-600">{formErrors.district_id}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Level</label>
                                <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none">
                                    <option value="secondary">Secondary</option>
                                    <option value="primary">Primary</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Phone</label>
                                    <input value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} type="tel" placeholder="+255..." className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="school@example.com" className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Address</label>
                                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} type="text" placeholder="Physical address" className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none" />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                                <button type="submit" disabled={saving} className="rounded-xl bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66] disabled:opacity-50 transition">
                                    {saving ? 'Saving...' : editId ? 'Save Changes' : 'Register School'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Delete School</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{schools.find(s => s.id === confirmDelete)?.name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">Cancel</button>
                            <button
                                onClick={() => handleDelete(confirmDelete)}
                                disabled={!!deleting}
                                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

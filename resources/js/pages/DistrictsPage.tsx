import React, { useState, useEffect, useCallback } from 'react';
import { Layers3, Plus, Pencil, Trash2, Search, School, RefreshCw, X, Check, MapPin } from 'lucide-react';

interface Region {
    id: string;
    name: string;
    code: string;
}

interface District {
    id: string;
    name: string;
    code: string;
    region_id: string;
    region?: Region;
    schools_count: number;
}

interface DistrictForm {
    region_id: string;
    name: string;
    code: string;
}

const emptyForm: DistrictForm = { region_id: '', name: '', code: '' };

export default function DistrictsPage() {
    const [districts, setDistricts] = useState<District[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<DistrictForm>(emptyForm);
    const [formErrors, setFormErrors] = useState<Partial<DistrictForm>>({});
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    const fetchRegions = useCallback(async () => {
        try {
            const res = await fetch('/api/v1/regions', { headers });
            const data = await res.json();
            setRegions(Array.isArray(data) ? data : data.data || []);
        } catch { /* ignore */ }
    }, []);

    const fetchDistricts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterRegion) params.append('region_id', filterRegion);
            const url = `/api/v1/districts${params.toString() ? '?' + params.toString() : ''}`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            setDistricts(Array.isArray(data) ? data : data.data || []);
        } catch {
            setError('Imeshindwa kupakia wilaya.');
        } finally {
            setLoading(false);
        }
    }, [search, filterRegion]);

    useEffect(() => { fetchRegions(); }, [fetchRegions]);
    useEffect(() => { fetchDistricts(); }, [fetchDistricts]);

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError('');
        setShowModal(true);
    };

    const openEdit = (district: District) => {
        setEditId(district.id);
        setForm({ region_id: district.region_id, name: district.name, code: district.code });
        setFormErrors({});
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        setForm(emptyForm);
        setFormErrors({});
    };

    const validate = (): boolean => {
        const errs: Partial<DistrictForm> = {};
        if (!form.region_id) errs.region_id = 'Chagua mkoa.';
        if (!form.name.trim()) errs.name = 'Jina la wilaya linahitajika.';
        if (!form.code.trim()) errs.code = 'Msimbo wa wilaya unahitajika.';
        else if (form.code.length > 10) errs.code = 'Msimbo usizidi herufi 10.';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        setError('');
        try {
            const url = editId ? `/api/v1/districts/${editId}` : '/api/v1/districts';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kuhifadhi.');
            setSuccess(body.message || 'Wilaya imehifadhiwa.');
            closeModal();
            fetchDistricts();
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
            const res = await fetch(`/api/v1/districts/${id}`, { method: 'DELETE', headers });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kufuta.');
            setSuccess(body.message || 'Wilaya imefutwa.');
            setConfirmDelete(null);
            fetchDistricts();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(null);
        }
    };

    const totalSchools = districts.reduce((sum, d) => sum + (d.schools_count || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Districts Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage all administrative districts grouped by region.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] transition"
                >
                    <Plus className="h-4 w-4" /> Add District
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Total Districts', value: districts.length, color: 'text-[#0F4C81]', icon: Layers3, bg: 'bg-blue-50' },
                    { label: 'Total Schools', value: totalSchools, color: 'text-emerald-700', icon: School, bg: 'bg-emerald-50' },
                    { label: 'Regions Covered', value: new Set(districts.map(d => d.region_id)).size, color: 'text-purple-700', icon: MapPin, bg: 'bg-purple-50' },
                ].map(stat => (
                    <div key={stat.label} className={`rounded-2xl border ${stat.bg} p-6 flex items-center gap-4`}>
                        <div className="rounded-xl bg-white p-3 shadow-sm">
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                            <p className={`mt-0.5 text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search districts..."
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
                    <button onClick={fetchDistricts} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>

                {error && (
                    <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
                        <X className="h-4 w-4 shrink-0" /> {error}
                    </div>
                )}
                {success && (
                    <div className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0" /> {success}
                    </div>
                )}

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
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">District Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Region</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-gray-500">Schools</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {districts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-gray-400">
                                            <Layers3 className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                            No districts found.
                                        </td>
                                    </tr>
                                ) : districts.map((district, idx) => (
                                    <tr key={district.id} className="hover:bg-blue-50/30 transition">
                                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{district.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800 uppercase tracking-wide">
                                                {district.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-gray-400" />
                                                {district.region?.name ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                <School className="h-3 w-3" /> {district.schools_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(district)}
                                                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:border-[#0F4C81] hover:text-[#0F4C81] transition"
                                                    title="Edit district"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(district.id)}
                                                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:border-red-400 hover:text-red-600 transition"
                                                    title="Delete district"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
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

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold text-gray-900">{editId ? 'Edit District' : 'Add New District'}</h2>
                            <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Region <span className="text-red-500">*</span></label>
                                <select
                                    value={form.region_id}
                                    onChange={e => setForm(f => ({ ...f, region_id: e.target.value }))}
                                    className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 ${formErrors.region_id ? 'border-red-400' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Region</option>
                                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                {formErrors.region_id && <p className="mt-1 text-xs text-red-600">{formErrors.region_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">District Name <span className="text-red-500">*</span></label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    type="text"
                                    placeholder="e.g. Kinondoni"
                                    className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">District Code <span className="text-red-500">*</span></label>
                                <input
                                    value={form.code}
                                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    type="text"
                                    placeholder="e.g. KND"
                                    maxLength={10}
                                    className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 ${formErrors.code ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {formErrors.code && <p className="mt-1 text-xs text-red-600">{formErrors.code}</p>}
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="rounded-xl bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66] disabled:opacity-50 transition">
                                    {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create District'}
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
                                <h3 className="font-bold text-gray-900">Delete District</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{districts.find(d => d.id === confirmDelete)?.name}</strong>?
                            This will fail if the district still has schools.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                                Cancel
                            </button>
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

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Pencil, Trash2, Search, Building2, School, RefreshCw, X, Check } from 'lucide-react';

interface Region {
    id: string;
    name: string;
    code: string;
    districts_count: number;
    schools_count: number;
}

interface RegionForm {
    name: string;
    code: string;
}

const emptyForm: RegionForm = { name: '', code: '' };

export default function RegionsPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<RegionForm>(emptyForm);
    const [formErrors, setFormErrors] = useState<Partial<RegionForm>>({});
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    const fetchRegions = useCallback(async () => {
        setLoading(true);
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const res = await fetch(`/api/v1/regions${params}`, { headers });
            const data = await res.json();
            setRegions(Array.isArray(data) ? data : data.data || []);
        } catch {
            setError('Imeshindwa kupakia mikoa.');
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchRegions(); }, [fetchRegions]);

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError('');
        setShowModal(true);
    };

    const openEdit = (region: Region) => {
        setEditId(region.id);
        setForm({ name: region.name, code: region.code });
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
        const errs: Partial<RegionForm> = {};
        if (!form.name.trim()) errs.name = 'Jina la mkoa linahitajika.';
        if (!form.code.trim()) errs.code = 'Msimbo wa mkoa unahitajika.';
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
            const url = editId ? `/api/v1/regions/${editId}` : '/api/v1/regions';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kuhifadhi.');
            setSuccess(body.message || 'Mkoa umehifadhiwa.');
            closeModal();
            fetchRegions();
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
            const res = await fetch(`/api/v1/regions/${id}`, { method: 'DELETE', headers });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kufuta.');
            setSuccess(body.message || 'Mkoa umefutwa.');
            setConfirmDelete(null);
            fetchRegions();
            setTimeout(() => setSuccess(''), 4000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(null);
        }
    };

    const totalDistricts = regions.reduce((sum, r) => sum + (r.districts_count || 0), 0);
    const totalSchools = regions.reduce((sum, r) => sum + (r.schools_count || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Regions Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage all administrative regions in the country.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] transition"
                >
                    <Plus className="h-4 w-4" /> Add Region
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Total Regions', value: regions.length, color: 'text-[#0F4C81]', icon: MapPin, bg: 'bg-blue-50' },
                    { label: 'Total Districts', value: totalDistricts, color: 'text-emerald-700', icon: Building2, bg: 'bg-emerald-50' },
                    { label: 'Total Schools', value: totalSchools, color: 'text-amber-700', icon: School, bg: 'bg-amber-50' },
                ].map(stat => (
                    <div key={stat.label} className={`rounded-2xl border ${stat.bg} p-6 flex items-center gap-4`}>
                        <div className={`rounded-xl bg-white p-3 shadow-sm`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                            <p className={`mt-0.5 text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search regions..."
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-[#0F4C81] focus:outline-none focus:bg-white"
                        />
                    </div>
                    <button onClick={fetchRegions} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </button>
                </div>

                {/* Alerts */}
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
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Region Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Code</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-gray-500">Districts</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase text-gray-500">Schools</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {regions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center text-gray-400">
                                            <MapPin className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                            No regions found. Click "Add Region" to create one.
                                        </td>
                                    </tr>
                                ) : regions.map((region, idx) => (
                                    <tr key={region.id} className="hover:bg-blue-50/30 transition">
                                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{region.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 uppercase tracking-wide">
                                                {region.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                <Building2 className="h-3 w-3" /> {region.districts_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                <School className="h-3 w-3" /> {region.schools_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEdit(region)}
                                                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:border-[#0F4C81] hover:text-[#0F4C81] transition"
                                                    title="Edit region"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(region.id)}
                                                    className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:border-red-400 hover:text-red-600 transition"
                                                    title="Delete region"
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
                            <h2 className="text-xl font-bold text-gray-900">{editId ? 'Edit Region' : 'Add New Region'}</h2>
                            <button onClick={closeModal} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Region Name <span className="text-red-500">*</span></label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    type="text"
                                    placeholder="e.g. Dar es Salaam"
                                    className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/30 ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700">Region Code <span className="text-red-500">*</span></label>
                                <input
                                    value={form.code}
                                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                                    type="text"
                                    placeholder="e.g. DSM"
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
                                    {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Region'}
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
                                <h3 className="font-bold text-gray-900">Delete Region</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{regions.find(r => r.id === confirmDelete)?.name}</strong>?
                            This will fail if the region still has districts.
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

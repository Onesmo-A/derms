import React, { useState, useEffect } from 'react';

const OVERLAY = 'fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50';
const MODAL_BOX = 'bg-white rounded-xl p-6 w-full max-w-md shadow-2xl';

export default function AcademicSetupPage() {
    // ── State ──────────────────────────────────────────────────────────────────
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [gradingSystems, setGradingSystems] = useState<any[]>([]);
    const [divisionRules, setDivisionRules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'years' | 'classes' | 'subjects' | 'grading' | 'rules'>('years');

    // Modals
    const [showYearModal, setShowYearModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showGradingModal, setShowGradingModal] = useState(false);
    const [showRuleModal, setShowRuleModal] = useState(false);

    // Forms
    const [yearForm, setYearForm] = useState({ name: '', start_date: '', end_date: '', is_active: false });
    const [classForm, setClassForm] = useState({ name: '', numeric_level: '' });
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', has_practical: false, class_level_id: '' });
    const [gradingForm, setGradingForm] = useState({ label: '', min_percent: '', max_percent: '', points: '' });
    const [ruleForm, setRuleForm] = useState({ name: '', min_points: '', max_points: '', badge: '' });

    // ── Auth headers ───────────────────────────────────────────────────────────
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    // ── Data fetching ──────────────────────────────────────────────────────────
    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/v1/academic-years', { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/class-levels', { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/subjects', { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/grading-systems', { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/division-rules', { headers }).then(r => r.json()).catch(() => []),
        ]).then(([years, classes, subs, grads, rules]) => {
            setAcademicYears(Array.isArray(years) ? years : years.data ?? []);
            setClassLevels(Array.isArray(classes) ? classes : classes.data ?? []);
            setSubjects(Array.isArray(subs) ? subs : subs.data ?? []);
            setGradingSystems(Array.isArray(grads) ? grads : grads.data ?? []);
            setDivisionRules(Array.isArray(rules) ? rules : rules.data ?? []);
        }).catch(console.error).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, [activeTab]);

    // ── CRUD handlers ──────────────────────────────────────────────────────────
    const handleAddYear = async () => {
        try {
            const res = await fetch('/api/v1/academic-years', { method: 'POST', headers, body: JSON.stringify(yearForm) });
            if (!res.ok) throw new Error('Failed');
            setShowYearModal(false);
            setYearForm({ name: '', start_date: '', end_date: '', is_active: false });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleAddClass = async () => {
        try {
            const res = await fetch('/api/v1/class-levels', { method: 'POST', headers, body: JSON.stringify(classForm) });
            if (!res.ok) throw new Error('Failed');
            setShowClassModal(false);
            setClassForm({ name: '', numeric_level: '' });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleAddSubject = async () => {
        try {
            const res = await fetch('/api/v1/subjects', { method: 'POST', headers, body: JSON.stringify(subjectForm) });
            if (!res.ok) throw new Error('Failed');
            setShowSubjectModal(false);
            setSubjectForm({ name: '', code: '', has_practical: false, class_level_id: '' });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleAddGrading = async () => {
        try {
            const res = await fetch('/api/v1/grading-systems', { method: 'POST', headers, body: JSON.stringify(gradingForm) });
            if (!res.ok) throw new Error('Failed');
            setShowGradingModal(false);
            setGradingForm({ label: '', min_percent: '', max_percent: '', points: '' });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleAddRule = async () => {
        try {
            const res = await fetch('/api/v1/division-rules', { method: 'POST', headers, body: JSON.stringify(ruleForm) });
            if (!res.ok) throw new Error('Failed');
            setShowRuleModal(false);
            setRuleForm({ name: '', min_points: '', max_points: '', badge: '' });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteGrading = async (id: any) => {
        try {
            await fetch(`/api/v1/grading-systems/${id}`, { method: 'DELETE', headers });
            fetchData();
        } catch (e) { console.error(e); }
    };

    const handleDeleteRule = async (id: any) => {
        try {
            await fetch(`/api/v1/division-rules/${id}`, { method: 'DELETE', headers });
            fetchData();
        } catch (e) { console.error(e); }
    };

    // ── Tabs config ────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'years', label: 'Academic Years' },
        { id: 'classes', label: 'Class Levels' },
        { id: 'subjects', label: 'Subjects' },
        { id: 'grading', label: 'Grading Systems' },
        { id: 'rules', label: 'Division Rules' },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Academic Setup</h1>
                    <p className="mt-1 text-sm text-gray-500">Configure academic years, class levels, curriculum subjects, and grading definitions.</p>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${
                            activeTab === tab.id
                                ? 'border-[#0F4C81] text-[#0F4C81]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" />
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                    {/* ── Academic Years ── */}
                    {activeTab === 'years' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Academic Years</h3>
                                <button
                                    className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66]"
                                    onClick={() => setShowYearModal(true)}
                                >
                                    New Year
                                </button>
                            </div>
                            <div className="overflow-x-auto w-full">
                            <table className="w-full border-collapse text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Year Name</th>
                                        <th className="px-6 py-3 font-semibold">Start Date</th>
                                        <th className="px-6 py-3 font-semibold">End Date</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {academicYears.length > 0 ? academicYears.map(y => (
                                        <tr key={y.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{y.name}</td>
                                            <td className="px-6 py-4">{new Date(y.start_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{new Date(y.end_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${y.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {y.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-400">No academic years set up.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    )}

                    {/* ── Class Levels ── */}
                    {activeTab === 'classes' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Class Levels</h3>
                                <button
                                    className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66]"
                                    onClick={() => setShowClassModal(true)}
                                >
                                    Add Class Level
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                {classLevels.map((c, idx) => (
                                    <div key={c.id ?? `class-${idx}`} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="font-extrabold text-gray-900">{c.name}</div>
                                        <div className="mt-1 text-xs text-gray-500">Numeric Sorting Code: {c.numeric_level ?? c.sort_order}</div>
                                    </div>
                                ))}
                                {classLevels.length === 0 && <p className="text-sm text-gray-400">No class levels yet.</p>}
                            </div>
                        </div>
                    )}

                    {/* ── Subjects ── */}
                    {activeTab === 'subjects' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Curriculum Subjects</h3>
                                <button
                                    className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66]"
                                    onClick={() => setShowSubjectModal(true)}
                                >
                                    Add Subject
                                </button>
                            </div>
                            <div className="overflow-x-auto w-full">
                            <table className="w-full border-collapse text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Subject Name</th>
                                        <th className="px-6 py-3 font-semibold">Code</th>
                                        <th className="px-6 py-3 font-semibold">Practical Component</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {subjects.map((s, idx) => (
                                        <tr key={s.id ?? `subject-${idx}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                                            <td className="px-6 py-4 font-mono">{s.code}</td>
                                            <td className="px-6 py-4">{s.has_practical ? 'Yes (Theory + Practical)' : 'No (Theory Only)'}</td>
                                        </tr>
                                    ))}
                                    {subjects.length === 0 && (
                                        <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-400">No subjects yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    )}

                    {/* ── Grading Systems ── */}
                    {activeTab === 'grading' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Grading Systems</h3>
                                <button
                                    className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66]"
                                    onClick={() => setShowGradingModal(true)}
                                >
                                    Add Grading System
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {gradingSystems.map(g => (
                                    <div key={g.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                                        <div>
                                            <span className="font-semibold text-gray-900">{g.label}</span>
                                            <span className="ml-2 text-sm text-gray-500">({g.min_percent}% – {g.max_percent}%) · Points: {g.points}</span>
                                        </div>
                                        <button
                                            className="text-sm text-red-500 hover:text-red-700"
                                            onClick={() => handleDeleteGrading(g.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                                {gradingSystems.length === 0 && <p className="text-sm text-gray-400">No grading systems yet.</p>}
                            </div>
                        </div>
                    )}

                    {/* ── Division Rules ── */}
                    {activeTab === 'rules' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">Division Rules</h3>
                                <button
                                    className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66]"
                                    onClick={() => setShowRuleModal(true)}
                                >
                                    Add Division Rule
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {divisionRules.map(r => (
                                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3">
                                        <div>
                                            <span className="font-semibold text-gray-900">{r.name}</span>
                                            <span className="ml-2 text-sm text-gray-500">{r.min_points} – {r.max_points} pts</span>
                                        </div>
                                        <button
                                            className="text-sm text-red-500 hover:text-red-700"
                                            onClick={() => handleDeleteRule(r.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                                {divisionRules.length === 0 && <p className="text-sm text-gray-400">No division rules yet.</p>}
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* ═══════════ MODALS ═══════════ */}

            {/* New Academic Year */}
            {showYearModal && (
                <div className={OVERLAY}>
                    <div className={MODAL_BOX}>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">New Academic Year</h2>
                        <div className="space-y-3">
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Year (e.g. 2026)" maxLength={4} value={yearForm.name} onChange={e => setYearForm({ ...yearForm, name: e.target.value })} />
                            <label className="block text-xs text-gray-500">Start Date</label>
                            <input type="date" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" value={yearForm.start_date} onChange={e => setYearForm({ ...yearForm, start_date: e.target.value })} />
                            <label className="block text-xs text-gray-500">End Date</label>
                            <input type="date" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" value={yearForm.end_date} onChange={e => setYearForm({ ...yearForm, end_date: e.target.value })} />
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={yearForm.is_active} onChange={e => setYearForm({ ...yearForm, is_active: e.target.checked })} />
                                Set as Active Year
                            </label>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setShowYearModal(false)}>Cancel</button>
                            <button className="px-4 py-2 rounded-lg bg-[#0F4C81] text-white text-sm hover:bg-[#0c3c66]" onClick={handleAddYear}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Class Level */}
            {showClassModal && (
                <div className={OVERLAY}>
                    <div className={MODAL_BOX}>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Add Class Level</h2>
                        <div className="space-y-3">
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Class Name (e.g. Form 1)" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Numeric Level (e.g. 1)" value={classForm.numeric_level} onChange={e => setClassForm({ ...classForm, numeric_level: e.target.value })} />
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setShowClassModal(false)}>Cancel</button>
                            <button className="px-4 py-2 rounded-lg bg-[#0F4C81] text-white text-sm hover:bg-[#0c3c66]" onClick={handleAddClass}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Subject */}
            {showSubjectModal && (
                <div className={OVERLAY}>
                    <div className={MODAL_BOX}>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Add Subject</h2>
                        <div className="space-y-3">
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Subject Name" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Code (e.g. MATH)" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} />
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={subjectForm.has_practical} onChange={e => setSubjectForm({ ...subjectForm, has_practical: e.target.checked })} />
                                Has Practical Component
                            </label>
                            <select className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" value={subjectForm.class_level_id} onChange={e => setSubjectForm({ ...subjectForm, class_level_id: e.target.value })}>
                                <option value="">Select Class Level</option>
                                {classLevels.map(cl => (
                                    <option key={cl.id} value={cl.id}>{cl.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setShowSubjectModal(false)}>Cancel</button>
                            <button className="px-4 py-2 rounded-lg bg-[#0F4C81] text-white text-sm hover:bg-[#0c3c66]" onClick={handleAddSubject}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Grading System */}
            {showGradingModal && (
                <div className={OVERLAY}>
                    <div className={MODAL_BOX}>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Add Grading System</h2>
                        <div className="space-y-3">
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Label (e.g. A)" value={gradingForm.label} onChange={e => setGradingForm({ ...gradingForm, label: e.target.value })} />
                            <div className="grid grid-cols-2 gap-2">
                                <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Min %" value={gradingForm.min_percent} onChange={e => setGradingForm({ ...gradingForm, min_percent: e.target.value })} />
                                <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Max %" value={gradingForm.max_percent} onChange={e => setGradingForm({ ...gradingForm, max_percent: e.target.value })} />
                            </div>
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Points" value={gradingForm.points} onChange={e => setGradingForm({ ...gradingForm, points: e.target.value })} />
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setShowGradingModal(false)}>Cancel</button>
                            <button className="px-4 py-2 rounded-lg bg-[#0F4C81] text-white text-sm hover:bg-[#0c3c66]" onClick={handleAddGrading}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Division Rule */}
            {showRuleModal && (
                <div className={OVERLAY}>
                    <div className={MODAL_BOX}>
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Add Division Rule</h2>
                        <div className="space-y-3">
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Division Name (e.g. Division I)" value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Min Points" value={ruleForm.min_points} onChange={e => setRuleForm({ ...ruleForm, min_points: e.target.value })} />
                                <input type="number" className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Max Points" value={ruleForm.max_points} onChange={e => setRuleForm({ ...ruleForm, max_points: e.target.value })} />
                            </div>
                            <input className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]" placeholder="Badge style (optional)" value={ruleForm.badge} onChange={e => setRuleForm({ ...ruleForm, badge: e.target.value })} />
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm" onClick={() => setShowRuleModal(false)}>Cancel</button>
                            <button className="px-4 py-2 rounded-lg bg-[#0F4C81] text-white text-sm hover:bg-[#0c3c66]" onClick={handleAddRule}>Save</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

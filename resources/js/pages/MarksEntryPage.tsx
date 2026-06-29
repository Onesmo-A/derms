import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Types aligned with backend MarksService.buildGrid() response
interface SubjectConfig {
    examination_subject_id: string;
    max_marks: number;
    pass_marks: number;
    has_practical: boolean;
    paper_one_weight: number;
    paper_two_weight: number;
}

interface CandidateRow {
    examination_registration_id: string;
    student_name: string;
    exam_number: string;
    registration_status: string;   // 'registered' | 'absent' | 'disqualified'
    paper_one_score: number | null;
    paper_two_score: number | null;
    final_score: number | null;
    grade: string | null;
    points: number | null;
    remarks: string | null;
    is_validated: boolean;
}

interface MarksEntry {
    paper1: string;
    paper2: string;
    absent: boolean;
}

export default function MarksEntryPage() {
    const location = useLocation();
    const navigate = useNavigate();

    // ─── Dropdown state ───────────────────────────────────────────────────────
    const [exams, setExams] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    // All curriculum subjects (for fallback display)
    const [subjects, setSubjects] = useState<any[]>([]);
    // Subjects configured for the selected exam (exam_subjects with subject_id)
    const [examSubjects, setExamSubjects] = useState<any[]>([]);
    // Class levels configured for the selected exam
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [loadingExamMeta, setLoadingExamMeta] = useState(false);

    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    // selectedSubject = the subject_id (curriculum), NOT examination_subject_id
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    // ─── Grid state (loaded from buildGrid API) ───────────────────────────────
    const [subjectConfig, setSubjectConfig] = useState<SubjectConfig | null>(null);
    const [candidates, setCandidates] = useState<CandidateRow[]>([]);
    const [marksData, setMarksData] = useState<{ [regId: string]: MarksEntry }>({});

    // ─── UI state ─────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'spreadsheet' | 'manual' | 'import' | 'bulk' | 'verify' | 'practical'>('spreadsheet');

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    const handleUnauthorized = async (res: Response) => {
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }
        return res;
    };

    // ─── Tab from URL ─────────────────────────────────────────────────────────
    useEffect(() => {
        const path = location.pathname;
        if (path === '/marks/manual-entry') setActiveTab('manual');
        else if (path === '/marks/import') setActiveTab('import');
        else if (path === '/marks/bulk-update') setActiveTab('bulk');
        else if (path === '/marks/verification') setActiveTab('verify');
        else if (path === '/marks/practical-entry') setActiveTab('practical');
        else setActiveTab('spreadsheet');
    }, [location.pathname]);

    // ─── Load initial dropdowns ────────────────────────────────────────────────
    useEffect(() => {
        const get = (url: string) =>
            fetch(url, { headers })
                .then(handleUnauthorized)
                .then(r => r.json())
                .then(d => Array.isArray(d) ? d : d.data || [])
                .catch(() => []);

        Promise.all([
            get('/api/v1/examinations'),
            get('/api/v1/schools'),
            get('/api/v1/subjects'),
        ]).then(([e, s, sub]) => {
            setExams(e);
            setSchools(s);
            setSubjects(sub);
        });
    }, []);

    // ─── When exam changes, load its configured subjects & class levels ────────
    useEffect(() => {
        if (!selectedExam) {
            setExamSubjects([]);
            setClassLevels([]);
            setSelectedSubject('');
            setSelectedClass('');
            return;
        }
        setLoadingExamMeta(true);
        setSelectedSubject('');
        setSelectedClass('');
        fetch(`/api/v1/examinations/${selectedExam}`, { headers })
            .then(handleUnauthorized)
            .then(r => r.json())
            .then(exam => {
                const examSubs = exam.examination_subjects ?? [];
                const uniqueSubjects = examSubs.reduce((acc: any[], es: any) => {
                    if (!acc.find((x: any) => x.subject_id === es.subject_id)) {
                        acc.push({
                            subject_id: es.subject_id,
                            name: es.subject?.name ?? 'Unknown',
                            code: es.subject?.code ?? '',
                            has_practical: es.subject?.has_practical ?? false,
                        });
                    }
                    return acc;
                }, []);
                setExamSubjects(uniqueSubjects);

                const classLvls = exam.class_levels ?? [];
                setClassLevels(classLvls);
                setLoadingExamMeta(false);
            })
            .catch(() => {
                fetch('/api/v1/class-levels', { headers })
                    .then(r => r.json())
                    .then(d => setClassLevels(Array.isArray(d) ? d : d.data || []))
                    .catch(() => {});
                setExamSubjects(subjects.map(s => ({ subject_id: s.id, name: s.name, code: s.code, has_practical: s.has_practical })));
                setLoadingExamMeta(false);
            });
    }, [selectedExam]);

    // ─── Reset grid when subject/school/class changes ─────────────────────────
    useEffect(() => {
        setSubjectConfig(null);
        setCandidates([]);
        setMarksData({});
        setMessage('');
        setError('');
    }, [selectedSubject, selectedSchool, selectedClass]);

    // Auto-select first class level & subject when they become available
    useEffect(() => {
        if (!selectedClass && classLevels.length > 0) {
            setSelectedClass(classLevels[0].id);
        }
        if (!selectedSubject && examSubjects.length > 0) {
            setSelectedSubject(examSubjects[0].subject_id);
        }
    }, [classLevels, examSubjects]);

    // Derived subject info from the exam-specific subjects list (for badge preview)
    const localSubject = examSubjects.find(s => s.subject_id === selectedSubject) ?? null;

    // ─── Load Grid — calls the proper buildGrid backend endpoint ─────────────
    const handleLoadGrid = async () => {
        if (!selectedExam || !selectedSubject || !selectedClass) {
            setError('Tafadhali chagua Mtihani, Somo, na Darasa.');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);
        setSubjectConfig(null);
        setCandidates([]);

        try {
            const url = `/api/v1/marks/exams/${selectedExam}/class-levels/${selectedClass}/subjects/${selectedSubject}`;
            const res = await fetch(url, { headers });
            await handleUnauthorized(res);

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Imeshindwa kupakia grid (HTTP ${res.status})`);
            }

            const data: { subject_config: SubjectConfig; candidates: CandidateRow[] } = await res.json();

            setSubjectConfig(data.subject_config);
            setCandidates(data.candidates);

            const init: { [k: string]: MarksEntry } = {};
            data.candidates.forEach(c => {
                init[c.examination_registration_id] = {
                    paper1: c.paper_one_score !== null ? String(c.paper_one_score) : '',
                    paper2: c.paper_two_score !== null ? String(c.paper_two_score) : '',
                    absent: c.registration_status === 'absent',
                };
            });
            setMarksData(init);

        } catch (err: any) {
            setError(err.message || 'Imeshindwa kupakia orodha ya wanafunzi.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Cell change ──────────────────────────────────────────────────────────
    const handleCellChange = (regId: string, field: 'paper1' | 'paper2' | 'absent', value: string | boolean) => {
        setMarksData(prev => ({
            ...prev,
            [regId]: { ...prev[regId], [field]: value },
        }));
    };

    // ─── Save Marks — sends correct IDs to bulk-save endpoint ────────────────
    const handleSaveMarks = async () => {
        if (!subjectConfig) return;
        setSaving(true);
        setMessage('');
        setError('');

        const marks = candidates.map(c => {
            const entry = marksData[c.examination_registration_id];
            const isAbsent = entry?.absent ?? false;
            return {
                examination_registration_id: c.examination_registration_id,
                registration_status: isAbsent ? 'absent' : 'registered',
                paper_one_score: !isAbsent && entry?.paper1 !== '' ? parseFloat(entry?.paper1 ?? '') || null : null,
                paper_two_score: !isAbsent && subjectConfig.has_practical && entry?.paper2 !== ''
                    ? parseFloat(entry?.paper2 ?? '') || null
                    : null,
            };
        });

        try {
            const res = await fetch('/api/v1/marks/bulk-save', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    examination_subject_id: subjectConfig.examination_subject_id,
                    marks,
                }),
            });

            await handleUnauthorized(res);

            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (body.errors) {
                    const msgs = Object.values(body.errors).flat().join(' • ');
                    throw new Error(msgs);
                }
                throw new Error(body.message || 'Imeshindwa kuhifadhi alama.');
            }

            setMessage(`✔ ${body.message || 'Alama zimehifadhiwa kwa mafanikio.'}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'spreadsheet', label: 'Spreadsheet Entry', path: '/marks/spreadsheet' },
        { id: 'manual', label: 'Manual Marks Entry', path: '/marks/manual-entry' },
        { id: 'import', label: 'Import Marks', path: '/marks/import' },
        { id: 'bulk', label: 'Bulk Update Marks', path: '/marks/bulk-update' },
        { id: 'verify', label: 'Marks Verification', path: '/marks/verification' },
        { id: 'practical', label: 'Practical Entry', path: '/marks/practical-entry' },
    ];

    const hasPractical = subjectConfig?.has_practical ?? false;
    const paper1Max = subjectConfig?.max_marks ? Math.round(subjectConfig.max_marks * (subjectConfig.paper_one_weight / 100)) : 100;
    const paper2Max = subjectConfig?.max_marks ? Math.round(subjectConfig.max_marks * (subjectConfig.paper_two_weight / 100)) : 50;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Marks Management</h1>
                <p className="mt-1 text-sm text-gray-500">Record mock scores, import sheets, or verify entered marks sheets.</p>
            </div>

            {/* Submenu tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); navigate(tab.path); }}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === tab.id ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">

                {/* ─── SPREADSHEET ENTRY ───────────────────────────────────── */}
                {activeTab === 'spreadsheet' && (
                    <div className="space-y-6">

                        {/* Filter row */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Examination</label>
                                <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                    <option value="">Select Exam</option>
                                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">School</label>
                                <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                    <option value="">Select School</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Subject</label>
                                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                    <option value="">Select Subject</option>
                                    {examSubjects.map(s => (
                                        <option key={s.subject_id} value={s.subject_id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                                {/* Preview badge before loading grid */}
                                {localSubject && !subjectConfig && (
                                    <p className={`mt-1 text-xs font-semibold ${localSubject.has_practical ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {localSubject.has_practical ? '★ Theory + Practical' : '✔ Theory Only'}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Class Level</label>
                                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                    <option value="">Select Class</option>
                                    {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleLoadGrid}
                                disabled={loading}
                                className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3a66] disabled:opacity-60 transition"
                            >
                                {loading ? 'Inapakia...' : 'Load Roster Grid'}
                            </button>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                                <strong>Kosa:</strong> {error}
                            </div>
                        )}
                        {message && (
                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
                                {message}
                            </div>
                        )}

                        {loading && (
                            <div className="flex h-40 items-center justify-center">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0F4C81] border-t-transparent"></div>
                            </div>
                        )}

                        {!loading && candidates.length > 0 && subjectConfig && (
                            <div className="space-y-4">
                                {/* Subject info bar */}
                                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-bold text-[#0F4C81]">
                                        {localSubject?.name ?? 'Subject'} ({localSubject?.code ?? ''})
                                    </span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${hasPractical ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {hasPractical ? '★ Theory + Practical' : '✔ Theory Only'}
                                    </span>
                                    <span className="text-xs text-gray-500">Max: {subjectConfig.max_marks} marks</span>
                                    <span className="text-xs text-gray-500 ml-auto">{candidates.length} candidates</span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-10">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Index No.</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Candidate Name</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                                                    Paper 1 — Theory <span className="text-gray-400 font-normal">(/{paper1Max})</span>
                                                </th>
                                                {/* ✅ Paper 2 column ONLY if subject has_practical from subjectConfig */}
                                                {hasPractical && (
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600 uppercase">
                                                        Paper 2 — Practical <span className="text-amber-400 font-normal">(/{paper2Max})</span>
                                                    </th>
                                                )}
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Absent</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Total</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {candidates.map((c, idx) => {
                                                const entry = marksData[c.examination_registration_id];
                                                const isAbsent = entry?.absent ?? false;
                                                const p1 = !isAbsent && entry?.paper1 ? parseFloat(entry.paper1) : 0;
                                                const p2 = !isAbsent && hasPractical && entry?.paper2 ? parseFloat(entry.paper2) : 0;
                                                const total = p1 + p2;
                                                return (
                                                    <tr key={c.examination_registration_id} className={`hover:bg-gray-50 ${isAbsent ? 'opacity-50 bg-red-50' : ''}`}>
                                                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-xs">{c.exam_number}</td>
                                                        <td className="px-4 py-3 text-gray-700">{c.student_name}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <input
                                                                disabled={isAbsent}
                                                                value={entry?.paper1 ?? ''}
                                                                onChange={e => handleCellChange(c.examination_registration_id, 'paper1', e.target.value)}
                                                                type="number"
                                                                min="0"
                                                                max={paper1Max}
                                                                placeholder="—"
                                                                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-center focus:border-[#0F4C81] focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        {hasPractical && (
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    disabled={isAbsent}
                                                                    value={entry?.paper2 ?? ''}
                                                                    onChange={e => handleCellChange(c.examination_registration_id, 'paper2', e.target.value)}
                                                                    type="number"
                                                                    min="0"
                                                                    max={paper2Max}
                                                                    placeholder="—"
                                                                    className="w-20 rounded border border-amber-300 px-2 py-1 text-sm text-center focus:border-amber-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAbsent}
                                                                onChange={e => handleCellChange(c.examination_registration_id, 'absent', e.target.checked)}
                                                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-[#0F4C81]">
                                                            {isAbsent ? <span className="text-red-500 font-normal text-xs">Absent</span> : (total > 0 ? total : '—')}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {c.grade ? (
                                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800">{c.grade}</span>
                                                            ) : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xs text-gray-400">
                                        {hasPractical
                                            ? 'Jaza alama za Paper 1 (Theory) na Paper 2 (Practical). Weka alama ya "Absent" kwa wasiotahiniwa.'
                                            : 'Jaza alama za Paper 1 (Theory) tu. Weka alama ya "Absent" kwa wasiotahiniwa.'}
                                    </p>
                                    <button
                                        disabled={saving}
                                        onClick={handleSaveMarks}
                                        className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                                    >
                                        {saving ? 'Inahifadhi...' : 'Save Entered Marks'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loading && candidates.length === 0 && !error && (
                            <div className="flex h-32 items-center justify-center text-sm text-gray-400 border-2 border-dashed rounded-xl">
                                Chagua filters na ubonyeze "Load Roster Grid" kuona orodha ya wanafunzi.
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MANUAL ENTRY ────────────────────────────────────────────── */}
                {activeTab === 'manual' && (
                    <ManualEntryTab exams={exams} schools={schools} subjects={subjects} classLevels={classLevels} headers={headers} />
                )}

                {/* ─── IMPORT ──────────────────────────────────────────────────── */}
                {activeTab === 'import' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Import Marks from Spreadsheet</h3>
                        <p className="text-sm text-gray-500">Upload a pre-formatted Excel template to batch import marks for an entire class.</p>
                        <div className="border-2 border-dashed rounded-xl p-12 text-center text-gray-400 hover:border-[#0F4C81] transition cursor-pointer">
                            <div className="text-4xl mb-2">📊</div>
                            <p className="font-semibold text-gray-600">Drop .xlsx template here or click to browse</p>
                            <p className="text-xs mt-1">Download a blank template first to ensure correct format</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="rounded-lg border border-[#0F4C81] text-[#0F4C81] px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition">
                                Download Blank Template
                            </button>
                            <button className="rounded-lg bg-[#0F4C81] text-white px-4 py-2 text-sm font-semibold hover:bg-[#0a3a66] transition">
                                Upload & Import
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── BULK UPDATE ─────────────────────────────────────────────── */}
                {activeTab === 'bulk' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Bulk Update Marks</h3>
                        <p className="text-sm text-gray-500">Apply uniform adjustments, set absent flags, or clear entries across all candidates in a subject.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Add Fixed Points', icon: '+', desc: 'Add N points to all current entries', color: 'emerald' },
                                { label: 'Mark All Absent', icon: '✗', desc: 'Flag entire class as absent / DNS', color: 'red' },
                                { label: 'Clear All Entries', icon: '⟳', desc: 'Reset all marks to blank for re-entry', color: 'amber' },
                            ].map(action => (
                                <div key={action.label} className="rounded-xl border p-5 cursor-pointer hover:shadow-md transition">
                                    <div className={`text-2xl font-black text-${action.color}-500 mb-2`}>{action.icon}</div>
                                    <p className="font-semibold text-gray-800">{action.label}</p>
                                    <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── VERIFICATION ────────────────────────────────────────────── */}
                {activeTab === 'verify' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Marks Verification</h3>
                        <p className="text-sm text-gray-500">Review, approve and lock sheets to prevent further modifications.</p>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                            ⚠ Marks must be verified and locked before results can be processed.
                        </div>
                        <div className="overflow-hidden rounded-xl border">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {['School', 'Subject', 'Entries', 'Status', 'Action'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                            Select an examination above to load verification queue.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── PRACTICAL ENTRY ─────────────────────────────────────────── */}
                {activeTab === 'practical' && (
                    <PracticalEntryTab
                        exams={exams}
                        schools={schools}
                        subjects={subjects.filter(s => s.has_practical === true)}
                        classLevels={classLevels}
                        headers={headers}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Manual Entry Sub-component ───────────────────────────────────────────────
function ManualEntryTab({ exams, schools, subjects, classLevels, headers }: any) {
    const [sel, setSel] = useState({ exam: '', school: '', subject: '', class: '' });
    const [indexNumber, setIndexNumber] = useState('');
    const [paper1, setPaper1] = useState('');
    const [paper2, setPaper2] = useState('');
    const [absent, setAbsent] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [subjectConfig, setSubjectConfig] = useState<SubjectConfig | null>(null);
    const [lookingUp, setLookingUp] = useState(false);

    const localSubject = subjects.find((s: any) => s.id === sel.subject) ?? null;

    // Load examination_subject_id when exam + subject + class all selected
    useEffect(() => {
        if (!sel.exam || !sel.subject || !sel.class) { setSubjectConfig(null); return; }
        setLookingUp(true);
        fetch(`/api/v1/marks/exams/${sel.exam}/class-levels/${sel.class}/subjects/${sel.subject}`, { headers })
            .then(r => r.json())
            .then(d => { setSubjectConfig(d.subject_config ?? null); setLookingUp(false); })
            .catch(() => { setSubjectConfig(null); setLookingUp(false); });
    }, [sel.exam, sel.subject, sel.class]);

    const hasPractical = subjectConfig?.has_practical ?? localSubject?.has_practical ?? false;

    const handleSubmit = async () => {
        if (!subjectConfig) { setError('Haikuweza kupata usanidi wa somo. Hakikisha somo limeunganishwa na mtihani huu.'); return; }
        if (!indexNumber) { setError('Ingiza nambari ya mtihani wa mtahiniwa.'); return; }
        if (!paper1 && !absent) { setError('Ingiza alama za Paper 1 au weka alama ya Absent.'); return; }

        setSaving(true);
        setError('');
        setMessage('');

        // For manual entry, we need to look up examination_registration_id by exam_number
        // Try to find via the grid endpoint candidates
        try {
            const gridRes = await fetch(
                `/api/v1/marks/exams/${sel.exam}/class-levels/${sel.class}/subjects/${sel.subject}`,
                { headers }
            );
            const gridData = await gridRes.json();
            const candidate = (gridData.candidates ?? []).find((c: CandidateRow) => c.exam_number === indexNumber);

            if (!candidate) {
                throw new Error(`Mtahiniwa mwenye nambari "${indexNumber}" hakupatikana katika orodha ya ${localSubject?.name ?? 'somo hili'}.`);
            }

            const res = await fetch('/api/v1/marks/bulk-save', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    examination_subject_id: subjectConfig.examination_subject_id,
                    marks: [{
                        examination_registration_id: candidate.examination_registration_id,
                        registration_status: absent ? 'absent' : 'registered',
                        paper_one_score: absent ? null : (paper1 ? parseFloat(paper1) : null),
                        paper_two_score: absent || !hasPractical ? null : (paper2 ? parseFloat(paper2) : null),
                    }],
                }),
            });

            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kuhifadhi.');

            setMessage(`✔ Alama za ${candidate.student_name} zimehifadhiwa.`);
            setIndexNumber('');
            setPaper1('');
            setPaper2('');
            setAbsent(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Manual Marks Entry</h3>
                <p className="text-sm text-gray-500">Enter marks one candidate at a time by their index number.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl">
                {[
                    { label: 'Examination', key: 'exam', items: exams },
                    { label: 'School', key: 'school', items: schools },
                    { label: 'Subject', key: 'subject', items: subjects },
                    { label: 'Class Level', key: 'class', items: classLevels },
                ].map(({ label, key, items }) => (
                    <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">{label}</label>
                        <select
                            value={(sel as any)[key]}
                            onChange={e => setSel(prev => ({ ...prev, [key]: e.target.value }))}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="">Select {label}</option>
                            {items.map((i: any) => <option key={i.id} value={i.id}>{i.name ?? i.code}</option>)}
                        </select>
                    </div>
                ))}
            </div>

            {localSubject && (
                <p className={`text-xs font-semibold ${hasPractical ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {lookingUp ? '⟳ Inatafuta usanidi...' : hasPractical ? '★ Theory + Practical' : '✔ Theory Only'}
                </p>
            )}

            <div className="max-w-2xl rounded-xl border border-gray-200 p-6 space-y-4">
                <h4 className="font-semibold text-gray-800">Enter Candidate Marks</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Index / Exam Number</label>
                        <input value={indexNumber} onChange={e => setIndexNumber(e.target.value)} type="text" placeholder="e.g. STS0101001"
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Paper 1 — Theory</label>
                        <input disabled={absent} value={paper1} onChange={e => setPaper1(e.target.value)} type="number" min="0" max="100" placeholder="0–100"
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100" />
                    </div>
                    {hasPractical && (
                        <div>
                            <label className="block text-xs font-semibold text-amber-600 uppercase">Paper 2 — Practical</label>
                            <input disabled={absent} value={paper2} onChange={e => setPaper2(e.target.value)} type="number" min="0" max="100" placeholder="0–100"
                                className="mt-1 block w-full rounded-lg border border-amber-300 px-3 py-2 text-sm disabled:bg-gray-100" />
                        </div>
                    )}
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={absent} onChange={e => setAbsent(e.target.checked)} className="h-4 w-4 rounded" />
                    Mark this candidate as Absent (DNS)
                </label>
                {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
                {message && <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{message}</div>}
                <div className="flex justify-end">
                    <button disabled={saving || !subjectConfig} onClick={handleSubmit}
                        className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3a66] disabled:opacity-50 transition">
                        {saving ? 'Inahifadhi...' : 'Save This Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Practical Entry Sub-component ────────────────────────────────────────────
function PracticalEntryTab({ exams, schools, subjects, classLevels, headers }: any) {
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [subjectConfig, setSubjectConfig] = useState<SubjectConfig | null>(null);
    const [candidates, setCandidates] = useState<CandidateRow[]>([]);
    const [marksData, setMarksData] = useState<{ [k: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const localSubject = subjects.find((s: any) => s.id === selectedSubject) ?? null;

    const handleLoad = async () => {
        if (!selectedExam || !selectedSubject || !selectedClass) {
            setError('Chagua mtihani, somo la vitendo, na darasa.'); return;
        }
        setLoading(true); setError(''); setMessage('');
        try {
            const res = await fetch(
                `/api/v1/marks/exams/${selectedExam}/class-levels/${selectedClass}/subjects/${selectedSubject}`,
                { headers }
            );
            const data = await res.json();
            setSubjectConfig(data.subject_config ?? null);
            setCandidates(data.candidates ?? []);
            const init: { [k: string]: string } = {};
            (data.candidates ?? []).forEach((c: CandidateRow) => {
                init[c.examination_registration_id] = c.paper_two_score !== null ? String(c.paper_two_score) : '';
            });
            setMarksData(init);
        } catch {
            setError('Imeshindwa kupakia orodha.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!subjectConfig) return;
        setSaving(true); setError(''); setMessage('');
        try {
            const marks = candidates.map(c => ({
                examination_registration_id: c.examination_registration_id,
                registration_status: c.registration_status,
                paper_one_score: c.paper_one_score,
                paper_two_score: marksData[c.examination_registration_id] !== '' ? parseFloat(marksData[c.examination_registration_id]) : null,
            }));
            const res = await fetch('/api/v1/marks/bulk-save', {
                method: 'POST', headers,
                body: JSON.stringify({ examination_subject_id: subjectConfig.examination_subject_id, marks }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Imeshindwa kuhifadhi.');
            setMessage(`✔ ${body.message || 'Alama za vitendo zimehifadhiwa.'}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Practical Component Entry</h3>
                <p className="text-sm text-gray-500">Enter practical scores for sciences only (Physics, Chemistry, Biology).</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                ★ Only subjects configured as <strong>Theory + Practical</strong> are shown here.
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Examination</label>
                    <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select Exam</option>
                        {exams.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">School</label>
                    <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select School</option>
                        {schools.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-amber-600 uppercase">Practical Subject</label>
                    <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="mt-1 block w-full rounded-lg border border-amber-300 px-3 py-2 text-sm">
                        <option value="">Select Practical Subject</option>
                        {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase">Class Level</label>
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">Select Class</option>
                        {classLevels.map((cl: any) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end">
                <button onClick={handleLoad} disabled={loading} className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition">
                    {loading ? 'Inapakia...' : 'Load Practical Roster'}
                </button>
            </div>
            {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">{message}</div>}
            {!loading && candidates.length > 0 && (
                <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-amber-50">
                                <tr>
                                    {['#', 'Index Number', 'Candidate Name', `${localSubject?.name ?? 'Subject'} — Practical Score (/50)`].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {candidates.map((c, idx) => (
                                    <tr key={c.examination_registration_id} className="hover:bg-amber-50">
                                        <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                        <td className="px-6 py-3 font-mono font-semibold text-gray-900">{c.exam_number}</td>
                                        <td className="px-6 py-3 text-gray-700">{c.student_name}</td>
                                        <td className="px-6 py-3">
                                            <input
                                                value={marksData[c.examination_registration_id] || ''}
                                                onChange={e => setMarksData(prev => ({ ...prev, [c.examination_registration_id]: e.target.value }))}
                                                type="number" min="0" max="50" placeholder="—"
                                                className="w-24 rounded border border-amber-300 px-2 py-1 text-sm text-center focus:border-amber-500 focus:outline-none"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end">
                        <button disabled={saving} onClick={handleSave} className="rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition">
                            {saving ? 'Inahifadhi...' : 'Save Practical Marks'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

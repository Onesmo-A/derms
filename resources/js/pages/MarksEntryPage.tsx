import React, { useState, useEffect, useRef } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Search, Sliders, CheckCircle, AlertTriangle, FileSpreadsheet, Edit3, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

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
    registration_status: string;
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
    const [regions, setRegions] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [examSubjects, setExamSubjects] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<any[]>([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    const [loadingExamMeta, setLoadingExamMeta] = useState(false);

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
    const paper1Refs = useRef<Array<HTMLInputElement | null>>([]);
    const paper2Refs = useRef<Array<HTMLInputElement | null>>([]);

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
            get('/api/v1/regions'),
        ]).then(([e, s, sub, regs]) => {
            setExams(e);
            setSchools(s);
            setSubjects(sub);
            setRegions(regs);
        });
    }, []);

    // Fetch districts when region changes
    useEffect(() => {
        if (selectedRegion) {
            fetch(`/api/v1/districts?region_id=${selectedRegion}`, { headers })
                .then(handleUnauthorized)
                .then(r => r.json())
                .then(d => {
                    setDistricts(d || []);
                    setSelectedDistrict('');
                });
        } else {
            setDistricts([]);
            setSelectedDistrict('');
        }
    }, [selectedRegion]);

    // Fetch schools when district changes
    useEffect(() => {
        if (selectedDistrict) {
            fetch(`/api/v1/schools?district_id=${selectedDistrict}`, { headers })
                .then(handleUnauthorized)
                .then(r => r.json())
                .then(d => {
                    setSchools(d.data || d || []);
                    setSelectedSchool('');
                });
        }
    }, [selectedDistrict]);

    // When exam changes, load its configured subjects & class levels
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

    // Reset grid when selections change
    useEffect(() => {
        setSubjectConfig(null);
        setCandidates([]);
        setMarksData({});
        setMessage('');
        setError('');
    }, [selectedSubject, selectedSchool, selectedClass]);

    const handleLoadGrid = async () => {
        if (!selectedExam || !selectedSubject || !selectedClass || !selectedSchool) {
            const message = 'Please select a region, district, school, subject, and class level.';
            setError(message);
            toast.error(message);
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);
        setSubjectConfig(null);
        setCandidates([]);

        try {
            const url = `/api/v1/marks/exams/${selectedExam}/class-levels/${selectedClass}/subjects/${selectedSubject}?school_id=${selectedSchool}`;
            const res = await fetch(url, { headers });
            await handleUnauthorized(res);

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || `Failed to load roster grid (HTTP ${res.status}).`);
            }

            const data: { subject_config: SubjectConfig; candidates: CandidateRow[] } = await res.json();
            setSubjectConfig(data.subject_config);
            setCandidates(data.candidates ?? []);

            const init: { [k: string]: MarksEntry } = {};
            (data.candidates ?? []).forEach(c => {
                init[c.examination_registration_id] = {
                    paper1: c.paper_one_score !== null ? String(c.paper_one_score) : '',
                    paper2: c.paper_two_score !== null ? String(c.paper_two_score) : '',
                    absent: c.registration_status === 'absent',
                };
            });
            setMarksData(init);
        } catch (err: any) {
            const message = err.message || 'Failed to load the candidate list.';
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

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
                throw new Error(body.message || 'Failed to save marks.');
            }

            const successMessage = body.message || 'Marks saved successfully.';
            setMessage(successMessage);
            toast.success(successMessage);
            handleLoadGrid();
        } catch (err: any) {
            const message = err.message || 'Failed to save marks.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'spreadsheet', label: 'Spreadsheet Entry' },
        { id: 'manual', label: 'Manual Marks Entry' },
        { id: 'import', label: 'Import Marks' },
        { id: 'bulk', label: 'Bulk Update Marks' },
        { id: 'verify', label: 'Marks Verification' },
        { id: 'practical', label: 'Practical Entry' },
    ];

    const localSubject = examSubjects.find(s => s.subject_id === selectedSubject) ?? null;
    const hasPractical = subjectConfig?.has_practical ?? localSubject?.has_practical ?? false;
    const paper1Max = subjectConfig?.max_marks ? Math.round(subjectConfig.max_marks * (subjectConfig.paper_one_weight / 100)) : 100;
    const paper2Max = subjectConfig?.max_marks ? Math.round(subjectConfig.max_marks * (subjectConfig.paper_two_weight / 100)) : 50;

    const focusSpreadsheetCell = (field: 'paper1' | 'paper2', rowIndex: number) => {
        const target = field === 'paper1' ? paper1Refs.current[rowIndex] : paper2Refs.current[rowIndex];
        if (target) {
            target.focus();
            target.select();
        }
    };

    const handleSpreadsheetKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
        rowIndex: number,
        field: 'paper1' | 'paper2'
    ) => {
        if (event.key !== 'ArrowDown') return;

        event.preventDefault();
        const nextIndex = rowIndex + 1;
        if (nextIndex < candidates.length) {
            focusSpreadsheetCell(field, nextIndex);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Marks Management</h1>
                <p className="mt-1 text-sm text-gray-500">Record mock scores, import sheets, or verify entered mark sheets.</p>
            </div>

            {/* ─── GLOBAL CONTEXT FILTERS ──────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <Sliders className="h-4 w-4 text-[#0F4C81]" />
                    Context Hierarchy Filter (Region {'->'} District {'->'} School)
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">1. Region</label>
                        <SearchableSelect
                            value={selectedRegion}
                            onValueChange={setSelectedRegion}
                            placeholder="Select Region"
                            searchPlaceholder="Search region..."
                            options={regions.map(r => ({ value: r.id, label: r.name }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">2. District</label>
                        <SearchableSelect
                            value={selectedDistrict}
                            onValueChange={setSelectedDistrict}
                            placeholder="Select District"
                            searchPlaceholder="Search district..."
                            options={districts.map(d => ({ value: d.id, label: d.name }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">3. School</label>
                        <SearchableSelect
                            value={selectedSchool}
                            onValueChange={setSelectedSchool}
                            placeholder="Select School"
                            searchPlaceholder="Search school..."
                            options={schools.map(s => ({ value: s.id, label: s.name }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">4. Examination</label>
                        <SearchableSelect
                            value={selectedExam}
                            onValueChange={setSelectedExam}
                            placeholder="Select Exam"
                            searchPlaceholder="Search exam..."
                            options={exams.map(e => ({ value: e.id, label: e.name }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">5. Subject</label>
                        <SearchableSelect
                            value={selectedSubject}
                            onValueChange={setSelectedSubject}
                            placeholder="Select Subject"
                            searchPlaceholder="Search subject..."
                            options={examSubjects.map(s => ({ value: s.subject_id, label: `${s.name} (${s.code})` }))}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">6. Class Level</label>
                        <SearchableSelect
                            value={selectedClass}
                            onValueChange={setSelectedClass}
                            placeholder="Select Class"
                            searchPlaceholder="Search class..."
                            options={classLevels.map(cl => ({ value: cl.id, label: cl.name }))}
                            className="mt-1"
                        />
                    </div>
                </div>
            </div>

            {/* Submenu tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === tab.id ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                
                {/* ─── SPREADSHEET ENTRY ───────────────────────────────────── */}
                {activeTab === 'spreadsheet' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={handleLoadGrid}
                                disabled={loading}
                                className="rounded-xl bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a3a66] disabled:opacity-60 transition"
                            >
                                {loading ? 'Loading...' : 'Load Roster Grid'}
                            </button>
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
                                <strong>Error:</strong> {error}
                            </div>
                        )}
                        {message && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700">
                                {message}
                            </div>
                        )}

                        {loading && (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        )}

                        {!loading && candidates.length > 0 && subjectConfig && (
                            <div className="space-y-4">
                                <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex flex-wrap items-center gap-3">
                                    <span className="text-sm font-bold text-[#0F4C81]">
                                        {localSubject?.name ?? 'Subject'} ({localSubject?.code ?? ''})
                                    </span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${hasPractical ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {hasPractical ? '★ Theory + Practical' : '✔ Theory Only'}
                                    </span>
                                    <span className="text-xs text-gray-500 font-bold">Max: {subjectConfig.max_marks} marks</span>
                                    <span className="text-xs text-gray-500 font-bold ml-auto">{candidates.length} candidates</span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50 font-bold text-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left">#</th>
                                                <th className="px-4 py-3 text-left">Index No.</th>
                                                <th className="px-4 py-3 text-left">Candidate Name</th>
                                                <th className="px-4 py-3 text-center">Paper 1 — Theory (/{paper1Max})</th>
                                                {hasPractical && <th className="px-4 py-3 text-center text-amber-600">Paper 2 — Practical (/{paper2Max})</th>}
                                                <th className="px-4 py-3 text-center">Absent</th>
                                                <th className="px-4 py-3 text-center">Total</th>
                                                <th className="px-4 py-3 text-center">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 font-semibold text-gray-800">
                                            {candidates.map((c, idx) => {
                                                const entry = marksData[c.examination_registration_id];
                                                const isAbsent = entry?.absent ?? false;
                                                const p1 = !isAbsent && entry?.paper1 ? parseFloat(entry.paper1) : 0;
                                                const p2 = !isAbsent && hasPractical && entry?.paper2 ? parseFloat(entry.paper2) : 0;
                                                const total = p1 + p2;
                                                function handleCellChange(
                                                    examination_registration_id: string,
                                                    field: 'paper1' | 'paper2' | 'absent',
                                                    value: string | boolean
                                                ): void {
                                                    setMarksData(prev => {
                                                        const current = prev[examination_registration_id] ?? { paper1: '', paper2: '', absent: false };
                                                        const updated = { ...current };

                                                        if (field === 'absent') {
                                                            const absentValue = Boolean(value);
                                                            updated.absent = absentValue;
                                                            if (absentValue) {
                                                                updated.paper1 = '';
                                                                updated.paper2 = '';
                                                            }
                                                        } else {
                                                            updated[field] = String(value);
                                                        }

                                                        return {
                                                            ...prev,
                                                            [examination_registration_id]: updated,
                                                        };
                                                    });
                                                }

                                                return (
                                                    <tr key={c.examination_registration_id} className={`hover:bg-gray-50 ${isAbsent ? 'opacity-50 bg-rose-50' : ''}`}>
                                                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-mono text-xs">{c.exam_number}</td>
                                                        <td className="px-4 py-3">{c.student_name}</td>
                                                <td className="px-4 py-3 text-center">
                                                            <input
                                                                ref={el => { paper1Refs.current[idx] = el; }}
                                                                disabled={isAbsent}
                                                                value={entry?.paper1 ?? ''}
                                                                onChange={e => handleCellChange(c.examination_registration_id, 'paper1', e.target.value.replace(/[^\d]/g, ''))}
                                                                onKeyDown={e => handleSpreadsheetKeyDown(e, idx, 'paper1')}
                                                                type="text"
                                                                inputMode="numeric"
                                                                pattern="[0-9]*"
                                                                min="0"
                                                                max={paper1Max}
                                                                className="w-20 rounded border px-2 py-1 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                        </td>
                                                        {hasPractical && (
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    ref={el => { paper2Refs.current[idx] = el; }}
                                                                    disabled={isAbsent}
                                                                    value={entry?.paper2 ?? ''}
                                                                    onChange={e => handleCellChange(c.examination_registration_id, 'paper2', e.target.value.replace(/[^\d]/g, ''))}
                                                                    onKeyDown={e => handleSpreadsheetKeyDown(e, idx, 'paper2')}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    pattern="[0-9]*"
                                                                    min="0"
                                                                    max={paper2Max}
                                                                    className="w-20 rounded border border-amber-300 px-2 py-1 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAbsent}
                                                                onChange={e => handleCellChange(c.examination_registration_id, 'absent', e.target.checked)}
                                                                className="h-4 w-4 text-rose-600 rounded"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-[#0F4C81] font-bold">
                                                            {isAbsent ? <span className="text-rose-500 font-normal text-xs">Absent</span> : total}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {c.grade ? <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">{c.grade}</span> : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xs text-gray-400 font-semibold">
                                        Tick for "Absent".
                                    </p>
                                    <button
                                        disabled={saving}
                                        onClick={handleSaveMarks}
                                        className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                                    >
                                        {saving ? 'Saving...' : 'Save Entered Marks'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!loading && candidates.length === 0 && !error && (
                            <div className="flex h-32 items-center justify-center text-xs text-gray-400 border border-dashed rounded-2xl font-semibold">
                                Click "Load Roster Grid" to view the students for the selected school and subject.
                            </div>
                        )}
                    </div>
                )}

                {/* ─── MANUAL ENTRY ────────────────────────────────────────────── */}
                {activeTab === 'manual' && (
                    <ManualEntryTab 
                        selectedExam={selectedExam}
                        selectedSchool={selectedSchool}
                        selectedSubject={selectedSubject}
                        selectedClass={selectedClass}
                        examSubjects={examSubjects}
                        classLevels={classLevels}
                        headers={headers} 
                    />
                )}

                {/* ─── IMPORT ──────────────────────────────────────────────────── */}
                {activeTab === 'import' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Import Marks from Spreadsheet</h3>
                        <p className="text-xs text-gray-500 font-semibold">Upload a pre-formatted Excel template to batch import marks for the selected context.</p>
                        <div className="border border-dashed rounded-2xl p-12 text-center text-gray-400 hover:border-[#0F4C81] transition cursor-pointer">
                            <FileSpreadsheet className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="font-bold text-gray-600 text-sm">Drop .xlsx template here or click to browse</p>
                            <p className="text-xs mt-1">Download a blank template first to ensure correct formatting</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="rounded-xl border border-[#0F4C81] text-[#0F4C81] px-4 py-2.5 text-xs font-bold hover:bg-blue-50 transition">
                                Download Blank Template
                            </button>
                            <button className="rounded-xl bg-[#0F4C81] text-white px-4 py-2.5 text-xs font-bold hover:bg-[#0a3a66] transition">
                                Upload & Import
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── BULK UPDATE ─────────────────────────────────────────────── */}
                {activeTab === 'bulk' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Bulk Update Marks</h3>
                        <p className="text-xs text-gray-500 font-semibold">Apply adjustments or absent flags across all candidates in the selected subject.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { label: 'Add Fixed Points', icon: '+', desc: 'Add N points to all current entries', color: 'emerald' },
                                { label: 'Mark All Absent', icon: '✗', desc: 'Flag entire class as absent / DNS', color: 'rose' },
                                { label: 'Clear All Entries', icon: '⟳', desc: 'Reset all marks to blank for re-entry', color: 'amber' },
                            ].map(action => (
                                <div key={action.label} className="rounded-2xl border p-5 cursor-pointer hover:shadow-md transition">
                                    <div className="text-lg font-black text-slate-700 mb-2">{action.icon}</div>
                                    <p className="font-bold text-gray-800 text-sm">{action.label}</p>
                                    <p className="text-xs text-gray-500 mt-1 font-semibold">{action.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── VERIFICATION ────────────────────────────────────────────── */}
                {activeTab === 'verify' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Marks Verification Queue</h3>
                        <p className="text-xs text-gray-500 font-semibold">Review, approve, and lock sheets for the selected context.</p>
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs font-bold text-amber-800 flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4" />
                            Marks must be verified and locked before results processing can run.
                        </div>
                        <div className="overflow-hidden rounded-2xl border">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 font-bold text-gray-500">
                                    <tr>
                                        {['School', 'Subject', 'Entries', 'Status', 'Action'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-xs uppercase">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="font-semibold text-gray-700">
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-xs text-gray-400">
                                            Verification queue is clear for the selected school context.
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
                        selectedExam={selectedExam}
                        selectedSchool={selectedSchool}
                        selectedSubject={selectedSubject}
                        selectedClass={selectedClass}
                        examSubjects={examSubjects}
                        classLevels={classLevels}
                        headers={headers}
                    />
                )}
            </div>
        </div>
    );
}

// ─── Manual Entry Sub-component ───────────────────────────────────────────────
function ManualEntryTab({ selectedExam, selectedSchool, selectedSubject, selectedClass, examSubjects, classLevels, headers }: any) {
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudentReg, setSelectedStudentReg] = useState('');
    const [paper1, setPaper1] = useState('');
    const [paper2, setPaper2] = useState('');
    const [absent, setAbsent] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [subjectConfig, setSubjectConfig] = useState<SubjectConfig | null>(null);
    const [lookingUp, setLookingUp] = useState(false);

    const localSubject = examSubjects.find((s: any) => s.subject_id === selectedSubject) ?? null;

    // Load subject configuration
    useEffect(() => {
        if (!selectedExam || !selectedSubject || !selectedClass) { setSubjectConfig(null); return; }
        setLookingUp(true);
        fetch(`/api/v1/marks/exams/${selectedExam}/class-levels/${selectedClass}/subjects/${selectedSubject}`, { headers })
            .then(r => r.json())
            .then(d => { setSubjectConfig(d.subject_config ?? null); setLookingUp(false); })
            .catch(() => { setSubjectConfig(null); setLookingUp(false); });
    }, [selectedExam, selectedSubject, selectedClass]);

    // Load registered candidates list for the dropdown
    useEffect(() => {
        if (selectedExam && selectedSchool && selectedClass) {
            fetch(`/api/v1/examinations/${selectedExam}/candidates?school_id=${selectedSchool}&class_level_id=${selectedClass}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setStudents(data || []);
                    setSelectedStudentReg('');
                })
                .catch(() => setStudents([]));
        } else {
            setStudents([]);
            setSelectedStudentReg('');
        }
    }, [selectedExam, selectedSchool, selectedClass]);

    const hasPractical = subjectConfig?.has_practical ?? localSubject?.has_practical ?? false;

    const handleSubmit = async () => {
        if (!subjectConfig) { setError('This subject has not been configured for the selected examination yet.'); return; }
        if (!selectedStudentReg) { setError('Please select a student.'); return; }
        if (!paper1 && !absent) { setError('Enter Paper 1 marks.'); return; }

        setSaving(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/v1/marks/bulk-save', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    examination_subject_id: subjectConfig.examination_subject_id,
                    marks: [{
                        examination_registration_id: selectedStudentReg,
                        registration_status: absent ? 'absent' : 'registered',
                        paper_one_score: absent ? null : (paper1 ? parseFloat(paper1) : null),
                        paper_two_score: absent || !hasPractical ? null : (paper2 ? parseFloat(paper2) : null),
                    }],
                }),
            });

            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body.message || 'Failed to save marks.');

            setMessage(`✔ Marks stored successfully.`);
            setSelectedStudentReg('');
            setPaper1('');
            setPaper2('');
            setAbsent(false);
        } catch (err: any) {
            const message = err.message || 'Failed to save marks.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                    <Edit3 className="h-5 w-5 text-[#0F4C81]" />
                    Manual Marks Entry
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Enter marks for a single student selected within the region, district, and school hierarchy.</p>
            </div>

            {localSubject && (
                <p className={`text-xs font-bold ${hasPractical ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {lookingUp ? 'Loading configuration...' : hasPractical ? 'Theory + Practical' : 'Theory only'}
                </p>
            )}

            <div className="max-w-2xl rounded-2xl border border-gray-200 p-6 space-y-4 bg-slate-50">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Candidate</label>
                    <SearchableSelect
                        value={selectedStudentReg}
                        onValueChange={setSelectedStudentReg}
                        placeholder="Select Student"
                        searchPlaceholder="Search student..."
                        options={students.map(s => ({
                            value: s.id,
                            label: `${s.first_name} ${s.last_name} (${s.exam_number})`,
                        }))}
                        className="mt-1"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Paper 1 — Theory Score</label>
                        <input 
                            disabled={absent} 
                            value={paper1} 
                            onChange={e => setPaper1(e.target.value)} 
                            type="number" 
                            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-bold outline-none disabled:bg-gray-100" 
                        />
                    </div>
                    {hasPractical && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Paper 2 — Practical Score</label>
                            <input 
                                disabled={absent} 
                                value={paper2} 
                                onChange={e => setPaper2(e.target.value)} 
                                type="number" 
                                className="block w-full rounded-xl border border-amber-300 px-3 py-2.5 text-sm font-bold outline-none disabled:bg-gray-100" 
                            />
                        </div>
                    )}
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={absent} onChange={e => setAbsent(e.target.checked)} className="h-4 w-4 text-rose-600 rounded" />
                    (Absent)
                </label>

                {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">{error}</div>}
                {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700">{message}</div>}

                <div className="flex justify-end">
                    <button 
                        disabled={saving || !subjectConfig || !selectedStudentReg} 
                        onClick={handleSubmit}
                        className="rounded-xl bg-[#0F4C81] px-5 py-3 text-sm font-bold text-white hover:bg-[#0a3a66] disabled:opacity-50 transition"
                    >
                        {saving ? 'Saving...' : 'Save Marks Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Practical Entry Sub-component ────────────────────────────────────────────
function PracticalEntryTab({ selectedExam, selectedSchool, selectedSubject, selectedClass, examSubjects, classLevels, headers }: any) {
    const [subjectConfig, setSubjectConfig] = useState<SubjectConfig | null>(null);
    const [candidates, setCandidates] = useState<CandidateRow[]>([]);
    const [marksData, setMarksData] = useState<{ [k: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const localSubject = examSubjects.find((s: any) => s.subject_id === selectedSubject) ?? null;

    const handleLoad = async () => {
        if (!selectedExam || !selectedSubject || !selectedClass || !selectedSchool) {
            setError('Please select a region, district, school, practical subject, and class level.'); return;
        }
        setLoading(true); setError(''); setMessage('');
        try {
            const res = await fetch(
                `/api/v1/marks/exams/${selectedExam}/class-levels/${selectedClass}/subjects/${selectedSubject}?school_id=${selectedSchool}`,
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
            setError('Failed to load the practical candidate list.');
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
            if (!res.ok) throw new Error(body.message || 'Failed to save marks.');
            setMessage(`✔ ${body.message || 'Practical marks saved successfully.'}`);
        } catch (err: any) {
            const message = err.message || 'Failed to save marks.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">Practical Component Entry</h3>
                <p className="text-xs text-gray-500 font-semibold">Enter practical scores for sciences configured as Theory + Practical.</p>
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={handleLoad} disabled={loading} className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-60 transition">
                    {loading ? 'Loading...' : 'Load Practical Roster'}
                </button>
            </div>
            {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">{error}</div>}
            {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700">{message}</div>}
            
            {!loading && candidates.length > 0 && (
                <div className="space-y-4">
                    <div className="overflow-x-auto rounded-xl border">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-amber-50 font-bold text-gray-600">
                                <tr>
                                    <th className="px-6 py-3 text-left">#</th>
                                    <th className="px-6 py-3 text-left">Index Number</th>
                                    <th className="px-6 py-3 text-left">Candidate Name</th>
                                    <th className="px-6 py-3 text-center">{localSubject?.name ?? 'Subject'} — Practical Score (/50)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                                {candidates.map((c, idx) => (
                                    <tr key={c.examination_registration_id} className="hover:bg-amber-50">
                                        <td className="px-6 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                        <td className="px-6 py-3 font-mono text-xs">{c.exam_number}</td>
                                        <td className="px-6 py-3">{c.student_name}</td>
                                        <td className="px-6 py-3 text-center">
                                            <input
                                                value={marksData[c.examination_registration_id] || ''}
                                                onChange={e => setMarksData(prev => ({ ...prev, [c.examination_registration_id]: e.target.value }))}
                                                type="number" min="0" max="50"
                                                className="w-24 rounded border border-amber-300 px-2 py-1 text-sm text-center focus:border-amber-500 focus:outline-none"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end">
                        <button disabled={saving} onClick={handleSave} className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition">
                            {saving ? 'Saving...' : 'Save Practical Marks'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

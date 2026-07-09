import React, { useState, useEffect, useRef } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Search, Sliders, CheckCircle, AlertTriangle, FileSpreadsheet, Edit3, ShieldAlert, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface SubjectConfig {
    examination_subject_id: string;
    max_marks: number;
    pass_marks: number;
    has_practical: boolean;
    paper_one_weight: number;
    paper_two_weight: number;
    paper_one_max_marks?: number;
    paper_two_max_marks?: number;
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

const calculateWeightedFinalScore = (paperOneScore: number, paperTwoScore: number, config: SubjectConfig) => {
    if (config.has_practical) {
        return Math.round(((((paperOneScore + paperTwoScore) / 150) * 100) * 100)) / 100;
    }

    const paperOneMax = Number(config.paper_one_max_marks ?? 100);
    if (paperOneMax <= 0) {
        return 0;
    }

    return Math.round(((paperOneScore / paperOneMax) * 100) * 100) / 100;
};

const clampNumericInput = (value: string, max: number) => {
    const sanitized = value.replace(/[^\d]/g, '');
    if (sanitized === '') {
        return '';
    }

    const parsed = Number(sanitized);
    if (!Number.isFinite(parsed)) {
        return '';
    }

    return String(Math.min(parsed, max));
};

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
    const [importMessage, setImportMessage] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
    const [previewLoaded, setPreviewLoaded] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [previewingFile, setPreviewingFile] = useState(false);
    const [importingFile, setImportingFile] = useState(false);
    const [activeTab, setActiveTab] = useState<'spreadsheet' | 'manual' | 'import' | 'bulk' | 'verify' | 'practical'>('spreadsheet');
    const paper1Refs = useRef<Array<HTMLInputElement | null>>([]);
    const paper2Refs = useRef<Array<HTMLInputElement | null>>([]);
    const importFileRef = useRef<HTMLInputElement | null>(null);

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

    const ensureImportSubjectConfig = async () => {
        if (subjectConfig?.examination_subject_id) {
            return subjectConfig;
        }

        if (!selectedExam || !selectedSubject || !selectedClass) {
            throw new Error('Select exam, subject, and class level first.');
        }

        const res = await fetch(`/api/v1/marks/exams/${selectedExam}/class-levels/${selectedClass}/subjects/${selectedSubject}`, {
            headers,
        });
        await handleUnauthorized(res);

        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || 'Failed to resolve the selected subject configuration.');
        }

        const data: { subject_config: SubjectConfig } = await res.json();
        if (!data.subject_config?.examination_subject_id) {
            throw new Error('The selected exam subject could not be resolved.');
        }

        setSubjectConfig(data.subject_config);
        return data.subject_config;
    };

    const handleDownloadImportTemplate = async () => {
        setDownloadingTemplate(true);
        setError('');
        setMessage('');
        setImportMessage('');

        try {
            if (!selectedSchool) {
                throw new Error('Select school before downloading the template.');
            }

            const config = await ensureImportSubjectConfig();
            const params = new URLSearchParams({
                examination_subject_id: config.examination_subject_id,
                school_id: selectedSchool,
            });

            const res = await fetch(`/api/v1/marks/import/template?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            await handleUnauthorized(res);
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || 'Failed to download the template.');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `IDEMS_Marks_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
            anchor.click();
            URL.revokeObjectURL(url);
            toast.success('Official locked template downloaded.');
        } catch (err: any) {
            const message = err.message || 'Failed to download the template.';
            setError(message);
            toast.error(message);
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handleImportFileSelect = (file: File | null) => {
        if (!file) {
            setImportFile(null);
            return;
        }

        const allowedExt = ['xlsx'];
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!allowedExt.includes(ext)) {
            toast.error('Only the official .xlsx template is allowed.');
            return;
        }

        setImportFile(file);
        setImportPreviewRows([]);
        setPreviewLoaded(false);
        setError('');
        setMessage('');
        setImportMessage('');
    };

    const handlePreviewImport = async () => {
        setPreviewingFile(true);
        setError('');
        setMessage('');
        setImportMessage('');

        try {
            if (!selectedSchool) {
                throw new Error('Select school first.');
            }
            if (!importFile) {
                throw new Error('Choose the filled Excel template before importing.');
            }

            const config = await ensureImportSubjectConfig();
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('examination_subject_id', config.examination_subject_id);
            formData.append('school_id', selectedSchool);
            formData.append('preview', '1');

            const res = await fetch('/api/v1/marks/import', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            await handleUnauthorized(res);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.message || 'Failed to import marks.');
            }

            setImportPreviewRows(body.preview_rows ?? []);
            setPreviewLoaded(true);
            const successMessage = body.message || 'Preview generated successfully.';
            setImportMessage(`${successMessage} Review the rows below, then confirm import.`);
            toast.success(successMessage);
        } catch (err: any) {
            const message = err.message || 'Failed to import marks.';
            setError(message);
            toast.error(message);
        } finally {
            setPreviewingFile(false);
        }
    };

    const handleConfirmImport = async () => {
        setImportingFile(true);
        setError('');
        setMessage('');
        setImportMessage('');

        try {
            if (!selectedSchool) {
                throw new Error('Select school first.');
            }
            if (!importFile) {
                throw new Error('Choose the filled Excel template before importing.');
            }

            const config = await ensureImportSubjectConfig();
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('examination_subject_id', config.examination_subject_id);
            formData.append('school_id', selectedSchool);
            formData.append('confirm', '1');

            const res = await fetch('/api/v1/marks/import', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            await handleUnauthorized(res);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.message || 'Failed to import marks.');
            }

            const saved = Number(body.saved ?? 0);
            const successMessage = body.message || `Imported ${saved} candidate marks successfully.`;
            setMessage(successMessage);
            setImportFile(null);
            setImportPreviewRows([]);
            setPreviewLoaded(false);
            if (importFileRef.current) {
                importFileRef.current.value = '';
            }
            toast.success(successMessage);
            navigate('/marks/spreadsheet');
            setActiveTab('spreadsheet');
            await handleLoadGrid();
        } catch (err: any) {
            const message = err.message || 'Failed to import marks.';
            setError(message);
            toast.error(message);
        } finally {
            setImportingFile(false);
        }
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
        setImportMessage('');
        setImportFile(null);
        setImportPreviewRows([]);
        setPreviewLoaded(false);
        if (importFileRef.current) {
            importFileRef.current.value = '';
        }
    }, [selectedExam, selectedSubject, selectedSchool, selectedClass]);

    const handleLoadGrid = async () => {
        if (!selectedExam || !selectedSubject || !selectedClass || !selectedSchool) {
            const message = 'Please select a region, district, school, subject, and class level.';
            setError(message);
            toast.error(message);
            return;
        }

        setError('');
        setMessage('');
        setImportMessage('');
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
        setImportMessage('');

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

    const localSubject = examSubjects.find(s => s.subject_id === selectedSubject) ?? null;
    const hasPractical = subjectConfig?.has_practical ?? localSubject?.has_practical ?? false;
    const paper1Max = Number(subjectConfig?.paper_one_max_marks ?? 100);
    const paper2Max = Number(subjectConfig?.paper_two_max_marks ?? (hasPractical ? 50 : 0));
    const pageTitleMap: Record<typeof activeTab, string> = {
        spreadsheet: 'Spreadsheet Entry',
        manual: 'Manual Marks Entry',
        import: 'Import Marks',
        bulk: 'Bulk Update Marks',
        verify: 'Marks Verification',
        practical: 'Practical Entry',
    };

    const pageDescriptionMap: Record<typeof activeTab, string> = {
        spreadsheet: 'Record mock scores, import sheets, or verify entered mark sheets.',
        manual: 'Enter or update a single candidate mark record for the selected context.',
        import: 'Upload the official locked Excel template and import marks safely.',
        bulk: 'Apply adjustments or absent flags across all candidates in the selected subject.',
        verify: 'Review, approve, and lock sheets for the selected context.',
        practical: 'Capture practical marks for subjects that include practical components.',
    };

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
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">{pageTitleMap[activeTab]}</h1>
                <p className="mt-1 text-sm text-gray-500">{pageDescriptionMap[activeTab]}</p>
            </div>

            {/* ─── GLOBAL CONTEXT FILTERS ──────────────────────────────────── */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
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
                                    <span className="text-xs text-gray-500 font-bold">Paper 1 Max: {paper1Max}</span>
                                    {hasPractical && <span className="text-xs text-gray-500 font-bold">Paper 2 Max: {paper2Max}</span>}
                                    <span className="text-xs text-gray-500 font-bold ml-auto">{candidates.length} candidates</span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border scrollbar-hover">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50 font-bold text-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left">#</th>
                                                <th className="px-4 py-3 text-left">Index No.</th>
                                                <th className="px-4 py-3 text-left">Candidate Name</th>
                                                <th className="px-4 py-3 text-center">Paper 1 — Theory (/{paper1Max})</th>
                                                {hasPractical && <th className="px-4 py-3 text-center text-amber-600">Paper 2 — Practical (/{paper2Max})</th>}
                                                <th className="px-4 py-3 text-center">Absent</th>
                                                <th className="px-4 py-3 text-center">Final Marks</th>
                                                <th className="px-4 py-3 text-center">Grade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 font-semibold text-gray-800">
                                            {candidates.map((c, idx) => {
                                                const entry = marksData[c.examination_registration_id];
                                                const isAbsent = entry?.absent ?? false;
                                                const p1 = !isAbsent && entry?.paper1 ? parseFloat(entry.paper1) : 0;
                                                const p2 = !isAbsent && hasPractical && entry?.paper2 ? parseFloat(entry.paper2) : 0;
                                                const total = isAbsent ? 0 : calculateWeightedFinalScore(p1, p2, subjectConfig);
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
                                                                onChange={e => handleCellChange(c.examination_registration_id, 'paper1', clampNumericInput(e.target.value, paper1Max))}
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
                                                                    onChange={e => handleCellChange(c.examination_registration_id, 'paper2', clampNumericInput(e.target.value, paper2Max))}
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
                                                            {isAbsent ? <span className="text-rose-500 font-normal text-xs">Absent</span> : total.toFixed(2)}
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
                    <div className="space-y-5">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Import Marks from Spreadsheet</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-1">
                                Upload the official locked Excel template for this exam context. The server will reject any workbook whose structure, hidden IDs, or roster signature has been modified.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900 space-y-1.5">
                            <p className="font-bold">Security rules</p>
                            <p>1. Do not add, remove, rename, or reorder rows or columns.</p>
                            <p>2. Paper 1 must stay within 0-100 and Paper 2 within 0-50.</p>
                            <p>3. Marks cells are the only unlocked cells in the template.</p>
                        </div>

                        {importMessage && (
                            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-bold text-blue-700">
                                {importMessage}
                            </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
                            <div
                                className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center transition hover:border-[#0F4C81]"
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    handleImportFileSelect(event.dataTransfer.files?.[0] ?? null);
                                }}
                                onClick={() => importFileRef.current?.click()}
                            >
                                <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-[#0F4C81]" />
                                <p className="font-bold text-gray-800 text-sm">Drop the locked `.xlsx` file here or browse</p>
                                <p className="mt-1 text-xs text-gray-500">Only the official template downloaded from this page should be used.</p>
                                <input
                                    ref={importFileRef}
                                    type="file"
                                    accept=".xlsx"
                                    className="hidden"
                                    onChange={(event) => handleImportFileSelect(event.target.files?.[0] ?? null)}
                                />
                                <div className="mt-4 flex flex-col items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            importFileRef.current?.click();
                                        }}
                                        className="rounded-xl border border-[#0F4C81] px-4 py-2.5 text-xs font-bold text-[#0F4C81] transition hover:bg-blue-50"
                                    >
                                        Choose Excel File
                                    </button>
                                    {importFile && (
                                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                                            Selected: {importFile.name}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Current context</p>
                                <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                                    {[
                                        { label: 'School', ok: !!selectedSchool },
                                        { label: 'Exam', ok: !!selectedExam },
                                        { label: 'Subject', ok: !!selectedSubject },
                                        { label: 'Class level', ok: !!selectedClass },
                                        { label: 'Practical', ok: subjectConfig?.has_practical ?? false, yesNo: true },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                                            <span>{item.label}</span>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                                                    item.ok
                                                        ? item.yesNo
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                        : item.yesNo
                                                            ? 'bg-slate-100 text-slate-600'
                                                            : 'bg-rose-100 text-rose-700'
                                                }`}
                                            >
                                                {item.yesNo ? (item.ok ? 'Yes' : 'No') : (item.ok ? 'Selected' : 'Missing')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDownloadImportTemplate}
                                        disabled={downloadingTemplate}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F4C81] px-4 py-2.5 text-xs font-bold text-[#0F4C81] transition hover:bg-blue-50 disabled:opacity-50"
                                    >
                                        {downloadingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                        Download Official Template
                                    </button>
                                    <button
                                        type="button"
                                        onClick={previewLoaded ? handleConfirmImport : handlePreviewImport}
                                        disabled={previewingFile || importingFile || !importFile}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0a3a66] disabled:opacity-50"
                                    >
                                        {previewingFile || importingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        {previewLoaded ? 'Confirm & Import' : 'Preview Import'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {previewLoaded && importPreviewRows.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">Preview of Marks to Import</h4>
                                        <p className="text-xs text-slate-500 font-semibold">
                                            Review the rows below before final import. This is the data the server will save.
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                        {importPreviewRows.length} rows
                                    </span>
                                </div>
                                <div className="overflow-x-auto rounded-xl border">
                                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                                        <thead className="bg-slate-50 font-bold text-slate-600">
                                            <tr>
                                                <th className="px-4 py-3 text-left">#</th>
                                                <th className="px-4 py-3 text-left">Index No.</th>
                                                <th className="px-4 py-3 text-left">Candidate Name</th>
                                                <th className="px-4 py-3 text-center">Paper 1</th>
                                                {subjectConfig?.has_practical && <th className="px-4 py-3 text-center">Paper 2</th>}
                                                <th className="px-4 py-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                            {importPreviewRows.map((row, idx) => (
                                                <tr key={row.examination_registration_id ?? idx}>
                                                    <td className="px-4 py-3">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-mono">{row.exam_number}</td>
                                                    <td className="px-4 py-3">{row.student_name}</td>
                                                    <td className="px-4 py-3 text-center">{row.paper_one_score ?? '—'}</td>
                                                    {subjectConfig?.has_practical && (
                                                        <td className="px-4 py-3 text-center">{row.paper_two_score ?? '—'}</td>
                                                    )}
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${
                                                            row.registration_status === 'absent'
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {row.registration_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
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
    const hasPractical = subjectConfig?.has_practical ?? localSubject?.has_practical ?? false;
    const paper1Max = Number(subjectConfig?.paper_one_max_marks ?? 100);
    const paper2Max = Number(subjectConfig?.paper_two_max_marks ?? (hasPractical ? 50 : 0));

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
            fetch(`/api/v1/examinations/${selectedExam}/candidates?school_id=${selectedSchool}&class_level_id=${selectedClass}&subject_id=${selectedSubject}`, { headers })
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
    }, [selectedExam, selectedSchool, selectedClass, selectedSubject]);

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
                                onChange={e => setPaper1(clampNumericInput(e.target.value, paper1Max))} 
                                type="number" 
                                min="0"
                                max={paper1Max}
                                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-bold outline-none disabled:bg-gray-100" 
                            />
                    </div>
                    {hasPractical && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Paper 2 — Practical Score</label>
                            <input 
                                disabled={absent} 
                                value={paper2} 
                                onChange={e => setPaper2(clampNumericInput(e.target.value, paper2Max))} 
                                type="number" 
                                min="0"
                                max={paper2Max}
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
    const paperTwoMax = Number(subjectConfig?.paper_two_max_marks ?? 50);

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
                    <div className="overflow-x-auto rounded-xl border scrollbar-hover">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-amber-50 font-bold text-gray-600">
                                <tr>
                            <th className="px-6 py-3 text-left">#</th>
                            <th className="px-6 py-3 text-left">Index Number</th>
                            <th className="px-6 py-3 text-left">Candidate Name</th>
                            <th className="px-6 py-3 text-center">{localSubject?.name ?? 'Subject'} — Practical Score (/{paperTwoMax})</th>
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
                                                onChange={e => setMarksData(prev => ({ ...prev, [c.examination_registration_id]: clampNumericInput(e.target.value, paperTwoMax) }))}
                                                type="number" min="0"
                                                max={paperTwoMax}
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

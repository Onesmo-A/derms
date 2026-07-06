import React, { useState, useEffect } from 'react';
import { useToastFeedback } from '@/hooks/use-toast-feedback';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    Sliders, 
    BookOpen, 
    School, 
    Trash2, 
    Plus, 
    Edit2,
    Loader2, 
    Check, 
    AlertTriangle,
    Eye,
    TrendingUp,
    MapPin,
    Filter,
    RotateCcw
} from 'lucide-react';

type Tab = 'list' | 'create' | 'calendar' | 'timetable' | 'subjects' | 'centers';

export default function ExamsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('list');
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useToastFeedback({
        error,
        success,
        clearError: () => setError(''),
        clearSuccess: () => setSuccess(''),
    });

    // Global Metadata
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [subjectsList, setSubjectsList] = useState<any[]>([]);
    const [editingExamId, setEditingExamId] = useState<string | null>(null);

    // Hierarchical Filters for Centers Tab
    const [regions, setRegions] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [loadingSchools, setLoadingSchools] = useState(false);

    // Create Form
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [examTypeId, setExamTypeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedClassLevelId, setSelectedClassLevelId] = useState('');

    // Timetable States
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loadingTimetable, setLoadingTimetable] = useState(false);

    // Subject Assign States
    const [examSubjects, setExamSubjects] = useState<any[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const fetchMetadata = () => {
        const get = (url: string) => fetch(url, { headers }).then(res => res.json()).catch(() => []);
        Promise.all([
            get('/api/v1/academic-years'),
            get('/api/v1/exam-types'),
            get('/api/v1/class-levels'),
            get('/api/v1/subjects'),
            get('/api/v1/regions')
        ]).then(([years, types, classes, subs, regs]) => {
            const yearList = Array.isArray(years) ? years : years.data || [];
            const typeList = Array.isArray(types) ? types : types.data || [];
            const classList = Array.isArray(classes) ? classes : classes.data || [];
            const subjectList = Array.isArray(subs) ? subs : subs.data || [];
            const regionList = Array.isArray(regs) ? regs : regs.data || [];

            setAcademicYears(yearList);
            setExamTypes(typeList);
            setClassLevels(classList);
            setSubjectsList(subjectList);
            setRegions(regionList);
            
            if (yearList.length > 0) setAcademicYearId(yearList[0].id);
            if (typeList.length > 0) setExamTypeId(typeList[0].id);
        });
    };

    const fetchExams = () => {
        setLoading(true);
        fetch('/api/v1/examinations', { headers })
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : data.data || [];
                setExams(list);
                if (list.length > 0 && !selectedExamId) {
                    setSelectedExamId(list[0].id);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const resetExamForm = () => {
        setEditingExamId(null);
        setName('');
        setCode('');
        setStartDate('');
        setEndDate('');
        setSelectedClassLevelId('');
    };

    const openEditExam = async (examId: string) => {
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`/api/v1/examinations/${examId}`, { headers });
            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.message || 'Failed to load examination.');
            }

            const exam = body;
            setEditingExamId(exam.id);
            setName(exam.name || '');
            setCode(exam.code || '');
            setAcademicYearId(exam.academic_year_id || '');
            setExamTypeId(exam.examination_type_id || '');
            setStartDate(exam.start_date || '');
            setEndDate(exam.end_date || '');
            setSelectedClassLevelId(exam.target_class_level_id || exam.targetClassLevel?.id || exam.classLevels?.[0]?.id || '');
            setActiveTab('create');
        } catch (err: any) {
            setError(err.message || 'Failed to open examination for editing.');
        }
    };

    useEffect(() => {
        fetchMetadata();
        fetchExams();
    }, []);

    // Fetch districts when region changes
    useEffect(() => {
        if (selectedRegion) {
            fetch(`/api/v1/districts?region_id=${selectedRegion}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setDistricts(data);
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
            setLoadingSchools(true);
            fetch(`/api/v1/schools?district_id=${selectedDistrict}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setSchools(data.data || data);
                    setLoadingSchools(false);
                })
                .catch(() => setLoadingSchools(false));
        } else {
            setSchools([]);
        }
    }, [selectedDistrict]);

    // Load exam timetable
    const loadTimetable = (examId: string) => {
        if (!examId) return;
        setLoadingTimetable(true);
        fetch(`/api/v1/examinations/${examId}/timetable`, { headers })
            .then(res => res.json())
            .then(data => {
                setTimetable(data || []);
                setLoadingTimetable(false);
            })
            .catch(() => setLoadingTimetable(false));
    };

    // Load configured exam subjects
    const loadExamSubjects = (examId: string) => {
        if (!examId) return;
        setLoadingSubjects(true);
        fetch(`/api/v1/examinations/${examId}`, { headers })
            .then(res => res.json())
            .then(data => {
                setExamSubjects(data.examination_subjects || []);
                setLoadingSubjects(false);
            })
            .catch(() => setLoadingSubjects(false));
    };

    useEffect(() => {
        if (selectedExamId) {
            if (activeTab === 'timetable' || activeTab === 'calendar') {
                loadTimetable(selectedExamId);
            } else if (activeTab === 'subjects') {
                loadExamSubjects(selectedExamId);
            }
        }
    }, [selectedExamId, activeTab]);

    const handleCreateExam = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSaving(true);

        if (!selectedClassLevelId) {
            setError('Please select a target class level for this examination.');
            setSaving(false);
            return;
        }

        const method = editingExamId ? 'PUT' : 'POST';
        const endpoint = editingExamId ? `/api/v1/examinations/${editingExamId}` : '/api/v1/examinations';

        fetch(endpoint, {
            method,
            headers,
            body: JSON.stringify({
                academic_year_id: academicYearId,
                examination_type_id: examTypeId,
                code,
                name,
                start_date: startDate,
                end_date: endDate,
                class_level_id: selectedClassLevelId
            })
        })
        .then(async res => {
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || (editingExamId ? 'Failed to update exam.' : 'Failed to create exam.'));
            }
            return res.json();
        })
        .then(() => {
            setSuccess(editingExamId ? 'Examination updated successfully!' : 'Examination draft created successfully!');
            resetExamForm();
            fetchExams();
            setSaving(false);
            setActiveTab('list');
        })
        .catch(err => {
            setError(err.message);
            setSaving(false);
        });
    };

    const handleDeleteExam = (examId: string) => {
        if (!confirm('Are you sure you want to delete this examination definitions completely?')) return;
        fetch(`/api/v1/examinations/${examId}`, {
            method: 'DELETE',
            headers
        })
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            fetchExams();
        });
    };

    const handleSaveTimetable = () => {
        setSaving(true);
        setError('');
        setSuccess('');

        const schedules = timetable.map(t => ({
            examination_subject_id: t.id,
            exam_date: t.exam_date,
            start_time: t.start_time,
            end_time: t.end_time
        }));

        fetch(`/api/v1/examinations/${selectedExamId}/timetable`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ schedules })
        })
        .then(async res => {
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || 'Failed to save timetable.');
            }
            return res.json();
        })
        .then(() => {
            setSuccess('Examination Timetable saved successfully.');
            setSaving(false);
        })
        .catch(err => {
            setError(err.message);
            setSaving(false);
        });
    };

    const handleConfigSubjects = () => {
        setSaving(true);
        setError('');
        setSuccess('');

        if (!selectedExamClassLevelId) {
            setError('Please load an exam that has a target class level first.');
            setSaving(false);
            return;
        }

        const subjectsConfig = subjectsList.map(s => {
            const existing = examSubjects.find(es => es.subject_id === s.id);
            return {
                subject_id: s.id,
                class_level_id: selectedExamClassLevelId,
                max_marks: existing ? existing.max_marks : 100,
                pass_marks: existing ? existing.pass_marks : 30,
                paper_one_weight: existing ? existing.paper_one_weight : 60,
                paper_two_weight: existing ? existing.paper_two_weight : 40
            };
        });

        fetch(`/api/v1/examinations/${selectedExamId}/subjects`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ subjects: subjectsConfig })
        })
        .then(async res => {
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || 'Failed to assign subjects weights.');
            }
            return res.json();
        })
        .then(data => {
            setSuccess(data.message || 'Subjects assigned and weighted successfully.');
            setSaving(false);
            loadExamSubjects(selectedExamId);
        })
        .catch(err => {
            setError(err.message);
            setSaving(false);
        });
    };

    const handleUpdateExamSubjectField = (subjectId: string, field: string, value: any) => {
        setExamSubjects(prev => {
            const list = [...prev];
            const idx = list.findIndex(es => es.subject_id === subjectId);
            if (idx >= 0) {
                list[idx] = { ...list[idx], [field]: value };
            } else {
                list.push({
                    subject_id: subjectId,
                    [field]: value,
                    max_marks: 100,
                    pass_marks: 30,
                    paper_one_weight: 60,
                    paper_two_weight: 40
                });
            }
            return list;
        });
    };

    const handleUpdateTimetableField = (id: string, field: string, value: string) => {
        setTimetable(prev => prev.map(t => {
            if (t.id === id) {
                return { ...t, [field]: value };
            }
            return t;
        }));
    };

    const normalizeStatus = (status: any) => (typeof status === 'string' ? status : status?.value || '');

    const formatStageLabel = (status: any) => {
        const normalized = normalizeStatus(status);
        return normalized ? normalized.replace(/_/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) : 'Unknown';
    };

    const getStageToneClass = (status: any) => {
        switch (normalizeStatus(status)) {
            case 'draft':
                return 'border border-slate-200 bg-slate-100 text-slate-800 shadow-sm';
            case 'registration_open':
                return 'border border-sky-200 bg-sky-50 text-sky-800 shadow-sm';
            case 'registration_closed':
                return 'border border-amber-200 bg-amber-50 text-amber-800 shadow-sm';
            case 'marks_entry_open':
                return 'border border-violet-200 bg-violet-50 text-violet-800 shadow-sm';
            case 'processing':
                return 'border border-orange-200 bg-orange-50 text-orange-800 shadow-sm';
            case 'processed':
                return 'border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm';
            case 'published':
                return 'border border-green-200 bg-green-50 text-green-800 shadow-sm';
            case 'closed':
                return 'border border-slate-300 bg-slate-200 text-slate-800 shadow-sm';
            default:
                return 'border border-slate-200 bg-slate-100 text-slate-700 shadow-sm';
        }
    };

    const getStageCardClass = (status: any) => {
        switch (normalizeStatus(status)) {
            case 'draft':
                return 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100';
            case 'registration_open':
                return 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white';
            case 'registration_closed':
                return 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white';
            case 'marks_entry_open':
                return 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-white';
            case 'processing':
                return 'border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white';
            case 'processed':
                return 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white';
            case 'published':
                return 'border-green-100 bg-gradient-to-br from-green-50 via-white to-white';
            case 'closed':
                return 'border-slate-300 bg-gradient-to-br from-slate-100 via-white to-slate-50';
            default:
                return 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white';
        }
    };

    const getSummaryBadgeClass = (label: string) => {
        switch (label) {
            case 'Exams':
                return 'border-sky-100 bg-sky-50 text-sky-800';
            case 'Academic years':
                return 'border-emerald-100 bg-emerald-50 text-emerald-800';
            case 'Subjects':
                return 'border-violet-100 bg-violet-50 text-violet-800';
            case 'Current exam':
                return 'border-amber-100 bg-amber-50 text-amber-800';
            case 'Target class':
                return 'border-cyan-100 bg-cyan-50 text-cyan-800';
            default:
                return 'border-slate-200 bg-slate-50 text-slate-800';
        }
    };

    const getRollbackTarget = (status: any) => {
        const current = normalizeStatus(status);
        const map: Record<string, string | null> = {
            registration_open: 'draft',
            registration_closed: 'registration_open',
            marks_entry_open: 'registration_closed',
            processing: 'marks_entry_open',
            processed: 'processing',
            published: 'processed',
            closed: 'published',
        };

        return map[current] ?? null;
    };

    const getNextTarget = (status: any) => {
        const current = normalizeStatus(status);
        const map: Record<string, string | null> = {
            draft: 'registration_open',
            registration_open: 'registration_closed',
            registration_closed: 'marks_entry_open',
            marks_entry_open: 'processing',
            processing: 'processed',
            processed: 'published',
            published: 'closed',
            closed: 'archived',
        };

        return map[current] ?? null;
    };

    const handleChangeExamStatus = async (examId: string, status: string) => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/v1/examinations/${examId}/status`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status }),
            });
            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.message || 'Failed to update exam status.');
            }

            setSuccess(body.message || `Examination moved to ${formatStageLabel(status)}.`);
            fetchExams();
        } catch (err: any) {
            setError(err.message || 'Failed to update exam status.');
        } finally {
            setSaving(false);
        }
    };

    const confirmStageChange = (examId: string, targetStatus: string, mode: 'advance' | 'rollback') => {
        const tone = mode === 'advance' ? 'warning' : 'warning';
        let toastId: string | number | undefined;
        toastId = toast[tone](
            mode === 'advance' ? 'Advance this examination stage?' : 'Rollback this examination stage?',
            {
                description: `The examination will move to ${formatStageLabel(targetStatus)}.`,
                duration: Infinity,
                action: {
                    label: 'Confirm',
                    onClick: () => {
                        if (toastId !== undefined) {
                            toast.dismiss(toastId);
                        }
                        void handleChangeExamStatus(examId, targetStatus);
                    },
                },
                cancel: {
                    label: 'Cancel',
                    onClick: () => {
                        if (toastId !== undefined) {
                            toast.dismiss(toastId);
                        }
                    },
                },
            }
        );
    };

    const selectedExam = exams.find(e => e.id === selectedExamId);
    const selectedExamCode = selectedExam?.code || '—';
    const selectedExamClassLevelId = selectedExam?.target_class_level_id
        || selectedExam?.targetClassLevel?.id
        || selectedExam?.classLevels?.[0]?.id
        || '';
    const selectedExamClass = selectedExam?.targetClassLevel?.name
        || selectedExam?.target_class_level?.name
        || selectedExam?.classLevels?.[0]?.name
        || '—';
    const academicYearLabel = (year: any) => year?.name || year?.year || year?.label || 'Academic Year';
    const examTypeLabel = (type: any) => type?.name || type?.label || 'Mock Examination';
    const stageFlow = [
        { key: 'draft', label: 'Draft' },
        { key: 'registration_open', label: 'Reg Open' },
        { key: 'registration_closed', label: 'Reg Closed' },
        { key: 'marks_entry_open', label: 'Marks Entry' },
        { key: 'processing', label: 'Processing' },
        { key: 'processed', label: 'Processed' },
        { key: 'published', label: 'Published' },
        { key: 'closed', label: 'Closed' },
        { key: 'archived', label: 'Archived' },
    ];

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 text-slate-900 shadow-[0_20px_50px_rgba(15,76,129,0.08)]">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-sky-200/35 blur-3xl" />
                    <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-emerald-200/30 blur-3xl" />
                    <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-amber-200/25 blur-3xl" />
                </div>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="relative max-w-3xl">
                        <p className="mb-3 inline-flex rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700 backdrop-blur">
                            Examination Operations
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Examinations Console</h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            Configure exam definitions, timetable windows, subject weights, and candidate centers from one streamlined workspace.
                        </p>
                        
                    </div>
                    <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[540px]">
                        {[
                            { label: 'Exams', value: String(exams.length) },
                            { label: 'Academic years', value: String(academicYears.length) },
                            { label: 'Subjects', value: String(subjectsList.length) },
                            { label: 'Current exam', value: selectedExamCode },
                            { label: 'Target class', value: selectedExamClass },
                        ].map((badge) => (
                            <div key={badge.label} className={`rounded-2xl border px-3 py-2 shadow-sm backdrop-blur ${getSummaryBadgeClass(badge.label)}`}>
                                <div className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-80">{badge.label}</div>
                                <div className="mt-1 truncate text-xs font-semibold leading-5">{badge.value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Submenu tabs */}
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap rounded-2xl border border-slate-200 bg-white p-2 shadow-sm scrollbar-hide">
                {[
                    { id: 'list', label: 'All Examinations', icon: Sliders },
                    { id: 'create', label: 'Create Examination', icon: Plus },
                    { id: 'calendar', label: 'Examination Calendar', icon: CalendarIcon },
                    { id: 'timetable', label: 'Examination Timetable', icon: Clock },
                    { id: 'subjects', label: 'Assign & Weight Subjects', icon: BookOpen },
                    { id: 'centers', label: 'Centers List', icon: School }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center gap-1.5 ${activeTab === tab.id ? 'bg-[#0F4C81] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
                    {success}
                </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                
                {/* 1. ALL EXAMINATIONS LIST */}
                {activeTab === 'list' && (
                    <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2">
                                <h3 className="text-lg font-bold text-gray-900">Configured Examinations List</h3>
                            <button onClick={fetchExams} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#0F4C81] hover:bg-slate-50">Refresh List</button>
                            </div>

                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : exams.length === 0 ? (
                            <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl text-xs text-gray-400 font-medium">
                                No examinations configured. Go to 'Create Examination' tab to add mock exams.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {exams.map(exam => (
                                    <div key={exam.id} className={`w-full rounded-[24px] border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-5 ${getStageCardClass(exam.status)}`}>
                                        <div>
                                            <div className="flex flex-col gap-2 border-b border-white/70 pb-3 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="space-y-1.5">
                                                    <div className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${getStageToneClass(exam.status)}`}>
                                                        {formatStageLabel(exam.status)}
                                                    </div>
                                                    <h3 className="text-lg font-black tracking-tight text-slate-900 lg:text-xl">{exam.name}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                                        <span>Code: <span className="text-slate-900">{exam.code || 'N/A'}</span></span>
                                                        <span className="text-slate-300">|</span>
                                                        <span>Year: <span className="text-slate-900">{new Date(exam.start_date).getFullYear()}</span></span>
                                                        <span className="text-slate-300">|</span>
                                                        <span>Class: <span className="text-slate-900">{exam.targetClassLevel?.name || exam.target_class_level?.name || exam.classLevels?.[0]?.name || 'N/A'}</span></span>
                                                    </div>
                                                </div>
                                                <div className="text-[11px] text-slate-400 lg:text-xs">
                                                    Active Duration:
                                                    <div className="mt-0.5 font-semibold text-slate-600">
                                                        {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                                    Progress Timeline
                                                </p>
                                                <div className="mt-2 overflow-x-auto">
                                                <div className="min-w-[760px] rounded-2xl border border-white/70 bg-white/65 px-3 py-3 backdrop-blur-sm">
                                                    <div className="flex items-start">
                                                        {stageFlow.map((stage, index) => {
                                                            const current = normalizeStatus(exam.status);
                                                            const stageIndex = stageFlow.findIndex((item) => item.key === current);
                                                            const isActive = stage.key === current;
                                                            const isDone = stageIndex > -1 && index < stageIndex;
                                                            const isUpcoming = stageIndex > -1 && index > stageIndex;
                                                            const lineClass =
                                                                stageIndex > -1 && index < stageIndex
                                                                    ? 'bg-emerald-400'
                                                                    : isActive
                                                                        ? 'bg-[#0F4C81]'
                                                                        : 'bg-slate-200';

                                                            return (
                                                                <div key={stage.key} className="flex min-w-0 flex-1 items-start">
                                                                    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                                                                        <span
                                                                            className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[9px] font-black transition ${
                                                                                isActive
                                                                                    ? 'border-[#0F4C81] bg-[#0F4C81] text-white shadow-md'
                                                                                    : isDone
                                                                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                                                        : isUpcoming
                                                                                            ? 'border-slate-200 bg-white text-slate-400'
                                                                                            : 'border-slate-200 bg-slate-50 text-slate-500'
                                                                            }`}
                                                                        >
                                                                            {index + 1}
                                                                        </span>
                                                                        <span className={`mt-1.5 text-[9px] font-bold uppercase tracking-[0.11em] ${isActive ? 'text-[#0F4C81]' : isDone ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                                            {stage.label}
                                                                        </span>
                                                                    </div>
                                                                    {index < stageFlow.length - 1 && (
                                                                        <div className="mx-2 mt-3.5 flex flex-1 items-center">
                                                                            <div className={`h-0.5 w-full rounded-full ${lineClass}`} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-2 border-t border-white/70 pt-3 lg:flex-row lg:items-center lg:justify-between">
                                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Classic management view</span>
                                            <div className="flex items-center gap-2">
                                                {getNextTarget(exam.status) && (
                                                    <button
                                                        onClick={() => confirmStageChange(exam.id, getNextTarget(exam.status)!, 'advance')}
                                                        className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-800 transition hover:bg-sky-100 disabled:opacity-50"
                                                        disabled={saving}
                                                    >
                                                        <TrendingUp className="h-3 w-3" />
                                                        Advance Stage
                                                    </button>
                                                )}
                                                {getRollbackTarget(exam.status) && (
                                                    <button
                                                        onClick={() => confirmStageChange(exam.id, getRollbackTarget(exam.status)!, 'rollback')}
                                                        className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                                                        disabled={saving}
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                        Rollback
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openEditExam(exam.id)}
                                                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-[#0F4C81] transition hover:bg-slate-50"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteExam(exam.id)}
                                                    className="text-gray-400 transition hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. CREATE EXAMINATION */}
                {activeTab === 'create' && (
                    <form onSubmit={handleCreateExam} className="space-y-4 max-w-lg">
                        <div className="flex items-center justify-between gap-3 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingExamId ? 'Edit Examination Definition' : 'Create New Examination Definition'}
                            </h3>
                            {editingExamId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetExamForm();
                                        setActiveTab('list');
                                    }}
                                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Exam Title / Name</label>
                            <input 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required
                                type="text" 
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#0F4C81]" 
                                placeholder="e.g. Form Four District Mock Exam 2026" 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Exam Code</label>
                            <input
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase())}
                                required
                                type="text"
                                className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#0F4C81]"
                                placeholder="e.g. F4-DMC-2026"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Academic Year</label>
                                <SearchableSelect
                                    value={academicYearId}
                                    onValueChange={setAcademicYearId}
                                    placeholder="Select academic year"
                                    searchPlaceholder="Search academic year..."
                                    options={academicYears.map((y) => ({ value: y.id, label: academicYearLabel(y) }))}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Exam Type Classification</label>
                                <SearchableSelect
                                    value={examTypeId}
                                    onValueChange={setExamTypeId}
                                    placeholder="Select exam type"
                                    searchPlaceholder="Search exam type..."
                                    options={examTypes.map((t) => ({ value: t.id, label: examTypeLabel(t) }))}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Start Date</label>
                                <input 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)} 
                                    required
                                    type="date" 
                                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">End Date</label>
                                <input 
                                    value={endDate} 
                                    onChange={e => setEndDate(e.target.value)} 
                                    required
                                    type="date" 
                                    className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-semibold outline-none" 
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Target Class Level</label>
                            <SearchableSelect
                                value={selectedClassLevelId}
                                onValueChange={setSelectedClassLevelId}
                                placeholder="Select target class level"
                                searchPlaceholder="Search class level..."
                                options={classLevels.map(c => ({ value: c.id, label: c.name }))}
                                className="w-full md:w-[320px]"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                This examination will be managed as a single class-level exam.
                            </p>
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="rounded-xl bg-[#0F4C81] px-5 py-3 text-sm font-bold text-white hover:bg-[#0c3c66] transition disabled:opacity-50"
                        >
                            {saving ? (editingExamId ? 'Saving Changes...' : 'Creating Draft...') : (editingExamId ? 'Update Examination' : 'Create Examination & Map')}
                        </button>
                    </form>
                )}

                {/* 3. EXAMINATION CALENDAR */}
                {activeTab === 'calendar' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Examination Calendar Schedule</h3>
                                <p className="text-xs text-gray-500 font-semibold">Timeline view of scheduled papers across the mock date duration.</p>
                            </div>
                            <SearchableSelect
                                value={selectedExamId}
                                onValueChange={setSelectedExamId}
                                placeholder="Select Exam"
                                searchPlaceholder="Search exam..."
                                options={exams.map(e => ({ value: e.id, label: e.name }))}
                                className="min-w-[240px]"
                            />
                        </div>

                        {loadingTimetable ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : timetable.length === 0 ? (
                            <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl text-xs text-gray-400 font-medium">
                                No timetabled papers found for this exam. Timetable papers under 'Timetable' tab first.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {timetable.map(paper => (
                                    <div key={paper.id} className="p-4 border rounded-2xl bg-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-sky-100 text-[#0F4C81] flex items-center justify-center font-black text-xs">
                                                {paper.subject?.code || 'SUB'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 uppercase">{paper.subject?.name}</p>
                                                <p className="text-xs text-gray-500 mt-1 font-semibold flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {paper.exam_date ? new Date(paper.exam_date).toLocaleDateString() : 'Unscheduled'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                                                <Clock className="h-3 w-3" />
                                                {paper.start_time || 'Morning'} - {paper.end_time || 'Noon'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. EXAMINATION TIMETABLE */}
                {activeTab === 'timetable' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Examination Timetable Editor</h3>
                                <p className="text-xs text-gray-500 font-semibold">Configure morning or afternoon session schedules per subject paper.</p>
                            </div>
                            <SearchableSelect
                                value={selectedExamId}
                                onValueChange={setSelectedExamId}
                                placeholder="Select Exam"
                                searchPlaceholder="Search exam..."
                                options={exams.map(e => ({ value: e.id, label: e.name }))}
                                className="min-w-[240px]"
                            />
                        </div>

                        {loadingTimetable ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : timetable.length === 0 ? (
                            <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl text-xs text-gray-400 font-medium">
                                No subject papers assigned. Assign subjects under 'Assign & Weight Subjects' tab first.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border rounded-2xl overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-500">
                                        <thead className="bg-slate-50 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 font-bold">Subject Code</th>
                                                <th className="px-6 py-4 font-bold">Subject Name</th>
                                                <th className="px-6 py-4 font-bold">Exam Date</th>
                                                <th className="px-6 py-4 font-bold">Start Time</th>
                                                <th className="px-6 py-4 font-bold">End Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {timetable.map(paper => (
                                                <tr key={paper.id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 font-bold text-[#0F4C81]">{paper.subject?.code}</td>
                                                    <td className="px-6 py-4 font-semibold text-gray-800">{paper.subject?.name}</td>
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            type="date"
                                                            value={paper.exam_date || ''}
                                                            onChange={e => handleUpdateTimetableField(paper.id, 'exam_date', e.target.value)}
                                                            className="border rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            type="text"
                                                            value={paper.start_time || '08:30 AM'}
                                                            placeholder="08:30 AM"
                                                            onChange={e => handleUpdateTimetableField(paper.id, 'start_time', e.target.value)}
                                                            className="border rounded-xl px-3 py-1.5 text-xs font-semibold w-24 text-center outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input 
                                                            type="text"
                                                            value={paper.end_time || '11:30 AM'}
                                                            placeholder="11:30 AM"
                                                            onChange={e => handleUpdateTimetableField(paper.id, 'end_time', e.target.value)}
                                                            className="border rounded-xl px-3 py-1.5 text-xs font-semibold w-24 text-center outline-none"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    disabled={saving}
                                    onClick={handleSaveTimetable}
                                    className="rounded-xl bg-[#0F4C81] px-5 py-3 text-sm font-bold text-white hover:bg-[#0c3c66] transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving Schedules...' : 'Save Timetable Grid'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 5. ASSIGN & WEIGHT SUBJECTS */}
                {activeTab === 'subjects' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Map Subjects & Assign Theory/Practical Weights</h3>
                                <p className="text-xs text-gray-500 font-semibold">Map curriculum subjects to mock definitions, configuring pass points thresholds.</p>
                            </div>
                            <SearchableSelect
                                value={selectedExamId}
                                onValueChange={setSelectedExamId}
                                placeholder="Select Exam"
                                searchPlaceholder="Search exam..."
                                options={exams.map(e => ({ value: e.id, label: e.name }))}
                                className="min-w-[240px]"
                            />
                        </div>

                        {loadingSubjects ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="border rounded-2xl overflow-x-auto">
                                    <table className="w-full text-left text-sm text-gray-500">
                                        <thead className="bg-slate-50 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 font-bold">Subject Code</th>
                                                <th className="px-6 py-4 font-bold">Subject Name</th>
                                                <th className="px-6 py-4 font-bold">Max Marks</th>
                                                <th className="px-6 py-4 font-bold">Pass Marks</th>
                                                <th className="px-6 py-4 font-bold">Theory Weight %</th>
                                                <th className="px-6 py-4 font-bold">Practical Weight %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {subjectsList.map(s => {
                                                const mapping = examSubjects.find(es => es.subject_id === s.id);
                                                return (
                                                    <tr key={s.id} className="hover:bg-slate-50">
                                                        <td className="px-6 py-4 font-bold text-[#0F4C81]">{s.code}</td>
                                                        <td className="px-6 py-4 font-semibold text-gray-800">{s.name}</td>
                                                        <td className="px-6 py-4">
                                                            <input 
                                                                type="number"
                                                                value={mapping ? mapping.max_marks : 100}
                                                                onChange={e => handleUpdateExamSubjectField(s.id, 'max_marks', Number(e.target.value))}
                                                                className="border rounded-xl px-3 py-1.5 text-xs font-bold w-20 text-center outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input 
                                                                type="number"
                                                                value={mapping ? mapping.pass_marks : 30}
                                                                onChange={e => handleUpdateExamSubjectField(s.id, 'pass_marks', Number(e.target.value))}
                                                                className="border rounded-xl px-3 py-1.5 text-xs font-bold w-20 text-center outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input 
                                                                type="number"
                                                                value={mapping ? mapping.paper_one_weight : 60}
                                                                onChange={e => handleUpdateExamSubjectField(s.id, 'paper_one_weight', Number(e.target.value))}
                                                                className="border rounded-xl px-3 py-1.5 text-xs font-bold w-20 text-center outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input 
                                                                type="number"
                                                                value={mapping ? mapping.paper_two_weight : 40}
                                                                onChange={e => handleUpdateExamSubjectField(s.id, 'paper_two_weight', Number(e.target.value))}
                                                                className="border rounded-xl px-3 py-1.5 text-xs font-bold w-20 text-center outline-none"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    disabled={saving}
                                    onClick={handleConfigSubjects}
                                    className="rounded-xl bg-[#0F4C81] px-5 py-3 text-sm font-bold text-white hover:bg-[#0c3c66] transition disabled:opacity-50"
                                >
                                    {saving ? 'Saving Configurations...' : 'Assign & Map Weight Matrix'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 6. CENTERS LIST */}
                {activeTab === 'centers' && (
                    <div className="space-y-6">
                        <div className="border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Approved School Centers Index</h3>
                            <p className="text-xs text-gray-500 font-semibold">Hierarchical catalog filterable by Regions and Districts.</p>
                        </div>

                        {/* Dropdown Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Filter Region</label>
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
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Filter District</label>
                                <SearchableSelect
                                    value={selectedDistrict}
                                    onValueChange={setSelectedDistrict}
                                    placeholder="Select District"
                                    searchPlaceholder="Search district..."
                                    options={districts.map(d => ({ value: d.id, label: d.name }))}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* List Grid */}
                        {loadingSchools ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : schools.length === 0 ? (
                            <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl text-xs text-gray-400 font-medium">
                                Select region and district to view registered schools list.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {schools.map(s => (
                                    <div key={s.id} className="p-4 border rounded-2xl bg-slate-50 flex items-center justify-between hover:shadow-sm">
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-sm uppercase leading-tight">{s.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1 font-semibold flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5 text-sky-600" />
                                                Centre Code: {s.registration_number || 'N/A'}
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-[#0F4C81] bg-sky-50 px-2.5 py-1 rounded-full uppercase">
                                            {s.level || 'Secondary'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

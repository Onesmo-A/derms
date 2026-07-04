import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, 
    Clock, 
    Sliders, 
    BookOpen, 
    School, 
    Trash2, 
    Plus, 
    Loader2, 
    Check, 
    AlertTriangle,
    Eye,
    TrendingUp,
    MapPin,
    Filter
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

    // Global Metadata
    const [academicYears, setAcademicYears] = useState<any[]>([]);
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [subjectsList, setSubjectsList] = useState<any[]>([]);

    // Hierarchical Filters for Centers Tab
    const [regions, setRegions] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [loadingSchools, setLoadingSchools] = useState(false);

    // Create Form
    const [name, setName] = useState('');
    const [academicYearId, setAcademicYearId] = useState('');
    const [examTypeId, setExamTypeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

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
            setAcademicYears(years);
            setExamTypes(types);
            setClassLevels(classes.data || classes);
            setSubjectsList(subs.data || subs);
            setRegions(regs);
            
            if (years.length > 0) setAcademicYearId(years[0].id);
            if (types.length > 0) setExamTypeId(types[0].id);
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

        fetch('/api/v1/examinations', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                academic_year_id: academicYearId,
                examination_type_id: examTypeId,
                name,
                start_date: startDate,
                end_date: endDate,
                class_level_ids: selectedClasses.length > 0 ? selectedClasses : classLevels.map(c => c.id)
            })
        })
        .then(async res => {
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.message || 'Failed to create exam.');
            }
            return res.json();
        })
        .then(() => {
            setSuccess('Examination draft created successfully!');
            setName('');
            setStartDate('');
            setEndDate('');
            setSelectedClasses([]);
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

        const subjectsConfig = subjectsList.map(s => {
            const existing = examSubjects.find(es => es.subject_id === s.id);
            return {
                subject_id: s.id,
                class_level_id: classLevels[0]?.id,
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Examinations Console</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium">Configure examination settings, papers schedule, and monitor candidate registrations.</p>
                </div>
            </div>

            {/* Submenu tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
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
                        className={`px-5 py-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${activeTab === tab.id ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                
                {/* 1. ALL EXAMINATIONS LIST */}
                {activeTab === 'list' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2">
                            <h3 className="text-lg font-bold text-gray-900">Configured Examinations List</h3>
                            <button onClick={fetchExams} className="text-xs text-[#0F4C81] font-bold">Refresh List</button>
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
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {exams.map(exam => (
                                    <div key={exam.id} className="rounded-2xl border p-5 flex flex-col justify-between hover:shadow-md transition">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                                                    exam.status === 'published' ? 'bg-emerald-100 text-emerald-800' :
                                                    exam.status === 'draft' ? 'bg-slate-100 text-gray-800' :
                                                    'bg-blue-100 text-[#0F4C81]'
                                                }`}>{exam.status}</span>
                                                <span className="text-xs text-gray-400 font-bold">Year: {new Date(exam.start_date).getFullYear()}</span>
                                            </div>
                                            <h3 className="mt-4 text-lg font-extrabold text-gray-900 leading-snug">{exam.name}</h3>
                                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                                Active Duration: {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                                            <span className="text-xs text-gray-400 font-semibold uppercase">Mock Exam</span>
                                            <button 
                                                onClick={() => handleDeleteExam(exam.id)}
                                                className="text-gray-400 hover:text-rose-600 transition"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
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
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Create New Examination Definition</h3>
                        
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Academic Year</label>
                                <select 
                                    value={academicYearId}
                                    onChange={e => setAcademicYearId(e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none"
                                >
                                    {academicYears.map(y => (
                                        <option key={y.id} value={y.id}>{y.year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Exam Type Classification</label>
                                <select 
                                    value={examTypeId}
                                    onChange={e => setExamTypeId(e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none"
                                >
                                    {examTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
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
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Target Class Levels</label>
                            <div className="flex flex-wrap gap-2">
                                {classLevels.map(c => {
                                    const checked = selectedClasses.includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => {
                                                if (checked) setSelectedClasses(selectedClasses.filter(x => x !== c.id));
                                                else setSelectedClasses([...selectedClasses, c.id]);
                                            }}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                                                checked ? 'bg-[#0F4C81] text-white border-transparent' : 'bg-white text-gray-600 border-gray-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={saving}
                            className="rounded-xl bg-[#0F4C81] px-5 py-3 text-sm font-bold text-white hover:bg-[#0c3c66] transition disabled:opacity-50"
                        >
                            {saving ? 'Creating Draft...' : 'Create Examination & Map'}
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
                            <select 
                                value={selectedExamId}
                                onChange={e => setSelectedExamId(e.target.value)}
                                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold"
                            >
                                {exams.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
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
                            <select 
                                value={selectedExamId}
                                onChange={e => setSelectedExamId(e.target.value)}
                                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold"
                            >
                                {exams.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
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
                            <select 
                                value={selectedExamId}
                                onChange={e => setSelectedExamId(e.target.value)}
                                className="rounded-xl border border-gray-300 px-3 py-1.5 text-xs font-semibold"
                            >
                                {exams.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
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
                                <select 
                                    value={selectedRegion}
                                    onChange={e => setSelectedRegion(e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none"
                                >
                                    <option value="">Select Region</option>
                                    {regions.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Filter District</label>
                                <select 
                                    value={selectedDistrict}
                                    onChange={e => setSelectedDistrict(e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none"
                                >
                                    <option value="">Select District</option>
                                    {districts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
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

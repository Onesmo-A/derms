import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchableSelect } from '@/components/ui/searchable-select';
import SubjectRegistrationPage from '@/pages/SubjectRegistrationPage';
import {
    Users2, UserPlus, FileSpreadsheet, BadgeCheck, ArrowUpCircle,
    ArrowRightLeft, Radar, ChartColumn, Search, RefreshCw, Download,
    Upload, Plus, Pencil, Trash2, X, Check, ChevronDown, Eye,
    AlertTriangle, CheckCircle2, FileDown, Filter, BarChart3,
    Clock, GraduationCap, MapPin, Phone, User2, Calendar, BookOpen,
    Loader2, AlertCircle, Info, TrendingUp, Building2
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Region    { id: string; name: string; code?: string; }
interface District  { id: string; name: string; region_id: string; region?: Region; }
interface SchoolItem{ id: string; name: string; district_id: string; district?: District; registration_number?: string; }
interface AcademicYear{ id: string; name: string; is_active?: boolean; }
interface ClassLevel  { id: string; name: string; code?: string; numeric_level?: number; }
interface Examination { id: string; name: string; status: string; is_published?: boolean; academic_year_id?: string; }

interface StudentRecord {
    registration_display: string;
    id: string;
    registration_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    gender: 'M' | 'F';
    date_of_birth?: string;
    parent_name?: string;
    parent_phone?: string;
    status?: string;
    school_id?: string;
    academic_year_id?: string;
    current_class_level_id?: string;
    school?: SchoolItem;
    academicYear?: AcademicYear;
    classLevel?: ClassLevel;
    class_level?: ClassLevel;
}

interface StudentStats {
    total: number; male: number; female: number;
    active: number; transferred: number; completed: number;
    perSchool?: { name: string; count: number }[];
}

interface DuplicateGroup {
    type: string; label: string; count: number;
    students: StudentRecord[]; risk_level: 'high' | 'medium' | 'low';
}

interface ImportRow {
    registration_number: string; first_name: string; middle_name?: string;
    last_name: string; gender: string; date_of_birth?: string;
    parent_name?: string; parent_phone: string;
    _row?: number; _errors?: string[]; _valid?: boolean;
}

type TabId = 'all' | 'register' | 'import' | 'subjects' | 'candidate_reg' | 'promotions' | 'transfers' | 'duplicates' | 'performance';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; path: string; icon: React.ComponentType<any>; }[] = [
    { id: 'all',           label: 'All Students',          path: '/students',                    icon: Users2          },
    { id: 'register',      label: 'Register Student',       path: '/students/register',           icon: UserPlus        },
    { id: 'import',        label: 'Bulk Import',            path: '/students/import',             icon: FileSpreadsheet },
    { id: 'subjects',      label: 'Subject Registration',   path: '/students/subjects',           icon: BookOpen        },
    { id: 'candidate_reg', label: 'Candidate Registration', path: '/candidates/register',         icon: BadgeCheck      },
    { id: 'promotions',    label: 'Promotions',             path: '/students/promotions',         icon: ArrowUpCircle   },
    { id: 'transfers',     label: 'Transfers',              path: '/students/transfers',          icon: ArrowRightLeft  },
    { id: 'duplicates',    label: 'Duplicate Detection',    path: '/students/duplicates',         icon: Radar           },
    { id: 'performance',   label: 'Performance History',    path: '/students/performance-history',icon: ChartColumn     },
];

const EMPTY_FORM = {
    registration_number: '', first_name: '', middle_name: '', last_name: '',
    gender: 'M', date_of_birth: '', parent_name: '', parent_phone: '',
    school_id: '', academic_year_id: '', current_class_level_id: '',
};

const resolveStudentClassLevel = (student: StudentRecord): ClassLevel | undefined => student.classLevel ?? student.class_level;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
    const cls = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-7 w-7';
    return <Loader2 className={`${cls} animate-spin text-[#0F4C81]`} />;
};

const Badge = ({ label, variant }: { label: string; variant: 'active' | 'transferred' | 'completed' | 'pending' | 'high' | 'medium' | 'low' }) => {
    const map: Record<string, string> = {
        active:      'bg-emerald-100 text-emerald-700 border-emerald-200',
        completed:   'bg-blue-100 text-blue-700 border-blue-200',
        transferred: 'bg-amber-100 text-amber-700 border-amber-200',
        pending:     'bg-slate-100 text-slate-600 border-slate-200',
        high:        'bg-red-100 text-red-700 border-red-200',
        medium:      'bg-orange-100 text-orange-700 border-orange-200',
        low:         'bg-yellow-100 text-yellow-700 border-yellow-200',
    };
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${map[variant] ?? map.pending}`}>
            {label}
        </span>
    );
};

const Alert = ({ type, message }: { type: 'error' | 'success' | 'info'; message: string }) => {
    if (!message) return null;
    const map = {
        error:   { bg: 'bg-red-50 border-red-200 text-red-700',    icon: <AlertCircle className="h-4 w-4 shrink-0" /> },
        success: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: <CheckCircle2 className="h-4 w-4 shrink-0" /> },
        info:    { bg: 'bg-blue-50 border-blue-200 text-blue-700', icon: <Info className="h-4 w-4 shrink-0" /> },
    };
    return (
        <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${map[type].bg}`}>
            {map[type].icon}
            <span>{message}</span>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// HIERARCHICAL LOCATION SELECTOR
// ─────────────────────────────────────────────────────────────────────────────
interface LocationSelectorProps {
    regions: Region[];
    districts: District[];
    schools: SchoolItem[];
    selectedRegion: string; onRegion: (v: string) => void;
    selectedDistrict: string; onDistrict: (v: string) => void;
    selectedSchool: string; onSchool: (v: string) => void;
    required?: boolean;
    showSchool?: boolean;
}

const LocationSelector = ({
    regions, districts, schools,
    selectedRegion, onRegion, selectedDistrict, onDistrict, selectedSchool, onSchool,
    required = false, showSchool = true,
}: LocationSelectorProps) => {
    const filteredDistricts = districts.filter(d => !selectedRegion || d.region_id === selectedRegion);
    const filteredSchools   = schools.filter(s => !selectedDistrict || s.district_id === selectedDistrict);

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Region {required && <span className="text-red-500">*</span>}
                </label>
                <SearchableSelect
                    value={selectedRegion}
                    onValueChange={(value) => { onRegion(value); onDistrict(''); onSchool(''); }}
                    placeholder="All Regions"
                    searchPlaceholder="Search region..."
                    options={regions.map((r) => ({ value: r.id, label: r.name }))}
                />
            </div>
            <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    District {required && <span className="text-red-500">*</span>}
                </label>
                <SearchableSelect
                    value={selectedDistrict}
                    onValueChange={(value) => { onDistrict(value); onSchool(''); }}
                    disabled={!selectedRegion && required}
                    placeholder="All Districts"
                    searchPlaceholder="Search district..."
                    options={filteredDistricts.map((d) => ({ value: d.id, label: d.name }))}
                />
            </div>
            {showSchool && (
                <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        School {required && <span className="text-red-500">*</span>}
                    </label>
                    <SearchableSelect
                        value={selectedSchool}
                        onValueChange={onSchool}
                        disabled={!selectedDistrict && required}
                        placeholder="All Schools"
                        searchPlaceholder="Search school..."
                        options={filteredSchools.map((s) => ({ value: s.id, label: s.name }))}
                    />
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// STATS CARDS
// ─────────────────────────────────────────────────────────────────────────────
const StatsCards = ({ stats }: { stats: StudentStats }) => {
    const cards = [
        { label: 'Total Students', value: (stats.total  ?? 0).toLocaleString(), textStyle: 'text-[#0F4C81]', bgTint: 'bg-[#0F4C81]/10', icon: Users2 },
        { label: 'Male',           value: (stats.male   ?? 0).toLocaleString(), textStyle: 'text-blue-700',    bgTint: 'bg-blue-500/10',    icon: User2  },
        { label: 'Female',         value: (stats.female ?? 0).toLocaleString(), textStyle: 'text-purple-700',  bgTint: 'bg-purple-500/10',  icon: User2  },
        { label: 'Active',         value: (stats.active ?? 0).toLocaleString(), textStyle: 'text-emerald-700', bgTint: 'bg-emerald-500/10', icon: CheckCircle2 },
        { label: 'Transferred',    value: (stats.transferred ?? 0).toLocaleString(), textStyle: 'text-amber-700', bgTint: 'bg-amber-500/10', icon: ArrowRightLeft },
    ];
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map(c => {
                const Icon = c.icon;
                return (
                    <div key={c.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{c.label}</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{c.value}</p>
                            </div>
                            <div className={`rounded-xl ${c.bgTint} p-2 flex-shrink-0`}>
                                <Icon className={`h-6 w-6 ${c.textStyle}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentsPage() {
    const location = useLocation();
    const navigate  = useNavigate();

    // ── Shared meta-data ───────────────────────────────────────────────────
    const [regions,      setRegions]      = useState<Region[]>([]);
    const [districts,    setDistricts]    = useState<District[]>([]);
    const [schools,      setSchools]      = useState<SchoolItem[]>([]);
    const [academicYears,setAcademicYears]= useState<AcademicYear[]>([]);
    const [classLevels,  setClassLevels]  = useState<ClassLevel[]>([]);
    const [examinations, setExaminations] = useState<Examination[]>([]);
    const [metaLoading,  setMetaLoading]  = useState(true);
    const [globalStats, setGlobalStats] = useState<StudentStats>({
        total: 0,
        male: 0,
        female: 0,
        active: 0,
        transferred: 0,
        completed: 0,
    });

    // ── Active tab ─────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabId>('all');

    // ── Global notification ────────────────────────────────────────────────
    const [toast, setToast] = useState<{ type: 'success'|'error'; msg: string } | null>(null);

    const token   = localStorage.getItem('token') ?? '';
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchGlobalStats = useCallback(() => {
        fetch('/api/v1/students/stats', {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((statsData) => {
                if (typeof statsData?.total === 'number') {
                    setGlobalStats({
                        total: statsData.total ?? 0,
                        male: statsData.male ?? 0,
                        female: statsData.female ?? 0,
                        active: statsData.active ?? 0,
                        transferred: statsData.transferred ?? 0,
                        completed: statsData.completed ?? 0,
                        perSchool: statsData.perSchool ?? statsData.per_school ?? [],
                    });
                }
            })
            .catch(() => {
                // Keep default stats when stats request fails.
            });
    }, [token]);

    // ── Sync tab with URL ──────────────────────────────────────────────────
    useEffect(() => {
        const path = location.pathname;
        const matched = TABS.find(t => t.path === path);
        setActiveTab(matched?.id ?? 'all');
    }, [location.pathname]);

    // ── Load meta-data (regions, districts, schools, years, classes, exams) ─
    useEffect(() => {
        setMetaLoading(true);
        Promise.all([
            fetch('/api/v1/regions',       { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/districts',      { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/schools',        { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/academic-years', { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/class-levels',   { headers }).then(r => r.json()).catch(() => []),
            fetch('/api/v1/examinations',   { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        ]).then(([reg, dis, sch, years, cls, exams]) => {
            setRegions(     Array.isArray(reg)   ? reg   : reg.data   ?? []);
            setDistricts(   Array.isArray(dis)   ? dis   : dis.data   ?? []);
            setSchools(     Array.isArray(sch)   ? sch   : sch.data   ?? []);
            setAcademicYears(Array.isArray(years)? years : years.data ?? []);
            setClassLevels( Array.isArray(cls)   ? cls   : cls.data   ?? []);
            setExaminations(Array.isArray(exams) ? exams : exams.data ?? []);
        }).finally(() => setMetaLoading(false));

        fetchGlobalStats();
    }, [fetchGlobalStats]);

    const goTo = (tab: TabId, path: string) => {
        setActiveTab(tab);
        navigate(path);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-full flex-col space-y-5">
            {/* ── Page Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#0F4C81]">
                        Students Management
                    </h1>
                    <p className="mt-0.5 text-sm text-slate-500">
                        Manage student records, registrations, promotions, and transfers across all regions.
                    </p>
                </div>
                {activeTab === 'all' && (
                    <button
                        onClick={() => goTo('register', '/students/register')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#0c3c66] active:scale-95"
                    >
                        <Plus className="h-4 w-4" />
                        Register Student
                    </button>
                )}
            </div>

            {/* ── Stats Cards ── */}
            <StatsCards stats={globalStats} />



            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed right-4 top-4 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-xl transition-all ${
                    toast.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
                </div>
            )}

            {/* ── Tab Content ── */}
            <div className="min-h-[500px]">
                {metaLoading && (activeTab !== 'all') ? (
                    <div className="flex h-64 items-center justify-center">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'all'           && <TabAllStudents     headers={headers} regions={regions} districts={districts} schools={schools} academicYears={academicYears} classLevels={classLevels} onToast={showToast} token={token} />}
                        {activeTab === 'register'      && <TabRegisterStudent  headers={headers} regions={regions} districts={districts} schools={schools} academicYears={academicYears} classLevels={classLevels} onToast={showToast} onSuccess={() => goTo('all', '/students')} />}
                        {activeTab === 'import'        && <TabBulkImport       headers={headers} regions={regions} districts={districts} schools={schools} academicYears={academicYears} classLevels={classLevels} onToast={showToast} token={token} />}
                        {activeTab === 'subjects'      && <SubjectRegistrationPage />}
                        {activeTab === 'candidate_reg' && <TabCandidateReg     headers={headers} schools={schools} examinations={examinations} classLevels={classLevels} regions={regions} districts={districts} onToast={showToast} />}
                        {activeTab === 'promotions'    && <TabPromotions       headers={headers} regions={regions} districts={districts} schools={schools} academicYears={academicYears} classLevels={classLevels} onToast={showToast} />}
                        {activeTab === 'transfers'     && <TabTransfers        headers={headers} regions={regions} districts={districts} schools={schools} onToast={showToast} />}
                        {activeTab === 'duplicates'    && <TabDuplicates       headers={headers} regions={regions} districts={districts} schools={schools} onToast={showToast} />}
                        {activeTab === 'performance'   && <TabPerformance      headers={headers} />}
                    </>
                )}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 1 — ALL STUDENTS
// ═════════════════════════════════════════════════════════════════════════════
function TabAllStudents({ headers, regions, districts, schools, academicYears, classLevels, onToast, token }: any) {
    const [students,  setStudents]  = useState<StudentRecord[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [search,    setSearch]    = useState('');
    const [filterRegion,   setFilterRegion]   = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterSchool,   setFilterSchool]   = useState('');
    const [filterYear,     setFilterYear]     = useState('');
    const [filterClass,    setFilterClass]    = useState('');
    const [filterGender,   setFilterGender]   = useState('');
    const [filterStatus,   setFilterStatus]   = useState('');
    const [page, setPage]     = useState(1);
    const [meta, setMeta]     = useState<any>(null);
    const [editStudent, setEditStudent] = useState<StudentRecord | null>(null);
    const [deleteId,    setDeleteId]    = useState<string | null>(null);
    const [saving,      setSaving]      = useState(false);
    const [exporting,   setExporting]   = useState(false);

    const buildParams = useCallback(() => {
        const p: Record<string, string> = { per_page: '20', page: String(page) };
        if (search)         p.search               = search;
        if (filterRegion)   p.region_id            = filterRegion;
        if (filterDistrict) p.district_id          = filterDistrict;
        if (filterSchool)   p.school_id            = filterSchool;
        if (filterYear)     p.academic_year_id     = filterYear;
        if (filterClass)    p.current_class_level_id = filterClass;
        if (filterGender)   p.gender               = filterGender;
        if (filterStatus)   p.status               = filterStatus;
        return new URLSearchParams(p).toString();
    }, [search, filterRegion, filterDistrict, filterSchool, filterYear, filterClass, filterGender, filterStatus, page]);

    const fetchStudents = useCallback(() => {
        setLoading(true);
        fetch(`/api/v1/students?${buildParams()}`, { headers })
            .then(r => r.json())
            .then((data) => {
                setStudents(data.data ?? []);
                setMeta(data.meta ?? null);
            })
            .catch(() => onToast('error', 'Failed to load student data.'))
            .finally(() => setLoading(false));
    }, [buildParams]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/students/${deleteId}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error((await res.json()).message);
            onToast('success', 'Student deleted successfully.');
            setDeleteId(null);
            fetchStudents();
        } catch (e: any) { onToast('error', e.message); }
        finally { setSaving(false); }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editStudent) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/students/${editStudent.id}`, {
                method: 'PUT', headers,
                body: JSON.stringify({
                    first_name: editStudent.first_name,
                    middle_name: editStudent.middle_name,
                    last_name: editStudent.last_name,
                    gender: editStudent.gender,
                    date_of_birth: editStudent.date_of_birth,
                    parent_name: editStudent.parent_name,
                    parent_phone: editStudent.parent_phone,
                    status: editStudent.status,
                }),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            onToast('success', 'Student updated successfully.');
            setEditStudent(null);
            fetchStudents();
        } catch (e: any) { onToast('error', e.message); }
        finally { setSaving(false); }
    };

    const handleExport = async (format: 'csv') => {
        setExporting(true);
        try {
            const p = new URLSearchParams();
            if (filterRegion)   p.set('region_id', filterRegion);
            if (filterDistrict) p.set('district_id', filterDistrict);
            if (filterSchool)   p.set('school_id', filterSchool);
            if (filterYear)     p.set('academic_year_id', filterYear);
            if (filterClass)    p.set('current_class_level_id', filterClass);
            if (filterGender)   p.set('gender', filterGender);
            if (filterStatus)   p.set('status', filterStatus);
            const res = await fetch(`/api/v1/students/export?${p.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            onToast('success', 'Export downloaded successfully.');
        } catch (e: any) { onToast('error', e.message); }
        finally { setExporting(false); }
    };

    return (
        <div className="space-y-5">
            {/* Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Filter className="h-4 w-4" /> Filters
                    </div>
                    <button onClick={() => { setFilterRegion(''); setFilterDistrict(''); setFilterSchool(''); setFilterYear(''); setFilterClass(''); setFilterGender(''); setFilterStatus(''); setSearch(''); setPage(1); }}
                        className="text-xs text-[#0F4C81] underline hover:no-underline">
                        Reset All
                    </button>
                </div>
                <LocationSelector
                    regions={regions} districts={districts} schools={schools}
                    selectedRegion={filterRegion}   onRegion={v  => { setFilterRegion(v);   setFilterDistrict(''); setFilterSchool(''); setPage(1); }}
                    selectedDistrict={filterDistrict} onDistrict={v => { setFilterDistrict(v); setFilterSchool(''); setPage(1); }}
                    selectedSchool={filterSchool}   onSchool={v  => { setFilterSchool(v);   setPage(1); }}
                />
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SearchableSelect
                        value={filterYear}
                        onValueChange={(value) => { setFilterYear(value); setPage(1); }}
                        placeholder="All Years"
                        searchPlaceholder="Search year..."
                        options={academicYears.map((y: AcademicYear) => ({ value: y.id, label: y.name }))}
                    />
                    <SearchableSelect
                        value={filterClass}
                        onValueChange={(value) => { setFilterClass(value); setPage(1); }}
                        placeholder="All Classes"
                        searchPlaceholder="Search class..."
                        options={classLevels.map((c: ClassLevel) => ({ value: c.id, label: c.name }))}
                    />
                    <SearchableSelect
                        value={filterGender}
                        onValueChange={(value) => { setFilterGender(value); setPage(1); }}
                        placeholder="All Genders"
                        searchPlaceholder="Search gender..."
                        options={[
                            { value: 'M', label: 'Male' },
                            { value: 'F', label: 'Female' },
                        ]}
                    />
                    <SearchableSelect
                        value={filterStatus}
                        onValueChange={(value) => { setFilterStatus(value); setPage(1); }}
                        placeholder="All Statuses"
                        searchPlaceholder="Search status..."
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'transferred', label: 'Transferred' },
                            { value: 'completed', label: 'Completed' },
                        ]}
                    />
                </div>
                <div className="mt-3 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name or reg# e.g. S0101/0001"
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-[#0F4C81] focus:outline-none focus:ring-1 focus:ring-[#0F4C81]"
                        />
                    </div>
                    <button onClick={fetchStudents} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleExport('csv')} disabled={exporting}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50">
                        {exporting ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
                ) : students.length === 0 ? (
                    <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
                        <Users2 className="h-12 w-12 opacity-30" />
                        <p className="text-sm font-medium">No students found</p>
                        <p className="text-xs">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="idems-table-wrap rounded-none border-0 shadow-none">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Reg Number', 'Full Name', 'Gender', 'Class', 'School', 'District', 'Region', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map(s => (
                                    <tr key={s.id} className="group transition hover:bg-slate-50">
                                        <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-700">{s.registration_number}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-slate-900">{s.first_name} {s.middle_name ? s.middle_name + ' ' : ''}{s.last_name}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${s.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {s.gender}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{resolveStudentClassLevel(s)?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[160px] truncate">{s.school?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-500">{s.school?.district?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-sm text-slate-500">{s.school?.district?.region?.name ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <Badge label={s.status ?? 'active'} variant={(s.status as any) ?? 'active'} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                                <button onClick={() => setEditStudent(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-[#0F4C81]/10 hover:text-[#0F4C81]">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => setDeleteId(s.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
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
                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                        <p className="text-xs text-slate-500">
                            Showing {meta.from}–{meta.to} of {meta.total.toLocaleString()} students
                        </p>
                        <div className="flex gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50">
                                Previous
                            </button>
                            <button disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Edit Student</h2>
                            <button onClick={() => setEditStudent(null)} className="rounded-xl p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {(['first_name', 'middle_name', 'last_name', 'parent_name', 'parent_phone'] as const).map(field => (
                                    <div key={field} className={field === 'parent_phone' ? 'col-span-2' : ''}>
                                        <label className="mb-1 block text-xs font-semibold text-slate-600 capitalize">{field.replace('_', ' ')}</label>
                                        <input
                                            value={(editStudent as any)[field] ?? ''}
                                            onChange={e => setEditStudent({ ...editStudent, [field]: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0F4C81] focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Gender</label>
                                    <SearchableSelect
                                        value={editStudent.gender}
                                        onValueChange={(value) => setEditStudent({ ...editStudent, gender: value as 'M' | 'F' })}
                                        placeholder="Select Gender"
                                        searchPlaceholder="Search gender..."
                                        options={[
                                            { value: 'M', label: 'Male' },
                                            { value: 'F', label: 'Female' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
                                    <SearchableSelect
                                        value={editStudent.status ?? 'active'}
                                        onValueChange={(value) => setEditStudent({ ...editStudent, status: value })}
                                        placeholder="Select Status"
                                        searchPlaceholder="Search status..."
                                        options={[
                                            { value: 'active', label: 'Active' },
                                            { value: 'transferred', label: 'Transferred' },
                                            { value: 'completed', label: 'Completed' },
                                        ]}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditStudent(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c3c66] disabled:opacity-50">
                                    {saving && <Spinner size="sm" />} Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Delete Student?</h2>
                        <p className="mt-1 text-sm text-slate-500">This action cannot be undone. The student record will be soft-deleted.</p>
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleDelete} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                                {saving && <Spinner size="sm" />} Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 2 — REGISTER STUDENT
// ═════════════════════════════════════════════════════════════════════════════
function TabRegisterStudent({ headers, regions, districts, schools, academicYears, classLevels, onToast, onSuccess }: any) {
    const [form, setForm]   = useState({ ...EMPTY_FORM });
    const [registrationSuffix, setRegistrationSuffix] = useState('');
    const [saving, setSaving] = useState(false);
    const [error,  setError]  = useState('');
    const [registrationCheck, setRegistrationCheck] = useState<{ state: 'idle' | 'checking' | 'available' | 'taken' | 'error'; message: string }>({ state: 'idle', message: '' });
    const [phoneCheck, setPhoneCheck] = useState<{ state: 'idle' | 'checking' | 'available' | 'taken' | 'error'; message: string }>({ state: 'idle', message: '' });

    const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));
    const selectedSchool = schools.find((school: SchoolItem) => school.id === form.school_id);
    const registrationPrefix = selectedSchool?.registration_number?.trim()
        ? `${selectedSchool.registration_number.trim()}`
        : '';
    const displaySuffix = registrationSuffix.replace(/\D+/g, '').slice(0, 4);
    const previewRegistrationNumber = registrationPrefix
        ? `${registrationPrefix}/${(displaySuffix || '0001').padStart(4, '0')}`
        : 'Select school first';

    const handleRegistrationSuffixChange = (value: string) => {
        const normalized = value.replace(/\D+/g, '').slice(0, 4);
        setRegistrationSuffix(normalized);
        set('registration_number', normalized ? `${registrationPrefix}/${normalized.padStart(4, '0')}` : '');
    };

    useEffect(() => {
        setRegistrationCheck({ state: 'idle', message: '' });
    }, [registrationPrefix, form.current_class_level_id, form.academic_year_id]);

    useEffect(() => {
        const suffix = displaySuffix;

        if (!form.school_id || !form.current_class_level_id || !form.academic_year_id || !registrationPrefix || !suffix) {
            setRegistrationCheck({ state: 'idle', message: '' });
            return;
        }

        if (suffix.length < 4) {
            setRegistrationCheck({ state: 'idle', message: 'Type 4 digits to check availability.' });
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setRegistrationCheck({ state: 'checking', message: 'Checking registration number...' });
            try {
                const params = new URLSearchParams({
                    school_id: form.school_id,
                    academic_year_id: form.academic_year_id,
                    current_class_level_id: form.current_class_level_id,
                    registration_suffix: suffix,
                });

                const res = await fetch(`/api/v1/students/validate?${params.toString()}`, {
                    headers,
                    signal: controller.signal,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message ?? 'Registration validation failed.');

                const result = data.registration_number;
                setRegistrationCheck(
                    result?.exists
                        ? { state: 'taken', message: result.message ?? 'This registration number already exists.' }
                        : { state: 'available', message: result.message ?? 'This registration number is available.' },
                );
            } catch (e: any) {
                if (e.name === 'AbortError') return;
                setRegistrationCheck({ state: 'error', message: e.message ?? 'Could not validate registration number.' });
            }
        }, 400);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [displaySuffix, form.school_id, form.current_class_level_id, form.academic_year_id, headers, registrationPrefix]);

    useEffect(() => {
        const phone = form.parent_phone.replace(/\D+/g, '');

        if (!form.school_id || !phone) {
            setPhoneCheck({ state: 'idle', message: '' });
            return;
        }

        if (phone.length < 9) {
            setPhoneCheck({ state: 'idle', message: 'Keep typing the phone number to check it live.' });
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setPhoneCheck({ state: 'checking', message: 'Checking phone number...' });
            try {
                const params = new URLSearchParams({
                    school_id: form.school_id || '',
                    parent_phone: phone,
                });

                const res = await fetch(`/api/v1/students/validate?${params.toString()}`, {
                    headers,
                    signal: controller.signal,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message ?? 'Phone validation failed.');

                const result = data.parent_phone;
                setPhoneCheck(
                    result?.exists
                        ? { state: 'taken', message: result.message ?? 'This phone number already exists.' }
                        : { state: 'available', message: result.message ?? 'This phone number is available.' },
                );
            } catch (e: any) {
                if (e.name === 'AbortError') return;
                setPhoneCheck({ state: 'error', message: e.message ?? 'Could not validate phone number.' });
            }
        }, 400);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [form.parent_phone, form.school_id, headers]);

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setRegistrationSuffix('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.school_id)              { setError('Please select a school.'); return; }
        if (!form.academic_year_id)       { setError('Please select an academic year.'); return; }
        if (!form.current_class_level_id) { setError('Please select a class level.'); return; }
        if (!registrationPrefix)          { setError('Please select a school first.'); return; }
        if (!displaySuffix)               { setError('Please enter the student registration suffix.'); return; }
        if (registrationCheck.state === 'taken') { setError(registrationCheck.message || 'Registration number already exists.'); return; }

        setSaving(true);
        try {
            const registration_number = `${registrationPrefix}/${displaySuffix.padStart(4, '0')}`;
            const res = await fetch('/api/v1/students', {
                method: 'POST', headers,
                body: JSON.stringify({
                    school_id:              form.school_id,
                    academic_year_id:       form.academic_year_id,
                    current_class_level_id: form.current_class_level_id,
                    registration_number,
                    registration_suffix:    displaySuffix,
                    first_name:             form.first_name,
                    middle_name:            form.middle_name || null,
                    last_name:              form.last_name,
                    gender:                 form.gender,
                    date_of_birth:          form.date_of_birth || null,
                    parent_name:            form.parent_name || null,
                    parent_phone:           form.parent_phone,
                    status:                 'active',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message ?? 'Registration failed.');
            onToast('success', `Student ${form.first_name} ${form.last_name} registered successfully.`);
            resetForm();
            onSuccess();
        } catch (e: any) { setError(e.message); }
        finally { setSaving(false); }
    };

    const [selRegion,   setSelRegion]   = useState('');
    const [selDistrict, setSelDistrict] = useState('');

    return (
        <div className="mx-auto max-w-2xl">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                    <h2 className="flex items-center gap-2 text-lg font-black text-[#0F4C81]">
                        <UserPlus className="h-5 w-5" /> Register New Student
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">Fill all required fields (*) to register a new student.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5 p-6">
                    {error && <Alert type="error" message={error} />}

                    {/* Location Selection */}
                    <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">School Placement</h3>
                        <LocationSelector
                            regions={regions} districts={districts} schools={schools}
                            selectedRegion={selRegion}     onRegion={v => { setSelRegion(v); setSelDistrict(''); set('school_id', ''); set('registration_number', ''); setRegistrationSuffix(''); }}
                            selectedDistrict={selDistrict} onDistrict={v => { setSelDistrict(v); set('school_id', ''); set('registration_number', ''); setRegistrationSuffix(''); }}
                            selectedSchool={form.school_id} onSchool={v => { set('school_id', v); set('registration_number', ''); setRegistrationSuffix(''); }}
                            required
                        />
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Academic Year *</label>
                                <SearchableSelect
                                    value={form.academic_year_id}
                                    onValueChange={(value) => set('academic_year_id', value)}
                                    placeholder="Select Academic Year"
                                    searchPlaceholder="Search academic year..."
                                    options={academicYears.map((y: AcademicYear) => ({ value: y.id, label: `${y.name}${y.is_active ? ' (Active)' : ''}` }))}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Class Level *</label>
                                <SearchableSelect
                                    value={form.current_class_level_id}
                                    onValueChange={(value) => { set('current_class_level_id', value); set('registration_number', ''); setRegistrationSuffix(''); }}
                                    placeholder="Select Class Level"
                                    searchPlaceholder="Search class level..."
                                    options={classLevels.map((c: ClassLevel) => ({ value: c.id, label: c.name }))}
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Student Information */}
                    <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Student Information</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Registration Number *</label>
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-[#0F4C81]">
                                        <div className="flex items-center">
                                        <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-600">
                                            {registrationPrefix || 'Select school'}
                                        </span>
                                        <input
                                            value={displaySuffix}
                                            onChange={e => handleRegistrationSuffixChange(e.target.value)}
                                            required
                                            disabled={!registrationPrefix}
                                            inputMode="numeric"
                                            maxLength={4}
                                            placeholder={registrationPrefix ? '0001' : 'Select school first'}
                                            className="w-full border-0 px-3 py-2.5 text-sm outline-none focus:ring-0 disabled:bg-slate-50"
                                        />
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">Preview: <span className="font-mono font-semibold text-slate-700">{previewRegistrationNumber}</span></p>
                                    {registrationCheck.message && (
                                        <p className={`mt-1 text-xs font-medium ${
                                            registrationCheck.state === 'taken' ? 'text-red-600' :
                                            registrationCheck.state === 'available' ? 'text-emerald-600' :
                                            registrationCheck.state === 'checking' ? 'text-slate-500' :
                                            registrationCheck.state === 'error' ? 'text-amber-600' : 'text-slate-500'
                                        }`}>
                                            {registrationCheck.message}
                                        </p>
                                    )}
                                </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Gender *</label>
                                <SearchableSelect
                                    value={form.gender}
                                    onValueChange={(value) => set('gender', value)}
                                    placeholder="Select Gender"
                                    searchPlaceholder="Search gender..."
                                    options={[
                                        { value: 'M', label: 'Male' },
                                        { value: 'F', label: 'Female' },
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">First Name *</label>
                                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required
                                    placeholder="First name"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Middle Name</label>
                                <input value={form.middle_name} onChange={e => set('middle_name', e.target.value)}
                                    placeholder="Middle name (optional)"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Last Name *</label>
                                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required
                                    placeholder="Last name"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Date of Birth</label>
                                <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Parent Information */}
                    <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Parent / Guardian Information</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Parent Name</label>
                                <input value={form.parent_name} onChange={e => set('parent_name', e.target.value)}
                                    placeholder="Parent / guardian name"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Parent Phone *</label>
                                <input value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} required inputMode="tel"
                                    placeholder="0712345678"
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#0F4C81] focus:outline-none" />
                                {phoneCheck.message && (
                                    <p className={`mt-1 text-xs font-medium ${
                                        phoneCheck.state === 'taken' ? 'text-red-600' :
                                        phoneCheck.state === 'available' ? 'text-emerald-600' :
                                        phoneCheck.state === 'checking' ? 'text-slate-500' :
                                        phoneCheck.state === 'error' ? 'text-amber-600' : 'text-slate-500'
                                    }`}>
                                        {phoneCheck.message}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={resetForm}
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            Reset
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#0c3c66] disabled:opacity-50">
                            {saving ? <Spinner size="sm" /> : <UserPlus className="h-4 w-4" />}
                            Register Student
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 3 — BULK IMPORT
// ═════════════════════════════════════════════════════════════════════════════
function TabBulkImport({ headers, regions, districts, schools, academicYears, classLevels, onToast, token }: any) {
    const [step,          setStep]          = useState<1|2|3|4>(1);
    const [selRegion,     setSelRegion]     = useState('');
    const [selDistrict,   setSelDistrict]   = useState('');
    const [selSchool,     setSelSchool]     = useState('');
    const [selYear,       setSelYear]       = useState('');
    const [selClass,      setSelClass]      = useState('');
    const [file,          setFile]          = useState<File | null>(null);
    const [preview,       setPreview]       = useState<any | null>(null);
    const [uploading,     setUploading]     = useState(false);
    const [importing,     setImporting]     = useState(false);
    const [downloadingTpl, setDownloadingTpl] = useState(false);
    const [dragOver,      setDragOver]      = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = async () => {
        setDownloadingTpl(true);
        try {
            const params = new URLSearchParams();
            if (selSchool) params.set('school_id', selSchool);
            if (selYear) params.set('academic_year_id', selYear);
            if (selClass) params.set('current_class_level_id', selClass);
            const query = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`/api/v1/students/template${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `IDEMS_Student_Import_Template_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
            onToast('success', 'Excel template downloaded. Fill it and return to import.');
        } catch { onToast('error', 'Failed to download template.'); }
        finally { setDownloadingTpl(false); }
    };

    const handleFileSelect = (selected: File) => {
        const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'text/plain'];
        const ext     = selected.name.split('.').pop()?.toLowerCase();
        if (!allowed.includes(selected.type) && !['csv', 'xlsx', 'xls'].includes(ext ?? '')) {
            onToast('error', 'Only Excel or CSV files are allowed.'); return;
        }
        setFile(selected);
        setPreview(null);
    };

    const handleUploadPreview = async () => {
        if (!file || !selSchool || !selYear || !selClass) {
            onToast('error', 'Please select school, academic year, class level and a file.'); return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file',                    file);
            fd.append('school_id',               selSchool);
            fd.append('academic_year_id',        selYear);
            fd.append('current_class_level_id',  selClass);
            const res  = await fetch('/api/v1/students/import-file', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPreview(data);
            setStep(4);
        } catch (e: any) { onToast('error', e.message); }
        finally { setUploading(false); }
    };

    const handleConfirmImport = async () => {
        if (!file || !preview || !selSchool) return;
        setImporting(true);
        try {
            const fd = new FormData();
            fd.append('file',                   file);
            fd.append('school_id',              selSchool);
            fd.append('academic_year_id',       selYear);
            fd.append('current_class_level_id', selClass);
            fd.append('confirm',                '1');
            const res  = await fetch('/api/v1/students/import-file', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            onToast('success', data.message ?? 'Import completed successfully.');
            setStep(1); setFile(null); setPreview(null); setSelSchool(''); setSelYear(''); setSelClass('');
        } catch (e: any) { onToast('error', e.message); }
        finally { setImporting(false); }
    };

    const stepLabels = ['1. Select Scope', '2. Download Template', '3. Upload File', '4. Preview & Import'];

    return (
        <div className="space-y-5">
            {/* Stepper */}
            <div className="flex items-center gap-2">
                {stepLabels.map((label, i) => {
                    const n = i + 1;
                    const done   = step > n;
                    const active = step === n;
                    return (
                        <React.Fragment key={n}>
                            <div className="flex items-center gap-2">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                                    done ? 'bg-emerald-500 text-white' : active ? 'bg-[#0F4C81] text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {done ? <Check className="h-3.5 w-3.5" /> : n}
                                </div>
                                <span className={`hidden text-xs font-semibold sm:block ${active ? 'text-[#0F4C81]' : done ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
                            </div>
                            {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 ${step > n ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step 1: Select Scope */}
            {step === 1 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                        <MapPin className="h-4 w-4 text-[#0F4C81]" /> Step 1: Select Import Scope
                    </h3>
                    <LocationSelector
                        regions={regions} districts={districts} schools={schools}
                        selectedRegion={selRegion}     onRegion={v  => { setSelRegion(v);   setSelDistrict(''); setSelSchool(''); }}
                        selectedDistrict={selDistrict} onDistrict={v => { setSelDistrict(v); setSelSchool(''); }}
                        selectedSchool={selSchool}     onSchool={v  => setSelSchool(v)}
                        required
                    />
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Academic Year *</label>
                            <SearchableSelect
                                value={selYear}
                                onValueChange={setSelYear}
                                placeholder="Select Academic Year"
                                searchPlaceholder="Search academic year..."
                                options={academicYears.map((y: AcademicYear) => ({ value: y.id, label: `${y.name}${y.is_active ? ' (Active)' : ''}` }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-600">Class Level *</label>
                            <SearchableSelect
                                value={selClass}
                                onValueChange={setSelClass}
                                placeholder="Select Class Level"
                                searchPlaceholder="Search class level..."
                                options={classLevels.map((c: ClassLevel) => ({ value: c.id, label: c.name }))}
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={() => { if (!selSchool || !selYear || !selClass) { onToast('error', 'Select school, year & class first.'); return; } setStep(2); }}
                            className="rounded-xl bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66]">
                            Continue →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Download Template */}
            {step === 2 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900">
                        <FileDown className="h-4 w-4 text-[#0F4C81]" /> Step 2: Download Official Template
                    </h3>
                    <Alert type="info" message="Download the official IDEMS Excel template below. Do NOT add or remove columns. Only fill the unlocked cells." />
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Current scope:</span>{' '}
                        {selSchool ? 'School selected' : 'No school'} · {selYear ? 'Academic year selected' : 'No academic year'} · {selClass ? 'Class level selected' : 'No class level'}
                        <div className="mt-1 text-[11px] text-slate-500">
                            Student_reg is scoped to the selected school, class and academic year. The same suffix can repeat in different classes, but not within the same school/class/year combination.
                        </div>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <div className="border-b border-slate-200 bg-white px-4 py-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Template Structure</p>
                        </div>
                        <div className="overflow-x-auto p-4 scrollbar-hover">
                            <table className="min-w-full text-xs">
                                <thead>
                                    <tr>
                                        {['School_reg (Leave blank)', 'Student_reg *', 'first_name *', 'middle_name', 'last_name *', 'gender * (M/F)', 'date_of_birth (YYYY-MM-DD)', 'parent_name', 'parent_phone *'].map(h => (
                                            <th key={h} className={`whitespace-nowrap rounded px-3 py-1.5 text-left font-bold ${h.includes('*') ? 'bg-[#0F4C81]/10 text-[#0F4C81]' : 'bg-slate-200 text-slate-600'}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[ 
                                        ['P0106', '0001', 'Amina', 'Juma', 'Hassan', 'F', '2009-04-10', 'Juma Hassan', '0712345678'],
                                        ['P0106', '0002', 'John',  '',    'Mwalimu','M', '2008-11-22', 'Peter Mwalimu','0756789012'],
                                    ].map((row, ri) => (
                                        <tr key={ri} className="border-t border-slate-100">
                                            {row.map((cell, ci) => (
                                                <td key={ci} className="px-3 py-1.5 text-slate-600">{cell || <span className="text-slate-300 italic">blank</span>}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button onClick={() => setStep(1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</button>
                        <button onClick={handleDownloadTemplate} disabled={downloadingTpl}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50">
                            {downloadingTpl ? <Spinner size="sm" /> : <Download className="h-4 w-4" />}
                            Download IDEMS Template (XLSX)
                        </button>
                        <button onClick={() => setStep(3)} className="rounded-xl bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66]">
                            Already have file → Continue
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Upload File */}
            {step === 3 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                        <Upload className="h-4 w-4 text-[#0F4C81]" /> Step 3: Upload Filled Template
                    </h3>
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
                        onClick={() => fileRef.current?.click()}
                        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
                            dragOver ? 'border-[#0F4C81] bg-blue-50' : file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-[#0F4C81] hover:bg-slate-50'
                        }`}
                    >
                        <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB — Click to change file</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <FileSpreadsheet className="h-10 w-10 opacity-40" />
                                <p className="text-sm font-semibold">Click or drag & drop your filled template here</p>
                                <p className="text-xs">Supported formats: CSV, XLSX, XLS — Max 10MB</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button onClick={() => setStep(2)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</button>
                        <button onClick={handleUploadPreview} disabled={!file || uploading}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F4C81] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] disabled:opacity-50">
                            {uploading ? <><Spinner size="sm" /> Validating...</> : <>Preview Import →</>}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Preview & Confirm */}
            {step === 4 && preview && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                            <Eye className="h-4 w-4 text-[#0F4C81]" /> Step 4: Preview Import
                        </h3>
                        <div className="mt-2 flex gap-4 text-sm">
                            <span className="font-semibold text-slate-700">Total: <span className="text-slate-900">{preview.total}</span></span>
                            <span className="font-semibold text-emerald-600">✓ Valid: {preview.valid}</span>
                            <span className="font-semibold text-red-600">✗ Errors: {preview.invalid}</span>
                        </div>
                    </div>
                    {preview.invalid_rows?.length > 0 && (
                        <div className="border-b border-slate-100 bg-red-50 px-6 py-3">
                            <p className="mb-2 text-xs font-bold uppercase text-red-600">Rows with Errors (will be skipped)</p>
                            <div className="space-y-1">
                                {preview.invalid_rows.slice(0, 5).map((r: ImportRow) => (
                                    <div key={r._row} className="text-xs text-red-700">
                                        Row {r._row} — {r.first_name} {r.last_name}: {r._errors?.join(', ')}
                                    </div>
                                ))}
                                {preview.invalid_rows.length > 5 && <p className="text-xs text-red-500">...and {preview.invalid_rows.length - 5} more rows with errors</p>}
                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto scrollbar-hover">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="bg-slate-50">
                                <tr>
                                    {['Row', 'School_reg', 'Student_reg', 'First Name', 'Middle', 'Last Name', 'Gender', 'DOB', 'Parent Phone', 'Valid'].map(h => (
                                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[...(preview.valid_rows ?? []), ...(preview.invalid_rows ?? [])].slice(0, 30).map((r: ImportRow) => (
                                    <tr key={r._row} className={r._valid ? 'bg-white' : 'bg-red-50'}>
                                        <td className="px-3 py-2 text-xs text-slate-400">{r._row}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{(r as any).registration_prefix}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{(r as any).registration_suffix}</td>
                                        <td className="px-3 py-2">{r.first_name}</td>
                                        <td className="px-3 py-2 text-slate-400">{r.middle_name ?? '—'}</td>
                                        <td className="px-3 py-2">{r.last_name}</td>
                                        <td className="px-3 py-2"><span className={`font-bold ${r.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>{r.gender}</span></td>
                                        <td className="px-3 py-2 text-xs text-slate-500">{r.date_of_birth ?? '—'}</td>
                                        <td className="px-3 py-2 text-xs">{r.parent_phone}</td>
                                        <td className="px-3 py-2">
                                            {r._valid
                                                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                : <div title={r._errors?.join(', ')}><AlertCircle className="h-4 w-4 text-red-500" /></div>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
                        <button onClick={() => { setStep(3); setPreview(null); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">← Back</button>
                        <button onClick={handleConfirmImport} disabled={importing || preview.valid === 0}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50">
                            {importing ? <><Spinner size="sm" /> Importing...</> : <>✓ Confirm Import {preview.valid} Valid Students</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 4 — CANDIDATE REGISTRATION
// ═════════════════════════════════════════════════════════════════════════════
function TabCandidateReg({ headers, schools, examinations, classLevels, regions, districts, onToast }: any) {
    const [selExam,     setSelExam]     = useState('');
    const [selRegion,   setSelRegion]   = useState('');
    const [selDistrict, setSelDistrict] = useState('');
    const [selSchool,   setSelSchool]   = useState('');
    const [selClass,    setSelClass]    = useState('');
    const [students,    setStudents]    = useState<Array<StudentRecord & { subject_count?: number; subject_registration_status?: string; subject_registration_message?: string; eligible?: boolean }>>([]);
    const [candidateMeta, setCandidateMeta] = useState<{ scope_count?: number; eligible_count?: number; eligible_before_exclusion?: number; registered_count?: number; excluded_as_registered?: number } | null>(null);
    const [selected,    setSelected]    = useState<string[]>([]);
    const [loading,     setLoading]     = useState(false);
    const [registering, setRegistering] = useState(false);

    const activeExams = examinations.filter((e: Examination) => ['draft','registration_open'].includes(e.status));

    useEffect(() => {
        const selectedExam = examinations.find((exam: Examination) => exam.id === selExam);
        const targetClassLevelId = selectedExam?.target_class_level_id
            || selectedExam?.targetClassLevel?.id
            || selectedExam?.classLevels?.[0]?.id
            || '';

        if (targetClassLevelId && targetClassLevelId !== selClass) {
            setSelClass(targetClassLevelId);
        }
    }, [examinations, selExam, selClass]);

    const fetchEligible = async () => {
        if (!selSchool || !selExam || !selClass) { onToast('error', 'Select examination, school and class level.'); return; }
        setLoading(true);
        try {
            setSelected([]);
            const p = new URLSearchParams({ school_id: selSchool, class_level_id: selClass });
            const res  = await fetch(`/api/v1/examinations/${selExam}/eligible-students?${p}`, { headers });
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.students ?? []);
            const meta = Array.isArray(data) ? null : (data.meta ?? null);
            setStudents(list);
            setCandidateMeta(meta);
            const eligibleCount = list.filter((student: any) => student.eligible).length;
            if (list.length === 0) {
                if ((meta?.scope_count ?? 0) === 0) {
                    onToast('info', 'No students were found in this school and class scope.');
                } else if ((meta?.eligible_before_exclusion ?? 0) > 0 && (meta?.eligible_count ?? 0) === 0) {
                    onToast('info', 'All eligible students in this scope are already registered for this exam.');
                } else {
                    onToast('info', 'No students have complete subject registration in this scope yet.');
                }
            } else if (eligibleCount === 0) {
                onToast('info', 'No students have complete subject registration in this scope yet.');
            }
        } catch { onToast('error', 'Failed to load students.'); }
        finally { setLoading(false); }
    };

    const toggleAll = () => {
        const eligibleIds = students.filter((student) => student.eligible !== false).map((student) => student.id);
        setSelected(selected.length === eligibleIds.length ? [] : eligibleIds);
    };

    const handleRegister = async () => {
        const eligibleSelected = students.filter(s => selected.includes(s.id) && s.eligible !== false).map(s => s.id);
        if (!selExam || eligibleSelected.length === 0) { onToast('error', 'Select an examination and at least one eligible student.'); return; }
        setRegistering(true);
        try {
            const res = await fetch(`/api/v1/examinations/${selExam}/registrations`, {
                method: 'POST', headers,
                body: JSON.stringify({ student_ids: eligibleSelected, class_level_id: selClass }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            onToast('success', data.message ?? `${eligibleSelected.length} candidates registered successfully.`);
            setSelected([]);
            fetchEligible();
        } catch (e: any) { onToast('error', e.message); }
        finally { setRegistering(false); }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                    <BadgeCheck className="h-4 w-4 text-[#0F4C81]" /> Register Candidates to Examination
                </h3>
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Select Examination *</label>
                        <SearchableSelect
                            value={selExam}
                            onValueChange={setSelExam}
                            placeholder="Choose Active Examination"
                            searchPlaceholder="Search examination..."
                            options={activeExams.map((e: Examination) => ({
                                value: e.id,
                                label: `${e.name} (${e.status})`,
                            }))}
                            className="mt-1"
                        />
                        {examinations.length === 0 && <p className="mt-1 text-xs text-amber-600">No examinations found. Create one in Examinations Management first.</p>}
                    </div>
                    <LocationSelector
                        regions={regions} districts={districts} schools={schools}
                        selectedRegion={selRegion}     onRegion={v  => { setSelRegion(v); setSelDistrict(''); setSelSchool(''); }}
                        selectedDistrict={selDistrict} onDistrict={v => { setSelDistrict(v); setSelSchool(''); }}
                        selectedSchool={selSchool}     onSchool={v  => setSelSchool(v)}
                    />
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Class Level *</label>
                        <SearchableSelect
                            value={selClass}
                            onValueChange={setSelClass}
                            placeholder="Select Class Level"
                            searchPlaceholder="Search class level..."
                            options={classLevels.map((c: ClassLevel) => ({ value: c.id, label: c.name }))}
                            className="mt-1"
                        />
                    </div>
                    <button onClick={fetchEligible} disabled={loading}
                        className="flex items-center gap-2 rounded-xl bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] disabled:opacity-50">
                        {loading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
                        Load Eligible Students
                    </button>
                </div>
            </div>

            {students.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <div className="text-sm font-semibold text-slate-700">
                            {students.length} students found — {selected.filter(id => students.find(s => s.id === id)?.eligible !== false).length} eligible selected
                        </div>
                        <div className="flex gap-2">
                            <button onClick={toggleAll} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                {selected.length === students.filter(s => s.eligible !== false).length ? 'Deselect All' : 'Select Eligible'}
                            </button>
                            <button onClick={handleRegister} disabled={selected.length === 0 || registering}
                                className="flex items-center gap-1.5 rounded-xl bg-[#0F4C81] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0c3c66] disabled:opacity-50">
                                {registering ? <Spinner size="sm" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                                Register {selected.length > 0 ? `(${selected.length})` : ''}
                            </button>
                        </div>
                    </div>
                    <div className="student-list-scroll max-h-[620px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-sm">
                            <thead className="sticky top-0 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2.5 w-10"><input type="checkbox" checked={selected.length === students.length} onChange={toggleAll} className="rounded" /></th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Reg#</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Name</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Gender</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">School</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Subjects</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {students.map(s => (
                                    <tr key={s.id} onClick={() => s.eligible === false ? undefined : setSelected(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                                        className={`transition ${s.eligible === false ? 'cursor-not-allowed bg-rose-50/60 opacity-80' : 'cursor-pointer hover:bg-slate-50'} ${selected.includes(s.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-4 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(s.id)}
                                                readOnly
                                                disabled={s.eligible === false}
                                                className="rounded disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{s.registration_number}</td>
                                        <td className="px-4 py-2.5 font-semibold text-slate-900">{s.first_name} {s.last_name}</td>
                                        <td className="px-4 py-2.5"><span className={`font-bold ${s.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>{s.gender}</span></td>
                                        <td className="px-4 py-2.5 text-slate-500">{s.school?.name}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="text-sm font-bold text-slate-900">{s.subject_count ?? 0}</div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${s.eligible === false ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {s.eligible === false ? 'Incomplete Subject Registration' : 'Eligible'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                        {candidateMeta?.eligible_before_exclusion && candidateMeta.eligible_count === 0
                            ? 'All eligible students are already registered for this exam.'
                            : 'Students with fewer than 8 subjects are shown for visibility but cannot be registered until subject registration is completed.'}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 5 — STUDENT PROMOTIONS
// ═════════════════════════════════════════════════════════════════════════════
function TabPromotions({ headers, regions, districts, schools, academicYears, classLevels, onToast }: any) {
    const [selRegion,    setSelRegion]    = useState('');
    const [selDistrict,  setSelDistrict]  = useState('');
    const [selSchool,    setSelSchool]    = useState('');
    const [fromYear,     setFromYear]     = useState('');
    const [fromClass,    setFromClass]    = useState('');
    const [toYear,       setToYear]       = useState('');
    const [toClass,      setToClass]      = useState('');
    const [students,     setStudents]     = useState<StudentRecord[]>([]);
    const [selected,     setSelected]     = useState<string[]>([]);
    const [loading,      setLoading]      = useState(false);
    const [promoting,    setPromoting]    = useState(false);

    const fetchStudents = async () => {
        if (!selSchool || !fromClass) { onToast('error', 'Select school and current class level.'); return; }
        setLoading(true);
        try {
            const p = new URLSearchParams({ school_id: selSchool, current_class_level_id: fromClass, per_page: '200' });
            if (fromYear) p.set('academic_year_id', fromYear);
            const res  = await fetch(`/api/v1/students?${p}`, { headers });
            const data = await res.json();
            setStudents(data.data ?? []);
        } catch { onToast('error', 'Failed to load students.'); }
        finally { setLoading(false); }
    };

    const handlePromote = async () => {
        if (selected.length === 0 || !toYear || !toClass) { onToast('error', 'Select students, target year and class.'); return; }
        setPromoting(true);
        let promoted = 0;
        try {
            for (const id of selected) {
                const res = await fetch(`/api/v1/students/${id}/promote`, {
                    method: 'POST', headers,
                    body: JSON.stringify({ academic_year_id: toYear, current_class_level_id: toClass }),
                });
                if (res.ok) promoted++;
            }
            onToast('success', `${promoted} students promoted successfully.`);
            setSelected([]); fetchStudents();
        } catch { onToast('error', 'Some promotions failed.'); }
        finally { setPromoting(false); }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                    <ArrowUpCircle className="h-4 w-4 text-[#0F4C81]" /> Student Promotions
                </h3>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Placement (From)</p>
                        <LocationSelector
                            regions={regions} districts={districts} schools={schools}
                            selectedRegion={selRegion}     onRegion={v => { setSelRegion(v); setSelDistrict(''); setSelSchool(''); }}
                            selectedDistrict={selDistrict} onDistrict={v => { setSelDistrict(v); setSelSchool(''); }}
                            selectedSchool={selSchool}     onSchool={v => setSelSchool(v)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Academic Year</label>
                                <SearchableSelect
                                    value={fromYear}
                                    onValueChange={setFromYear}
                                    placeholder="Any Year"
                                    searchPlaceholder="Search year..."
                                    options={academicYears.map((y: AcademicYear) => ({ value: y.id, label: y.name }))}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">Class Level *</label>
                                <SearchableSelect
                                    value={fromClass}
                                    onValueChange={setFromClass}
                                    placeholder="Select Class"
                                    searchPlaceholder="Search class..."
                                    options={classLevels.map((c: ClassLevel) => ({ value: c.id, label: c.name }))}
                                />
                            </div>
                        </div>
                        <button onClick={fetchStudents} disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-[#0F4C81] px-5 py-2 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] disabled:opacity-50">
                            {loading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />} Load Students
                        </button>
                    </div>
                    <div className="space-y-3 rounded-xl bg-emerald-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Promote To</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">New Academic Year *</label>
                                <SearchableSelect
                                    value={toYear}
                                    onValueChange={setToYear}
                                    placeholder="Select Year"
                                    searchPlaceholder="Search year..."
                                    options={academicYears.map((y: AcademicYear) => ({ value: y.id, label: `${y.name}${y.is_active ? ' (Active)' : ''}` }))}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-600">New Class Level *</label>
                                <SearchableSelect
                                    value={toClass}
                                    onValueChange={setToClass}
                                    placeholder="Select Class"
                                    searchPlaceholder="Search class..."
                                    options={classLevels.map((c: ClassLevel) => ({ value: c.id, label: c.name }))}
                                />
                            </div>
                        </div>
                        <button onClick={handlePromote} disabled={selected.length === 0 || !toYear || !toClass || promoting}
                            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-50">
                            {promoting ? <Spinner size="sm" /> : <ArrowUpCircle className="h-4 w-4" />}
                            Promote {selected.length > 0 ? `(${selected.length})` : ''} Selected
                        </button>
                    </div>
                </div>
            </div>

            {students.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                        <p className="text-sm font-semibold text-slate-700">{students.length} students found — {selected.length} selected</p>
                        <button onClick={() => setSelected(selected.length === students.length ? [] : students.map(s => s.id))}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            {selected.length === students.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2.5 w-10" />
                                {['Reg#', 'Name', 'Gender', 'Current Class', 'School'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(s => (
                                <tr key={s.id} onClick={() => setSelected(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])}
                                    className={`cursor-pointer hover:bg-slate-50 ${selected.includes(s.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-2.5"><input type="checkbox" checked={selected.includes(s.id)} readOnly className="rounded" /></td>
                                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{s.registration_number}</td>
                                    <td className="px-4 py-2.5 font-semibold text-slate-900">{s.first_name} {s.last_name}</td>
                                    <td className="px-4 py-2.5"><span className={`font-bold ${s.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>{s.gender}</span></td>
                                    <td className="px-4 py-2.5 text-slate-600">{resolveStudentClassLevel(s)?.name ?? '—'}</td>
                                    <td className="px-4 py-2.5 text-slate-500">{s.school?.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 6 — STUDENT TRANSFERS
// ═════════════════════════════════════════════════════════════════════════════
function TabTransfers({ headers, regions, districts, schools, onToast }: any) {
    const [search,       setSearch]       = useState('');
    const [searchResults,setSearchResults]= useState<StudentRecord[]>([]);
    const [searching,    setSearching]    = useState(false);
    const [selected,     setSelected]     = useState<StudentRecord | null>(null);
    const [toRegion,     setToRegion]     = useState('');
    const [toDistrict,   setToDistrict]   = useState('');
    const [toSchool,     setToSchool]     = useState('');
    const [reason,       setReason]       = useState('');
    const [transferring, setTransferring] = useState(false);

    const handleSearch = async () => {
        if (!search.trim()) return;
        setSearching(true);
        try {
            const res  = await fetch(`/api/v1/students?search=${encodeURIComponent(search)}&per_page=10`, { headers });
            const data = await res.json();
            setSearchResults(data.data ?? []);
        } catch { onToast('error', 'Search failed.'); }
        finally { setSearching(false); }
    };

    const handleTransfer = async () => {
        if (!selected || !toSchool) { onToast('error', 'Select a student and destination school.'); return; }
        setTransferring(true);
        try {
            const res = await fetch(`/api/v1/students/${selected.id}/transfer`, {
                method: 'POST', headers,
                body: JSON.stringify({ school_id: toSchool, reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            onToast('success', `${selected.first_name} ${selected.last_name} transferred successfully.`);
            setSelected(null); setToSchool(''); setReason(''); setSearch(''); setSearchResults([]);
        } catch (e: any) { onToast('error', e.message); }
        finally { setTransferring(false); }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                    <ArrowRightLeft className="h-4 w-4 text-[#0F4C81]" /> Student Transfer
                </h3>
                {/* Search student */}
                <div className="mb-4">
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Search Student *</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Search by name or reg# e.g. P0104/0001"
                                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-[#0F4C81] focus:outline-none" />
                        </div>
                        <button onClick={handleSearch} disabled={searching}
                            className="flex items-center gap-1.5 rounded-xl bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c3c66] disabled:opacity-50">
                            {searching ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
                        </button>
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            {searchResults.map(s => (
                                <button key={s.id} onClick={() => { setSelected(s); setSearchResults([]); setSearch(`${s.first_name} ${s.last_name}`); }}
                                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${selected?.id === s.id ? 'bg-blue-50' : ''}`}>
                                    <div>
                                        <span className="font-semibold text-slate-900">{s.first_name} {s.last_name}</span>
                                        <span className="ml-2 text-xs text-slate-500">{s.registration_display || s.registration_number}</span>
                                        <span className="ml-2 text-xs text-slate-400">| {resolveStudentClassLevel(s)?.name ?? '—'}</span>
                                        <span className="ml-2 text-xs text-slate-400">| {s.academicYear?.name ?? '—'}</span>
                                    </div>
                                    <span className="text-xs text-slate-400">{s.school?.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {selected && (
                    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs font-bold uppercase text-blue-600 mb-2">Selected Student</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-slate-500">Name:</span> <span className="font-semibold">{selected.first_name} {selected.last_name}</span></div>
                            <div><span className="text-slate-500">Reg#:</span> <span className="font-mono text-xs">{selected.registration_display || selected.registration_number}</span></div>
                            <div><span className="text-slate-500">Current School:</span> <span className="font-semibold">{selected.school?.name ?? '—'}</span></div>
                            <div><span className="text-slate-500">Class:</span> <span className="font-semibold">{resolveStudentClassLevel(selected)?.name ?? '—'}</span></div>
                            <div><span className="text-slate-500">Academic Year:</span> <span className="font-semibold">{selected.academicYear?.name ?? '—'}</span></div>
                        </div>
                    </div>
                )}

                {/* Destination */}
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Destination School</p>
                    <LocationSelector
                        regions={regions} districts={districts} schools={schools}
                        selectedRegion={toRegion}     onRegion={v  => { setToRegion(v); setToDistrict(''); setToSchool(''); }}
                        selectedDistrict={toDistrict} onDistrict={v => { setToDistrict(v); setToSchool(''); }}
                        selectedSchool={toSchool}     onSchool={v => setToSchool(v)}
                        required
                    />
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-600">Reason for Transfer</label>
                        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                            placeholder="Optional: state reason for transfer..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#0F4C81] focus:outline-none" />
                    </div>
                    <button onClick={handleTransfer} disabled={!selected || !toSchool || transferring}
                        className="flex items-center gap-2 rounded-xl bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] disabled:opacity-50">
                        {transferring ? <Spinner size="sm" /> : <ArrowRightLeft className="h-4 w-4" />}
                        Execute Transfer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 7 — DUPLICATE DETECTION
// ═════════════════════════════════════════════════════════════════════════════
function TabDuplicates({ headers, regions, districts, schools, onToast }: any) {
    const [selRegion,   setSelRegion]   = useState('');
    const [selDistrict, setSelDistrict] = useState('');
    const [selSchool,   setSelSchool]   = useState('');
    const [scanning,    setScanning]    = useState(false);
    const [results,     setResults]     = useState<{ total_duplicates: number; duplicates: DuplicateGroup[] } | null>(null);

    const handleScan = async () => {
        setScanning(true);
        try {
            const p = new URLSearchParams();
            if (selSchool)   p.set('school_id',   selSchool);
            if (selDistrict) p.set('district_id', selDistrict);
            const res  = await fetch(`/api/v1/students/duplicates?${p}`, { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setResults(data);
            if (data.total_duplicates === 0) onToast('success', 'No duplicates found! Records are clean.');
        } catch (e: any) { onToast('error', e.message); }
        finally { setScanning(false); }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-slate-900">
                    <Radar className="h-4 w-4 text-[#0F4C81]" /> Duplicate Detection Radar
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                    Scan for duplicate student registrations by: same Registration Number, same Name + Date of Birth, or same Name + Parent Phone.
                </p>
                <LocationSelector
                    regions={regions} districts={districts} schools={schools}
                    selectedRegion={selRegion}     onRegion={v  => { setSelRegion(v); setSelDistrict(''); setSelSchool(''); }}
                    selectedDistrict={selDistrict} onDistrict={v => { setSelDistrict(v); setSelSchool(''); }}
                    selectedSchool={selSchool}     onSchool={v => setSelSchool(v)}
                />
                <div className="mt-4 flex items-center gap-3">
                    <button onClick={handleScan} disabled={scanning}
                        className="flex items-center gap-2 rounded-xl bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66] disabled:opacity-50">
                        {scanning ? <><Spinner size="sm" /> Scanning...</> : <><Radar className="h-4 w-4" /> Run Duplicate Scan</>}
                    </button>
                    {results && (
                        <span className={`text-sm font-semibold ${results.total_duplicates > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {results.total_duplicates > 0 ? `⚠ ${results.total_duplicates} duplicate groups found` : '✓ No duplicates found'}
                        </span>
                    )}
                </div>
            </div>

            {results && results.duplicates.length > 0 && (
                <div className="space-y-3">
                    {results.duplicates.map((group, gi) => (
                        <div key={gi} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className={`flex items-center justify-between px-5 py-3 ${group.risk_level === 'high' ? 'bg-red-50' : 'bg-orange-50'}`}>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={`h-4 w-4 ${group.risk_level === 'high' ? 'text-red-500' : 'text-orange-500'}`} />
                                    <span className="text-sm font-bold text-slate-900">{group.label}</span>
                                    <Badge label={`${group.count} records`} variant={group.risk_level} />
                                </div>
                                <span className="text-xs uppercase font-bold text-slate-400">{group.type.replace(/_/g, ' ')}</span>
                            </div>
                            <table className="min-w-full divide-y divide-slate-100 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {['Reg#', 'Name', 'Gender', 'DOB', 'Parent Phone', 'School', 'Status'].map(h => (
                                            <th key={h} className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {group.students.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2 font-mono text-xs">{s.registration_number}</td>
                                            <td className="px-4 py-2 font-semibold text-slate-900">{s.first_name} {s.last_name}</td>
                                            <td className="px-4 py-2"><span className={`font-bold ${s.gender === 'M' ? 'text-blue-600' : 'text-pink-600'}`}>{s.gender}</span></td>
                                            <td className="px-4 py-2 text-xs text-slate-500">{s.date_of_birth ?? '—'}</td>
                                            <td className="px-4 py-2 text-xs text-slate-500">{s.parent_phone ?? '—'}</td>
                                            <td className="px-4 py-2 text-slate-600">{(s as any).school?.name ?? '—'}</td>
                                            <td className="px-4 py-2"><Badge label={s.status ?? 'active'} variant={(s.status as any) ?? 'active'} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 8 — PERFORMANCE HISTORY
// ═════════════════════════════════════════════════════════════════════════════
function TabPerformance({ headers }: any) {
    const [search,   setSearch]   = useState('');
    const [results,  setResults]  = useState<StudentRecord[]>([]);
    const [searching,setSearching]= useState(false);
    const [selected, setSelected] = useState<StudentRecord | null>(null);
    const [history,  setHistory]  = useState<any[]>([]);
    const [loading,  setLoading]  = useState(false);

    const handleSearch = async () => {
        if (!search.trim()) return;
        setSearching(true);
        try {
            const res  = await fetch(`/api/v1/students?search=${encodeURIComponent(search)}&per_page=10`, { headers });
            const data = await res.json();
            setResults(data.data ?? []);
        } catch { }
        finally { setSearching(false); }
    };

    const loadPerformance = async (student: StudentRecord) => {
        setSelected(student); setResults([]); setHistory([]); setLoading(true);
        try {
            const res  = await fetch(`/api/v1/students/${student.id}/performance`, { headers });
            const data = await res.json();
            setHistory(data.performance ?? []);
        } catch { }
        finally { setLoading(false); }
    };

    const divisionColor: Record<string, string> = {
        'I':  'bg-emerald-100 text-emerald-700',
        'II': 'bg-blue-100 text-blue-700',
        'III':'bg-yellow-100 text-yellow-700',
        'IV': 'bg-orange-100 text-orange-700',
        '0':  'bg-red-100 text-red-700',
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                    <ChartColumn className="h-4 w-4 text-[#0F4C81]" /> Student Performance History
                </h3>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Search student by name or reg# e.g. S0101/0001"
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-[#0F4C81] focus:outline-none" />
                    </div>
                    <button onClick={handleSearch} disabled={searching}
                        className="flex items-center gap-1.5 rounded-xl bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c3c66] disabled:opacity-50">
                        {searching ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
                    </button>
                </div>
                {results.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        {results.map(s => (
                            <button key={s.id} onClick={() => loadPerformance(s)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50">
                                <div>
                                    <span className="font-semibold text-slate-900">{s.first_name} {s.last_name}</span>
                                    <span className="ml-2 font-mono text-xs text-slate-500">{s.registration_display || s.registration_number}</span>
                                </div>
                                <span className="text-xs text-slate-400">{s.school?.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selected && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F4C81]/10 text-sm font-black text-[#0F4C81] border border-[#0F4C81]/10">
                                {selected.first_name[0]}{selected.last_name[0]}
                            </div>
                            <div>
                                <p className="font-black text-slate-800 text-sm">{selected.first_name} {selected.middle_name ? selected.middle_name + ' ' : ''}{selected.last_name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{selected.registration_display || selected.registration_number} | <span className="font-semibold text-[#0F4C81]">{selected.school?.name}</span></p>
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
                    ) : history.length === 0 ? (
                        <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
                            <TrendingUp className="h-10 w-10 opacity-20" />
                            <p className="text-sm font-medium">No examination records found</p>
                            <p className="text-xs">This student has not been registered for any examination yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto scrollbar-hover">
                            <table className="min-w-full divide-y divide-slate-100 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {['Examination', 'Type', 'Class', 'Exam#', 'Division', 'GPA', 'Total Marks', 'School Rank', 'District Rank', 'Date'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {history.map((r: any) => (
                                        <tr key={r.registration_id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-semibold text-slate-900">{r.exam_name}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.exam_type}</td>
                                            <td className="px-4 py-3 text-slate-500">{r.class_level}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.exam_number ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                {r.division ? (
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${divisionColor[r.division] ?? 'bg-slate-100 text-slate-600'}`}>
                                                        DIV {r.division}
                                                    </span>
                                                ) : <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-slate-700">{r.gpa ? Number(r.gpa).toFixed(2) : '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{r.total_marks ? Number(r.total_marks).toFixed(1) : '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{r.school_position ? `#${r.school_position}` : '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{r.district_position ? `#${r.district_position}` : '—'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-400">{r.start_date ? new Date(r.start_date).toLocaleDateString('en-GB') : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

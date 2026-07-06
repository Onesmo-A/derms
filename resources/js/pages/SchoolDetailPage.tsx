import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap, School, Search, Users2, UserRound } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToastFeedback } from '@/hooks/use-toast-feedback';

type ClassLevel = {
    id: string;
    name: string;
    code?: string;
    numeric_level?: number;
};

type SchoolStudent = {
    id: string;
    registration_number?: string;
    registration_display?: string;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    gender?: string;
    current_class_level_id?: string | null;
    classLevel?: ClassLevel | null;
    class_level?: ClassLevel | null;
};

type SchoolDetail = {
    id: string;
    name: string;
    registration_number?: string;
    type?: string;
    level?: string;
    phone_number?: string;
    email?: string;
    address?: string;
    student_count?: number;
    student_count_cache?: number;
    enrolment_category?: 'below_40' | '40_and_above';
    enrolment_category_label?: string;
    district?: { id: string; name: string; code?: string; region?: { id: string; name: string; code?: string } | null } | null;
    students?: SchoolStudent[];
};

const token = () => localStorage.getItem('token');

const apiHeaders = () => ({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
});

const loadData = async (url: string) => {
    const res = await fetch(url, { headers: apiHeaders() });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(body.message || 'Imeshindwa kupakia taarifa za shule.');
    }
    return body;
};

const getStudentCount = (school?: SchoolDetail | null) => Number(school?.student_count ?? school?.student_count_cache ?? school?.students?.length ?? 0);

const getEnrolmentLabel = (school?: SchoolDetail | null) =>
    school?.enrolment_category_label
    || (getStudentCount(school) >= 40 ? '40 and above' : 'Below 40');

const getEnrolmentBadge = (school?: SchoolDetail | null) =>
    getStudentCount(school) >= 40
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200';

const studentName = (student: SchoolStudent) => [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ') || 'Unnamed student';

const studentClassLevel = (student: SchoolStudent): ClassLevel | null => student.classLevel ?? student.class_level ?? null;

const normalizedGender = (gender?: string | null) => {
    const value = (gender || '').toString().trim().toUpperCase();
    if (['M', 'MALE'].includes(value)) return 'Male';
    if (['F', 'FEMALE'].includes(value)) return 'Female';
    return 'Unspecified';
};

const classLevelLabelByNumeric = (numeric?: number | null) => {
    if (numeric === 1) return 'F1';
    if (numeric === 2) return 'F2';
    if (numeric === 3) return 'F3';
    if (numeric === 4) return 'F4';
    if (numeric === 5) return 'F5';
    if (numeric === 6) return 'F6';
    return 'Other';
};

function StatCard({
    icon,
    label,
    value,
    hint,
    tone,
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    hint?: string;
    tone: string;
}) {
    return (
        <div className={`rounded-2xl border p-3.5 shadow-sm ${tone}`}>
            <div className="flex items-start justify-between gap-2.5">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-70">{label}</p>
                    <p className="mt-1.5 text-2xl font-black tracking-tight">{value}</p>
                    {hint ? <p className="mt-1.5 text-[11px] opacity-75 leading-4">{hint}</p> : null}
                </div>
                <div className="rounded-xl bg-white/70 p-2.5 text-slate-800 shadow-sm">{icon}</div>
            </div>
        </div>
    );
}

export default function SchoolDetailPage() {
    const navigate = useNavigate();
    const params = useParams();
    const schoolId = params.schoolId || '';

    const [school, setSchool] = useState<SchoolDetail | null>(null);
    const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
    const [selectedClassLevel, setSelectedClassLevel] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useToastFeedback({
        error,
        clearError: () => setError(''),
    });

    useEffect(() => {
        const fetchSchool = async () => {
            if (!schoolId) return;

            setLoading(true);
            setError('');
            try {
                const [schoolData, classData] = await Promise.all([
                    loadData(`/api/v1/schools/${schoolId}`),
                    loadData('/api/v1/class-levels'),
                ]);

                setSchool(schoolData);
                setClassLevels(Array.isArray(classData) ? classData : classData.data || []);
            } catch (err: any) {
                setError(err.message || 'Imeshindwa kupakia taarifa za shule.');
            } finally {
                setLoading(false);
            }
        };

        void fetchSchool();
    }, [schoolId]);

    const students = useMemo(() => school?.students ?? [], [school]);

    const filteredStudents = useMemo(() => {
        const query = search.trim().toLowerCase();
        return students.filter((student) => {
            const classLevel = studentClassLevel(student);

            if (selectedClassLevel && classLevel?.id !== selectedClassLevel) {
                return false;
            }

            if (!query) {
                return true;
            }

            const haystack = [
                student.registration_number,
                studentName(student),
                student.gender,
                classLevel?.name,
                classLevel?.code,
            ].filter(Boolean).join(' ').toLowerCase();

            return haystack.includes(query);
        });
    }, [search, selectedClassLevel, students]);

    const classBreakdown = useMemo(() => {
        return filteredStudents.reduce<Record<string, { label: string; count: number; order: number }>>((acc, student) => {
            const classLevel = studentClassLevel(student);
            const classId = classLevel?.id || 'unassigned';
            const label = classLevel?.name || 'Unassigned';
            const order = classLevel?.numeric_level ?? classLevels.findIndex((level) => level.id === classId);
            acc[classId] = {
                label,
                count: (acc[classId]?.count ?? 0) + 1,
                order: order >= 0 ? order : 9999,
            };
            return acc;
        }, {});
    }, [classLevels, filteredStudents]);

    const classEntries = useMemo(
        () => Object.values(classBreakdown).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label)),
        [classBreakdown]
    );

    const genderStats = useMemo(() => {
        const counts = filteredStudents.reduce<Record<string, number>>((acc, student) => {
            const key = normalizedGender(student.gender);
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        }, {});

        const total = filteredStudents.length || 1;
        return [
            { label: 'Male', count: counts.Male ?? 0, tone: 'bg-sky-50 text-sky-800', bar: 'bg-sky-500' },
            { label: 'Female', count: counts.Female ?? 0, tone: 'bg-rose-50 text-rose-800', bar: 'bg-rose-500' },
            { label: 'Unspecified', count: counts.Unspecified ?? 0, tone: 'bg-slate-50 text-slate-700', bar: 'bg-slate-400' },
        ].map((item) => ({
            ...item,
            percentage: Math.round((item.count / total) * 100),
        }));
    }, [filteredStudents]);

    const totalStudents = getStudentCount(school);
    const boys = genderStats.find((row) => row.label === 'Male')?.count ?? 0;
    const girls = genderStats.find((row) => row.label === 'Female')?.count ?? 0;
    const unassigned = filteredStudents.filter((student) => !studentClassLevel(student)?.id).length;
    const classLevelCount = classEntries.length;
    const classSummary = useMemo(() => {
        const counts = {
            F1: { male: 0, female: 0, total: 0 },
            F2: { male: 0, female: 0, total: 0 },
            F3: { male: 0, female: 0, total: 0 },
            F4: { male: 0, female: 0, total: 0 },
            F5: { male: 0, female: 0, total: 0 },
            F6: { male: 0, female: 0, total: 0 },
        };

        students.forEach((student) => {
            const classLevel = studentClassLevel(student);
            const classLabel = classLevelLabelByNumeric(classLevel?.numeric_level ?? null) as keyof typeof counts;
            if (classLabel in counts) {
                counts[classLabel].total += 1;
            }

            const gender = normalizedGender(student.gender);
            if (classLabel in counts) {
                if (gender === 'Male') counts[classLabel].male += 1;
                if (gender === 'Female') counts[classLabel].female += 1;
            }
        });

        return counts;
    }, [students]);
    const classSummaryTotal = useMemo(
        () => Object.values(classSummary).reduce((sum, row) => sum + row.total, 0),
        [classSummary]
    );
    const summaryRows = useMemo(() => ([
        { label: 'Female', key: 'female' as const },
        { label: 'Male', key: 'male' as const },
        { label: 'Total', key: 'total' as const },
    ]), []);

    const displayedSummaryColumns = useMemo(() => ['F1', 'F2', 'F3', 'F4'] as const, []);

    const latestStudents = filteredStudents.slice(0, 12);

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent" />
            </div>
        );
    }

    if (!school) {
        return (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-lg font-bold text-slate-900">School not found</p>
                <p className="mt-2 text-sm text-slate-500">Tunaweza kurudi kwenye list ya shule na kuendelea kutoka hapo.</p>
                <button
                    onClick={() => navigate('/schools')}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0c3c66]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Schools
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-[#0F4C81] via-[#123e63] to-[#16527d] text-white shadow-lg">
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/schools')}
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/90 transition hover:bg-white/15"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to schools list
                        </button>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/65">School Management Detail</p>
                            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{school.name}</h1>
                            <p className="text-xs text-white/75">
                                {school.registration_number || 'No reg no'} · {(school.type || 'school').toString()} · {getEnrolmentLabel(school)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                            <span className="rounded-full bg-white/15 px-2.5 py-1">{school.district?.name || 'No district'}{school.district?.region ? `, ${school.district.region.name}` : ''}</span>
                            <span className="rounded-full bg-white/15 px-2.5 py-1">{totalStudents} students</span>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-sm sm:min-w-[520px]">
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/65">Class Summary</p>
                            <span className="text-[11px] font-semibold text-white/75">{classSummaryTotal} total</span>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                            <table className="w-full border-collapse text-left text-[11px] text-white">
                                <thead className="bg-white/10 text-white/70">
                                    <tr>
                                        <th className="border-b border-white/10 px-2 py-1.5 font-bold uppercase tracking-[0.12em]">Type</th>
                                        {displayedSummaryColumns.map((col) => (
                                            <th key={col} className="border-b border-white/10 px-2 py-1.5 font-bold uppercase tracking-[0.12em]">{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryRows.map((row) => (
                                        <tr key={row.label} className="bg-transparent">
                                            <td className="border-b border-white/10 px-2 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white/80">
                                                {row.label}
                                            </td>
                                            {displayedSummaryColumns.map((col) => (
                                                <td key={col} className="border-b border-white/10 px-2 py-2 text-sm font-black">
                                                    {classSummary[col][row.key]}
                                                </td>
                                            ))}
                                        </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Total Students"
                    value={totalStudents}
                    hint="All students registered in this school."
                    tone="border-sky-100 bg-sky-50 text-sky-900"
                    icon={<School className="h-5 w-5" />}
                />
                <StatCard
                    label="Male"
                    value={boys}
                    hint={`${totalStudents > 0 ? Math.round((boys / totalStudents) * 100) : 0}%`}
                    tone="border-emerald-100 bg-emerald-50 text-emerald-900"
                    icon={<Users2 className="h-5 w-5" />}
                />
                <StatCard
                    label="Female"
                    value={girls}
                    hint={`${totalStudents > 0 ? Math.round((girls / totalStudents) * 100) : 0}%`}
                    tone="border-rose-100 bg-rose-50 text-rose-900"
                    icon={<UserRound className="h-5 w-5" />}
                />
                <StatCard
                    label="Class Levels"
                    value={classLevelCount}
                    hint={`${unassigned} unassigned`}
                    tone="border-amber-100 bg-amber-50 text-amber-900"
                    icon={<GraduationCap className="h-5 w-5" />}
                />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-900">Filters</h2>
                        <p className="text-xs text-slate-500">Search by student, class or reg number.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setSearch('');
                            setSelectedClassLevel('');
                        }}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                        Reset
                    </button>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[1.1fr_1.4fr]">
                    <SearchableSelect
                        value={selectedClassLevel}
                        onValueChange={setSelectedClassLevel}
                        placeholder="All class levels"
                        searchPlaceholder="Search class level..."
                        options={[
                            { value: '', label: 'All class levels' },
                            ...classLevels.map((level) => ({
                                value: level.id,
                                label: level.name,
                                helper: level.code || '',
                            })),
                        ]}
                    />
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search student name or reg no..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>
            </section>

            <div className="grid gap-3 md:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900">Gender</h2>
                        <span className="text-[11px] text-slate-500">{filteredStudents.length} shown</span>
                    </div>
                    <div className="mt-3 space-y-2.5">
                        {genderStats.map((row) => (
                            <div key={row.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-700">{row.label}</span>
                                    <span className="text-slate-500">{row.count} ({row.percentage}%)</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                                    <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.percentage}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Enrollment Summary</h2>
                            <p className="text-xs text-slate-500">Class distribution in compact view</p>
                        </div>
                        <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getEnrolmentBadge(school)}`}>
                            {getEnrolmentLabel(school)}
                        </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {classEntries.length === 0 ? (
                            <div className="col-span-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                                No class level data
                            </div>
                        ) : classEntries.map((row) => {
                            const pct = filteredStudents.length > 0 ? Math.round((row.count / filteredStudents.length) * 100) : 0;
                            return (
                                <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{row.label}</p>
                                        <span className="text-[11px] font-bold text-slate-700">{row.count}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                        <div className="h-full rounded-full bg-[#0F4C81]" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-slate-900">Student Roster</h2>
                        <p className="text-xs text-slate-500">Showing up to 12 matching students.</p>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500">
                        <span className="text-slate-900">{filteredStudents.length}</span> / <span className="text-slate-900">{students.length}</span>
                    </div>
                </div>
                <Link
                    to={`/students?school_id=${schoolId}`}
                    className="inline-flex mt-3 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    Open student management
                </Link>
                <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">#</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Reg</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Name</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Gender</th>
                                    <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Class</th>
                                </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {latestStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                                        No matching students.
                                    </td>
                                </tr>
                            ) : latestStudents.map((student, index) => (
                                <tr key={student.id} className="hover:bg-slate-50/80">
                                    <td className="px-4 py-2.5 text-xs text-slate-500">{index + 1}</td>
                                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600">{student.registration_number || 'N/A'}</td>
                                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{studentName(student)}</td>
                                    <td className="px-4 py-2.5 text-xs text-slate-600">{normalizedGender(student.gender)}</td>
                                    <td className="px-4 py-2.5 text-xs text-slate-600">{studentClassLevel(student)?.name || 'Unassigned'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

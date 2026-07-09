import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Chart from 'react-apexcharts';
import AppLogoIcon from '@/components/app-logo-icon';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    ArrowRight,
    BarChart3,
    Building2,
    ChevronRight,
    CircleDot,
    FileDown,
    Eye,
    GraduationCap,
    Loader2,
    School,
    Search,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Users2,
} from 'lucide-react';

type Scope = 'overview' | 'national' | 'regions' | 'region' | 'districts' | 'district' | 'schools' | 'school' | 'students' | 'insights';

type PageProps = {
    scope: Scope;
};

type MenuItem = { label: string; path: string; scope?: string };

const apiBase = '/api/v1/reports';

const scopeMeta: Record<Scope, { title: string; subtitle: string }> = {
    overview: { title: 'Reports Dashboard', subtitle: 'Navigate from national performance down to individual learners using the same clean flow.' },
    national: { title: 'National Executive Dashboard', subtitle: 'National-level performance, ranking, trends and comparison.' },
    regions: { title: 'Regions', subtitle: 'Review all regions and open a regional executive report.' },
    region: { title: 'Region Executive Dashboard', subtitle: 'Single region performance, district ranking and AI summary.' },
    districts: { title: 'Districts', subtitle: 'Review district performance and drill down into detailed district reports.' },
    district: { title: 'District Executive Dashboard', subtitle: 'Single district performance, school ranking and subject review.' },
    schools: { title: 'Schools', subtitle: 'Review school performance and open a school executive report.' },
    school: { title: 'School Executive Dashboard', subtitle: 'School performance, candidate results and subject analytics.' },
    students: { title: 'Students', subtitle: 'View student-level performance and result slips.' },
    insights: { title: 'AI Insights', subtitle: 'Executive recommendations and weak/strong performance signals.' },
};

const loadData = async (url: string, token: string | null) => {
    const res = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(body.message || 'Failed to load reports data.');
    }
    return body;
};

const fmt = (value: any, digits = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(digits) : '0.00';
};

const toNumber = (value: any, fallback = 0) => {
    const parsed =
        typeof value === 'string'
            ? Number.parseFloat(value.replace(/[^0-9.-]/g, ''))
            : Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
};

const ENROLMENT_CATEGORY_BELOW_40 = 'below_40';
const ENROLMENT_CATEGORY_40_AND_ABOVE = '40_and_above';

const getSchoolStudentCount = (school: any) => Number(school?.student_count ?? school?.student_count_cache ?? school?.candidates ?? 0);

const getSchoolEnrolmentCategory = (school: any) => {
    if (!school) {
        return ENROLMENT_CATEGORY_BELOW_40;
    }

    return school.enrolment_category || (getSchoolStudentCount(school) >= 40 ? ENROLMENT_CATEGORY_40_AND_ABOVE : ENROLMENT_CATEGORY_BELOW_40);
};

const getSchoolEnrolmentLabel = (school: any) =>
    school?.enrolment_category_label || (getSchoolEnrolmentCategory(school) === ENROLMENT_CATEGORY_40_AND_ABOVE ? '40 and above' : 'Below 40');

const getSchoolEnrolmentShortLabel = (school: any) =>
    getSchoolEnrolmentCategory(school) === ENROLMENT_CATEGORY_40_AND_ABOVE ? '>40' : '<40';

const getSchoolEnrolmentBadgeClass = (school: any) =>
    getSchoolEnrolmentCategory(school) === ENROLMENT_CATEGORY_40_AND_ABOVE
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

const csvEscape = (value: any) => {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
};

const downloadTextFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const sectionCard = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const chartPalette = ['#0F4C81', '#5B7C99', '#7A8CA0', '#93A8B8', '#9FD3C7', '#B7C4D6', '#D6BFA6', '#C7D8E8'];

function MetricCard({ label, value, icon: Icon }: { label: string; value: any; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{label}</p>
                    <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
                </div>
                <div className="rounded-xl bg-[#0F4C81]/10 p-3 flex-shrink-0">
                    <Icon className="h-6 w-6 text-[#0F4C81]" />
                </div>
            </div>
        </div>
    );
}

function DataTable({ columns, rows, onRowClick }: { columns: string[]; rows: any[]; onRowClick?: (row: any) => void }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto scrollbar-hover">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                            {columns.map((column) => (
                                <th key={column} className="px-4 py-3 font-bold">{column}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((row, index) => (
                            <tr key={row.id ?? index} className={`transition ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}`} onClick={() => onRowClick?.(row)}>
                                {row._cells?.map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="px-4 py-3 align-top text-slate-700">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={columns.length}>
                                    No records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ChartPanel({
    title,
    description,
    options,
    series,
    type,
}: {
    title: string;
    description?: string;
    options: any;
    series: any;
    type: any;
}) {
    return (
        <div className={sectionCard}>
            <div className="mb-4">
                <h3 className="text-sm font-black text-slate-900">{title}</h3>
                {description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}
            </div>
            <Chart options={options} series={series} type={type} height={300} />
        </div>
    );
}

export default function ExecutiveReportPage({ scope }: PageProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState(searchParams.get('exam_id') || '');
    const [selectedClassLevel, setSelectedClassLevel] = useState(searchParams.get('class_level_id') || '');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const meta = scopeMeta[scope];

    useEffect(() => {
        const boot = async () => {
            try {
                const [menuData, examData] = await Promise.all([
                    loadData(`${apiBase}/menu`, token),
                    loadData('/api/v1/examinations', token),
                ]);
                setMenu(Array.isArray(menuData) ? menuData : []);
                setExams(Array.isArray(examData) ? examData : examData.data || []);
                const classLevelData = await loadData('/api/v1/class-levels', token);
                setClassLevels(Array.isArray(classLevelData) ? classLevelData : classLevelData.data || []);
                if (!selectedExam) {
                    const latest = Array.isArray(examData) ? examData[0] : examData.data?.[0];
                    if (latest?.id) {
                        setSelectedExam(latest.id);
                        setSearchParams((prev) => {
                            prev.set('exam_id', latest.id);
                            return prev;
                        });
                    }
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load report menu.');
            }
        };
        boot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedExam) return;

        const fetchScope = async () => {
            setLoading(true);
            setError('');
            try {
                const classLevelQuery = selectedClassLevel ? `&class_level_id=${selectedClassLevel}` : '';
                let endpoint = `${apiBase}/${scope}?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'region' && params.regionId) endpoint = `${apiBase}/regions/${params.regionId}?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'district' && params.districtId) endpoint = `${apiBase}/districts/${params.districtId}?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'school' && params.schoolId) endpoint = `${apiBase}/schools/${params.schoolId}?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'students' && params.studentId) endpoint = `${apiBase}/students/${params.studentId}?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'overview') endpoint = `${apiBase}/overview?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'national') endpoint = `${apiBase}/national?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'regions') endpoint = `${apiBase}/regions?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'districts') endpoint = `${apiBase}/districts?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'schools') endpoint = `${apiBase}/schools?exam_id=${selectedExam}${classLevelQuery}`;
                if (scope === 'insights') endpoint = `${apiBase}/ai-insights?exam_id=${selectedExam}${classLevelQuery}`;
                const payload = await loadData(endpoint, token);
                setData(payload);
            } catch (err: any) {
                setError(err.message || 'Failed to load reporting data.');
            } finally {
                setLoading(false);
            }
        };
        fetchScope();
    }, [params.districtId, params.regionId, params.schoolId, params.studentId, scope, selectedClassLevel, selectedExam, token]);

    const tabs = menu;
    const currentExamCode = exams.find((exam) => exam.id === selectedExam)?.code || selectedExam || 'Select examination';
    const querySuffix = selectedExam ? `?exam_id=${selectedExam}${selectedClassLevel ? `&class_level_id=${selectedClassLevel}` : ''}` : '';
    const withReportQuery = (path: string) => `${path}${querySuffix}`;

    const nationalRanking = data?.ranking || data?.regions || [];
    const regionId = params.regionId;
    const rows = Array.isArray(nationalRanking)
        ? nationalRanking.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.name || row.region_name || row.district_name || row.school_name || row.student_name || '—',
                  row.districts ?? row.districts_count ?? row.total_districts ?? '—',
                  row.schools ?? row.schools_count ?? row.total_schools ?? '—',
                  row.government_schools ?? row.government ?? '—',
                  row.private_schools ?? row.private ?? '—',
                  row.candidates ?? row.total_candidates ?? '—',
                  fmt(row.average ?? row.average_marks),
                  fmt(row.gpa),
                  `${fmt(row.pass_rate)}%`,
                  row.performance || row.remark || '—',
              ],
          }))
        : [];

    const regionTableRows = Array.isArray(data?.districts)
        ? data.districts.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.name,
                  row.government_schools ?? 0,
                  row.private_schools ?? 0,
                  row.schools ?? 0,
                  row.candidates ?? 0,
                  fmt(row.average),
                  fmt(row.gpa),
                  `${fmt(row.pass_rate)}%`,
                  row.performance ?? '—',
                  row.trend ?? '—',
                  <button className="text-[#0F4C81] font-semibold" onClick={(e) => { e.stopPropagation(); navigate(withReportQuery(`/reports/districts/${row.id}`)); }}>View</button>,
              ],
          }))
        : [];

    const schoolTableRows = Array.isArray(data?.schools)
        ? data.schools.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.name,
                  row.registration_display || row.registration_number || '—',
                  row.district_name || '—',
                  row.region_name || '—',
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${getSchoolEnrolmentBadgeClass(row)}`}>
                      {getSchoolEnrolmentShortLabel(row)}
                  </span>,
                  row.candidates ?? 0,
                  fmt(row.average),
                  fmt(row.gpa),
                  `${fmt(row.pass_rate)}%`,
                  row.performance ?? '—',
                  <button className="text-[#0F4C81] font-semibold" onClick={(e) => { e.stopPropagation(); navigate(withReportQuery(`/reports/schools/${row.id}`)); }}>View</button>,
              ],
          }))
        : [];

    const studentRows = Array.isArray(data?.students)
        ? data.students.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.name,
                  row.registration_display || row.registration_number || '—',
                  row.gender || '—',
                  row.school_name || '—',
                  row.district_name || '—',
                  row.region_name || '—',
                  fmt(row.average),
                  fmt(row.gpa),
                  row.division || '—',
                  row.division_points ?? '—',
              ],
          }))
        : [];

    const schoolStudentRows = Array.isArray(data?.students)
        ? data.students.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  row.name,
                  row.registration_display || row.registration_number || '—',
                  row.gender || 'â€”',
                  fmt(row.average),
                  fmt(row.gpa),
                  row.division || 'â€”',
                  row.division_points ?? 'â€”',
                  index + 1,
              ],
          }))
        : [];

    const schoolHeaderStats = {
        district: data?.school?.district || data?.top_cards?.find((card: any) => card.label === 'District')?.value || 'N/A',
        region: data?.school?.region || data?.top_cards?.find((card: any) => card.label === 'Region')?.value || 'N/A',
        candidates: data?.top_cards?.find((card: any) => card.label === 'Total Candidates')?.value ?? '0',
        studentCount: getSchoolStudentCount(data?.school),
        enrolmentLabel: getSchoolEnrolmentLabel(data?.school),
    };

    const districtPassRate = toNumber(data?.performance_summary?.pass_rate ?? data?.top_cards?.find((card: any) => card.label === 'Pass Rate')?.value ?? 0);
    const districtPassRateLabel = `${districtPassRate.toFixed(1)}%`;
    const districtSchoolCodes = (data?.schools || []).map((row: any) => row.registration_number || row.school_code || row.code || row.name);
    const districtSchoolNames = (data?.schools || []).map((row: any) => row.name || row.registration_number || row.school_code || row.code || 'School');
    const districtDivisionSeries = (data?.division_distribution || []).map((row: any) => toNumber(row.value));
    const schoolDivisionSeries = (data?.division_distribution || []).map((row: any) => toNumber(row.value));

    const chartOptions = {
        chart: { toolbar: { show: false }, fontFamily: 'inherit', foreColor: '#64748b' },
        colors: chartPalette,
        dataLabels: { enabled: false },
        grid: { borderColor: '#e2e8f0' },
        xaxis: { labels: { style: { colors: '#64748b' } } },
        yaxis: { labels: { style: { colors: '#64748b' } } },
        legend: { position: 'top' },
        tooltip: { theme: 'light' },
    };

    const exportRegionDetailJson = () => {
        const payload = {
            exam: { id: selectedExam, code: currentExamCode },
            region: data?.region || null,
            top_cards: data?.top_cards || [],
            districts: data?.districts || [],
            gender_performance: data?.gender_performance || [],
            grade_distribution: data?.grade_distribution || [],
            division_distribution: data?.division_distribution || [],
            subject_performance: data?.subject_performance || [],
            examination_comparison: data?.examination_comparison || [],
        };

        downloadTextFile(
            `regional-analysis-${regionId || 'report'}-${selectedExam || 'exam'}.json`,
            JSON.stringify(payload, null, 2),
            'application/json;charset=utf-8'
        );
    };

    const exportRegionDetailCsv = () => {
        const sections: string[] = [];
        const pushSection = (title: string, headers: string[], rows: any[][]) => {
            sections.push(title);
            sections.push(headers.map(csvEscape).join(','));
            rows.forEach((row) => sections.push(row.map(csvEscape).join(',')));
            sections.push('');
        };

        pushSection(
            'District Performance Ranking',
            ['No', 'District', 'Schools', 'Cand', 'avr', 'GPA', 'Pass Rate', 'Performance'],
            (data?.districts || []).map((row: any, index: number) => [
                index + 1,
                row.name,
                row.schools,
                row.candidates,
                fmt(row.average),
                fmt(row.gpa),
                `${fmt(row.pass_rate)}%`,
                row.performance ?? '',
            ])
        );

        pushSection(
            'Gender Analysis',
            ['No', 'Gender', 'avr', 'GPA', 'Pass Rate'],
            (data?.gender_performance || []).map((row: any, index: number) => [
                index + 1,
                row.label,
                fmt(row.average),
                fmt(row.gpa),
                `${fmt(row.pass_rate)}%`,
            ])
        );

        pushSection(
            'Grade Analysis',
            ['No', 'Grade', 'Count'],
            (data?.grade_distribution || []).map((row: any, index: number) => [index + 1, row.label, row.value])
        );

        pushSection(
            'Division Analysis',
            ['No', 'Division', 'Count'],
            (data?.division_distribution || []).map((row: any, index: number) => [index + 1, row.label, row.value])
        );

        pushSection(
            'Subject Analysis',
            ['No', 'Subject', 'avr', 'Grade', 'GPA', 'Pass Rate', 'Best District', 'Worst District'],
            (data?.subject_performance || []).map((row: any, index: number) => [
                index + 1,
                row.subject?.code || row.subject?.name,
                fmt(row.average),
                row.grade,
                fmt(row.gpa),
                `${fmt(row.pass_rate)}%`,
                row.best_district_display || row.best_district || 'N/A',
                row.worst_district_display || row.worst_district || 'N/A',
            ])
        );

        pushSection(
            'Historical Trend Snapshot',
            ['No', 'Exam', 'avr', 'GPA', 'Pass Rate'],
            (data?.examination_comparison || []).map((row: any, index: number) => [
                index + 1,
                row.label,
                fmt(row.average),
                fmt(row.gpa),
                `${fmt(row.pass_rate)}%`,
            ])
        );

        downloadTextFile(
            `regional-analysis-${regionId || 'report'}-${selectedExam || 'exam'}.csv`,
            sections.join('\n'),
            'text/csv;charset=utf-8'
        );
    };

    return (
        <div className="space-y-6">
            {scope === 'school' ? (
                <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
                    <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
                        <AppLogoIcon className="h-24 w-auto sm:h-28" />
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Prime Minister's Office</p>
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Regional Administration and Local Government</p>
                            <p className="text-lg font-black uppercase tracking-[0.16em] text-slate-900 sm:text-xl">
                                {data?.school?.name || meta.title}
                            </p>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                                {currentExamCode}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                                    District: <span className="font-black text-slate-900">{schoolHeaderStats.district}</span>
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                                    Region: <span className="font-black text-slate-900">{schoolHeaderStats.region}</span>
                                </span>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                                    Total Candidates: <span className="font-black text-slate-900">{schoolHeaderStats.candidates}</span>
                                </span>
                                <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${getSchoolEnrolmentBadgeClass(data?.school)}`}>
                                    Enrolment: <span className="font-black">{schoolHeaderStats.enrolmentLabel}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Reports & Analytics</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{meta.title}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600">{meta.subtitle}</p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <label className="block">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Examination</span>
                                <SearchableSelect
                                    value={selectedExam}
                                    onValueChange={(value) => {
                                        setSelectedExam(value);
                                        setSearchParams((prev) => {
                                            prev.set('exam_id', value);
                                            return prev;
                                        });
                                    }}
                                    placeholder="Select Examination"
                                    searchPlaceholder="Search examination..."
                                    options={exams.map((exam) => ({ value: exam.id, label: exam.name }))}
                                    className="w-full"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Class Level</span>
                                <SearchableSelect
                                    value={selectedClassLevel}
                                    onValueChange={(value) => {
                                        setSelectedClassLevel(value);
                                        setSearchParams((prev) => {
                                            if (value) {
                                                prev.set('class_level_id', value);
                                            } else {
                                                prev.delete('class_level_id');
                                            }
                                            return prev;
                                        });
                                    }}
                                    placeholder="All Class Levels"
                                    searchPlaceholder="Search class level..."
                                    options={classLevels.map((level) => ({ value: level.id, label: level.name }))}
                                    className="w-full"
                                />
                            </label>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Current</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">{currentExamCode}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {tabs.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(withReportQuery(item.path))}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                            location.pathname === item.path ? 'border-[#0F4C81] bg-[#0F4C81] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

            {loading ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 text-sm font-semibold text-[#0F4C81]">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading report...
                    </div>
                </div>
            ) : (
                <>
                    {scope === 'overview' && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {(data?.kpis || []).map((card: any, index: number) => (
                                <MetricCard key={index} label={card.label} value={card.value} icon={index % 2 === 0 ? ShieldCheck : CircleDot} />
                            ))}
                            <div className="md:col-span-2 xl:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="text-sm font-black text-slate-900">Quick Access</h3>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {(data?.quick_links || []).map((link: any) => (
                                        <button key={link.path} onClick={() => navigate(withReportQuery(link.path))} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#0F4C81] hover:text-[#0F4C81]">
                                            {link.label}
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {scope === 'national' && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">National Summary View</h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Keep the summary view, or open the detailed executive tables for full regional analysis.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(withReportQuery('/reports/national/details'))}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66]"
                                >
                                    <Eye className="h-4 w-4" />
                                    Open Detailed Report
                                </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                {(data?.kpis || []).map((card: any, index: number) => (
                                    <MetricCard key={index} label={card.label} value={card.value} icon={index % 3 === 0 ? Building2 : index % 3 === 1 ? School : Users2} />
                                ))}
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <ChartPanel
                                    title="Region Performance Ranking"
                                    options={{ ...chartOptions, xaxis: { categories: (data?.charts?.region_ranking || []).map((r: any) => r.name) } }}
                                    series={[{ name: 'GPA', data: (data?.charts?.region_ranking || []).map((r: any) => Number(r.gpa || 0)) }]}
                                    type="bar"
                                />
                                <ChartPanel
                                    title="Pass Rate Comparison"
                                    options={{ ...chartOptions, xaxis: { categories: (data?.charts?.pass_rate_comparison || []).map((r: any) => r.label) } }}
                                    series={[{ name: 'Pass Rate', data: (data?.charts?.pass_rate_comparison || []).map((r: any) => Number(r.value || 0)) }]}
                                    type="bar"
                                />
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <ChartPanel
                                    title="GPA Distribution"
                                    options={{ ...chartOptions, labels: (data?.charts?.gpa_distribution || []).map((r: any) => r.label) }}
                                    series={(data?.charts?.gpa_distribution || []).map((r: any) => Number(r.value || 0))}
                                    type="donut"
                                />
                                <ChartPanel
                                    title="Historical Examination Trends"
                                    options={{ ...chartOptions, xaxis: { categories: (data?.charts?.historical_trends || []).map((r: any) => r.label) } }}
                                    series={[
                                        { name: 'Average', data: (data?.charts?.historical_trends || []).map((r: any) => Number(r.average || 0)) },
                                        { name: 'GPA', data: (data?.charts?.historical_trends || []).map((r: any) => Number(r.gpa || 0)) },
                                    ]}
                                    type="line"
                                />
                            </div>
                            <DataTable
                                columns={['Rank', 'Region', 'Districts', 'Schools', 'Gov.', 'Private', 'Candidates', 'Average', 'GPA', 'Pass Rate', 'Performance']}
                                rows={rows}
                                onRowClick={(row) => navigate(withReportQuery(`/reports/regions/${row.id}`))}
                            />
                        </div>
                    )}

                    {scope === 'regions' && (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {(data?.regions || []).map((region: any) => (
                                    <button
                                        key={region.id}
                                        onClick={() => navigate(withReportQuery(`/reports/regions/${region.id}`))}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <p className="text-sm font-black text-slate-900">{region.name}</p>
                                        <div className="mt-3 space-y-1 text-xs text-slate-600">
                                            <div>Districts: <span className="font-semibold text-slate-900">{region.districts}</span></div>
                                            <div>Schools: <span className="font-semibold text-slate-900">{region.schools}</span></div>
                                            <div>Candidates: <span className="font-semibold text-slate-900">{region.candidates}</span></div>
                                            <div>GPA: <span className="font-semibold text-slate-900">{fmt(region.gpa)}</span></div>
                                        </div>
                                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C81]">
                                            View Report <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {scope === 'region' && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">Regional Summary View</h3>
                                    <p className="mt-1 text-sm text-slate-600">
                                        Open the detailed regional analysis page for deeper tables and export options.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => regionId && navigate(withReportQuery(`/reports/regions/${regionId}/details`))}
                                    disabled={!regionId || !selectedExam}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Eye className="h-4 w-4" />
                                    View Analysis
                                </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {(data?.top_cards || []).map((card: any, index: number) => (
                                    <MetricCard key={index} label={card.label} value={card.value} icon={index % 2 === 0 ? Building2 : Users2} />
                                ))}
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <ChartPanel
                                    title="District Performance Table"
                                    options={{ ...chartOptions, xaxis: { categories: (data?.districts || []).map((row: any) => row.name) } }}
                                    series={[{ name: 'GPA', data: (data?.districts || []).map((row: any) => Number(row.gpa || 0)) }]}
                                    type="bar"
                                />
                                <ChartPanel
                                    title="Gender Comparison"
                                    options={{ ...chartOptions, xaxis: { categories: ['Male', 'Female'] } }}
                                    series={[
                                        { name: 'GPA', data: (data?.gender_performance || []).map((row: any) => Number(row.gpa || 0)) },
                                        { name: 'Average', data: (data?.gender_performance || []).map((row: any) => Number(row.average || 0)) },
                                    ]}
                                    type="bar"
                                />
                            </div>
                            <DataTable
                                columns={['Rank', 'District', 'Gov.', 'Private', 'Schools', 'Candidates', 'Average', 'GPA', 'Pass Rate', 'Performance', 'Trend', 'Action']}
                                rows={regionTableRows}
                            />
                        </div>
                    )}

                    {scope === 'districts' && (
                        <DataTable
                            columns={['Rank', 'District', 'Gov.', 'Private', 'Schools', 'Candidates', 'Average', 'GPA', 'Pass Rate', 'Performance', 'Trend', 'Action']}
                            rows={regionTableRows}
                        />
                    )}

                    {scope === 'district' && (
                        <div className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {(data?.top_cards || []).map((card: any, index: number) => (
                                    <MetricCard key={index} label={card.label} value={card.value} icon={index % 2 === 0 ? School : Users2} />
                                ))}
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <ChartPanel
                                    title="School Performance"
                                    description="Rank schools in the district by GPA for quick spotting of strong and weak performers."
                                    options={{
                                        ...chartOptions,
                                        plotOptions: {
                                            bar: {
                                                distributed: true,
                                                columnWidth: '58%',
                                                borderRadius: 6,
                                            },
                                        },
                                        colors: chartPalette,
                                        legend: { show: false },
                                        xaxis: {
                                            categories: districtSchoolCodes,
                                        },
                                        tooltip: {
                                            ...chartOptions.tooltip,
                                            x: {
                                                formatter: (_value: string, opts: any) => districtSchoolNames[opts.dataPointIndex] || districtSchoolCodes[opts.dataPointIndex] || 'School',
                                            },
                                        },
                                    }}
                                    series={[{ name: 'GPA', data: (data?.schools || []).map((row: any) => Number(row.gpa || 0)) }]}
                                    type="bar"
                                />
                                <ChartPanel
                                    title="Subject Performance"
                                    description="Compare subject GPA across the district to see where subject-level intervention is needed."
                                    options={{
                                        ...chartOptions,
                                        plotOptions: {
                                            bar: {
                                                distributed: true,
                                                columnWidth: '58%',
                                                borderRadius: 6,
                                            },
                                        },
                                        colors: chartPalette,
                                        legend: { show: false },
                                        xaxis: { categories: (data?.subject_performance || []).map((row: any) => row.subject?.code || row.subject?.name) },
                                    }}
                                    series={[{ name: 'GPA', data: (data?.subject_performance || []).map((row: any) => Number(row.gpa || 0)) }]}
                                    type="bar"
                                />
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <ChartPanel
                                    title="Historical Examination Trends"
                                    description="Track how the district has moved over time using average marks and GPA."
                                    options={{ ...chartOptions, xaxis: { categories: (data?.examination_comparison || data?.historical_trends || []).map((row: any) => row.label) } }}
                                    series={[
                                        { name: 'Average', data: (data?.examination_comparison || data?.historical_trends || []).map((row: any) => Number(row.average || 0)) },
                                        { name: 'GPA', data: (data?.examination_comparison || data?.historical_trends || []).map((row: any) => Number(row.gpa || 0)) },
                                    ]}
                                    type="line"
                                />
                                <ChartPanel
                                    title="Division Distribution"
                                    description="See the spread of candidates by division across the district."
                                    options={{
                                        ...chartOptions,
                                        labels: (data?.division_distribution || []).map((row: any) => row.label),
                                        legend: { position: 'bottom' },
                                        plotOptions: {
                                            pie: {
                                                donut: {
                                                    labels: {
                                                        show: true,
                                                        name: {
                                                            show: true,
                                                        },
                                                        value: {
                                                            show: true,
                                                            formatter: () => districtPassRateLabel,
                                                        },
                                                        total: {
                                                            show: true,
                                                            label: 'Pass',
                                                            formatter: () => districtPassRateLabel,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                    series={districtDivisionSeries}
                                    type="donut"
                                />
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <ChartPanel
                                    title="Gender Performance"
                                    description="Compare male and female performance using district GPA and average marks."
                                    options={{
                                        ...chartOptions,
                                        xaxis: { categories: (data?.gender_performance || []).map((row: any) => row.label || 'Gender') },
                                    }}
                                    series={[
                                        { name: 'GPA', data: (data?.gender_performance || []).map((row: any) => Number(row.gpa || 0)) },
                                        { name: 'Average', data: (data?.gender_performance || []).map((row: any) => Number(row.average || 0)) },
                                    ]}
                                    type="bar"
                                />
                                <ChartPanel
                                    title="Grade Distribution"
                                    description="Understand how grades are distributed across all candidates in the district."
                                    options={{ ...chartOptions, xaxis: { categories: (data?.grade_distribution || []).map((row: any) => row.label) } }}
                                    series={[
                                        { name: 'Candidates', data: (data?.grade_distribution || []).map((row: any) => Number(row.value || 0)) },
                                    ]}
                                    type="bar"
                                />
                            </div>
                            <DataTable
                                columns={['Rank', 'School', 'Type', 'District', 'Region', 'Enrolment', 'Candidates', 'Average', 'GPA', 'Pass Rate', 'Performance', 'Action']}
                                rows={schoolTableRows}
                            />
                        </div>
                    )}

                    {scope === 'schools' && (
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {(data?.schools || []).map((school: any) => (
                                    <button key={school.id} onClick={() => navigate(withReportQuery(`/reports/schools/${school.id}`))} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-black text-slate-900">{school.name}</p>
                                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getSchoolEnrolmentBadgeClass(school)}`}>
                                                {getSchoolEnrolmentLabel(school)}
                                            </span>
                                        </div>
                                        <div className="mt-3 text-xs text-slate-600">
                                            <div>District: <span className="font-semibold text-slate-900">{school.district_name}</span></div>
                                            <div>Region: <span className="font-semibold text-slate-900">{school.region_name}</span></div>
                                            <div>Students: <span className="font-semibold text-slate-900">{getSchoolStudentCount(school)}</span></div>
                                            <div>Candidates: <span className="font-semibold text-slate-900">{school.candidates}</span></div>
                                        </div>
                                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0F4C81]">View Report <ArrowRight className="h-4 w-4" /></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {scope === 'school' && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                <label className="block">
                                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Examination</span>
                                    <SearchableSelect
                                        value={selectedExam}
                                        onValueChange={(value) => {
                                            setSelectedExam(value);
                                            setSearchParams((prev) => {
                                                prev.set('exam_id', value);
                                                return prev;
                                            });
                                        }}
                                        placeholder="Select Examination"
                                        searchPlaceholder="Search examination..."
                                        options={exams.map((exam) => ({ value: exam.id, label: exam.name }))}
                                        className="w-full min-w-[220px]"
                                    />
                                </label>
                                <label className="block">
                                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Class Level</span>
                                    <SearchableSelect
                                        value={selectedClassLevel}
                                        onValueChange={(value) => {
                                            setSelectedClassLevel(value);
                                            setSearchParams((prev) => {
                                                if (value) {
                                                    prev.set('class_level_id', value);
                                                } else {
                                                    prev.delete('class_level_id');
                                                }
                                                return prev;
                                            });
                                        }}
                                        placeholder="All Class Levels"
                                        searchPlaceholder="Search class level..."
                                        options={classLevels.map((level) => ({ value: level.id, label: level.name }))}
                                        className="min-w-[220px]"
                                    />
                                </label>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">School Summary View</h3>
                                    <p className="mt-1 text-sm text-slate-600">Use the detailed report for charts, analysis tables and student breakdown.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => params.schoolId && navigate(withReportQuery(`/reports/schools/${params.schoolId}/details`))}
                                    disabled={!params.schoolId || !selectedExam}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Eye className="h-4 w-4" />
                                    Open Detailed Report
                                </button>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {(data?.top_cards || []).map((card: any, index: number) => (
                                    <MetricCard key={index} label={card.label} value={card.value} icon={index % 2 === 0 ? GraduationCap : Users2} />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                                    Students: <span className="font-black text-slate-900">{schoolHeaderStats.studentCount}</span>
                                </span>
                                <span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${getSchoolEnrolmentBadgeClass(data?.school)}`}>
                                    Enrolment: <span className="font-black">{schoolHeaderStats.enrolmentLabel}</span>
                                </span>
                            </div>
                            <div className="grid gap-4 xl:grid-cols-2">
                                <ChartPanel
                                    title="Gender Performance"
                                    options={{ ...chartOptions, xaxis: { categories: ['Male', 'Female'] } }}
                                    series={[{ name: 'GPA', data: (data?.gender_performance || []).map((row: any) => Number(row.gpa || 0)) }]}
                                    type="bar"
                                />
                                <ChartPanel
                                    title="Division Distribution"
                                    options={{
                                        ...chartOptions,
                                        labels: (data?.division_distribution || []).map((row: any) => row.label),
                                        plotOptions: {
                                            pie: {
                                                donut: {
                                                    labels: {
                                                        show: true,
                                                        name: { show: true },
                                                        value: {
                                                            show: true,
                                                            formatter: () => districtPassRateLabel,
                                                        },
                                                        total: {
                                                            show: true,
                                                            label: 'Pass',
                                                            formatter: () => districtPassRateLabel,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                    series={schoolDivisionSeries}
                                    type="donut"
                                />
                            </div>
                        </div>
                    )}

                    {scope === 'students' && (
                        <DataTable
                            columns={['Rank', 'Candidate', 'Reg No', 'Gender', 'School', 'District', 'Region', 'Average', 'GPA', 'Division', 'Points']}
                            rows={studentRows}
                        />
                    )}

                    {scope === 'insights' && (
                        <div className="space-y-6">
                            <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Sparkles className="h-4 w-4 text-[#0F4C81]" /> Executive Summary</div>
                                    <p className="mt-3 text-sm leading-6 text-slate-600">{data?.executive_summary?.body}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-2 text-sm font-black text-slate-900"><TrendingUp className="h-4 w-4 text-[#0F4C81]" /> Recommendations</div>
                                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                        {(data?.recommendations || []).map((item: string) => (
                                            <li key={item} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#0F4C81]" />{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-900">Strong Regions</h3>
                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                        {(data?.strong_regions || []).map((row: any) => <div key={row.id}>{row.name} - GPA {fmt(row.gpa)}</div>)}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-900">Weak Regions</h3>
                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                        {(data?.weak_regions || []).map((row: any) => <div key={row.id}>{row.name} - GPA {fmt(row.gpa)}</div>)}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <h3 className="text-sm font-black text-slate-900">Weak Districts</h3>
                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                        {(data?.weak_districts || []).map((row: any) => <div key={row.id}>{row.name} - GPA {fmt(row.gpa)}</div>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

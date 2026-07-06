import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import AppLogoIcon from '@/components/app-logo-icon';
import { useToastFeedback } from '@/hooks/use-toast-feedback';
import { SearchableSelect } from '@/components/ui/searchable-select';

type TableRow = Record<string, any>;

const apiBase = '/api/v1/reports';

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
        throw new Error(body.message || 'Failed to load school details.');
    }
    return body;
};

const fmt = (value: any, digits = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(digits) : '0.00';
};

const ENROLMENT_CATEGORY_BELOW_40 = 'below_40';
const ENROLMENT_CATEGORY_40_AND_ABOVE = '40_and_above';

const getSchoolStudentCount = (school: any) => Number(school?.student_count ?? school?.student_count_cache ?? school?.candidates ?? 0);

const getSchoolEnrolmentCategory = (school: any) =>
    school?.enrolment_category || (getSchoolStudentCount(school) >= 40 ? ENROLMENT_CATEGORY_40_AND_ABOVE : ENROLMENT_CATEGORY_BELOW_40);

const getSchoolEnrolmentLabel = (school: any) =>
    school?.enrolment_category_label || (getSchoolEnrolmentCategory(school) === ENROLMENT_CATEGORY_40_AND_ABOVE ? '40 and above' : 'Below 40');

const getSchoolEnrolmentBadgeClass = (school: any) =>
    getSchoolEnrolmentCategory(school) === ENROLMENT_CATEGORY_40_AND_ABOVE
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

function DataTable({
    title,
    subtitle,
    columns,
    rows,
}: {
    title: string;
    subtitle?: string;
    columns: ReactNode[];
    rows: TableRow[];
}) {
    return (
        <section className="space-y-2">
            <div className="border-b border-slate-200 pb-1.5">
                <h2 className="text-base font-black tracking-tight text-slate-900">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full border-collapse text-left text-[13px]">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index} className="border-b border-slate-200 px-2.5 py-2.5 font-bold">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={row.id ?? rowIndex} className="border-b border-slate-100 hover:bg-slate-50">
                                {row._cells.map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="px-2.5 py-2.5 align-top text-slate-700">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                                    No records found.
                                </td>
                            </tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function SchoolDetailReportPage() {
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [exams, setExams] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState(searchParams.get('exam_id') || '');
    const [selectedClassLevel, setSelectedClassLevel] = useState(searchParams.get('class_level_id') || '');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useToastFeedback({
        error,
        clearError: () => setError(''),
    });

    const token = localStorage.getItem('token');
    const schoolId = params.schoolId || '';
    const schoolName = data?.school?.name || 'School Details';
    const examName = useMemo(() => exams.find((exam) => exam.id === selectedExam)?.name || 'Select Examination', [exams, selectedExam]);
    const classLevelName = useMemo(
        () => classLevels.find((level) => level.id === selectedClassLevel)?.name || 'All Class Levels',
        [classLevels, selectedClassLevel]
    );

    useEffect(() => {
        const boot = async () => {
            try {
                const examData = await loadData('/api/v1/examinations', token);
                const classLevelData = await loadData('/api/v1/class-levels', token);
                const examList = Array.isArray(examData) ? examData : examData.data || [];
                const classList = Array.isArray(classLevelData) ? classLevelData : classLevelData.data || [];
                setExams(examList);
                setClassLevels(classList);

                const currentExam = selectedExam || examList[0]?.id || '';
                if (currentExam && !selectedExam) {
                    setSelectedExam(currentExam);
                    setSearchParams((prev) => {
                        prev.set('exam_id', currentExam);
                        return prev;
                    });
                }
                const currentClassLevel = selectedClassLevel || classList[0]?.id || '';
                if (currentClassLevel && !selectedClassLevel) {
                    setSelectedClassLevel(currentClassLevel);
                    setSearchParams((prev) => {
                        prev.set('class_level_id', currentClassLevel);
                        return prev;
                    });
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load examinations.');
            }
        };

        boot();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedExam || !schoolId) return;

        const fetchDetails = async () => {
            setLoading(true);
            setError('');
            try {
                const payload = await loadData(
                    `${apiBase}/schools/${schoolId}/details?exam_id=${selectedExam}${selectedClassLevel ? `&class_level_id=${selectedClassLevel}` : ''}`,
                    token
                );
                setData(payload);
            } catch (err: any) {
                setError(err.message || 'Failed to load school details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [schoolId, selectedExam, selectedClassLevel, token]);

    const examSubjects: Array<{ label?: string; short_name?: string; code?: string; name?: string }> = Array.isArray(data?.exam_subjects) ? data.exam_subjects : [];
    const subjectCodes = examSubjects.map((subject) => subject.label || subject.short_name || subject.code || subject.name || 'N/A');

    const studentRows: TableRow[] = Array.isArray(data?.students)
        ? data.students.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.registration_display || row.registration_number || 'N/A',
                  row.name,
                  ...subjectCodes.map((code) => row.subject_scores?.[code] ?? 'N/A'),
                  row.gender || 'N/A',
                  fmt(row.average),
                  fmt(row.gpa),
                  row.division || 'N/A',
                  row.division_points ?? 'N/A',
                  row.district_position ?? 'N/A',
                  row.district_position ?? 'N/A',
                  row.region_position ?? 'N/A',
              ],
          }))
        : [];

    const genderRows: TableRow[] = Array.isArray(data?.gender_performance)
        ? data.gender_performance.map((row: any, index: number) => ({
              ...row,
              _cells: [index + 1, row.label, fmt(row.average), fmt(row.gpa), `${fmt(row.pass_rate)}%`],
          }))
        : [];

    const gradeRows: TableRow[] = Array.isArray(data?.grade_distribution)
        ? data.grade_distribution.map((row: any, index: number) => ({
              ...row,
              _cells: [index + 1, row.label, row.value],
          }))
        : [];

    const divisionRows: TableRow[] = Array.isArray(data?.division_distribution)
        ? data.division_distribution.map((row: any, index: number) => ({
              ...row,
              _cells: [index + 1, row.label, row.value],
          }))
        : [];

    const subjectRows: TableRow[] = Array.isArray(data?.subject_performance)
        ? data.subject_performance.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.subject?.code || row.subject_code || row.code || 'N/A',
                  row.subject?.name || row.subject_name || row.subject || 'N/A',
                  fmt(row.average),
                  row.grade || 'N/A',
                  fmt(row.gpa),
                  `${fmt(row.pass_rate)}%`,
              ],
          }))
        : [];

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
                <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
                    <AppLogoIcon className="h-20 w-auto sm:h-24" />
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Prime Minister&apos;s Office</p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Regional Administration and Local Government</p>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{schoolName}</h1>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{examName}</p>
                        <p className="pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            District: <span className="font-black text-slate-900">{data?.school?.district || 'N/A'}</span>
                            <span className="px-2 text-slate-300">|</span>
                            Region: <span className="font-black text-slate-900">{data?.school?.region || 'N/A'}</span>
                            <span className="px-2 text-slate-300">|</span>
                            Class Level: <span className="font-black text-slate-900">{classLevelName}</span>
                            <span className="px-2 text-slate-300">|</span>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getSchoolEnrolmentBadgeClass(data?.school)}`}>
                                Enrolment: {getSchoolEnrolmentLabel(data?.school)}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
                        className="min-w-[220px]"
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

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/reports/schools/${schoolId}?exam_id=${selectedExam}`)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                </div>
            </div>

            {error ? <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

            {loading ? (
                <div className="border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">Loading school report details...</div>
            ) : (
                <div className="space-y-8">
                    <DataTable
                        title="Candidate Performance"
                        subtitle="All candidates ranked by their current examination results."
                        columns={['No', 'Reg No', 'Candidate', ...subjectCodes, 'Sex', 'Avg', 'GPA', 'Div', 'PT','S.Pos', 'D.Pos','R.Pos']}
                        rows={studentRows}
                    />

                    <DataTable
                        title="Gender Analysis"
                        subtitle="Candidate, average and pass rate comparison by gender."
                        columns={['No', 'Gender', 'avr', 'GPA', 'Pass Rate']}
                        rows={genderRows}
                    />

                    <DataTable
                        title="Grade Analysis"
                        subtitle="Grade distribution in the school."
                        columns={['No', 'Grade', 'Count']}
                        rows={gradeRows}
                    />

                    <DataTable
                        title="Division Analysis"
                        subtitle="Division distribution in the school."
                        columns={['No', 'Division', 'Count']}
                        rows={divisionRows}
                    />

                    <DataTable
                        title="Subject Analysis"
                        subtitle="Subject performance, pass rate and score spread across the school."
                        columns={['No', 'Code', 'Subject', 'avr', 'Grade', 'GPA', 'Pass Rate']}
                        rows={subjectRows}
                    />
                </div>
            )}
        </div>
    );
}

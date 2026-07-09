import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Chart from 'react-apexcharts';
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
        throw new Error(body.message || 'Failed to load district details.');
    }
    return body;
};

const fmt = (value: any, digits = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(digits) : '0.00';
};

function MetricCard({ label, value }: { label: string; value: any }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
    );
}

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
            <div className="overflow-x-auto border border-slate-200 bg-white scrollbar-hover">
                <table className="min-w-full border-collapse text-left text-[13px]">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                            {columns.map((column, index) => (
                                <th key={index} className="border-b border-slate-200 px-2 py-2.5 font-bold">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={row.id ?? rowIndex} className="border-b border-slate-100 hover:bg-slate-50">
                                {row._cells.map((cell: any, cellIndex: number) => (
                                    <td key={cellIndex} className="px-2 py-2.5 align-top text-slate-700">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-400">
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

function ChartCard({
    title,
    subtitle,
    type,
    categories,
    series,
    labels,
}: {
    title: string;
    subtitle?: string;
    type: 'bar' | 'line' | 'donut';
    categories?: string[];
    series: Array<{ name: string; data: number[] }>;
    labels?: string[];
}) {
    const options: any = {
        chart: { toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#0F4C81', '#10b981', '#f59e0b'],
        dataLabels: { enabled: false },
        legend: { position: 'bottom' },
        tooltip: { theme: 'light' },
        stroke: { curve: 'smooth', width: type === 'line' ? 3 : 0 },
        plotOptions: type === 'bar' ? { bar: { borderRadius: 6, columnWidth: '45%' } } : undefined,
        xaxis: categories ? { categories, labels: { style: { fontSize: '11px' } } } : undefined,
        labels,
    };

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3">
                <h3 className="text-sm font-black tracking-tight text-slate-900">{title}</h3>
                {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            </div>
            <Chart options={options} series={series as any} type={type} height={300} />
        </section>
    );
}

export default function DistrictDetailReportPage() {
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState(searchParams.get('exam_id') || '');
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [selectedClassLevel, setSelectedClassLevel] = useState(searchParams.get('class_level_id') || '');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useToastFeedback({
        error,
        clearError: () => setError(''),
    });

    const token = localStorage.getItem('token');
    const districtId = params.districtId || '';
    const districtName = data?.district?.name || 'District Details';
    const examName = useMemo(() => {
        return exams.find((exam) => exam.id === selectedExam)?.name || 'Select Examination';
    }, [exams, selectedExam]);

    useEffect(() => {
        const boot = async () => {
            try {
                const [examData, classLevelData] = await Promise.all([
                    loadData('/api/v1/examinations', token),
                    loadData('/api/v1/class-levels', token),
                ]);
                const examList = Array.isArray(examData) ? examData : examData.data || [];
                setExams(examList);
                setClassLevels(Array.isArray(classLevelData) ? classLevelData : classLevelData.data || []);

                const currentExam = selectedExam || examList[0]?.id || '';
                if (currentExam && !selectedExam) {
                    setSelectedExam(currentExam);
                    setSearchParams((prev) => {
                        prev.set('exam_id', currentExam);
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
        if (!selectedExam || !districtId) return;

        const fetchDetails = async () => {
            setLoading(true);
            setError('');
            try {
                const payload = await loadData(
                    `${apiBase}/districts/${districtId}/details?exam_id=${selectedExam}${selectedClassLevel ? `&class_level_id=${selectedClassLevel}` : ''}`,
                    token
                );
                setData(payload);
            } catch (err: any) {
                setError(err.message || 'Failed to load district details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [districtId, selectedClassLevel, selectedExam, token]);

    const schoolRows: TableRow[] = Array.isArray(data?.schools)
        ? data.schools.map((row: any, index: number) => ({
              ...row,
              _cells: [index + 1, row.name, row.type, row.candidates, fmt(row.average), fmt(row.gpa), `${fmt(row.pass_rate)}%`, row.performance],
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
                  row.subject?.code || row.subject?.name,
                  fmt(row.average),
                  row.grade,
                  fmt(row.gpa),
                  `${fmt(row.pass_rate)}%`,
                  row.best_school_display || row.best_school || 'N/A',
                  row.worst_school_display || row.worst_school || 'N/A',
              ],
          }))
        : [];

    const trendRows: TableRow[] = Array.isArray(data?.examination_comparison)
        ? data.examination_comparison.map((row: any, index: number) => ({
              ...row,
              _cells: [index + 1, row.label, fmt(row.average), fmt(row.gpa), `${fmt(row.pass_rate)}%`],
          }))
        : [];

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
                <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
                    <AppLogoIcon className="h-24 w-auto sm:h-28" />
                    <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Prime Minister's Office</p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Regional Administration and Local Government</p>
                        <p className="text-lg font-black uppercase tracking-[0.16em] text-slate-900 sm:text-xl">{districtName}</p>
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
                        onClick={() => navigate('/reports/districts')}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                </div>
            </div>

            {error ? <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

            {loading ? (
                <div className="border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">Loading district report details...</div>
            ) : (
                <div className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {(data?.top_cards || []).map((card: any, index: number) => (
                            <MetricCard key={index} label={card.label} value={card.value} />
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard label="District" value={data?.district?.name || 'N/A'} />
                        <MetricCard label="Region" value={data?.district?.region || 'N/A'} />
                        <MetricCard label="Candidates" value={data?.performance_summary?.candidates ?? 0} />
                        <MetricCard label="GPA" value={fmt(data?.performance_summary?.gpa)} />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <ChartCard
                            title="Historical Performance Trend"
                            subtitle="Average and GPA trend across available examinations"
                            type="line"
                            categories={(data?.examination_comparison || []).map((row: any) => row.label)}
                            series={[
                                { name: 'Average', data: (data?.examination_comparison || []).map((row: any) => Number(row.average || 0)) },
                                { name: 'GPA', data: (data?.examination_comparison || []).map((row: any) => Number(row.gpa || 0)) },
                            ]}
                        />
                        <ChartCard
                            title="Division Distribution"
                            subtitle="Candidate division spread in this district"
                            type="donut"
                            labels={(data?.division_distribution || []).map((row: any) => row.label)}
                            series={(data?.division_distribution || []).map((row: any) => Number(row.value || 0))}
                        />
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                        <ChartCard
                            title="Gender Performance"
                            subtitle="Average and GPA by gender"
                            type="bar"
                            categories={(data?.gender_performance || []).map((row: any) => row.label)}
                            series={[
                                { name: 'Average', data: (data?.gender_performance || []).map((row: any) => Number(row.average || 0)) },
                                { name: 'GPA', data: (data?.gender_performance || []).map((row: any) => Number(row.gpa || 0)) },
                            ]}
                        />
                        <ChartCard
                            title="Grade Distribution"
                            subtitle="How candidates are distributed by grade"
                            type="bar"
                            categories={(data?.grade_distribution || []).map((row: any) => row.label)}
                            series={[{ name: 'Candidates', data: (data?.grade_distribution || []).map((row: any) => Number(row.value || 0)) }]}
                        />
                    </div>

                    <DataTable
                        title="School Performance Ranking"
                        subtitle="School ranking within this district."
                        columns={['No', 'School', 'Type', 'Cand', 'avr', 'GPA', 'Pass Rate', 'Performance']}
                        rows={schoolRows}
                    />

                    <DataTable
                        title="Gender Analysis"
                        subtitle="Candidate, grade and division distribution by gender."
                        columns={['No', 'Gender', 'avr', 'GPA', 'Pass Rate']}
                        rows={genderRows}
                    />

                    <DataTable
                        title="Grade Analysis"
                        subtitle="Grade distribution in the district."
                        columns={['No', 'Grade', 'Count']}
                        rows={gradeRows}
                    />

                    <DataTable
                        title="Division Analysis"
                        subtitle="Division distribution in the district."
                        columns={['No', 'Division', 'Count']}
                        rows={divisionRows}
                    />

                    <DataTable
                        title="Subject Analysis"
                        subtitle="Subject performance, pass rate and score spread across the district."
                        columns={['No', 'Subject', 'avr', 'Grade', 'GPA', 'Pass Rate', 'Best School', 'Worst School']}
                        rows={subjectRows}
                    />

                    <DataTable
                        title="Historical Trend Snapshot"
                        subtitle="Comparison across the latest examinations currently in the system."
                        columns={['No', 'Exam', 'avr', 'GPA', 'Pass Rate']}
                        rows={trendRows}
                    />
                </div>
            )}
        </div>
    );
}

import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLogoIcon from '@/components/app-logo-icon';
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
        throw new Error(body.message || 'Failed to load national details.');
    }
    return body;
};

const fmt = (value: any, digits = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(digits) : '0.00';
};

const cleanRegionLabel = (value: any) => {
    const text = String(value ?? '').trim();
    if (!text) return 'N/A';
    return text.replace(/\s*\([^)]*\)\s*$/, '');
};

function DataTable({
    title,
    subtitle,
    columns,
    rows,
    rowClassName,
}: {
    title: string;
    subtitle?: string;
    columns: ReactNode[];
    rows: TableRow[];
    rowClassName?: (row: TableRow, rowIndex: number) => string;
}) {
    return (
        <section className="space-y-2">
            <div className="border-b border-slate-200 pb-1.5">
                <h2 className="text-base font-black tracking-tight text-slate-900">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
            </div>
            <div className="overflow-x-auto border border-slate-200 bg-white scrollbar-hover">
                <table className="min-w-full border-collapse text-left text-[13px]">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
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
                            <tr
                                key={row.id ?? rowIndex}
                                className={`border-b border-slate-100 hover:bg-slate-50 ${rowClassName?.(row, rowIndex) || ''}`}
                            >
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

function RegionalDivisionTable({ rows }: { rows: TableRow[] }) {
    const totalRow = rows.reduce(
        (acc, row) => {
            const fields = [
                'candidates_male',
                'candidates_female',
                'candidates_total',
                'division_i_male',
                'division_i_female',
                'division_i_total',
                'division_ii_male',
                'division_ii_female',
                'division_ii_total',
                'division_iii_male',
                'division_iii_female',
                'division_iii_total',
                'division_iv_male',
                'division_iv_female',
                'division_iv_total',
                'division_0_male',
                'division_0_female',
                'division_0_total',
            ] as const;

            fields.forEach((field) => {
                acc[field] += Number(row[field] ?? 0);
            });

            return acc;
        },
        {
            candidates_male: 0,
            candidates_female: 0,
            candidates_total: 0,
            division_i_male: 0,
            division_i_female: 0,
            division_i_total: 0,
            division_ii_male: 0,
            division_ii_female: 0,
            division_ii_total: 0,
            division_iii_male: 0,
            division_iii_female: 0,
            division_iii_total: 0,
            division_iv_male: 0,
            division_iv_female: 0,
            division_iv_total: 0,
            division_0_male: 0,
            division_0_female: 0,
            division_0_total: 0,
        }
    );

    const totalCells = [
        '',
        'Total',
        totalRow.candidates_male,
        totalRow.candidates_female,
        totalRow.candidates_total,
        totalRow.division_i_male,
        totalRow.division_i_female,
        totalRow.division_i_total,
        totalRow.division_ii_male,
        totalRow.division_ii_female,
        totalRow.division_ii_total,
        totalRow.division_iii_male,
        totalRow.division_iii_female,
        totalRow.division_iii_total,
        totalRow.division_iv_male,
        totalRow.division_iv_female,
        totalRow.division_iv_total,
        totalRow.division_0_male,
        totalRow.division_0_female,
        totalRow.division_0_total,
    ];

    const groupHeaderClass = 'border-b border-slate-200 px-2 py-2 text-center font-bold';
    const groupBoundaryClass = 'border-r border-slate-300';
    const cellBoundaryClass = 'border-r border-slate-200';

    return (
        <section className="space-y-2">
            <div className="border-b border-slate-200 pb-1.5">
                <h2 className="text-base font-black tracking-tight text-slate-900">Regional Division Analysis</h2>
                <p className="mt-1 text-sm text-slate-600">Gender and division breakdown across all regions.</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm scrollbar-hover">
                <table className="min-w-[1140px] table-fixed border-collapse text-left text-[12px]">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                        <tr>
                            <th rowSpan={2} className="w-12 border-b border-slate-200 px-1.5 py-2 text-center font-bold">
                                No
                            </th>
                            <th rowSpan={2} className="w-40 border-b border-slate-200 px-1.5 py-2 text-center font-bold">
                                Region
                            </th>
                            <th colSpan={3} className={`${groupHeaderClass} ${groupBoundaryClass}`}>
                                Cand
                            </th>
                            <th colSpan={3} className={`${groupHeaderClass} ${groupBoundaryClass}`}>
                                Div I
                            </th>
                            <th colSpan={3} className={`${groupHeaderClass} ${groupBoundaryClass}`}>
                                Div II
                            </th>
                            <th colSpan={3} className={`${groupHeaderClass} ${groupBoundaryClass}`}>
                                Div III
                            </th>
                            <th colSpan={3} className={`${groupHeaderClass} ${groupBoundaryClass}`}>
                                Div IV
                            </th>
                            <th colSpan={3} className={groupHeaderClass}>
                                Div 0
                            </th>
                        </tr>
                        <tr>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>M</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>F</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>Tot</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>M</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>F</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>Tot</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>M</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>F</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>Tot</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>M</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>F</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>Tot</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>M</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>F</th>
                            <th className={`w-12 border-b border-slate-200 px-1 py-1.5 text-center ${cellBoundaryClass}`}>Tot</th>
                            <th className="w-12 border-b border-slate-200 px-1 py-1.5 text-center">M</th>
                            <th className="w-12 border-b border-slate-200 px-1 py-1.5 text-center">F</th>
                            <th className="w-12 border-b border-slate-200 px-1 py-1.5 text-center">Tot</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={row.id ?? rowIndex} className="border-b border-slate-100 hover:bg-slate-50">
                                {row._cells.map((cell: any, cellIndex: number) => (
                                    <td
                                        key={cellIndex}
                                        className={`truncate px-1.5 py-2.5 align-top text-slate-700 ${
                                            [1, 4, 7, 10, 13, 16].includes(cellIndex) ? 'border-r border-slate-200' : ''
                                        } ${cellIndex === 1 ? 'font-semibold text-slate-900' : 'text-center'}`}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                            {totalCells.map((cell, cellIndex) => (
                                <td
                                    key={`total-${cellIndex}`}
                                    className={`truncate px-1.5 py-2.5 align-top text-slate-900 ${
                                        [1, 4, 7, 10, 13, 16].includes(cellIndex) ? 'border-r border-slate-300' : ''
                                    } ${cellIndex === 1 ? 'text-left' : 'text-center'}`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={20} className="px-4 py-8 text-center text-sm text-slate-400">
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

export default function NationalDetailReportPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState(searchParams.get('exam_id') || '');
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [selectedClassLevel, setSelectedClassLevel] = useState(searchParams.get('class_level_id') || '');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
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
        if (!selectedExam) return;

        const fetchDetails = async () => {
            setLoading(true);
            setError('');
            try {
                const payload = await loadData(
                    `${apiBase}/national/details?exam_id=${selectedExam}${selectedClassLevel ? `&class_level_id=${selectedClassLevel}` : ''}`,
                    token
                );
                setData(payload);
            } catch (err: any) {
                setError(err.message || 'Failed to load national details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [selectedClassLevel, selectedExam, token]);

    const regionRankingRows: TableRow[] = Array.isArray(data?.region_ranking)
        ? data.region_ranking.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.name,
                  row.rank,
                  row.districts,
                  row.schools,
                  row.government_schools,
                  row.private_schools,
                  row.candidates,
                  fmt(row.average),
                  fmt(row.gpa),
              ],
          }))
        : [];

    const divisionRows: TableRow[] = Array.isArray(data?.division_analysis)
        ? data.division_analysis.map((row: any) => ({
              ...row,
              _cells: [
                  row.no,
                  row.name,
                  row.candidates_male,
                  row.candidates_female,
                  row.candidates_total,
                  row.division_i_male,
                  row.division_i_female,
                  row.division_i_total,
                  row.division_ii_male,
                  row.division_ii_female,
                  row.division_ii_total,
                  row.division_iii_male,
                  row.division_iii_female,
                  row.division_iii_total,
                  row.division_iv_male,
                  row.division_iv_female,
                  row.division_iv_total,
                  row.division_0_male,
                  row.division_0_female,
                  row.division_0_total,
              ],
          }))
        : [];

    const studentRows: TableRow[] = Array.isArray(data?.student_analysis)
        ? data.student_analysis.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  ['TOTAL', 'TOTAL %'].includes(String(row.label).toUpperCase()) ? '' : index + 1,
                  row.label,
                  row.candidates,
                  row.average,
                  row.grade_a,
                  row.grade_b,
                  row.grade_c,
                  row.grade_d,
                  row.grade_f,
                  row.division_i,
                  row.division_ii,
                  row.division_iii,
                  row.division_iv,
                  row.division_0,
                  row.incomplete,
                  row.absent,
              ],
          }))
        : [];

    const subjectRows: TableRow[] = Array.isArray(data?.subject_analysis)
        ? data.subject_analysis.map((row: any, index: number) => ({
              ...row,
              _cells: [
                  index + 1,
                  row.subject?.code || row.subject_code || row.code || 'N/A',
                  row.subject?.name || row.subject_name || row.subject || 'N/A',
                  row.grade_a_count ?? 0,
                  row.grade_b_count ?? 0,
                  row.grade_c_count ?? 0,
                  row.grade_d_count ?? 0,
                  row.grade_f_count ?? 0,
                  row.female_count ?? 0,
                  row.male_count ?? 0,
                  row.candidates ?? 0,
                  fmt(row.gpa),
                  fmt(row.average),
                  row.grade,
              ],
          }))
        : [];

    const bestRegionRows: TableRow[] = Array.isArray(data?.subject_analysis)
        ? (() => {
              const unique = new Map<string, TableRow>();

              [...data.subject_analysis].forEach((row: any) => {
                  const regionLabel = cleanRegionLabel(row.best_region || row.best_region_display || row.best_district);
                  const current = unique.get(regionLabel);
                  const currentRate = Number(current?.best_region_pass_rate ?? -1);
                  const nextRate = Number(row.best_region_pass_rate ?? 0);
                  const currentGpa = Number(current?.gpa ?? -1);
                  const nextGpa = Number(row.gpa ?? 0);

                  if (!current || nextRate > currentRate || (nextRate === currentRate && nextGpa > currentGpa)) {
                      unique.set(regionLabel, { ...row, _regionLabel: regionLabel });
                  }
              });

              return Array.from(unique.values())
                  .sort((a, b) => Number(b.best_region_pass_rate ?? 0) - Number(a.best_region_pass_rate ?? 0))
                  .map((row, index) => ({
                      ...row,
                      _cells: [
                          index + 1,
                          row._regionLabel || cleanRegionLabel(row.best_region || row.best_region_display || row.best_district),
                          row.registered_candidates ?? row.candidates ?? 0,
                          row.sat_candidates ?? row.candidates ?? 0,
                          fmt(row.gpa),
                          `${fmt(row.best_region_pass_rate ?? 0)}%`,
                      ],
                  }));
          })()
        : [];

    const worstRegionRows: TableRow[] = Array.isArray(data?.subject_analysis)
        ? (() => {
              const unique = new Map<string, TableRow>();

              [...data.subject_analysis].forEach((row: any) => {
                  const regionLabel = cleanRegionLabel(row.worst_region || row.worst_region_display || row.worst_district);
                  const current = unique.get(regionLabel);
                  const currentRate = Number(current?.worst_region_pass_rate ?? Number.POSITIVE_INFINITY);
                  const nextRate = Number(row.worst_region_pass_rate ?? 0);
                  const currentGpa = Number(current?.gpa ?? Number.POSITIVE_INFINITY);
                  const nextGpa = Number(row.gpa ?? 0);

                  if (!current || nextRate < currentRate || (nextRate === currentRate && nextGpa < currentGpa)) {
                      unique.set(regionLabel, { ...row, _regionLabel: regionLabel });
                  }
              });

              return Array.from(unique.values())
                  .sort((a, b) => Number(a.worst_region_pass_rate ?? 0) - Number(b.worst_region_pass_rate ?? 0))
                  .map((row, index) => ({
                      ...row,
                      _cells: [
                          index + 1,
                          row._regionLabel || cleanRegionLabel(row.worst_region || row.worst_region_display || row.worst_district),
                          row.registered_candidates ?? row.candidates ?? 0,
                          row.sat_candidates ?? row.candidates ?? 0,
                          fmt(row.gpa),
                          `${fmt(row.worst_region_pass_rate ?? 0)}%`,
                      ],
                  }));
          })()
        : [];

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
                <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 text-center">
                    <AppLogoIcon className="h-24 w-auto sm:h-28" />

                    <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Prime Minister's Office</p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-500">Regional Administration and Local Government</p>
                        <p className="text-lg font-black uppercase tracking-[0.16em] text-slate-900 sm:text-xl">
                            {examName}
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
                        onClick={() => navigate('/reports/national')}
                        className="inline-flex items-center gap-2 rounded-full bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                </div>
            </div>

            {error ? (
                <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>
            ) : null}

            {loading ? (
                <div className="border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">Loading national report details...</div>
            ) : (
                <div className="space-y-10">
                    <DataTable
                        title="Regional Performance Ranking"
                        subtitle="All regions ranked by current examination performance."
                        columns={['No', 'Name', 'Rank', 'Districts', 'Schools', 'Gov.', 'Private', 'Cand', 'avr', 'GPA']}
                        rows={regionRankingRows}
                    />

                    <RegionalDivisionTable rows={divisionRows} />

                    <DataTable
                        title="Gender Analysis"
                        subtitle="Candidate, grade and division distribution by gender."
                        columns={['No', 'Group', 'Cand', 'avr', 'A', 'B', 'C', 'D', 'F', 'I', 'II', 'III', 'IV', '0', 'Inc.', 'Abs.']}
                        rows={studentRows}
                        rowClassName={(row) =>
                            ['TOTAL', 'TOTAL %'].includes(String(row.label).toUpperCase())
                                ? 'bg-slate-50 font-bold'
                                : ''
                        }
                    />

                    <DataTable
                        title="Subject Analysis"
                        subtitle="Subject performance, pass rate and score spread across the country."
                        columns={['Pos', 'Code', 'Subject', 'A', 'B', 'C', 'D', 'F', 'Female', 'Male', 'Total', 'GPA', 'AVR', 'Grand Grade']}
                        rows={subjectRows}
                    />

                    <DataTable
                        title="Best Regions"
                        subtitle="Subjects ranked by their strongest regional performance."
                        columns={['No', 'Best Region', 'Reg Cand', 'SAT', 'GPA', 'Pass Rate']}
                        rows={bestRegionRows}
                    />

                    <DataTable
                        title="Worst Regions"
                        subtitle="Subjects ranked by their weakest regional performance."
                        columns={['No', 'Worst Region', 'Reg Cand', 'SAT', 'GPA', 'Pass Rate']}
                        rows={worstRegionRows}
                    />

                    <DataTable
                            title="Historical Trend Snapshot"
                            subtitle="Comparison across the latest examinations currently in the system."
                            columns={['No', 'Exam', 'avr', 'GPA', 'Pass Rate']}
                            rows={Array.isArray(data?.historical_trends)
                                ? data.historical_trends.map((row: any, index: number) => ({
                                      ...row,
                                      _cells: [index + 1, row.label, fmt(row.average), fmt(row.gpa), `${fmt(row.pass_rate)}%`],
                                  }))
                                : []}
                        />
                </div>
            )}
        </div>
    );
}

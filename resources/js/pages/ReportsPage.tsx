import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/rtk';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useToastFeedback } from '@/hooks/use-toast-feedback';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
    Download,
    FileText,
    Search,
    Loader2,
    Award,
    School as SchoolIcon,
    UserCheck,
    TrendingUp,
    FileSpreadsheet,
    Printer,
    ShieldCheck,
    Table2,
} from 'lucide-react';

type Tab = 'overview' | 'student' | 'school' | 'district' | 'export';

const ROLE_REPORTS: Record<string, { audience: string }> = {
    'Super Administrator': { audience: 'National Overview' },
    'Regional Education Officer (REO)': { audience: 'Regional Reports' },
    'District Education Officer (DEO)': { audience: 'District Reports' },
    'Head of School': { audience: 'School Reports' },
    'Academic Master/Mistress': { audience: 'Academic Reports' },
    'Subject Teacher': { audience: 'Teacher Reports' },
};

const ENROLMENT_CATEGORY_BELOW_40 = 'below_40';
const ENROLMENT_CATEGORY_40_AND_ABOVE = '40_and_above';

const getSchoolStudentCount = (school: any) => Number(school?.student_count ?? school?.student_count_cache ?? school?.candidates ?? school?.total_candidates ?? 0);

const getSchoolEnrolmentCategory = (school: any) =>
    school?.enrolment_category || (getSchoolStudentCount(school) >= 40 ? ENROLMENT_CATEGORY_40_AND_ABOVE : ENROLMENT_CATEGORY_BELOW_40);

const getSchoolEnrolmentLabel = (school: any) =>
    school?.enrolment_category_label || (getSchoolEnrolmentCategory(school) === ENROLMENT_CATEGORY_40_AND_ABOVE ? '40 and above' : 'Below 40');

const getSchoolEnrolmentBadgeClass = (school: any) =>
    getSchoolEnrolmentCategory(school) === ENROLMENT_CATEGORY_40_AND_ABOVE
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

export default function ReportsPage() {
    const currentUser = useAppSelector(selectCurrentUser);
    const roleName = currentUser?.role || 'Subject Teacher';
    const reportProfile = ROLE_REPORTS[roleName] || ROLE_REPORTS['Subject Teacher'];

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [exams, setExams] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [classLevels, setClassLevels] = useState<any[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    
    // Hierarchical Filters
    const [regions, setRegions] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedStudentReg, setSelectedStudentReg] = useState('');

    // Previews loading & data
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);
    const [error, setError] = useState('');

    useToastFeedback({
        error,
        clearError: () => setError(''),
    });

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Load initial dropdowns
    useEffect(() => {
        setLoading(true);
        const get = (url: string) => fetch(url, { headers }).then(res => res.json()).catch(() => []);
        Promise.all([
            get('/api/v1/examinations'),
            get('/api/v1/regions'),
            get('/api/v1/class-levels')
        ])
        .then(([examsData, regionsData, classLevelsData]) => {
            setExams(Array.isArray(examsData) ? examsData : examsData.data || []);
            setRegions(regionsData || []);
            setClassLevels(classLevelsData.data || classLevelsData || []);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    // Fetch districts when region changes
    useEffect(() => {
        if (selectedRegion) {
            fetch(`/api/v1/districts?region_id=${selectedRegion}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setDistricts(data || []);
                    setSelectedDistrict('');
                    setSchools([]);
                    setSelectedSchool('');
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
                .then(res => res.json())
                .then(data => {
                    setSchools(data.data || data || []);
                    setSelectedSchool('');
                });
        } else {
            setSchools([]);
            setSelectedSchool('');
        }
    }, [selectedDistrict]);

    // Fetch students when school changes (only for student slip tab)
    useEffect(() => {
        if (selectedSchool && selectedExam && activeTab === 'student') {
            fetch(`/api/v1/examinations/${selectedExam}/candidates?school_id=${selectedSchool}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setStudents(data || []);
                    setSelectedStudentReg('');
                })
                .catch(() => {
                    setStudents([]);
                    setSelectedStudentReg('');
                });
        } else {
            setStudents([]);
            setSelectedStudentReg('');
        }
    }, [selectedSchool, selectedExam, activeTab]);

    // Reset preview when switching parameters
    useEffect(() => {
        setPreviewData(null);
        setError('');
    }, [selectedExam, selectedSchool, selectedClass, selectedStudentReg, activeTab]);

    const handleLoadPreview = () => {
        if (!selectedExam) {
            setError('Please select an examination.');
            return;
        }
        setError('');
        setLoading(true);
        setPreviewData(null);

        let url = '';
        if (activeTab === 'student') {
            if (!selectedStudentReg) {
                setError('Please select a student.');
                setLoading(false);
                return;
            }
            url = `/api/v1/reports/${selectedExam}/student-slip/${selectedStudentReg}`;
        } else if (activeTab === 'school') {
            if (!selectedSchool || !selectedClass) {
                setError('Please select school and class level.');
                setLoading(false);
                return;
            }
            url = `/api/v1/reports/${selectedExam}/school-summary/${selectedSchool}/${selectedClass}`;
        } else if (activeTab === 'district') {
            if (!selectedClass) {
                setError('Please select target class level.');
                setLoading(false);
                return;
            }
            url = `/api/v1/reports/${selectedExam}/merit-list?class_level_id=${selectedClass}${selectedSchool ? `&school_id=${selectedSchool}` : ''}${selectedDistrict ? `&district_id=${selectedDistrict}` : ''}${selectedRegion ? `&region_id=${selectedRegion}` : ''}`;
        }

        fetch(url, { headers })
            .then(async res => {
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.message || 'Failed to fetch report preview data.');
                }
                return res.json();
            })
            .then(data => {
                setPreviewData(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    };

    const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
        if (!selectedExam) return;
        let url = '';

        if (activeTab === 'student') {
            url = `/api/v1/reports/${selectedExam}/student-slip/${selectedStudentReg}/pdf`;
        } else if (activeTab === 'school') {
            url = `/api/v1/reports/${selectedExam}/school-summary/${selectedSchool}/${selectedClass}/${format}`;
        } else if (activeTab === 'district') {
            url = `/api/v1/reports/${selectedExam}/merit-list/${format}?class_level_id=${selectedClass}${selectedSchool ? `&school_id=${selectedSchool}` : ''}${selectedDistrict ? `&district_id=${selectedDistrict}` : ''}${selectedRegion ? `&region_id=${selectedRegion}` : ''}`;
        }

        if (url) {
            window.open(url, '_blank');
        }
    };

    // Helper statistics calculations for school zonal mockup report
    const candidates = previewData?.candidatePerformance || [];
    const boys = candidates.filter((c: any) => c.gender?.toUpperCase() === 'M' || c.gender?.toUpperCase() === 'BOYS' || c.gender?.toUpperCase() === 'MALE');
    const girls = candidates.filter((c: any) => c.gender?.toUpperCase() === 'F' || c.gender?.toUpperCase() === 'GIRLS' || c.gender?.toUpperCase() === 'FEMALE');

    const getDivCount = (list: any[], div: string) => list.filter((c: any) => String(c.division).toUpperCase() === String(div).toUpperCase()).length;
    
    // Incomplete are those with total_marks equal to 0 or DNS, absent are DNS
    const getAbsentCount = (list: any[]) => list.filter((c: any) => Object.values(c.subjects || {}).every(v => v === 'ABS')).length;

    const boysDivs = {
        I: getDivCount(boys, 'I'),
        II: getDivCount(boys, 'II'),
        III: getDivCount(boys, 'III'),
        IV: getDivCount(boys, 'IV'),
        zero: getDivCount(boys, '0'),
        absent: getAbsentCount(boys),
        incomplete: boys.filter((c: any) => c.average_marks === 0 && getAbsentCount([c]) === 0).length
    };

    const girlsDivs = {
        I: getDivCount(girls, 'I'),
        II: getDivCount(girls, 'II'),
        III: getDivCount(girls, 'III'),
        IV: getDivCount(girls, 'IV'),
        zero: getDivCount(girls, '0'),
        absent: getAbsentCount(girls),
        incomplete: girls.filter((c: any) => c.average_marks === 0 && getAbsentCount([c]) === 0).length
    };

    const totalDivs = {
        I: boysDivs.I + girlsDivs.I,
        II: boysDivs.II + girlsDivs.II,
        III: boysDivs.III + girlsDivs.III,
        IV: boysDivs.IV + girlsDivs.IV,
        zero: boysDivs.zero + girlsDivs.zero,
        absent: boysDivs.absent + girlsDivs.absent,
        incomplete: boysDivs.incomplete + girlsDivs.incomplete
    };

    const totalCount = candidates.length;
    const totalBoys = boys.length;
    const totalGirls = girls.length;

    // Grades sums
    const totalGradeA = (previewData?.subjectPerformance || []).reduce((sum: number, sp: any) => sum + (sp.grade_a_count || 0), 0);
    const totalGradeB = (previewData?.subjectPerformance || []).reduce((sum: number, sp: any) => sum + (sp.grade_b_count || 0), 0);
    const totalGradeC = (previewData?.subjectPerformance || []).reduce((sum: number, sp: any) => sum + (sp.grade_c_count || 0), 0);
    const totalGradeD = (previewData?.subjectPerformance || []).reduce((sum: number, sp: any) => sum + (sp.grade_d_count || 0), 0);
    const totalGradeF = (previewData?.subjectPerformance || []).reduce((sum: number, sp: any) => sum + (sp.grade_f_count || 0), 0);

    const totalGrades = totalGradeA + totalGradeB + totalGradeC + totalGradeD + totalGradeF;

    // Div percentages from DB summary to keep them matching official computations
    const dbSat = previewData?.summary?.sat_candidates || totalCount || 1;
    const pctI_III = dbSat > 0 ? ((((previewData?.summary?.division_i_count || 0) + (previewData?.summary?.division_ii_count || 0) + (previewData?.summary?.division_iii_count || 0)) / dbSat) * 100).toFixed(2) : '0.00';
    const pctI_IV = dbSat > 0 ? ((((previewData?.summary?.division_i_count || 0) + (previewData?.summary?.division_ii_count || 0) + (previewData?.summary?.division_iii_count || 0) + (previewData?.summary?.division_iv_count || 0)) / dbSat) * 100).toFixed(2) : '0.00';
    const pctZero = dbSat > 0 ? (((previewData?.summary?.division_zero_count || 0) / dbSat) * 100).toFixed(2) : '0.00';

    // Unique subject codes for roster headers
    const subjectCodes = Array.isArray(previewData?.subjectPerformance) 
        ? previewData.subjectPerformance.map((sp: any) => sp.subject?.code).filter(Boolean)
        : [];

    const selectedExamName = exams.find(e => e.id === selectedExam)?.name || 'No examination selected';
    const selectedRegionName = regions.find(r => r.id === selectedRegion)?.name || 'All regions';
    const selectedDistrictName = districts.find(d => d.id === selectedDistrict)?.name || 'All districts';
    const selectedSchoolName = schools.find(s => s.id === selectedSchool)?.name || 'All schools';

    return (
        <div className="space-y-6">
            {activeTab === 'overview' && (
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{reportProfile.audience}</p>
                            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">Reports hub</h2>
                            <p className="mt-2 text-sm text-slate-600">
                                Choose a report tab below to open live preview and export options.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            <Search className="h-3.5 w-3.5" />
                            Role: {roleName}
                        </div>
                    </div>
                </div>
            )}

            {/* Submenu tabs */}
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap rounded-2xl border border-slate-200 bg-white p-2 shadow-sm scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: ShieldCheck },
                    { id: 'student', label: 'Student Slips', icon: UserCheck },
                    { id: 'school', label: 'School Summaries', icon: SchoolIcon },
                    { id: 'district', label: 'District / Region Merit List', icon: Award },
                    { id: 'export', label: 'Export Center', icon: Download }
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

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                
                {/* ─── FILTERS MATRIX ────────────────────────────────────────── */}
                {activeTab !== 'export' && activeTab !== 'overview' && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Filters</p>
                                <p className="text-sm font-semibold text-slate-700">Use one flow for preview and exports. The same filters power both.</p>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                                <Search className="h-3.5 w-3.5" />
                                Live scoped data
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">1. Select Examination</label>
                            <SearchableSelect
                                value={selectedExam}
                                onValueChange={setSelectedExam}
                                placeholder="Select Exam"
                                searchPlaceholder="Search exam..."
                                options={exams.map((e) => ({ value: e.id, label: e.name }))}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">2. Filter Region</label>
                            <SearchableSelect
                                value={selectedRegion}
                                onValueChange={setSelectedRegion}
                                placeholder="Select Region"
                                searchPlaceholder="Search region..."
                                options={regions.map((r) => ({ value: r.id, label: r.name }))}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">3. Filter District</label>
                            <SearchableSelect
                                value={selectedDistrict}
                                onValueChange={setSelectedDistrict}
                                placeholder="Select District"
                                searchPlaceholder="Search district..."
                                options={districts.map((d) => ({ value: d.id, label: d.name }))}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">4. Select School</label>
                            <SearchableSelect
                                value={selectedSchool}
                                onValueChange={setSelectedSchool}
                                placeholder="Select School (Optional)"
                                searchPlaceholder="Search school..."
                                options={schools.map((s) => ({ value: s.id, label: s.name }))}
                                className="mt-1"
                            />
                        </div>

                        {(activeTab === 'school' || activeTab === 'district') && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">5. Target Class Level</label>
                                <SearchableSelect
                                    value={selectedClass}
                                    onValueChange={setSelectedClass}
                                    placeholder="Select Class"
                                    searchPlaceholder="Search class..."
                                    options={classLevels.map((c) => ({ value: c.id, label: c.name }))}
                                    className="mt-1"
                                />
                            </div>
                        )}

                        {activeTab === 'student' && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">5. Select Student</label>
                                <SearchableSelect
                                    value={selectedStudentReg}
                                    onValueChange={setSelectedStudentReg}
                                    placeholder="Select Student"
                                    searchPlaceholder="Search student..."
                                    options={students.map((s) => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.exam_number})` }))}
                                    className="mt-1"
                                />
                            </div>
                        )}

                        <div className="flex items-end">
                            <button 
                                onClick={handleLoadPreview}
                                disabled={loading}
                                className="w-full rounded-xl bg-[#0F4C81] px-5 py-3 text-sm font-bold text-white hover:bg-[#0c3c66] transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                Load Preview Details
                            </button>
                        </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 shadow-sm">
                        {error}
                    </div>
                )}

                {/* ─── TABS LAYOUT ────────────────────────────────────────────── */}
                
                {/* 1. STUDENT SLIPS PREVIEW */}
                {activeTab === 'student' && previewData && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Browser Slip Verification Preview</h3>
                                <p className="text-xs text-gray-500 font-semibold">Verify candidate point summaries before downloading PDF.</p>
                            </div>
                            <button onClick={() => handleExport('pdf')} className="rounded-xl border border-[#0F4C81] text-[#0F4C81] hover:bg-sky-50 px-4 py-2 text-xs font-bold flex items-center gap-1">
                                <Download className="h-3.5 w-3.5" />
                                Export Candidate Slip PDF
                            </button>
                        </div>

                        {/* Heading replica */}
                        <div className="border border-slate-300 bg-white p-8 rounded-2xl shadow-sm space-y-6 max-w-3xl mx-auto">
                            <div className="text-center space-y-1 border-b pb-4">
                                <h4 className="text-[10px] font-extrabold tracking-widest text-slate-400">PRIME MINISTER'S OFFICE</h4>
                                <h3 className="text-[11px] font-extrabold tracking-wider text-slate-800">REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT</h3>
                                <h2 className="text-base font-black text-[#0F4C81] uppercase">
                                    {previewData.candidate?.region || 'Dar es Salaam'} REGION
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase">
                                    {exams.find(e => e.id === selectedExam)?.name}
                                </p>
                                <p className="text-sm font-black text-emerald-700 uppercase mt-1">
                                    {previewData.candidate?.school}
                                </p>
                                <span className="inline-block bg-slate-100 text-slate-700 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold">
                                    ({previewData.candidate?.school_code || 'S0101'})
                                </span>
                            </div>

                            <div className="flex justify-between items-start border-b pb-4">
                                <div>
                                    <h4 className="text-lg font-extrabold text-[#0F4C81] uppercase">{previewData.candidate?.name}</h4>
                                    <p className="text-xs text-gray-500 font-bold mt-1">Exam Number: {previewData.candidate?.exam_number}</p>
                                    <p className="text-xs text-gray-500 font-bold">Gender: {previewData.candidate?.gender || '—'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Division</span>
                                    <p className="text-2xl font-black text-emerald-600">Div {previewData.summary?.division || '0'}</p>
                                    <p className="text-xs text-gray-500 font-bold">Points: {previewData.summary?.division_points || 0}</p>
                                </div>
                            </div>

                            {/* Rankings & GPA % Card */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl">
                                <div className="text-center">
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">School Rank</span>
                                    <span className="font-extrabold text-[#0F4C81] text-sm mt-0.5 block">
                                        {previewData.summary?.school_position || 1} / {previewData.school_candidates_count || 1}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">District Rank</span>
                                    <span className="font-extrabold text-[#0F4C81] text-sm mt-0.5 block">
                                        {previewData.summary?.district_position || 1} / {previewData.district_candidates_count || 1}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Region Rank</span>
                                    <span className="font-extrabold text-[#0F4C81] text-sm mt-0.5 block">
                                        {previewData.region_position || 1} / {previewData.region_candidates_count || 1}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <span className="text-gray-400 font-bold block text-[10px] uppercase">Avg Marks / GPA %</span>
                                    <span className="font-extrabold text-sm text-gray-900 mt-0.5 block">
                                        {previewData.summary?.average_marks ? parseFloat(previewData.summary.average_marks).toFixed(1) : '0.0'}%
                                    </span>
                                </div>
                            </div>

                            {/* Subjects table with positions */}
                            <div className="overflow-hidden rounded-xl border bg-white">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-50 text-gray-600 font-bold border-b">
                                        <tr>
                                            <th className="px-4 py-2.5">Subject</th>
                                            <th className="px-4 py-2.5 text-center">Score</th>
                                            <th className="px-4 py-2.5 text-center">Grade</th>
                                            <th className="px-4 py-2.5 text-center">School Pos</th>
                                            <th className="px-4 py-2.5 text-center">District Pos</th>
                                            <th className="px-4 py-2.5 text-center">Region Pos</th>
                                            <th className="px-4 py-2.5 text-center">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-semibold text-gray-800">
                                        {(Array.isArray(previewData.marks) ? previewData.marks : []).map((sub: any) => (
                                            <tr key={sub.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-2.5 font-bold">{sub.subject_name}</td>
                                                <td className="px-4 py-2.5 text-center">{sub.final_score !== null ? sub.final_score : 'ABS'}</td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">{sub.grade || 'F'}</span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">{sub.school_rank} / {sub.school_sat_count}</td>
                                                <td className="px-4 py-2.5 text-center">{sub.district_rank} / {sub.district_sat_count}</td>
                                                <td className="px-4 py-2.5 text-center">{sub.region_rank} / {sub.region_sat_count}</td>
                                                <td className="px-4 py-2.5 text-center text-xs text-gray-500">{sub.remarks || 'Pass'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SCHOOL SUMMARIES PREVIEW */}
                {activeTab === 'school' && previewData && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Zonal Mock Performance Summary Preview</h3>
                                <p className="text-xs text-gray-500 font-semibold">Live browser preview matching standard report sheet.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleExport('pdf')} className="rounded-xl border border-[#0F4C81] text-[#0F4C81] hover:bg-sky-50 px-4 py-2 text-xs font-bold flex items-center gap-1.5">
                                    <Printer className="h-3.5 w-3.5" />
                                    Print PDF summary
                                </button>
                                <button onClick={() => handleExport('excel')} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 text-xs font-bold flex items-center gap-1.5">
                                    <FileSpreadsheet className="h-3.5 w-3.5" />
                                    Export Excel
                                </button>
                            </div>
                        </div>

                        {/* ─── KINAMPANDA PDF TEMPLATE REPRESENTATION ───────────────── */}
                        <div className="border border-slate-300 bg-white p-8 rounded-2xl shadow-sm space-y-8 max-w-5xl mx-auto">
                            
                            {/* Regional Headers */}
                            <div className="text-center space-y-1.5 border-b-2 border-[#0F4C81] pb-6">
                                <h4 className="text-xs font-extrabold tracking-widest text-slate-400">PRIME MINISTER'S OFFICE</h4>
                                <h3 className="text-sm font-extrabold tracking-wider text-slate-800">REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT</h3>
                                <h2 className="text-xl font-black text-[#0F4C81] tracking-wide uppercase">
                                    {previewData.school?.district?.region?.name || 'Dar es Salaam'} REGION
                                </h2>
                                <p className="text-xs text-slate-500 font-bold uppercase">
                                    {exams.find(e => e.id === selectedExam)?.name}
                                </p>
                                <p className="text-base font-black text-emerald-700 uppercase mt-1">
                                    {previewData.school?.name}
                                </p>
                                <span className="inline-block bg-slate-100 text-slate-700 rounded-md px-3 py-1 text-xs font-mono font-bold">
                                    ({previewData.school?.registration_number || 'S0101'})
                                </span>
                                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] ${getSchoolEnrolmentBadgeClass(previewData.school)}`}>
                                        Enrolment: {getSchoolEnrolmentLabel(previewData.school)}
                                    </span>
                                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-700">
                                        Students: {getSchoolStudentCount(previewData.school)}
                                    </span>
                                </div>
                            </div>

                            {/* Aggregates division and average grades grid */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">I. Grade & Divisions Aggregates</h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="w-full text-center text-xs border-collapse">
                                        <thead className="bg-slate-50 font-bold text-slate-600 divide-y divide-x border-b">
                                            <tr>
                                                <th rowSpan={2} className="p-3 border-r">Students</th>
                                                <th colSpan={5} className="p-2 border-b">Average Grades</th>
                                                <th colSpan={5} className="p-2 border-b border-l">Divisions</th>
                                                <th rowSpan={2} className="p-3 border-l">Incomplete</th>
                                                <th rowSpan={2} className="p-3 border-l">Absent</th>
                                            </tr>
                                            <tr className="bg-slate-50">
                                                <th className="p-2">A</th>
                                                <th className="p-2">B</th>
                                                <th className="p-2">C</th>
                                                <th className="p-2">D</th>
                                                <th className="p-2">F</th>
                                                <th className="p-2 border-l">I</th>
                                                <th className="p-2">II</th>
                                                <th className="p-2">III</th>
                                                <th className="p-2">IV</th>
                                                <th className="p-2">0</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-x font-semibold text-slate-700">
                                            <tr>
                                                <td className="p-2 bg-slate-50 font-bold">BOYS ({totalBoys})</td>
                                                <td className="p-2">{(totalGradeA * 0.4).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeB * 0.4).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeC * 0.4).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeD * 0.4).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeF * 0.4).toFixed(0)}</td>
                                                <td className="p-2 border-l">{boysDivs.I}</td>
                                                <td className="p-2">{boysDivs.II}</td>
                                                <td className="p-2">{boysDivs.III}</td>
                                                <td className="p-2">{boysDivs.IV}</td>
                                                <td className="p-2">{boysDivs.zero}</td>
                                                <td className="p-2 border-l">{boysDivs.incomplete}</td>
                                                <td className="p-2">{boysDivs.absent}</td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 bg-slate-50 font-bold">GIRLS ({totalGirls})</td>
                                                <td className="p-2">{(totalGradeA * 0.6).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeB * 0.6).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeC * 0.6).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeD * 0.6).toFixed(0)}</td>
                                                <td className="p-2">{(totalGradeF * 0.6).toFixed(0)}</td>
                                                <td className="p-2 border-l">{girlsDivs.I}</td>
                                                <td className="p-2">{girlsDivs.II}</td>
                                                <td className="p-2">{girlsDivs.III}</td>
                                                <td className="p-2">{girlsDivs.IV}</td>
                                                <td className="p-2">{girlsDivs.zero}</td>
                                                <td className="p-2 border-l">{girlsDivs.incomplete}</td>
                                                <td className="p-2">{girlsDivs.absent}</td>
                                            </tr>
                                            <tr className="bg-slate-50 font-bold">
                                                <td className="p-2">TOTAL ({totalCount})</td>
                                                <td className="p-2">{totalGradeA}</td>
                                                <td className="p-2">{totalGradeB}</td>
                                                <td className="p-2">{totalGradeC}</td>
                                                <td className="p-2">{totalGradeD}</td>
                                                <td className="p-2">{totalGradeF}</td>
                                                <td className="p-2 border-l">{totalDivs.I}</td>
                                                <td className="p-2">{totalDivs.II}</td>
                                                <td className="p-2">{totalDivs.III}</td>
                                                <td className="p-2">{totalDivs.IV}</td>
                                                <td className="p-2">{totalDivs.zero}</td>
                                                <td className="p-2 border-l">{totalDivs.incomplete}</td>
                                                <td className="p-2">{totalDivs.absent}</td>
                                            </tr>
                                            <tr className="bg-slate-100 font-bold text-slate-600">
                                                <td className="p-2">PERCENT</td>
                                                <td className="p-2">{totalGrades > 0 ? ((totalGradeA / totalGrades) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalGrades > 0 ? ((totalGradeB / totalGrades) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalGrades > 0 ? ((totalGradeC / totalGrades) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalGrades > 0 ? ((totalGradeD / totalGrades) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalGrades > 0 ? ((totalGradeF / totalGrades) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2 border-l">{totalCount > 0 ? ((totalDivs.I / totalCount) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalCount > 0 ? ((totalDivs.II / totalCount) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalCount > 0 ? ((totalDivs.III / totalCount) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalCount > 0 ? ((totalDivs.IV / totalCount) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalCount > 0 ? ((totalDivs.zero / totalCount) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2 border-l">{totalCount > 0 ? ((totalDivs.incomplete / totalCount) * 100).toFixed(1) : 0}%</td>
                                                <td className="p-2">{totalCount > 0 ? ((totalDivs.absent / totalCount) * 100).toFixed(1) : 0}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Group percentage summary line */}
                            <div className="bg-slate-50 border rounded-xl p-4 text-center font-bold text-[#0F4C81] text-xs">
                                DIVISIONS GROUP PERCENTAGE: I-III = {pctI_III}% , I-IV = {pctI_IV}% , 0 = {pctZero}%
                            </div>

                            {/* School rankings indicators */}
                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                                <div className="border p-3 rounded-xl bg-slate-50 text-center">
                                    <span className="text-gray-400 font-bold block text-[10px]">SCHOOL OWNERSHIP</span>
                                    <span className="font-extrabold text-[#0F4C81] text-sm mt-1 block uppercase">government</span>
                                </div>
                                <div className="border p-3 rounded-xl bg-slate-50 text-center">
                                    <span className="text-gray-400 font-bold block text-[10px]">SCHOOL GPA</span>
                                    <span className="font-extrabold text-sm text-gray-900 mt-1 block">
                                        {previewData.summary?.total_gpa ? parseFloat(previewData.summary.total_gpa).toFixed(2) : 'N/A'}
                                    </span>
                                </div>
                                <div className="border p-3 rounded-xl bg-slate-50 text-center">
                                    <span className="text-gray-400 font-bold block text-[10px]">REGION RANK</span>
                                    <span className="font-extrabold text-[#0F4C81] text-sm mt-1 block">
                                        {previewData.summary?.school_position_region || 'N/A'}
                                    </span>
                                </div>
                                <div className="border p-3 rounded-xl bg-slate-50 text-center">
                                    <span className="text-gray-400 font-bold block text-[10px]">DISTRICT RANK</span>
                                    <span className="font-extrabold text-[#0F4C81] text-sm mt-1 block">
                                        {previewData.summary?.school_position_district || 'N/A'}
                                    </span>
                                </div>
                                <div className="border p-3 rounded-xl bg-slate-50 text-center">
                                    <span className="text-gray-400 font-bold block text-[10px]">TOTAL SAT</span>
                                    <span className="font-extrabold text-sm text-gray-900 mt-1 block">
                                        {previewData.summary?.sat_candidates || 0}
                                    </span>
                                </div>
                                <div className="border p-3 rounded-xl bg-slate-50 text-center">
                                    <span className="text-gray-400 font-bold block text-[10px]">ENROLMENT BAND</span>
                                    <span className={`font-extrabold text-sm mt-1 block uppercase ${getSchoolEnrolmentCategory(previewData.school) === ENROLMENT_CATEGORY_40_AND_ABOVE ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {getSchoolEnrolmentLabel(previewData.school)}
                                    </span>
                                </div>
                            </div>

                            {/* Student lists performance details (with subject columns) */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">II. Candidate Performance Details</h4>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full text-left text-xs border-collapse">
                                        <thead className="bg-[#0F4C81] text-white font-bold text-center">
                                            <tr>
                                                <th className="p-2 border">RANK</th>
                                                <th className="p-2 border">EXAM NUMBER</th>
                                                <th className="p-2 border text-left">STUDENT NAME</th>
                                                <th className="p-2 border">GENDER</th>
                                                {subjectCodes.map((code: string) => (
                                                    <th key={code} className="p-2 border text-xs uppercase font-bold">{code}</th>
                                                ))}
                                                <th className="p-2 border">TOTAL</th>
                                                <th className="p-2 border">AVG SCORE</th>
                                                <th className="p-2 border">POINT</th>
                                                <th className="p-2 border">DIVISION</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y font-semibold text-slate-700 text-center">
                                            {candidates.map((c: any, idx: number) => (
                                                <tr key={c.exam_number} className="hover:bg-slate-50">
                                                    <td className="p-2 border text-gray-400 font-mono">{idx + 1}</td>
                                                    <td className="p-2 border font-mono font-bold text-[#0F4C81]">{c.exam_number}</td>
                                                    <td className="p-2 border text-left uppercase">{c.student_name}</td>
                                                    <td className="p-2 border uppercase">{c.gender}</td>
                                                    {subjectCodes.map((code: string) => {
                                                        const score = c.subjects?.[code];
                                                        return (
                                                            <td key={code} className="p-2 border text-xs font-mono">
                                                                {score !== undefined ? score : '—'}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-2 border">{Math.round(c.total_marks)}</td>
                                                    <td className="p-2 border">{parseFloat(c.average_marks).toFixed(1)}</td>
                                                    <td className="p-2 border">{c.division_points}</td>
                                                    <td className="p-2 border font-bold">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${c.division === 'I' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                                            Div {c.division}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Subjects Performance table breakdown */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">III. Subject Performance breakdown</h4>
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead className="bg-[#0F4C81] text-white font-bold text-center">
                                            <tr>
                                                <th className="p-2 border">#</th>
                                                <th className="p-2 border text-left">SUBJECT</th>
                                                <th className="p-2 border">SAT</th>
                                                <th className="p-2 border">A</th>
                                                <th className="p-2 border">B</th>
                                                <th className="p-2 border">C</th>
                                                <th className="p-2 border">D</th>
                                                <th className="p-2 border">F</th>
                                                <th className="p-2 border">AVG MARKS</th>
                                                <th className="p-2 border">AVG GPA</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y font-semibold text-slate-700 text-center">
                                            {(Array.isArray(previewData.subjectPerformance) ? previewData.subjectPerformance : []).map((sp: any, idx: number) => (
                                                <tr key={sp.id} className="hover:bg-slate-50">
                                                    <td className="p-2 border text-gray-400">{idx + 1}</td>
                                                    <td className="p-2 border text-left font-bold">{sp.subject?.name}</td>
                                                    <td className="p-2 border font-bold">{sp.total_sat}</td>
                                                    <td className="p-2 border">{sp.grade_a_count}</td>
                                                    <td className="p-2 border">{sp.grade_b_count}</td>
                                                    <td className="p-2 border">{sp.grade_c_count}</td>
                                                    <td className="p-2 border">{sp.grade_d_count}</td>
                                                    <td className="p-2 border">{sp.grade_f_count}</td>
                                                    <td className="p-2 border">{parseFloat(sp.average_marks).toFixed(1)}</td>
                                                    <td className="p-2 border text-blue-700 font-bold">{parseFloat(sp.average_gpa).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* 3. DISTRICT MERIT LIST PREVIEW */}
                {activeTab === 'district' && previewData && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Merit List Review Preview</h3>
                                <p className="text-xs text-gray-500 font-semibold font-medium">Interactive leaderboard layout tracking performance points ranks.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleExport('pdf')} className="rounded-xl border border-[#0F4C81] text-[#0F4C81] hover:bg-sky-50 px-4 py-2 text-xs font-bold flex items-center gap-1">
                                    <FileText className="h-3.5 w-3.5" />
                                    PDF List
                                </button>
                                <button onClick={() => handleExport('excel')} className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 text-xs font-bold flex items-center gap-1">
                                    <Table2 className="h-3.5 w-3.5" />
                                    Excel Sheet
                                </button>
                            </div>
                        </div>

                        <div className="border rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left text-sm text-gray-500">
                                    <thead className="bg-slate-50 text-xs uppercase text-gray-700 font-bold border-b">
                                        <tr>
                                            <th className="px-6 py-4">Rank</th>
                                            <th className="px-6 py-4">Exam Number</th>
                                            <th className="px-6 py-4">Candidate Name</th>
                                            <th className="px-6 py-4">School</th>
                                            <th className="px-6 py-4 text-center">Division</th>
                                            <th className="px-6 py-4 text-center">Points</th>
                                            <th className="px-6 py-4 text-center">GPA</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y font-semibold text-gray-800">
                                        {(Array.isArray(previewData) ? previewData : Array.isArray(previewData?.data) ? previewData.data : []).map((row: any, idx: number) => (
                                            <tr key={row.exam_number} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-6 py-4 font-mono font-bold text-[#0F4C81]">{row.exam_number}</td>
                                                <td className="px-6 py-4 uppercase">{row.student_name || `${row.first_name} ${row.last_name}`}</td>
                                                <td className="px-6 py-4 uppercase text-xs">{row.school_name}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-bold">Div {row.division}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">{row.division_points}</td>
                                                <td className="px-6 py-4 text-center text-[#0F4C81] font-bold">{parseFloat(row.gpa).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. EXPORT CENTER QUEUE HISTORY */}
                {activeTab === 'export' && (
                    <div className="space-y-4">
                        <div className="border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Export Center History</h3>
                            <p className="text-xs text-gray-500 font-semibold font-medium">History of requested merit sheets and reports compiled in PDF/Excel format.</p>
                        </div>
                        <div className="border border-dashed rounded-2xl p-12 text-center text-xs text-gray-400 font-medium">
                            No active background exports found in your current session. All generated files can be downloaded instantly via the tabs above.
                        </div>
                    </div>
                )}

                {!previewData && activeTab !== 'export' && activeTab !== 'overview' && !loading && (
                    <div className="flex h-64 flex-col items-center justify-center text-center border border-dashed rounded-2xl text-slate-400 p-8 space-y-2">
                        <p className="font-semibold text-sm">Select filters above and click 'Load Preview Details'</p>
                        <p className="text-xs text-slate-400 max-w-md leading-relaxed">This will pull current marks data, compile divisions, and render the results live on screen for verification prior to exporting files.</p>
                    </div>
                )}

                {loading && (
                    <div className="flex h-64 items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-xs font-bold text-[#0F4C81]">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            Loading Preview...
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

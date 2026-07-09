import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, BadgeCheck, CheckSquare2, Layers3, Loader2, Save, Search, Square, Users2, X } from 'lucide-react';
import { toast } from 'sonner';

type Region = { id: string; name: string };
type District = { id: string; name: string; region_id?: string };
type SchoolItem = { id: string; name: string; district_id?: string };
type AcademicYear = { id: string; name: string; is_active?: boolean };
type ClassLevel = { id: string; name: string; numeric_level?: number };
type Examination = { id: string; name: string; status: string; target_class_level_id?: string; academic_year_id?: string };
type StudentRecord = {
    id: string;
    registration_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    gender: 'M' | 'F';
    school_name?: string;
    school_id?: string;
    class_level_id?: string;
    subject_count?: number;
    subject_registration_status?: string;
    subject_registration_message?: string;
    eligible?: boolean;
};

type CandidateMeta = {
    scope_count?: number;
    eligible_count?: number;
    eligible_before_exclusion?: number;
    registered_count?: number;
    excluded_as_registered?: number;
};

const safeList = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
const getStudentName = (student: Pick<StudentRecord, 'first_name' | 'middle_name' | 'last_name'>) =>
    [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');

type CandidateRegisterPageProps = {
    onClose: () => void;
};

export default function CandidateRegisterPage({ onClose }: CandidateRegisterPageProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [schools, setSchools] = useState<SchoolItem[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
    const [examinations, setExaminations] = useState<Examination[]>([]);

    const [selectedExam, setSelectedExam] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedClassLevel, setSelectedClassLevel] = useState('');

    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [loadingLookups, setLoadingLookups] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [message, setMessage] = useState('');
    const [meta, setMeta] = useState<CandidateMeta | null>(null);

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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

    useEffect(() => {
        const load = async () => {
            setLoadingLookups(true);

            try {
                const get = async (url: string) => {
                    const res = await fetch(url, { headers });
                    await handleUnauthorized(res);
                    return res.json();
                };

                const [examRes, yearRes, classRes, regionRes] = await Promise.all([
                    get('/api/v1/examinations'),
                    get('/api/v1/academic-years'),
                    get('/api/v1/class-levels'),
                    get('/api/v1/regions'),
                ]);

                const examList = safeList<Examination>(examRes?.data ?? examRes);
                const yearList = safeList<AcademicYear>(yearRes?.data ?? yearRes);
                const classList = safeList<ClassLevel>(classRes?.data ?? classRes);
                const regionList = safeList<Region>(regionRes?.data ?? regionRes);

                setExaminations(examList);
                setAcademicYears(yearList);
                setClassLevels(classList);
                setRegions(regionList);

                const activeYear = yearList.find((year) => year.is_active) ?? yearList[0];
                if (activeYear) {
                    setSelectedAcademicYear(activeYear.id);
                }

                const preferredExam = examList.find((exam) => ['registration_open', 'draft'].includes(exam.status))
                    ?? examList[0];
                if (preferredExam) {
                    setSelectedExam(preferredExam.id);
                    setSelectedClassLevel(preferredExam.target_class_level_id ?? '');
                }
            } catch {
                toast.error('Failed to load candidate registration filters.');
            } finally {
                setLoadingLookups(false);
            }
        };

        load();
    }, []);

    useEffect(() => {
        if (!selectedRegion) {
            setDistricts([]);
            setSelectedDistrict('');
            return;
        }

        const loadDistricts = async () => {
            try {
                const res = await fetch(`/api/v1/districts?region_id=${selectedRegion}`, { headers });
                await handleUnauthorized(res);
                const body = await res.json();
                setDistricts(safeList<District>(body?.data ?? body));
                setSelectedDistrict('');
                setSelectedSchool('');
            } catch {
                setDistricts([]);
            }
        };

        loadDistricts();
    }, [selectedRegion]);

    useEffect(() => {
        if (!selectedDistrict) {
            setSchools([]);
            setSelectedSchool('');
            return;
        }

        const loadSchools = async () => {
            try {
                const res = await fetch(`/api/v1/schools?district_id=${selectedDistrict}`, { headers });
                await handleUnauthorized(res);
                const body = await res.json();
                setSchools(safeList<SchoolItem>(body?.data ?? body));
                setSelectedSchool('');
            } catch {
                setSchools([]);
            }
        };

        loadSchools();
    }, [selectedDistrict]);

    useEffect(() => {
        const selectedExamRow = examinations.find((exam) => exam.id === selectedExam);
        const targetClassLevelId = selectedExamRow?.target_class_level_id ?? '';

        if (targetClassLevelId && targetClassLevelId !== selectedClassLevel) {
            setSelectedClassLevel(targetClassLevelId);
        }
    }, [examinations, selectedExam]);

    const loadEligibleStudents = async () => {
        if (!selectedExam || !selectedSchool || !selectedClassLevel) {
            const msg = 'Select examination, school, and class level first.';
            setMessage(msg);
            toast.error(msg);
            return;
        }

        setLoadingStudents(true);
        setMessage('');
        setMeta(null);

        try {
            const params = new URLSearchParams({
                school_id: selectedSchool,
                class_level_id: selectedClassLevel,
            });

            if (selectedAcademicYear) {
                params.set('academic_year_id', selectedAcademicYear);
            }

            const res = await fetch(`/api/v1/examinations/${selectedExam}/eligible-students?${params.toString()}`, { headers });
            await handleUnauthorized(res);
            const body = await res.json();
            const list = safeList<StudentRecord>(body?.students ?? body?.data ?? body);
            const loadedMeta = (body?.meta ?? null) as CandidateMeta | null;

            setStudents(list);
            setSelectedStudentIds([]);
            setMeta(loadedMeta);

            if (!list.length) {
                if ((loadedMeta?.eligible_before_exclusion ?? 0) > 0 && (loadedMeta?.eligible_count ?? 0) === 0) {
                    setMessage('All eligible students in this scope are already registered for this exam.');
                } else if ((loadedMeta?.scope_count ?? 0) === 0) {
                    setMessage('No students were found in the selected school and class scope.');
                } else {
                    setMessage('No eligible students found for the selected scope.');
                }
            } else {
                setMessage(`Loaded ${list.length} eligible students.`);
            }
        } catch (error: any) {
            const msg = error?.message || 'Failed to load eligible students.';
            setMessage(msg);
            toast.error(msg);
        } finally {
            setLoadingStudents(false);
        }
    };

    const eligibleStudents = useMemo(
        () => students.filter((student) => student.eligible !== false),
        [students],
    );

    const selectedExamLabel = useMemo(
        () => examinations.find((exam) => exam.id === selectedExam)?.name ?? 'Select examination',
        [examinations, selectedExam],
    );

    const toggleStudent = (studentId: string) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId],
        );
    };

    const toggleAll = () => {
        const eligibleIds = eligibleStudents.map((student) => student.id);
        setSelectedStudentIds(selectedStudentIds.length === eligibleIds.length ? [] : eligibleIds);
    };

    const saveRegistration = async () => {
        const selectedEligibleIds = eligibleStudents
            .filter((student) => selectedStudentIds.includes(student.id))
            .map((student) => student.id);

        if (!selectedExam || selectedEligibleIds.length === 0) {
            const msg = 'Select at least one eligible student first.';
            setMessage(msg);
            toast.error(msg);
            return;
        }

        setRegistering(true);
        setMessage('');

        try {
            const res = await fetch(`/api/v1/examinations/${selectedExam}/registrations`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    student_ids: selectedEligibleIds,
                    class_level_id: selectedClassLevel,
                }),
            });

            await handleUnauthorized(res);
            const body = await res.json();

            if (!res.ok) {
                throw new Error(body?.message || 'Failed to register candidates.');
            }

            toast.success(body?.message ?? `${selectedEligibleIds.length} candidates registered successfully.`);
            onClose();
        } catch (error: any) {
            const msg = error?.message || 'Failed to register candidates.';
            setMessage(msg);
            toast.error(msg);
        } finally {
            setRegistering(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="!w-[94vw] !max-w-[86rem] !h-[92svh] !rounded-3xl overflow-hidden border border-slate-200 p-0 [&>button]:hidden">
                <div className="flex h-full min-h-0 flex-col bg-slate-50 text-[11px]">
                    <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 text-left sm:text-left">
                        <div className="min-w-0">
                            <DialogTitle className="flex items-center gap-2 text-base font-black text-[#0F4C81]">
                                <BadgeCheck className="h-5 w-5" />
                                Register Candidates
                            </DialogTitle>
                            <DialogDescription className="mt-1 text-[11px]">
                                {selectedExamLabel} - select scope, load eligible students, then register them in bulk.
                            </DialogDescription>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                            aria-label="Close modal"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto p-4">
                        <div className="mx-auto flex min-h-0 max-w-[84rem] flex-col gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="grid grid-cols-1 gap-3 xl:grid-cols-6 border-b border-slate-100 pb-4">
                                    <div className="lg:col-span-2">
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Examination *</label>
                                        <SearchableSelect
                                            value={selectedExam}
                                            onValueChange={setSelectedExam}
                                            placeholder={loadingLookups ? 'Loading...' : 'Select examination'}
                                            searchPlaceholder="Search examination..."
                                            options={examinations.map((exam) => ({ value: exam.id, label: `${exam.name} (${exam.status})` }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Academic Year</label>
                                        <SearchableSelect
                                            value={selectedAcademicYear}
                                            onValueChange={setSelectedAcademicYear}
                                            placeholder="Any year"
                                            searchPlaceholder="Search year..."
                                            options={academicYears.map((year) => ({ value: year.id, label: year.name }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Region</label>
                                        <SearchableSelect
                                            value={selectedRegion}
                                            onValueChange={setSelectedRegion}
                                            placeholder="Any region"
                                            searchPlaceholder="Search region..."
                                            options={regions.map((region) => ({ value: region.id, label: region.name }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">District</label>
                                        <SearchableSelect
                                            value={selectedDistrict}
                                            onValueChange={setSelectedDistrict}
                                            placeholder="Any district"
                                            searchPlaceholder="Search district..."
                                            options={districts.map((district) => ({ value: district.id, label: district.name }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">School *</label>
                                        <SearchableSelect
                                            value={selectedSchool}
                                            onValueChange={setSelectedSchool}
                                            placeholder="Select school"
                                            searchPlaceholder="Search school..."
                                            options={schools.map((school) => ({ value: school.id, label: school.name }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Class Level *</label>
                                        <SearchableSelect
                                            value={selectedClassLevel}
                                            onValueChange={setSelectedClassLevel}
                                            placeholder="Select class"
                                            searchPlaceholder="Search class..."
                                            options={classLevels.map((classLevel) => ({ value: classLevel.id, label: classLevel.name }))}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-2 lg:flex-row lg:items-center">
                                    <button
                                        type="button"
                                        onClick={loadEligibleStudents}
                                        disabled={loadingStudents}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0c3c66] disabled:opacity-50 shadow-sm"
                                    >
                                        {loadingStudents ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        Load Eligible Students
                                    </button>
                                    <div className="text-xs text-slate-500 font-medium ml-2">
                                        {students.length} loaded, {selectedStudentIds.length} selected
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 font-semibold shadow-sm">
                                    {message}
                                </div>
                            )}

                            <div className="flex flex-col gap-4 min-h-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center gap-8">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Class & Year</p>
                                            <p className="mt-0.5 text-xs font-bold text-slate-900">
                                                {classLevels.find((c) => c.id === selectedClassLevel)?.name ?? 'N/A'} (Year: {academicYears.find(y => y.id === selectedAcademicYear)?.name ?? 'Any'})
                                            </p>
                                        </div>
                                        {meta && (
                                            <>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scope Total</p>
                                                    <p className="mt-0.5 text-xs font-bold text-slate-900">{meta.scope_count ?? 0} students</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Excluded (Registered)</p>
                                                    <p className="mt-0.5 text-xs font-bold text-slate-900">{meta.excluded_as_registered ?? 0} students</p>
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Selected</p>
                                            <p className="mt-0.5 text-xs font-bold text-[#0F4C81]">{selectedStudentIds.length} of {eligibleStudents.length} eligible</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={toggleAll}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <CheckSquare2 className="h-4 w-4 text-slate-500" />
                                            Select All Eligible
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedStudentIds([])}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <Square className="h-4 w-4 text-slate-500" />
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            onClick={saveRegistration}
                                            disabled={registering || selectedStudentIds.length === 0}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                                        >
                                            {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Register Selected Candidates
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            <X className="h-4 w-4" />
                                            Close
                                        </button>
                                    </div>
                                </div>

                                <div className="min-h-0 bg-white border border-slate-200 rounded-[24px] shadow-sm flex flex-col overflow-hidden max-h-[50svh]">
                                    <div className="overflow-y-auto">
                                        {students.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                                <Users2 className="h-10 w-10 text-slate-300 mb-2 animate-pulse" />
                                                <p className="text-xs font-semibold">No students loaded.</p>
                                                <p className="text-[11px] mt-0.5">Please select the Examination, School, and Class Level filters above, then load.</p>
                                            </div>
                                        ) : (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 w-12 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={eligibleStudents.length > 0 && selectedStudentIds.length === eligibleStudents.length}
                                                                onChange={toggleAll}
                                                                className="h-3.5 w-3.5 rounded border-slate-300 text-[#0F4C81] focus:ring-[#0F4C81]"
                                                            />
                                                        </th>
                                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Name</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Reg Number</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Gender</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Subjects</th>
                                                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Eligibility Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-[11px]">
                                                    {students.map((student) => {
                                                        const checked = selectedStudentIds.includes(student.id);
                                                        const active = student.eligible !== false;
                                                        return (
                                                            <tr 
                                                                key={student.id} 
                                                                className={`group transition hover:bg-slate-50/70 ${checked ? 'bg-sky-50/50' : ''} ${active ? '' : 'opacity-60 bg-slate-50/20'}`}
                                                            >
                                                                <td className="px-4 py-2.5 w-12 text-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        disabled={!active}
                                                                        onChange={() => active && toggleStudent(student.id)}
                                                                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#0F4C81] focus:ring-[#0F4C81]"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-2.5">
                                                                    <div className="font-bold text-slate-900">{getStudentName(student)}</div>
                                                                </td>
                                                                <td className="px-4 py-2.5 font-mono text-slate-500 font-semibold">{student.registration_number}</td>
                                                                <td className="px-4 py-2.5">
                                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                                                        {student.gender}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-800">{student.subject_count ?? 0} subjects</span>
                                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${
                                                                            student.subject_registration_status === 'complete'
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                        }`}>
                                                                            {student.subject_registration_status ?? 'incomplete'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2.5">
                                                                    {active ? (
                                                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                                                            <BadgeCheck className="h-4 w-4 text-emerald-600" />
                                                                            Ready for registration
                                                                        </span>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5 text-amber-700 font-bold max-w-[400px]">
                                                                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                                                            <span className="truncate text-[10px]">{student.subject_registration_message || 'Excluded'}</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

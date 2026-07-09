import React, { useEffect, useMemo, useState } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AlertTriangle, CheckSquare2, Layers3, Loader2, Save, Search, Square, Users2 } from 'lucide-react';
import { toast } from 'sonner';

type Region = { id: string; name: string };
type District = { id: string; name: string; region_id?: string };
type SchoolItem = { id: string; name: string; district_id?: string };
type AcademicYear = { id: string; name: string; is_active?: boolean };
type ClassLevel = { id: string; name: string; numeric_level?: number };

type SubjectItem = {
    id: string;
    name: string;
    short_name?: string;
    code: string;
    class_level_id?: string | null;
    is_active?: boolean;
};

type StudentRecord = {
    id: string;
    registration_number: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    gender: 'M' | 'F';
    status?: string;
    current_class_level_id?: string | null;
    school?: { id: string; name: string };
    academicYear?: AcademicYear;
    classLevel?: ClassLevel;
};

type SubjectRegistration = {
    id: string;
    subject_id: string;
    subject?: SubjectItem;
    status: string;
    registered_at?: string;
};

const MIN_SUBJECTS = 8;
const MAX_SUBJECTS = 11;

const subjectCategory = (subject: SubjectItem): string => {
    const name = `${subject.name} ${subject.code}`.toLowerCase();

    if (name.includes('math')) return 'Core Subjects';
    if (name.includes('english') || name.includes('kiswahili') || name.includes('civics')) return 'Core Subjects';
    if (name.includes('physics') || name.includes('chemistry') || name.includes('biology')) return 'Science';
    if (name.includes('history') || name.includes('geography')) return 'Humanities';
    if (
        name.includes('commerce') ||
        name.includes('book') ||
        name.includes('agric') ||
        name.includes('fine art') ||
        name.includes('arabic')
    ) {
        return 'Business';
    }

    return 'Other Subjects';
};

const badgeTone = (count: number) => {
    if (count < MIN_SUBJECTS) return 'border-rose-200 bg-rose-50 text-rose-700';
    if (count > MAX_SUBJECTS) return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
};

const safeList = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const getStudentName = (student: Pick<StudentRecord, 'first_name' | 'middle_name' | 'last_name'>) =>
    [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');

export default function SubjectRegistrationPage() {
    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [schools, setSchools] = useState<SchoolItem[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [selectedClassLevel, setSelectedClassLevel] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [loadingLookups, setLoadingLookups] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [bulkSaving, setBulkSaving] = useState(false);

    const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [registrations, setRegistrations] = useState<SubjectRegistration[]>([]);
    const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
    const [summary, setSummary] = useState<{
        subject_count: number;
        minimum_required: number;
        maximum_allowed: number;
        status: string;
        eligible: boolean;
    } | null>(null);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

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
        const loadLookups = async () => {
            setLoadingLookups(true);

            try {
                const get = async (url: string) => {
                    const res = await fetch(url, { headers });
                    await handleUnauthorized(res);
                    return res.json();
                };

                const [years, classes, subjectList, regs] = await Promise.all([
                    get('/api/v1/academic-years'),
                    get('/api/v1/class-levels'),
                    get('/api/v1/subjects'),
                    get('/api/v1/regions'),
                ]);

                const yearList = safeList<AcademicYear>(years?.data ?? years);
                const classList = safeList<ClassLevel>(classes?.data ?? classes);
                const subjectData = safeList<SubjectItem>(subjectList?.data ?? subjectList);
                const regionList = safeList<Region>(regs?.data ?? regs);

                setAcademicYears(yearList);
                setClassLevels(classList);
                setSubjects(subjectData.filter((subject) => subject.is_active !== false));
                setRegions(regionList);

                const activeYear = yearList.find((year) => year.is_active) ?? yearList[0] ?? null;

                if (activeYear) {
                    setSelectedAcademicYear(activeYear.id);
                }
            } catch {
                toast.error('Failed to load lookup data.');
            } finally {
                setLoadingLookups(false);
            }
        };

        loadLookups();
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
        setSelectedStudent(null);
        setSelectedStudentIds([]);
        setRegistrations([]);
        setSelectedSubjectIds([]);
        setSummary(null);
        setMessage('');
        setError('');
    }, [selectedAcademicYear, selectedClassLevel, selectedSchool]);

    const filteredSubjects = useMemo(() => {
        if (!selectedClassLevel) {
            return subjects;
        }

        return subjects.filter((subject) => !subject.class_level_id || subject.class_level_id === selectedClassLevel);
    }, [subjects, selectedClassLevel]);

    const groupedSubjects = useMemo(() => {
        const groups = new Map<string, SubjectItem[]>();

        filteredSubjects.forEach((subject) => {
            const key = subjectCategory(subject);
            const current = groups.get(key) ?? [];

            current.push(subject);
            groups.set(key, current);
        });

        return Array.from(groups.entries()).map(([label, items]) => ({
            label,
            items: items.sort((a, b) => a.code.localeCompare(b.code)),
        }));
    }, [filteredSubjects]);

    const allFilteredSubjectIds = useMemo(
        () => filteredSubjects.map((subject) => subject.id),
        [filteredSubjects],
    );

    const getSubjectLabel = (subject: SubjectItem) => subject.short_name?.trim() || subject.name;

    const loadStudents = async () => {
        if (!selectedAcademicYear || !selectedClassLevel || !selectedSchool) {
            const msg = 'Please select academic year, school, and class level first.';
            setError(msg);
            toast.error(msg);
            return;
        }

        setLoadingStudents(true);
        setError('');
        setMessage('');
        setStudents([]);
        setSelectedStudent(null);
        setSelectedStudentIds([]);
        setRegistrations([]);
        setSelectedSubjectIds([]);
        setSummary(null);

        try {
            const params = new URLSearchParams({
                academic_year_id: selectedAcademicYear,
                current_class_level_id: selectedClassLevel,
                school_id: selectedSchool,
                per_page: '200',
            });

            const res = await fetch(`/api/v1/students?${params.toString()}`, { headers });
            await handleUnauthorized(res);

            const body = await res.json();

            if (!res.ok) {
                const msg = body?.message || 'Failed to load students.';
                throw new Error(msg);
            }

            const list = safeList<StudentRecord>(body?.data ?? body);

            setStudents(list);

            if (!list.length) {
                setMessage('No students found for the selected scope.');
            }
        } catch {
            setError('Failed to load students.');
        } finally {
            setLoadingStudents(false);
        }
    };

    const loadStudentSubjects = async (student: StudentRecord) => {
        if (!student.id) return;

        setLoadingStudent(true);
        setSelectedStudent(student);
        setMessage('');
        setError('');

        try {
            const params = selectedAcademicYear ? `?academic_year_id=${selectedAcademicYear}` : '';
            const res = await fetch(`/api/v1/students/${student.id}/subjects${params}`, { headers });
            await handleUnauthorized(res);

            const body = await res.json();

            const loadedStudent = body?.student ?? student;
            const loadedRegistrations = safeList<SubjectRegistration>(body?.registrations ?? []);
            const loadedSummary = body?.summary ?? null;

            setSelectedStudent(loadedStudent);
            setRegistrations(loadedRegistrations);
            setSelectedSubjectIds(loadedRegistrations.map((registration) => registration.subject_id));
            setSummary(loadedSummary);
        } catch {
            setError('Failed to load subject registrations for the selected student.');
        } finally {
            setLoadingStudent(false);
        }
    };

    const toggleSubject = (subjectId: string) => {
        setSelectedSubjectIds((prev) =>
            prev.includes(subjectId)
                ? prev.filter((id) => id !== subjectId)
                : [...prev, subjectId],
        );
    };

    const selectAllSubjects = () => {
        setSelectedSubjectIds(allFilteredSubjectIds);
    };

    const clearSubjects = () => {
        setSelectedSubjectIds([]);
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId],
        );
    };

    const selectAllStudents = () => {
        setSelectedStudentIds(filteredStudents.map((student) => student.id));
    };

    const clearStudentSelection = () => {
        setSelectedStudentIds([]);
    };

    const count = selectedSubjectIds.length;
    const invalidCount = count < MIN_SUBJECTS || count > MAX_SUBJECTS;

    const filteredStudents = useMemo(() => {
        const term = studentSearch.trim().toLowerCase();

        if (!term) return students;

        return students.filter((student) => {
            const haystack = [
                student.first_name,
                student.middle_name ?? '',
                student.last_name,
                student.registration_number,
            ]
                .join(' ')
                .toLowerCase();

            return haystack.includes(term);
        });
    }, [students, studentSearch]);

    const currentClassName = useMemo(() => {
        if (!selectedStudent) return '';

        return (
            selectedStudent.classLevel?.name ??
            classLevels.find((classLevel) => classLevel.id === selectedStudent.current_class_level_id)?.name ??
            classLevels.find((classLevel) => classLevel.id === selectedClassLevel)?.name ??
            'Unassigned'
        );
    }, [classLevels, selectedClassLevel, selectedStudent]);

    const saveSubjects = async () => {
        if (!selectedStudent) return;

        if (invalidCount) {
            setError(`Student must have between ${MIN_SUBJECTS} and ${MAX_SUBJECTS} subjects.`);
            return;
        }

        setSaving(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch(`/api/v1/students/${selectedStudent.id}/subjects`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    academic_year_id: selectedAcademicYear || selectedStudent.academicYear?.id || null,
                    subject_ids: selectedSubjectIds,
                }),
            });

            await handleUnauthorized(res);

            const body = await res.json();

            if (!res.ok) {
                const msg = body?.message || 'Failed to save subject registration.';
                throw new Error(msg);
            }

            const loadedRegistrations = safeList<SubjectRegistration>(body?.registrations ?? []);

            setMessage(body?.message || 'Subject registration saved successfully.');
            setSummary(body?.summary ?? null);
            setRegistrations(loadedRegistrations);
            setSelectedSubjectIds(loadedRegistrations.map((registration) => registration.subject_id));

            toast.success(body?.message || 'Subject registration saved successfully.');
        } catch (err: any) {
            const msg = err?.message || 'Failed to save subject registration.';

            setError(msg);
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const bulkSaveSubjects = async () => {
        if (!students.length) {
            const msg = 'Load students first before applying subjects in bulk.';
            setError(msg);
            toast.error(msg);
            return;
        }

        if (!selectedStudentIds.length) {
            const msg = 'Select one or more students with the checkboxes first.';
            setError(msg);
            toast.error(msg);
            return;
        }

        if (invalidCount) {
            const msg = `Bulk registration requires between ${MIN_SUBJECTS} and ${MAX_SUBJECTS} subjects.`;
            setError(msg);
            toast.error(msg);
            return;
        }

        setBulkSaving(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/v1/students/subjects/bulk', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    region_id: selectedRegion || null,
                    district_id: selectedDistrict || null,
                    school_id: selectedSchool,
                    academic_year_id: selectedAcademicYear,
                    current_class_level_id: selectedClassLevel,
                    selected_student_ids: selectedStudentIds,
                    subject_ids: selectedSubjectIds,
                }),
            });

            await handleUnauthorized(res);

            const body = await res.json();

            if (!res.ok) {
                const msg = body?.message || 'Failed to apply subjects in bulk.';
                throw new Error(msg);
            }

            const summaryData = body?.summary ?? null;
            const succeeded = summaryData?.succeeded ?? 0;
            const failed = summaryData?.failed ?? 0;

            setMessage(body?.message || `Bulk registration completed for ${succeeded} students.`);
            toast.success(body?.message || `Bulk registration completed for ${succeeded} students.`);

            if (selectedStudent) {
                await loadStudentSubjects(selectedStudent);
            }

            if (failed > 0) {
                setError(`${failed} students could not be updated.`);
            }
        } catch (err: any) {
            const msg = err?.message || 'Failed to apply subjects in bulk.';
            setError(msg);
            toast.error(msg);
        } finally {
            setBulkSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Subject Registration</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Select scope, choose student, then register subjects.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            Min {MIN_SUBJECTS}
                        </span>
                        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            Max {MAX_SUBJECTS}
                        </span>
                        <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${badgeTone(count)}`}>
                            {count} selected
                        </span>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-800">Filter Students</h2>
                    <span className="text-xs text-slate-400">{filteredSubjects.length} eligible subjects</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Academic Year *</label>
                        <SearchableSelect
                            value={selectedAcademicYear}
                            onValueChange={setSelectedAcademicYear}
                            placeholder="Select year"
                            searchPlaceholder="Search year..."
                            options={academicYears.map((year) => ({ value: year.id, label: year.name }))}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Region *</label>
                        <SearchableSelect
                            value={selectedRegion}
                            onValueChange={setSelectedRegion}
                            placeholder="Select region"
                            searchPlaceholder="Search region..."
                            options={regions.map((region) => ({ value: region.id, label: region.name }))}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">District *</label>
                        <SearchableSelect
                            value={selectedDistrict}
                            onValueChange={setSelectedDistrict}
                            placeholder="Select district"
                            searchPlaceholder="Search district..."
                            options={districts.map((district) => ({ value: district.id, label: district.name }))}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">School *</label>
                        <SearchableSelect
                            value={selectedSchool}
                            onValueChange={setSelectedSchool}
                            placeholder="Select school"
                            searchPlaceholder="Search school..."
                            options={schools.map((school) => ({ value: school.id, label: school.name }))}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Class Level *</label>
                        <SearchableSelect
                            value={selectedClassLevel}
                            onValueChange={setSelectedClassLevel}
                            placeholder="Select class"
                            searchPlaceholder="Search class..."
                            options={classLevels.map((classLevel) => ({ value: classLevel.id, label: classLevel.name }))}
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={loadStudents}
                            disabled={loadingLookups || loadingStudents}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loadingStudents ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Search className="h-4 w-4" />
                            )}
                            Load
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                    {error}
                </div>
            )}

            {message && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[270px_minmax(0,1fr)]">
                <div className="rounded-xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 p-3.5">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-800">Students</h2>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    {selectedStudentIds.length} selected
                                </p>
                            </div>
                            <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                    onChange={(event) => (event.target.checked ? selectAllStudents() : clearStudentSelection())}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#0F4C81]"
                                />
                                Select all
                            </label>
                        </div>

                        <input
                            value={studentSearch}
                            onChange={(event) => setStudentSearch(event.target.value)}
                            placeholder="Search name or reg no."
                            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] outline-none transition focus:border-[#0F4C81]"
                        />
                    </div>

                    <div className="max-h-[620px] overflow-y-auto scrollbar-hover">
                        {loadingStudents ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="h-7 w-7 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="px-4 py-12 text-center text-xs text-slate-500">
                                Load students, then select one.
                            </div>
                        ) : (
                            filteredStudents.map((student) => {
                                const active = selectedStudent?.id === student.id;
                                const checked = selectedStudentIds.includes(student.id);

                                return (
                                    <div
                                        key={student.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => loadStudentSubjects(student)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                loadStudentSubjects(student);
                                            }
                                        }}
                                        className={[
                                            'flex items-center gap-2 border-b border-slate-100 px-3 py-2 transition last:border-b-0',
                                            active ? 'bg-sky-50' : 'bg-white hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleStudentSelection(student.id)}
                                            onClick={(event) => event.stopPropagation()}
                                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#0F4C81]"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[12px] font-semibold leading-4 text-slate-900">
                                                {getStudentName(student)}
                                            </div>
                                            <div className="mt-0.5 text-[10px] text-slate-500">
                                                Reg# {student.registration_number}
                                            </div>
                                        </div>

                                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                                            {student.gender}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Register Subjects</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Select between {MIN_SUBJECTS} and {MAX_SUBJECTS} subjects.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${badgeTone(count)}`}>
                                {count} selected
                            </span>
                            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                Saved: {registrations.length}
                            </span>
                            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                Scope: {selectedStudentIds.length}/{students.length} students
                            </span>
                        </div>
                    </div>

                    {!selectedStudent ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                            <Users2 className="h-10 w-10 text-slate-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-700">No student selected</p>
                            <p className="mt-1 max-w-sm text-xs text-slate-500">
                                Choose a student from the left list to view and update subject registration.
                            </p>
                        </div>
                    ) : loadingStudent ? (
                        <div className="flex h-56 items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-[#0F4C81]" />
                        </div>
                    ) : (
                        <div className="space-y-4 p-4">
                            <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-base font-bold text-slate-900">{getStudentName(selectedStudent)}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Reg# <span className="font-mono">{selectedStudent.registration_number}</span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                                    <span className="rounded-md bg-white px-3 py-1.5 ring-1 ring-slate-200">
                                        Class: {currentClassName}
                                    </span>
                                    <span className="rounded-md bg-white px-3 py-1.5 ring-1 ring-slate-200">
                                        Status: {summary?.status ?? 'pending'}
                                    </span>
                                    <span className="rounded-md bg-white px-3 py-1.5 ring-1 ring-slate-200">
                                        {summary?.eligible ? 'Eligible' : 'Incomplete'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllSubjects}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <CheckSquare2 className="h-4 w-4" />
                                    Select All Subjects
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSubjects}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Square className="h-4 w-4" />
                                    Clear Selection
                                </button>
                                <button
                                    type="button"
                                    onClick={bulkSaveSubjects}
                                    disabled={bulkSaving || invalidCount || students.length === 0}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers3 className="h-4 w-4" />}
                                    Apply to selected students
                                </button>
                            </div>

                            {invalidCount && (
                                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        Student must have between {MIN_SUBJECTS} and {MAX_SUBJECTS} subjects.
                                        <span className="ml-1 font-semibold">Current: {count}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-5">
                                {groupedSubjects.map((group) => (
                                    <div key={group.label}>
                                        <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-1.5">
                                            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                {group.label}
                                            </h3>
                                            <span className="text-[11px] text-slate-400">{group.items.length}</span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                                            {group.items.map((subject) => {
                                                const checked = selectedSubjectIds.includes(subject.id);

                                                return (
                                                    <label
                                                        key={subject.id}
                                                        className={[
                                                            'flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 transition',
                                                            checked
                                                                ? 'border-[#0F4C81] bg-sky-50'
                                                                : 'border-slate-200 bg-white hover:bg-slate-50',
                                                        ].join(' ')}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleSubject(subject.id)}
                                                            className="h-3.5 w-3.5 rounded border-slate-300 text-[#0F4C81]"
                                                        />

                                                        <div className="min-w-0 flex-1">
                                                            <div className="truncate text-[12px] font-semibold leading-4 text-slate-900">
                                                                {getSubjectLabel(subject)}
                                                            </div>
                                                            <div className="mt-0.5 text-[10px] text-slate-500">
                                                                {subject.code}
                                                                {subject.short_name ? ` · ${subject.name}` : ''}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-500">
                                    {registrations.length > 0
                                        ? `${registrations.length} subjects currently saved.`
                                        : 'No saved subjects yet.'}
                                </p>

                                <button
                                    type="button"
                                    onClick={saveSubjects}
                                    disabled={saving || invalidCount}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Registration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

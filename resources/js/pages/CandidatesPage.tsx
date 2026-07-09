import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { BadgeCheck, Filter, Loader2, Search, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import CandidateRegisterPage from './CandidateRegisterPage';

type Region = { id: string; name: string };
type District = { id: string; name: string; region_id?: string };
type SchoolItem = { id: string; name: string; district_id?: string };
type AcademicYear = { id: string; name: string; is_active?: boolean };
type ClassLevel = { id: string; name: string; numeric_level?: number };
type Examination = { id: string; name: string; status: string; academic_year_id?: string; target_class_level_id?: string };

type CandidateSubject = {
    id: string;
    code?: string;
    name?: string;
    short_name?: string;
};

type CandidateRow = {
    id: string;
    examination_registration_id: string;
    student_id: string;
    exam_number: string;
    status?: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    registration_number?: string;
    gender?: 'M' | 'F';
    school_name?: string;
    school_code?: string;
    school_id?: string;
    class_level_id?: string;
    subject_count?: number;
    subjects?: CandidateSubject[];
};

const safeList = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const getStudentName = (candidate: Pick<CandidateRow, 'first_name' | 'middle_name' | 'last_name'>) =>
    [candidate.first_name, candidate.middle_name, candidate.last_name].filter(Boolean).join(' ');

const subjectLabel = (subject: CandidateSubject) => subject.short_name?.trim() || subject.code || subject.name || 'Subject';

export default function CandidatesPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [regions, setRegions] = useState<Region[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [schools, setSchools] = useState<SchoolItem[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
    const [examinations, setExaminations] = useState<Examination[]>([]);
    const [candidates, setCandidates] = useState<CandidateRow[]>([]);

    const [selectedExam, setSelectedExam] = useState('');
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedClassLevel, setSelectedClassLevel] = useState('');
    const [search, setSearch] = useState('');

    const [loadingLookups, setLoadingLookups] = useState(false);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [message, setMessage] = useState('');
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

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
                }
            } catch {
                toast.error('Failed to load candidate filters.');
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

    const loadCandidates = async () => {
        if (!selectedExam) {
            const msg = 'Please select an examination first.';
            setMessage(msg);
            toast.error(msg);
            return;
        }

        setLoadingCandidates(true);
        setMessage('');

        try {
            const params = new URLSearchParams();
            if (selectedSchool) params.set('school_id', selectedSchool);
            if (selectedClassLevel) params.set('class_level_id', selectedClassLevel);
            if (search.trim()) params.set('search', search.trim());
            if (selectedAcademicYear) params.set('academic_year_id', selectedAcademicYear);

            const res = await fetch(`/api/v1/examinations/${selectedExam}/candidates?${params.toString()}`, { headers });
            await handleUnauthorized(res);
            const body = await res.json();
            const list = safeList<CandidateRow>(body?.data ?? body);

            setCandidates(list);
            setMessage(list.length ? `Loaded ${list.length} registered candidates.` : 'No registered candidates found for the selected filters.');
        } catch (error: any) {
            const msg = error?.message || 'Failed to load candidates.';
            setMessage(msg);
            toast.error(msg);
        } finally {
            setLoadingCandidates(false);
        }
    };

    const selectedExamLabel = useMemo(() => examinations.find((exam) => exam.id === selectedExam)?.name ?? 'Select examination', [examinations, selectedExam]);

    return (
        <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Candidates</p>
                        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0F4C81]">Registered Candidates</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Filter examination candidates and inspect the subjects they were registered with.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsRegisterOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66]"
                    >
                        <BadgeCheck className="h-4 w-4" />
                        Register Candidate
                    </button>
                </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Filter className="h-4 w-4 text-[#0F4C81]" />
                    Filter Scope
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Examination *</label>
                        <SearchableSelect
                            value={selectedExam}
                            onValueChange={setSelectedExam}
                            placeholder={loadingLookups ? 'Loading...' : 'Select examination'}
                            searchPlaceholder="Search examination..."
                            options={examinations.map((exam) => ({ value: exam.id, label: `${exam.name} (${exam.status})` }))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Academic Year</label>
                        <SearchableSelect
                            value={selectedAcademicYear}
                            onValueChange={setSelectedAcademicYear}
                            placeholder="Any year"
                            searchPlaceholder="Search year..."
                            options={academicYears.map((year) => ({ value: year.id, label: year.name }))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Region</label>
                        <SearchableSelect
                            value={selectedRegion}
                            onValueChange={setSelectedRegion}
                            placeholder="Any region"
                            searchPlaceholder="Search region..."
                            options={regions.map((region) => ({ value: region.id, label: region.name }))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">District</label>
                        <SearchableSelect
                            value={selectedDistrict}
                            onValueChange={setSelectedDistrict}
                            placeholder="Any district"
                            searchPlaceholder="Search district..."
                            options={districts.map((district) => ({ value: district.id, label: district.name }))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">School</label>
                        <SearchableSelect
                            value={selectedSchool}
                            onValueChange={setSelectedSchool}
                            placeholder="Any school"
                            searchPlaceholder="Search school..."
                            options={schools.map((school) => ({ value: school.id, label: school.name }))}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Class Level</label>
                        <SearchableSelect
                            value={selectedClassLevel}
                            onValueChange={setSelectedClassLevel}
                            placeholder="Any class"
                            searchPlaceholder="Search class..."
                            options={classLevels.map((classLevel) => ({ value: classLevel.id, label: classLevel.name }))}
                        />
                    </div>
                </div>

                <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search candidate name or reg no."
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#0F4C81] lg:max-w-md"
                    />
                    <button
                        type="button"
                        onClick={loadCandidates}
                        disabled={loadingCandidates}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                        {loadingCandidates ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Load Candidates
                    </button>
                </div>
            </div>

            {message && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {message}
                </div>
            )}

            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Registered Candidates</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            {selectedExamLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <Users2 className="h-4 w-4 text-[#0F4C81]" />
                        {candidates.length} candidate{candidates.length === 1 ? '' : 's'}
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hover">
                    <table className="min-w-full divide-y divide-slate-100 text-xs">
                        <thead className="sticky top-0 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-2.5 text-left font-bold">SN</th>
                                <th className="px-4 py-2.5 text-left font-bold">Reg No</th>
                                <th className="px-4 py-2.5 text-left font-bold">Candidate</th>
                                <th className="px-4 py-2.5 text-left font-bold">Gender</th>
                                <th className="px-4 py-2.5 text-left font-bold">School</th>
                                <th className="px-4 py-2.5 text-left font-bold">Subjects</th>
                                <th className="px-4 py-2.5 text-left font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {candidates.map((candidate, index) => (
                                <tr key={candidate.id} className="hover:bg-slate-50 transition text-[11px] text-slate-700">
                                    <td className="px-4 py-2 font-mono text-slate-500">{index + 1}</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-slate-600">{candidate.registration_number ?? '—'}</td>
                                    <td className="px-4 py-2 font-bold text-slate-900">{getStudentName(candidate)}</td>
                                    <td className="px-4 py-2 font-semibold text-slate-600">{candidate.gender ?? '—'}</td>
                                    <td className="px-4 py-2 font-mono font-semibold text-slate-600">{candidate.school_code ?? candidate.school_name ?? '—'}</td>
                                    <td className="px-4 py-2">
                                        <div className="flex flex-wrap gap-1 max-w-lg">
                                            {(candidate.subjects ?? []).map((subject) => (
                                                <span
                                                    key={subject.id}
                                                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 whitespace-nowrap"
                                                >
                                                    {subjectLabel(subject)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                            {candidate.status ?? 'registered'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {candidates.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-16 text-center text-xs text-slate-400">
                                        Use the filters above, then load candidates.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isRegisterOpen && (
                <CandidateRegisterPage
                    onClose={() => {
                        setIsRegisterOpen(false);
                        navigate('/candidates', { replace: true });
                        loadCandidates();
                    }}
                />
            )}
        </div>
    );
}

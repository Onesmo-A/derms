import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ExamsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'calendar' | 'timetable' | 'subjects' | 'centers'>('list');

    // Form inputs
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Auto-select tab based on URL path
    useEffect(() => {
        const path = location.pathname;
        if (path === '/examinations/create') setActiveTab('create');
        else if (path === '/examinations/calendar') setActiveTab('calendar');
        else if (path === '/examinations/timetable') setActiveTab('timetable');
        else if (path === '/examinations/subjects/assign') setActiveTab('subjects');
        else if (path === '/examination-centers') setActiveTab('centers');
        else setActiveTab('list');
    }, [location.pathname]);

    const fetchExams = () => {
        setLoading(true);
        fetch('/api/v1/examinations', { headers })
            .then(res => res.json())
            .then(data => {
                setExams(Array.isArray(data) ? data : data.data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const handleCreateExam = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        Promise.all([
            fetch('/api/v1/academic-years', { headers }).then(res => res.json()),
            fetch('/api/v1/examination-types', { headers }).then(res => res.json() || [])
        ])
        .then(async ([years, types]) => {
            const yearId = years[0]?.id;
            const typeId = types[0]?.id || 'mock-type-id';

            if (!yearId) throw new Error('No active academic year found.');

            const classLevelsRes = await fetch('/api/v1/class-levels', { headers });
            const classLevelsJson = await classLevelsRes.json();
            const classLevelsList = Array.isArray(classLevelsJson) ? classLevelsJson : (classLevelsJson?.data || []);
            const classLevelIds = classLevelsList.map((cl: any) => cl.id);

            if (!classLevelIds.length) {
                throw new Error('No class levels available. Please create class levels first.');
            }

            return fetch('/api/v1/examinations', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    academic_year_id: yearId,
                    examination_type_id: typeId,
                    name,
                    start_date: startDate,
                    end_date: endDate,
                    class_level_ids: classLevelIds,
                    status: 'draft'
                })
            });
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || 'Failed to create examination.');
            }
            return res.json();
        })
        .then(() => {
            setShowModal(false);
            setName('');
            setStartDate('');
            setEndDate('');
            fetchExams();
        })
        .catch(err => {
            setError(err.message);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Examinations Console</h1>
                    <p className="mt-1 text-sm text-gray-500">Configure examination settings, papers schedule, and monitor candidate registrations.</p>
                </div>
                {activeTab === 'list' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66]"
                    >
                        Create Examination
                    </button>
                )}
            </div>

            {/* Submenu tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {[
                    { id: 'list', label: 'All Examinations', path: '/examinations' },
                    { id: 'create', label: 'Create Examination', path: '/examinations/create' },
                    { id: 'calendar', label: 'Examination Calendar', path: '/examinations/calendar' },
                    { id: 'timetable', label: 'Examination Timetable', path: '/examinations/timetable' },
                    { id: 'subjects', label: 'Assign Subjects', path: '/examinations/subjects/assign' },
                    { id: 'centers', label: 'Centers List', path: '/examination-centers' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as any);
                            navigate(tab.path);
                        }}
                        className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === tab.id ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent"></div>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {activeTab === 'list' && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {exams.map(exam => (
                                <div key={exam.id} className="rounded-xl border p-5 flex flex-col justify-between hover:shadow transition">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-[#0F4C81] uppercase">{exam.status}</span>
                                            <span className="text-xs text-gray-400">Year: 2026</span>
                                        </div>
                                        <h3 className="mt-4 text-lg font-bold text-gray-900">{exam.name}</h3>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Runs: {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="mt-6 border-t pt-4 text-xs text-gray-400">
                                        Assigned class levels will register to take this mock exam.
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'create' && (
                        <div className="space-y-4 max-w-lg">
                            <h3 className="text-lg font-bold text-gray-900">Create New Examination</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Exam Title / Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. Kinondoni Secondary Mock Exam" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                                    <input value={endDate} onChange={e => setEndDate(e.target.value)} type="date" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                                </div>
                            </div>
                            <button onClick={handleCreateExam} className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white">Create Exam & Map Classes</button>
                        </div>
                    )}

                    {activeTab === 'calendar' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Examination Calendar</h3>
                            <p className="text-sm text-gray-500">Plan and coordinate scheduled mock sessions district-wide.</p>
                        </div>
                    )}

                    {activeTab === 'timetable' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Examination Timetable</h3>
                            <p className="text-sm text-gray-500">Map specific timeslot details for papers (morning and afternoon schedules).</p>
                        </div>
                    )}

                    {activeTab === 'subjects' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Assign Subject Weight</h3>
                            <p className="text-sm text-gray-500">Specify maximum marks, pass criteria, and theory/practical weights for examinations.</p>
                        </div>
                    )}

                    {activeTab === 'centers' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Centers List</h3>
                            <p className="text-sm text-gray-500">View list of approved school examination centers.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900">Create Examination</h2>
                        <form onSubmit={handleCreateExam} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Exam Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} required type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input value={startDate} onChange={e => setStartDate(e.target.value)} required type="date" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                                    <input value={endDate} onChange={e => setEndDate(e.target.value)} required type="date" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="rounded-lg bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c3c66]">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

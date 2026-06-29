import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function StudentsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [students, setStudents] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchool, setSelectedSchool] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'register' | 'import' | 'candidate_reg' | 'registered_candidates' | 'promotions' | 'transfers' | 'duplicates'>('all');

    // Form inputs
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [gender, setGender] = useState('M');
    const [parentPhone, setParentPhone] = useState('');
    const [regNumber, setRegNumber] = useState('');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Auto-select tab based on URL path
    useEffect(() => {
        const path = location.pathname;
        if (path === '/students/register') setActiveTab('register');
        else if (path === '/students/import') setActiveTab('import');
        else if (path === '/candidates/register') setActiveTab('candidate_reg');
        else if (path === '/candidates/registered') setActiveTab('registered_candidates');
        else if (path === '/students/promotions') setActiveTab('promotions');
        else if (path === '/students/transfers') setActiveTab('transfers');
        else if (path === '/students/duplicates') setActiveTab('duplicates');
        else setActiveTab('all');
    }, [location.pathname]);

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/v1/students', { headers }).then(res => res.json()).catch(() => []),
            fetch('/api/v1/schools', { headers }).then(res => res.json()).catch(() => [])
        ])
        .then(([studentsData, schoolsData]) => {
            setStudents(Array.isArray(studentsData) ? studentsData : studentsData.data || []);
            setSchools(Array.isArray(schoolsData) ? schoolsData : schoolsData.data || []);
            setLoading(false);
        })
        .catch(() => {
            setError('Failed to fetch student details.');
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const targetSchool = selectedSchool || schools[0]?.id;
        if (!targetSchool) {
            setError('No school found to register student.');
            return;
        }

        Promise.all([
            fetch('/api/v1/academic-years', { headers }).then(res => res.json()),
            fetch('/api/v1/class-levels', { headers }).then(res => res.json())
        ])
        .then(([years, classes]) => {
            const yearId = years[0]?.id;
            const classId = classes[0]?.id;

            if (!yearId || !classId) throw new Error('Ensure Academic Years & Class Levels are set up first.');

            return fetch('/api/v1/students', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    school_id: targetSchool,
                    academic_year_id: yearId,
                    current_class_level_id: classId,
                    first_name: firstName,
                    last_name: lastName,
                    gender,
                    parent_phone: parentPhone,
                    registration_number: regNumber || `REG-${Date.now()}`
                })
            });
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || 'Failed to create student.');
            }
            return res.json();
        })
        .then(() => {
            setShowModal(false);
            setFirstName('');
            setLastName('');
            setParentPhone('');
            setRegNumber('');
            fetchData();
        })
        .catch(err => {
            setError(err.message);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Student Administration</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage student records, registrations, promotions, and transfers.</p>
                </div>
                {activeTab === 'all' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#0c3c66]"
                    >
                        Register Student
                    </button>
                )}
            </div>

            {/* Submenu tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {[
                    { id: 'all', label: 'All Students', path: '/students' },
                    { id: 'register', label: 'Single Register', path: '/students/register' },
                    { id: 'import', label: 'Bulk Import', path: '/students/import' },
                    { id: 'candidate_reg', label: 'Candidate Registration', path: '/candidates/register' },
                    { id: 'registered_candidates', label: 'Registered Candidates', path: '/candidates/registered' },
                    { id: 'promotions', label: 'Student Promotions', path: '/students/promotions' },
                    { id: 'transfers', label: 'Student Transfers', path: '/students/transfers' },
                    { id: 'duplicates', label: 'Duplicate Detection', path: '/students/duplicates' }
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
                    {activeTab === 'all' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Student Roster</h3>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Reg Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Gender</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">School</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Parent Phone</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map(student => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{student.first_name} {student.last_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{student.registration_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{student.gender}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{student.school?.name || 'School'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{student.parent_phone}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'register' && (
                        <div className="space-y-4 max-w-lg">
                            <h3 className="text-lg font-bold text-gray-900">Register Single Student</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input value={firstName} onChange={e => setFirstName(e.target.value)} type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input value={lastName} onChange={e => setLastName(e.target.value)} type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Phone Number (for SMS)</label>
                                <input value={parentPhone} onChange={e => setParentPhone(e.target.value)} type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                            <button onClick={handleCreateStudent} className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white">Create Student Record</button>
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Bulk Import Students</h3>
                            <p className="text-sm text-gray-500">Download Excel Template, fill in candidate names and import them directly.</p>
                            <div className="border-2 border-dashed rounded-xl p-8 text-center text-gray-400">
                                Click or drag Excel spreadsheet files here to upload
                            </div>
                        </div>
                    )}

                    {activeTab === 'candidate_reg' && (
                        <div className="space-y-4 max-w-lg">
                            <h3 className="text-lg font-bold text-gray-900">Register Candidates to Examinations</h3>
                            <p className="text-sm text-gray-500">Select active examination to map registered district students.</p>
                            <button onClick={() => alert('Candidate registration jobs dispatched successfully.')} className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white">Generate Exam Candidate Numbers</button>
                        </div>
                    )}

                    {activeTab === 'registered_candidates' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Registered Examination Candidates</h3>
                            <div className="text-sm text-gray-500">List of active candidates with generated exam index codes.</div>
                        </div>
                    )}

                    {activeTab === 'promotions' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Class Promotions</h3>
                            <p className="text-sm text-gray-500">Promote students from Form One to Form Two, or Form Three to Form Four.</p>
                        </div>
                    )}

                    {activeTab === 'transfers' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Student Transfer Logs</h3>
                            <p className="text-sm text-gray-500">Track student school migration and registration adjustments.</p>
                        </div>
                    )}

                    {activeTab === 'duplicates' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Duplicate Registration Warning Radar</h3>
                            <p className="text-sm text-gray-500">Scan candidate rosters for duplicate names or parent phone patterns.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-gray-900">Register Student Record</h2>
                        <form onSubmit={handleCreateStudent} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input value={firstName} onChange={e => setFirstName(e.target.value)} required type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input value={lastName} onChange={e => setLastName(e.target.value)} required type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Parent Phone</label>
                                <input value={parentPhone} onChange={e => setParentPhone(e.target.value)} required type="text" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="rounded-lg bg-[#0F4C81] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c3c66]">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ReportsPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [exams, setExams] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'student' | 'school' | 'subject' | 'district' | 'export' | 'analytics_school' | 'analytics_subject' | 'analytics_student' | 'analytics_gender' | 'analytics_trends' | 'analytics_rankings' | 'analytics_comparative'>('student');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Auto-select tab based on URL path
    useEffect(() => {
        const path = location.pathname;
        if (path === '/reports/schools') setActiveTab('school');
        else if (path === '/reports/subjects') setActiveTab('subject');
        else if (path === '/reports/district') setActiveTab('district');
        else if (path === '/reports/export-center') setActiveTab('export');
        else if (path === '/analytics/schools') setActiveTab('analytics_school');
        else if (path === '/analytics/subjects') setActiveTab('analytics_subject');
        else if (path === '/analytics/students') setActiveTab('analytics_student');
        else if (path === '/analytics/gender') setActiveTab('analytics_gender');
        else if (path === '/analytics/performance-trends') setActiveTab('analytics_trends');
        else if (path === '/analytics/rankings') setActiveTab('analytics_rankings');
        else if (path === '/analytics/comparative') setActiveTab('analytics_comparative');
        else setActiveTab('student');
    }, [location.pathname]);

    useEffect(() => {
        Promise.all([
            fetch('/api/v1/examinations', { headers }).then(res => res.json()).catch(() => []),
            fetch('/api/v1/schools', { headers }).then(res => res.json()).catch(() => [])
        ])
        .then(([examsData, schoolsData]) => {
            setExams(Array.isArray(examsData) ? examsData : examsData.data || []);
            setSchools(Array.isArray(schoolsData) ? schoolsData : schoolsData.data || []);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    const handleDownloadPdf = (endpoint: string) => {
        if (!selectedExam) {
            alert('Please select an examination first.');
            return;
        }
        window.open(`/api/v1/reports/${selectedExam}/${endpoint}`, '_blank');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Reports & Performance Analytics</h1>
                <p className="mt-1 text-sm text-gray-500">Download candidate results slips, export overall merit lists (Excel/PDF), and analyze district statistics.</p>
            </div>

            {/* Submenu tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {[
                    { id: 'student', label: 'Student Slips', path: '/reports/students' },
                    { id: 'school', label: 'School Summaries', path: '/reports/schools' },
                    { id: 'subject', label: 'Subject Performance', path: '/reports/subjects' },
                    { id: 'district', label: 'District Merit List', path: '/reports/district' },
                    { id: 'export', label: 'Export Center', path: '/reports/export-center' },
                    { id: 'analytics_school', label: 'School Analysis', path: '/analytics/schools' },
                    { id: 'analytics_subject', label: 'Subject Analysis', path: '/analytics/subjects' },
                    { id: 'analytics_student', label: 'Student Analysis', path: '/analytics/students' },
                    { id: 'analytics_gender', label: 'Gender Analysis', path: '/analytics/gender' },
                    { id: 'analytics_trends', label: 'Performance Trends', path: '/analytics/performance-trends' },
                    { id: 'analytics_rankings', label: 'Rankings Analysis', path: '/analytics/rankings' },
                    { id: 'analytics_comparative', label: 'Comparative Analysis', path: '/analytics/comparative' }
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

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent"></div>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {/* Setup selectors */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-2xl mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase">Select Examination</label>
                            <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                <option value="">Select Exam</option>
                                {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        {activeTab === 'school' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Select School</label>
                                <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                    <option value="">Select School</option>
                                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {activeTab === 'student' && (
                        <div className="space-y-4 max-w-xl">
                            <h3 className="text-lg font-bold text-gray-900">Student Results Slips</h3>
                            <p className="text-sm text-gray-500">Download single candidate slips with grading indicators.</p>
                            <button onClick={() => alert('Search student registration code to download slip.')} className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white">Find & Export Candidate Slip</button>
                        </div>
                    )}

                    {activeTab === 'school' && (
                        <div className="space-y-4 max-w-xl">
                            <h3 className="text-lg font-bold text-gray-900">School Performance Summary</h3>
                            <p className="text-sm text-gray-500">Download aggregate school GPA, division count lists, and ranks.</p>
                            <button onClick={() => handleDownloadPdf(`school-summary/${selectedSchool}/c3b0ac47-83d8-4f11-8c46-cb3d3c734912/pdf`)} className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white">Generate School Summary PDF</button>
                        </div>
                    )}

                    {activeTab === 'subject' && (
                        <div className="space-y-4 max-w-xl">
                            <h3 className="text-lg font-bold text-gray-900">Subject Analysis Reports</h3>
                            <p className="text-sm text-gray-500">Download grade counts and pass metrics for individual subjects across the district.</p>
                        </div>
                    )}

                    {activeTab === 'district' && (
                        <div className="space-y-4 max-w-xl">
                            <h3 className="text-lg font-bold text-gray-900">District Merit List</h3>
                            <p className="text-sm text-gray-500">Export the comprehensive merit list of all students sorted by division points.</p>
                            <div className="flex gap-2">
                                <button onClick={() => handleDownloadPdf('merit-list/pdf')} className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white">Download PDF List</button>
                                <button onClick={() => handleDownloadPdf('merit-list/excel')} className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700">Export Excel Sheet</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'export' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Export Center Queue</h3>
                            <p className="text-sm text-gray-500">History of requested exports and generation files ready for download.</p>
                        </div>
                    )}

                    {activeTab.startsWith('analytics') && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 uppercase">{activeTab.replace('analytics_', '').replace('_', ' ')} Charts</h3>
                            <p className="text-sm text-gray-500">Interactive charts and metrics are computed dynamically from results data.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

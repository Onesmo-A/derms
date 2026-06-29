import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AiPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const [exams, setExams] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [classLevels, setClassLevels] = useState<any[]>([]);

    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedTrendExams, setSelectedTrendExams] = useState<string[]>([]);

    const [activeTab, setActiveTab] = useState<'ask' | 'performance' | 'risk' | 'recommendations' | 'executive' | 'trend'>('performance');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Auto-select tab based on URL path
    useEffect(() => {
        const path = location.pathname;
        if (path === '/ai/ask') setActiveTab('ask');
        else if (path === '/ai/performance-analysis') setActiveTab('performance');
        else if (path === '/ai/risk-detection' || path === '/ai/at-risk-students') setActiveTab('risk');
        else if (path === '/ai/recommendations' || path === '/ai/improvements') setActiveTab('recommendations');
        else if (path === '/ai/executive-summaries') setActiveTab('executive');
        else if (path === '/ai/trend-analysis') setActiveTab('trend');
        else setActiveTab('performance');
    }, [location.pathname]);

    useEffect(() => {
        const handleResponse = (res: Response) => {
            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                throw new Error('Unauthorized');
            }
            return res.json();
        };

        fetch('/api/v1/examinations', { headers }).then(handleResponse).then(data => setExams(Array.isArray(data) ? data : data.data || [])).catch(() => {});
        fetch('/api/v1/schools', { headers }).then(handleResponse).then(data => setSchools(Array.isArray(data) ? data : data.data || [])).catch(() => {});
        setClassLevels([
            { id: 'c3b0ac47-83d8-4f11-8c46-cb3d3c734912', name: 'Form Four' },
            { id: 'a2b0ac47-83d8-4f11-8c46-cb3d3c734911', name: 'Form Two' }
        ]);
    }, []);

    const handleRunAnalysis = () => {
        if (!selectedExam || !selectedClass) {
            setError('Please select an examination and class level.');
            return;
        }

        setError('');
        setLoading(true);
        setData(null);

        let endpoint = '';
        let body: any = {};

        switch (activeTab) {
            case 'performance':
                endpoint = '/api/v1/ai/analyze-performance';
                body = { examination_id: selectedExam, class_level_id: selectedClass, school_id: selectedSchool || null };
                break;
            case 'risk':
                endpoint = '/api/v1/ai/identify-risk';
                body = { examination_id: selectedExam, class_level_id: selectedClass, school_id: selectedSchool || null };
                break;
            case 'recommendations':
                endpoint = '/api/v1/ai/school-recommendations';
                body = { school_id: selectedSchool || schools[0]?.id };
                break;
            case 'trend':
                endpoint = '/api/v1/ai/analyze-trends';
                body = { examination_ids: selectedTrendExams.length ? selectedTrendExams : [selectedExam] };
                break;
            case 'executive':
                endpoint = '/api/v1/ai/executive-summary';
                body = { examination_id: selectedExam, class_level_id: selectedClass };
                break;
            default:
                setLoading(false);
                return;
        }

        fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
        .then(async res => {
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.message || 'AI request failed. Please check setup.');
            }
            return res.json();
        })
        .then(resData => {
            setData(resData);
            setLoading(false);
        })
        .catch(err => {
            setError(err.message);
            setLoading(false);
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">AI Intelligence</h1>
                <p className="mt-1 text-sm text-gray-500">Run curriculum analyses, generate executive summaries, and flag at-risk candidates using AI.</p>
            </div>

            {/* Submenu tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                {[
                    { id: 'performance', label: 'Performance Analysis', path: '/ai/performance-analysis' },
                    { id: 'risk', label: 'Risk Detection', path: '/ai/risk-detection' },
                    { id: 'recommendations', label: 'Recommendations', path: '/ai/recommendations' },
                    { id: 'executive', label: 'Executive Summaries', path: '/ai/executive-summaries' },
                    { id: 'trend', label: 'Trend Analysis', path: '/ai/trend-analysis' },
                    { id: 'ask', label: 'Ask AI Chat', path: '/ai/ask' }
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

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Select Examination</label>
                        <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            <option value="">Select Exam</option>
                            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Select Class Level</label>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            <option value="">Select Class</option>
                            {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Select School (Optional)</label>
                        <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            <option value="">All Schools</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end mb-6">
                    <button onClick={handleRunAnalysis} className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white">Run AI Insight Analysis</button>
                </div>

                {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 mb-6">{error}</div>}

                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0F4C81] border-t-transparent"></div>
                    </div>
                ) : data ? (
                    <div className="prose text-sm text-gray-700 max-w-3xl space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">AI Findings & Insights</h3>
                        <p className="whitespace-pre-wrap">{data.analysis || data.summary || JSON.stringify(data, null, 2)}</p>
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-400">Select parameters and run analysis to compile AI insights.</p>
                )}
            </div>
        </div>
    );
}

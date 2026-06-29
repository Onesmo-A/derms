import React, { useState, useEffect } from 'react';

export default function ResultsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'process' | 'publish' | 'history'>('process');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

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

    const handleProcess = (examId: string) => {
        setProcessingId(examId);
        fetch(`/api/v1/examinations/${examId}/process`, {
            method: 'POST',
            headers
        })
        .then(res => res.json())
        .then(() => {
            alert('Processing job successfully dispatched to Redis queue.');
            fetchExams();
            setProcessingId(null);
        })
        .catch(() => setProcessingId(null));
    };

    const handlePublish = (examId: string, publish: boolean) => {
        const endpoint = publish ? `/api/v1/examinations/${examId}/publish` : `/api/v1/examinations/${examId}/unpublish`;
        fetch(endpoint, {
            method: 'POST',
            headers
        })
        .then(() => {
            fetchExams();
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Results Console</h1>
                <p className="mt-1 text-sm text-gray-500">Run candidate calculations, generate GPAs/ranks, publish/unpublish exam summaries to portals.</p>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('process')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'process' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Process & Rank
                </button>
                <button
                    onClick={() => setActiveTab('publish')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'publish' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Publish Results
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'history' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Processing History
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent"></div>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {activeTab === 'process' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Process Examination Results</h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {exams.map(exam => (
                                    <div key={exam.id} className="rounded-xl border p-5 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-extrabold text-gray-900">{exam.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Status: <span className="uppercase font-semibold">{exam.status}</span></p>
                                        </div>
                                        <div className="mt-6 flex justify-end">
                                            <button
                                                disabled={processingId === exam.id || exam.status === 'processed'}
                                                onClick={() => handleProcess(exam.id)}
                                                className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66] disabled:opacity-50"
                                            >
                                                {processingId === exam.id ? 'Running calculations...' : exam.status === 'processed' ? 'Re-run computations' : 'Process Results'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'publish' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Publish/Unpublish Board</h3>
                            <div className="divide-y divide-gray-200">
                                {exams.map(exam => (
                                    <div key={exam.id} className="py-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{exam.name}</h4>
                                            <p className="text-xs text-gray-500">Status: {exam.status}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {exam.status === 'processed' ? (
                                                <button
                                                    onClick={() => handlePublish(exam.id, true)}
                                                    className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                                >
                                                    Publish Portals
                                                </button>
                                            ) : exam.status === 'published' ? (
                                                <button
                                                    onClick={() => handlePublish(exam.id, false)}
                                                    className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                                                >
                                                    Unpublish Portals
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">Process results to enable publishing</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Processing Logs</h3>
                            <div className="space-y-2">
                                {[
                                    { exam: 'Form Four District Mock', date: 'June 28, 2026', time: '11:42 PM', status: 'Completed', count: '14,820 Candidates' },
                                    { exam: 'Form Two Series Terminal', date: 'June 25, 2026', time: '04:12 PM', status: 'Completed', count: '31,000 Candidates' }
                                ].map((log, index) => (
                                    <div key={index} className="flex justify-between items-center rounded-lg bg-gray-50 p-3 text-sm">
                                        <div>
                                            <div className="font-semibold text-gray-900">{log.exam}</div>
                                            <div className="text-xs text-gray-400">Processed on {log.date} at {log.time}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">{log.status}</span>
                                            <div className="text-xs text-gray-500 mt-1">{log.count}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

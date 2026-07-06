import React, { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';
import { 
    DatabaseZap, 
    RefreshCw, 
    Play, 
    History, 
    CheckCircle2, 
    AlertTriangle, 
    Sliders,
    Search,
    BookOpen,
    Users,
    FileSpreadsheet,
    Activity,
    Loader2,
    Heart,
    Cpu,
    ArrowUpRight,
    Edit3,
    Check,
    Download
} from 'lucide-react';

type Tab = 'internal' | 'external' | 'verification' | 'comparison' | 'analytics' | 'history' | 'health';

export default function ResultsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('internal');
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<any[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // External Importer States
    const [source, setSource] = useState<string>('NECTA');
    const [examType, setExamType] = useState<string>('CSEE');
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | ''>('');
    const [centres, setCentres] = useState<any[]>([]);
    const [loadingYears, setLoadingYears] = useState(false);
    const [loadingCentres, setLoadingCentres] = useState(false);
    const [importMode, setImportMode] = useState<'all' | 'selected_schools' | 'selected_centres'>('selected_schools');
    const [selectedCentres, setSelectedCentres] = useState<string[]>([]);
    const [startingImport, setStartingImport] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Staging Verification States
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [sessionDetails, setSessionDetails] = useState<any[]>([]);
    const [stagedCandidates, setStagedCandidates] = useState<any[]>([]);
    const [loadingStaged, setLoadingStaged] = useState(false);
    const [editingCandId, setEditingCandId] = useState<string | null>(null);
    const [editDivision, setEditDivision] = useState<string>('');
    const [editPoints, setEditPoints] = useState<number>(0);
    const [promotingSessionId, setPromotingSessionId] = useState<string | null>(null);

    // Active session progress state
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [activeSessionDetails, setActiveSessionDetails] = useState<any[]>([]);

    // Comparison States
    const [comparisonReport, setComparisonReport] = useState<any>(null);
    const [loadingComparison, setLoadingComparison] = useState(false);

    // Health / Telemetry States
    const [healthStatus, setHealthStatus] = useState<any>(null);
    const [loadingHealth, setLoadingHealth] = useState(false);

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

    const fetchSessions = () => {
        fetch('/api/v1/imports/sessions', { headers })
            .then(res => res.json())
            .then(data => {
                setSessions(data);
                const running = data.find((s: any) => s.status === 'running');
                if (running) {
                    setActiveSessionId(running.id);
                }
                if (data.length > 0 && !selectedSessionId) {
                    setSelectedSessionId(data[0].id);
                }
            })
            .catch(() => {});
    };

    const checkSystemHealth = () => {
        setLoadingHealth(true);
        fetch('/api/v1/health', { headers })
            .then(res => res.json())
            .then(data => {
                setHealthStatus(data);
                setLoadingHealth(false);
            })
            .catch(() => setLoadingHealth(false));
    };

    useEffect(() => {
        fetchExams();
        fetchSessions();
        checkSystemHealth();
    }, []);

    // Dynamic Discovery: Years list based on selected Source & Exam Type
    useEffect(() => {
        if (activeTab === 'external') {
            setLoadingYears(true);
            fetch(`/api/v1/imports/years?source=${source}&exam_type=${examType}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setYears(data.years || [2025, 2024, 2023, 2022]);
                    setLoadingYears(false);
                })
                .catch(() => {
                    setYears([2025, 2024, 2023, 2022]);
                    setLoadingYears(false);
                });
        }
    }, [source, examType, activeTab]);

    // Dynamic Discovery: Centre index list based on year
    useEffect(() => {
        if (selectedYear) {
            setLoadingCentres(true);
            fetch(`/api/v1/imports/centres?source=${source}&exam_type=${examType}&year=${selectedYear}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setCentres(data.centres || []);
                    setLoadingCentres(false);
                })
                .catch(() => setLoadingCentres(false));
        }
    }, [selectedYear]);

    // Fetch Staged Candidates for Verification
    useEffect(() => {
        if (selectedSessionId && (activeTab === 'verification' || activeTab === 'comparison')) {
            setLoadingStaged(true);
            fetch(`/api/v1/imports/sessions/${selectedSessionId}`, { headers })
                .then(res => res.json())
                .then(data => {
                    setActiveSession(data.session);
                    setSessionDetails(data.details || []);
                    // Fetch candidates
                    setStagedCandidates(data.session.candidates || []);
                    setLoadingStaged(false);
                })
                .catch(() => setLoadingStaged(false));
        }
    }, [selectedSessionId, activeTab]);

    // WebSocket / Polling progress tracker for active session
    useEffect(() => {
        if (activeSessionId) {
            const fetchProgress = () => {
                fetch(`/api/v1/imports/sessions/${activeSessionId}`, { headers })
                    .then(res => res.json())
                    .then(data => {
                        setActiveSession(data.session);
                        setActiveSessionDetails(data.details || []);
                        if (data.session.status !== 'running') {
                            setActiveSessionId(null);
                            fetchSessions();
                        }
                    })
                    .catch(() => {});
            };
            fetchProgress();
            const interval = setInterval(fetchProgress, 3000);
            return () => clearInterval(interval);
        }
    }, [activeSessionId]);

    const handleProcess = (examId: string) => {
        setProcessingId(examId);
        fetch(`/api/v1/examinations/${examId}/process`, {
            method: 'POST',
            headers
        })
        .then(res => res.json())
        .then(() => {
            toast.success('Processing calculations job dispatched.');
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
        }).then(() => fetchExams());
    };

    const startResultsImport = () => {
        if (!selectedYear) return;
        setStartingImport(true);
        fetch('/api/v1/imports/start-import', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                source,
                exam_type: examType,
                year: Number(selectedYear),
                mode: importMode,
                selected_centres: selectedCentres
            })
        })
        .then(res => res.json())
        .then(data => {
            setStartingImport(false);
            if (data.import_session_id) {
                setActiveSessionId(data.import_session_id);
                fetchSessions();
                toast.success(data.message);
            } else {
                toast.error(data.message || 'Error occurred.');
            }
        })
        .catch(() => setStartingImport(false));
    };

    const toggleCentreSelection = (code: string) => {
        if (selectedCentres.includes(code)) {
            setSelectedCentres(selectedCentres.filter(c => c !== code));
        } else {
            setSelectedCentres([...selectedCentres, code]);
        }
    };


    const handlePromote = (sessionId: string) => {
        toast('Promote raw staging results to production tables?', {
            description: 'Database snapshot backup will be created.',
            action: {
                label: 'Confirm',
                onClick: () => {
                    setPromotingSessionId(sessionId);
                    fetch(`/api/v1/imports/sessions/${sessionId}/approve`, {
                        method: 'POST',
                        headers
                    })
                    .then(res => res.json().then(data => ({ status: res.status, data })))
                    .then(({ status, data }) => {
                        setPromotingSessionId(null);
                        if (status >= 400 || data.error) {
                            toast.error(data.error ? `${data.message}: ${data.error}` : data.message);
                        } else {
                            toast.success(data.message);
                            fetchSessions();
                        }
                    })
                    .catch(() => setPromotingSessionId(null));
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            }
        });
    };

    const handleDiscard = (sessionId: string) => {
        toast('Are you sure you want to discard this staging session?', {
            description: 'All raw candidates, subjects, and summaries will be permanently deleted.',
            action: {
                label: 'Discard',
                onClick: () => {
                    fetch(`/api/v1/imports/sessions/${sessionId}`, {
                        method: 'DELETE',
                        headers
                    })
                    .then(res => res.json().then(data => ({ status: res.status, data })))
                    .then(({ status, data }) => {
                        if (status >= 400 || data.error) {
                            toast.error(data.message || 'Error discarding session.');
                        } else {
                            toast.success(data.message || 'Staging session discarded.');
                            setSelectedSessionId('');
                            setActiveSession(null);
                            setStagedCandidates([]);
                            fetchSessions();
                        }
                    })
                    .catch(() => toast.error('Connection error occurred.'));
                }
            },
            cancel: {
                label: 'Cancel',
                onClick: () => {}
            }
        });
    };

    const handleResume = (sessionId: string) => {
        fetch(`/api/v1/imports/sessions/${sessionId}/resume`, {
            method: 'POST',
            headers
        })
        .then(res => res.json())
        .then(data => {
            toast.success(data.message);
            setActiveSessionId(sessionId);
            fetchSessions();
        });
    };

    const handleRetryCentre = (sessionId: string, centreNo: string) => {
        fetch(`/api/v1/imports/sessions/${sessionId}/retry-centre`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ centre_number: centreNo })
        })
        .then(res => res.json())
        .then(data => {
            toast.success(data.message);
            setActiveSessionId(sessionId);
        });
    };

    const runComparisonAnalysis = (sessionId: string) => {
        setLoadingComparison(true);
        fetch(`/api/v1/imports/sessions/${sessionId}/comparison`, { headers })
            .then(res => res.json())
            .then(data => {
                setComparisonReport(data);
                setLoadingComparison(false);
            })
            .catch(() => setLoadingComparison(false));
    };

    const editCandidate = (cand: any) => {
        setEditingCandId(cand.id);
        setEditDivision(cand.division || '');
        setEditPoints(cand.points || 0);
    };

    const saveCandidateModifications = (candId: string) => {
        // Staging Modifications inline save logic
        setStagedCandidates(stagedCandidates.map(c => {
            if (c.id === candId) {
                return { ...c, division: editDivision, points: editPoints };
            }
            return c;
        }));
        setEditingCandId(null);
    };

    const filteredCentres = centres.filter(c => 
        c.centre_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.school_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Results Console</h1>
                <p className="mt-1 text-sm text-gray-500 font-medium">Pluggable external results staging pipelines, discrepancy reports verification, and telemetry metrics.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('internal')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === 'internal' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Sliders className="h-4 w-4 inline mr-2" />
                    Internal Mocks
                </button>
                <button
                    onClick={() => setActiveTab('external')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === 'external' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <DatabaseZap className="h-4 w-4 inline mr-2" />
                    External Importer
                </button>
                <button
                    onClick={() => setActiveTab('verification')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === 'verification' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <CheckCircle2 className="h-4 w-4 inline mr-2" />
                    Staging Verification
                </button>
                <button
                    onClick={() => setActiveTab('comparison')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === 'comparison' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    Comparisons
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === 'history' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <History className="h-4 w-4 inline mr-2" />
                    Import History
                </button>
                <button
                    onClick={() => setActiveTab('health')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition ${activeTab === 'health' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Heart className="h-4 w-4 inline mr-2" />
                    System Health Check
                </button>
            </div>

            {/* Content Panels */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                
                {/* 1. INTERNAL RESULTS */}
                {activeTab === 'internal' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Process & Publish Local Results</h3>
                        {loading ? (
                            <div className="flex h-64 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                {exams.map(exam => (
                                    <div key={exam.id} className="rounded-2xl border p-5 flex flex-col justify-between hover:shadow-md transition">
                                        <div>
                                            <h4 className="font-extrabold text-gray-900 text-lg">{exam.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Status: <span className="uppercase font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">{exam.status}</span></p>
                                        </div>
                                        <div className="mt-6 flex justify-end gap-3">
                                            {exam.status === 'processed' ? (
                                                <button
                                                    onClick={() => handlePublish(exam.id, true)}
                                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                                                >
                                                    Publish Portals
                                                </button>
                                            ) : exam.status === 'published' ? (
                                                <button
                                                    onClick={() => handlePublish(exam.id, false)}
                                                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
                                                >
                                                    Unpublish Portals
                                                </button>
                                            ) : null}
                                            <button
                                                disabled={processingId === exam.id || exam.status === 'processed'}
                                                onClick={() => handleProcess(exam.id)}
                                                className="rounded-xl bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66] transition disabled:opacity-50"
                                            >
                                                {processingId === exam.id ? 'Running calculations...' : exam.status === 'processed' ? 'Re-run computations' : 'Process Results'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. EXTERNAL PLUGGABLE IMPORTER */}
                {activeTab === 'external' && (
                    <div className="space-y-6">
                        <div className="border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-900">External Boards Import Hub</h3>
                            <p className="text-xs text-gray-500 font-medium">Pluggable result importer pipeline configuration console.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Source System</label>
                                    <SearchableSelect
                                        value={source}
                                        onValueChange={(value) => {
                                            setSource(value);
                                            setSelectedYear('');
                                            setCentres([]);
                                        }}
                                        placeholder="Select Source System"
                                        searchPlaceholder="Search source..."
                                        options={[
                                            { value: 'NECTA', label: 'NECTA Portal (Tanzania)' },
                                            { value: 'CAMBRIDGE', label: 'Cambridge Plugins (Stub)' },
                                            { value: 'EXCEL', label: 'Excel spreadsheet Importer (Stub)' },
                                        ]}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Exam Classification</label>
                                    <SearchableSelect
                                        value={examType}
                                        onValueChange={(value) => {
                                            setExamType(value);
                                            setSelectedYear('');
                                            setCentres([]);
                                        }}
                                        placeholder="Select Exam Type"
                                        searchPlaceholder="Search exam type..."
                                        options={['CSEE', 'ACSEE', 'FTNA', 'SFNA', 'PSLE'].map(t => ({ value: t, label: t }))}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Discovered Years</label>
                                    {loadingYears ? (
                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#0F4C81]" />
                                            Discovering published years...
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            value={selectedYear === '' ? '' : String(selectedYear)}
                                            onValueChange={(value) => setSelectedYear(value ? Number(value) : '')}
                                            placeholder="Select Year"
                                            searchPlaceholder="Search year..."
                                            options={years.map(y => ({ value: String(y), label: String(y) }))}
                                            className="mt-1"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Import Staging Mode</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                            <input type="radio" checked={importMode === 'selected_schools'} onChange={() => setImportMode('selected_schools')} name="mode" className="text-[#0F4C81]" />
                                            Import Selected Schools (DB Mapped)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                            <input type="radio" checked={importMode === 'all'} onChange={() => setImportMode('all')} name="mode" className="text-[#0F4C81]" />
                                            Import All Board Centres
                                        </label>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                                            <input type="radio" checked={importMode === 'selected_centres'} onChange={() => setImportMode('selected_centres')} name="mode" className="text-[#0F4C81]" />
                                            Advanced Mode: Checked Centres
                                        </label>
                                    </div>
                                </div>

                                <button
                                    disabled={!selectedYear || startingImport}
                                    onClick={startResultsImport}
                                    className="w-full flex items-center justify-center gap-2 mt-6 rounded-xl bg-[#0F4C81] py-3 text-sm font-bold text-white hover:bg-[#0c3c66] transition disabled:opacity-50"
                                >
                                    {startingImport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                    Initialize Import Pipeline
                                </button>
                                
                                {activeSessionId && activeSession?.status === 'running' && (
                                    <div className="mt-4 p-4 border rounded-xl bg-blue-50">
                                        <div className="flex justify-between text-xs font-bold text-[#0F4C81] mb-2">
                                            <span>Importing Data...</span>
                                            <span>{activeSession.processed_centres} / {activeSession.total_centres} Centres</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-[#0F4C81] h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, (activeSession.processed_centres / Math.max(1, activeSession.total_centres)) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-gray-900">Discovered Board Centres ({filteredCentres.length})</h4>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search centre or school..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-300 w-64 outline-none focus:border-[#0F4C81]"
                                        />
                                        <Search className="h-3 w-3 absolute left-2.5 top-2.5 text-gray-400" />
                                    </div>
                                </div>

                                {loadingCentres ? (
                                    <div className="flex h-48 flex-col items-center justify-center text-xs text-gray-500">
                                        <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81] mb-2" />
                                        Discovering centres...
                                    </div>
                                ) : filteredCentres.length === 0 ? (
                                    <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl text-xs text-gray-400 font-medium">
                                        No centres discovered. Select classification and year to fetch.
                                    </div>
                                ) : (
                                    <div className="border rounded-2xl max-h-96 overflow-y-auto divide-y">
                                        {filteredCentres.map(c => (
                                            <div key={c.centre_number} className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition">
                                                <div className="flex items-center gap-3">
                                                    {importMode === 'selected_centres' && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCentres.includes(c.centre_number)}
                                                            onChange={() => toggleCentreSelection(c.centre_number)}
                                                            className="rounded text-[#0F4C81] focus:ring-[#0F4C81] h-4 w-4"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-bold text-[#0F4C81]">{c.centre_number}</p>
                                                        <p className="text-sm font-bold text-gray-800 uppercase leading-snug">{c.school_name}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-semibold text-gray-400">DISCOVERED</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. STAGING VERIFICATION PANEL */}
                {activeTab === 'verification' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Staging Verification & Staged Modifications</h3>
                                <p className="text-xs text-gray-500 font-semibold">Inspect and resolve warnings in staging before promoting to production records.</p>
                            </div>
                            <div className="flex gap-2">
                                <SearchableSelect
                                    value={selectedSessionId}
                                    onValueChange={setSelectedSessionId}
                                    placeholder="Select Import Session"
                                    searchPlaceholder="Search session..."
                                    options={sessions.filter(s => s.status !== 'promoted').map(s => ({
                                        value: s.id,
                                        label: `${s.source_system} - ${s.exam_type} (${s.year})`,
                                    }))}
                                    className="min-w-[240px]"
                                />
                            </div>
                        </div>

                        {loadingStaged ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : stagedCandidates.length === 0 ? (
                            <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl text-xs text-gray-400 font-medium">
                                No staging candidates loaded. Select an import session.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border">
                                    <div>
                                        <h4 className="font-bold text-gray-900">Session Status: <span className="uppercase text-[#0F4C81]">{activeSession?.status}</span></h4>
                                        <p className="text-xs text-gray-500">Staged: {stagedCandidates.length} watahiniwa. Parser v{activeSession?.parser_version}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            disabled={promotingSessionId === selectedSessionId}
                                            onClick={() => handleDiscard(selectedSessionId)}
                                            className="rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 text-xs font-bold transition flex items-center gap-1.5"
                                        >
                                            Discard Session
                                        </button>
                                        <button 
                                            disabled={promotingSessionId === selectedSessionId}
                                            onClick={() => handlePromote(selectedSessionId)}
                                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                                        >
                                            {promotingSessionId === selectedSessionId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                                            Promote to Production
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto w-full border rounded-2xl">
                                    <table className="w-full border-collapse text-left text-sm text-gray-500">
                                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                            <tr>
                                                <th className="px-6 py-4 font-bold">Candidate No</th>
                                                <th className="px-6 py-4 font-bold">Centre</th>
                                                <th className="px-6 py-4 font-bold">Gender</th>
                                                <th className="px-6 py-4 font-bold">Division</th>
                                                <th className="px-6 py-4 font-bold">Points</th>
                                                <th className="px-6 py-4 font-bold">Verify Check</th>
                                                <th className="px-6 py-4 font-bold text-right">Modify</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {stagedCandidates.map(cand => (
                                                <tr key={cand.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-bold text-gray-900">{cand.candidate_number}</td>
                                                    <td className="px-6 py-4 font-semibold text-gray-600">{cand.centre_number}</td>
                                                    <td className="px-6 py-4">{cand.gender}</td>
                                                    <td className="px-6 py-4">
                                                        {editingCandId === cand.id ? (
                                                            <input 
                                                                type="text" 
                                                                value={editDivision}
                                                                onChange={(e) => setEditDivision(e.target.value)}
                                                                className="border rounded px-2 py-0.5 w-16 text-center text-xs font-bold"
                                                            />
                                                        ) : (
                                                            <span className="font-bold">{cand.division}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {editingCandId === cand.id ? (
                                                            <input 
                                                                type="number" 
                                                                value={editPoints}
                                                                onChange={(e) => setEditPoints(Number(e.target.value))}
                                                                className="border rounded px-2 py-0.5 w-16 text-center text-xs font-bold"
                                                            />
                                                        ) : (
                                                            cand.points
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                                                            VALID
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {editingCandId === cand.id ? (
                                                            <button 
                                                                onClick={() => saveCandidateModifications(cand.id)}
                                                                className="rounded-lg bg-slate-900 p-1 text-white hover:bg-slate-800"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => editCandidate(cand)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                <Edit3 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. COMPARISON CONSOLE */}
                {activeTab === 'comparison' && (
                    <div className="space-y-6">
                        <div className="border-b pb-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">External vs Internal Mocks Comparisons</h3>
                                <p className="text-xs text-gray-500 font-semibold">Grade and points deviations report checker.</p>
                            </div>
                            <div className="flex gap-2">
                                <SearchableSelect
                                    value={selectedSessionId}
                                    onValueChange={setSelectedSessionId}
                                    placeholder="Select Import Session"
                                    searchPlaceholder="Search session..."
                                    options={sessions.map(s => ({
                                        value: s.id,
                                        label: `${s.source_system} - ${s.exam_type} (${s.year})`,
                                    }))}
                                    className="min-w-[240px]"
                                />
                                <button 
                                    disabled={!selectedSessionId || loadingComparison}
                                    onClick={() => runComparisonAnalysis(selectedSessionId)}
                                    className="rounded-xl bg-[#0F4C81] px-4 py-2 text-xs font-bold text-white hover:bg-[#0c3c66] disabled:opacity-50"
                                >
                                    Run Comparison
                                </button>
                            </div>
                        </div>

                        {loadingComparison ? (
                            <div className="flex h-64 flex-col items-center justify-center text-xs text-gray-500">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81] mb-2" />
                                Analyzing grading data...
                            </div>
                        ) : comparisonReport ? (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                                        <p className="text-xs font-semibold text-emerald-800 uppercase">Aligned Matches</p>
                                        <p className="text-3xl font-black text-emerald-900 mt-1">{comparisonReport.summary.matches}</p>
                                    </div>
                                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                                        <p className="text-xs font-semibold text-rose-800 uppercase">Grade/Div Mismatches</p>
                                        <p className="text-3xl font-black text-rose-900 mt-1">
                                            {comparisonReport.summary.grade_mismatches_count + comparisonReport.summary.division_mismatches_count}
                                        </p>
                                    </div>
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                                        <p className="text-xs font-semibold text-amber-800 uppercase">Missing in Database</p>
                                        <p className="text-3xl font-black text-amber-900 mt-1">{comparisonReport.summary.missing_in_db_count}</p>
                                    </div>
                                    <div className="bg-slate-50 border p-4 rounded-2xl">
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Missing in Board</p>
                                        <p className="text-3xl font-black text-gray-900 mt-1">{comparisonReport.summary.missing_in_staged_count}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 border rounded-2xl p-4 bg-slate-50">
                                    <h4 className="font-bold text-gray-900 text-sm">Detailed Deviation Logs</h4>
                                    
                                    {comparisonReport.division_mismatches.length === 0 && comparisonReport.grade_mismatches.length === 0 ? (
                                        <div className="p-4 border rounded-2xl bg-green-50 text-xs font-semibold text-green-700 flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />
                                            Clean alignment. External grades matched mocked profiles.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {comparisonReport.division_mismatches.map((m: any) => (
                                                <div key={m.candidate_number} className="flex justify-between items-center bg-white p-3 border rounded-xl text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-700">{m.candidate_number}</span>
                                                        <span className="ml-2 font-medium text-gray-500">{m.student_name}</span>
                                                    </div>
                                                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                                        Division Mismatch: Staged({m.staged_division}) vs DB({m.db_division})
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* 5. ANALYTICS */}
                {activeTab === 'analytics' && (
                    <div className="space-y-4 text-center py-12">
                        <Cpu className="h-12 w-12 text-[#0F4C81] mx-auto animate-bounce" />
                        <h3 className="text-lg font-bold text-gray-900 mt-4">Intelligent AI Predictions Engine</h3>
                        <p className="text-xs text-gray-500 font-medium max-w-sm mx-auto">AI anomaly checking, score forecasting, and school rankings dashboard are staged under plugin AI folders.</p>
                    </div>
                )}

                {/* 6. IMPORT HISTORY */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Import Sessions History</h3>
                            <button onClick={fetchSessions} className="rounded-xl border p-2 hover:bg-slate-50">
                                <RefreshCw className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl text-xs text-gray-400 font-medium">
                                No previous import session records found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="w-full border-collapse text-left text-sm text-gray-500">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Source / Type</th>
                                            <th className="px-6 py-4 font-bold">Centres</th>
                                            <th className="px-6 py-4 font-bold">Students</th>
                                            <th className="px-6 py-4 font-bold">Parser v</th>
                                            <th className="px-6 py-4 font-bold">Status</th>
                                            <th className="px-6 py-4 font-bold">Started By</th>
                                            <th className="px-6 py-4 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {sessions.map(s => (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-bold text-gray-900 uppercase">
                                                    {s.source_system} {s.exam_type} ({s.year})
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-gray-700">
                                                    {s.processed_centres} / {s.total_centres}
                                                    {s.failed_centres > 0 && <span className="text-rose-600 ml-1">({s.failed_centres} failed)</span>}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-600">
                                                    {s.total_students ? s.total_students.toLocaleString() : '0'}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold">{s.parser_version}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                                                        s.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                        s.status === 'running' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                                        'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold">{s.started_by_name || 'Admin'}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {s.status === 'failed' && (
                                                            <button 
                                                                onClick={() => handleResume(s.id)}
                                                                className="rounded-xl bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700"
                                                            >
                                                                Resume
                                                            </button>
                                                        )}
                                                        {s.status === 'completed' && (
                                                            <button 
                                                                onClick={() => handlePromote(s.id)}
                                                                className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                                                            >
                                                                Approve
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* 7. SYSTEM HEALTH CHECK PANEL */}
                {activeTab === 'health' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">National Platform Diagnostic Heartbeat</h3>
                                <p className="text-xs text-gray-500 font-semibold">Verify active daemon configurations, cache settings, and telemetry metrics.</p>
                            </div>
                            <button onClick={checkSystemHealth} className="rounded-xl border p-2 hover:bg-slate-50">
                                <RefreshCw className="h-4 w-4 text-gray-600" />
                            </button>
                        </div>

                        {loadingHealth ? (
                            <div className="flex h-48 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-[#0F4C81]" />
                            </div>
                        ) : healthStatus ? (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 border p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase">Laravel Server</p>
                                            <p className="text-lg font-black text-gray-900 mt-1">{healthStatus.laravel}</p>
                                        </div>
                                        <div className="h-3 w-3 rounded-full bg-green-500 animate-ping"></div>
                                    </div>
                                    <div className="bg-slate-50 border p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase">Database connection</p>
                                            <p className="text-lg font-black text-gray-900 mt-1">{healthStatus.database}</p>
                                        </div>
                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="bg-slate-50 border p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase">Redis cache daemon</p>
                                            <p className="text-lg font-black text-gray-900 mt-1">{healthStatus.redis}</p>
                                        </div>
                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="bg-slate-50 border p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase">Python FastAPI engine</p>
                                            <p className="text-lg font-black text-[#0F4C81] mt-1">{healthStatus.python_service}</p>
                                        </div>
                                        <div className={`h-3 w-3 rounded-full ${healthStatus.python_service === 'OK' ? 'bg-green-500' : 'bg-rose-500 animate-pulse'}`}></div>
                                    </div>
                                </div>

                                {healthStatus.telemetry && (
                                    <div className="border rounded-2xl p-5 bg-slate-50 space-y-4">
                                        <h4 className="font-bold text-gray-800 text-sm">Telemetry throughput execution stats</h4>
                                        <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-gray-600">
                                            <div>
                                                <p className="text-gray-400 uppercase">Processed Students</p>
                                                <p className="text-lg font-extrabold text-gray-900 mt-1">{healthStatus.telemetry.processed_students || 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 uppercase">Processing duration</p>
                                                <p className="text-lg font-extrabold text-gray-900 mt-1">{healthStatus.telemetry.processing_time_sec ? healthStatus.telemetry.processing_time_sec.toFixed(2) : 0}s</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 uppercase">Rate Speed</p>
                                                <p className="text-lg font-extrabold text-[#0F4C81] mt-1">{healthStatus.telemetry.throughput_students_per_sec ? healthStatus.telemetry.throughput_students_per_sec.toFixed(1) : 0} students/s</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}

            </div>
        </div>
    );
}

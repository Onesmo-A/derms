import React, { useState } from 'react';

export default function SystemSettingsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'sms' | 'ai' | 'reports' | 'backup'>('general');
    const [smsKey, setSmsKey] = useState('beem-sec-key-********');
    const [smsSender, setSmsSender] = useState('DERMS_ALRT');
    const [aiEngine, setAiEngine] = useState('gemini-1.5-flash');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">System Settings</h1>
                <p className="mt-1 text-sm text-gray-500">Configure global application profiles, API keys, notification defaults, and backup processes.</p>
            </div>

            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'general' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    General Settings
                </button>
                <button
                    onClick={() => setActiveTab('sms')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'sms' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    SMS Gateway
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'ai' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    AI Engines
                </button>
                <button
                    onClick={() => setActiveTab('reports')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'reports' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Report Templates
                </button>
                <button
                    onClick={() => setActiveTab('backup')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'backup' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Backup & Restore
                </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                {activeTab === 'general' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-gray-900">General Settings</h3>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">District Name</label>
                            <input type="text" defaultValue="Kinondoni Municipal Council" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Official Contact Email</label>
                            <input type="email" defaultValue="info@kinondoni.go.tz" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <button className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66]">Save General Info</button>
                    </div>
                )}

                {activeTab === 'sms' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-gray-900">Beem Africa SMS Integration</h3>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">API Key / Token</label>
                            <input type="password" value={smsKey} onChange={e => setSmsKey(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Sender ID</label>
                            <input type="text" value={smsSender} onChange={e => setSmsSender(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <button className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66]">Save Gateway Keys</button>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-gray-900">AI Model Setup</h3>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Primary AI Inference Model</label>
                            <select value={aiEngine} onChange={e => setAiEngine(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gpt-4o">OpenAI GPT-4o</option>
                            </select>
                        </div>
                        <button className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66]">Save AI Settings</button>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">PDF Report Templates</h3>
                        <p className="text-sm text-gray-500">Configure signature lines, district emblem/logo files, and header titles for PDF slips.</p>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
                            Upload District Seal/Emblem (PNG/JPG format up to 2MB)
                        </div>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Data Backup Logs</h3>
                            <button className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">Run Manual Backup</button>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm">
                                <div><span className="font-semibold">derms_backup_2026_06_28.sql.gz</span> (PostgreSQL dump)</div>
                                <div className="text-xs text-gray-400">June 28, 2026 - 12.4 MB</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

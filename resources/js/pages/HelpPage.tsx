import React, { useState } from 'react';

export default function HelpPage() {
    const [activeTab, setActiveTab] = useState<'guide' | 'faqs' | 'about'>('guide');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Help & Support</h1>
                <p className="mt-1 text-sm text-gray-500">Read user guides, review frequently asked questions, or contact the technical support team.</p>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'guide' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    User Guide & Docs
                </button>
                <button
                    onClick={() => setActiveTab('faqs')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'faqs' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    FAQs
                </button>
                <button
                    onClick={() => setActiveTab('about')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'about' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    About System
                </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                {activeTab === 'guide' && (
                    <div className="space-y-4 max-w-3xl">
                        <h3 className="text-lg font-bold text-gray-900">District Administrator Guide</h3>
                        <div className="prose text-sm text-gray-600 space-y-4">
                            <p>Welcome to DERMS. The typical workflow for running an examination is:</p>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li><strong>Academic Setup</strong>: Ensure you have an active academic year, class levels, and subjects configured.</li>
                                <li><strong>Schools & Students Registration</strong>: Roster schools and upload student files via Excel bulk templates.</li>
                                <li><strong>Create Examination</strong>: Set up the exam parameters, specify start/end dates, and map tested subjects.</li>
                                <li><strong>Marks Entry</strong>: School admins or teachers input theory and practical grades into the spreadsheet entry grid.</li>
                                <li><strong>Results Processing</strong>: Run candidate calculations. The system selects the best 7 subjects, sums points, assigns divisions (I-0), and outputs ranks.</li>
                                <li><strong>Publish & Notify</strong>: Click publish to populate student slips and merit sheets, then dispatch SMS notifications.</li>
                            </ol>
                        </div>
                    </div>
                )}

                {activeTab === 'faqs' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Frequently Asked Questions</h3>
                        <div className="space-y-4 max-w-3xl">
                            <div>
                                <h4 className="font-semibold text-gray-800">Q: How does the system compute GPA?</h4>
                                <p className="text-sm text-gray-600 mt-1">A: Standard NECTA GPA calculations are based on student points (A=1 point, B=2 points, C=3 points, D=4 points, F=5 points). Lower GPA values represent better academic performance.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Q: What if a candidate was absent during one paper?</h4>
                                <p className="text-sm text-gray-600 mt-1">A: The marks entry module supports validation checks and absent options. Absent status maps points directly to F/0 and marks the candidate record accordingly.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">About DERMS</h3>
                        <p className="text-sm text-gray-600 max-w-xl">
                            District Examination & Results Management System (DERMS) is built using Laravel 13, React 19, and PostgreSQL. It delivers high-efficiency educational data analytics and helps councils manage examination processing seamlessly.
                        </p>
                        <div className="text-xs text-gray-400">Version 1.0.0 (Release June 2026)</div>
                    </div>
                )}
            </div>
        </div>
    );
}

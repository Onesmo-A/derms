import React, { useState, useEffect } from 'react';

export default function NotificationsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'sms' | 'email' | 'templates' | 'logs'>('sms');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    useEffect(() => {
        setLoading(true);
        fetch('/api/v1/notifications/sms/logs', { headers })
            .then(res => res.json())
            .then(data => {
                setLogs(Array.isArray(data) ? data : data.data || []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [activeTab]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Notifications Center</h1>
                <p className="mt-1 text-sm text-gray-500">Dispatch result SMS alerts to parents, configure email campaigns, and view delivery logs.</p>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('sms')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'sms' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    SMS Alerts
                </button>
                <button
                    onClick={() => setActiveTab('email')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'email' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Email Notifications
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'templates' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Notification Templates
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'logs' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Delivery Logs
                </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                {activeTab === 'sms' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-gray-900">Send Results via SMS</h3>
                        <p className="text-sm text-gray-500">Trigger standard Swahili notification alerts containing grades and division summaries to registered parent contact numbers.</p>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Select Examination</label>
                            <select className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                                <option>Kinondoni Form Four Mock 2026</option>
                            </select>
                        </div>
                        <button className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66]">Dispatch Results SMS Queue</button>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="space-y-4 max-w-xl">
                        <h3 className="text-lg font-bold text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Configure SMTP/Mail gun queues to email PDF result sheets to School Administrators.</p>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700">Subject</label>
                            <input type="text" defaultValue="District Exam Results Released" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <button className="rounded-lg bg-[#0F4C81] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3c66]">Send Test Mail</button>
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Notification Templates</h3>
                        <div className="rounded-xl border p-4 bg-gray-50 max-w-2xl">
                            <div className="font-bold text-gray-800 text-sm">Swahili SMS Default Results Template:</div>
                            <p className="mt-2 text-sm font-mono text-gray-600">
                                "Ndugu Mzazi, matokeo ya mwanao {`{student_name}`} ({`{exam_number}`}) katika {`{exam_name}`} ni DIV {`{division}`} (Pointi {`{points}`}). Wastani: {`{average}`}. Hongera!"
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Delivery Status Logs</h3>
                        {loading ? (
                            <div className="h-20 flex items-center justify-center">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0F4C81] border-t-transparent"></div>
                            </div>
                        ) : (
                            <table className="w-full border-collapse text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Recipient Phone</th>
                                        <th className="px-6 py-3 font-semibold">Message</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {logs.length > 0 ? logs.map(l => (
                                        <tr key={l.id}>
                                            <td className="px-6 py-4">{l.recipient_phone || l.phone_number}</td>
                                            <td className="px-6 py-4 text-xs max-w-md truncate">{l.message}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${l.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {l.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-center">No messages have been sent yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

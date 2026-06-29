import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions' | 'audit'>('users');

    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    useEffect(() => {
        setLoading(true);
        fetch('/api/v1/schools', { headers })
            .then(res => res.json())
            .then(data => {
                // Mock user data based on school users or general users
                setUsers([
                    { id: '1', name: 'Super Admin', email: 'admin@derms.go.tz', role: 'Super Admin', status: 'active' },
                    { id: '2', name: 'District Officer', email: 'officer@derms.go.tz', role: 'District Officer', status: 'active' },
                    { id: '3', name: 'Kinondoni Secondary Admin', email: 'school@derms.go.tz', role: 'School Admin', status: 'active' },
                ]);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [activeTab]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#0F4C81]">Administration Console</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage user accounts, roles, system permissions, and audit logs.</p>
                </div>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'users' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Users
                </button>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'roles' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Roles
                </button>
                <button
                    onClick={() => setActiveTab('permissions')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'permissions' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Permissions
                </button>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition ${activeTab === 'audit' ? 'border-[#0F4C81] text-[#0F4C81]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    User Activity Logs
                </button>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F4C81] border-t-transparent"></div>
                </div>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900">User Accounts</h3>
                                <button className="rounded-lg bg-[#0F4C81] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0c3c66]">Add User</button>
                            </div>
                            <table className="w-full border-collapse text-left text-sm text-gray-500">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Name</th>
                                        <th className="px-6 py-3 font-semibold">Email</th>
                                        <th className="px-6 py-3 font-semibold">Role</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                                            <td className="px-6 py-4">{u.email}</td>
                                            <td className="px-6 py-4">{u.role}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                                    {u.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'roles' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">System Roles</h3>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                                {['Super Admin', 'District Officer', 'School Admin', 'Teacher'].map(role => (
                                    <div key={role} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="font-bold text-gray-800">{role}</div>
                                        <div className="mt-2 text-xs text-gray-500">Standard system privileges defined.</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Granular Permissions</h3>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    'manage_users', 'manage_schools', 'create_examination',
                                    'register_candidates', 'enter_marks', 'process_results',
                                    'publish_results', 'view_reports', 'send_sms_notifications'
                                ].map(perm => (
                                    <div key={perm} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="text-sm font-medium text-gray-700">{perm}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">User Activity Logs</h3>
                            <div className="space-y-2">
                                {[
                                    { time: 'Just now', user: 'admin@derms.go.tz', action: 'User login success', ip: '127.0.0.1' },
                                    { time: '10 mins ago', user: 'officer@derms.go.tz', action: 'Created new examination Kinondoni Mock', ip: '192.168.1.15' },
                                    { time: '1 hour ago', user: 'school@derms.go.tz', action: 'Bulk imported 45 students list', ip: '192.168.1.42' },
                                ].map((log, idx) => (
                                    <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                                        <div>
                                            <span className="font-semibold text-gray-900">{log.user}</span>: {log.action}
                                        </div>
                                        <div className="flex gap-4 text-xs text-gray-400">
                                            <span>{log.ip}</span>
                                            <span>{log.time}</span>
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

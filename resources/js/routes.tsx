import React from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import {
    Activity,
    BadgeCheck,
    BarChart3,
    BellRing,
    BrainCircuit,
    Building2,
    CalendarDays,
    ChartColumn,
    ChevronDown,
    ClipboardList,
    DatabaseZap,
    FileBarChart2,
    FileDown,
    FileSpreadsheet,
    FolderCheck,
    GraduationCap,
    House,
    Layers3,
    LayoutDashboard,
    LogOut,
    MessagesSquare,
    Radar,
    School,
    Settings2,
    ShieldCheck,
    Stars,
    Table2,
    Users2,
    UserCog,
    UserRound,
    VenetianMask,
    BookOpen,
    PanelLeftClose,
    PanelLeftOpen,
    Dot,
    Menu,
    X,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminDashboard from '@/pages/AdminDashboard';
import AcademicSetupPage from '@/pages/AcademicSetupPage';
import SystemSettingsPage from '@/pages/SystemSettingsPage';
import SchoolsPage from '@/pages/SchoolsPage';
import RegionsPage from '@/pages/RegionsPage';
import DistrictsPage from '@/pages/DistrictsPage';
import StudentsPage from '@/pages/StudentsPage';
import ExamsPage from '@/pages/ExamsPage';
import MarksEntryPage from '@/pages/MarksEntryPage';
import ResultsPage from '@/pages/ResultsPage';
import ReportsPage from '@/pages/ReportsPage';
import AiPage from '@/pages/AiPage';
import NotificationsPage from '@/pages/NotificationsPage';
import HelpPage from '@/pages/HelpPage';

type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
    children?: MenuItem[];
};

const menu: MenuItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
        title: 'Administration',
        icon: ShieldCheck,
        children: [
            {
                title: 'User Management',
                icon: Users2,
                children: [
                    { title: 'Users', href: '/users', icon: UserRound },
                    { title: 'Roles', href: '/roles', icon: BadgeCheck },
                    { title: 'Permissions', href: '/permissions', icon: ShieldCheck },
                    { title: 'User Activity Logs', href: '/audit/user-activities', icon: Activity },
                ],
            },
            {
                title: 'Organization Management',
                icon: Building2,
                children: [
                    { title: 'Regions', href: '/regions', icon: House },
                    { title: 'Districts', href: '/districts', icon: Layers3 },
                    { title: 'Schools', href: '/schools', icon: School },
                ],
            },
            {
                title: 'Academic Setup',
                icon: GraduationCap,
                children: [
                    { title: 'Academic Years', href: '/academic-years', icon: CalendarDays },
                    { title: 'Class Levels', href: '/class-levels', icon: Table2 },
                    { title: 'Subjects', href: '/subjects', icon: BookOpen },
                    { title: 'Subject Groups', href: '/subject-groups', icon: FolderCheck },
                    { title: 'Grading Systems', href: '/grading-systems', icon: ClipboardList },
                    { title: 'Division Rules', href: '/division-rules', icon: DatabaseZap },
                ],
            },
            {
                title: 'System Settings',
                icon: Settings2,
                children: [
                    { title: 'General Settings', href: '/settings/general', icon: Settings2 },
                    { title: 'SMS Settings', href: '/settings/sms', icon: MessagesSquare },
                    { title: 'AI Settings', href: '/settings/ai', icon: BrainCircuit },
                    { title: 'Report Templates', href: '/settings/report-templates', icon: FileBarChart2 },
                    { title: 'Backup & Restore', href: '/settings/backup', icon: FileDown },
                    { title: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
                ],
            },
        ],
    },
    {
        title: 'Schools Management',
        icon: School,
        children: [
            { title: 'Schools', href: '/schools', icon: School },
            { title: 'School Categories', href: '/school-categories', icon: ChevronDown },
            { title: 'School Statistics', href: '/school-statistics', icon: BarChart3 },
            { title: 'School Performance History', href: '/school-performance-history', icon: ChartColumn },
        ],
    },
    {
        title: 'Students Management',
        icon: Users2,
        children: [
            { title: 'All Students', href: '/students', icon: Users2 },
            { title: 'Register Students', href: '/students/register', icon: UserCog },
            { title: 'Bulk Import Students', href: '/students/import', icon: FileSpreadsheet },
            { title: 'Candidate Registration', href: '/candidates/register', icon: BadgeCheck },
            { title: 'Student Promotions', href: '/students/promotions', icon: ChevronDown },
            { title: 'Student Transfers', href: '/students/transfers', icon: ChevronDown },
            { title: 'Duplicate Detection', href: '/students/duplicates', icon: Radar },
            { title: 'Student Performance History', href: '/students/performance-history', icon: ChartColumn },
        ],
    },
    {
        title: 'Examinations Management',
        icon: ClipboardList,
        children: [
            { title: 'Examination Types', href: '/examination-types', icon: FolderCheck },
            { title: 'All Examinations', href: '/examinations', icon: ClipboardList },
            { title: 'Create Examination', href: '/examinations/create', icon: BadgeCheck },
            { title: 'Examination Calendar', href: '/examinations/calendar', icon: CalendarDays },
            { title: 'Examination Timetable', href: '/examinations/timetable', icon: FileSpreadsheet },
            { title: 'Assign Subjects', href: '/examinations/subjects/assign', icon: BookOpen },
            { title: 'Subject Configuration', href: '/examinations/subjects/configuration', icon: Settings2 },
            { title: 'Subject Papers Setup', href: '/examinations/subjects/papers', icon: Layers3 },
            { title: 'Register Candidates', href: '/candidates/register', icon: BadgeCheck },
            { title: 'Registered Candidates', href: '/candidates/registered', icon: Users2 },
            { title: 'Import Candidates', href: '/candidates/import', icon: FileSpreadsheet },
            { title: 'Candidate Verification', href: '/candidates/verification', icon: ShieldCheck },
            { title: 'Centers List', href: '/examination-centers', icon: Building2 },
            { title: 'Center Statistics', href: '/examination-centers/statistics', icon: BarChart3 },
        ],
    },
    {
        title: 'Marks Management',
        icon: Table2,
        children: [
            { title: 'Manual Marks Entry', href: '/marks/manual-entry', icon: ClipboardList },
            { title: 'Spreadsheet Entry', href: '/marks/spreadsheet', icon: FileSpreadsheet },
            { title: 'Import Marks', href: '/marks/import', icon: FileDown },
            { title: 'Bulk Update Marks', href: '/marks/bulk-update', icon: DatabaseZap },
            { title: 'Marks Verification', href: '/marks/verification', icon: ShieldCheck },
            { title: 'Practical Entry', href: '/marks/practical-entry', icon: ClipboardList },
            { title: 'Practical Approval', href: '/marks/practical-approval', icon: BadgeCheck },
            { title: 'Practical Summary', href: '/marks/practical-summary', icon: BarChart3 },
            { title: 'Review Marks', href: '/marks/review', icon: ShieldCheck },
            { title: 'Adjust Marks', href: '/marks/adjust', icon: DatabaseZap },
            { title: 'Moderation Logs', href: '/marks/moderation-logs', icon: Activity },
        ],
    },
    {
        title: 'Results Management',
        icon: FileBarChart2,
        children: [
            { title: 'Process Results', href: '/results/process', icon: DatabaseZap },
            { title: 'Reprocess Results', href: '/results/reprocess', icon: DatabaseZap },
            { title: 'Processing History', href: '/results/processing-history', icon: Activity },
            { title: 'Publish Results', href: '/results/publish', icon: Stars },
            { title: 'Unpublish Results', href: '/results/unpublish', icon: VenetianMask },
            { title: 'Publication History', href: '/results/publication-history', icon: Activity },
            { title: 'SMS Result Notifications', href: '/notifications/sms', icon: MessagesSquare },
        ],
    },
    {
        title: 'Reports',
        icon: FileBarChart2,
        children: [
            { title: 'Student Reports', href: '/reports/students', icon: Users2 },
            { title: 'School Reports', href: '/reports/schools', icon: School },
            { title: 'Subject Reports', href: '/reports/subjects', icon: BookOpen },
            { title: 'District Reports', href: '/reports/district', icon: Building2 },
            { title: 'Export Center', href: '/reports/export-center', icon: FileDown },
        ],
    },
    {
        title: 'Analytics',
        icon: BarChart3,
        children: [
            { title: 'School Analysis', href: '/analytics/schools', icon: School },
            { title: 'Subject Analysis', href: '/analytics/subjects', icon: BookOpen },
            { title: 'Student Analysis', href: '/analytics/students', icon: Users2 },
            { title: 'Gender Analysis', href: '/analytics/gender', icon: Users2 },
            { title: 'Performance Trends', href: '/analytics/performance-trends', icon: ChartColumn },
            { title: 'Rankings Analysis', href: '/analytics/rankings', icon: Radar },
            { title: 'Comparative Analysis', href: '/analytics/comparative', icon: BarChart3 },
            { title: 'Trend Predictions', href: '/analytics/predictions', icon: Stars },
        ],
    },
    {
        title: 'AI Intelligence',
        icon: BrainCircuit,
        children: [
            { title: 'Ask AI', href: '/ai/ask', icon: BrainCircuit },
            { title: 'AI Chat History', href: '/ai/history', icon: MessagesSquare },
            { title: 'Saved Analyses', href: '/ai/saved-analyses', icon: FileBarChart2 },
            { title: 'Performance Analysis', href: '/ai/performance-analysis', icon: BarChart3 },
            { title: 'Risk Detection', href: '/ai/risk-detection', icon: ShieldCheck },
            { title: 'Recommendations', href: '/ai/recommendations', icon: ClipboardList },
            { title: 'Executive Summaries', href: '/ai/executive-summaries', icon: FileBarChart2 },
            { title: 'Trend Analysis', href: '/ai/trend-analysis', icon: ChartColumn },
            { title: 'Weak Subjects', href: '/ai/weak-subjects', icon: BookOpen },
            { title: 'Best Schools', href: '/ai/best-schools', icon: School },
            { title: 'At Risk Students', href: '/ai/at-risk-students', icon: Users2 },
            { title: 'Improvement Suggestions', href: '/ai/improvements', icon: ClipboardList },
        ],
    },
    {
        title: 'Notifications',
        icon: BellRing,
        children: [
            { title: 'SMS Notifications', href: '/notifications/sms', icon: MessagesSquare },
            { title: 'Email Notifications', href: '/notifications/email', icon: BellRing },
            { title: 'Notification Templates', href: '/notifications/templates', icon: FileBarChart2 },
            { title: 'Delivery Logs', href: '/notifications/delivery-logs', icon: Activity },
        ],
    },
    {
        title: 'Audit & Monitoring',
        icon: ShieldCheck,
        children: [
            { title: 'Audit Logs', href: '/audit-logs', icon: ShieldCheck },
            { title: 'User Activities', href: '/audit/user-activities', icon: Activity },
            { title: 'Login History', href: '/audit/login-history', icon: Users2 },
            { title: 'System Events', href: '/audit/system-events', icon: Radar },
            { title: 'Error Logs', href: '/audit/error-logs', icon: FileBarChart2 },
        ],
    },
    {
        title: 'Support & Help',
        icon: BookOpen,
        children: [
            { title: 'User Guide', href: '/help/user-guide', icon: BookOpen },
            { title: 'System Documentation', href: '/help/documentation', icon: FileBarChart2 },
            { title: 'FAQs', href: '/help/faqs', icon: ClipboardList },
            { title: 'Contact Support', href: '/help/support', icon: MessagesSquare },
            { title: 'About System', href: '/help/about', icon: DatabaseZap },
        ],
    },
];

const WelcomePage = () => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 text-center text-slate-900">
        <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                District Examination & Results Management System
            </div>
            <h1 className="text-5xl font-black tracking-tight sm:text-6xl">DERMS</h1>
            <p className="mt-4 text-lg text-slate-600">
                A district-wide platform for examinations, results, reports, analytics, and operations.
            </p>
        </div>
        <a href="/dashboard" className="mt-10 rounded-full bg-[#0F4C81] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0c3c66]">
            Open Dashboard
        </a>
    </div>
);

const LoginPage = () => {
    const [email, setEmail] = React.useState('admin@derms.go.tz');
    const [password, setPassword] = React.useState('password');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Invalid login credentials');
            }
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl">
                <h2 className="text-center text-3xl font-black">DERMS Sign In</h2>
                <p className="mt-2 text-center text-sm text-slate-600">Access the district administration console</p>
                {error && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email Address</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-0 focus:border-[#0F4C81]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            required
                            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-0 focus:border-[#0F4C81]"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-[#0F4C81] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c3c66] disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Shell = ({ children }: { children: React.ReactNode }) => {
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    React.useEffect(() => {
        if (typeof document !== 'undefined') {
            document.body.classList.add('overflow-hidden');
            document.documentElement.classList.add('overflow-hidden');
            return () => {
                document.body.classList.remove('overflow-hidden');
                document.documentElement.classList.remove('overflow-hidden');
            };
        }
    }, []);

    const renderItems = (items: MenuItem[], depth = 0) =>
        items.map((item) => {
            const Icon = item.icon;
            if (collapsed && depth > 0) {
                return null;
            }

            if (item.children?.length) {
                return (
                    <details key={item.title} className="group rounded-2xl" open={true}>
                        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
                            {Icon ? <Icon className="h-4 w-4 text-slate-500" /> : null}
                            {!collapsed && <span className="flex-1">{item.title}</span>}
                            {!collapsed && (
                                <ChevronDown className="h-4 w-4 text-slate-500 transition duration-200 group-open:rotate-180" />
                            )}
                        </summary>
                        {!collapsed && (
                            <div className={depth === 0 ? 'ml-4 mt-1 space-y-1 border-l border-slate-200 pl-3' : 'mt-1 space-y-1 pl-2'}>
                                {renderItems(item.children, depth + 1)}
                            </div>
                        )}
                    </details>
                );
            }

            if (!item.href) return null;

            return (
                <NavLink
                    key={item.title}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                        [
                            'group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition duration-200 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:content-[""]',
                            isActive
                                ? 'bg-slate-100 text-[#0F4C81] font-semibold before:bg-[#0F4C81] before:opacity-100'
                                : 'text-slate-700 hover:bg-slate-100 before:bg-transparent before:opacity-0 hover:before:bg-slate-300 hover:before:opacity-100',
                            depth > 0 ? 'ml-1' : '',
                            collapsed ? 'justify-center px-2 before:hidden' : '',
                        ].join(' ')
                    }
                    title={collapsed ? item.title : undefined}
                >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {collapsed ? (
                        <span className="sr-only">{item.title}</span>
                    ) : (
                        <span>{item.title}</span>
                    )}
                </NavLink>
            );
        });

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div className="flex h-full bg-slate-50 text-slate-900 overflow-hidden">
            {/* Mobile Sidebar Overlay Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 shrink-0 border-r border-slate-200 bg-white px-4 py-5 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
                    } ${collapsed ? 'w-[92px]' : 'w-[280px] sm:w-[320px]'}`}
            >
                <div className="mb-4 flex items-center justify-between px-1">
                    {!collapsed ? (
                        <div>
                            <div className="text-2xl font-black tracking-tight text-[#0F4C81]">DERMS</div>
                            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">District Console</div>
                        </div>
                    ) : (
                        <div className="text-xl font-black tracking-tight text-[#0F4C81]">D</div>
                    )}

                    {/* Desktop Toggle */}
                    <button
                        type="button"
                        onClick={() => setCollapsed((value) => !value)}
                        className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </button>

                    {/* Mobile Close */}
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className={`max-h-[calc(100dvh-190px)] space-y-2 overflow-y-auto pr-1 scrollbar-hide ${collapsed ? 'mt-4' : ''}`}>
                    {renderItems(menu)}
                </div>

                {collapsed && (
                    <div className="mt-4 flex justify-center hidden lg:flex">
                        <div className="rounded-full bg-[#0F4C81] px-2.5 py-1 text-[10px] font-semibold text-white">v1.0</div>
                    </div>
                )}

                {!collapsed && (
                    <button
                        onClick={handleLogout}
                        className="mt-5 w-full rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                        Sign Out
                    </button>
                )}

                {collapsed && (
                    <button
                        onClick={handleLogout}
                        className="mt-5 hidden lg:flex w-full items-center justify-center rounded-2xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        aria-label="Sign out"
                    >
                        <span className="sr-only">Sign Out</span>
                        <LogOut className="h-4 w-4" />
                    </button>
                )}
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col min-w-0 min-h-0">
                {/* Mobile Header Topbar */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="text-lg font-black tracking-tight text-[#0F4C81]">DERMS</div>
                    </div>
                    <div className="flex items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F4C81] text-xs font-bold text-white hover:bg-[#0c3c66] transition outline-none">
                                    A
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1">
                                <DropdownMenuLabel className="px-2 py-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 leading-none">Admin User</p>
                                        <p className="text-xs text-slate-500">admin@derms.go.tz</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                                    <NavLink to="/settings/general" className="flex items-center w-full">
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        <span>System Settings</span>
                                    </NavLink>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 pb-10 w-full max-w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

const DashboardPage = () => (
    <Shell>
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-black tracking-tight text-[#0F4C81]">District Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back! Here's a summary of your district's performance.</p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Total Schools', value: '142', icon: School, color: 'from-[#0F4C81] to-[#1a6ab1]' },
                    { label: 'Registered Students', value: '45,231', icon: Users2, color: 'from-emerald-500 to-emerald-600' },
                    { label: 'Active Examinations', value: '3', icon: FileSpreadsheet, color: 'from-blue-500 to-blue-600' },
                    { label: 'Pending Transfers', value: '84', icon: CalendarDays, color: 'from-amber-500 to-amber-600' },
                ].map((stat) => (
                    <div key={stat.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.color} p-5 text-white shadow-md`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{stat.label}</p>
                                <p className="mt-1 text-3xl font-black">{stat.value}</p>
                            </div>
                            <stat.icon className="h-10 w-10 opacity-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </Shell>
);

const PageShell = ({ children }: { children: React.ReactNode }) => <Shell>{children}</Shell>;

const UnauthorizedPage = () => <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900"><h2>Unauthorized Access</h2></div>;
const NotFoundPage = () => <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900"><h2>404 - Page Not Found</h2></div>;

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Administration / Identity Console */}
            <Route path="/users" element={<PageShell><AdminDashboard /></PageShell>} />
            <Route path="/roles" element={<PageShell><AdminDashboard /></PageShell>} />
            <Route path="/permissions" element={<PageShell><AdminDashboard /></PageShell>} />
            <Route path="/audit/user-activities" element={<PageShell><AdminDashboard /></PageShell>} />

            {/* School / Region Setup */}
            <Route path="/schools" element={<PageShell><SchoolsPage /></PageShell>} />
            <Route path="/school-categories" element={<PageShell><SchoolsPage /></PageShell>} />
            <Route path="/school-statistics" element={<PageShell><SchoolsPage /></PageShell>} />
            <Route path="/school-performance-history" element={<PageShell><SchoolsPage /></PageShell>} />
            <Route path="/regions" element={<PageShell><RegionsPage /></PageShell>} />
            <Route path="/districts" element={<PageShell><DistrictsPage /></PageShell>} />

            {/* Academic Setup */}
            <Route path="/academic-years" element={<PageShell><AcademicSetupPage /></PageShell>} />
            <Route path="/class-levels" element={<PageShell><AcademicSetupPage /></PageShell>} />
            <Route path="/subjects" element={<PageShell><AcademicSetupPage /></PageShell>} />
            <Route path="/subject-groups" element={<PageShell><AcademicSetupPage /></PageShell>} />
            <Route path="/grading-systems" element={<PageShell><AcademicSetupPage /></PageShell>} />
            <Route path="/division-rules" element={<PageShell><AcademicSetupPage /></PageShell>} />

            {/* System Settings */}
            <Route path="/settings/general" element={<PageShell><SystemSettingsPage /></PageShell>} />
            <Route path="/settings/sms" element={<PageShell><SystemSettingsPage /></PageShell>} />
            <Route path="/settings/ai" element={<PageShell><SystemSettingsPage /></PageShell>} />
            <Route path="/settings/report-templates" element={<PageShell><SystemSettingsPage /></PageShell>} />
            <Route path="/settings/backup" element={<PageShell><SystemSettingsPage /></PageShell>} />
            <Route path="/audit-logs" element={<PageShell><AdminDashboard /></PageShell>} />

            {/* Students Management */}
            <Route path="/students" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/students/register" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/students/import" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/students/promotions" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/students/transfers" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/students/duplicates" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/students/performance-history" element={<PageShell><StudentsPage /></PageShell>} />

            {/* Candidates */}
            <Route path="/candidates/register" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/candidates/registered" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/candidates/import" element={<PageShell><StudentsPage /></PageShell>} />
            <Route path="/candidates/verification" element={<PageShell><StudentsPage /></PageShell>} />

            {/* Examinations Management */}
            <Route path="/examinations" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examinations/create" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examinations/calendar" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examinations/timetable" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examinations/subjects/assign" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examinations/subjects/configuration" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examinations/subjects/papers" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examination-types" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examination-centers" element={<PageShell><ExamsPage /></PageShell>} />
            <Route path="/examination-centers/statistics" element={<PageShell><ExamsPage /></PageShell>} />

            {/* Marks Management */}
            <Route path="/marks" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/manual-entry" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/spreadsheet" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/import" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/bulk-update" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/verification" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/practical-entry" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/practical-approval" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/practical-summary" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/review" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/adjust" element={<PageShell><MarksEntryPage /></PageShell>} />
            <Route path="/marks/moderation-logs" element={<PageShell><MarksEntryPage /></PageShell>} />

            {/* Results Management */}
            <Route path="/results/process" element={<PageShell><ResultsPage /></PageShell>} />
            <Route path="/results/reprocess" element={<PageShell><ResultsPage /></PageShell>} />
            <Route path="/results/processing-history" element={<PageShell><ResultsPage /></PageShell>} />
            <Route path="/results/publish" element={<PageShell><ResultsPage /></PageShell>} />
            <Route path="/results/unpublish" element={<PageShell><ResultsPage /></PageShell>} />
            <Route path="/results/publication-history" element={<PageShell><ResultsPage /></PageShell>} />

            {/* Reports */}
            <Route path="/reports/students" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/reports/schools" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/reports/subjects" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/reports/district" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/reports/export-center" element={<PageShell><ReportsPage /></PageShell>} />

            {/* Analytics */}
            <Route path="/analytics/schools" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/analytics/subjects" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/analytics/students" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/analytics/gender" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/analytics/performance-trends" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/analytics/rankings" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/analytics/comparative" element={<PageShell><ReportsPage /></PageShell>} />
            <Route path="/analytics/predictions" element={<PageShell><ReportsPage /></PageShell>} />

            {/* AI Intelligence */}
            <Route path="/ai" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/ask" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/history" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/saved-analyses" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/performance-analysis" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/risk-detection" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/recommendations" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/executive-summaries" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/trend-analysis" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/weak-subjects" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/best-schools" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/at-risk-students" element={<PageShell><AiPage /></PageShell>} />
            <Route path="/ai/improvements" element={<PageShell><AiPage /></PageShell>} />

            {/* Notifications */}
            <Route path="/notifications/sms" element={<PageShell><NotificationsPage /></PageShell>} />
            <Route path="/notifications/email" element={<PageShell><NotificationsPage /></PageShell>} />
            <Route path="/notifications/templates" element={<PageShell><NotificationsPage /></PageShell>} />
            <Route path="/notifications/delivery-logs" element={<PageShell><NotificationsPage /></PageShell>} />

            {/* Help & Support */}
            <Route path="/help/user-guide" element={<PageShell><HelpPage /></PageShell>} />
            <Route path="/help/documentation" element={<PageShell><HelpPage /></PageShell>} />
            <Route path="/help/faqs" element={<PageShell><HelpPage /></PageShell>} />
            <Route path="/help/support" element={<PageShell><HelpPage /></PageShell>} />
            <Route path="/help/about" element={<PageShell><HelpPage /></PageShell>} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
);


export default AppRoutes;

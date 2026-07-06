import React from 'react';
import { Link, NavLink, Route, Routes, Navigate, useLocation } from 'react-router-dom';
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
    Eye,
    EyeOff,
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
import SchoolDetailPage from '@/pages/SchoolDetailPage';
import RegionsPage from '@/pages/RegionsPage';
import DistrictsPage from '@/pages/DistrictsPage';
import StudentsPage from '@/pages/StudentsPage';
import ExamsPage from '@/pages/ExamsPage';
import MarksEntryPage from '@/pages/MarksEntryPage';
import ResultsPage from '@/pages/ResultsPage';
import ReportsPage from '@/pages/ReportsPage';
import ReportsDashboardPage from '@/pages/reports/ReportsDashboardPage';
import NationalReportPage from '@/pages/reports/NationalReportPage';
import NationalDetailReportPage from '@/pages/reports/NationalDetailReportPage';
import RegionsReportPage from '@/pages/reports/RegionsReportPage';
import RegionalDetailReportPage from '@/pages/reports/RegionalDetailReportPage';
import RegionReportPage from '@/pages/reports/RegionReportPage';
import DistrictsReportPage from '@/pages/reports/DistrictsReportPage';
import DistrictDetailReportPage from '@/pages/reports/DistrictDetailReportPage';
import DistrictReportPage from '@/pages/reports/DistrictReportPage';
import SchoolsReportPage from '@/pages/reports/SchoolsReportPage';
import SchoolReportPage from '@/pages/reports/SchoolReportPage';
import SchoolDetailReportPage from '@/pages/reports/SchoolDetailReportPage';
import StudentsReportPage from '@/pages/reports/StudentsReportPage';
import InsightsReportPage from '@/pages/reports/InsightsReportPage';
import AiPage from '@/pages/AiPage';
import NotificationsPage from '@/pages/NotificationsPage';
import HelpPage from '@/pages/HelpPage';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppSelector } from '@/hooks/rtk';
import { selectCurrentUser } from '@/features/auth/authSlice';

type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
    children?: MenuItem[];
    roles?: string[];
    permissions?: string[];
};

const ROLE_SUPER_ADMIN = 'Super Administrator';
const ROLE_REO = 'Regional Education Officer (REO)';
const ROLE_DEO = 'District Education Officer (DEO)';
const ROLE_DAO = 'District Academic Officer';
const ROLE_HOS = 'Head of School';
const ROLE_AM = 'Academic Master/Mistress';
const ROLE_TEACHER = 'Subject Teacher';
const ROLE_STUDENT = 'Student';
const ROLE_PARENT = 'Parent';

const canAccessMenuItem = (
    item: MenuItem,
    user: { role?: string; permissions?: string[] } | null,
): boolean => {
    if (!user) {
        return false;
    }

    const role = user.role ?? '';
    const permissions = user.permissions ?? [];

    const roleAllowed = !item.roles?.length || item.roles.includes(role);
    const permissionAllowed = !item.permissions?.length || item.permissions.some((permission) => permissions.includes(permission));

    if (item.children?.length) {
        return item.children.some((child) => canAccessMenuItem(child, user)) && roleAllowed && permissionAllowed;
    }

    return roleAllowed && permissionAllowed;
};

const filterMenuItems = (items: MenuItem[], user: { role?: string; permissions?: string[] } | null): MenuItem[] =>
    items
        .map((item) => {
            if (item.children?.length) {
                const children = filterMenuItems(item.children, user);
                if (!children.length) {
                    return null;
                }

                return { ...item, children };
            }

            return canAccessMenuItem(item, user) ? item : null;
        })
        .filter((item): item is MenuItem => item !== null);

const menu: MenuItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Administration', href: '/users', icon: ShieldCheck, roles: [ROLE_SUPER_ADMIN] },
    { title: 'Academic Setup', href: '/academic-years', icon: GraduationCap, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM] },
    { title: 'Regions', href: '/regions', icon: House, roles: [ROLE_SUPER_ADMIN, ROLE_REO] },
    { title: 'Districts', href: '/districts', icon: Layers3, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO] },
    { title: 'Schools Management', href: '/schools', icon: School, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM] },
    { title: 'Students Management', href: '/students', icon: Users2, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM, ROLE_TEACHER] },
    { title: 'Examinations', href: '/examinations', icon: ClipboardList, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM, ROLE_TEACHER] },
    { title: 'Marks Entry & Moderation', href: '/marks/manual-entry', icon: Table2, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM, ROLE_TEACHER] },
    { title: 'Results Management', href: '/results/process', icon: FileBarChart2, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM, ROLE_TEACHER, ROLE_STUDENT, ROLE_PARENT] },
    {
        title: 'Reports & Analytics',
        icon: FileBarChart2,
        roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM, ROLE_TEACHER, ROLE_STUDENT, ROLE_PARENT],
        children: [
            {
                title: 'Reports',
                icon: FileBarChart2,
                children: [
                    { title: 'Dashboard', href: '/reports', icon: FileBarChart2 },
                    { title: 'National', href: '/reports/national', icon: ShieldCheck },
                    { title: 'Regions', href: '/reports/regions', icon: House },
                    { title: 'Districts', href: '/reports/districts', icon: Building2 },
                    { title: 'Schools', href: '/reports/schools', icon: School },
                    { title: 'Students', href: '/reports/students', icon: Users2 },
                    { title: 'AI Insights', href: '/reports/ai-insights', icon: Stars },
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
        ],
    },
    { title: 'AI Intelligence', href: '/ai', icon: BrainCircuit, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM] },
    { title: 'Notifications', href: '/notifications/sms', icon: BellRing, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM] },
    { title: 'System Settings', href: '/settings/general', icon: Settings2, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO] },
    { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen, roles: [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM, ROLE_TEACHER, ROLE_STUDENT, ROLE_PARENT] },
];

const isMenuItemActive = (item: MenuItem, pathname: string): boolean => {
    if (item.href && item.href === pathname) {
        return true;
    }

    return item.children?.some((child) => isMenuItemActive(child, pathname)) ?? false;
};

type MenuGroupProps = {
    item: MenuItem;
    depth: number;
    collapsed: boolean;
    pathname: string;
    renderItems: (items: MenuItem[], depth?: number) => React.ReactNode;
};

function MenuGroup({ item, depth, collapsed, pathname, renderItems }: MenuGroupProps) {
    const isActive = isMenuItemActive(item, pathname);
    const [manualOpen, setManualOpen] = React.useState(false);
    const isOpen = isActive || manualOpen;
    const Icon = item.icon;
    const isNestedGroup = depth > 0;

    React.useEffect(() => {
        if (!isActive) {
            setManualOpen(false);
        }
    }, [isActive, pathname]);

    const handleToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
        if (!isActive) {
            setManualOpen(event.currentTarget.open);
        }
    };

    const summaryClasses = [
        'flex cursor-pointer list-none items-center gap-3 transition duration-200 [&::-webkit-details-marker]:hidden',
        isNestedGroup ? 'rounded-xl px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]' : 'rounded-2xl px-3 py-2 text-sm font-medium',
        isActive
            ? 'bg-slate-100 text-[#0F4C81] shadow-sm ring-1 ring-slate-200'
            : 'text-slate-700 hover:bg-slate-100',
        collapsed ? 'justify-center px-2' : '',
    ].join(' ');

    const iconClasses = isNestedGroup
        ? 'h-3.5 w-3.5 shrink-0'
        : 'h-4 w-4 shrink-0';

    const chevronClasses = [
        'h-4 w-4 shrink-0 transition-transform duration-200',
        isOpen ? 'rotate-180' : '',
        isActive ? 'text-[#0F4C81]' : 'text-slate-500',
    ].join(' ');

    return (
        <details
            key={item.title}
            open={isOpen}
            onToggle={handleToggle}
            className={['group rounded-2xl', isNestedGroup ? 'ml-2' : ''].join(' ')}
        >
            <summary className={summaryClasses}>
                {Icon ? <Icon className={iconClasses} /> : null}
                {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                {!collapsed && <ChevronDown className={chevronClasses} />}
            </summary>
            {!collapsed && (
                <div className={depth === 0 ? 'ml-4 mt-1 space-y-1 border-l border-slate-200 pl-3' : 'mt-1 space-y-1 border-l border-slate-200 pl-3'}>
                    {renderItems(item.children ?? [], depth + 1)}
                </div>
            )}
        </details>
    );
}


const WelcomePage = () => (
    <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 text-center text-slate-900">
        <div className="flex flex-1 flex-col items-center justify-center max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Iramba District Examination Management System
            </div>
            <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <AppLogoIcon className="h-full w-full object-cover" />
            </div>
            <h1 className="text-5xl font-black tracking-tight sm:text-6xl text-[#0F4C81]">IDEMS</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
                A district-wide platform for examinations, results, reports, analytics, and operations.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a href="/dashboard" className="rounded-full bg-[#0F4C81] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0c3c66]">
                    Open Dashboard
                </a>
            </div>
        </div>
        <footer className="w-full text-center py-4 text-xs text-slate-500 border-t border-slate-200 mt-auto">
            Powered By <a href="https://nativetechnology.africa/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0F4C81] hover:underline">Native Technology</a> · v1.0.0
        </footer>
    </div>
);

const LoginPage = () => {
    const [email, setEmail] = React.useState('admin@idems.go.tz');
    const [password, setPassword] = React.useState('password');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);

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
        <div className="flex min-h-screen flex-col items-center justify-between bg-slate-50 p-4">
            <div className="flex w-full flex-1 items-center justify-center">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                        <AppLogoIcon className="h-full w-full object-cover" />
                    </div>
                    <h2 className="text-center text-3xl font-black">IDEMS Sign In</h2>
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
                            <div className="relative mt-1">
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="block w-full rounded-xl border border-slate-300 bg-white pl-3 pr-10 py-2 text-slate-900 outline-none ring-0 focus:border-[#0F4C81]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
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
            <footer className="w-full text-center py-4 text-xs text-slate-500 border-t border-slate-200 mt-auto">
                Powered By <a href="https://nativetechnology.africa/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0F4C81] hover:underline">Native Technology</a> · v1.0.0
            </footer>
        </div>
    );
};

const Shell = ({ children }: { children: React.ReactNode }) => {
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { pathname } = useLocation();
    const currentUser = useAppSelector(selectCurrentUser);
    const visibleMenu = React.useMemo(() => filterMenuItems(menu, currentUser), [currentUser]);

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
                    <MenuGroup
                        key={item.title}
                        item={item}
                        depth={depth}
                        collapsed={collapsed}
                        pathname={pathname}
                        renderItems={renderItems}
                    />
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
                <div className="mb-4 flex items-center justify-between gap-3 px-1">
                    <Link href="/dashboard" className="min-w-0 flex-1">
                        {!collapsed ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                                    <AppLogoIcon className="h-full w-full object-cover" />
                                </span>
                                <div className="min-w-0">
                                    <div className="truncate text-[15px] font-black tracking-tight text-[#0F4C81]">IDEMS</div>
                                    <div className="truncate text-[11px] uppercase tracking-[0.22em] text-slate-500">District Console</div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-center">
                                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                                    <AppLogoIcon className="h-full w-full object-cover" />
                                </span>
                            </div>
                        )}
                    </Link>

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
                    {renderItems(visibleMenu)}
                </div>

                {collapsed && (
                    <div className="mt-4 hidden justify-center lg:flex">
                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                            <AppLogoIcon className="h-full w-full object-cover" />
                        </span>
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
                        <div className="text-lg font-black tracking-tight text-[#0F4C81]">IDEMS</div>
                    </div>
                    <div className="flex items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition outline-none hover:border-slate-300">
                                    <AppLogoIcon className="h-full w-full object-cover" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1">
                                <DropdownMenuLabel className="px-2 py-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold text-slate-900 leading-none">
                                            {currentUser?.name ?? 'User'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {currentUser?.email ?? ''}
                                        </p>
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

                <main className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 md:p-8 pb-4 w-full max-w-full">
                    <div className="flex-grow">
                        {children}
                    </div>
                    <footer className="w-full border-t border-slate-100 mt-8 pt-4 pb-2 text-center text-xs text-slate-500">
                        Powered By <a href="https://nativetechnology.africa/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0F4C81] hover:underline">Native Technology</a> · v1.0.0
                    </footer>
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
            <Route element={<ProtectedRoute allowedPermissions={['manage_users']} />}>
                <Route path="/users" element={<PageShell><AdminDashboard /></PageShell>} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={['manage_roles']} />}>
                <Route path="/roles" element={<PageShell><AdminDashboard /></PageShell>} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={['manage_permissions']} />}>
                <Route path="/permissions" element={<PageShell><AdminDashboard /></PageShell>} />
            </Route>
            <Route element={<ProtectedRoute allowedPermissions={['view_audit_logs']} />}>
                <Route path="/audit/user-activities" element={<PageShell><AdminDashboard /></PageShell>} />
                <Route path="/audit-logs" element={<PageShell><AdminDashboard /></PageShell>} />
            </Route>

            {/* School / Region Setup */}
            <Route path="/schools" element={<PageShell><SchoolsPage /></PageShell>} />
            <Route path="/schools/:schoolId" element={<PageShell><SchoolDetailPage /></PageShell>} />
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
            <Route element={<ProtectedRoute allowedPermissions={['manage_settings']} />}>
                <Route path="/settings/general" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/sms" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/ai" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/report-templates" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/backup" element={<PageShell><SystemSettingsPage /></PageShell>} />
            </Route>

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
            <Route path="/reports" element={<PageShell><ReportsDashboardPage /></PageShell>} />
            <Route path="/reports/national" element={<PageShell><NationalReportPage /></PageShell>} />
            <Route path="/reports/national/details" element={<PageShell><NationalDetailReportPage /></PageShell>} />
            <Route path="/reports/regions" element={<PageShell><RegionsReportPage /></PageShell>} />
            <Route path="/reports/regions/:regionId" element={<PageShell><RegionReportPage /></PageShell>} />
            <Route path="/reports/regions/:regionId/details" element={<PageShell><RegionalDetailReportPage /></PageShell>} />
            <Route path="/reports/districts" element={<PageShell><DistrictsReportPage /></PageShell>} />
            <Route path="/reports/districts/:districtId" element={<PageShell><DistrictReportPage /></PageShell>} />
            <Route path="/reports/districts/:districtId/details" element={<PageShell><DistrictDetailReportPage /></PageShell>} />
            <Route path="/reports/schools" element={<PageShell><SchoolsReportPage /></PageShell>} />
            <Route path="/reports/schools/:schoolId" element={<PageShell><SchoolReportPage /></PageShell>} />
            <Route path="/reports/schools/:schoolId/details" element={<PageShell><SchoolDetailReportPage /></PageShell>} />
            <Route path="/reports/students" element={<PageShell><StudentsReportPage /></PageShell>} />
            <Route path="/reports/students/:studentId" element={<PageShell><StudentsReportPage /></PageShell>} />
            <Route path="/reports/ai-insights" element={<PageShell><InsightsReportPage /></PageShell>} />

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

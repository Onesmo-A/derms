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
import CandidatesPage from '@/pages/CandidatesPage';
import CandidateRegisterPage from '@/pages/CandidateRegisterPage';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppSelector } from '@/hooks/rtk';
import { useInitials } from '@/hooks/use-initials';
import { selectCurrentUser } from '@/features/auth/authSlice';
import {
    ADMIN_ROLES,
    DISTRICT_ROLES,
    getConsoleLabel,
    getConsoleProfile,
    LEARNER_ROLES,
    MenuItem,
    OPS_ROLES,
    REGIONAL_ROLES,
    ROLE_AM,
    ROLE_DAO,
    ROLE_DEO,
    ROLE_HOS,
    ROLE_PARENT,
    ROLE_REO,
    ROLE_STUDENT,
    ROLE_SUPER_ADMIN,
    ROLE_TEACHER,
    SCHOOL_ROLES,
    TEACHER_ROLES,
} from '@/lib/console-config';

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
            Powered By <a href="https://nativetechnology.africa/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0F4C81] hover:underline">Native Technology</a> Â· v1.0.0
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
            window.location.href = getConsoleProfile(data.user?.role).home;
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
                Powered By <a href="https://nativetechnology.africa/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0F4C81] hover:underline">Native Technology</a> Â· v1.0.0
            </footer>
        </div>
    );
};

const Shell = ({ children }: { children: React.ReactNode }) => {
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { pathname } = useLocation();
    const currentUser = useAppSelector(selectCurrentUser);
    const getInitials = useInitials();
    const consoleProfile = React.useMemo(() => getConsoleProfile(currentUser?.role), [currentUser?.role]);
    const visibleMenu = React.useMemo(
        () => filterMenuItems(consoleProfile.menu, currentUser),
        [consoleProfile.menu, currentUser],
    );
    const roleLabel = currentUser?.role ?? 'Guest';
    const consoleLabel = consoleProfile.label;
    const userInitials = getInitials(currentUser?.name ?? 'U');

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
                <div className={`mb-4 flex ${collapsed ? 'flex-col items-center justify-center gap-3' : 'items-center justify-between gap-3'} px-1`}>
                    <Link to="/dashboard" className={collapsed ? '' : 'min-w-0 flex-1'}>
                        {!collapsed ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
                                    <AppLogoIcon className="h-full w-full object-cover" />
                                </span>
                                <div className="min-w-0">
                                    <div className="truncate text-[15px] font-black tracking-tight text-[#0F4C81]">IDEMS</div>
                                    <div className="truncate text-[11px] uppercase tracking-[0.22em] text-slate-500">{consoleLabel}</div>
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

                <div className={`max-h-[calc(100dvh-190px)] space-y-2 overflow-y-auto pr-1 scrollbar-hover ${collapsed ? 'mt-4' : ''}`}>
                    {renderItems(visibleMenu)}
                </div>

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
            <div className="flex flex-1 flex-col min-w-0 min-h-0 bg-slate-50">
                {/* Clean Unified Top Header */}
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 md:px-8">
                    {/* Left: Mobile Toggle Menu Icon + Dynamic Breadcrumb Navigation */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="inline-flex lg:hidden h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
                            aria-label="Open sidebar"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 truncate">
                            <span className="text-[#0F4C81] hover:underline cursor-pointer" onClick={() => window.location.href='/dashboard'}>IDEMS</span>
                            {pathname !== '/dashboard' && (
                                <>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-slate-900 font-extrabold capitalize truncate">
                                        {pathname.split('/').filter(Boolean).map(x => {
                                            if (!isNaN(Number(x)) || x.length > 20) return 'details';
                                            return x.replace(/-/g, ' ');
                                        }).join(' / ')}
                                    </span>
                                </>
                            )}
                            {pathname === '/dashboard' && (
                                <>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-slate-900 font-extrabold">Dashboard</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: Small profile icon and dropdown */}
                    {currentUser && (
                        <div className="flex items-center gap-3">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition outline-none hover:border-slate-300 hover:shadow cursor-pointer"
                                        aria-label="Open profile menu"
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-[#0F4C81] text-xs font-black text-white">
                                                {userInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1 shadow-lg border border-slate-100 bg-white">
                                    <DropdownMenuLabel className="px-2 py-2">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-semibold leading-none text-slate-900">
                                                {currentUser.name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {currentUser.email}
                                            </p>
                                            <span className="mt-1 inline-flex w-fit items-center rounded-full bg-[#0F4C81]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#0F4C81]">
                                                {roleLabel}
                                            </span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                                        <NavLink to={consoleProfile.home} className="flex w-full items-center">
                                            <Settings2 className="mr-2 h-4 w-4" />
                                            <span>Go to Console</span>
                                        </NavLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="rounded-xl cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </header>

                <main className="flex flex-col flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6 pb-4 w-full max-w-full">
                    <div className="flex-grow">
                        {children}
                    </div>
                    <footer className="w-full border-t border-slate-200/80 mt-8 pt-4 pb-2 text-center text-xs text-slate-500">
                        Powered By <a href="https://nativetechnology.africa/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0F4C81] hover:underline">Native Technology</a> · v1.0.0
                    </footer>
                </main>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const currentUser = useAppSelector(selectCurrentUser);
    const profile = React.useMemo(() => getConsoleProfile(currentUser?.role), [currentUser?.role]);
    const getInitials = useInitials();
    const roleLabel = currentUser?.role ?? 'Guest';
    const userInitials = getInitials(currentUser?.name ?? 'U');

    return (
        <Shell>
            <div className="mx-auto max-w-7xl space-y-6">
                {currentUser && (
                    <div className="rounded-[28px] border border-[#0F4C81]/15 bg-gradient-to-r from-[#0F4C81]/5 to-slate-50 p-6 shadow-sm flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0F4C81]">
                                Welcome back
                            </p>
                            <h1 className="mt-1 truncate text-3xl font-black tracking-tight text-slate-900">
                                {currentUser.name}
                            </h1>
                            <p className="mt-1 truncate text-sm text-slate-500">
                                {currentUser.email} · <span className="font-semibold text-[#0F4C81]">{roleLabel}</span>
                            </p>
                        </div>
                        <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-full bg-[#0F4C81]/10 text-xl font-black text-[#0F4C81] shadow-inner">
                            {userInitials}
                        </div>
                    </div>
                )}

                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{profile.label}</p>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0F4C81]">{profile.dashboard.title}</h1>
                    <p className="mt-1 text-sm text-slate-500">{profile.dashboard.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {profile.dashboard.cards.map((stat) => (
                        <div key={stat.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-black text-slate-900">{stat.value}</p>
                                </div>
                                <div className="rounded-xl bg-[#0F4C81]/10 p-3 flex-shrink-0">
                                    <stat.icon className="h-6 w-6 text-[#0F4C81]" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Shell>
    );
};

const PageShell = ({ children }: { children: React.ReactNode }) => <Shell>{children}</Shell>;

const UnauthorizedPage = () => <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900"><h2>Unauthorized Access</h2></div>;
const NotFoundPage = () => <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900"><h2>404 - Page Not Found</h2></div>;

const MANAGE_USERS_ROLES = ADMIN_ROLES;
const REGIONAL_DATA_ROLES = REGIONAL_ROLES;
const DISTRICT_DATA_ROLES = DISTRICT_ROLES;
const SCHOOL_DATA_ROLES = SCHOOL_ROLES;
const OPERATIONAL_ROLES = [...ADMIN_ROLES, ...REGIONAL_ROLES, ...DISTRICT_ROLES, ...OPS_ROLES];
const LEARNER_DATA_ROLES = [ROLE_STUDENT, ROLE_PARENT];
const ALL_PORTAL_ROLES = [...ADMIN_ROLES, ...REGIONAL_ROLES, ...DISTRICT_ROLES, ...SCHOOL_ROLES, ROLE_TEACHER, ROLE_STUDENT, ROLE_PARENT];

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route element={<ProtectedRoute allowedRoles={MANAGE_USERS_ROLES} />}>
                <Route path="/users" element={<PageShell><AdminDashboard /></PageShell>} />
                <Route path="/roles" element={<PageShell><AdminDashboard /></PageShell>} />
                <Route path="/permissions" element={<PageShell><AdminDashboard /></PageShell>} />
                <Route path="/audit/user-activities" element={<PageShell><AdminDashboard /></PageShell>} />
                <Route path="/audit-logs" element={<PageShell><AdminDashboard /></PageShell>} />
                <Route path="/security" element={<PageShell><AdminDashboard /></PageShell>} />
                <Route path="/settings/general" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/sms" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/ai" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/report-templates" element={<PageShell><SystemSettingsPage /></PageShell>} />
                <Route path="/settings/backup" element={<PageShell><SystemSettingsPage /></PageShell>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={REGIONAL_DATA_ROLES} />}>
                <Route path="/regions" element={<PageShell><RegionsPage /></PageShell>} />
                <Route path="/reports/regions" element={<PageShell><RegionsReportPage /></PageShell>} />
                <Route path="/reports/regions/:regionId" element={<PageShell><RegionReportPage /></PageShell>} />
                <Route path="/reports/regions/:regionId/details" element={<PageShell><RegionalDetailReportPage /></PageShell>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={DISTRICT_DATA_ROLES} />}>
                <Route path="/districts" element={<PageShell><DistrictsPage /></PageShell>} />
                <Route path="/reports/districts" element={<PageShell><DistrictsReportPage /></PageShell>} />
                <Route path="/reports/districts/:districtId" element={<PageShell><DistrictReportPage /></PageShell>} />
                <Route path="/reports/districts/:districtId/details" element={<PageShell><DistrictDetailReportPage /></PageShell>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={SCHOOL_DATA_ROLES} />}>
                <Route path="/schools/register" element={<PageShell><SchoolsPage /></PageShell>} />
                <Route path="/schools" element={<PageShell><SchoolsPage /></PageShell>} />
                <Route path="/schools/:schoolId" element={<PageShell><SchoolDetailPage /></PageShell>} />
                <Route path="/school-categories" element={<PageShell><SchoolsPage /></PageShell>} />
                <Route path="/school-statistics" element={<PageShell><SchoolsPage /></PageShell>} />
                <Route path="/school-performance-history" element={<PageShell><SchoolsPage /></PageShell>} />
                <Route path="/academic-years" element={<PageShell><AcademicSetupPage /></PageShell>} />
                <Route path="/class-levels" element={<PageShell><AcademicSetupPage /></PageShell>} />
                <Route path="/subjects" element={<PageShell><AcademicSetupPage /></PageShell>} />
                <Route path="/subject-groups" element={<PageShell><AcademicSetupPage /></PageShell>} />
                <Route path="/grading-systems" element={<PageShell><AcademicSetupPage /></PageShell>} />
                <Route path="/division-rules" element={<PageShell><AcademicSetupPage /></PageShell>} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={TEACHER_ROLES} />}>
                <Route path="/students" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/students/register" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/students/import" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/students/subjects" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/students/promotions" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/students/transfers" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/students/duplicates" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/students/performance-history" element={<PageShell><StudentsPage /></PageShell>} />
                <Route path="/candidates" element={<PageShell><CandidatesPage /></PageShell>} />
                <Route path="/candidates/registered" element={<Navigate to="/candidates" replace />} />
                <Route path="/candidates/register" element={<Navigate to="/candidates" replace />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={OPERATIONAL_ROLES} />}>
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
                <Route path="/results/process" element={<PageShell><ResultsPage /></PageShell>} />
                <Route path="/results/reprocess" element={<PageShell><ResultsPage /></PageShell>} />
                <Route path="/results/processing-history" element={<PageShell><ResultsPage /></PageShell>} />
                <Route path="/results/publish" element={<PageShell><ResultsPage /></PageShell>} />
                <Route path="/results/unpublish" element={<PageShell><ResultsPage /></PageShell>} />
                <Route path="/results/publication-history" element={<PageShell><ResultsPage /></PageShell>} />
                <Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES, ...REGIONAL_ROLES, ...DISTRICT_ROLES, ...SCHOOL_ROLES, ROLE_TEACHER]} />}>
                    <Route path="/reports" element={<PageShell><ReportsDashboardPage /></PageShell>} />
                    <Route path="/reports/schools" element={<PageShell><SchoolsReportPage /></PageShell>} />
                    <Route path="/reports/schools/:schoolId" element={<PageShell><SchoolReportPage /></PageShell>} />
                    <Route path="/reports/schools/:schoolId/details" element={<PageShell><SchoolDetailReportPage /></PageShell>} />
                    <Route path="/reports/students" element={<PageShell><StudentsReportPage /></PageShell>} />
                    <Route path="/reports/students/:studentId" element={<PageShell><StudentsReportPage /></PageShell>} />
                    <Route path="/reports/ai-insights" element={<PageShell><InsightsReportPage /></PageShell>} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES, ...REGIONAL_ROLES]} />}>
                    <Route path="/reports/national" element={<PageShell><NationalReportPage /></PageShell>} />
                    <Route path="/reports/national/details" element={<PageShell><NationalDetailReportPage /></PageShell>} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES, ...REGIONAL_ROLES, ...DISTRICT_ROLES]} />}>
                    <Route path="/reports/regions" element={<PageShell><RegionsReportPage /></PageShell>} />
                    <Route path="/reports/regions/:regionId" element={<PageShell><RegionReportPage /></PageShell>} />
                    <Route path="/reports/regions/:regionId/details" element={<PageShell><RegionalDetailReportPage /></PageShell>} />
                    <Route path="/reports/districts" element={<PageShell><DistrictsReportPage /></PageShell>} />
                    <Route path="/reports/districts/:districtId" element={<PageShell><DistrictReportPage /></PageShell>} />
                    <Route path="/reports/districts/:districtId/details" element={<PageShell><DistrictDetailReportPage /></PageShell>} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES, ...REGIONAL_ROLES, ...DISTRICT_ROLES, ...SCHOOL_ROLES, ROLE_TEACHER]} />}>
                    <Route path="/analytics/schools" element={<PageShell><ReportsPage /></PageShell>} />
                    <Route path="/analytics/subjects" element={<PageShell><ReportsPage /></PageShell>} />
                    <Route path="/analytics/students" element={<PageShell><ReportsPage /></PageShell>} />
                    <Route path="/analytics/gender" element={<PageShell><ReportsPage /></PageShell>} />
                    <Route path="/analytics/performance-trends" element={<PageShell><ReportsPage /></PageShell>} />
                    <Route path="/analytics/rankings" element={<PageShell><ReportsPage /></PageShell>} />
                    <Route path="/analytics/comparative" element={<PageShell><ReportsPage /></PageShell>} />
                    <Route path="/analytics/predictions" element={<PageShell><ReportsPage /></PageShell>} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES, ...REGIONAL_ROLES, ...DISTRICT_ROLES, ...SCHOOL_ROLES]} />}>
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
                </Route>
                <Route element={<ProtectedRoute allowedRoles={[...ADMIN_ROLES, ...REGIONAL_ROLES, ...DISTRICT_ROLES, ...SCHOOL_ROLES]} />}>
                    <Route path="/notifications/sms" element={<PageShell><NotificationsPage /></PageShell>} />
                    <Route path="/notifications/email" element={<PageShell><NotificationsPage /></PageShell>} />
                    <Route path="/notifications/templates" element={<PageShell><NotificationsPage /></PageShell>} />
                    <Route path="/notifications/delivery-logs" element={<PageShell><NotificationsPage /></PageShell>} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ALL_PORTAL_ROLES} />}>
                <Route path="/help/user-guide" element={<PageShell><HelpPage /></PageShell>} />
                <Route path="/help/documentation" element={<PageShell><HelpPage /></PageShell>} />
                <Route path="/help/faqs" element={<PageShell><HelpPage /></PageShell>} />
                <Route path="/help/support" element={<PageShell><HelpPage /></PageShell>} />
                <Route path="/help/about" element={<PageShell><HelpPage /></PageShell>} />
            </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
);


export default AppRoutes;



import React from 'react';
import {
    Activity,
    BadgeCheck,
    BarChart3,
    BellRing,
    BrainCircuit,
    Building2,
    CalendarDays,
    ChartColumn,
    ClipboardList,
    DatabaseZap,
    FileBarChart2,
    FileDown,
    FileSpreadsheet,
    FolderGit2,
    GraduationCap,
    House,
    Layers3,
    LayoutDashboard,
    MessagesSquare,
    Radar,
    Plus,
    School,
    Settings2,
    ShieldCheck,
    ShieldAlert,
    Stars,
    Table2,
    Users2,
    UserCog,
    BookOpen,
    ChevronRight,
    VenetianMask,
} from 'lucide-react';

export const ROLE_SUPER_ADMIN = 'Super Administrator';
export const ROLE_REO = 'Regional Education Officer (REO)';
export const ROLE_DEO = 'District Education Officer (DEO)';
export const ROLE_DAO = 'District Academic Officer';
export const ROLE_HOS = 'Head of School';
export const ROLE_AM = 'Academic Master/Mistress';
export const ROLE_TEACHER = 'Subject Teacher';
export const ROLE_STUDENT = 'Student';
export const ROLE_PARENT = 'Parent';

export const ADMIN_ROLES = [ROLE_SUPER_ADMIN];
export const REGIONAL_ROLES = [ROLE_SUPER_ADMIN, ROLE_REO];
export const DISTRICT_ROLES = [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO];
export const SCHOOL_ROLES = [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO, ROLE_HOS, ROLE_AM];
export const TEACHER_ROLES = [...SCHOOL_ROLES, ROLE_TEACHER];
export const LEARNER_ROLES = [ROLE_STUDENT, ROLE_PARENT];
export const OPS_ROLES = [...SCHOOL_ROLES, ROLE_TEACHER];

export type MenuItem = {
    title: string;
    href?: string;
    icon?: React.ComponentType<{ className?: string }>;
    children?: MenuItem[];
    roles?: string[];
    permissions?: string[];
};

export type DashboardCard = {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
};

export type ConsoleProfile = {
    label: string;
    subtitle: string;
    home: string;
    menu: MenuItem[];
    dashboard: {
        title: string;
        subtitle: string;
        cards: DashboardCard[];
    };
};

const reportsMenu = (titles: Array<{ title: string; href: string; icon: React.ComponentType<{ className?: string }> }>): MenuItem => ({
    title: 'Reports & Analytics',
    icon: FileBarChart2,
    children: [
        {
            title: 'Reports',
            icon: FileBarChart2,
            children: titles.map((item) => ({
                ...item,
            })),
        },
    ],
});

const analyticsChildren = [
    { title: 'School Analysis', href: '/analytics/schools', icon: School },
    { title: 'Subject Analysis', href: '/analytics/subjects', icon: BookOpen },
    { title: 'Student Analysis', href: '/analytics/students', icon: Users2 },
    { title: 'Gender Analysis', href: '/analytics/gender', icon: Users2 },
    { title: 'Performance Trends', href: '/analytics/performance-trends', icon: ChartColumn },
    { title: 'Rankings Analysis', href: '/analytics/rankings', icon: Radar },
    { title: 'Comparative Analysis', href: '/analytics/comparative', icon: BarChart3 },
    { title: 'Trend Predictions', href: '/analytics/predictions', icon: Stars },
];

const studentsManagementMenu: MenuItem = {
    title: 'Students Management',
    icon: Users2,
    roles: TEACHER_ROLES,
    children: [
        { title: 'All Students', href: '/students', icon: Users2, roles: TEACHER_ROLES },
        { title: 'Register Student', href: '/students/register', icon: UserCog, roles: TEACHER_ROLES },
        { title: 'Bulk Import', href: '/students/import', icon: FileSpreadsheet, roles: TEACHER_ROLES },
        { title: 'Subject Registration', href: '/students/subjects', icon: BookOpen, roles: TEACHER_ROLES },
        { title: 'Registered Candidates', href: '/candidates', icon: Users2, roles: TEACHER_ROLES },
        { title: 'Candidate Registration', href: '/candidates', icon: BadgeCheck, roles: TEACHER_ROLES },
        { title: 'Promotions', href: '/students/promotions', icon: ChevronRight, roles: TEACHER_ROLES },
        { title: 'Transfers', href: '/students/transfers', icon: ChevronRight, roles: TEACHER_ROLES },
        { title: 'Duplicate Detection', href: '/students/duplicates', icon: Radar, roles: TEACHER_ROLES },
        { title: 'Performance History', href: '/students/performance-history', icon: ChartColumn, roles: TEACHER_ROLES },
    ],
};

const adminReports = reportsMenu([
    { title: 'Dashboard', href: '/reports', icon: FileBarChart2 },
    { title: 'National', href: '/reports/national', icon: ShieldCheck },
    { title: 'Regions', href: '/reports/regions', icon: House },
    { title: 'Districts', href: '/reports/districts', icon: Building2 },
    { title: 'Schools', href: '/reports/schools', icon: School },
    { title: 'Students', href: '/reports/students', icon: Users2 },
    { title: 'AI Insights', href: '/reports/ai-insights', icon: Stars },
]);

const regionalReports = reportsMenu([
    { title: 'Dashboard', href: '/reports', icon: FileBarChart2 },
    { title: 'Regional Summary', href: '/reports/regions', icon: House },
    { title: 'District Summaries', href: '/reports/districts', icon: Building2 },
    { title: 'School Summaries', href: '/reports/schools', icon: School },
    { title: 'Student Summaries', href: '/reports/students', icon: Users2 },
]);

const districtReports = reportsMenu([
    { title: 'Dashboard', href: '/reports', icon: FileBarChart2 },
    { title: 'District Summary', href: '/reports/districts', icon: Building2 },
    { title: 'School Summaries', href: '/reports/schools', icon: School },
    { title: 'Student Summaries', href: '/reports/students', icon: Users2 },
]);

const schoolReports = reportsMenu([
    { title: 'Dashboard', href: '/reports', icon: FileBarChart2 },
    { title: 'School Summary', href: '/reports/schools', icon: School },
    { title: 'Student Reports', href: '/reports/students', icon: Users2 },
]);

const teacherReports = reportsMenu([
    { title: 'Dashboard', href: '/reports', icon: FileBarChart2 },
    { title: 'Subject Reports', href: '/reports/schools', icon: BookOpen },
    { title: 'Student Reports', href: '/reports/students', icon: Users2 },
    { title: 'Insights', href: '/reports/ai-insights', icon: Stars },
]);

const learnerReports = reportsMenu([
    { title: 'My Results', href: '/reports/students', icon: FileBarChart2 },
    { title: 'Downloads', href: '/reports/schools', icon: FileSpreadsheet },
]);

const academicSetupMenu: MenuItem = {
    title: 'Academic Setup',
    icon: GraduationCap,
    children: [
        { title: 'Academic Years', href: '/academic-years', icon: GraduationCap, roles: SCHOOL_ROLES },
        { title: 'Class Levels', href: '/class-levels', icon: Layers3, roles: SCHOOL_ROLES },
        { title: 'Subjects', href: '/subjects', icon: BookOpen, roles: SCHOOL_ROLES },
        { title: 'Grading Systems', href: '/grading-systems', icon: ShieldCheck, roles: SCHOOL_ROLES },
        { title: 'Division Rules', href: '/division-rules', icon: ShieldCheck, roles: SCHOOL_ROLES },
    ],
};

const examinationOperationsMenu: MenuItem = {
    title: 'Examination Operations',
    icon: ClipboardList,
    children: [
        { title: 'All Examinations', href: '/examinations', icon: ClipboardList, roles: OPS_ROLES },
        { title: 'Examination Calendar', href: '/examinations/calendar', icon: CalendarDays, roles: OPS_ROLES },
        { title: 'Create Examination', href: '/examinations/create', icon: BadgeCheck, roles: OPS_ROLES },
        { title: 'Examination Timetable', href: '/examinations/timetable', icon: FileSpreadsheet, roles: OPS_ROLES },
        { title: 'Assign & Weight Subjects', href: '/examinations/subjects/assign', icon: BookOpen, roles: OPS_ROLES },
        { title: 'Centers List', href: '/examination-centers', icon: Building2, roles: OPS_ROLES },
    ],
};

const marksManagementMenu: MenuItem = {
    title: 'Marks Management',
    icon: Table2,
    children: [
        { title: 'Spreadsheet Entry', href: '/marks', icon: FileSpreadsheet, roles: OPS_ROLES },
        { title: 'Manual Marks Entry', href: '/marks/manual-entry', icon: ClipboardList, roles: OPS_ROLES },
        { title: 'Import Marks', href: '/marks/import', icon: FileDown, roles: OPS_ROLES },
        { title: 'Bulk Update Marks', href: '/marks/bulk-update', icon: DatabaseZap, roles: OPS_ROLES },
        { title: 'Marks Verification', href: '/marks/verification', icon: ShieldCheck, roles: OPS_ROLES },
        { title: 'Practical Entry', href: '/marks/practical-entry', icon: ClipboardList, roles: OPS_ROLES },
    ],
};

const administrationConsoleMenu: MenuItem = {
    title: 'Administration Console',
    icon: ShieldCheck,
    children: [
        { title: 'Users', href: '/users', icon: UserCog, roles: ADMIN_ROLES },
        { title: 'Roles', href: '/roles', icon: ShieldCheck, roles: ADMIN_ROLES },
        { title: 'Permissions', href: '/permissions', icon: DatabaseZap, roles: ADMIN_ROLES },
        { title: 'Activity Logs', href: '/audit-logs', icon: Activity, roles: ADMIN_ROLES },
        { title: 'Security', href: '/security', icon: ShieldAlert, roles: ADMIN_ROLES },
    ],
};

const schoolManagementMenu: MenuItem = {
    title: 'Schools Management',
    icon: School,
    children: [
        { title: 'Register School', href: '/schools/register', icon: Plus, roles: SCHOOL_ROLES },
        { title: 'Schools List', href: '/schools', icon: School, roles: SCHOOL_ROLES },
        { title: 'School Categories', href: '/school-categories', icon: ChevronRight, roles: SCHOOL_ROLES },
        { title: 'Statistics', href: '/school-statistics', icon: BarChart3, roles: SCHOOL_ROLES },
        { title: 'Performance History', href: '/school-performance-history', icon: ChartColumn, roles: SCHOOL_ROLES },
    ],
};

const menuByRole: Record<string, MenuItem[]> = {
    [ROLE_SUPER_ADMIN]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { ...administrationConsoleMenu, roles: ADMIN_ROLES },
        { ...academicSetupMenu, roles: ADMIN_ROLES },
        { title: 'Regions', href: '/regions', icon: House, roles: REGIONAL_ROLES },
        { title: 'Districts', href: '/districts', icon: Layers3, roles: DISTRICT_ROLES },
        { ...schoolManagementMenu, roles: SCHOOL_ROLES },
        studentsManagementMenu,
        { ...examinationOperationsMenu, roles: OPS_ROLES },
        { ...marksManagementMenu, roles: OPS_ROLES },
        { title: 'Results Management', href: '/results/process', icon: FileBarChart2, roles: OPS_ROLES },
        {
            ...adminReports,
            roles: [...OPS_ROLES, ROLE_STUDENT, ROLE_PARENT],
            children: [...(adminReports.children ?? []), { title: 'Analytics', icon: BarChart3, children: analyticsChildren }],
        },
        { title: 'AI Intelligence', href: '/ai', icon: BrainCircuit, roles: OPS_ROLES },
        { title: 'Notifications', href: '/notifications/sms', icon: BellRing, roles: ADMIN_ROLES },
        { title: 'System Settings', href: '/settings/general', icon: Settings2, roles: ADMIN_ROLES },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_REO]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { ...administrationConsoleMenu, roles: ADMIN_ROLES },
        { ...academicSetupMenu, roles: REGIONAL_ROLES },
        { title: 'Districts', href: '/districts', icon: Layers3, roles: REGIONAL_ROLES },
        { ...schoolManagementMenu, roles: SCHOOL_ROLES },
        studentsManagementMenu,
        { ...examinationOperationsMenu, roles: REGIONAL_ROLES },
        { ...marksManagementMenu, roles: REGIONAL_ROLES },
        { title: 'Results', href: '/results/process', icon: FileBarChart2, roles: REGIONAL_ROLES },
        {
            ...regionalReports,
            roles: REGIONAL_ROLES,
            children: [...(regionalReports.children ?? []), { title: 'Analytics', icon: BarChart3, children: analyticsChildren }],
        },
        { title: 'Notifications', href: '/notifications/sms', icon: BellRing, roles: REGIONAL_ROLES },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_DEO]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { ...administrationConsoleMenu, roles: ADMIN_ROLES },
        { ...academicSetupMenu, roles: DISTRICT_ROLES },
        { ...schoolManagementMenu, roles: SCHOOL_ROLES },
        studentsManagementMenu,
        { ...examinationOperationsMenu, roles: DISTRICT_ROLES },
        { ...marksManagementMenu, roles: DISTRICT_ROLES },
        { title: 'Results', href: '/results/process', icon: FileBarChart2, roles: DISTRICT_ROLES },
        {
            ...districtReports,
            roles: DISTRICT_ROLES,
            children: [...(districtReports.children ?? []), { title: 'Analytics', icon: BarChart3, children: analyticsChildren }],
        },
        { title: 'Notifications', href: '/notifications/sms', icon: BellRing, roles: DISTRICT_ROLES },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_DAO]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { ...administrationConsoleMenu, roles: ADMIN_ROLES },
        { ...academicSetupMenu, roles: DISTRICT_ROLES },
        { ...schoolManagementMenu, roles: SCHOOL_ROLES },
        studentsManagementMenu,
        { ...examinationOperationsMenu, roles: DISTRICT_ROLES },
        { ...marksManagementMenu, roles: DISTRICT_ROLES },
        { title: 'Results', href: '/results/process', icon: FileBarChart2, roles: DISTRICT_ROLES },
        {
            ...districtReports,
            roles: DISTRICT_ROLES,
            children: [...(districtReports.children ?? []), { title: 'Analytics', icon: BarChart3, children: analyticsChildren }],
        },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_HOS]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { ...administrationConsoleMenu, roles: ADMIN_ROLES },
        { ...schoolManagementMenu, roles: SCHOOL_ROLES },
        { ...academicSetupMenu, roles: SCHOOL_ROLES },
        studentsManagementMenu,
        { ...examinationOperationsMenu, roles: SCHOOL_ROLES },
        { ...marksManagementMenu, roles: SCHOOL_ROLES },
        { title: 'Results', href: '/results/process', icon: FileBarChart2, roles: SCHOOL_ROLES },
        {
            ...schoolReports,
            roles: SCHOOL_ROLES,
            children: [...(schoolReports.children ?? []), { title: 'Analytics', icon: BarChart3, children: analyticsChildren }],
        },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_AM]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { ...administrationConsoleMenu, roles: ADMIN_ROLES },
        { ...schoolManagementMenu, roles: SCHOOL_ROLES },
        { ...academicSetupMenu, roles: SCHOOL_ROLES },
        studentsManagementMenu,
        { ...examinationOperationsMenu, roles: SCHOOL_ROLES },
        { ...marksManagementMenu, roles: SCHOOL_ROLES },
        { title: 'Results', href: '/results/process', icon: FileBarChart2, roles: SCHOOL_ROLES },
        {
            ...schoolReports,
            roles: SCHOOL_ROLES,
            children: [...(schoolReports.children ?? []), { title: 'Analytics', icon: BarChart3, children: analyticsChildren }],
        },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_TEACHER]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { ...schoolManagementMenu, roles: TEACHER_ROLES },
        { ...academicSetupMenu, roles: TEACHER_ROLES },
        studentsManagementMenu,
        { ...examinationOperationsMenu, roles: TEACHER_ROLES },
        { ...marksManagementMenu, roles: TEACHER_ROLES },
        { title: 'Results', href: '/results/process', icon: FileBarChart2, roles: TEACHER_ROLES },
        {
            ...teacherReports,
            roles: TEACHER_ROLES,
            children: [...(teacherReports.children ?? []), { title: 'Analytics', icon: BarChart3, children: analyticsChildren.slice(0, 5) }],
        },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_STUDENT]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { title: 'My Results', href: '/reports/students', icon: FileBarChart2, roles: LEARNER_ROLES },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
    [ROLE_PARENT]: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { title: 'Child Results', href: '/reports/students', icon: FileBarChart2, roles: LEARNER_ROLES },
        { title: 'Support & Help', href: '/help/user-guide', icon: BookOpen },
    ],
};

const dashboardByRole: Record<string, ConsoleProfile['dashboard']> = {
    [ROLE_SUPER_ADMIN]: {
        title: 'National Admin Console',
        subtitle: 'Manage the full platform, security posture, and national-level visibility.',
        cards: [
            { label: 'Regions', value: '3', icon: House, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Districts', value: '5', icon: Layers3, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Schools', value: '35', icon: School, color: 'from-blue-500 to-blue-600' },
            { label: 'Users', value: '9', icon: Users2, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_REO]: {
        title: 'Regional Console',
        subtitle: 'Monitor district and school performance within the assigned region.',
        cards: [
            { label: 'Districts', value: '3', icon: Layers3, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Schools', value: '29', icon: School, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Candidates', value: '236', icon: Users2, color: 'from-blue-500 to-blue-600' },
            { label: 'Region GPA', value: '3.26', icon: ChartColumn, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_DEO]: {
        title: 'District Console',
        subtitle: 'Track schools, results, and operational progress for the district.',
        cards: [
            { label: 'Schools', value: '21', icon: School, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Students', value: '8,420', icon: Users2, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Active Exams', value: '3', icon: FileSpreadsheet, color: 'from-blue-500 to-blue-600' },
            { label: 'District GPA', value: '3.18', icon: ChartColumn, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_DAO]: {
        title: 'District Academic Console',
        subtitle: 'Support moderation, examination setup, and academic workflow execution.',
        cards: [
            { label: 'Schools', value: '21', icon: School, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Subjects', value: '18', icon: BookOpen, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Marks Pending', value: '35', icon: Table2, color: 'from-blue-500 to-blue-600' },
            { label: 'Moderations', value: '12', icon: Activity, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_HOS]: {
        title: 'School Console',
        subtitle: 'Run your school operations, candidates, and performance checks from one place.',
        cards: [
            { label: 'Students', value: '486', icon: Users2, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Teachers', value: '18', icon: UserCog, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Subjects', value: '9', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
            { label: 'Current Exam', value: 'Mock 2026', icon: FileSpreadsheet, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_AM]: {
        title: 'Academic Console',
        subtitle: 'Coordinate marks, subjects, and student progress within the school.',
        cards: [
            { label: 'Students', value: '486', icon: Users2, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Assigned Subjects', value: '5', icon: BookOpen, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Marks Pending', value: '35', icon: Table2, color: 'from-blue-500 to-blue-600' },
            { label: 'Submitted', value: '111', icon: FileSpreadsheet, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_TEACHER]: {
        title: 'Teacher Console',
        subtitle: 'Focus on your assigned learners, subjects, and mark entry workflow.',
        cards: [
            { label: 'Assigned Students', value: '146', icon: Users2, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Assigned Subjects', value: '2', icon: BookOpen, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Marks Pending', value: '35', icon: Table2, color: 'from-blue-500 to-blue-600' },
            { label: 'Marks Submitted', value: '111', icon: FileSpreadsheet, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_STUDENT]: {
        title: 'Student Portal',
        subtitle: 'View your own performance, results, and downloads.',
        cards: [
            { label: 'Current Exam', value: 'Mock 2026', icon: FileSpreadsheet, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'Average', value: '47.06', icon: ChartColumn, color: 'from-emerald-500 to-emerald-600' },
            { label: 'GPA', value: '3.26', icon: Stars, color: 'from-blue-500 to-blue-600' },
            { label: 'Division', value: 'II', icon: ShieldCheck, color: 'from-amber-500 to-amber-600' },
        ],
    },
    [ROLE_PARENT]: {
        title: 'Parent Portal',
        subtitle: 'Follow your child’s results and notifications without exposing school operations.',
        cards: [
            { label: 'Child Results', value: 'Ready', icon: FileBarChart2, color: 'from-[#0F4C81] to-[#1a6ab1]' },
            { label: 'SMS Alerts', value: '7', icon: BellRing, color: 'from-emerald-500 to-emerald-600' },
            { label: 'Current Exam', value: 'Mock 2026', icon: FileSpreadsheet, color: 'from-blue-500 to-blue-600' },
            { label: 'Support', value: 'Open', icon: MessagesSquare, color: 'from-amber-500 to-amber-600' },
        ],
    },
};

export const getConsoleLabel = (role?: string): string => {
    return {
        [ROLE_SUPER_ADMIN]: 'National Admin Console',
        [ROLE_REO]: 'Regional Console',
        [ROLE_DEO]: 'District Console',
        [ROLE_DAO]: 'District Academic Console',
        [ROLE_HOS]: 'School Console',
        [ROLE_AM]: 'Academic Console',
        [ROLE_TEACHER]: 'Teacher Console',
        [ROLE_STUDENT]: 'Student Portal',
        [ROLE_PARENT]: 'Parent Portal',
    }[role ?? ''] ?? 'Console';
};

export const getConsoleProfile = (role?: string): ConsoleProfile => {
    const fallbackRole = role && dashboardByRole[role] ? role : ROLE_TEACHER;

    return {
        label: getConsoleLabel(role),
        subtitle: dashboardByRole[fallbackRole].subtitle,
        home: '/dashboard',
        menu: menuByRole[role ?? ''] ?? menuByRole[ROLE_TEACHER],
        dashboard: dashboardByRole[fallbackRole],
    };
};

export const canManageExaminationSetup = (role?: string): boolean =>
    [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO].includes(role ?? '');

export const canManageResultsOperations = (role?: string): boolean =>
    [ROLE_SUPER_ADMIN, ROLE_REO, ROLE_DEO, ROLE_DAO].includes(role ?? '');

export const canManageCalendar = (role?: string): boolean =>
    [ROLE_SUPER_ADMIN].includes(role ?? '');

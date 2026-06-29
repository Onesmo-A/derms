import { Link } from '@inertiajs/react';
import {
    Activity,
    BadgeCheck,
    BarChart3,
    BellRing,
    BrainCircuit,
    Building2,
    CalendarDays,
    ChartColumn,
    ChevronRight,
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
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutDashboard,
    },
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
            { title: 'School Categories', href: '/school-categories', icon: ChevronRight },
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
            { title: 'Student Promotions', href: '/students/promotions', icon: ChevronRight },
            { title: 'Student Transfers', href: '/students/transfers', icon: ChevronRight },
            { title: 'Duplicate Detection', href: '/students/duplicates', icon: Radar },
            { title: 'Student Performance History', href: '/students/performance-history', icon: ChartColumn },
        ],
    },
    {
        title: 'Examinations Management',
        icon: ClipboardList,
        children: [
            { title: 'Examination Types', href: '/examination-types', icon: FolderGit2 },
            {
                title: 'Examinations',
                icon: ClipboardList,
                children: [
                    { title: 'All Examinations', href: '/examinations', icon: ClipboardList },
                    { title: 'Create Examination', href: '/examinations/create', icon: BadgeCheck },
                    { title: 'Examination Calendar', href: '/examinations/calendar', icon: CalendarDays },
                    { title: 'Examination Timetable', href: '/examinations/timetable', icon: FileSpreadsheet },
                ],
            },
            {
                title: 'Examination Subjects',
                icon: BookOpen,
                children: [
                    { title: 'Assign Subjects', href: '/examinations/subjects/assign', icon: BookOpen },
                    { title: 'Subject Configuration', href: '/examinations/subjects/configuration', icon: Settings2 },
                    { title: 'Subject Papers Setup', href: '/examinations/subjects/papers', icon: Layers3 },
                ],
            },
            {
                title: 'Candidate Registration',
                icon: BadgeCheck,
                children: [
                    { title: 'Register Candidates', href: '/candidates/register', icon: BadgeCheck },
                    { title: 'Registered Candidates', href: '/candidates/registered', icon: Users2 },
                    { title: 'Import Candidates', href: '/candidates/import', icon: FileSpreadsheet },
                    { title: 'Candidate Verification', href: '/candidates/verification', icon: ShieldCheck },
                ],
            },
            {
                title: 'Examination Centers',
                icon: Building2,
                children: [
                    { title: 'Centers List', href: '/examination-centers', icon: Building2 },
                    { title: 'Center Statistics', href: '/examination-centers/statistics', icon: BarChart3 },
                ],
            },
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
            {
                title: 'Practical Marks',
                icon: FolderCheck,
                children: [
                    { title: 'Practical Entry', href: '/marks/practical-entry', icon: ClipboardList },
                    { title: 'Practical Approval', href: '/marks/practical-approval', icon: BadgeCheck },
                    { title: 'Practical Summary', href: '/marks/practical-summary', icon: BarChart3 },
                ],
            },
            {
                title: 'Marks Moderation',
                icon: BadgeCheck,
                children: [
                    { title: 'Review Marks', href: '/marks/review', icon: ShieldCheck },
                    { title: 'Adjust Marks', href: '/marks/adjust', icon: DatabaseZap },
                    { title: 'Moderation Logs', href: '/marks/moderation-logs', icon: Activity },
                ],
            },
        ],
    },
    {
        title: 'Results Management',
        icon: FileBarChart2,
        children: [
            {
                title: 'Results Processing',
                icon: DatabaseZap,
                children: [
                    { title: 'Process Results', href: '/results/process', icon: DatabaseZap },
                    { title: 'Reprocess Results', href: '/results/reprocess', icon: DatabaseZap },
                    { title: 'Processing History', href: '/results/processing-history', icon: Activity },
                    { title: 'Processing Logs', href: '/results/processing-logs', icon: ShieldCheck },
                ],
            },
            {
                title: 'Results Publication',
                icon: Stars,
                children: [
                    { title: 'Publish Results', href: '/results/publish', icon: Stars },
                    { title: 'Unpublish Results', href: '/results/unpublish', icon: VenetianMask },
                    { title: 'Publication History', href: '/results/publication-history', icon: Activity },
                    { title: 'SMS Result Notifications', href: '/notifications/sms', icon: MessagesSquare },
                ],
            },
            {
                title: 'Results Correction',
                icon: Radar,
                children: [
                    { title: 'Request Corrections', href: '/results/corrections/request', icon: ShieldCheck },
                    { title: 'Approve Corrections', href: '/results/corrections/approve', icon: BadgeCheck },
                    { title: 'Correction Logs', href: '/results/corrections/logs', icon: Activity },
                ],
            },
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
            {
                title: 'AI Assistant',
                icon: BrainCircuit,
                children: [
                    { title: 'Ask AI', href: '/ai/ask', icon: BrainCircuit },
                    { title: 'AI Chat History', href: '/ai/history', icon: MessagesSquare },
                    { title: 'Saved Analyses', href: '/ai/saved-analyses', icon: FileBarChart2 },
                ],
            },
            {
                title: 'AI Analysis',
                icon: Radar,
                children: [
                    { title: 'Performance Analysis', href: '/ai/performance-analysis', icon: BarChart3 },
                    { title: 'Risk Detection', href: '/ai/risk-detection', icon: ShieldCheck },
                    { title: 'Recommendations', href: '/ai/recommendations', icon: ClipboardList },
                    { title: 'Executive Summaries', href: '/ai/executive-summaries', icon: FileBarChart2 },
                    { title: 'Trend Analysis', href: '/ai/trend-analysis', icon: ChartColumn },
                ],
            },
            {
                title: 'AI Insights',
                icon: Stars,
                children: [
                    { title: 'Weak Subjects', href: '/ai/weak-subjects', icon: BookOpen },
                    { title: 'Best Schools', href: '/ai/best-schools', icon: School },
                    { title: 'At Risk Students', href: '/ai/at-risk-students', icon: Users2 },
                    { title: 'Improvement Suggestions', href: '/ai/improvements', icon: ClipboardList },
                ],
            },
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

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

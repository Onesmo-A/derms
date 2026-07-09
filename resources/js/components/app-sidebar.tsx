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
    FolderGit2,
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
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import AppLogoIcon from '@/components/app-logo-icon';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Regions',
        icon: House,
        children: [
            { title: 'All Regions', href: '/regions', icon: House },
        ],
    },
    {
        title: 'Districts',
        icon: Layers3,
        children: [
            { title: 'All Districts', href: '/districts', icon: Layers3 },
        ],
    },
    {
        title: 'Schools Management',
        icon: School,
        children: [
            { title: 'Schools List', href: '/schools', icon: School },
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
            { title: 'Subject Registration', href: '/students/subjects', icon: BookOpen },
            { title: 'Registered Candidates', href: '/candidates', icon: Users2 },
            { title: 'Candidate Registration', href: '/candidates?register=true', icon: BadgeCheck },
            { title: 'Student Promotions', href: '/students/promotions', icon: ChevronRight },
            { title: 'Student Transfers', href: '/students/transfers', icon: ChevronRight },
            { title: 'Duplicate Detection', href: '/students/duplicates', icon: Radar },
            { title: 'Student Performance History', href: '/students/performance-history', icon: ChartColumn },
        ],
    },
    {
        title: 'Academic Setup',
        icon: GraduationCap,
        children: [
            { title: 'Academic Years', href: '/academic-years', icon: GraduationCap },
            { title: 'Class Levels', href: '/class-levels', icon: Layers3 },
            { title: 'Subjects', href: '/subjects', icon: BookOpen },
            { title: 'Grading Systems', href: '/grading-systems', icon: ShieldCheck },
            { title: 'Division Rules', href: '/division-rules', icon: ShieldCheck },
        ],
    },
    {
        title: 'Examination Operations',
        icon: ClipboardList,
        children: [
            { title: 'All Examinations', href: '/examinations', icon: ClipboardList },
            { title: 'Examination Calendar', href: '/examinations/calendar', icon: CalendarDays },
            { title: 'Create Examination', href: '/examinations/create', icon: BadgeCheck },
            { title: 'Examination Timetable', href: '/examinations/timetable', icon: FileSpreadsheet },
            { title: 'Assign & Weight Subjects', href: '/examinations/subjects/assign', icon: BookOpen },
            { title: 'Centers List', href: '/examination-centers', icon: Building2 },
            { title: 'Examination Types', href: '/examination-types', icon: FolderGit2 },
        ],
    },
    {
        title: 'Marks Management',
        icon: Table2,
        children: [
            { title: 'Spreadsheet Entry', href: '/marks', icon: FileSpreadsheet },
            { title: 'Manual Marks Entry', href: '/marks/manual-entry', icon: ClipboardList },
            { title: 'Import Marks', href: '/marks/import', icon: FileDown },
            { title: 'Bulk Update Marks', href: '/marks/bulk-update', icon: DatabaseZap },
            { title: 'Marks Verification', href: '/marks/verification', icon: ShieldCheck },
            { title: 'Practical Entry', href: '/marks/practical-entry', icon: ClipboardList },
        ],
    },
    {
        title: 'Results Management',
        icon: FileBarChart2,
        children: [
            { title: 'Process Results', href: '/results/process', icon: DatabaseZap },
            { title: 'Reprocess Results', href: '/results/reprocess', icon: DatabaseZap },
            { title: 'Processing History', href: '/results/processing-history', icon: Activity },
            { title: 'Processing Logs', href: '/results/processing-logs', icon: ShieldCheck },
            { title: 'Publish Results', href: '/results/publish', icon: Stars },
            { title: 'Unpublish Results', href: '/results/unpublish', icon: VenetianMask },
            { title: 'Publication History', href: '/results/publication-history', icon: Activity },
            { title: 'SMS Result Notifications', href: '/notifications/sms', icon: MessagesSquare },
            { title: 'Request Corrections', href: '/results/corrections/request', icon: ShieldCheck },
            { title: 'Approve Corrections', href: '/results/corrections/approve', icon: BadgeCheck },
            { title: 'Correction Logs', href: '/results/corrections/logs', icon: Activity },
        ],
    },
    {
        title: 'Reports & Analytics',
        icon: FileBarChart2,
        children: [
            { title: 'Reports Dashboard', href: '/reports', icon: FileBarChart2 },
            { title: 'National Reports', href: '/reports/national', icon: ShieldCheck },
            { title: 'Regional Reports', href: '/reports/regions', icon: House },
            { title: 'District Reports', href: '/reports/districts', icon: Building2 },
            { title: 'School Reports', href: '/reports/schools', icon: School },
            { title: 'Student Reports', href: '/reports/students', icon: Users2 },
            { title: 'AI Insights', href: '/reports/ai-insights', icon: Stars },
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
            <SidebarHeader className="px-3 pt-3">
                <Link
                    href="/dashboard"
                    prefetch
                    className="flex items-center gap-3 rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3 transition hover:bg-sidebar-accent/60"
                >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-1 shadow-sm">
                        <AppLogoIcon className="h-full w-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-sidebar-foreground">
                            IDEMS
                        </span>
                        <span className="block truncate text-[11px] text-sidebar-foreground/70">
                            Iramba District Examination Management System
                        </span>
                    </span>
                </Link>
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

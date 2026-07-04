import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden flex flex-col" style={{ minHeight: '100svh' }}>
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 w-full">
                    {children}
                </div>
                <footer className="w-full border-t border-slate-200 dark:border-slate-700 py-3 px-6 text-center" style={{ fontSize: '11px', color: '#64748b', backgroundColor: 'transparent', flexShrink: 0 }}>
                    Powered By{' '}
                    <a
                        href="https://nativetechnology.africa/"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 600, color: '#0F4C81', textDecoration: 'underline' }}
                    >
                        Native Technology
                    </a>
                    {' '}· v1.0.0
                </footer>
            </AppContent>
        </AppShell>
    );
}

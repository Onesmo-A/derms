import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent variant="header" className="flex flex-col min-h-screen">
                <div className="flex-1 w-full">
                    {children}
                </div>
                <footer style={{ width: '100%', borderTop: '1px solid #e2e8f0', padding: '12px 24px', textAlign: 'center', fontSize: '11px', color: '#64748b', flexShrink: 0 }}>
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

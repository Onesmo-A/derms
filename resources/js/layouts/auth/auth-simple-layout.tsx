import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-between bg-background p-6 md:p-10">
            <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-full overflow-hidden">
                                <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
            <footer style={{ width: '100%', padding: '12px 0', textAlign: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid #e2e8f0', marginTop: 'auto', flexShrink: 0 }}>
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
        </div>
    );
}

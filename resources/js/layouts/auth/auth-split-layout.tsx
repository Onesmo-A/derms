import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium"
                >
                    <span className="mr-2 flex size-8 items-center justify-center overflow-hidden rounded-full bg-white/10">
                        <AppLogoIcon className="size-full object-cover" />
                    </span>
                    {name}
                </Link>
            </div>
            <div className="w-full lg:p-8 flex flex-col h-full justify-between py-6">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] my-auto">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
                            <AppLogoIcon className="h-full w-full object-cover" />
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
                <footer style={{ width: '100%', padding: '10px 0', textAlign: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
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
        </div>
    );
}

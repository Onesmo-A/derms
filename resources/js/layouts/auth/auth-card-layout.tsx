import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-between bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6 flex-1 justify-center">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="flex h-9 w-9 items-center justify-center">
                        <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                    </div>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
            <footer style={{ width: '100%', padding: '12px 0', textAlign: 'center', fontSize: '11px', color: '#64748b', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
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

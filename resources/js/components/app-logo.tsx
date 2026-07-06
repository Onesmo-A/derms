import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-full object-cover" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    IDEMS
                </span>
                <span className="truncate text-xs text-muted-foreground">
                    Iramba District Examination Management System
                </span>
            </div>
        </>
    );
}

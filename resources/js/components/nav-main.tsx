import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    const hasActiveDescendant = (item: NavItem): boolean => {
        if (item.href && isCurrentUrl(item.href)) {
            return true;
        }

        return item.children?.some((child) => hasActiveDescendant(child)) ?? false;
    };

    const renderItems = (navItems: NavItem[], level = 0) =>
        navItems.map((item) => {
            const hasChildren = Boolean(item.children?.length);
            const isActive = item.href ? isCurrentUrl(item.href) : hasActiveDescendant(item);
            const defaultOpen = Boolean(level === 0 && hasChildren && hasActiveDescendant(item));

            if (hasChildren) {
                const menuButton = (
                    <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={{ children: item.title }}
                        className={level > 0 ? 'h-9 text-[13px]' : undefined}
                    >
                        <button type="button" className="w-full">
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronDown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </button>
                    </SidebarMenuButton>
                );

                return (
                    <Collapsible key={item.title} defaultOpen={defaultOpen} className="group/collapsible">
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>{menuButton}</CollapsibleTrigger>
                            <CollapsibleContent>
                                {level === 0 ? (
                                    <SidebarMenuSub>
                                        {renderItems(item.children ?? [], level + 1)}
                                    </SidebarMenuSub>
                                ) : (
                                    <SidebarMenuSub className="border-sidebar-border ml-2">
                                        {renderItems(item.children ?? [], level + 1)}
                                    </SidebarMenuSub>
                                )}
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                );
            }

            if (!item.href) {
                return null;
            }

            if (level === 0) {
                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={Boolean(isActive)}
                            tooltip={{ children: item.title }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            }

            return (
                <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton asChild isActive={Boolean(isActive)}>
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuSubButton>
                </SidebarMenuSubItem>
            );
        });

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>DERMS Navigation</SidebarGroupLabel>
            <SidebarMenu>
                {renderItems(items)}
            </SidebarMenu>
        </SidebarGroup>
    );
}

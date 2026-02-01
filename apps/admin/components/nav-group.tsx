"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge,
  Badge,
  useSidebar,
} from "@repo/ui";
import type { NavGroup, NavItem } from "./sidebar-data";

interface NavGroupProps {
  group: NavGroup;
  pendingCount?: number;
}

export function NavGroup({ group, pendingCount }: NavGroupProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
      <SidebarMenu>
        {group.items.map((item) =>
          item.items && item.items.length > 0 ? (
            <CollapsibleNavItem key={item.title} item={item} pathname={pathname} />
          ) : (
            <SimpleNavItem
              key={item.title}
              item={item}
              pathname={pathname}
              pendingCount={
                item.url === "/requests" ? pendingCount : undefined
              }
            />
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function SimpleNavItem({
  item,
  pathname,
  pendingCount,
}: {
  item: NavItem;
  pathname: string;
  pendingCount?: number;
}) {
  const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <Link href={item.url}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {pendingCount && pendingCount > 0 ? (
        <SidebarMenuBadge>
          <Badge variant="destructive" className="h-5 min-w-5 rounded-full px-1.5 text-[10px]">
            {pendingCount}
          </Badge>
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

function CollapsibleNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const { state } = useSidebar();
  const isActive =
    pathname === item.url ||
    item.items?.some(
      (sub) =>
        pathname === sub.url || pathname.startsWith(sub.url + "/")
    );

  // When sidebar is collapsed, render as a simple button without collapsible
  if (state === "collapsed") {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={!!isActive} tooltip={item.title}>
          <Link href={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild defaultOpen={!!isActive}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={!!isActive} tooltip={item.title}>
            <item.icon />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={
                    pathname === subItem.url ||
                    pathname.startsWith(subItem.url + "/")
                  }
                >
                  <Link href={subItem.url}>
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

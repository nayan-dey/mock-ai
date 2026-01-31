"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@repo/ui";
import { sidebarData } from "./sidebar-data";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";

export function AppSidebar() {
  const { state } = useSidebar();
  const pendingCount = useQuery(api.orgJoinRequests.getPendingCount) ?? 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <Link
          href="/dashboard"
          className="flex h-12 items-center gap-2 px-2"
        >
          <img
            src="/logo.svg"
            alt="Nindo"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 dark:invert"
          />
          {state === "expanded" && (
            <span className="text-lg font-bold tracking-tight">
              Nindo Admin
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.map((group) => (
          <NavGroup
            key={group.title}
            group={group}
            pendingCount={pendingCount}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

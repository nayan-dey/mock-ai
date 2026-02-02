"use client";

import { useRouter } from "next/navigation";
import { useClerk, useUser, SignedIn } from "@clerk/nextjs";
import { ChevronsUpDown, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@repo/ui";
import { getInitials } from "@/lib/utils";

export function NavUser() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { state, isMobile } = useSidebar();

  const handleSignOut = () => {
    signOut().then(() => router.replace("/"));
  };

  const displayName = user?.fullName || "Admin";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const imageUrl = user?.imageUrl;

  return (
    <SignedIn>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {imageUrl && <AvatarImage src={imageUrl} alt={displayName} />}
                  <AvatarFallback className="rounded-lg text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                {state === "expanded" && (
                  <>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {imageUrl && <AvatarImage src={imageUrl} alt={displayName} />}
                    <AvatarFallback className="rounded-lg text-xs">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SignedIn>
  );
}

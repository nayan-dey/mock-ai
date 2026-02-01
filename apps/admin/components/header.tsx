"use client";

import { useTheme } from "next-themes";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  ScrollArea,
  Separator,
  SidebarTrigger,
  cn,
} from "@repo/ui";
import {
  Bell,
  Moon,
  Sun,
  IndianRupee,
  ChevronRight,
  FileCheck,
  UserPlus,
  GraduationCap,
  Ban,
  UserCheck,
  CheckCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserDetailSheet } from "./user-detail-sheet";

const notificationConfig: Record<
  string,
  { icon: typeof Bell; color: string; bgColor: string }
> = {
  fee_overdue: {
    icon: IndianRupee,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  fee_paid: {
    icon: IndianRupee,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  test_submitted: {
    icon: FileCheck,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  join_request: {
    icon: UserPlus,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  student_enrolled: {
    icon: GraduationCap,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  student_suspended: {
    icon: Ban,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
  student_unsuspended: {
    icon: UserCheck,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const unreadCount = useQuery(api.notifications.getUnreadCount) ?? 0;
  const notifications = useQuery(
    api.notifications.getAll,
    sheetOpen ? { limit: 50 } : "skip"
  );
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNotificationClick = async (notification: {
    _id: string;
    type: string;
    referenceId?: string;
    referenceType?: string;
    isRead: boolean;
    actorName?: string;
  }) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead({ id: notification._id as any });
    }

    // Navigate based on reference type
    if (notification.referenceType === "user" && notification.referenceId) {
      setSheetOpen(false);
      setSelectedStudent({
        id: notification.referenceId,
        name: notification.actorName ?? "Student",
      });
    } else if (notification.referenceType === "joinRequest") {
      setSheetOpen(false);
      router.push("/requests");
    } else if (notification.referenceType === "fee") {
      setSheetOpen(false);
      router.push("/fees");
    } else if (notification.referenceType === "attempt") {
      setSheetOpen(false);
      router.push("/tests");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <div className="flex flex-1 items-center justify-end gap-2">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setSheetOpen(true)}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
      </div>

      {/* Notifications Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => markAllAsRead({})}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </Button>
              )}
            </div>
            <SheetDescription>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "All caught up"}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
            {notifications && notifications.length > 0 ? (
              <div className="space-y-2 pr-4">
                {notifications.map((notification) => {
                  const config =
                    notificationConfig[notification.type] ??
                    notificationConfig.fee_overdue;
                  const Icon = config.icon;
                  return (
                    <button
                      key={notification._id}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50",
                        !notification.isRead && "bg-muted/30 border-primary/20"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          config.bgColor
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  No notifications
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  You&apos;re all caught up
                </p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* User Detail Sheet opened from notification */}
      <UserDetailSheet
        userId={selectedStudent?.id ?? null}
        open={!!selectedStudent}
        onOpenChange={(open) => {
          if (!open) setSelectedStudent(null);
        }}
      />
    </header>
  );
}

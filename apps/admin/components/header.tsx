"use client";

import { useTheme } from "next-themes";
import { useQuery } from "convex/react";
import { api } from "@repo/database";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  ScrollArea,
  Badge,
  Separator,
  SidebarTrigger,
} from "@repo/ui";
import { Bell, Moon, Sun, IndianRupee, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { UserDetailSheet } from "./user-detail-sheet";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const dueCount = useQuery(api.fees.getDueCount) ?? 0;
  const dueNotifications = useQuery(
    api.fees.getDueNotifications,
    sheetOpen ? {} : "skip"
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const getDaysOverdue = (dueDate: number) => {
    const diff = Date.now() - dueDate;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleNotificationClick = (studentId: string, studentName: string) => {
    setSheetOpen(false);
    setSelectedStudent({ id: studentId, name: studentName });
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
          aria-label={dueCount > 0 ? `Notifications (${dueCount} overdue)` : "Notifications"}
        >
          <Bell className="h-5 w-5" />
          {dueCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {dueCount > 99 ? "99+" : dueCount}
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
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              Fee payments overdue by 30+ days
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="mt-4 h-[calc(100vh-8rem)]">
            {dueNotifications && dueNotifications.length > 0 ? (
              <div className="space-y-2 pr-4">
                {dueNotifications.map((item) => (
                  <button
                    key={item._id}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() =>
                      handleNotificationClick(
                        item.studentId,
                        item.studentName
                      )
                    }
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <IndianRupee className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">
                        {item.studentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.description || "Fee payment"} &mdash;{" "}
                        {getDaysOverdue(item.dueDate)} days overdue
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        &#8377;{item.amount}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">
                  No overdue fees
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  All fee payments are up to date
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

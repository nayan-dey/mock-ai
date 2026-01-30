"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  Button,
  Skeleton,
  Badge,
} from "@repo/ui";
import { Shield, ShieldCheck, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminsPage() {
  const admins = useQuery(api.organizations.listAdmins);
  const isSuperAdmin = useQuery(api.organizations.isSuperAdmin);
  const removeAdmin = useMutation(api.organizations.removeAdmin);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleRemove = async (orgAdminId: string, name: string) => {
    setRemovingId(orgAdminId);
    setConfirmId(null);
    try {
      await removeAdmin({ orgAdminId: orgAdminId as any });
      toast.success(`${name} has been removed from the organization.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove admin.");
    } finally {
      setRemovingId(null);
    }
  };

  if (admins === undefined || isSuperAdmin === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Admins</h1>
        <p className="text-sm text-muted-foreground">
          Manage administrators of your organization
        </p>
      </div>

      {admins.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">
              No admins found
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <Card key={admin._id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {admin.isSuperAdmin ? (
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    ) : (
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{admin.userName}</p>
                      {admin.isSuperAdmin && (
                        <Badge variant="default" className="text-[10px]">
                          Super Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {admin.userEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(admin.createdAt))}
                    </p>
                  </div>
                </div>

                {isSuperAdmin && !admin.isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    {confirmId === admin._id ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmId(null)}
                          disabled={removingId === admin._id}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() =>
                            handleRemove(admin._id, admin.userName)
                          }
                          disabled={removingId === admin._id}
                        >
                          {removingId === admin._id
                            ? "Removing..."
                            : "Confirm"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => setConfirmId(admin._id)}
                        disabled={removingId === admin._id}
                      >
                        <UserMinus className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

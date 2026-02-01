"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Button,
  Input,
  Label,
  Textarea,
  ImageUpload,
} from "@repo/ui";
import { Building2, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function OrgSettingsPage() {
  const org = useQuery(api.organizations.getMyOrg);
  const isSuperAdmin = useQuery(api.organizations.isSuperAdmin);
  const updateOrg = useMutation(api.organizations.update);
  const generateLogoUploadUrl = useMutation(
    api.organizations.generateLogoUploadUrl
  );

  const [isSaving, setIsSaving] = useState(false);
  const [logoStorageId, setLogoStorageId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactEmail: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (org) {
      setFormData({
        name: org.name || "",
        description: org.description || "",
        contactEmail: org.contactEmail || "",
        phone: org.phone || "",
        address: org.address || "",
      });
    }
  }, [org]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;

    setIsSaving(true);
    try {
      await updateOrg({
        id: org._id,
        name: formData.name.trim() || undefined,
        description: formData.description.trim() || undefined,
        logoStorageId: logoStorageId || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
      } as any);
      toast.success("Organization settings updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (org === undefined || isSuperAdmin === undefined) {
    return (
      <div className="p-6">
        <div className="mb-6 space-y-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  const readOnly = !isSuperAdmin;

  return (
    <div className="p-6">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Organization Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          {readOnly
            ? "View your organization details"
            : "Manage your organization details and branding"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
         {readOnly && (
          <p className="text-center text-sm text-muted-foreground">
            Only the super admin can edit organization settings.
          </p>
        )}
        {/* Logo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Organization Logo
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a logo for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              currentImageUrl={org.resolvedLogoUrl}
              onUpload={(id) => setLogoStorageId(id)}
              onRemove={() => setLogoStorageId(null)}
              generateUploadUrl={generateLogoUploadUrl}
              maxSizeMB={10}
              shape="square"
              size="lg"
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        {/* Name */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Organization Name
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Organization name"
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="A short description of your organization"
              rows={3}
              disabled={readOnly}
            />
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                placeholder="contact@yourorg.com"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+91 9876543210"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Organization address"
                rows={2}
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <Button type="submit" className="w-full gap-2" disabled={isSaving}>
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        )}

       
      </form>
    </div>
  );
}

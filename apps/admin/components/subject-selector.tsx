"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@repo/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Input,
  useToast,
} from "@repo/ui";
import { Plus, Loader2 } from "lucide-react";

interface SubjectSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}

export function SubjectSelector({
  value,
  onValueChange,
  id,
  placeholder = "Select subject",
}: SubjectSelectorProps) {
  const subjects = useQuery(api.subjects.list, {});
  const createSubject = useMutation(api.subjects.create);
  const { toast } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await createSubject({ name: trimmed });
      onValueChange(trimmed);
      setNewName("");
      setIsAdding(false);
      toast({ title: "Subject added" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add subject",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {subjects?.map((s) => (
            <SelectItem key={s._id} value={s.name}>
              {s.name}
            </SelectItem>
          ))}
          {(!subjects || subjects.length === 0) && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              No subjects yet
            </div>
          )}
        </SelectContent>
      </Select>

      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Subject name"
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewName("");
              }
            }}
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0"
            onClick={handleAdd}
            disabled={!newName.trim() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Add"
            )}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Subject
        </button>
      )}
    </div>
  );
}

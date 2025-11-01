"use client";

import type React from "react";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Assignment } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface AssignmentFormProps {
  onAssignmentAdd: (assignment: Assignment) => void;
  onCancel: () => void;
}

export function AssignmentForm({
  onAssignmentAdd,
  onCancel,
}: AssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setLoading(true);
    try {
      const userRes = await supabase.auth.getUser();
      // eslint-disable-next-line no-console
      console.log("supabase.auth.getUser() ->", userRes);
      const user = userRes?.data?.user;
      if (!user) {
        // eslint-disable-next-line no-console
        console.error("No user returned from supabase.auth.getUser()", userRes);
        setLoading(false);
        return;
      }

      const dueDatetime = new Date(`${dueDate}T${dueTime}`).toISOString();

      // Verify profile exists for this user, since tasks/assignments require profiles.id
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profileData) {
          const msg =
            "Your account is missing a profile record required by the database. Please complete signup/profile creation (or run an INSERT into profiles for your user id).";
          // eslint-disable-next-line no-console
          console.error("Profile row not found for user:", user.id);
          setErrorMsg(msg);
          setLoading(false);
          return;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Error checking profile existence:", e);
        setErrorMsg(
          "Unable to verify user profile. This may be due to DB RLS policies. Please ensure your profile row exists in the database."
        );
        setLoading(false);
        return;
      }

      const res = await supabase
        .from("assignments")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim() || null,
          due_date: dueDatetime,
          file_url: fileUrl.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      // eslint-disable-next-line no-console
      console.log("Supabase insert result (assignments):", res);
      // deeper inspection
      // eslint-disable-next-line no-console
      console.dir(res);
      // eslint-disable-next-line no-console
      console.log(
        "res keys:",
        Object.keys(res || {}),
        Object.getOwnPropertyNames(res || {})
      );
      const { data, error } = res as any;

      if (error) {
        // eslint-disable-next-line no-console
        console.error("Supabase insert error (assignments):", error, { data });
        setErrorMsg(error?.message || "Failed to add assignment");
      } else if (data) {
        setErrorMsg(null);
        onAssignmentAdd(data);
      }
    } catch (error) {
      try {
        // eslint-disable-next-line no-console
        console.error(
          "Error creating assignment:",
          error,
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error creating assignment (non-serializable):", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Assignment Title
              </label>
              <Input
                id="title"
                placeholder="e.g., Project Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium mb-2"
              >
                Subject
              </label>
              <Input
                id="subject"
                placeholder="e.g., Data Structures"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description
            </label>
            <Input
              id="description"
              placeholder="Add assignment details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium mb-2"
              >
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="dueTime"
                className="block text-sm font-medium mb-2"
              >
                Due Time
              </label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="fileUrl" className="block text-sm font-medium mb-2">
              File URL (optional)
            </label>
            <Input
              id="fileUrl"
              type="url"
              placeholder="https://example.com/assignment.pdf"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              disabled={loading}
            />
          </div>

          {errorMsg && (
            <div className="text-sm text-destructive">{errorMsg}</div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Assignment"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

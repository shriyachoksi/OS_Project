"use client";

import type React from "react";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Attendance } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface AttendanceFormProps {
  onRecordAdd: (record: Attendance) => void;
  onCancel: () => void;
}

export function AttendanceForm({ onRecordAdd, onCancel }: AttendanceFormProps) {
  const [className, setClassName] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"present" | "absent" | "leave">(
    "present"
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !date) return;

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

      // Verify profile exists for this user before inserting attendance
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
        .from("attendance")
        .insert({
          user_id: user.id,
          class_name: className.trim(),
          date,
          status,
        })
        .select()
        .single();

      // eslint-disable-next-line no-console
      console.log("Supabase insert result (attendance):", res);
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
        console.error("Supabase insert error (attendance):", error, { data });
        setErrorMsg(error?.message || "Failed to add attendance record");
      } else if (data) {
        setErrorMsg(null);
        onRecordAdd(data);
      }
    } catch (error) {
      try {
        // eslint-disable-next-line no-console
        console.error(
          "Error creating attendance record:",
          error,
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(
          "Error creating attendance record (non-serializable):",
          error
        );
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
              <label
                htmlFor="className"
                className="block text-sm font-medium mb-2"
              >
                Class Name
              </label>
              <Input
                id="className"
                placeholder="e.g., Data Structures"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-2">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Attendance Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "present" | "absent" | "leave")
              }
              disabled={loading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
            </select>
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
                  Adding...
                </>
              ) : (
                "Add Record"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

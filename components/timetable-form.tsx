"use client";

import type React from "react";

import { useState } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Timetable } from "@/lib/types";
import { Loader2 } from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

interface TimetableFormProps {
  onClassAdd: (timetable: Timetable) => void;
  onCancel: () => void;
}

export function TimetableForm({ onClassAdd, onCancel }: TimetableFormProps) {
  const [className, setClassName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [room, setRoom] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !startTime || !endTime) return;

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

      // Verify profile exists for this user before inserting timetable entry
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
        .from("timetable")
        .insert({
          user_id: user.id,
          class_name: className.trim(),
          instructor: instructor.trim() || null,
          room: room.trim() || null,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
        })
        .select()
        .single();

      // eslint-disable-next-line no-console
      console.log("Supabase insert result (timetable):", res);
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
        console.error("Supabase insert error (timetable):", error, { data });
        setErrorMsg(error?.message || "Failed to add class");
      } else if (data) {
        setErrorMsg(null);
        onClassAdd(data);
      }
    } catch (error) {
      try {
        // eslint-disable-next-line no-console
        console.error(
          "Error creating class:",
          error,
          JSON.stringify(error, Object.getOwnPropertyNames(error))
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error creating class (non-serializable):", error);
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
              <label
                htmlFor="instructor"
                className="block text-sm font-medium mb-2"
              >
                Instructor
              </label>
              <Input
                id="instructor"
                placeholder="Instructor name (optional)"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="dayOfWeek"
                className="block text-sm font-medium mb-2"
              >
                Day of Week
              </label>
              <select
                id="dayOfWeek"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium mb-2"
              >
                Start Time
              </label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium mb-2"
              >
                End Time
              </label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="room" className="block text-sm font-medium mb-2">
              Room Number
            </label>
            <Input
              id="room"
              placeholder="e.g., A-101"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
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
                  Adding...
                </>
              ) : (
                "Add Class"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

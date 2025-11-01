"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { AttendanceForm } from "./attendance-form";
import type { Attendance } from "@/lib/types";

type AttendanceStatus = "present" | "absent" | "leave";

export function AttendanceContent() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Load attendance data and ensure today's timetable is synced
  useEffect(() => {
    const loadData = async () => {
      // get current user once
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;
        setUserId(user.id);

        await syncTodayWithTimetable(user.id);
        await fetchAttendance(user.id);
      } catch (err) {
        console.error("Error loading user/attendance:", err);
      }
    };
    loadData();
  }, []);

  /** 📦 Fetch attendance records from Supabase */
  const fetchAttendance = async (uid?: string) => {
    try {
      setLoading(true);
      const id = uid ?? userId;
      if (!id) return;

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", id)
        // exclude soft-deleted records
        .neq("status", "removed")
        .order("date", { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  /** 🗓 Sync today's classes from timetable into attendance */
  const syncTodayWithTimetable = async (uid: string) => {
    try {
      if (!uid) return;

      const today = new Date();
      const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
      const dateOnly = today.toISOString().split("T")[0]; // e.g., 2025-11-01

      // Get today's classes from timetable
      const { data: timetableData, error: timetableError } = await supabase
        .from("timetable")
        .select("class_name")
        .eq("user_id", uid)
        .eq("day_of_week", dayName);

      if (timetableError) throw timetableError;
      if (!timetableData || timetableData.length === 0) return;

      // Get today's attendance records
      const { data: existingAttendance, error: attendanceError } =
        await supabase
          .from("attendance")
          .select("class_name, date, status")
          .eq("user_id", uid)
          .eq("date", dateOnly)
          // ignore soft-deleted rows when deciding whether to insert
          .neq("status", "removed");

      if (attendanceError) throw attendanceError;

      const existingClassNames =
        existingAttendance?.map((r) => r.class_name) || [];

      // Filter classes not already in attendance
      const newClasses = timetableData
        .filter((item) => !existingClassNames.includes(item.class_name))
        .map((item) => ({
          class_name: item.class_name,
          status: "absent" as AttendanceStatus,
          date: dateOnly,
          user_id: uid,
          created_at: new Date().toISOString(),
        }));

      // Insert new attendance records (if any) and return inserted rows
      if (newClasses.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from("attendance")
          .insert(newClasses)
          .select();
        if (insertError) throw insertError;
        // After inserting, re-fetch to ensure we have canonical rows (ids, RLS-safe)
        await fetchAttendance(uid);
      }
    } catch (err) {
      console.error("Error syncing timetable:", err);
    }
  };

  /** ➕ Add record via form */
  const handleAttendanceAdd = async (newRecord: Partial<Attendance>) => {
    try {
      if (!userId) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;
        setUserId(user.id);
      }

      const payload = {
        class_name: newRecord.class_name,
        date: newRecord.date,
        status: newRecord.status ?? "absent",
        user_id: userId!,
        created_at: new Date().toISOString(),
      } as Partial<Attendance>;
      // Prevent duplicate entries: if an attendance record for the same user/class/date
      // already exists (and isn't soft-deleted), update it instead of inserting.
      const { data: existing, error: fetchErr } = await supabase
        .from("attendance")
        .select("id,status")
        .eq("user_id", userId!)
        .eq("class_name", payload.class_name)
        .eq("date", payload.date)
        .neq("status", "removed")
        .limit(1)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      if (existing && (existing as any).id) {
        // Update existing record's status (and keep created_at)
        const existingId = (existing as any).id as string;
        const { data: updated, error: updateErr } = await supabase
          .from("attendance")
          .update({ status: payload.status })
          .eq("id", existingId)
          .eq("user_id", userId)
          .select();
        if (updateErr) throw updateErr;
      } else {
        const { data, error } = await supabase
          .from("attendance")
          .insert([payload])
          .select();
        if (error) throw error;
      }

      // refresh from server to ensure we show canonical rows (ids, RLS)
      await fetchAttendance(userId || undefined);
      setShowForm(false);
    } catch (err) {
      console.error("Error adding attendance:", err);
    }
  };

  // Delete functionality removed

  /** 🔄 Update status */
  const handleStatusUpdate = async (
    recordId: string,
    status: AttendanceStatus
  ) => {
    try {
      if (!userId) return;
      setProcessingId(recordId);
      const { data, error } = await supabase
        .from("attendance")
        .update({ status })
        .match({ id: recordId, user_id: userId })
        .select();
      setProcessingId(null);
      if (error) throw error;
      // Refresh from DB to get canonical state (safe for RLS where returned rows may be empty)
      await fetchAttendance(userId);
    } catch (err) {
      setProcessingId(null);
      console.error("Error updating attendance status:", err);
    }
  };

  /** 🗑️ Delete record */
  const handleDelete = async (recordId: string) => {
    try {
      if (!userId) return;
      // Ask for confirmation in the browser
      if (!confirm("Are you sure you want to delete this attendance record?"))
        return;

      setProcessingId(recordId);

      // Log current auth info to ensure we have a session in the browser
      try {
        const { data: authData, error: authErr } =
          await supabase.auth.getUser();
        console.debug("Supabase auth.getUser() result:", { authData, authErr });
      } catch (e) {
        console.debug("Error calling auth.getUser():", e);
      }

      console.debug("Attempting server-side delete via API", {
        recordId,
        userId,
      });

      // Call server route to perform a soft-delete using the service role
      try {
        const res = await fetch("/api/delete-attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: recordId }),
        });

        const payload = await res.json();
        console.debug(
          "Server delete API response:",
          payload,
          "status:",
          res.status
        );

        if (!res.ok) {
          throw new Error(payload?.error || "Server delete failed");
        }

        // Remove the record locally immediately, and refresh from server
        setAttendance((prev) => prev.filter((r) => r.id !== recordId));
        await fetchAttendance(userId);
      } catch (e) {
        console.error("Error calling server delete API:", e);
      }
    } catch (err) {
      setProcessingId(null);
      console.error("Error deleting attendance record:", err);
    }
  };

  /** 🔍 Filtered results */
  const filteredAttendance = attendance.filter((record) =>
    record.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /** 📊 Stats */
  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === "present").length,
    absent: attendance.filter((a) => a.status === "absent").length,
    leave: attendance.filter((a) => a.status === "leave").length,
  };

  const percentage =
    stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  const classWiseAttendance = attendance.reduce((acc, record) => {
    if (!acc[record.class_name])
      acc[record.class_name] = { present: 0, total: 0 };
    acc[record.class_name].total++;
    if (record.status === "present") acc[record.class_name].present++;
    return acc;
  }, {} as Record<string, { present: number; total: number }>);

  // 🧱 UI
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="spotlight flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            Attendance Tracker
          </h1>
          <p className="text-muted-foreground">Monitor your class attendance</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={20} /> Add Attendance
        </Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <AttendanceForm
            onRecordAdd={handleAttendanceAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Stats: use responsive 5-column layout so tiles fill the row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
        {[
          { label: "Total Classes", value: stats.total, color: "text-primary" },
          { label: "Present", value: stats.present, color: "text-green-600" },
          { label: "Absent", value: stats.absent, color: "text-red-600" },
          { label: "Leave", value: stats.leave, color: "text-blue-600" },
          {
            label: "Percentage",
            value: `${percentage}%`,
            color: "text-primary",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="transition-all hover:-translate-y-0.5 gradient-border rounded-xl w-full"
          >
            <CardContent className="pt-6 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Class-wise Summary */}
      {Object.keys(classWiseAttendance).length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Attendance by Class</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(classWiseAttendance).map(([className, data]) => {
              const percentage = Math.round((data.present / data.total) * 100);
              return (
                <Card key={className}>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-3 text-sm">{className}</h3>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-bold text-sm">{percentage}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {data.present} of {data.total} classes
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Search by class name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Attendance Table */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Loading attendance records...
            </p>
          </CardContent>
        </Card>
      ) : filteredAttendance.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {attendance.length === 0
                ? "No attendance records yet. Add your first attendance record!"
                : "No records match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-base">Attendance Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Class Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {record.class_name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === "present"
                              ? "bg-green-500/10 text-green-600"
                              : record.status === "absent"
                              ? "bg-red-500/10 text-red-600"
                              : "bg-blue-500/10 text-blue-600"
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() +
                            record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() =>
                            handleStatusUpdate(record.id, "present")
                          }
                          disabled={processingId === record.id}
                          className={`w-8 h-8 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 flex items-center justify-center ${
                            processingId === record.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          aria-label="Mark Present"
                        >
                          P
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(record.id, "absent")
                          }
                          disabled={processingId === record.id}
                          className={`w-8 h-8 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center justify-center ${
                            processingId === record.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          aria-label="Mark Absent"
                        >
                          A
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={processingId === record.id}
                          className={`w-8 h-8 rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center justify-center ${
                            processingId === record.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

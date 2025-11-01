"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Timetable } from "@/lib/types";
import { Plus, Trash2, MapPin, User } from "lucide-react";
import { TimetableForm } from "./timetable-form";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function TimetableContent() {
  const [timetable, setTimetable] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .eq("user_id", user.id)
        .order("day_of_week");

      if (error) throw error;
      setTimetable(data || []);
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassAdd = (newClass: Timetable) => {
    setTimetable([...timetable, newClass]);
    setShowForm(false);
  };

  const handleDelete = async (classId: string) => {
    try {
      const { error } = await supabase
        .from("timetable")
        .delete()
        .eq("id", classId);

      if (error) throw error;
      setTimetable(timetable.filter((c) => c.id !== classId));
    } catch (error) {
      console.error("Error deleting class:", error);
    }
  };

  const getDayClasses = (day: string) => {
    return timetable
      .filter((c) => c.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
      {/* Premium Hero */}
      <div className="relative spotlight rounded-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)]/8 via-transparent to-[var(--color-accent)]/8 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 md:p-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient">
              Timetable
            </h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Plan and visualize your week. Add classes, set locations and
              times, and keep your schedule in sync.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus size={18} />
                Add Class
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                Export
              </Button>
            </div>
          </div>

          <div className="ml-auto hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total classes</div>
              <div className="text-2xl font-semibold">{timetable.length}</div>
            </div>
            <div className="w-24 h-24 rounded-full bg-card/70 glass flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-foreground">ET</span>
            </div>
          </div>
        </div>
      </div>

      {/* Class Form (inline) */}
      {showForm && (
        <div className="mb-8">
          <div className="max-w-2xl mx-auto gradient-border rounded-xl p-6 glass">
            <TimetableForm
              onClassAdd={handleClassAdd}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading timetable...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {DAYS.map((day) => {
            const dayClasses = getDayClasses(day);
            return (
              <div key={day} className="relative">
                <Card className="overflow-hidden rounded-2xl border-2 border-primary/60 shadow-sm bg-card/100">
                  <CardHeader className="flex items-center justify-between gap-4 bg-card/80 px-6 py-4">
                    <div className="flex items-center gap-4">
                      <CardTitle className="text-lg">{day}</CardTitle>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {dayClasses.length} classes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowForm(true)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {dayClasses.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <div className="mx-auto mb-4 w-44 h-24 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/6 to-[var(--color-accent)]/6 flex items-center justify-center">
                          {/* subtle illustrative placeholder */}
                          <svg
                            width="84"
                            height="44"
                            viewBox="0 0 84 44"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden
                          >
                            <rect
                              width="84"
                              height="44"
                              rx="8"
                              fill="url(#g)"
                            />
                            <defs>
                              <linearGradient
                                id="g"
                                x1="0"
                                x2="1"
                                y1="0"
                                y2="1"
                              >
                                <stop
                                  offset="0"
                                  stopColor="rgba(99,102,241,0.12)"
                                />
                                <stop
                                  offset="1"
                                  stopColor="rgba(168,85,247,0.08)"
                                />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                        <div className="mb-4 font-medium">
                          No classes scheduled for {day}
                        </div>
                        <div>
                          <Button
                            onClick={() => setShowForm(true)}
                            className="gap-2"
                          >
                            <Plus size={16} /> Add a class
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {dayClasses.map((classItem) => (
                          <div
                            key={classItem.id}
                            className="p-4 flex flex-col md:flex-row md:items-center gap-4"
                          >
                            <div className="flex md:flex-col items-center md:items-start w-full md:w-auto md:min-w-[160px]">
                              <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 text-sm font-medium text-foreground shadow-sm">
                                {classItem.start_time} — {classItem.end_time}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-foreground text-lg truncate">
                                    {classItem.class_name}
                                  </h3>
                                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    {classItem.room && (
                                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted/5">
                                        <MapPin size={14} /> {classItem.room}
                                      </span>
                                    )}
                                    {classItem.instructor && (
                                      <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-muted/5">
                                        <User size={14} />{" "}
                                        {classItem.instructor}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  <button
                                    onClick={() => handleDelete(classItem.id)}
                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                                    aria-label={`Delete ${classItem.class_name}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {timetable.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No classes added yet. Create your first class schedule!
                </p>
                <Button onClick={() => setShowForm(true)} className="mx-auto">
                  <Plus size={16} /> Add class
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

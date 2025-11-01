"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, FileText, Users } from "lucide-react";
import type { Profile } from "@/lib/types";

export function DashboardContent() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    assignmentsCount: 0,
    todayClasses: 0,
    attendancePercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        // Get profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select()
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // (tasks feature removed) -- skip tasks count

        // Get assignments count
        const { count: assignmentsCount } = await supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending");

        // Get today's timetable
        const today = new Date();
        const dayName = today.toLocaleDateString("en-US", { weekday: "long" });

        const { data: todayClasses } = await supabase
          .from("timetable")
          .select("*")
          .eq("user_id", user.id)
          .eq("day_of_week", dayName);

        // Get attendance percentage
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", user.id)
          // exclude soft-deleted rows
          .neq("status", "removed");

        const presentCount =
          attendanceData?.filter((a) => a.status === "present").length || 0;
        const totalClasses = attendanceData?.length || 0;
        const percentage =
          totalClasses > 0
            ? Math.round((presentCount / totalClasses) * 100)
            : 0;

        setStats({
          assignmentsCount: assignmentsCount || 0,
          todayClasses: todayClasses?.length || 0,
          attendancePercentage: percentage,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const quickActions = [
    {
      icon: FileText,
      label: "View Assignments",
      href: "/assignments",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      icon: Calendar,
      label: "Check Timetable",
      href: "/timetable",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      icon: Users,
      label: "Track Attendance",
      href: "/attendance",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 tracking-tight text-gradient">
          {loading
            ? "Loading..."
            : `Welcome back, ${profile?.full_name || "Student"}!`}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your academic journey efficiently with EduTrack
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 bg-linear-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {stats.assignmentsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">due soon</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 bg-linear-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Today&apos;s Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
              {stats.todayClasses}
            </div>
            <p className="text-xs text-muted-foreground mt-1">scheduled</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border-0 bg-linear-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
              {stats.attendancePercentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">present</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className="cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl rounded-2xl border-0 bg-linear-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 group">
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${action.color} shadow-lg group-hover:scale-110 transition-transform`}
                    >
                      <Icon size={28} />
                    </div>
                    <h3 className="font-semibold text-lg">{action.label}</h3>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Profile Info
      {profile && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Your Profile
          </h2>
          <Card className="rounded-2xl border-0 bg-linear-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-xl">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Name</p>
                  <p className="font-semibold text-lg">{profile.full_name}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Roll Number
                  </p>
                  <p className="font-semibold text-lg">{profile.roll_number}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Email</p>
                  <p className="font-medium text-sm">{profile.email}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Department
                  </p>
                  <p className="font-semibold text-lg">
                    {profile.department || "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}
    </div>
  );
}

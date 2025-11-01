"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Assignment } from "@/lib/types";
import { Plus, Calendar } from "lucide-react";
import { AssignmentForm } from "./assignment-form";
import { AssignmentCard } from "./assignment-card";

export function AssignmentsContent() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "submitted" | "graded"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentAdd = (newAssignment: Assignment) => {
    setAssignments([...assignments, newAssignment]);
    setShowForm(false);
  };

  const handleAssignmentUpdate = (updatedAssignment: Assignment) => {
    setAssignments(
      assignments.map((a) =>
        a.id === updatedAssignment.id ? updatedAssignment : a
      )
    );
  };

  const handleAssignmentDelete = (assignmentId: string) => {
    setAssignments(assignments.filter((a) => a.id !== assignmentId));
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesFilter = filter === "all" || assignment.status === filter;
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.subject &&
        assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === "pending").length,
    submitted: assignments.filter((a) => a.status === "submitted").length,
    graded: assignments.filter((a) => a.status === "graded").length,
  };

  const isOverdue = (dueDate: string) => {
    return (
      new Date(dueDate) < new Date() &&
      new Date().toDateString() !== new Date(dueDate).toDateString()
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="spotlight flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            Assignments
          </h1>
          <p className="text-muted-foreground">
            Track and submit your assignments
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus size={20} />
          Add Assignment
        </Button>
      </div>

      {/* Assignment Form */}
      {showForm && (
        <div className="mb-8">
          <AssignmentForm
            onAssignmentAdd={handleAssignmentAdd}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Stats - responsive asymmetric layout */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 transition-all hover:-translate-y-0.5 gradient-border rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 transition-all hover:-translate-y-0.5 gradient-border rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 transition-all hover:-translate-y-0.5 gradient-border rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {stats.submitted}
              </p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 transition-all hover:-translate-y-0.5 gradient-border rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.graded}
              </p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search assignments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "submitted", "graded"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="capitalize text-sm"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading assignments...</p>
          </CardContent>
        </Card>
      ) : filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {assignments.length === 0
                ? "No assignments yet."
                : "No assignments match your filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              isOverdue={isOverdue(assignment.due_date)}
              onUpdate={handleAssignmentUpdate}
              onDelete={handleAssignmentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Assignment } from "@/lib/types";
import {
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
  Clock,
  FileText,
  Edit3,
  Check,
} from "lucide-react";

interface AssignmentCardProps {
  assignment: Assignment;
  isOverdue: boolean;
  onUpdate: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
}

export function AssignmentCard({
  assignment,
  isOverdue,
  onUpdate,
  onDelete,
}: AssignmentCardProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const [showMarksInput, setShowMarksInput] = useState(false);
  const [marksObtained, setMarksObtained] = useState<string>(
    assignment.marks_obtained?.toString() ?? ""
  );
  const [marksTotal, setMarksTotal] = useState<string>(
    assignment.marks_total?.toString() ?? ""
  );
  const [savingMarks, setSavingMarks] = useState(false);
  const [editingMarks, setEditingMarks] = useState(false);

  const handleStatusChange = async (
    newStatus: "pending" | "submitted" | "graded"
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .update({
          status: newStatus,
          submitted_at:
            newStatus === "submitted" ? new Date().toISOString() : null,
        })
        .eq("id", assignment.id)
        .select()
        .single();

      if (error) throw error;
      if (data) onUpdate(data);
    } catch (error) {
      console.error("Error updating assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignment.id);

      if (error) throw error;
      onDelete(assignment.id);
    } catch (error) {
      console.error("Error deleting assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sync local inputs when assignment prop changes
    setMarksObtained(
      assignment.marks_obtained != null ? String(assignment.marks_obtained) : ""
    );
    setMarksTotal(
      assignment.marks_total != null ? String(assignment.marks_total) : ""
    );
  }, [assignment.id, assignment.marks_obtained, assignment.marks_total]);

  const handleSaveMarks = async () => {
    // basic validation
    const obt = marksObtained === "" ? null : Number(marksObtained);
    const tot = marksTotal === "" ? null : Number(marksTotal);

    if (
      obt != null &&
      tot != null &&
      Number.isNaN(obt) === false &&
      Number.isNaN(tot) === false
    ) {
      if (obt < 0 || tot <= 0 || obt > tot) {
        // simple client-side validation - don't save
        console.warn(
          "Invalid marks: obtained should be >=0, total>0 and obtained<=total"
        );
        return;
      }
    }

    // don't attempt update if both fields are empty
    if (obt == null && tot == null) {
      console.warn("No marks to save");
      setShowMarksInput(false);
      return;
    }

    setSavingMarks(true);
    try {
      // if both marks are provided, mark the assignment as graded
      const payload: any = { marks_obtained: obt, marks_total: tot };
      if (obt != null && tot != null) payload.status = "graded";

      const { data, error } = await supabase
        .from("assignments")
        .update(payload)
        .eq("id", assignment.id)
        .select()
        .single();

      if (error) {
        // Supabase may return an object with details - stringify for clarity
        console.error("Error saving marks:", JSON.stringify(error), {
          payload,
        });
        throw error;
      }

      if (data) {
        onUpdate(data);
        setShowMarksInput(false);
        setEditingMarks(false);
      }
    } catch (err) {
      // Try to log useful fields if present
      const e = err as any;
      try {
        console.error("Error saving marks:", e?.message ?? JSON.stringify(e), {
          code: e?.code,
          details: e?.details,
          hint: e?.hint,
        });
      } catch (e2) {
        console.error("Error saving marks: (unable to stringify error)", e);
      }
    } finally {
      setSavingMarks(false);
    }
  };

  const handleEditMarks = () => {
    setEditingMarks(true);
    setShowMarksInput(true);
  };

  const daysUntilDue = Math.ceil(
    (new Date(assignment.due_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      case "submitted":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "graded":
        return "bg-green-500/10 text-green-600 dark:text-green-400";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <Card
      className={
        isOverdue && assignment.status === "pending"
          ? "border-destructive/50 bg-destructive/5"
          : ""
      }
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg break-words">
                  {assignment.title}
                </h3>
                {assignment.subject && (
                  <p className="text-sm text-muted-foreground">
                    {assignment.subject}
                  </p>
                )}
              </div>
            </div>

            {assignment.description && (
              <p className="text-sm text-muted-foreground mb-3 ml-8">
                {assignment.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4 ml-8">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span>
                  {new Date(assignment.due_date).toLocaleDateString()}{" "}
                  {new Date(assignment.due_date).toLocaleTimeString()}
                </span>
                {daysUntilDue >= 0 && (
                  <span className="text-muted-foreground">
                    ({daysUntilDue} days left)
                  </span>
                )}
              </div>

              {isOverdue && assignment.status === "pending" && (
                <div className="flex items-center gap-1 text-sm text-destructive font-medium">
                  <AlertCircle size={16} />
                  Overdue
                </div>
              )}

              <span
                className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(
                  assignment.status
                )}`}
              >
                {assignment.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 md:w-40">
            {assignment.status !== "graded" && (
              <>
                {assignment.status === "pending" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusChange("submitted")}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Mark Submitted
                  </Button>
                )}
                {assignment.status === "submitted" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange("pending")}
                    disabled={loading}
                    className="w-full"
                  >
                    Undo Submit
                  </Button>
                )}
              </>
            )}

            {assignment.file_url && (
              <a
                href={assignment.file_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 bg-transparent"
                >
                  <Download size={16} />
                  Download
                </Button>
              </a>
            )}
            {/* Marks UI: show add button after submission, input form, and display with edit */}
            {assignment.status === "submitted" && (
              <div className="w-full flex items-center justify-center">
                {/* if marks not set and not showing input, show Add Marks button */}
                {!assignment.marks_obtained &&
                  !assignment.marks_total &&
                  !showMarksInput && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowMarksInput(true)}
                      className="w-full md:w-32"
                    >
                      Add Marks
                    </Button>
                  )}

                {/* (kept single Add Marks button above) */}
              </div>
            )}

            {/* If inputs are requested (Add/Edit), show the form here so it appears even after grading */}
            {showMarksInput && (
              <div className="w-full flex items-center justify-center mt-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveMarks();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    aria-label="marks-obtained"
                    type="number"
                    min={0}
                    value={marksObtained}
                    onChange={(e) => setMarksObtained(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveMarks();
                      }
                    }}
                    className="no-spinner w-14 px-2 py-1 text-sm border rounded appearance-none text-center"
                    placeholder="Obt"
                  />
                  <span className="text-sm">/</span>
                  <input
                    aria-label="marks-total"
                    type="number"
                    min={1}
                    value={marksTotal}
                    onChange={(e) => setMarksTotal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveMarks();
                      }
                    }}
                    className="no-spinner w-14 px-2 py-1 text-sm border rounded appearance-none text-center"
                    placeholder="Tot"
                  />
                  <Button
                    type="button"
                    onClick={handleSaveMarks}
                    aria-label="Save marks"
                    size="sm"
                    variant="ghost"
                    className="ml-1 shrink-0"
                    disabled={savingMarks}
                  >
                    <Check size={14} />
                  </Button>
                </form>
              </div>
            )}

            {/* display marks with small edit button - show once set and hide while editing */}
            {assignment.marks_obtained != null &&
              assignment.marks_total != null &&
              !showMarksInput && (
                <div className="w-full flex items-center justify-center mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full md:w-32 flex items-center justify-between px-3"
                    onClick={() => {
                      setShowMarksInput(true);
                      setEditingMarks(true);
                    }}
                  >
                    <span className="text-sm font-medium">
                      {assignment.marks_obtained}/{assignment.marks_total}
                    </span>
                    <Edit3 size={14} />
                  </Button>
                </div>
              )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="w-full text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

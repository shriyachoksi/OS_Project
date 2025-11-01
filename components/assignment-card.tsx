"use client"

import { useState } from "react"
import { createClient } from "@/lib/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Assignment } from "@/lib/types"
import { Trash2, CheckCircle2, AlertCircle, Download, Clock, FileText } from "lucide-react"

interface AssignmentCardProps {
  assignment: Assignment
  isOverdue: boolean
  onUpdate: (assignment: Assignment) => void
  onDelete: (assignmentId: string) => void
}

export function AssignmentCard({ assignment, isOverdue, onUpdate, onDelete }: AssignmentCardProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleStatusChange = async (newStatus: "pending" | "submitted" | "graded") => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("assignments")
        .update({
          status: newStatus,
          submitted_at: newStatus === "submitted" ? new Date().toISOString() : null,
        })
        .eq("id", assignment.id)
        .select()
        .single()

      if (error) throw error
      if (data) onUpdate(data)
    } catch (error) {
      console.error("Error updating assignment:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.from("assignments").delete().eq("id", assignment.id)

      if (error) throw error
      onDelete(assignment.id)
    } catch (error) {
      console.error("Error deleting assignment:", error)
    } finally {
      setLoading(false)
    }
  }

  const daysUntilDue = Math.ceil(
    (new Date(assignment.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      case "submitted":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "graded":
        return "bg-green-500/10 text-green-600 dark:text-green-400"
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <Card className={isOverdue && assignment.status === "pending" ? "border-destructive/50 bg-destructive/5" : ""}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2">
              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg break-words">{assignment.title}</h3>
                {assignment.subject && <p className="text-sm text-muted-foreground">{assignment.subject}</p>}
              </div>
            </div>

            {assignment.description && (
              <p className="text-sm text-muted-foreground mb-3 ml-8">{assignment.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-4 ml-8">
              <div className="flex items-center gap-2 text-sm">
                <Clock size={16} className="text-muted-foreground" />
                <span>
                  {new Date(assignment.due_date).toLocaleDateString()}{" "}
                  {new Date(assignment.due_date).toLocaleTimeString()}
                </span>
                {daysUntilDue >= 0 && <span className="text-muted-foreground">({daysUntilDue} days left)</span>}
              </div>

              {isOverdue && assignment.status === "pending" && (
                <div className="flex items-center gap-1 text-sm text-destructive font-medium">
                  <AlertCircle size={16} />
                  Overdue
                </div>
              )}

              <span
                className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(assignment.status)}`}
              >
                {assignment.status}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:w-40">
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
              <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                  <Download size={16} />
                  Download
                </Button>
              </a>
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
  )
}

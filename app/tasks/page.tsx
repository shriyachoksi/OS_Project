import { redirect } from "next/navigation";

export default function TasksPage() {
  // Page removed — redirect permanently to dashboard
  redirect("/dashboard");
}

import { requireRole } from "@/lib/auth";
import RecruiterLiveDashboard from "./RecruiterLiveDashboard";

export default async function RecruiterPage() {
  await requireRole("recruiter");
  return <RecruiterLiveDashboard />;
}

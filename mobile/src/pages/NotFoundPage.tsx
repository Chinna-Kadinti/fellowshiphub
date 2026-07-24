import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui";

export function NotFoundPage() {
  return (
    <EmptyState
      action={<Link className="button button--primary button--md" to="/dashboard">Go to dashboard</Link>}
      body="The page may have moved, or the link is no longer valid."
      icon={<Compass aria-hidden="true" size={24} />}
      title="Page not found"
    />
  );
}

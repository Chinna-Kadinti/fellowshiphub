import { BookOpen } from "lucide-react";
import { AuthForm } from "@/components/forms/auth-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold">Join FellowshipHub</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create a member profile for meetings, prayer, and reading plans.</p>
      </div>
      <AuthForm mode="register" />
    </main>
  );
}

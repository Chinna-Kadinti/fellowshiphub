import { BookOpen } from "lucide-react";
import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BookOpen className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold">FellowshipHub</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bible study coordination for the whole fellowship.</p>
      </div>
      <AuthForm mode="login" />
      <div className="mt-5 rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">
        Demo admin: admin@fellowshiphub.local / Admin@12345
        <br />
        Demo member: member@fellowshiphub.local / Member@12345
      </div>
    </main>
  );
}

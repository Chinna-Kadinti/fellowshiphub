import Image from "next/image";
import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="mb-6 text-center">
        <Image src="/egf-connect.png" alt="EGF Connect" width={112} height={112} priority className="mx-auto mb-3 h-28 w-28 object-contain" />
        <h1 className="text-3xl font-semibold">EGF Connect</h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">Gather • Grow • Go</p>
      </div>
      <AuthForm mode="login" oauthError={searchParams.error} />
    </main>
  );
}

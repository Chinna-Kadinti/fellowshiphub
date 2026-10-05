import Image from "next/image";
import { AuthForm } from "@/components/forms/auth-form";

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-secondary/60 blur-3xl" aria-hidden="true" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-card/75 shadow-[0_35px_100px_-45px_rgba(15,55,48,.45)] backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden min-h-[650px] overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-16 h-80 w-80 rounded-full border-[55px] border-white/5" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <span className="rounded-2xl bg-white/95 p-2 shadow-lg"><Image src="/egf-connect.png" alt="" width={52} height={52} className="h-12 w-12 object-contain" /></span>
            <span className="text-xl font-bold">EGF Connect</span>
          </div>
          <div className="relative">
            <p className="mb-5 text-sm font-bold uppercase tracking-[.2em] text-primary-foreground/60">Gather · Grow · Go</p>
            <h1 className="text-balance text-5xl font-semibold leading-[1.08] tracking-tight">Faith grows stronger in community.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/70">One welcoming place for fellowship, prayer, gatherings, and growing together in the Word.</p>
          </div>
          <p className="relative text-sm text-primary-foreground/50">A community built around connection and purpose.</p>
        </section>
        <section className="flex flex-col justify-center p-5 sm:p-10 lg:p-12">
          <div className="mb-7 text-center lg:hidden">
            <Image src="/egf-connect.png" alt="EGF Connect" width={88} height={88} priority className="mx-auto mb-2 h-20 w-20 object-contain" />
            <h1 className="text-3xl font-semibold tracking-tight">Welcome home</h1>
            <p className="mt-2 text-sm text-muted-foreground">Gather · Grow · Go</p>
          </div>
          <AuthForm mode="login" oauthError={searchParams.error} />
        </section>
      </div>
    </main>
  );
}

import Image from "next/image";
import { AuthForm } from "@/components/forms/auth-form";

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-card/75 shadow-[0_35px_100px_-45px_rgba(15,55,48,.45)] backdrop-blur-xl lg:grid-cols-[.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3"><span className="rounded-2xl bg-white/95 p-2"><Image src="/egf-connect.png" alt="" width={48} height={48} /></span><span className="text-xl font-bold">EGF Connect</span></div>
          <div><p className="mb-4 text-sm font-bold uppercase tracking-[.2em] text-primary-foreground/60">You belong here</p><h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight">Join a community that walks together.</h1><p className="mt-5 leading-7 text-primary-foreground/70">Connect with people, share prayer, and stay close to every fellowship moment.</p></div>
          <p className="text-sm text-primary-foreground/50">Gather · Grow · Go</p>
        </section>
        <section className="max-h-[92vh] overflow-y-auto p-5 sm:p-10 lg:p-12">
          <div className="mb-5 text-center lg:hidden"><Image src="/egf-connect.png" alt="EGF Connect" width={72} height={72} priority className="mx-auto h-16 w-16 object-contain" /><h1 className="mt-2 text-2xl font-semibold">Join EGF Connect</h1></div>
          <AuthForm mode="register" oauthError={searchParams.error} />
        </section>
      </div>
    </main>
  );
}

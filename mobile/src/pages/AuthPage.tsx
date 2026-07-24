import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { type Resolver, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { Button, Card, Field, InlineNotice } from "../components/ui";
import { firstErrorMessage } from "../lib/format";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.")
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  phone: z.string().trim().optional(),
  area: z.string().trim().optional(),
  phoneVisible: z.boolean().optional()
});

type AuthValues = z.infer<typeof registerSchema>;

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const schema = mode === "login" ? loginSchema : registerSchema;
  const form = useForm<AuthValues>({
    resolver: zodResolver(schema) as Resolver<AuthValues>,
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      area: "",
      phoneVisible: false
    }
  });

  async function onSubmit(values: AuthValues) {
    setSubmitError("");
    try {
      if (mode === "login") {
        await login({ email: values.email, password: values.password });
      } else {
        await createAccount(values);
      }
      const from = (
        location.state as {
          from?: { pathname?: string; search?: string; hash?: string };
        } | null
      )?.from;
      const previous = from?.pathname
        ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
        : "";
      navigate(previous.startsWith("/") ? previous : "/dashboard", { replace: true });
    } catch (error) {
      setSubmitError(firstErrorMessage(error));
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--one" />
      <div className="auth-page__glow auth-page__glow--two" />
      <section className="auth-layout">
        <header className="auth-brand">
          <img className="auth-brand__logo" src="/egf-connect.png" alt="EGF Connect" />
          <p className="eyebrow">Gather • Grow • Go</p>
          <h1>{mode === "login" ? "Welcome to EGF Connect" : "Join EGF Connect"}</h1>
          <p>
            {mode === "login"
              ? "Meet in fellowship, grow through Scripture and prayer, and share the Gospel."
              : "Create a member profile for meetings, prayer, and reading plans."}
          </p>
        </header>

        <Card className="auth-card">
          <div className="card__header">
            <h2>{mode === "login" ? "Sign in" : "Create your account"}</h2>
            <p>
              {mode === "login"
                ? "Use your EGF Connect account to continue."
                : "Register as a member of the fellowship."}
            </p>
          </div>
          <form className="form-stack" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            {mode === "register" ? (
              <>
                <Field
                  autoComplete="name"
                  error={form.formState.errors.name?.message}
                  label="Name"
                  {...form.register("name")}
                />
                <div className="form-grid">
                  <Field
                    autoComplete="tel"
                    error={form.formState.errors.phone?.message}
                    inputMode="tel"
                    label="Phone"
                    {...form.register("phone")}
                  />
                  <Field
                    autoComplete="address-level2"
                    error={form.formState.errors.area?.message}
                    label="Area"
                    {...form.register("area")}
                  />
                </div>
                <label className="check-field">
                  <input type="checkbox" {...form.register("phoneVisible")} />
                  <span>
                    <strong>Show my phone number</strong>
                    <small>Other members can see it in the directory.</small>
                  </span>
                </label>
              </>
            ) : null}
            <Field
              autoCapitalize="none"
              autoComplete="email"
              error={form.formState.errors.email?.message}
              inputMode="email"
              label="Email"
              type="email"
              {...form.register("email")}
            />
            <div className="password-field">
              <Field
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                error={form.formState.errors.password?.message}
                label="Password"
                type={showPassword ? "text" : "password"}
                {...form.register("password")}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="password-field__toggle"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
              </button>
            </div>
            {submitError ? <InlineNotice tone="error">{submitError}</InlineNotice> : null}
            <Button className="button--full" loading={form.formState.isSubmitting} type="submit">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <p className="auth-card__switch">
            {mode === "login" ? "Need an account? " : "Already have an account? "}
            <Link to={mode === "login" ? "/register" : "/login"}>
              {mode === "login" ? "Register" : "Sign in"}
            </Link>
          </p>
        </Card>
      </section>
    </main>
  );
}

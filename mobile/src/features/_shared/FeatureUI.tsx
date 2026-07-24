import type { PropsWithChildren, ReactNode } from "react";
import { AlertCircle, LoaderCircle, ShieldCheck } from "lucide-react";
import { firstErrorMessage } from "../../lib/format";
import "./feature.css";

export function FeaturePage({ children }: PropsWithChildren) {
  return <div className="fhf-page">{children}</div>;
}

export function FeatureHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="fhf-header">
      <div className="fhf-header-copy">
        <p className="fhf-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="fhf-description">{description}</p> : null}
      </div>
      {action ? <div className="fhf-header-action">{action}</div> : null}
    </header>
  );
}

export function Card({
  children,
  className = "",
  tone
}: PropsWithChildren<{ className?: string; tone?: "accent" | "soft" }>) {
  return <article className={`fhf-card ${tone ? `fhf-card--${tone}` : ""} ${className}`}>{children}</article>;
}

export function CardHeading({
  title,
  subtitle,
  aside
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="fhf-card-heading">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {aside ? <div className="fhf-card-aside">{aside}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral"
}: PropsWithChildren<{ tone?: "neutral" | "primary" | "warning" | "danger" | "success" | "muted" }>) {
  return <span className={`fhf-badge fhf-badge--${tone}`}>{children}</span>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  block?: boolean;
};

export function Button({
  children,
  className = "",
  variant = "primary",
  block,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`fhf-button fhf-button--${variant} ${block ? "fhf-button--block" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  name,
  hint,
  children
}: PropsWithChildren<{ label: string; name: string; hint?: string }>) {
  return (
    <label className="fhf-field" htmlFor={name}>
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function AdminComposer({
  title,
  description,
  children,
  defaultOpen = false
}: PropsWithChildren<{ title: string; description: string; defaultOpen?: boolean }>) {
  return (
    <details className="fhf-composer" open={defaultOpen}>
      <summary>
        <span className="fhf-composer-icon"><ShieldCheck aria-hidden="true" /></span>
        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        <span className="fhf-composer-toggle" aria-hidden="true">+</span>
      </summary>
      <div className="fhf-composer-body">{children}</div>
    </details>
  );
}

export function FormStatus({
  error,
  success
}: {
  error?: unknown;
  success?: string | null;
}) {
  if (error) {
    return (
      <p className="fhf-form-status fhf-form-status--error" role="alert">
        <AlertCircle aria-hidden="true" />
        {firstErrorMessage(error)}
      </p>
    );
  }
  if (success) return <p className="fhf-form-status fhf-form-status--success" role="status">{success}</p>;
  return null;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fhf-state" role="status">
      <LoaderCircle className="fhf-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="fhf-state fhf-state--error" role="alert">
      <AlertCircle aria-hidden="true" />
      <h2>Couldn’t load this page</h2>
      <p>{firstErrorMessage(error)}</p>
      {retry ? <Button variant="secondary" onClick={retry}>Try again</Button> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="fhf-state fhf-state--empty">
      {icon ? <div className="fhf-empty-icon">{icon}</div> : null}
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export function PageNotice({ children }: PropsWithChildren) {
  return <div className="fhf-page-notice" role="status">{children}</div>;
}

export function UnauthorizedState() {
  return (
    <div className="fhf-state fhf-state--error">
      <ShieldCheck aria-hidden="true" />
      <h2>Leader access only</h2>
      <p>Reports are available only to fellowship administrators.</p>
    </div>
  );
}


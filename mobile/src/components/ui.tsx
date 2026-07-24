import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  forwardRef,
  useEffect,
  useId
} from "react";
import { AlertCircle, Inbox, LoaderCircle, X } from "lucide-react";
import { firstErrorMessage } from "../lib/format";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx("button", `button--${variant}`, `button--${size}`, className)}
      disabled={disabled || loading}
      type={type ?? "button"}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="spin" size={18} /> : null}
      {children}
    </button>
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cx("card", className)} {...props} />;
}

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "primary" | "gold" | "success" | "warning" | "danger" | "muted";
}) {
  return <span className={cx("badge", `badge--${tone}`, className)} {...props} />;
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    label,
    error,
    hint,
    id,
    className,
    containerClassName,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error || hint ? `${inputId}-description` : undefined;

  return (
    <label className={cx("field", containerClassName)} htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <input
        aria-describedby={descriptionId}
        aria-invalid={Boolean(error)}
        className={cx("input", error && "input--error", className)}
        id={inputId}
        ref={ref}
        {...props}
      />
      {error ? (
        <span className="field__error" id={descriptionId}>{error}</span>
      ) : hint ? (
        <span className="field__hint" id={descriptionId}>{hint}</span>
      ) : null}
    </label>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    {
      label,
      error,
      hint,
      id,
      className,
      containerClassName,
      children,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = error || hint ? `${inputId}-description` : undefined;

    return (
      <label className={cx("field", containerClassName)} htmlFor={inputId}>
        <span className="field__label">{label}</span>
        <select
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          className={cx("input", "select", error && "input--error", className)}
          id={inputId}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <span className="field__error" id={descriptionId}>{error}</span>
        ) : hint ? (
          <span className="field__hint" id={descriptionId}>{hint}</span>
        ) : null}
      </label>
    );
  }
);

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField(
    {
      label,
      error,
      hint,
      id,
      className,
      containerClassName,
      ...props
    },
    ref
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = error || hint ? `${inputId}-description` : undefined;

    return (
      <label className={cx("field", containerClassName)} htmlFor={inputId}>
        <span className="field__label">{label}</span>
        <textarea
          aria-describedby={descriptionId}
          aria-invalid={Boolean(error)}
          className={cx("input", "textarea", error && "input--error", className)}
          id={inputId}
          ref={ref}
          {...props}
        />
        {error ? (
          <span className="field__error" id={descriptionId}>{error}</span>
        ) : hint ? (
          <span className="field__hint" id={descriptionId}>{hint}</span>
        ) : null}
      </label>
    );
  }
);

export function ScreenHeader({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx("screen-header", className)}>
      <div className="screen-header__copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="screen-header__description">{description}</p> : null}
      </div>
      {action ? <div className="screen-header__action">{action}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon ?? <Inbox aria-hidden="true" size={24} />}</div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
      {action}
    </div>
  );
}

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div aria-live="polite" className="loading-screen" role="status">
      <LoaderCircle aria-hidden="true" className="spin" size={28} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  error,
  title = "We couldn’t load this",
  onRetry
}: {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle aria-hidden="true" size={24} />
      <div>
        <h2>{title}</h2>
        <p>{firstErrorMessage(error)}</p>
        {onRetry ? <Button className="error-state__retry" onClick={onRetry} size="sm" variant="outline">Try again</Button> : null}
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  destructive = false
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  destructive?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div aria-label={title} aria-modal="true" className="modal-backdrop" role="dialog">
      <div className={cx("modal", destructive && "modal--destructive")}>
        <header className="modal__header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <Button aria-label="Close" autoFocus onClick={onClose} size="icon" variant="ghost">
            <X aria-hidden="true" size={20} />
          </Button>
        </header>
        {children ? <div className="modal__content">{children}</div> : null}
        {footer ? <footer className="modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function Metric({
  label,
  value,
  helper,
  compact = false
}: {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cx("metric", compact && "metric--compact")}>
      <strong>{value}</strong>
      <span>{label}</span>
      {helper ? <small>{helper}</small> : null}
    </div>
  );
}

export function InlineNotice({
  children,
  tone = "info"
}: {
  children: ReactNode;
  tone?: "info" | "success" | "error";
}) {
  return <div className={cx("notice", `notice--${tone}`)}>{children}</div>;
}

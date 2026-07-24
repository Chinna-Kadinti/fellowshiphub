import { useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookMarked, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { api, queryKeys } from "../../lib/api";
import { formatCalendarDate } from "../../lib/format";
import type { ReadingPayload } from "../_shared/models";
import {
  AdminComposer,
  Badge,
  Button,
  Card,
  CardHeading,
  EmptyState,
  ErrorState,
  FeatureHeader,
  FeaturePage,
  Field,
  FormStatus,
  LoadingState
} from "../_shared/FeatureUI";

export function ReadingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const readingQuery = useQuery({
    queryKey: queryKeys.reading,
    queryFn: api.reading
  });
  const createReading = useMutation({
    mutationFn: api.createReading,
    onSuccess: async () => {
      formRef.current?.reset();
      setSuccess("Reading entry added.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.reading }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports })
      ]);
    }
  });
  const completeReading = useMutation({
    mutationFn: api.completeReading,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reading });
      await queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    }
  });
  const payload = readingQuery.data as ReadingPayload | undefined;

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    createReading.mutate({
      date: String(data.get("date") ?? ""),
      passage: String(data.get("passage") ?? "").trim(),
      description: String(data.get("description") ?? "").trim()
    });
  }

  return (
    <FeaturePage>
      <FeatureHeader
        eyebrow="Bible Reading Plan"
        title="Daily Scripture"
        description="Follow the shared plan and keep track of the passages you complete."
      />

      {payload ? (
        <Card tone="accent">
          <div className="fhf-progress-label">
            <strong>{payload.progress}%</strong>
            <span>{payload.completedCount} of {payload.totalCount} completed</span>
          </div>
          <div
            className="fhf-progress"
            role="progressbar"
            aria-label="Reading plan progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={payload.progress}
          >
            <span style={{ "--fhf-progress": `${payload.progress}%` } as CSSProperties} />
          </div>
        </Card>
      ) : null}

      {user?.role === "ADMIN" ? (
        <AdminComposer
          title="Add reading entry"
          description="Create an entry for the fellowship’s shared reading plan."
        >
          <form ref={formRef} className="fhf-form-grid fhf-form-grid--two" onSubmit={handleCreate}>
            <Field label="Date" name="reading-date">
              <input className="fhf-input" id="reading-date" name="date" type="date" required />
            </Field>
            <Field label="Passage" name="reading-passage">
              <input
                className="fhf-input"
                id="reading-passage"
                name="passage"
                minLength={2}
                placeholder="John 15:1–17"
                required
              />
            </Field>
            <Field label="Description" name="reading-description">
              <textarea
                className="fhf-textarea"
                id="reading-description"
                name="description"
                minLength={3}
                required
              />
            </Field>
            <div className="fhf-form-span">
              <FormStatus error={createReading.error} success={success} />
            </div>
            <Button className="fhf-form-span" type="submit" block disabled={createReading.isPending}>
              <BookMarked size={17} aria-hidden="true" />
              {createReading.isPending ? "Adding…" : "Add entry"}
            </Button>
          </form>
        </AdminComposer>
      ) : null}

      {completeReading.isError ? <FormStatus error={completeReading.error} /> : null}

      {readingQuery.isPending ? (
        <LoadingState label="Loading reading plan…" />
      ) : readingQuery.isError ? (
        <ErrorState error={readingQuery.error} retry={() => void readingQuery.refetch()} />
      ) : payload && payload.plans.length > 0 ? (
        <section className="fhf-card-grid fhf-card-grid--three" aria-label="Reading plan">
          {payload.plans.map((plan) => (
            <Card key={plan.id} tone={plan.completed ? "accent" : undefined}>
              <div className="fhf-badges">
                <Badge>{formatCalendarDate(plan.date)}</Badge>
                {plan.completed ? (
                  <Badge tone="success"><CheckCircle2 size={12} aria-hidden="true" /> Completed</Badge>
                ) : null}
              </div>
              <CardHeading title={plan.passage} />
              <p className="fhf-card-body">{plan.description}</p>
              {!plan.completed ? (
                <>
                  <div className="fhf-divider" />
                  <Button
                    block
                    disabled={completeReading.isPending && completeReading.variables === plan.id}
                    onClick={() => completeReading.mutate(plan.id)}
                  >
                    <CheckCircle2 size={17} aria-hidden="true" />
                    {completeReading.isPending && completeReading.variables === plan.id
                      ? "Saving…"
                      : "Mark completed"}
                  </Button>
                </>
              ) : null}
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<BookMarked aria-hidden="true" />}
          title="No reading entries yet"
          description="The shared reading plan will appear here when a leader adds it."
        />
      )}
    </FeaturePage>
  );
}

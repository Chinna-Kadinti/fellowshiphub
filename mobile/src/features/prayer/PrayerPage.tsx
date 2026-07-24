import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, HandHeart, LockKeyhole } from "lucide-react";
import { api, queryKeys } from "../../lib/api";
import { enumLabel, formatDateTime } from "../../lib/format";
import type {
  PrayerCategory,
  PrayerPayload,
  PrayerRequest,
  PrayerStatus,
  PrayerVisibility
} from "../_shared/models";
import {
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
  LoadingState,
  PageNotice
} from "../_shared/FeatureUI";

const categories: PrayerCategory[] = [
  "HEALTH",
  "FAMILY",
  "EDUCATION",
  "JOB",
  "MINISTRY",
  "THANKSGIVING",
  "OTHER"
];
const statuses: PrayerStatus[] = ["ACTIVE", "ANSWERED", "ARCHIVED"];

export function PrayerPage() {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const prayerQuery = useQuery({
    queryKey: queryKeys.prayer,
    queryFn: api.prayer
  });
  const createPrayer = useMutation({
    mutationFn: api.createPrayer,
    onSuccess: async () => {
      formRef.current?.reset();
      setCreateSuccess("Prayer request submitted.");
      await refreshPrayer();
    }
  });
  const pray = useMutation({
    mutationFn: (id: string) => api.pray(id),
    onSuccess: refreshPrayer
  });
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrayerStatus }) => api.updatePrayerStatus(id, status),
    onSuccess: refreshPrayer
  });

  async function refreshPrayer() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.prayer }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.reports })
    ]);
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateSuccess(null);
    const data = new FormData(event.currentTarget);
    createPrayer.mutate({
      title: String(data.get("title") ?? "").trim(),
      category: data.get("category") as PrayerCategory,
      visibility: data.get("visibility") as PrayerVisibility,
      description: String(data.get("description") ?? "").trim()
    });
  }

  const payload = prayerQuery.data as PrayerPayload | undefined;

  return (
    <FeaturePage>
      <FeatureHeader
        eyebrow="Prayer Requests"
        title="Pray Together"
        description="Share a need, support one another, and celebrate answered prayer."
      />

      <PageNotice>
        <LockKeyhole size={15} aria-hidden="true" /> Private requests are visible only to you and fellowship leaders.
      </PageNotice>

      <Card tone="accent">
        <CardHeading
          title="Submit prayer request"
          subtitle="Tell the fellowship how they can pray with you."
          aside={<HandHeart size={21} aria-hidden="true" />}
        />
        <div className="fhf-divider" />
        <form ref={formRef} className="fhf-form-grid fhf-form-grid--two" onSubmit={handleCreate}>
          <Field label="Title" name="prayer-title">
            <input className="fhf-input" id="prayer-title" name="title" minLength={3} required />
          </Field>
          <Field label="Category" name="prayer-category">
            <select className="fhf-select" id="prayer-category" name="category" defaultValue="HEALTH">
              {categories.map((category) => <option key={category} value={category}>{enumLabel(category)}</option>)}
            </select>
          </Field>
          <Field label="Visibility" name="prayer-visibility">
            <select className="fhf-select" id="prayer-visibility" name="visibility" defaultValue="PUBLIC">
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </Field>
          <Field label="Description" name="prayer-description">
            <textarea
              className="fhf-textarea"
              id="prayer-description"
              name="description"
              minLength={5}
              required
            />
          </Field>
          <div className="fhf-form-span">
            <FormStatus error={createPrayer.error} success={createSuccess} />
          </div>
          <Button className="fhf-form-span" type="submit" block disabled={createPrayer.isPending}>
            <HandHeart size={17} aria-hidden="true" />
            {createPrayer.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      </Card>

      {pray.isError ? <FormStatus error={pray.error} /> : null}
      {updateStatus.isError ? <FormStatus error={updateStatus.error} /> : null}

      {prayerQuery.isPending ? (
        <LoadingState label="Loading prayer requests…" />
      ) : prayerQuery.isError ? (
        <ErrorState error={prayerQuery.error} retry={() => void prayerQuery.refetch()} />
      ) : payload && payload.requests.length > 0 ? (
        <section className="fhf-card-grid" aria-label="Prayer requests">
          {payload.requests.map((request) => (
            <PrayerCard
              key={request.id}
              request={request}
              praying={pray.isPending && pray.variables === request.id}
              updating={updateStatus.isPending && updateStatus.variables?.id === request.id}
              onPray={() => pray.mutate(request.id)}
              onStatus={(status) => updateStatus.mutate({ id: request.id, status })}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<HandHeart aria-hidden="true" />}
          title="No prayer requests yet"
          description="When someone shares a request, you’ll be able to pray with them here."
        />
      )}
    </FeaturePage>
  );
}

function PrayerCard({
  request,
  praying,
  updating,
  onPray,
  onStatus
}: {
  request: PrayerRequest;
  praying: boolean;
  updating: boolean;
  onPray: () => void;
  onStatus: (status: PrayerStatus) => void;
}) {
  return (
    <Card tone={request.status === "ANSWERED" ? "accent" : undefined}>
      <div className="fhf-badges">
        <Badge>{enumLabel(request.category)}</Badge>
        <Badge tone={request.visibility === "PRIVATE" ? "muted" : "primary"}>
          {request.visibility === "PRIVATE" ? <LockKeyhole size={11} aria-hidden="true" /> : null}
          {enumLabel(request.visibility)}
        </Badge>
        <Badge tone={request.status === "ANSWERED" ? "success" : request.status === "ARCHIVED" ? "muted" : "warning"}>
          {enumLabel(request.status)}
        </Badge>
      </div>
      <CardHeading title={request.title} />
      <p className="fhf-card-body">{request.description}</p>
      <p className="fhf-meta">
        <span>{request.createdBy.name}</span>
        <span aria-hidden="true">•</span>
        <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>
      </p>

      <div className="fhf-divider" />
      {request.visibility === "PUBLIC" ? (
        <Button
          block
          variant={request.prayed ? "secondary" : "primary"}
          disabled={praying || request.prayed}
          onClick={onPray}
        >
          {request.prayed ? <Check size={17} aria-hidden="true" /> : <HandHeart size={17} aria-hidden="true" />}
          {praying ? "Saving…" : request.prayed ? `Prayed • ${request.interactionCount}` : `I prayed • ${request.interactionCount}`}
        </Button>
      ) : null}

      {request.canUpdate ? (
        <form
          className="fhf-toolbar"
          style={{ marginTop: request.visibility === "PUBLIC" ? "0.65rem" : 0 }}
          onSubmit={(event) => {
            event.preventDefault();
            const status = new FormData(event.currentTarget).get("status") as PrayerStatus;
            onStatus(status);
          }}
        >
          <select
            className="fhf-select"
            name="status"
            defaultValue={request.status}
            aria-label={`Status for ${request.title}`}
          >
            {statuses.map((status) => <option key={status} value={status}>{enumLabel(status)}</option>)}
          </select>
          <Button type="submit" variant="secondary" disabled={updating}>
            {updating ? "Updating…" : "Update"}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}

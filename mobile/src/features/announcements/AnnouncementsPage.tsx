import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Pin } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { api, queryKeys } from "../../lib/api";
import { enumLabel, formatDateTime } from "../../lib/format";
import type { AnnouncementPriority, AnnouncementsPayload } from "../_shared/models";
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

const priorities: AnnouncementPriority[] = ["NORMAL", "IMPORTANT", "URGENT"];

export function AnnouncementsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const announcementsQuery = useQuery({
    queryKey: queryKeys.announcements,
    queryFn: api.announcements
  });
  const createAnnouncement = useMutation({
    mutationFn: api.createAnnouncement,
    onSuccess: async () => {
      formRef.current?.reset();
      setSuccess("Announcement published.");
      await queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    createAnnouncement.mutate({
      title: String(data.get("title") ?? "").trim(),
      body: String(data.get("body") ?? "").trim(),
      priority: data.get("priority") as AnnouncementPriority,
      pinned: data.get("pinned") === "on"
    });
  }

  const payload = announcementsQuery.data as AnnouncementsPayload | undefined;

  return (
    <FeaturePage>
      <FeatureHeader
        eyebrow="Announcements"
        title="Fellowship Updates"
        description="Important news and reminders from your fellowship leaders."
      />

      {user?.role === "ADMIN" ? (
        <AdminComposer
          title="Create announcement"
          description="Pinned announcements are shown first on member dashboards."
        >
          <form ref={formRef} className="fhf-form-grid fhf-form-grid--two" onSubmit={handleSubmit}>
            <Field label="Title" name="announcement-title">
              <input
                className="fhf-input"
                id="announcement-title"
                name="title"
                minLength={3}
                autoComplete="off"
                required
              />
            </Field>
            <Field label="Priority" name="announcement-priority">
              <select className="fhf-select" id="announcement-priority" name="priority" defaultValue="NORMAL">
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>{enumLabel(priority)}</option>
                ))}
              </select>
            </Field>
            <Field label="Message" name="announcement-body">
              <textarea
                className="fhf-textarea"
                id="announcement-body"
                name="body"
                minLength={5}
                required
              />
            </Field>
            <label className="fhf-check">
              <input type="checkbox" name="pinned" />
              Pin this announcement
            </label>
            <div className="fhf-form-span">
              <FormStatus error={createAnnouncement.error} success={success} />
            </div>
            <Button className="fhf-form-span" type="submit" block disabled={createAnnouncement.isPending}>
              <Megaphone size={17} aria-hidden="true" />
              {createAnnouncement.isPending ? "Publishing…" : "Publish announcement"}
            </Button>
          </form>
        </AdminComposer>
      ) : null}

      {announcementsQuery.isPending ? (
        <LoadingState label="Loading announcements…" />
      ) : announcementsQuery.isError ? (
        <ErrorState error={announcementsQuery.error} retry={() => void announcementsQuery.refetch()} />
      ) : payload && payload.announcements.length > 0 ? (
        <section className="fhf-card-grid" aria-label="Announcements">
          {payload.announcements.map((announcement) => (
            <Card key={announcement.id} tone={announcement.pinned ? "accent" : undefined}>
              <div className="fhf-badges">
                {announcement.pinned ? (
                  <Badge tone="primary"><Pin size={11} aria-hidden="true" /> Pinned</Badge>
                ) : null}
                <Badge tone={priorityTone(announcement.priority)}>{enumLabel(announcement.priority)}</Badge>
              </div>
              <CardHeading title={announcement.title} />
              <p className="fhf-card-body">{announcement.body}</p>
              <p className="fhf-meta">
                <span>{announcement.createdBy.name}</span>
                <span aria-hidden="true">•</span>
                <time dateTime={announcement.createdAt}>{formatDateTime(announcement.createdAt)}</time>
              </p>
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<Megaphone aria-hidden="true" />}
          title="No announcements yet"
          description="Updates from fellowship leaders will appear here."
        />
      )}
    </FeaturePage>
  );
}

function priorityTone(priority: AnnouncementPriority): "neutral" | "warning" | "danger" {
  if (priority === "URGENT") return "danger";
  if (priority === "IMPORTANT") return "warning";
  return "neutral";
}


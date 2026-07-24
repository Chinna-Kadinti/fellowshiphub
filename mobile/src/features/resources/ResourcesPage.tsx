import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api, queryKeys } from "../../lib/api";
import { enumLabel } from "../../lib/format";
import { openExternal } from "../../lib/native";
import type { ResourceType, ResourcesPayload } from "../_shared/models";
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

const resourceTypes: ResourceType[] = ["PDF", "VIDEO", "AUDIO", "NOTES", "LINK", "PRESENTATION"];

export function ResourcesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q")?.trim() ?? "";
  const [searchInput, setSearchInput] = useState(search);
  const [success, setSuccess] = useState<string | null>(null);
  const resourcesQuery = useQuery({
    queryKey: queryKeys.resources(search),
    queryFn: () => api.resources(search)
  });
  const createResource = useMutation({
    mutationFn: api.createResource,
    onSuccess: async () => {
      formRef.current?.reset();
      setSuccess("Resource saved.");
      await queryClient.invalidateQueries({ queryKey: ["resources"] });
    }
  });

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    setSearchParams(nextSearch ? { q: nextSearch } : {});
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    const url = String(data.get("url") ?? "").trim();
    const meetingId = String(data.get("meetingId") ?? "").trim();
    createResource.mutate({
      title: String(data.get("title") ?? "").trim(),
      bibleTopic: String(data.get("bibleTopic") ?? "").trim(),
      type: data.get("type") as ResourceType,
      meetingId: meetingId || undefined,
      url: url || undefined,
      description: String(data.get("description") ?? "").trim()
    });
  }

  const payload = resourcesQuery.data as ResourcesPayload | undefined;

  return (
    <FeaturePage>
      <FeatureHeader
        eyebrow="Study Resources"
        title="Materials Library"
        description="Find notes, media, and study materials by topic or meeting."
      />

      <form className="fhf-toolbar" role="search" onSubmit={handleSearch}>
        <input
          className="fhf-input"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search title, topic, or description"
          aria-label="Search resources"
        />
        <Button type="submit" variant="secondary" aria-label="Search resources">
          <Search size={18} aria-hidden="true" />
          <span className="fhf-search-label">Search</span>
        </Button>
      </form>

      {search ? (
        <div className="fhf-actions">
          <Badge tone="primary">Results for “{search}”</Badge>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchInput("");
              setSearchParams({});
            }}
          >
            Clear
          </Button>
        </div>
      ) : null}

      {user?.role === "ADMIN" ? (
        <AdminComposer
          title="Add resource"
          description="Store file metadata or link to an external resource."
        >
          <form ref={formRef} className="fhf-form-grid fhf-form-grid--two" onSubmit={handleCreate}>
            <Field label="Title" name="resource-title">
              <input className="fhf-input" id="resource-title" name="title" minLength={3} required />
            </Field>
            <Field label="Bible book or topic" name="resource-topic">
              <input className="fhf-input" id="resource-topic" name="bibleTopic" minLength={2} required />
            </Field>
            <Field label="Type" name="resource-type">
              <select className="fhf-select" id="resource-type" name="type" defaultValue="PDF">
                {resourceTypes.map((type) => <option key={type} value={type}>{enumLabel(type)}</option>)}
              </select>
            </Field>
            <Field label="Meeting" name="resource-meeting">
              <select className="fhf-select" id="resource-meeting" name="meetingId" defaultValue="">
                <option value="">None</option>
                {(payload?.meetings ?? []).map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
                ))}
              </select>
            </Field>
            <Field label="URL (optional)" name="resource-url">
              <input
                className="fhf-input"
                id="resource-url"
                name="url"
                type="url"
                inputMode="url"
                placeholder="https://"
              />
            </Field>
            <Field label="Description" name="resource-description">
              <textarea
                className="fhf-textarea"
                id="resource-description"
                name="description"
                minLength={5}
                required
              />
            </Field>
            <div className="fhf-form-span">
              <FormStatus error={createResource.error} success={success} />
            </div>
            <Button className="fhf-form-span" type="submit" block disabled={createResource.isPending}>
              <FileText size={17} aria-hidden="true" />
              {createResource.isPending ? "Saving…" : "Save resource"}
            </Button>
          </form>
        </AdminComposer>
      ) : null}

      {resourcesQuery.isPending ? (
        <LoadingState label="Loading resources…" />
      ) : resourcesQuery.isError ? (
        <ErrorState error={resourcesQuery.error} retry={() => void resourcesQuery.refetch()} />
      ) : payload && payload.resources.length > 0 ? (
        <section className="fhf-card-grid fhf-card-grid--three" aria-label="Study resources">
          {payload.resources.map((resource) => (
            <Card key={resource.id}>
              <div className="fhf-badges">
                <Badge>{enumLabel(resource.type)}</Badge>
                <Badge tone="primary">{resource.bibleTopic}</Badge>
              </div>
              <CardHeading
                title={resource.title}
                subtitle={resource.meeting ? `Meeting: ${resource.meeting.title}` : undefined}
              />
              <p className="fhf-card-body">{resource.description}</p>
              {resource.url ? (
                <>
                  <div className="fhf-divider" />
                  <Button block variant="secondary" onClick={() => void openExternal(resource.url!)}>
                    <ExternalLink size={17} aria-hidden="true" />
                    Open resource
                  </Button>
                </>
              ) : null}
            </Card>
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<FileText aria-hidden="true" />}
          title={search ? "No matching resources" : "No resources yet"}
          description={search ? "Try a different title, topic, or keyword." : "Study materials will appear here when leaders add them."}
        />
      )}
    </FeaturePage>
  );
}

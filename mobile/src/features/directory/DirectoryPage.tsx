import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, Mail, MapPin, Phone, Save, Users } from "lucide-react";
import { api, queryKeys } from "../../lib/api";
import { enumLabel, formatDate } from "../../lib/format";
import type { DirectoryMember, DirectoryPayload } from "../_shared/models";
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
  LoadingState
} from "../_shared/FeatureUI";

export function DirectoryPage() {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const directoryQuery = useQuery({
    queryKey: queryKeys.directory,
    queryFn: api.directory
  });
  const updateProfile = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: async () => {
      setSuccess("Profile updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.directory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.reports })
      ]);
    }
  });
  const payload = directoryQuery.data as DirectoryPayload | undefined;

  function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    const data = new FormData(event.currentTarget);
    updateProfile.mutate({
      name: String(data.get("name") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      area: String(data.get("area") ?? "").trim(),
      phoneVisible: data.get("phoneVisible") === "on"
    });
  }

  return (
    <FeaturePage>
      <FeatureHeader
        eyebrow="Member Directory"
        title="Fellowship Members"
        description="Keep your details current and connect with people in your fellowship."
      />

      {directoryQuery.isPending ? (
        <LoadingState label="Loading member directory…" />
      ) : directoryQuery.isError ? (
        <ErrorState error={directoryQuery.error} retry={() => void directoryQuery.refetch()} />
      ) : payload ? (
        <>
          <Card tone="accent">
            <CardHeading
              title="Your profile"
              subtitle="Update your contact details and directory privacy."
            />
            <div className="fhf-divider" />
            <form ref={formRef} className="fhf-form-grid fhf-form-grid--two" onSubmit={handleProfile}>
              <Field label="Name" name="profile-name">
                <input
                  className="fhf-input"
                  id="profile-name"
                  name="name"
                  defaultValue={payload.profile.name}
                  minLength={2}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field label="Phone" name="profile-phone">
                <input
                  className="fhf-input"
                  id="profile-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={payload.profile.phone ?? ""}
                />
              </Field>
              <Field label="Area" name="profile-area">
                <input
                  className="fhf-input"
                  id="profile-area"
                  name="area"
                  autoComplete="address-level2"
                  defaultValue={payload.profile.area ?? ""}
                />
              </Field>
              <label className="fhf-check">
                <input
                  name="phoneVisible"
                  type="checkbox"
                  defaultChecked={Boolean(payload.profile.phoneVisible)}
                />
                Show my phone number to members
              </label>
              <div className="fhf-form-span">
                <FormStatus error={updateProfile.error} success={success} />
              </div>
              <Button className="fhf-form-span" type="submit" block disabled={updateProfile.isPending}>
                <Save size={17} aria-hidden="true" />
                {updateProfile.isPending ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </Card>

          {payload.members.length > 0 ? (
            <section className="fhf-card-grid fhf-card-grid--three" aria-label="Fellowship members">
              {payload.members.map((member) => <MemberCard key={member.id} member={member} />)}
            </section>
          ) : (
            <EmptyState
              icon={<Users aria-hidden="true" />}
              title="No members yet"
              description="Members will appear here when they join the fellowship."
            />
          )}
        </>
      ) : null}
    </FeaturePage>
  );
}

function MemberCard({ member }: { member: DirectoryMember }) {
  const initials = member.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <Card>
      <div className="fhf-person">
        <div className="fhf-avatar" aria-hidden="true">{initials}</div>
        <div>
          <CardHeading title={member.name} />
          <Badge tone={member.role === "ADMIN" ? "primary" : "neutral"}>{enumLabel(member.role)}</Badge>
        </div>
      </div>
      <div className="fhf-contact-list">
        <a href={`mailto:${member.email}`}>
          <Mail size={16} aria-hidden="true" />
          <span>{member.email}</span>
        </a>
        <p>
          <MapPin size={16} aria-hidden="true" />
          <span>{member.area || "Area not provided"}</span>
        </p>
        {member.phone ? (
          <a href={`tel:${member.phone}`}>
            <Phone size={16} aria-hidden="true" />
            <span>{member.phone}</span>
          </a>
        ) : (
          <p>
            {member.phoneHidden ? <LockKeyhole size={16} aria-hidden="true" /> : <Phone size={16} aria-hidden="true" />}
            <span>{member.phoneHidden ? "Phone number hidden" : "Phone not provided"}</span>
          </p>
        )}
      </div>
      <p className="fhf-meta">Joined {formatDate(member.joinedAt)}</p>
    </Card>
  );
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { api, queryKeys } from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import type { DiscussionMessage, DiscussionsPayload } from "../_shared/models";
import {
  Badge,
  Button,
  Card,
  CardHeading,
  EmptyState,
  ErrorState,
  FeatureHeader,
  FeaturePage,
  FormStatus,
  LoadingState
} from "../_shared/FeatureUI";

export function DiscussionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChannelId = searchParams.get("channel") || undefined;
  const [content, setContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const queryKey = [...queryKeys.discussions, selectedChannelId ?? "default"] as const;
  const discussionsQuery = useQuery({
    queryKey,
    queryFn: () => api.discussions(selectedChannelId)
  });
  const postMessage = useMutation({
    mutationFn: ({ channelId, message }: { channelId: string; message: string }) =>
      api.postMessage(channelId, { content: message }),
    onSuccess: async () => {
      setContent("");
      await queryClient.invalidateQueries({ queryKey });
    }
  });
  const deleteMessage = useMutation({
    mutationFn: api.deleteMessage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    }
  });
  const payload = discussionsQuery.data as DiscussionsPayload | undefined;
  const activeChannelId = selectedChannelId ?? payload?.selectedChannel?.id;

  useEffect(() => {
    if (payload?.messages.length) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [payload?.messages.length, activeChannelId]);

  function handlePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = content.trim();
    if (!activeChannelId || !message) return;
    postMessage.mutate({ channelId: activeChannelId, message });
  }

  return (
    <FeaturePage>
      <FeatureHeader
        eyebrow="Community Discussion"
        title="Channels"
        description="Talk through the study, share encouragement, and coordinate fellowship life."
      />

      {discussionsQuery.isPending ? (
        <LoadingState label="Loading conversations…" />
      ) : discussionsQuery.isError ? (
        <ErrorState error={discussionsQuery.error} retry={() => void discussionsQuery.refetch()} />
      ) : payload && payload.channels.length > 0 ? (
        <>
          <nav className="fhf-segmented" aria-label="Discussion channels">
            {payload.channels.map((channel) => {
              const selected = channel.id === activeChannelId;
              const count = channel.messageCount ?? channel._count?.messages ?? 0;
              return (
                <button
                  key={channel.id}
                  type="button"
                  className="fhf-segment"
                  aria-pressed={selected}
                  onClick={() => setSearchParams({ channel: channel.id })}
                >
                  {channel.name} <span aria-label={`${count} messages`}>· {count}</span>
                </button>
              );
            })}
          </nav>

          <Card className="fhf-chat">
            <CardHeading
              title={payload.selectedChannel?.name ?? "Conversation"}
              subtitle={payload.selectedChannel?.description ?? "Fellowship discussion"}
              aside={<MessageSquare size={21} aria-hidden="true" />}
            />
            <div className="fhf-divider" />

            <div className="fhf-message-list" aria-live="polite">
              {payload.messages.length > 0 ? (
                payload.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    mine={message.author.id === user?.id}
                    canDelete={user?.role === "ADMIN" || Boolean(message.canDelete)}
                    deleting={deleteMessage.isPending && deleteMessage.variables === message.id}
                    onDelete={() => {
                      if (window.confirm("Delete this message? This cannot be undone.")) {
                        deleteMessage.mutate(message.id);
                      }
                    }}
                  />
                ))
              ) : (
                <div className="fhf-chat-empty">
                  <MessageSquare aria-hidden="true" />
                  <p>No messages yet. Start the conversation.</p>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <FormStatus error={postMessage.error ?? deleteMessage.error} />
            {activeChannelId ? (
              <form className="fhf-message-form" onSubmit={handlePost}>
                <textarea
                  className="fhf-textarea"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={1000}
                  rows={2}
                  placeholder="Write a message…"
                  aria-label="Message"
                  required
                />
                <Button type="submit" disabled={postMessage.isPending || !content.trim()} aria-label="Post message">
                  <Send size={18} aria-hidden="true" />
                  <span>{postMessage.isPending ? "Posting…" : "Post"}</span>
                </Button>
              </form>
            ) : null}
          </Card>
        </>
      ) : (
        <EmptyState
          icon={<MessageSquare aria-hidden="true" />}
          title="No discussion channels"
          description="Channels will appear here after a leader creates them."
        />
      )}
    </FeaturePage>
  );
}

function MessageBubble({
  message,
  mine,
  canDelete,
  deleting,
  onDelete
}: {
  message: DiscussionMessage & { canDelete?: boolean };
  mine: boolean;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <article className={`fhf-message ${mine ? "fhf-message--mine" : ""}`}>
      <div className="fhf-message-meta">
        <div>
          <strong>{message.author.name}</strong>
          {message.author.role === "ADMIN" ? <Badge tone="primary">Leader</Badge> : null}
        </div>
        {canDelete ? (
          <button
            type="button"
            className="fhf-icon-button"
            aria-label={`Delete message from ${message.author.name}`}
            disabled={deleting}
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <p>{message.content}</p>
      <time dateTime={message.createdAt}>{formatDateTime(message.createdAt)}</time>
    </article>
  );
}

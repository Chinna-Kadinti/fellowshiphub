import Link from "next/link";
import { Trash2 } from "lucide-react";
import { deleteMessageAction, postMessageAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function DiscussionsPage({ searchParams }: { searchParams: { channel?: string } }) {
  const user = await requireUser();
  const channels = await prisma.discussionChannel.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { messages: true } } }
  });
  const selected = channels.find((channel) => channel.id === searchParams.channel) || channels[0];
  const messages = selected
    ? await prisma.discussionMessage.findMany({
        where: { channelId: selected.id },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, role: true } } }
      })
    : [];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Community Discussion</p>
        <h1 className="text-3xl font-semibold">Channels</h1>
      </section>

      <section className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Channels</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/discussions?channel=${channel.id}`}
                className={`rounded-md border p-3 hover:bg-muted ${selected?.id === channel.id ? "bg-muted" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{channel.name}</p>
                  <Badge>{channel._count.messages}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected?.name || "No channel"}</CardTitle>
            <CardDescription>{selected?.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              {messages.map((message) => (
                <div key={message.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{message.author.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(message.createdAt)}</p>
                    </div>
                    {user.role === "ADMIN" && (
                      <form action={deleteMessageAction}>
                        <input type="hidden" name="messageId" value={message.id} />
                        <Button variant="ghost" size="icon" aria-label="Delete message">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{message.content}</p>
                </div>
              ))}
              {messages.length === 0 && <p className="rounded-md border p-4 text-sm text-muted-foreground">No messages yet.</p>}
            </div>
            {selected && (
              <form action={postMessageAction} className="grid gap-3 border-t pt-4">
                <input type="hidden" name="channelId" value={selected.id} />
                <Textarea name="content" placeholder="Write a message..." required />
                <Button>Post message</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

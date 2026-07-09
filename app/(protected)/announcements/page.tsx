import { Megaphone } from "lucide-react";
import { createAnnouncementAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDateTime } from "@/lib/utils";

export default async function AnnouncementsPage() {
  const user = await requireUser();
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } }
  });

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Announcements</p>
        <h1 className="text-3xl font-semibold">Fellowship Updates</h1>
      </section>

      {user.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Create announcement</CardTitle>
            <CardDescription>Pinned announcements are shown first on member dashboards.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAnnouncementAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input name="title" required />
              </div>
              <div className="grid gap-2">
                <Label>Body</Label>
                <Textarea name="body" required />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <select name="priority" className="h-10 rounded-md border bg-card px-3 text-sm">
                    {["NORMAL", "IMPORTANT", "URGENT"].map((priority) => (
                      <option key={priority} value={priority}>{enumLabel(priority)}</option>
                    ))}
                  </select>
                </div>
                <label className="mt-7 flex items-center gap-2 text-sm">
                  <input type="checkbox" name="pinned" />
                  Pin announcement
                </label>
              </div>
              <Button>Publish announcement</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="pt-5">
              <div className="flex flex-wrap gap-2">
                {announcement.pinned && <Badge className="bg-primary text-primary-foreground">Pinned</Badge>}
                <Badge>{enumLabel(announcement.priority)}</Badge>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{announcement.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{announcement.body}</p>
              <p className="mt-4 text-xs text-muted-foreground">
                {announcement.createdBy.name} • {formatDateTime(announcement.createdAt)}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

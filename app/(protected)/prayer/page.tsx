import { HandHeart } from "lucide-react";
import { createPrayerAction, prayForRequestAction, updatePrayerStatusAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDateTime } from "@/lib/utils";

export default async function PrayerPage() {
  const user = await requireUser();
  const requests = await prisma.prayerRequest.findMany({
    where: user.role === "ADMIN" ? {} : { OR: [{ visibility: "PUBLIC" }, { createdById: user.id }] },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } }, interactions: true }
  });

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Prayer Requests</p>
        <h1 className="text-3xl font-semibold">Pray Together</h1>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HandHeart className="h-5 w-5" /> Submit prayer request</CardTitle>
          <CardDescription>Private requests are visible only to you and leaders.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPrayerAction} className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input name="title" required />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <select name="category" className="h-10 rounded-md border bg-card px-3 text-sm">
                {["HEALTH", "FAMILY", "EDUCATION", "JOB", "MINISTRY", "THANKSGIVING", "OTHER"].map((category) => (
                  <option key={category} value={category}>{enumLabel(category)}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Visibility</Label>
              <select name="visibility" className="h-10 rounded-md border bg-card px-3 text-sm">
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label>Description</Label>
              <Textarea name="description" required />
            </div>
            <Button className="lg:col-span-2">Submit request</Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2">
        {requests.map((request) => {
          const prayed = request.interactions.some((interaction) => interaction.userId === user.id);
          const canUpdate = user.role === "ADMIN" || request.createdById === user.id;
          return (
            <Card key={request.id}>
              <CardContent className="grid gap-3 pt-5">
                <div className="flex flex-wrap gap-2">
                  <Badge>{enumLabel(request.category)}</Badge>
                  <Badge className="bg-secondary text-secondary-foreground">{enumLabel(request.visibility)}</Badge>
                  <Badge>{enumLabel(request.status)}</Badge>
                </div>
                <h2 className="text-lg font-semibold">{request.title}</h2>
                <p className="text-sm text-muted-foreground">{request.description}</p>
                <p className="text-xs text-muted-foreground">
                  {request.createdBy.name} • {formatDateTime(request.createdAt)}
                </p>
                {request.visibility === "PUBLIC" && (
                  <form action={prayForRequestAction}>
                    <input type="hidden" name="prayerRequestId" value={request.id} />
                    <Button variant={prayed ? "secondary" : "outline"} className="w-full">
                      I prayed • {request.interactions.length}
                    </Button>
                  </form>
                )}
                {canUpdate && (
                  <form action={updatePrayerStatusAction} className="flex gap-2">
                    <input type="hidden" name="prayerRequestId" value={request.id} />
                    <select name="status" defaultValue={request.status} className="h-10 flex-1 rounded-md border bg-card px-3 text-sm">
                      {["ACTIVE", "ANSWERED", "ARCHIVED"].map((status) => (
                        <option key={status} value={status}>{enumLabel(status)}</option>
                      ))}
                    </select>
                    <Button variant="outline">Update</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

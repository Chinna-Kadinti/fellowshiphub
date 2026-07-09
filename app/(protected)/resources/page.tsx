import { ExternalLink, FileText } from "lucide-react";
import { createResourceAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/utils";

export default async function ResourcesPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requireUser();
  const q = searchParams.q?.trim();
  const [resources, meetings] = await Promise.all([
    prisma.studyResource.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { bibleTopic: { contains: q, mode: "insensitive" } }
            ]
          }
        : {},
      orderBy: { createdAt: "desc" },
      include: { meeting: { select: { title: true } }, createdBy: { select: { name: true } } }
    }),
    prisma.meeting.findMany({ orderBy: { date: "desc" }, select: { id: true, title: true } })
  ]);

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Study Resources</p>
        <h1 className="text-3xl font-semibold">Materials Library</h1>
      </section>

      <form className="flex gap-2">
        <Input name="q" placeholder="Search by topic, title, or description" defaultValue={q} />
        <Button variant="outline">Search</Button>
      </form>

      {user.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Add resource</CardTitle>
            <CardDescription>Store file metadata or link to an external resource.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createResourceAction} className="grid gap-4 lg:grid-cols-2">
              <Field label="Title" name="title" />
              <Field label="Bible Book or Topic" name="bibleTopic" />
              <div className="grid gap-2">
                <Label>Type</Label>
                <select name="type" className="h-10 rounded-md border bg-card px-3 text-sm">
                  {["PDF", "VIDEO", "AUDIO", "NOTES", "LINK", "PRESENTATION"].map((type) => (
                    <option key={type} value={type}>{enumLabel(type)}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Meeting</Label>
                <select name="meetingId" className="h-10 rounded-md border bg-card px-3 text-sm">
                  <option value="">None</option>
                  {meetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>{meeting.title}</option>
                  ))}
                </select>
              </div>
              <Field label="URL" name="url" type="url" required={false} />
              <div className="grid gap-2 lg:col-span-2">
                <Label>Description</Label>
                <Textarea name="description" required />
              </div>
              <Button className="lg:col-span-2">Save resource</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id}>
            <CardContent className="grid h-full gap-3 pt-5">
              <div className="flex flex-wrap gap-2">
                <Badge>{enumLabel(resource.type)}</Badge>
                <Badge className="bg-secondary text-secondary-foreground">{resource.bibleTopic}</Badge>
              </div>
              <h2 className="text-lg font-semibold">{resource.title}</h2>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
              {resource.meeting && <p className="text-sm">Meeting: {resource.meeting.title}</p>}
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4" />
                    Open resource
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function Field({ label, name, type = "text", required = true }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input name={name} type={type} required={required} />
    </div>
  );
}

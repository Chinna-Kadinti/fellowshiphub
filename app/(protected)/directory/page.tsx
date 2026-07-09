import { updateProfileAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enumLabel, formatDate } from "@/lib/utils";

export default async function DirectoryPage() {
  const user = await requireUser();
  const members = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      area: true,
      role: true,
      phoneVisible: true,
      joinedAt: true
    }
  });

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm text-muted-foreground">Member Directory</p>
        <h1 className="text-3xl font-semibold">Fellowship Members</h1>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Update your contact details and directory privacy.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileAction} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input name="name" defaultValue={user.name} required />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input name="phone" defaultValue={user.phone || ""} />
            </div>
            <div className="grid gap-2">
              <Label>Area</Label>
              <Input name="area" defaultValue={user.area || ""} />
            </div>
            <label className="mt-7 flex items-center gap-2 text-sm">
              <input name="phoneVisible" type="checkbox" defaultChecked={user.phoneVisible} />
              Show phone number
            </label>
            <Button className="sm:col-span-2">Save profile</Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="grid gap-2 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{member.name}</h2>
                <Badge>{enumLabel(member.role)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{member.email}</p>
              <p className="text-sm">Area: {member.area || "Not provided"}</p>
              <p className="text-sm">
                Phone: {member.phoneVisible || user.role === "ADMIN" || member.id === user.id ? member.phone || "Not provided" : "Hidden"}
              </p>
              <p className="text-xs text-muted-foreground">Joined {formatDate(member.joinedAt)}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

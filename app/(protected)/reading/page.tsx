import { BookMarked } from "lucide-react";
import { completeReadingAction, createReadingAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, percent } from "@/lib/utils";

export default async function ReadingPage() {
  const user = await requireUser();
  const plans = await prisma.bibleReadingPlan.findMany({
    orderBy: { date: "asc" },
    include: { completions: true }
  });
  const completed = plans.filter((plan) => plan.completions.some((completion) => completion.userId === user.id));
  const progress = percent(completed.length, plans.length);

  return (
    <div className="grid gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Bible Reading Plan</p>
          <h1 className="text-3xl font-semibold">Daily Scripture</h1>
        </div>
        <div className="rounded-md border bg-card px-4 py-3">
          <p className="text-2xl font-semibold">{progress}%</p>
          <p className="text-sm text-muted-foreground">completed</p>
        </div>
      </section>

      {user.role === "ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookMarked className="h-5 w-5" /> Add reading entry</CardTitle>
            <CardDescription>Create entries for the shared reading plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createReadingAction} className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input name="date" type="date" required />
              </div>
              <div className="grid gap-2">
                <Label>Passage</Label>
                <Input name="passage" required />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea name="description" required />
              </div>
              <Button className="sm:col-span-2">Add entry</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const isDone = plan.completions.some((completion) => completion.userId === user.id);
          return (
            <Card key={plan.id}>
              <CardContent className="grid gap-3 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <Badge>{formatDate(plan.date)}</Badge>
                  {isDone && <Badge className="bg-primary text-primary-foreground">Completed</Badge>}
                </div>
                <h2 className="text-lg font-semibold">{plan.passage}</h2>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
                {!isDone && (
                  <form action={completeReadingAction}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <Button className="w-full">Mark completed</Button>
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

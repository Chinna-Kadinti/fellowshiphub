import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

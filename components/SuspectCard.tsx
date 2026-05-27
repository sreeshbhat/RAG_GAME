import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function SuspectCard({
  suspect,
}: {
  suspect: { name: string; role: string; description: string };
}) {
  return (
    <Card className="rounded-2xl p-4">
      <CardTitle className="text-lg">{suspect.name}</CardTitle>
      <p className="mt-1 text-sm text-amber-300">{suspect.role}</p>
      <CardDescription className="mt-2 leading-6">{suspect.description}</CardDescription>
    </Card>
  );
}

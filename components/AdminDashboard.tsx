import Link from "next/link";

import { AdminProgressTable } from "@/components/AdminProgressTable";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export function AdminDashboard({
  students,
  activeCases,
  scoreboard,
  hallucinationReports,
  chatLogs,
}: {
  students: Array<{ name: string; rollNumber: string; classSection?: string }>;
  activeCases: Array<{ title: string; slug: string }>;
  scoreboard: Array<any>;
  hallucinationReports: Array<any>;
  chatLogs: Array<any>;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Registered Students</CardTitle>
          <div className="mt-4 space-y-2 text-sm text-muted">
            {students.map((student) => (
              <p key={`${student.rollNumber}-${student.name}`}>
                {student.name} • {student.rollNumber}{student.classSection ? ` • ${student.classSection}` : ""}
              </p>
            ))}
          </div>
        </Card>
        <Card>
          <CardTitle>Active Cases</CardTitle>
          <div className="mt-4 space-y-2 text-sm text-muted">
            {activeCases.map((item) => (
              <p key={item.slug}>{item.title}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/api/admin/export?type=scoreboard">Export Scoreboard CSV</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/api/admin/export?type=hallucinations">Export Hallucinations CSV</Link>
            </Button>
          </div>
        </Card>
      </div>
      <ScoreboardTable rows={scoreboard} />
      <AdminProgressTable title="Hallucination Reports" rows={hallucinationReports} />
      <AdminProgressTable title="Chat Logs" rows={chatLogs} />
    </div>
  );
}

import { formatDate } from "@/lib/utils";

import { Card, CardTitle } from "@/components/ui/card";

export function ScoreboardTable({
  rows,
}: {
  rows: Array<{
    rank: number;
    studentName: string;
    rollNumber: string;
    caseTitle: string;
    score: number;
    questionsAsked: number;
    criticalCluesFound: number;
    finalResult: string;
    solvedTime: string | Date | null;
  }>;
}) {
  return (
    <Card>
      <CardTitle>Classroom Scoreboard</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="pb-3">Rank</th>
              <th className="pb-3">Student</th>
              <th className="pb-3">Roll</th>
              <th className="pb-3">Case</th>
              <th className="pb-3">Score</th>
              <th className="pb-3">Questions</th>
              <th className="pb-3">Clues</th>
              <th className="pb-3">Result</th>
              <th className="pb-3">Solved Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-white/5" key={`${row.studentName}-${row.caseTitle}-${row.rank}`}>
                <td className="py-3">{row.rank}</td>
                <td className="py-3">{row.studentName}</td>
                <td className="py-3">{row.rollNumber}</td>
                <td className="py-3">{row.caseTitle}</td>
                <td className="py-3">{row.score}</td>
                <td className="py-3">{row.questionsAsked}</td>
                <td className="py-3">{row.criticalCluesFound}</td>
                <td className="py-3 capitalize">{row.finalResult.replaceAll("_", " ")}</td>
                <td className="py-3">{formatDate(row.solvedTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

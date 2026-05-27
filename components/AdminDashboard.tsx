"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AdminProgressTable } from "@/components/AdminProgressTable";
import { ScoreboardTable } from "@/components/ScoreboardTable";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ScoreboardRow = {
  rank: number;
  studentName: string;
  rollNumber: string;
  caseTitle: string;
  score: number;
  questionsAsked: number;
  criticalCluesFound: number;
  hintsUsed?: number;
  timelineAccuracy?: number;
  contradictionsFound?: number;
  avgPressure?: number;
  finalResult: string;
  solvedTime: string | Date | null;
};

type HallucinationRow = {
  id: string;
  studentName: string;
  caseTitle: string;
  reason: string;
  status: string;
  createdAt: string | Date;
};

function getLevelLabel(caseTitle: string) {
  const match = caseTitle.match(/^Level\s+(\d+)/i);
  return match ? `Level ${match[1]}` : "Other";
}

export function AdminDashboard({
  students,
  activeCases,
  scoreboard,
  hallucinationReports,
}: {
  students: Array<{ name: string; rollNumber: string; classSection?: string }>;
  activeCases: Array<{ title: string; slug: string }>;
  scoreboard: ScoreboardRow[];
  hallucinationReports: HallucinationRow[];
}) {
  const [studentFilter, setStudentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [caseFilter, setCaseFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [reportStudentFilter, setReportStudentFilter] = useState("");
  const [reportCaseFilter, setReportCaseFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [resetPending, setResetPending] = useState(false);

  const filteredScoreboard = useMemo(() => {
    const filtered = scoreboard.filter((row) => {
      const query = studentFilter.toLowerCase();
      const matchesStudent =
        !query ||
        row.studentName.toLowerCase().includes(query) ||
        row.rollNumber.toLowerCase().includes(query);
      const matchesLevel =
        levelFilter === "all" || getLevelLabel(row.caseTitle) === levelFilter;
      const matchesCase = caseFilter === "all" || row.caseTitle === caseFilter;
      const matchesResult = resultFilter === "all" || row.finalResult === resultFilter;
      return matchesStudent && matchesLevel && matchesCase && matchesResult;
    });

    return [...filtered]
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        const leftTime = left.solvedTime ? new Date(left.solvedTime).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.solvedTime ? new Date(right.solvedTime).getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));
  }, [scoreboard, studentFilter, levelFilter, caseFilter, resultFilter]);

  const filteredReports = useMemo(() => {
    return hallucinationReports.filter((row) => {
      const query = reportStudentFilter.toLowerCase();
      const matchesStudent = !query || row.studentName.toLowerCase().includes(query);
      const matchesCase = reportCaseFilter === "all" || row.caseTitle === reportCaseFilter;
      const matchesStatus = reportStatusFilter === "all" || row.status === reportStatusFilter;
      return matchesStudent && matchesCase && matchesStatus;
    });
  }, [hallucinationReports, reportStudentFilter, reportCaseFilter, reportStatusFilter]);

  async function handleResetAll() {
    const confirmed = window.confirm(
      "This will clear all student scores, progress, accusations, reports, and chat history. Continue?",
    );
    if (!confirmed) return;

    setResetPending(true);
    const response = await fetch("/api/admin/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "all" }),
    });
    setResetPending(false);

    if (!response.ok) {
      window.alert("Failed to clear previous scores.");
      return;
    }

    window.location.reload();
  }

  const scoreboardCases = Array.from(new Set(scoreboard.map((row) => row.caseTitle)));
  const scoreboardLevels = Array.from(
    new Set(scoreboard.map((row) => getLevelLabel(row.caseTitle))),
  ).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const reportCases = Array.from(new Set(hallucinationReports.map((row) => row.caseTitle)));
  const topPlayer = filteredScoreboard[0] ?? null;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Registered Students</CardTitle>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto text-sm text-muted">
            {students.map((student) => (
              <p key={`${student.rollNumber}-${student.name}`}>
                {student.name} | {student.rollNumber}
                {student.classSection ? ` | ${student.classSection}` : ""}
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
            <Button asChild variant="outline">
              <Link href="/admin/chat-logs">Open Chat Logs</Link>
            </Button>
            <Button disabled={resetPending} onClick={handleResetAll} variant="danger">
              {resetPending ? "Clearing..." : "Clear Previous Scores"}
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Scoreboard Filters</CardTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Filter by student or roll number"
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
          />
          <select
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="all">All levels</option>
            {scoreboardLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={caseFilter}
            onChange={(event) => setCaseFilter(event.target.value)}
          >
            <option value="all">All cases</option>
            {scoreboardCases.map((caseTitle) => (
              <option key={caseTitle} value={caseTitle}>
                {caseTitle}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={resultFilter}
            onChange={(event) => setResultFilter(event.target.value)}
          >
            <option value="all">All results</option>
            <option value="solved">Solved</option>
            <option value="failed">Failed</option>
            <option value="in_progress">In Progress</option>
            <option value="not_started">Not Started</option>
          </select>
        </div>
      </Card>

      <Card>
        <CardTitle>
          {levelFilter === "all" ? "Current Top Player" : `${levelFilter} Top Player`}
        </CardTitle>
        <div className="mt-4 text-sm text-muted">
          {topPlayer ? (
            <p>
              {topPlayer.studentName} | {topPlayer.rollNumber} | {topPlayer.caseTitle} | Score {topPlayer.score}
            </p>
          ) : (
            <p>No leaderboard rows match the current filters.</p>
          )}
        </div>
      </Card>

      <ScoreboardTable rows={filteredScoreboard} />

      <Card>
        <CardTitle>Hallucination Report Filters</CardTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input
            placeholder="Filter by student"
            value={reportStudentFilter}
            onChange={(event) => setReportStudentFilter(event.target.value)}
          />
          <select
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={reportCaseFilter}
            onChange={(event) => setReportCaseFilter(event.target.value)}
          >
            <option value="all">All cases</option>
            {reportCases.map((caseTitle) => (
              <option key={caseTitle} value={caseTitle}>
                {caseTitle}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={reportStatusFilter}
            onChange={(event) => setReportStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
      </Card>

      <AdminProgressTable title="Hallucination Reports" rows={filteredReports} />
    </div>
  );
}

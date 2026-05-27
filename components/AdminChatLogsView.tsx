"use client";

import { useMemo, useState } from "react";

import { AdminProgressTable } from "@/components/AdminProgressTable";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminChatLogsView({
  chatLogs,
}: {
  chatLogs: Array<{
    id: string;
    studentName: string;
    caseTitle: string;
    role: string;
    content: string;
    createdAt: string | Date;
  }>;
}) {
  const [studentFilter, setStudentFilter] = useState("");
  const [caseFilter, setCaseFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    return chatLogs.filter((row) => {
      const matchesStudent =
        !studentFilter || row.studentName.toLowerCase().includes(studentFilter.toLowerCase());
      const matchesCase = caseFilter === "all" || row.caseTitle === caseFilter;
      const matchesRole = roleFilter === "all" || row.role === roleFilter;
      return matchesStudent && matchesCase && matchesRole;
    });
  }, [chatLogs, studentFilter, caseFilter, roleFilter]);

  return (
    <div className="space-y-8">
      <Card>
        <CardTitle>Chat Log Filters</CardTitle>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input
            placeholder="Filter by student"
            value={studentFilter}
            onChange={(event) => setStudentFilter(event.target.value)}
          />
          <select
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={caseFilter}
            onChange={(event) => setCaseFilter(event.target.value)}
          >
            <option value="all">All cases</option>
            {Array.from(new Set(chatLogs.map((row) => row.caseTitle))).map((caseTitle) => (
              <option key={caseTitle} value={caseTitle}>
                {caseTitle}
              </option>
            ))}
          </select>
          <select
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-foreground"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="all">All roles</option>
            <option value="user">Student</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>
      </Card>
      <AdminProgressTable title="Chat Logs" rows={filteredLogs} />
    </div>
  );
}

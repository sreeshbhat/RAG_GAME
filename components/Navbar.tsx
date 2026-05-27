"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldAlert, Award, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  studentName?: string;
  rollNumber?: string;
  isAdmin?: boolean;
}

export function Navbar({ studentName, rollNumber, isAdmin }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const endpoint = isAdmin ? "/api/admin/logout" : "/api/auth/logout";
    const response = await fetch(endpoint, {
      method: "POST",
    });
    if (response.ok) {
      router.push(isAdmin ? "/admin" : "/login");
      router.refresh();
    }
  }

  return (
    <header className="border-b border-white/5 bg-slate-950/20 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href={isAdmin ? "/admin" : "/cases"} className="flex items-center gap-2 font-serif text-lg tracking-wide text-amber-300 hover:opacity-90 transition-opacity">
            <ShieldAlert className="h-5 w-5 text-amber-300" />
            <span>RAG Detective</span>
          </Link>

          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-4 text-sm text-slate-300">
              <Link href="/cases" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <FileText className="h-4 w-4" />
                <span>Cases</span>
              </Link>
              <Link href="/scoreboard" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Award className="h-4 w-4" />
                <span>Scoreboard</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {studentName && (
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-200">{studentName}</p>
              {rollNumber && <p className="text-xs text-muted">{rollNumber}</p>}
            </div>
          )}

          {isAdmin && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 border border-amber-500/20">
              Admin Portal
            </span>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout} 
            className="flex items-center gap-2 hover:bg-white/5 text-slate-300 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

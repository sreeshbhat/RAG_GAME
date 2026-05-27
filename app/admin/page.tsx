import { AdminDashboard } from "@/components/AdminDashboard";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { Navbar } from "@/components/Navbar";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAllCaseFiles } from "@/lib/case-loader";
import { getAdminProgress } from "@/lib/game-service";
import { getRegisteredStudents } from "@/lib/student-registry";

export default async function AdminPage() {
  const isLoggedIn = await hasAdminSession();
  if (!isLoggedIn) {
    return (
      <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
        <AdminLoginForm />
      </main>
    );
  }

  const [students, cases, progress] = await Promise.all([
    getRegisteredStudents(),
    getAllCaseFiles(),
    getAdminProgress(),
  ]);

  return (
    <>
      <Navbar isAdmin={true} />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <AdminDashboard
          students={students}
          activeCases={cases.map((item) => ({ title: item.title, slug: item.slug }))}
          scoreboard={progress.scoreboard}
          hallucinationReports={progress.hallucinationReports}
          chatLogs={progress.chatLogs}
        />
      </main>
    </>
  );
}


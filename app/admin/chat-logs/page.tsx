import { AdminChatLogsView } from "@/components/AdminChatLogsView";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { Navbar } from "@/components/Navbar";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAdminProgress } from "@/lib/game-service";

export default async function AdminChatLogsPage() {
  const isLoggedIn = await hasAdminSession();
  if (!isLoggedIn) {
    return (
      <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
        <AdminLoginForm />
      </main>
    );
  }

  const progress = await getAdminProgress();

  return (
    <>
      <Navbar isAdmin={true} />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <AdminChatLogsView chatLogs={progress.chatLogs} />
      </main>
    </>
  );
}

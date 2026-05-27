import { redirect } from "next/navigation";

import { LoginForm } from "@/components/LoginForm";
import { getStudentSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getStudentSession();
  if (session) redirect("/cases");

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
      <LoginForm />
    </main>
  );
}

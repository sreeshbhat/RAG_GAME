import { promises as fs } from "fs";
import path from "path";

import { normalizeText } from "@/lib/utils";

export type RegisteredStudent = {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
};

const studentsPath = path.join(process.cwd(), "data", "students.json");

export async function getRegisteredStudents(): Promise<RegisteredStudent[]> {
  const file = await fs.readFile(studentsPath, "utf8");
  return JSON.parse(file) as RegisteredStudent[];
}

export async function findRegisteredStudent(name: string, email: string) {
  const students = await getRegisteredStudents();
  const normalizedName = normalizeText(name);
  const normalizedEmail = normalizeText(email);

  return (
    students.find(
      (student) =>
        normalizeText(student.name) === normalizedName &&
        normalizeText(student.email) === normalizedEmail,
    ) ?? null
  );
}

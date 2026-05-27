import { promises as fs } from "fs";
import path from "path";

import { normalizeText } from "@/lib/utils";

export type RegisteredStudent = {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  classSection?: string;
};

const studentsPath = path.join(process.cwd(), "data", "students.json");

export async function getRegisteredStudents(): Promise<RegisteredStudent[]> {
  const file = await fs.readFile(studentsPath, "utf8");
  const parsed = JSON.parse(file) as Array<Record<string, string>>;
  return parsed.map((student, index) => ({
    id:
      student.id ??
      student.registered_student_id ??
      student.rollNumber ??
      student.roll_number ??
      `student_${index + 1}`,
    name: student.name ?? "",
    email: student.email ?? "",
    rollNumber: student.rollNumber ?? student.roll_number ?? "",
    classSection: student.classSection ?? student.class_section ?? "",
  }));
}

export async function findRegisteredStudent(name: string, rollNumber: string) {
  const students = await getRegisteredStudents();
  const normalizedInputName = normalizeText(name);
  const normalizedInputRoll = normalizeText(rollNumber);

  // 1. Direct normalized match
  const directMatch = students.find(
    (student) =>
      normalizeText(student.name) === normalizedInputName &&
      normalizeText(student.rollNumber) === normalizedInputRoll,
  );
  if (directMatch) return directMatch;

  // 2. Fuzzy match (ignoring spaces, punctuation, dots, etc.)
  const clean = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanInputName = clean(name);
  const cleanInputRoll = clean(rollNumber);

  return (
    students.find(
      (student) =>
        clean(student.name) === cleanInputName &&
        clean(student.rollNumber) === cleanInputRoll,
    ) ?? null
  );
}


import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const progressStatusEnum = pgEnum("progress_status", [
  "not_started",
  "in_progress",
  "solved",
  "failed",
]);

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);
export const hallucinationStatusEnum = pgEnum("hallucination_status", [
  "pending",
  "valid",
  "invalid",
]);

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  registeredStudentId: varchar("registered_student_id", { length: 64 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  rollNumber: varchar("roll_number", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  briefing: text("briefing").notNull(),
  difficulty: varchar("difficulty", { length: 16 }).notNull(),
  estimatedTime: varchar("estimated_time", { length: 64 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  correctCulprit: varchar("correct_culprit", { length: 120 }).notNull(),
  solutionExplanation: text("solution_explanation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const suspects = pgTable("suspects", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 120 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evidenceDocuments = pgTable("evidence_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  sectionLabel: varchar("section_label", { length: 120 }).notNull(),
  evidenceType: varchar("evidence_type", { length: 64 }).notNull(),
  content: text("content").notNull(),
  isCritical: boolean("is_critical").default(false).notNull(),
  clueKey: varchar("clue_key", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const evidenceChunks = pgTable("evidence_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  evidenceDocumentId: uuid("evidence_document_id").notNull(),
  caseId: uuid("case_id").notNull(),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: jsonb("embedding").$type<number[] | null>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentCaseProgress = pgTable(
  "student_case_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    caseId: uuid("case_id").notNull(),
    status: progressStatusEnum("status").default("not_started").notNull(),
    score: integer("score").default(0).notNull(),
    questionsUsed: integer("questions_used").default(0).notNull(),
    criticalCluesFound: integer("critical_clues_found").default(0).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    uniqueStudentCase: uniqueIndex("student_case_unique").on(table.studentId, table.caseId),
  }),
);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull(),
  caseId: uuid("case_id").notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations").$type<Record<string, unknown>[]>().default([]).notNull(),
  retrievedChunks: jsonb("retrieved_chunks").$type<Record<string, unknown>[]>().default([]).notNull(),
  scoreDelta: integer("score_delta").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studentClues = pgTable(
  "student_clues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    caseId: uuid("case_id").notNull(),
    clueKey: varchar("clue_key", { length: 120 }).notNull(),
    evidenceDocumentId: uuid("evidence_document_id").notNull(),
    discoveredAt: timestamp("discovered_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueStudentClue: uniqueIndex("student_clue_unique").on(
      table.studentId,
      table.caseId,
      table.clueKey,
    ),
  }),
);

export const hallucinationReports = pgTable("hallucination_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull(),
  caseId: uuid("case_id").notNull(),
  messageId: uuid("message_id").notNull(),
  reason: text("reason").notNull(),
  status: hallucinationStatusEnum("status").default("pending").notNull(),
  scoreDelta: integer("score_delta").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const finalAccusations = pgTable(
  "final_accusations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull(),
    caseId: uuid("case_id").notNull(),
    accusedSuspect: varchar("accused_suspect", { length: 120 }).notNull(),
    explanation: text("explanation").notNull(),
    selectedEvidence: jsonb("selected_evidence").$type<string[]>().default([]).notNull(),
    scoreAwarded: integer("score_awarded").default(0).notNull(),
    isCorrect: boolean("is_correct").notNull(),
    feedback: text("feedback").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueStudentAccusation: uniqueIndex("student_case_accusation_unique").on(
      table.studentId,
      table.caseId,
    ),
  }),
);

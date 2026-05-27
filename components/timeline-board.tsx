"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, Calendar, CheckCircle2, GripVertical, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface EventItem {
  id: string;
  timestamp: string;
  description: string;
  unlocked: boolean;
}

interface TimelineBoardProps {
  caseId: string;
  onTimelineScoreAwarded: (scoreDelta: number, accuracy: number) => void;
}

function SortableEventCard({ event }: { event: EventItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
    disabled: !event.unlocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-2xl border p-4 backdrop-blur-md transition-all ${
        event.unlocked
          ? "border-white/10 bg-slate-900/40 hover:border-amber-500/30"
          : "border-white/5 bg-slate-950/20 text-muted opacity-60"
      }`}
    >
      {event.unlocked ? (
        <div {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-slate-300 p-1">
          <GripVertical className="h-4 w-4" />
        </div>
      ) : (
        <div className="p-1 text-slate-600">
          <Lock className="h-4 w-4" />
        </div>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge
            className={event.unlocked ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/10 border border-amber-500/20" : "border border-white/10 text-slate-400"}
          >
            {event.timestamp}
          </Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{event.description}</p>
      </div>
    </div>
  );
}

export function TimelineBoard({ caseId, onTimelineScoreAwarded }: TimelineBoardProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    correctCount: number;
    totalCount: number;
    score: number;
    accuracy: number;
    isCorrect: boolean;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    async function loadEvents() {
      try {
        const response = await fetch(`/api/timeline?caseId=${caseId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to load events.");
        setEvents(data.events ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load timeline.");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [caseId]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setEvents((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFeedback(null);
    setError("");

    try {
      const unlockedIds = events.map((e) => e.id);
      const response = await fetch("/api/timeline/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, eventOrder: unlockedIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Submission failed.");

      setFeedback(data);
      onTimelineScoreAwarded(data.score, data.accuracy);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit timeline.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-center py-10 text-muted">Loading timeline events...</div>;
  }

  const unlockedEvents = events.filter((e) => e.unlocked);
  const lockedCount = events.length - unlockedEvents.length;

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-300" />
            <span>Timeline Reconstruction</span>
          </CardTitle>
          <CardDescription className="mt-1">
            Drag the unlocked evidence events into their correct chronological order.
          </CardDescription>
        </div>
        {lockedCount > 0 && (
          <Badge className="border border-amber-500/20 text-amber-300 bg-amber-500/5">
            {lockedCount} clues still locked
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-3">
        {events.length === 0 ? (
          <p className="text-center py-10 text-muted">No timeline events configured.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {events.map((event) => (
                  <SortableEventCard key={event.id} event={event} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {feedback && (
        <div
          className={`mt-4 p-4 rounded-2xl border text-sm ${
            feedback.isCorrect
              ? "bg-green-500/10 border-green-500/20 text-green-300"
              : "bg-amber-500/10 border-amber-500/20 text-amber-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isCorrect ? (
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-400" />
            )}
            <span className="font-semibold">
              {feedback.isCorrect ? "Perfect Chronology!" : "Chronology Sequence Checked"}
            </span>
          </div>
          <p className="mt-1 text-slate-200">
            Placed {feedback.correctCount} of {feedback.totalCount} events correctly ({feedback.accuracy}% accuracy).
            {feedback.isCorrect && " Unlocked special Timeline Master Clue (+10 pts)!"}
          </p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 border-t border-white/5 pt-4">
        <Button onClick={handleSubmit} disabled={submitting || unlockedEvents.length === 0} className="w-full">
          {submitting ? "Validating Chronology..." : "Submit Reconstruction"}
        </Button>
      </div>
    </Card>
  );
}

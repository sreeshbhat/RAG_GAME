import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EvidenceCard } from "@/components/EvidenceCard";

export function EvidenceAccordion({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    sectionLabel: string;
    evidenceType: string;
    chunkText: string;
    relevanceScore: number;
  }>;
}) {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {items.map((item, index) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{`Retrieved Evidence ${index + 1}: ${item.title}`}</AccordionTrigger>
          <AccordionContent>
            <EvidenceCard
              title={item.title}
              sectionLabel={item.sectionLabel}
              evidenceType={item.evidenceType}
              content={item.chunkText}
              relevanceScore={item.relevanceScore}
              usedInAnswer
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

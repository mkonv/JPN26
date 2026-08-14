import type { Metadata } from "next";
import { notFound } from "next/navigation";
import trip from "@/data/trip.json";
import enrichment from "@/data/travel-enrichment.json";
import { DayView } from "@/app/ui/day-view";

export function generateStaticParams() {
  return trip.days.map((day) => ({ id: day.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const day = trip.days.find((item) => item.id === id);
  return { title: day ? `День ${day.number}: ${day.title}` : "День" };
}

export default async function DayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = trip.days.findIndex((item) => item.id === id);
  if (index < 0) notFound();
  const dayEnrichment = enrichment.dayEnrichment[id as keyof typeof enrichment.dayEnrichment];
  if (!dayEnrichment) notFound();
  return <DayView day={trip.days[index]} previous={trip.days[index - 1] ?? null} next={trip.days[index + 1] ?? null} enriched={dayEnrichment} tabelogNote={enrichment.meta.tabelogNote} />;
}

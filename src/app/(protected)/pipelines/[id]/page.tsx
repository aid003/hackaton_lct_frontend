import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Pipeline ${id}` };
}

export default async function PipelineDetailsPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) return notFound();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Pipeline: {id}</h1>
      <p className="text-muted-foreground">Детальная страница пайплайна</p>
    </div>
  );
}




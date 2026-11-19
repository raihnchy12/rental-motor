import { Suspense } from "react";

// TODO: US-1.1
async function MotorDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold">Detail Motor: {id}</h1>
      <p className="text-muted-foreground mt-2">Informasi detail dan ketersediaan unit motor.</p>
    </div>
  );
}

export default function MotorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="container mx-auto p-6">
      <Suspense fallback={<div>Memuat data motor...</div>}>
        <MotorDetailContent params={params} />
      </Suspense>
    </main>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="h-8 w-64 rounded bg-cream-200" />
      <div className="h-4 w-96 max-w-full rounded bg-cream-200" />
      <div className="grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-white" />)}</div>
      <div className="h-80 rounded-2xl bg-white" />
    </div>
  );
}

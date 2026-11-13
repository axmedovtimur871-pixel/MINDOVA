export default function Loading() {
  return (
    <div className="container-page animate-pulse py-16" aria-busy="true" aria-label="Yuklanmoqda">
      <div className="h-10 w-72 rounded bg-cream-200" />
      <div className="mt-4 h-4 w-full max-w-xl rounded bg-cream-200" />
      <div className="mt-10 h-64 rounded-2xl bg-cream-100" />
    </div>
  );
}

export default function BrandLogo() {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <img
        src="/icon.png"
        alt="margelet"
        className="h-7 w-7 rounded-md"
      />

      <span className="text-2xl font-black tracking-tight text-slate-900">
        margelet
      </span>
    </div>
  );
}
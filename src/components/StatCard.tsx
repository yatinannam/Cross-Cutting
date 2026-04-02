export default function StatCard({
	title,
	value,
	detail,
}: {
	title: string;
	value: string;
	detail: string;
}) {
	return (
		<div className="group rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300/80">
			<p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
				{title}
			</p>
			<p className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
				{value}
			</p>
			<p className="mt-2.5 text-xs font-medium text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md">{detail}</p>
		</div>
	);
}

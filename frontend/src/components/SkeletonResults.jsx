/** Dark mode skeleton for loading state */
export default function SkeletonResults() {
    return (
        <div className="space-y-4 relative overflow-hidden p-6">
            {/* Scan overlay */}
            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-transparent via-teal/5 to-transparent animate-sweep opacity-30" />

            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                    <div className="flex gap-4 items-center">
                        <div className="w-24 h-4 rounded bg-slate-800/50 animate-pulse" />
                        <div className="flex-1 grid grid-cols-6 gap-2">
                            {Array.from({ length: 6 }).map((__, j) => (
                                <div key={j} className="h-10 rounded bg-slate-800/30 animate-pulse delay-[${j*100}ms]" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

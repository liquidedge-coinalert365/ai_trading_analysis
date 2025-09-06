'use client';

type Item = { id: string; text: string; createdAt: string | Date };

function timeAgoEn(input: string | Date) {
    const d = typeof input === 'string' ? new Date(input) : input;
    const diff = Date.now() - d.getTime();
    const mins = Math.max(1, Math.round(diff / 60000));
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.round(mins / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

export default function SuggestedList({ items }: { items: Item[] }) {
    if (!items?.length) return null;
    return (
        <section className="mt-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
                <h3 className="mb-3 text-base font-semibold">Suggested questions</h3>
                <ul className="divide-y divide-neutral-100">
                    {items.map((it) => (
                        <li key={it.id} className="flex items-center justify-between py-3 text-sm">
                            <span className="truncate pr-3">{it.text}</span>
                            <span className="shrink-0 text-neutral-500">{timeAgoEn(it.createdAt)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

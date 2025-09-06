'use client';

import { useState } from 'react';

type ApiResp = {
    questionId: string;
    answerId: string;
    source: 'ai' | 'reused';
    model: string;
    question: string;
    answer: string;
    reusedFromQuestionId?: string;
    askedAgoMs?: number;
};

function buildHeading(q: string) {
    const s = q.toLowerCase();
    if (/(떨어|하락|down|drop|fall)/.test(s)) return 'Why is the price going down?';
    if (/(오르|상승|up|rise)/.test(s)) return 'Why is the price going up?';
    return 'Why is the price moving?';
}

export default function AskForm() {
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(false);
    const [resp, setResp] = useState<ApiResp | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!q.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: q.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || '요청 실패');
            setResp(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            {/* 상단 검색바 (Ask a question | Ask) */}
            <form
                onSubmit={onSubmit}
                className="rounded-xl border border-neutral-300 bg-white overflow-hidden"
            >
                <div className="flex items-stretch">
                    <input
                        className="flex-1 bg-transparent px-3 sm:px-4 py-2.5 outline-none placeholder-neutral-400 text-[15px]"
                        placeholder="Ask a question"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        maxLength={400}
                    />
                    <button
                        type="submit"
                        disabled={loading || !q.trim()}
                        className="px-4 sm:px-5 py-2.5 text-sm font-medium bg-neutral-50 hover:bg-neutral-100 border-l border-neutral-300 disabled:opacity-50"
                    >
                        {loading ? '…' : 'Ask'}
                    </button>
                </div>
            </form>

            {/* 에러는 JSON이 아니라 한 줄로 */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* 답변 카드 */}
            {resp && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
                    <h2 className="mb-2 text-lg font-semibold">
                        {buildHeading(resp.question)}
                    </h2>
                    <p className="whitespace-pre-wrap leading-7 text-[15px] text-neutral-800">
                        {resp.answer}
                    </p>
                </div>
            )}
        </div>
    );
}

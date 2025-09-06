import { prisma } from '@/lib/prisma';
import AskForm from './components/AskForm';
import SuggestedList from './components/SuggestedList';

export default async function Page() {
    const recent = await prisma.question.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    return (
        <main className="mx-auto max-w-2xl p-4 sm:p-6">
            <AskForm />
            <SuggestedList items={recent.map(q => ({ id: q.id, text: q.text, createdAt: q.createdAt }))} />
        </main>
    );
}

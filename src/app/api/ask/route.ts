import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { questionHash } from '@/lib/normalize';
import { generateAnswer, model } from '@/lib/openai';
import { AnswerSource } from '@prisma/client';

export const runtime = 'nodejs';

const BodySchema = z.object({
    question: z.string().min(3).max(400),
});

function minutesAgo(mins: number) {
    return new Date(Date.now() - mins * 60_000);
}

async function latestCachedByHash(normHash: string) {
    return prisma.question.findFirst({
        where: { normHash, answers: { some: {} } },
        orderBy: { createdAt: 'desc' },
        include: { answers: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
}

export async function POST(req: Request) {
    try {
        const json = await req.json();
        const { question } = BodySchema.parse(json);
        const normHash = questionHash(question);

        // 1) 5분 내 동일 질문 → 즉시 재사용
        const recent = await prisma.question.findFirst({
            where: { normHash, createdAt: { gte: minutesAgo(5) }, answers: { some: {} } },
            include: { answers: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });

        const newQuestion = await prisma.question.create({ data: { text: question, normHash } });

        if (recent?.answers[0]) {
            const reused = await prisma.answer.create({
                data: {
                    questionId: newQuestion.id,
                    text: recent.answers[0].text,
                    model: `reused:${recent.answers[0].model}`,
                    source: AnswerSource.Reused,
                    reuseOfAnswerId: recent.answers[0].id,
                },
            });

            return NextResponse.json({
                questionId: newQuestion.id,
                answerId: reused.id,
                source: 'reused',
                model: recent.answers[0].model,
                question,
                answer: reused.text,
                reusedFromQuestionId: recent.id,
                askedAgoMs: Date.now() - recent.createdAt.getTime(),
            });
        }

        // 2) 새 답변 시도
        try {
            if (!process.env.OPENAI_API_KEY) {
                const demo =
                    'DEMO: OPENAI_API_KEY가 없어 예시 답변을 표시합니다. 가격 하락은 (1) 실적/온체인 둔화 (2) 매크로 리스크 (3) 수급 악화 ' +
                    '(4) 부정 뉴스/규제 (5) 기술적 하락 추세 등이 복합 작용. 한 줄 요약: 재료부족+위험회피.';
                const saved = await prisma.answer.create({
                    data: { questionId: newQuestion.id, text: demo, model: 'demo', source: AnswerSource.AI },
                });
                return NextResponse.json({
                    questionId: newQuestion.id,
                    answerId: saved.id,
                    source: 'ai',
                    model: 'demo',
                    question,
                    answer: demo,
                    notice: '데모 키로 실행 중입니다.',
                });
            }

            const aiText = await generateAnswer(question);
            const saved = await prisma.answer.create({
                data: { questionId: newQuestion.id, text: aiText, model, source: AnswerSource.AI },
            });

            return NextResponse.json({
                questionId: newQuestion.id,
                answerId: saved.id,
                source: 'ai',
                model,
                question,
                answer: aiText,
            });
        } catch (err: any) {
            // 3) 429/쿼터 초과 → DB의 "가장 최근" 캐시 답변으로 대체
            if (err?.name === 'RateLimit' || err?.status === 429) {
                const cached = await latestCachedByHash(normHash);
                if (cached?.answers?.[0]) {
                    const reused = await prisma.answer.create({
                        data: {
                            questionId: newQuestion.id,
                            text: cached.answers[0].text,
                            model: `reused:${cached.answers[0].model}`,
                            source: AnswerSource.Reused,
                            reuseOfAnswerId: cached.answers[0].id,
                        },
                    });
                    return NextResponse.json({
                        questionId: newQuestion.id,
                        answerId: reused.id,
                        source: 'reused',
                        model: cached.answers[0].model,
                        question,
                        answer: reused.text,
                        notice: '서버 사용량이 많아 최근 답변을 대신 보여드려요.',
                    });
                }

                // 캐시도 없으면 간단 가이드로 대체
                const fallback =
                    '현재 AI 사용량이 많아 상세 분석을 불러오지 못했습니다. 일반적 하락 원인 가이드: ' +
                    '① 실적/온체인 둔화 ② 거시 리스크 확대 ③ 수급 악화(대량 매도·청산) ④ 규제/부정 이벤트 ⑤ 하락 추세 지속. ' +
                    '한 줄 요약: 단기 악재·리스크 회피 심리 결합.';
                const saved = await prisma.answer.create({
                    data: { questionId: newQuestion.id, text: fallback, model: 'quota-fallback', source: AnswerSource.AI },
                });
                return NextResponse.json({
                    questionId: newQuestion.id,
                    answerId: saved.id,
                    source: 'ai',
                    model: 'quota-fallback',
                    question,
                    answer: fallback,
                    notice: '일시적으로 AI 쿼터를 초과하여 간단 가이드를 표시합니다.',
                });
            }
            throw err;
        }
    } catch (e: any) {
        if (e instanceof ZodError) {
            return NextResponse.json({ error: '질문은 최소 3자 이상 입력해주세요.' }, { status: 400 });
        }
        console.error(e);
        return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 400 });
    }
}

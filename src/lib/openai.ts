import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
export const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const temperature = Number(process.env.OPENAI_TEMPERATURE ?? 0.2);

if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY 미설정');
}

const openai = new OpenAI({
    apiKey: apiKey || '',
    // 429/5xx 등에 대해 기본 2회 재시도 → 4회로 상향
    // (공식 SDK가 429 등은 지수 백오프로 자동 재시도합니다)
    maxRetries: 4,
});

const SYSTEM_PROMPT = `
당신은 "가격이 왜 떨어지거나 오르는지"만 설명하는 요약 분석가입니다.
- 미래 예측 금지. 가능성 정도로 표현.
- 구조: (1)거시/섹터 (2)펀더멘털 (3)수급/심리 (4)이벤트 (5)기술적(있을때만)
- 한국어, 6~10문장, 마지막 "한 줄 요약:".
- 투자조언 아님.
`.trim();

export async function generateAnswer(userQuestion: string) {
    try {
        const res = await openai.chat.completions.create({
            model,
            temperature,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userQuestion },
            ],
        });
        return res.choices?.[0]?.message?.content?.trim() || '';
    } catch (err: any) {
        // SDK의 에러 객체는 status/code/message를 가집니다.
        if (err?.status === 429) {
            const e = new Error('QUOTA_OR_RATE_LIMIT');
            // @ts-ignore
            e.name = 'RateLimit';
            throw e;
        }
        throw err;
    }
}

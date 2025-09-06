import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '왜 떨어져? | Why Price Now',
    description: '가격이 왜 떨어지거나 오르는지만 빠르게 설명해주는 Q&A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
        <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
        </html>
    );
}


import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Workflow Studio | Vercel',
  description:
    'Compose a workflow after deployment. Watch real durable steps run in parallel, wait for approval, and resume exactly where they left off.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/vercel-brand.css" />
      </head>
      <body className={`vbg-report ${geist.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}

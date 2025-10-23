import { CakeIcon, GiftIcon, PartyPopperIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { BirthdayCardForm } from '@/components/form';

export const metadata: Metadata = {
  title: 'Birthday Card Generator',
  description:
    'Generate a birthday card for your loved ones with Workflow Development Kit.',
};

const Home = () => (
  <div className="flex h-dvh w-screen flex-col items-center justify-center">
    <div className="flex w-full max-w-sm flex-col items-center justify-center gap-6">
      <div className="relative isolate flex">
        <div className="-rotate-12 translate-x-2 translate-y-1 rounded-full border bg-background p-3 shadow-xs">
          <PartyPopperIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="z-10 rounded-full border bg-background p-3 shadow-xs">
          <CakeIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="-translate-x-2 translate-y-1 rotate-12 rounded-full border bg-background p-3 shadow-xs">
          <GiftIcon className="size-5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
          Birthday Card Generator
        </h1>
        <p className="text-balance text-muted-foreground sm:text-lg">
          Generate a birthday card for your loved ones with Workflow Development
          Kit.
        </p>
      </div>
      <BirthdayCardForm />
    </div>
  </div>
);

export default Home;

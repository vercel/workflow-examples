'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PATTERNS = [
  {
    value: 'sequential',
    name: 'Sequential Processing',
  },
  {
    value: 'routing',
    name: 'Routing',
  },
  {
    value: 'parallel',
    name: 'Parallel Processing',
  },
  {
    value: 'evaluator',
    name: 'Evaluator-Optimizer',
  },
  {
    value: 'orchestrator',
    name: 'Orchestrator-Worker',
  },
];

export default function Home() {
  const [pattern, setPattern] = useState('sequential');
  const [success, setSuccess] = useState(false);

  const onSubmit = async () => {
    try {
      const response = await fetch('/api/workflow', {
        method: 'POST',
        body: JSON.stringify({ pattern }),
      });

      if (response.ok) {
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight leading-tight text-balance">
          Workflow Patterns
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          AI SDK + Workflow DevKit
        </p>

        <div className="mt-10 mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <Select
              defaultValue={PATTERNS[0].value}
              onValueChange={setPattern}
              value={pattern}
            >
              <SelectTrigger className="h-11 w-full rounded-full bg-secondary text-secondary-foreground px-5">
                <SelectValue placeholder="Select a pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PATTERNS.map((pattern) => (
                    <SelectItem key={pattern.name} value={pattern.value}>
                      {pattern.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full px-4 shadow-none"
              onClick={onSubmit}
            >
              Run
            </Button>
          </div>
        </div>

        {success && (
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            Workflow triggered — check server logs.
          </p>
        )}
      </div>
    </div>
  );
}

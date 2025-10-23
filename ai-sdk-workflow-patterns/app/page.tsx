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
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl tracking-tight font-semibold max-w-sm text-center">
        Workflow Patterns in AI SDK using Workflow DevKit
      </h1>
      <div className="mt-6 w-[225px]">
        <Select
          defaultValue={PATTERNS[0].value}
          onValueChange={setPattern}
          value={pattern}
        >
          <SelectTrigger className="!w-full">
            <SelectValue placeholder="Select a pattern" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Patterns</SelectLabel>
              {PATTERNS.map((pattern) => (
                <SelectItem key={pattern.name} value={pattern.value}>
                  {pattern.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button className="mt-2 w-full" onClick={onSubmit}>
          Run Workflow
        </Button>
      </div>
      {success && <p className="mt-2">Workflow triggered, check server logs</p>}
    </div>
  );
}

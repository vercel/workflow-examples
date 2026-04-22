# Speaker Notes

Short presenter notes based on the actual mock walkthrough.

## Slide 1 - Getting Started with Vercel Workflows

- Quick intro.
- Demo first, then code, then the broader story.
- Focus today: long-running backends in plain TypeScript.

## Slide 2 - The code you run on day one can be the code you ship

- This is the real thesis.
- We are used to demo first, then “productionize” later.
- Workflow is trying to remove that whole second phase.

## Slide 3 - Let's jump straight into the birthday card app

- I want to go directly into the demo.
- Then I will break apart the code and runtime.

## Slide 4 - Birthday card generator

- One request.
- Parallel image + message generation.
- Guests sign with RSVP links.
- Wait until the birthday.
- Send the final postcard.

## Slide 5 - One workflow, multiple async patterns

- Immediate work.
- Human input.
- Waiting on time.
- Final delivery.

## Slide 6 - What to watch during the live demo

- Live progress updates.
- Parallel steps.
- Real suspension.
- Real resumption.

## Slide 7 - Now let's break apart what actually happened

- After the demo, move into code.
- The key message is how little infrastructure code is here.

## Slide 8 - Workflow code

- This reads like product logic.
- It matches how I would whiteboard the feature.
- That is the abstraction I want people to remember.

## Slide 9 - Two routes, not an orchestration system

- One route starts the workflow.
- One route resumes the stream.
- No extra DB for webhook correlation.
- No separate worker service.

## Slide 10 - Hooks and webhooks

- This is one of the most powerful primitives.
- Webhooks for public one-time URLs.
- Hooks for internal resume logic.
- Great for Slack, GitHub, approvals, and event-driven systems.

## Slide 11 - Sleep is more than a timer

- This is a real long-running primitive.
- Sleep for days or weeks.
- Also mention timeout patterns with hook vs sleep.

## Slide 12 - What `use workflow` and `use step` are actually doing

- Workflow replays.
- Steps do the real work.
- Event log resolves prior results.
- This is why the code stays simple.

## Slide 13 - The event log powers both durability and observability

- Observability is not bolted on.
- Same event log powers replay, recovery, and the audit trail.
- Inputs and outputs are already there.

## Slide 14 - Streaming is durable too

- New important piece in this version of the talk.
- Not just live streaming, resumable streaming.
- Same primitive works for simple apps and for agents.

## Slide 15 - An agent is basically just a workflow

- This is the framing I used in the mock.
- LLM calls and tool calls fit naturally into the workflow model.
- DurableAgent is the concrete example.

## Slide 16 - Getting started is intentionally small

- Setup is light.
- Start with one painful async path.
- Mention framework breadth and Python at GA.

## Slide 17 - Why GA matters

- Internal usage across Vercel agents.
- Customer stories: Flora and Durable.
- This is the proof slide, not the hype slide.
- Mention 5,000-step runs and serious workloads.

## Slide 18 - Durable systems should be easy to explain from the code itself

- This is the closing thought.
- Reliability plus clarity.
- If the team can read it, they can own it.

## Slide 19 - Q&A

- Invite questions on adoption.
- Invite questions on hooks, streaming, and agents.
- Seed with “what is a good first workflow candidate?” if needed.

## Optional talking points if you need extra time

- One workflow can map naturally to one Slack thread or one GitHub PR.
- Timeout pattern: race a hook against sleep.
- Streams are resumable, which matters for real production UIs.
- DurableAgent is a clean bridge from workflows into AI agents.

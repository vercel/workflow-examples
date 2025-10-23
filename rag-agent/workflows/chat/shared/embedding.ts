import { embed, embedMany } from 'ai';

export async function generateEmbeddings(
  value: string
): Promise<Array<{ embedding: number[]; content: string }>> {
  'use step';
  const chunks = value
    .trim()
    .split('.')
    .filter((i) => i !== '');
  const { embeddings } = await embedMany({
    model: 'text-embedding-ada-002',
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
}

export async function generateEmbedding(value: string): Promise<number[]> {
  'use step';
  const input = value.replaceAll('\\n', ' ');
  const { embedding } = await embed({
    model: 'text-embedding-ada-002',
    value: input,
  });
  return embedding;
}

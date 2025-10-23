import { db } from '@/lib/db';
import { embeddings as embeddingsTable } from '@/lib/db/schema/embeddings';
import {
  insertResourceSchema,
  type NewResourceParams,
  resources,
} from '@/lib/db/schema/resources';
import { generateEmbeddings } from './shared/embedding';

export async function createResource(input: NewResourceParams) {
  'use step';
  const { content } = await parseResourceInput(input);
  const resource = await insertResource(content);
  const embeddings = await generateEmbeddings(content);
  await insertEmbeddings(resource.id, embeddings);
}

async function parseResourceInput(input: NewResourceParams) {
  'use step';
  return insertResourceSchema.parse(input);
}

export async function insertResource(content: string) {
  'use step';
  const [resource] = await db.insert(resources).values({ content }).returning();
  return resource;
}

export async function insertEmbeddings(
  resourceId: string,
  embeddings: { embedding: number[]; content: string }[]
) {
  'use step';
  await db.insert(embeddingsTable).values(
    embeddings.map((embedding: { embedding: number[]; content: string }) => ({
      resourceId,
      ...embedding,
    }))
  );
}

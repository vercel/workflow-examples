import { cosineDistance, desc, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { embeddings } from '@/lib/db/schema/embeddings';
import { generateEmbedding } from './shared/embedding';

export async function findRelevant(userQuery: string) {
  'use step';
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarGuides = await getSimilarGuides(userQueryEmbedded);
  return similarGuides;
}

async function getSimilarGuides(userQueryEmbedded: number[]) {
  'use step';

  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded
  )})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
}

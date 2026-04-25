import { ChromaClient } from 'chromadb';

export function chunkText(text: string, maxCharsPerChunk: number = 2000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if (currentChunk.length + trimmed.length > maxCharsPerChunk) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      if (trimmed.length > maxCharsPerChunk) {
        let remaining = trimmed;
        while (remaining.length > 0) {
          chunks.push(remaining.substring(0, maxCharsPerChunk).trim());
          remaining = remaining.substring(maxCharsPerChunk);
        }
      } else {
        currentChunk = trimmed + ' ';
      }
    } else {
      currentChunk += trimmed + ' ';
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(c => c.length > 0);
}

export async function vectorizeAndStore(text: string, topic: string, userId: string): Promise<{ stored: number; chunks: number }> {
  try {
    const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
    const collectionName = 'student_' + userId.replace(/-/g, '_');
    
    const collection = await client.getOrCreateCollection({ name: collectionName } as any);
    
    const chunks = chunkText(text, 2000);
    if (chunks.length === 0) return { stored: 0, chunks: 0 };

    const ids = chunks.map((_, index) => `${topic}_${Date.now()}_${index}`);
    const metadatas = chunks.map(() => ({ topic, userId, createdAt: new Date().toISOString() }));

    await collection.add({
      ids,
      metadatas,
      documents: chunks
    });

    return { stored: chunks.length, chunks: chunks.length };
  } catch (error) {
    return { stored: 0, chunks: 0 };
  }
}

export async function retrieveRelevantContext(query: string, userId: string, nResults: number = 3): Promise<string[]> {
  try {
    const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
    const collectionName = 'student_' + userId.replace(/-/g, '_');
    
    const collection = await client.getCollection({ name: collectionName } as any);
    
    const results = await collection.query({
      queryTexts: [query],
      nResults
    });

    const docs = results.documents[0];
    return docs ? docs.filter((doc): doc is string => doc !== null) : [];
  } catch (error) {
    return [];
  }
}

export async function deleteUserCollection(userId: string): Promise<boolean> {
  try {
    const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
    const collectionName = 'student_' + userId.replace(/-/g, '_');
    await client.deleteCollection({ name: collectionName });
    return true;
  } catch (error) {
    return false;
  }
}

export async function getUserCollectionStats(userId: string): Promise<{ exists: boolean; count: number }> {
  try {
    const client = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
    const collectionName = 'student_' + userId.replace(/-/g, '_');
    const collection = await client.getCollection({ name: collectionName } as any);
    const count = await collection.count();
    return { exists: true, count };
  } catch (error) {
    return { exists: false, count: 0 };
  }
}

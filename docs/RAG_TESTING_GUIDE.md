# RAG Hybrid Search Testing Guide

## Overview

This guide covers testing the RAG (Retrieval Augmented Generation) hybrid search system that combines full-text search with semantic vector similarity.

## Prerequisites

1. ✅ KB articles populated in database
2. ✅ `rag-retrieve` edge function deployed
3. ⚠️ OpenAI API key configured (optional, for semantic search)

## Test Setup

### 1. Verify Database Tables

```sql
-- Check kb_articles exist
SELECT COUNT(*), category FROM public.kb_articles
WHERE published = true
GROUP BY category;

-- Check embeddings (if any)
SELECT COUNT(*) as embedding_count FROM public.kb_embeddings;
```

### 2. Test Full-Text Search Only

If you don't have OpenAI API key configured yet, the system will fall back to full-text search only:

```bash
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/rag-retrieve \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "voice AI setup guide",
    "max_results": 5
  }'
```

Expected response:
```json
{
  "success": true,
  "results": [
    {
      "article_id": "...",
      "title": "Getting Started with Voice AI",
      "content": "Voice AI enables...",
      "category": "Documentation",
      "tags": ["voice", "ai", "getting-started"],
      "combined_score": 0.85,
      "full_text_rank": 0.85,
      "semantic_similarity": 0
    }
  ],
  "query": "voice AI setup guide",
  "has_semantic_search": false
}
```

### 3. Generate Embeddings (Optional)

To enable semantic search, you need to:

1. **Configure OpenAI API Key** in Supabase Project Settings → Edge Functions → Secrets
2. **Generate embeddings** for existing articles:

```typescript
// Example embedding generation script
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function generateEmbeddings() {
  // Fetch all published articles
  const { data: articles } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('published', true);

  for (const article of articles) {
    // Chunk the content (every 500 words)
    const chunks = chunkText(article.content, 500);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk
      });
      
      const embedding = response.data[0].embedding;
      
      // Store embedding
      await supabase.from('kb_embeddings').insert({
        article_id: article.id,
        embedding: embedding,
        chunk_text: chunk,
        chunk_index: i
      });
    }
  }
}

function chunkText(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  
  return chunks;
}
```

### 4. Test Hybrid Search (with embeddings)

Once embeddings are generated:

```bash
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/rag-retrieve \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "how to troubleshoot call quality issues",
    "max_results": 5,
    "full_text_weight": 0.3,
    "semantic_weight": 0.7
  }'
```

Expected response with semantic search:
```json
{
  "success": true,
  "results": [
    {
      "article_id": "...",
      "title": "Troubleshooting Connection Issues",
      "content": "Connection issues can disrupt...",
      "combined_score": 0.92,
      "full_text_rank": 0.65,
      "semantic_similarity": 0.88
    }
  ],
  "has_semantic_search": true
}
```

## Test Cases

### Test 1: Exact Match

Query: "API Integration Guide"

Expected: Should return the "API Integration Guide" article with high full-text score.

### Test 2: Semantic Similarity

Query: "How do I connect my application to the voice service?"

Expected: Should return "API Integration Guide" with high semantic similarity.

### Test 3: Category Filtering

Query with specific category:

```typescript
const { data } = await supabase.rpc('hybrid_search_kb', {
  search_query: 'security',
  query_embedding: null,
  max_results: 10
});
```

### Test 4: Multi-word Query

Query: "call analytics dashboard metrics reporting"

Expected: Should return "Understanding Call Analytics" article.

### Test 5: Tag Search

Query: "troubleshooting network diagnostics"

Expected: Should match "Troubleshooting Connection Issues" via tags.

## Performance Testing

### 1. Response Time

```bash
time curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/rag-retrieve \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"query": "test query"}'
```

Target: < 500ms for full-text, < 1000ms with embeddings

### 2. Concurrent Requests

```bash
# Run 10 concurrent searches
for i in {1..10}; do
  curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/rag-retrieve \
    -H "Authorization: Bearer ..." \
    -H "Content-Type: application/json" \
    -d '{"query": "test '$i'"}' &
done
wait
```

### 3. Large Result Sets

```bash
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/rag-retrieve \
  -H "Authorization: Bearer ..." \
  -H "Content-Type: application/json" \
  -d '{"query": "voice", "max_results": 100}'
```

## Integration Testing

### Test in Application

```typescript
import { supabase } from '@/integrations/supabase/client';

async function searchKnowledgeBase(query: string) {
  const { data, error } = await supabase.functions.invoke('rag-retrieve', {
    body: {
      query,
      max_results: 5,
      match_threshold: 0.7
    }
  });

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return data.results;
}

// Usage
const results = await searchKnowledgeBase('how to setup voice AI');
console.log(`Found ${results.length} articles`);
```

## Monitoring

### View Count Tracking

```sql
-- Check most viewed articles
SELECT title, category, view_count
FROM public.kb_articles
WHERE published = true
ORDER BY view_count DESC
LIMIT 10;
```

### Search Analytics

```sql
-- Track search patterns
SELECT 
  COUNT(*) as search_count,
  AVG(array_length(results, 1)) as avg_results
FROM (
  SELECT jsonb_array_length(event_data->'results') as results
  FROM public.analytics_events
  WHERE event_type = 'kb_search'
    AND created_at > NOW() - INTERVAL '7 days'
) searches;
```

## Troubleshooting

### No Results Returned

1. Check articles exist and are published:
   ```sql
   SELECT * FROM kb_articles WHERE published = true;
   ```

2. Test full-text search directly:
   ```sql
   SELECT title, ts_rank(search_vector, websearch_to_tsquery('english', 'your query')) as rank
   FROM kb_articles
   WHERE search_vector @@ websearch_to_tsquery('english', 'your query')
   ORDER BY rank DESC;
   ```

### Low Relevance Scores

- Adjust `full_text_weight` and `semantic_weight` ratios
- Lower `match_threshold` for more results
- Check if embeddings are properly generated

### Slow Performance

- Check index usage: `EXPLAIN ANALYZE` on search queries
- Verify vector index is created: `\d kb_embeddings`
- Consider increasing `lists` parameter in ivfflat index

## Best Practices

1. **Weight Tuning**: Start with 30% full-text, 70% semantic
2. **Threshold**: Use 0.7 for quality, 0.5 for coverage
3. **Chunking**: Keep chunks 300-500 words for optimal embedding
4. **Caching**: Cache popular queries at application level
5. **Monitoring**: Track search patterns and null result rates
6. **Content**: Keep articles focused and well-structured
7. **Tags**: Use consistent, descriptive tags for better matching

## Next Steps

After testing:

1. ✅ Verify hybrid search works correctly
2. ✅ Monitor performance and adjust weights
3. ✅ Add more articles to knowledge base
4. ✅ Implement search UI in application
5. ✅ Set up analytics for search patterns
6. ✅ Create feedback mechanism for search quality

## References

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)

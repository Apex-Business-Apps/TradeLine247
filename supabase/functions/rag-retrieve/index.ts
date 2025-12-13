/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface RetrieveRequest {
  query: string;
  max_results?: number;
  match_threshold?: number;
  full_text_weight?: number;
  semantic_weight?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: RetrieveRequest = await req.json();

    console.log('RAG retrieve request:', body.query);

    // Generate query embedding if OpenAI key is available
    let queryEmbedding: number[] | null = null;
    
    if (OPENAI_API_KEY) {
      try {
        const embeddingResponse = await fetch(
          'https://api.openai.com/v1/embeddings',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'text-embedding-ada-002',
              input: body.query
            })
          }
        );

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          queryEmbedding = embeddingData.data[0].embedding;
          console.log('Generated query embedding');
        }
      } catch (error) {
        console.warn('Failed to generate embedding:', error);
        // Continue with full-text only search
      }
    }

    // Perform hybrid search
    const { data: results, error: searchError } = await supabase
      .rpc('hybrid_search_kb', {
        search_query: body.query,
        query_embedding: queryEmbedding ? `[${queryEmbedding.join(',')}]` : null,
        match_threshold: body.match_threshold || 0.7,
        full_text_weight: body.full_text_weight || 0.3,
        semantic_weight: body.semantic_weight || 0.7,
        max_results: body.max_results || 10
      });

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    console.log(`Found ${results?.length || 0} results`);

    // Increment view counts for top results
    if (results && results.length > 0) {
      const topArticleIds = results.slice(0, 3).map((r: any) => r.article_id);
      
      for (const articleId of topArticleIds) {
        await supabase.rpc('increment_kb_view_count', {
          p_article_id: articleId
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: results || [],
        query: body.query,
        has_semantic_search: queryEmbedding !== null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rag-retrieve:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

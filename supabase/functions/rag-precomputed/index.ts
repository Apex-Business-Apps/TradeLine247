/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RAG Pre-computed Answers Edge Function
 * Serves frequently asked questions instantly without vector search
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, preflight, jsonResponse } from '../_shared/cors.ts';

interface PrecomputedAnswer {
  id: string;
  question_pattern: string;
  answer_text: string;
  answer_html?: string;
  metadata: Record<string, any>;
  source_refs: any[];
  confidence_score: number;
  hit_count: number;
}

interface MatchRequest {
  query: string;
  organization_id?: string;
  threshold?: number;
  limit?: number;
}

interface MatchResponse {
  matched: boolean;
  answer?: PrecomputedAnswer;
  alternatives?: PrecomputedAnswer[];
  cache_hit: boolean;
  match_score?: number;
}

/**
 * Normalize question text for matching
 */
function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate similarity score between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeQuestion(str1);
  const s2 = normalizeQuestion(str2);
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }
  
  // Word overlap similarity
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

async function handleRequest(req: Request): Promise<Response> {
  const pf = preflight(req);
  if (pf) return pf;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json() as MatchRequest;
    const { query, organization_id, threshold = 0.8, limit = 5 } = body;

    if (!query || typeof query !== 'string') {
      return jsonResponse({ error: 'Missing or invalid query parameter' }, 400);
    }

    console.log('Searching pre-computed answers for:', query);

    // Build query
    let dbQuery = supabase
      .from('rag_precomputed_answers')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: false })
      .order('hit_count', { ascending: false })
      .limit(20);

    if (organization_id) {
      dbQuery = dbQuery.or(`organization_id.is.null,organization_id.eq.${organization_id}`);
    } else {
      dbQuery = dbQuery.is('organization_id', null);
    }

    const { data: answers, error } = await dbQuery;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    if (!answers || answers.length === 0) {
      return jsonResponse({
        matched: false,
        cache_hit: false,
        message: 'No pre-computed answers available'
      });
    }

    // Calculate similarity scores
    const scoredAnswers = answers.map(answer => ({
      ...answer,
      match_score: calculateSimilarity(query, answer.question_pattern)
    }));

    // Sort by match score
    scoredAnswers.sort((a, b) => b.match_score - a.match_score);

    // Get best match
    const bestMatch = scoredAnswers[0];
    const matched = bestMatch.match_score >= threshold;

    if (matched) {
      // Update hit count and last_hit_at
      await supabase
        .from('rag_precomputed_answers')
        .update({
          hit_count: bestMatch.hit_count + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq('id', bestMatch.id);

      console.log(`Pre-computed answer matched (score: ${bestMatch.match_score}):`, bestMatch.id);

      // Get alternatives
      const alternatives = scoredAnswers
        .slice(1, limit)
        .filter(a => a.match_score >= threshold * 0.7);

      const response: MatchResponse = {
        matched: true,
        answer: {
          id: bestMatch.id,
          question_pattern: bestMatch.question_pattern,
          answer_text: bestMatch.answer_text,
          answer_html: bestMatch.answer_html,
          metadata: bestMatch.metadata || {},
          source_refs: bestMatch.source_refs || [],
          confidence_score: bestMatch.confidence_score,
          hit_count: bestMatch.hit_count + 1
        },
        alternatives: alternatives.length > 0 ? alternatives.map(a => ({
          id: a.id,
          question_pattern: a.question_pattern,
          answer_text: a.answer_text,
          answer_html: a.answer_html,
          metadata: a.metadata || {},
          source_refs: a.source_refs || [],
          confidence_score: a.confidence_score,
          hit_count: a.hit_count
        })) : undefined,
        cache_hit: true,
        match_score: bestMatch.match_score
      };

      return jsonResponse(response);
    }

    // No match above threshold
    console.log('No pre-computed answer matched threshold');
    return jsonResponse({
      matched: false,
      cache_hit: false,
      best_score: bestMatch.match_score,
      message: 'No answer matched the threshold'
    });

  } catch (error) {
    console.error('Error in rag-precomputed:', error);
    return jsonResponse(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

Deno.serve(handleRequest);

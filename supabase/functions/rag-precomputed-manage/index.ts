/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RAG Pre-computed Answers Management Edge Function
 * CRUD operations for pre-computed answers
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, preflight, jsonResponse } from '../_shared/cors.ts';

interface CreateAnswerRequest {
  question_pattern: string;
  answer_text: string;
  answer_html?: string;
  organization_id?: string;
  metadata?: Record<string, any>;
  source_refs?: any[];
  confidence_score?: number;
  priority?: number;
}

interface UpdateAnswerRequest {
  id: string;
  question_pattern?: string;
  answer_text?: string;
  answer_html?: string;
  metadata?: Record<string, any>;
  source_refs?: any[];
  confidence_score?: number;
  priority?: number;
  enabled?: boolean;
}

interface BulkImportRequest {
  answers: CreateAnswerRequest[];
  organization_id?: string;
}

/**
 * Normalize question for database storage
 */
function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

async function handleRequest(req: Request): Promise<Response> {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    // LIST - Get all pre-computed answers
    if (req.method === 'GET' && action === 'list') {
      const organization_id = url.searchParams.get('organization_id');
      const enabled_only = url.searchParams.get('enabled') === 'true';

      let query = supabase
        .from('rag_precomputed_answers')
        .select('*')
        .order('priority', { ascending: false })
        .order('hit_count', { ascending: false });

      if (organization_id) {
        query = query.eq('organization_id', organization_id);
      }

      if (enabled_only) {
        query = query.eq('enabled', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return jsonResponse({ success: true, data });
    }

    // CREATE - Add new pre-computed answer
    if (req.method === 'POST' && action === 'create') {
      const body = await req.json() as CreateAnswerRequest;
      
      if (!body.question_pattern || !body.answer_text) {
        return jsonResponse(
          { error: 'Missing required fields: question_pattern, answer_text' },
          400
        );
      }

      const insertData = {
        question_pattern: body.question_pattern,
        question_normalized: normalizeQuestion(body.question_pattern),
        answer_text: body.answer_text,
        answer_html: body.answer_html,
        organization_id: body.organization_id,
        metadata: body.metadata || {},
        source_refs: body.source_refs || [],
        confidence_score: body.confidence_score || 1.0,
        priority: body.priority || 0
      };

      const { data, error } = await supabase
        .from('rag_precomputed_answers')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      console.log('Created pre-computed answer:', data.id);
      return jsonResponse({ success: true, data });
    }

    // UPDATE - Modify existing answer
    if (req.method === 'POST' && action === 'update') {
      const body = await req.json() as UpdateAnswerRequest;
      
      if (!body.id) {
        return jsonResponse({ error: 'Missing required field: id' }, 400);
      }

      const updateData: any = {};
      
      if (body.question_pattern) {
        updateData.question_pattern = body.question_pattern;
        updateData.question_normalized = normalizeQuestion(body.question_pattern);
      }
      if (body.answer_text !== undefined) updateData.answer_text = body.answer_text;
      if (body.answer_html !== undefined) updateData.answer_html = body.answer_html;
      if (body.metadata !== undefined) updateData.metadata = body.metadata;
      if (body.source_refs !== undefined) updateData.source_refs = body.source_refs;
      if (body.confidence_score !== undefined) updateData.confidence_score = body.confidence_score;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.enabled !== undefined) updateData.enabled = body.enabled;

      const { data, error } = await supabase
        .from('rag_precomputed_answers')
        .update(updateData)
        .eq('id', body.id)
        .select()
        .single();

      if (error) throw error;

      console.log('Updated pre-computed answer:', data.id);
      return jsonResponse({ success: true, data });
    }

    // DELETE - Remove answer
    if (req.method === 'POST' && action === 'delete') {
      const body = await req.json() as { id: string };
      
      if (!body.id) {
        return jsonResponse({ error: 'Missing required field: id' }, 400);
      }

      const { error } = await supabase
        .from('rag_precomputed_answers')
        .delete()
        .eq('id', body.id);

      if (error) throw error;

      console.log('Deleted pre-computed answer:', body.id);
      return jsonResponse({ success: true });
    }

    // BULK IMPORT - Import multiple answers
    if (req.method === 'POST' && action === 'bulk-import') {
      const body = await req.json() as BulkImportRequest;
      
      if (!body.answers || !Array.isArray(body.answers)) {
        return jsonResponse({ error: 'Missing or invalid answers array' }, 400);
      }

      const insertData = body.answers.map(answer => ({
        question_pattern: answer.question_pattern,
        question_normalized: normalizeQuestion(answer.question_pattern),
        answer_text: answer.answer_text,
        answer_html: answer.answer_html,
        organization_id: answer.organization_id || body.organization_id,
        metadata: answer.metadata || {},
        source_refs: answer.source_refs || [],
        confidence_score: answer.confidence_score || 1.0,
        priority: answer.priority || 0
      }));

      const { data, error } = await supabase
        .from('rag_precomputed_answers')
        .insert(insertData)
        .select();

      if (error) throw error;

      console.log(`Bulk imported ${data.length} pre-computed answers`);
      return jsonResponse({ 
        success: true, 
        imported: data.length,
        data 
      });
    }

    // STATS - Get usage statistics
    if (req.method === 'GET' && action === 'stats') {
      const organization_id = url.searchParams.get('organization_id');

      let query = supabase
        .from('rag_precomputed_answers')
        .select('hit_count, enabled, last_hit_at, priority');

      if (organization_id) {
        query = query.eq('organization_id', organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        enabled: data.filter(a => a.enabled).length,
        disabled: data.filter(a => !a.enabled).length,
        total_hits: data.reduce((sum, a) => sum + (a.hit_count || 0), 0),
        avg_hits: data.length > 0 ? data.reduce((sum, a) => sum + (a.hit_count || 0), 0) / data.length : 0,
        most_used: data.sort((a, b) => (b.hit_count || 0) - (a.hit_count || 0)).slice(0, 10),
        recently_used: data
          .filter(a => a.last_hit_at)
          .sort((a, b) => new Date(b.last_hit_at!).getTime() - new Date(a.last_hit_at!).getTime())
          .slice(0, 10)
      };

      return jsonResponse({ success: true, stats });
    }

    return jsonResponse({ error: 'Invalid action or method' }, 400);

  } catch (error) {
    console.error('Error in rag-precomputed-manage:', error);
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

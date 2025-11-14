/**
 * Automated RAG Backup System
 * Handles automated backups of RAG sources, chunks, and embeddings
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BackupRequest {
  mode: 'all' | 'recent' | 'specific';
  source_ids?: string[];
  hours?: number; // For 'recent' mode
  cleanup_old?: boolean; // Clean up backups older than 90 days
  backup_reason?: string;
}

async function backupAllSources(supabase: any, reason: string) {
  console.log('Starting full backup of all sources');
  
  const { data: sources, error: sourcesError } = await supabase
    .from('rag_sources')
    .select('id')
    .is('deleted_at', null);

  if (sourcesError) {
    console.error('Error fetching sources:', sourcesError);
    throw sourcesError;
  }

  const sourceIds = sources?.map((s: any) => s.id) || [];
  console.log(`Found ${sourceIds.length} sources to backup`);

  return await backupSpecificSources(supabase, sourceIds, reason);
}

async function backupRecentSources(supabase: any, hours: number, reason: string) {
  console.log(`Backing up sources modified in last ${hours} hours`);
  
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data: sources, error: sourcesError } = await supabase
    .from('rag_sources')
    .select('id')
    .is('deleted_at', null)
    .gte('updated_at', cutoff);

  if (sourcesError) {
    console.error('Error fetching recent sources:', sourcesError);
    throw sourcesError;
  }

  const sourceIds = sources?.map((s: any) => s.id) || [];
  console.log(`Found ${sourceIds.length} recently modified sources`);

  return await backupSpecificSources(supabase, sourceIds, reason);
}

async function backupSpecificSources(supabase: any, sourceIds: string[], reason: string) {
  console.log(`Backing up ${sourceIds.length} specific sources`);
  
  let totalChunks = 0;
  let totalEmbeddings = 0;
  let errors = 0;

  for (const sourceId of sourceIds) {
    try {
      // Get all chunks for this source
      const { data: chunks, error: chunksError } = await supabase
        .from('rag_chunks')
        .select('id')
        .eq('source_id', sourceId);

      if (chunksError) {
        console.error(`Error fetching chunks for source ${sourceId}:`, chunksError);
        errors++;
        continue;
      }

      totalChunks += chunks?.length || 0;

      // Backup embeddings for each chunk
      for (const chunk of chunks || []) {
        const { error: backupError } = await supabase.rpc('rag_backup_embeddings', {
          p_source_id: sourceId,
          p_reason: reason
        });

        if (backupError) {
          console.error(`Error backing up chunk ${chunk.id}:`, backupError);
          errors++;
        } else {
          totalEmbeddings++;
        }
      }

      console.log(`Backed up source ${sourceId}: ${chunks?.length || 0} chunks`);
    } catch (error) {
      console.error(`Failed to backup source ${sourceId}:`, error);
      errors++;
    }
  }

  return {
    sources_backed_up: sourceIds.length,
    chunks_processed: totalChunks,
    embeddings_backed_up: totalEmbeddings,
    errors
  };
}

async function cleanupOldBackups(supabase: any, daysOld: number = 90) {
  console.log(`Cleaning up backups older than ${daysOld} days`);
  
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: deleted, error } = await supabase
    .from('rag_embeddings_backup')
    .delete()
    .lt('backed_up_at', cutoff)
    .select('id');

  if (error) {
    console.error('Error cleaning up old backups:', error);
    throw error;
  }

  console.log(`Deleted ${deleted?.length || 0} old backups`);
  
  return {
    deleted_count: deleted?.length || 0,
    cutoff_date: cutoff
  };
}

async function getBackupStats(supabase: any) {
  console.log('Getting backup statistics');
  
  const { data: stats, error } = await supabase
    .from('rag_embeddings_backup')
    .select('backed_up_at, backup_reason, can_restore');

  if (error) {
    console.error('Error fetching backup stats:', error);
    throw error;
  }

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  const last24h = stats?.filter((s: any) => 
    now - new Date(s.backed_up_at).getTime() < day
  ).length || 0;
  
  const last7d = stats?.filter((s: any) => 
    now - new Date(s.backed_up_at).getTime() < 7 * day
  ).length || 0;
  
  const restorable = stats?.filter((s: any) => s.can_restore).length || 0;

  // Get oldest and newest backup
  const sortedByDate = [...(stats || [])].sort((a: any, b: any) => 
    new Date(a.backed_up_at).getTime() - new Date(b.backed_up_at).getTime()
  );

  return {
    total_backups: stats?.length || 0,
    last_24h: last24h,
    last_7d: last7d,
    restorable_backups: restorable,
    oldest_backup: sortedByDate[0]?.backed_up_at || null,
    newest_backup: sortedByDate[sortedByDate.length - 1]?.backed_up_at || null,
    by_reason: stats?.reduce((acc: any, s: any) => {
      acc[s.backup_reason] = (acc[s.backup_reason] || 0) + 1;
      return acc;
    }, {})
  };
}

Deno.serve(async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body: BackupRequest = await req.json();
    const mode = body.mode || 'recent';
    const reason = body.backup_reason || 'automated_backup';

    console.log(`Backup request - Mode: ${mode}`);

    let backupResult;

    switch (mode) {
      case 'all':
        backupResult = await backupAllSources(supabase, reason);
        break;
      
      case 'recent':
        const hours = body.hours || 24;
        backupResult = await backupRecentSources(supabase, hours, reason);
        break;
      
      case 'specific':
        if (!body.source_ids || body.source_ids.length === 0) {
          throw new Error('source_ids required for specific mode');
        }
        backupResult = await backupSpecificSources(supabase, body.source_ids, reason);
        break;
      
      default:
        throw new Error(`Invalid mode: ${mode}`);
    }

    // Clean up old backups if requested
    let cleanupResult;
    if (body.cleanup_old) {
      cleanupResult = await cleanupOldBackups(supabase, 90);
    }

    // Get current stats
    const stats = await getBackupStats(supabase);

    return new Response(
      JSON.stringify({ 
        success: true,
        backup: backupResult,
        cleanup: cleanupResult,
        stats,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Backup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

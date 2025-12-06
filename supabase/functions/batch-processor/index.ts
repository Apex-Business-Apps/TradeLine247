import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ProcessorRequest {
  batch_size?: number;
  job_types?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: ProcessorRequest = await req.json().catch(() => ({}));

    const batchSize = body.batch_size || 10;
    const jobTypes = body.job_types || null;
    const batchId = crypto.randomUUID();

    console.log('Starting batch processing:', { batchId, batchSize, jobTypes });

    // Fetch next batch of jobs
    const { data: jobs, error: fetchError } = await supabase
      .rpc('fetch_next_batch', {
        p_batch_size: batchSize,
        p_job_types: jobTypes
      });

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs to process');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No jobs to process',
          batch_id: batchId,
          processed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${jobs.length} jobs`);

    // Create batch job record
    const { error: batchError } = await supabase
      .from('batch_jobs')
      .insert({
        batch_id: batchId,
        total_items: jobs.length,
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: { job_types: jobTypes, batch_size: batchSize }
      });

    if (batchError) {
      console.error('Batch creation error:', batchError);
    }

    // Process each job
    const results = {
      successful: 0,
      failed: 0,
      processed: 0
    };

    for (const job of jobs) {
      try {
        console.log(`Processing job ${job.job_id} (${job.job_type})`);

        // Process based on job type
        let success = false;
        let errorMessage = null;

        switch (job.job_type) {
          case 'transcription':
            // Call transcription service
            success = await processTranscription(supabase, job.payload);
            break;
          
          case 'email_notification':
            // Send email notification
            success = await processEmailNotification(supabase, job.payload);
            break;
          
          case 'data_sync':
            // Sync data
            success = await processDataSync(supabase, job.payload);
            break;
          
          case 'report_generation':
            // Generate report
            success = await processReportGeneration(supabase, job.payload);
            break;
          
          default:
            console.warn(`Unknown job type: ${job.job_type}`);
            success = false;
            errorMessage = `Unknown job type: ${job.job_type}`;
        }

        // Mark job as completed
        await supabase.rpc('complete_job', {
          p_job_id: job.job_id,
          p_success: success,
          p_error_message: errorMessage,
          p_error_details: null
        });

        if (success) {
          results.successful++;
        } else {
          results.failed++;
        }
        results.processed++;

      } catch (error) {
        console.error(`Error processing job ${job.job_id}:`, error);
        
        // Mark job as failed
        await supabase.rpc('complete_job', {
          p_job_id: job.job_id,
          p_success: false,
          p_error_message: error instanceof Error ? error.message : 'Unknown error',
          p_error_details: { error: String(error) }
        });

        results.failed++;
        results.processed++;
      }
    }

    // Update batch job record
    await supabase
      .from('batch_jobs')
      .update({
        processed_items: results.processed,
        successful_items: results.successful,
        failed_items: results.failed,
        status: results.failed === 0 ? 'completed' : 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('batch_id', batchId);

    console.log('Batch processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: batchId,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in batch-processor:', error);
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

// Job processors
async function processTranscription(supabase: any, payload: any): Promise<boolean> {
  console.log('Processing transcription:', payload);
  // Implement actual transcription logic here
  return true;
}

async function processEmailNotification(supabase: any, payload: any): Promise<boolean> {
  console.log('Processing email notification:', payload);
  // Implement actual email sending logic here
  return true;
}

async function processDataSync(supabase: any, payload: any): Promise<boolean> {
  console.log('Processing data sync:', payload);
  // Implement actual data sync logic here
  return true;
}

async function processReportGeneration(supabase: any, payload: any): Promise<boolean> {
  console.log('Processing report generation:', payload);
  // Implement actual report generation logic here
  return true;
}

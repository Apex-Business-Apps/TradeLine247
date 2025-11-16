import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { training_run_id } = await req.json();

    if (!training_run_id) {
      throw new Error('training_run_id is required');
    }

    console.log(`Checking status for training run ${training_run_id}`);

    // Get training run
    const { data: trainingRun, error: runError } = await supabase
      .from('finetuning_training_runs')
      .select('*')
      .eq('id', training_run_id)
      .single();

    if (runError) throw runError;

    if (!trainingRun.openai_job_id) {
      throw new Error('No OpenAI job ID found for this training run');
    }

    // Fetch status from OpenAI
    const statusResponse = await fetch(
      `https://api.openai.com/v1/fine_tuning/jobs/${trainingRun.openai_job_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
        },
      }
    );

    if (!statusResponse.ok) {
      const error = await statusResponse.text();
      console.error('Failed to fetch job status:', error);
      throw new Error(`Failed to fetch job status: ${error}`);
    }

    const jobData = await statusResponse.json();
    console.log(`Job status: ${jobData.status}`);

    // Update local training run record
    const updates: any = {
      status: jobData.status,
      updated_at: new Date().toISOString(),
    };

    if (jobData.fine_tuned_model) {
      updates.result_model_id = jobData.fine_tuned_model;
    }

    if (jobData.trained_tokens) {
      updates.trained_tokens = jobData.trained_tokens;
    }

    if (jobData.error) {
      updates.error_message = JSON.stringify(jobData.error);
    }

    if (jobData.status === 'succeeded') {
      updates.completed_at = new Date().toISOString();
      
      // Update dataset status
      await supabase
        .from('finetuning_datasets')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingRun.dataset_id);
    } else if (jobData.status === 'failed' || jobData.status === 'cancelled') {
      updates.completed_at = new Date().toISOString();
      
      // Update dataset status
      await supabase
        .from('finetuning_datasets')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingRun.dataset_id);
    }

    const { error: updateError } = await supabase
      .from('finetuning_training_runs')
      .update(updates)
      .eq('id', training_run_id);

    if (updateError) {
      console.error('Failed to update training run:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        training_run_id: training_run_id,
        status: jobData.status,
        fine_tuned_model: jobData.fine_tuned_model || null,
        trained_tokens: jobData.trained_tokens || null,
        estimated_finish: jobData.estimated_finish || null,
        error: jobData.error || null,
        openai_job_data: jobData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in check-finetuning-status:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to check fine-tuning status'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

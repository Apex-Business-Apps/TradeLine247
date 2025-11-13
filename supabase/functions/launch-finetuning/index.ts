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

    const { 
      dataset_id, 
      base_model = 'gpt-4o-mini-2024-07-18',
      hyperparameters = { n_epochs: 3 }
    } = await req.json();

    if (!dataset_id) {
      throw new Error('dataset_id is required');
    }

    console.log(`Launching fine-tuning for dataset ${dataset_id}`);

    // Get dataset and export JSONL
    const { data: jsonlLines, error: exportError } = await supabase
      .rpc('export_finetuning_jsonl', { p_dataset_id: dataset_id });

    if (exportError) throw exportError;

    const jsonlContent = (jsonlLines as { jsonl_line: string }[])
      .map(row => row.jsonl_line)
      .join('\n');

    console.log(`Uploading ${jsonlLines?.length || 0} training examples to OpenAI`);

    // Step 1: Upload training file to OpenAI
    const formData = new FormData();
    formData.append('purpose', 'fine-tune');
    formData.append('file', new Blob([jsonlContent], { type: 'text/plain' }), 'training_data.jsonl');

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('File upload failed:', error);
      throw new Error(`Failed to upload training file: ${error}`);
    }

    const fileData = await uploadResponse.json();
    console.log(`File uploaded successfully: ${fileData.id}`);

    // Step 2: Create fine-tuning job
    const finetuneResponse = await fetch('https://api.openai.com/v1/fine_tuning/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        training_file: fileData.id,
        model: base_model,
        hyperparameters: hyperparameters,
      }),
    });

    if (!finetuneResponse.ok) {
      const error = await finetuneResponse.text();
      console.error('Fine-tuning job creation failed:', error);
      throw new Error(`Failed to create fine-tuning job: ${error}`);
    }

    const jobData = await finetuneResponse.json();
    console.log(`Fine-tuning job created: ${jobData.id}`);

    // Step 3: Create training run record
    const { data: trainingRun, error: runError } = await supabase
      .from('finetuning_training_runs')
      .insert({
        dataset_id: dataset_id,
        openai_job_id: jobData.id,
        base_model: base_model,
        hyperparameters: hyperparameters,
        status: 'queued',
        training_file_id: fileData.id,
        started_at: new Date().toISOString(),
        created_by: req.headers.get('user-id') || null,
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create training run record:', runError);
      throw runError;
    }

    // Update dataset status
    await supabase
      .from('finetuning_datasets')
      .update({ 
        status: 'training',
        updated_at: new Date().toISOString()
      })
      .eq('id', dataset_id);

    return new Response(
      JSON.stringify({
        success: true,
        training_run_id: trainingRun.id,
        openai_job_id: jobData.id,
        status: jobData.status,
        message: 'Fine-tuning job launched successfully',
        estimated_completion: 'Check status in 10-30 minutes'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in launch-finetuning:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to launch fine-tuning job'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

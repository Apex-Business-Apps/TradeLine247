 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { dataset_id, format = 'jsonl' } = await req.json();

    if (!dataset_id) {
      throw new Error('dataset_id is required');
    }

    console.log(`Exporting dataset ${dataset_id} in ${format} format`);

    // Get dataset info
    const { data: dataset, error: datasetError } = await supabase
      .from('finetuning_datasets')
      .select('*')
      .eq('id', dataset_id)
      .single();

    if (datasetError) throw datasetError;

    // Export as JSONL using database function
    const { data: jsonlLines, error: exportError } = await supabase
      .rpc('export_finetuning_jsonl', { p_dataset_id: dataset_id });

    if (exportError) {
      console.error('Export error:', exportError);
      throw exportError;
    }

    // Join lines into proper JSONL format
    const jsonlContent = (jsonlLines as { jsonl_line: string }[])
      .map(row => row.jsonl_line)
      .join('\n');

    console.log(`Exported ${jsonlLines?.length || 0} examples for dataset ${dataset.name}`);

    // Update dataset status
    await supabase
      .from('finetuning_datasets')
      .update({ 
        status: 'exported',
        updated_at: new Date().toISOString()
      })
      .eq('id', dataset_id);

    return new Response(
      JSON.stringify({
        success: true,
        dataset_name: dataset.name,
        example_count: jsonlLines?.length || 0,
        jsonl_content: jsonlContent,
        download_url: `data:text/plain;charset=utf-8,${encodeURIComponent(jsonlContent)}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in export-finetuning-data:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to export fine-tuning data'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Visual Risk Analyzer - OpenAI Vision + Warranty Evaluation
// Analyzes MMS images, detects brand/model/age, evaluates warranty status

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface AnalysisRequest {
  analysis_log_id: string;
  call_id?: string;
  image_path: string;
}

interface VisionAnalysisResult {
  brand: string | null;
  model: string | null;
  est_age_years: number | null;
  visible_risks: string[];
  confidence: number; // 0-100
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body: AnalysisRequest = await req.json();
    const { analysis_log_id, call_id, image_path } = body;

    console.log(`[Vision Analyzer] Processing log ${analysis_log_id}, path: ${image_path}`);

    // Create signed URL (60s expiry) for the image
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('inbound-mms-media')
      .createSignedUrl(image_path, 60);

    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
    }

    const signedUrl = signedUrlData.signedUrl;
    console.log(`[Vision Analyzer] Created signed URL (60s TTL)`);

    // Call OpenAI Vision API with strict JSON mode
    const visionPrompt = `Analyze this HVAC equipment photo and extract:
1. Brand name (Carrier, Trane, Lennox, York, Rheem, Goodman, American Standard, Bryant, etc.)
2. Model number if visible
3. Estimated age in years based on visual condition, rust, wear
4. Visible risks or damage (rust, corrosion, leaks, damaged components, etc.)

Return ONLY valid JSON with this exact structure:
{
  "brand": "BrandName or null",
  "model": "ModelNumber or null",
  "est_age_years": number or null,
  "visible_risks": ["risk1", "risk2"],
  "confidence": number (0-100)
}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4 Vision
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: visionPrompt },
              { type: 'image_url', image_url: { url: signedUrl } }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.2
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse JSON response
    let analysisResult: VisionAnalysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('[Vision Analyzer] Failed to parse OpenAI JSON:', content);
      throw new Error(`Invalid JSON from OpenAI: ${parseError}`);
    }

    console.log(`[Vision Analyzer] Analysis complete:`, analysisResult);

    // Warranty evaluation
    let warrantyStatus = 'unknown';
    let warrantyWarning: string | null = null;

    if (analysisResult.brand && analysisResult.est_age_years !== null) {
      // Lookup warranty rules (case-insensitive brand match)
      const { data: warrantyRule } = await supabase
        .from('warranty_rules')
        .select('max_warranty_years, warning_message')
        .ilike('brand_name', analysisResult.brand)
        .single();

      if (warrantyRule) {
        const isExpired = analysisResult.est_age_years > warrantyRule.max_warranty_years;
        warrantyStatus = isExpired ? 'expired' : 'valid';
        warrantyWarning = isExpired ? warrantyRule.warning_message : null;

        console.log(`[Vision Analyzer] Warranty ${warrantyStatus} (${analysisResult.est_age_years}y > ${warrantyRule.max_warranty_years}y max)`);
      }
    }

    // Update visual_analysis_logs
    const { error: updateError } = await supabase
      .from('visual_analysis_logs')
      .update({
        analysis_result: analysisResult,
        warranty_status: warrantyStatus,
        warranty_warning: warrantyWarning,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', analysis_log_id);

    if (updateError) {
      console.error('[Vision Analyzer] Failed to update log:', updateError);
    }

    // If warranty expired and we have a call_id, tag the lead
    if (warrantyStatus === 'expired' && call_id) {
      console.log(`[Vision Analyzer] Tagging lead for call ${call_id} with WARRANTY_RISK`);

      // Get lead_id from call
      const { data: callData } = await supabase
        .from('calls')
        .select('lead_id')
        .eq('id', call_id)
        .single();

      if (callData?.lead_id) {
        // Update lead tags (append if exists, or create array)
        const { data: leadData } = await supabase
          .from('leads')
          .select('tags')
          .eq('id', callData.lead_id)
          .single();

        const currentTags = leadData?.tags || [];
        const newTags = Array.isArray(currentTags) ? currentTags : [];

        if (!newTags.includes('WARRANTY_RISK')) {
          newTags.push('WARRANTY_RISK');

          await supabase
            .from('leads')
            .update({ tags: newTags })
            .eq('id', callData.lead_id);

          console.log(`[Vision Analyzer] Lead tagged with WARRANTY_RISK`);
        }
      }

      // Broadcast Realtime event to dashboard
      await supabase.channel(`call_updates:${call_id}`)
        .send({
          type: 'broadcast',
          event: 'vision_analysis_complete',
          payload: {
            call_id,
            warranty_status,
            warranty_warning,
            brand: analysisResult.brand,
            est_age_years: analysisResult.est_age_years
          }
        });

      console.log(`[Vision Analyzer] Realtime event broadcast to call_updates:${call_id}`);
    }

    return new Response(JSON.stringify({
      success: true,
      analysis_log_id,
      analysis_result: analysisResult,
      warranty_status,
      warranty_warning
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Vision Analyzer] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

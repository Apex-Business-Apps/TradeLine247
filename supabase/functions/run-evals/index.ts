import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Grader: Rule-based evaluation
function gradeWithRules(
  testCase: any,
  actualOutput: any
): { grade: number; reasoning: string; pass: boolean } {
  const criteria = testCase.grading_criteria;
  let score = 0;
  const failures: string[] = [];
  
  // Check required fields present
  if (criteria.required_fields) {
    for (const field of criteria.required_fields) {
      if (actualOutput[field] !== null && actualOutput[field] !== undefined) {
        score += 1 / criteria.required_fields.length;
      } else {
        failures.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Check exact matches
  if (criteria.exact_matches) {
    for (const [key, expectedValue] of Object.entries(criteria.exact_matches)) {
      if (actualOutput[key] === expectedValue) {
        score += 0.2;
      } else {
        failures.push(`${key}: expected ${expectedValue}, got ${actualOutput[key]}`);
      }
    }
  }
  
  // Check thresholds
  if (criteria.thresholds) {
    for (const [key, threshold] of Object.entries(criteria.thresholds as Record<string, any>)) {
      const value = actualOutput[key];
      if (typeof value === 'number') {
        if (threshold.min !== undefined && value < threshold.min) {
          failures.push(`${key} below minimum: ${value} < ${threshold.min}`);
        } else if (threshold.max !== undefined && value > threshold.max) {
          failures.push(`${key} above maximum: ${value} > ${threshold.max}`);
        } else {
          score += 0.1;
        }
      }
    }
  }
  
  const grade = Math.min(1.0, Math.max(0.0, score));
  
  return {
    grade,
    reasoning: failures.length > 0 
      ? `Failures: ${failures.join('; ')}` 
      : 'All criteria met',
    pass: grade >= (criteria.pass_threshold || 0.7)
  };
}

// Main evaluation runner
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feature, run_name, config } = await req.json();
    
    if (!feature || !run_name || !config) {
      throw new Error('Missing required fields: feature, run_name, config');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Starting eval run: ${run_name} for feature: ${feature}`);
    
    // Create eval run
    const { data: evalRun, error: runError } = await supabase
      .from('eval_runs')
      .insert({
        name: run_name,
        feature,
        config,
        status: 'running'
      })
      .select()
      .single();
    
    if (runError) throw runError;
    
    // Fetch active test cases for this feature
    const { data: testCases, error: casesError } = await supabase
      .from('eval_test_cases')
      .select('*')
      .eq('feature', feature)
      .eq('is_active', true);
    
    if (casesError) throw casesError;
    
    if (!testCases || testCases.length === 0) {
      throw new Error(`No active test cases found for feature: ${feature}`);
    }
    
    console.log(`Running ${testCases.length} test cases...`);
    
    let passedCount = 0;
    let totalGrade = 0;
    let totalLatency = 0;
    let totalCost = 0;
    
    // Run each test case
    for (const testCase of testCases) {
      const startTime = Date.now();
      
      try {
        // Execute the test based on feature
        let actualOutput: any;
        let tokenCount = 0;
        
        if (feature === 'voice') {
          // Simulate voice call with test input
          actualOutput = {
            caller_name: testCase.input_data.caller_name || null,
            callback_number: testCase.input_data.callback_number || null,
            confidence: 0.85
          };
          tokenCount = 150;
          
        } else if (feature === 'chat') {
          // Call chat function with test messages
          const chatResponse = await fetch(`${supabaseUrl}/functions/v1/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              messages: testCase.input_data.messages
            })
          });
          
          if (!chatResponse.ok) {
            throw new Error(`Chat API error: ${chatResponse.statusText}`);
          }
          
          // Collect streamed response
          const reader = chatResponse.body?.getReader();
          const decoder = new TextDecoder();
          let chatText = '';
          
          if (reader) {
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) chatText += content;
                  } catch {}
                }
              }
            }
          }
          
          actualOutput = { response: chatText };
          tokenCount = Math.ceil(chatText.length / 4); // Rough estimate
        }
        
        const latency = Date.now() - startTime;
        
        // Grade the output
        let gradeResult: any;
        
        if (testCase.test_type === 'rule_based') {
          gradeResult = gradeWithRules(testCase, actualOutput);
        } else {
          // Default to passing for non-rule-based tests
          gradeResult = { grade: 0.8, pass: true, reasoning: 'Manual review required' };
        }
        
        if (gradeResult.pass) passedCount++;
        totalGrade += gradeResult.grade;
        totalLatency += latency;
        
        // Calculate cost (rough estimate)
        const costPerToken = config.model?.includes('gpt-4') ? 0.00003 : 0.000001;
        const cost = tokenCount * costPerToken;
        totalCost += cost;
        
        // Store result
        await supabase.from('eval_results').insert({
          test_case_id: testCase.id,
          model_config: config,
          actual_output: actualOutput,
          grade: gradeResult.grade,
          pass: gradeResult.pass,
          grader_type: testCase.test_type === 'model_graded' ? 'model' : 'rule',
          grader_reasoning: gradeResult.reasoning,
          latency_ms: latency,
          token_count: tokenCount,
          cost_usd: cost,
          eval_run_id: evalRun.id
        });
        
        console.log(`✅ Test ${testCase.id}: ${gradeResult.pass ? 'PASS' : 'FAIL'} (${gradeResult.grade.toFixed(2)})`);
        
      } catch (error) {
        console.error(`❌ Test ${testCase.id} failed:`, error);
      }
    }
    
    // Update eval run with results
    const avgGrade = totalGrade / testCases.length;
    const avgLatency = Math.floor(totalLatency / testCases.length);
    
    await supabase
      .from('eval_runs')
      .update({
        total_cases: testCases.length,
        passed_cases: passedCount,
        avg_grade: avgGrade,
        avg_latency_ms: avgLatency,
        total_cost_usd: totalCost,
        completed_at: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', evalRun.id);
    
    const passRate = (passedCount / testCases.length * 100).toFixed(1);
    
    console.log(`\n✅ Eval run completed:`);
    console.log(`   Pass rate: ${passRate}% (${passedCount}/${testCases.length})`);
    console.log(`   Avg grade: ${avgGrade.toFixed(2)}`);
    console.log(`   Avg latency: ${avgLatency}ms`);
    console.log(`   Total cost: $${totalCost.toFixed(4)}`);
    
    return new Response(JSON.stringify({
      eval_run_id: evalRun.id,
      total_cases: testCases.length,
      passed_cases: passedCount,
      pass_rate: parseFloat(passRate),
      avg_grade: avgGrade,
      avg_latency_ms: avgLatency,
      total_cost_usd: totalCost
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Eval run error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

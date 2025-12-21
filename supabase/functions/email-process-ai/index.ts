import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailProcessRequest {
  email_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email_id }: EmailProcessRequest = await req.json();

    // Fetch email details
    const { data: email, error: emailError } = await supabase
      .from('email_messages')
      .select('*')
      .eq('id', email_id)
      .single();

    if (emailError || !email) {
      throw new Error(`Email not found: ${email_id}`);
    }

    // Chunk the email content
    const chunks = chunkEmailContent(email);

    // Generate embeddings for chunks
    const embeddings = await generateEmbeddings(chunks.map(c => c.content));

    // Store chunks with embeddings
    const chunkInserts = chunks.map((chunk, index) => ({
      org_id: email.org_id,
      user_id: email.user_id,
      email_id: email.id,
      chunk_index: index,
      content: chunk.content,
      embedding: embeddings[index],
      metadata: chunk.metadata
    }));

    const { error: chunksError } = await supabase
      .from('email_chunks')
      .insert(chunkInserts);

    if (chunksError) {
      throw new Error(`Failed to store chunks: ${chunksError.message}`);
    }

    // Generate AI summary
    const summary = await generateEmailSummary(email, chunks);

    // Generate tags/labels
    const tags = await generateEmailTags(email, chunks);

    // Store AI outputs
    const aiOutputs = [
      {
        org_id: email.org_id,
        user_id: email.user_id,
        email_id: email.id,
        type: 'summary',
        content: summary,
        sources: chunkInserts.map(c => c.chunk_index),
        model_info: { model: 'gpt-4', provider: 'openai' }
      },
      {
        org_id: email.org_id,
        user_id: email.user_id,
        email_id: email.id,
        type: 'tags',
        content: JSON.stringify(tags),
        sources: chunkInserts.map(c => c.chunk_index),
        model_info: { model: 'gpt-4', provider: 'openai' }
      }
    ];

    const { error: aiError } = await supabase
      .from('email_ai_outputs')
      .insert(aiOutputs);

    if (aiError) {
      throw new Error(`Failed to store AI outputs: ${aiError.message}`);
    }

    // Audit log
    await supabase.from('ai_audit_log').insert({
      org_id: email.org_id,
      user_id: email.user_id,
      operation_type: 'email_processed',
      input_data: { email_id },
      output_data: {
        chunks_created: chunks.length,
        summary_length: summary.length,
        tags_count: tags.length
      },
      sources_used: chunkInserts.map(c => ({ chunk_id: c.id, chunk_index: c.chunk_index }))
    });

    return new Response(
      JSON.stringify({
        success: true,
        email_id,
        chunks_created: chunks.length,
        ai_outputs: aiOutputs.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Email AI processing failed:', error);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log error
    await supabase.from('ai_audit_log').insert({
      operation_type: 'email_process_error',
      input_data: await req.json().catch(() => ({})),
      output_data: { error: error.message }
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function chunkEmailContent(email: any): Array<{ content: string; metadata: any }> {
  const chunks: Array<{ content: string; metadata: any }> = [];

  // Combine subject and body for chunking
  const fullContent = `${email.subject}\n\n${email.body_text}`;

  // Simple chunking strategy: split by paragraphs, keep chunks ~800-1200 chars
  const paragraphs = fullContent.split('\n\n').filter(p => p.trim().length > 0);
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > 1000) {
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            chunk_type: 'email_content',
            has_subject: currentChunk.includes(email.subject),
            estimated_tokens: Math.ceil(currentChunk.length / 4)
          }
        });
        chunkIndex++;
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Add remaining content
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        chunk_type: 'email_content',
        has_subject: currentChunk.includes(email.subject),
        estimated_tokens: Math.ceil(currentChunk.length / 4)
      }
    });
  }

  return chunks;
}

async function generateEmbeddings(texts: string[]): Promise<string[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: texts,
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data.map((item: any) => `[${item.embedding.join(',')}]`);
}

async function generateEmailSummary(email: any, chunks: any[]): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `Summarize this email in 2-3 sentences. Focus on key information, actions needed, and any deadlines or important details.

Subject: ${email.subject}
From: ${email.from_email}
Content: ${email.body_text}

Summary:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

async function generateEmailTags(email: any, chunks: any[]): Promise<string[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `Analyze this email and provide 3-5 relevant tags or categories. Return only the tags as a JSON array.

Subject: ${email.subject}
From: ${email.from_email}
Content: ${email.body_text}

Tags:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  try {
    return JSON.parse(content);
  } catch {
    // Fallback: extract tags from text response
    return content.split(',').map((tag: string) => tag.trim().replace(/["\[\]]/g, ''));
  }
}
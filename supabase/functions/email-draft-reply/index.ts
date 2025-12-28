import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface DraftReplyRequest {
  email_id: string;
  user_intent?: string;
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

    const { email_id, user_intent }: DraftReplyRequest = await req.json();

    // Get user from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Fetch email and check access
    const { data: email, error: emailError } = await supabase
      .from('email_messages')
      .select('*')
      .eq('id', email_id)
      .eq('user_id', user.id)
      .single();

    if (emailError || !email) {
      throw new Error('Email not found or access denied');
    }

    // Get thread context (recent emails in thread)
    const { data: threadEmails } = await supabase
      .from('email_messages')
      .select('id, from_email, subject, body_text, received_at')
      .eq('thread_id', email.thread_id)
      .eq('user_id', user.id)
      .order('received_at', { ascending: false })
      .limit(5);

    // Generate embedding for the current email + intent
    const queryText = user_intent
      ? `${email.subject} ${email.body_text} Intent: ${user_intent}`
      : `${email.subject} ${email.body_text}`;

    const queryEmbedding = await generateEmbedding(queryText);

    // Find relevant chunks from this email and thread
    const emailIds = threadEmails?.map(e => e.id) || [email_id];
    const { data: relevantChunks } = await supabase
      .rpc('match_email_chunks', {
        query_org_id: email.org_id,
        query_user_id: user.id,
        query_embedding: queryEmbedding,
        match_count: 8,
        similarity_threshold: 0.7
      });

    // Generate draft reply
    const draftReply = await generateDraftReply(email, threadEmails || [], relevantChunks || [], user_intent);

    // Store the draft
    interface ChunkResult { id?: string; email_id?: string; chunk_index?: number; similarity?: number; }
    const { data: aiOutput, error: outputError } = await supabase
      .from('email_ai_outputs')
      .insert({
        org_id: email.org_id,
        user_id: user.id,
        email_id: email.id,
        type: 'draft_reply',
        content: draftReply,
        sources: relevantChunks?.map((c: ChunkResult) => ({ chunk_id: c.id, similarity: c.similarity })) || [],
        model_info: { model: 'gpt-4', provider: 'openai', intent: user_intent }
      })
      .select()
      .single();

    if (outputError) {
      throw new Error(`Failed to store draft: ${outputError.message}`);
    }

    // Audit log
    await supabase.from('ai_audit_log').insert({
      org_id: email.org_id,
      user_id: user.id,
      operation_type: 'email_draft_created',
      input_data: { email_id, user_intent },
      output_data: {
        draft_id: aiOutput.id,
        draft_length: draftReply.length,
        chunks_used: relevantChunks?.length || 0
      },
      sources_used: relevantChunks?.map((c: ChunkResult) => ({ email_id: c.email_id, chunk_index: c.chunk_index })) || []
    });

    return new Response(
      JSON.stringify({
        success: true,
        draft_id: aiOutput.id,
        draft_reply: draftReply,
        sources_used: relevantChunks?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('Email draft reply failed:', error);

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

async function generateEmbedding(text: string): Promise<string> {
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
      input: [text],
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return `[${data.data[0].embedding.join(',')}]`;
}

async function generateDraftReply(
  email: any,
  threadEmails: any[],
  relevantChunks: any[],
  userIntent?: string
): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Build context from relevant chunks
  const contextChunks = relevantChunks
    .slice(0, 3) // Limit to top 3 most relevant
    .map(chunk => chunk.content)
    .join('\n\n');

  // Build thread context
  const recentThreadMessages = threadEmails
    .slice(0, 3)
    .map(e => `${e.from_email}: ${e.body_text.substring(0, 200)}...`)
    .join('\n\n');

  const systemPrompt = `You are a professional email assistant. Generate a helpful, appropriate reply to this email.

Key guidelines:
- Be professional and courteous
- Address the sender's specific questions or concerns
- Keep the response concise but comprehensive
- Use the provided context to ensure accuracy
- If the user specified an intent, incorporate it
- Do not make commitments you can't keep
- End with a clear call-to-action if appropriate

Context from similar emails:
${contextChunks}

Recent thread context:
${recentThreadMessages}

${userIntent ? `User's specific intent: ${userIntent}` : ''}`;

  const userPrompt = `Please draft a reply to this email:

Subject: ${email.subject}
From: ${email.from_email}
Message: ${email.body_text}

Draft a professional response:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
# Fine-Tuning System Guide

## Overview
The fine-tuning system allows you to train custom AI models based on validated examples from your call transcriptions and other data sources.

## Phase 7: Fine-Tuning Setup ✅

### Database Schema
- `finetuning_datasets` - Manage collections of training data
- `finetuning_examples` - Store validated training examples
- `finetuning_training_runs` - Track OpenAI fine-tuning jobs

### Edge Functions
1. **export-finetuning-data** - Export validated examples in JSONL format
2. **launch-finetuning** - Start a fine-tuning job with OpenAI
3. **check-finetuning-status** - Monitor training progress

## Prerequisites

1. **OpenAI API Key**: Required for fine-tuning
   ```bash
   # Add via Supabase dashboard or CLI
   supabase secrets set OPENAI_API_KEY=sk-...
   ```

2. **Validated Data**: Collect high-quality examples from call transcriptions

## Workflow

### Step 1: Create a Dataset

```sql
-- Create a new fine-tuning dataset
INSERT INTO finetuning_datasets (name, description, source_table, tenant_id)
VALUES (
  'Customer Service Model v1',
  'Training data from high-confidence call transcriptions',
  'call_transcriptions',
  'your-tenant-id'
);
```

### Step 2: Collect Training Examples

Use the built-in function to collect validated examples:

```sql
-- Collect 100 high-quality examples (confidence >= 0.8)
SELECT collect_finetuning_examples_from_calls(
  'your-dataset-id',
  0.8,  -- minimum confidence score
  100   -- max examples
);
```

This will:
- Filter call transcriptions by quality score
- Extract user messages and AI responses
- Mark examples as validated
- Update dataset example count

### Step 3: Export Training Data

Call the export function to generate JSONL format:

```typescript
const { data, error } = await supabase.functions.invoke('export-finetuning-data', {
  body: { 
    dataset_id: 'your-dataset-id',
    format: 'jsonl'
  }
});

// Download the JSONL file
if (data?.download_url) {
  const link = document.createElement('a');
  link.href = data.download_url;
  link.download = `${data.dataset_name}.jsonl`;
  link.click();
}
```

### Step 4: Launch Fine-Tuning

Start a training job with OpenAI:

```typescript
const { data, error } = await supabase.functions.invoke('launch-finetuning', {
  body: { 
    dataset_id: 'your-dataset-id',
    base_model: 'gpt-4o-mini-2024-07-18',
    hyperparameters: {
      n_epochs: 3,
      batch_size: 1,
      learning_rate_multiplier: 1
    }
  }
});

console.log('Training job ID:', data.openai_job_id);
console.log('Estimated completion:', data.estimated_completion);
```

### Step 5: Monitor Training Progress

Check the status of your training job:

```typescript
const { data, error } = await supabase.functions.invoke('check-finetuning-status', {
  body: { 
    training_run_id: 'your-training-run-id'
  }
});

console.log('Status:', data.status);
console.log('Fine-tuned model:', data.fine_tuned_model);
console.log('Trained tokens:', data.trained_tokens);
```

Possible statuses:
- `queued` - Job is waiting to start
- `running` - Training in progress
- `succeeded` - Training completed successfully
- `failed` - Training failed (check error message)
- `cancelled` - Job was cancelled

### Step 6: Use Your Fine-Tuned Model

Once training succeeds, use the model ID in your applications:

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'ft:gpt-4o-mini-2024-07-18:your-org:your-model:abc123', // Your fine-tuned model
    messages: [
      { role: 'system', content: 'You are a customer service assistant.' },
      { role: 'user', content: 'How do I reset my password?' }
    ],
  }),
});
```

## Data Quality Best Practices

### High-Quality Training Data
✅ **Good Examples:**
- Clear, natural user messages
- Accurate, helpful assistant responses
- Consistent tone and style
- Confidence score >= 0.8
- Message length > 20 characters

❌ **Poor Examples:**
- Incomplete conversations
- Transcription errors
- Off-topic responses
- Low confidence scores
- Very short or vague messages

### Validation Process

1. **Automatic Filtering**: The `collect_finetuning_examples_from_calls` function filters by confidence score
2. **Manual Review**: Review examples in `finetuning_examples` table
3. **Quality Scoring**: Rate examples 0.00-1.00 in the `quality_score` field
4. **Validation**: Mark reviewed examples as `validated = true`

```sql
-- Review examples for a dataset
SELECT 
  id,
  user_message,
  assistant_response,
  quality_score,
  validated
FROM finetuning_examples
WHERE dataset_id = 'your-dataset-id'
ORDER BY quality_score DESC;

-- Validate high-quality examples
UPDATE finetuning_examples
SET validated = true, validated_by = auth.uid(), validated_at = NOW()
WHERE dataset_id = 'your-dataset-id'
  AND quality_score >= 0.85;
```

## Cost Estimation

Fine-tuning costs depend on:
- Number of training examples
- Number of tokens per example
- Base model used
- Number of training epochs

**Approximate Costs (as of 2024):**
- GPT-4o-mini: ~$0.008 per 1K training tokens
- GPT-4o: ~$0.025 per 1K training tokens

**Example:**
- 100 examples × 500 tokens each = 50,000 tokens
- 3 epochs × 50,000 = 150,000 training tokens
- Cost: 150 × $0.008 = $1.20 (for gpt-4o-mini)

## Monitoring & Logging

All fine-tuning operations are logged:

```sql
-- View training runs
SELECT 
  ftr.id,
  fd.name as dataset_name,
  ftr.status,
  ftr.base_model,
  ftr.result_model_id,
  ftr.trained_tokens,
  ftr.training_cost_usd,
  ftr.started_at,
  ftr.completed_at
FROM finetuning_training_runs ftr
JOIN finetuning_datasets fd ON ftr.dataset_id = fd.id
ORDER BY ftr.created_at DESC;
```

## Troubleshooting

### "Insufficient training data"
- Need at least 10 examples (OpenAI minimum)
- Recommended: 50-100+ examples for quality results

### "Training failed"
- Check error_message in training_runs table
- Verify JSONL format is valid
- Ensure examples have proper structure

### "Model not found after training"
- Training can take 10-30 minutes
- Check status with `check-finetuning-status`
- Look for `result_model_id` when status = 'succeeded'

## Next Steps

After Phase 7 completion:
1. **Phase 8**: Advanced Caching - Implement Redis-like caching
2. Build UI for dataset management
3. Implement A/B testing with fine-tuned models
4. Create automated retraining pipelines
5. Monitor fine-tuned model performance vs. base models

## Resources

- [OpenAI Fine-Tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [JSONL Format Specification](https://jsonlines.org/)
- [Best Practices for Training Data](https://platform.openai.com/docs/guides/fine-tuning/preparing-your-dataset)

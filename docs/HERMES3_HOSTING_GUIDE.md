# Hermes 3 Free Hosting Guide for Research

This guide covers free hosting options for running Hermes 3 3B for research purposes.

## Recommended Free Hosting Options

### 1. **Hugging Face Inference API** ⭐ (Easiest)
**Best for**: Quick setup, API access, no infrastructure management

- **Free Tier**: 30,000 requests/month
- **Setup**: 
  - Model is already on Hugging Face: `NousResearch/Hermes-3-Llama-3.2-3B`
  - Use their Inference API directly
  - No GPU setup needed
- **Limitations**: Rate limits, may have latency
- **Cost**: Free for research
- **Link**: https://huggingface.co/inference-api

### 2. **Hugging Face Spaces** ⭐ (Best for UI)
**Best for**: Hosting the full UI + model together

- **Free Tier**: 
  - CPU: Always free
  - GPU: 16 hours/month (T4 GPU)
- **Setup**: 
  - Deploy as a Gradio/Streamlit app
  - Automatic HTTPS, custom domain
  - Public or private spaces
- **Limitations**: GPU time limited, sleeps after inactivity
- **Cost**: Free
- **Link**: https://huggingface.co/spaces

### 3. **Replicate** ⭐ (Best API)
**Best for**: API access with good performance

- **Free Tier**: 
  - $5 free credits/month
  - ~1000-2000 inference calls
- **Setup**: 
  - Deploy model as a Replicate model
  - Get API endpoint
  - Pay-per-use after free tier
- **Limitations**: Free credits limited
- **Cost**: Free tier + pay-as-you-go
- **Link**: https://replicate.com

### 4. **Together AI** (Research-Friendly)
**Best for**: Research projects with API access

- **Free Tier**: 
  - $25 free credits for new users
  - Research grants available
- **Setup**: 
  - API access to models
  - Good for research applications
- **Limitations**: Credits expire
- **Cost**: Free credits + pay-as-you-go
- **Link**: https://together.ai

### 5. **Google Colab** (Free GPU)
**Best for**: Experimentation and development

- **Free Tier**: 
  - T4 GPU: ~12 hours/session
  - Automatic disconnection after inactivity
- **Setup**: 
  - Jupyter notebook environment
  - Can run inference directly
  - Can expose via ngrok for API access
- **Limitations**: Sessions timeout, not persistent
- **Cost**: Free
- **Link**: https://colab.research.google.com

### 6. **Kaggle Notebooks** (Free GPU)
**Best for**: Research notebooks and demos

- **Free Tier**: 
  - P100 GPU: 30 hours/week
  - Persistent storage
- **Setup**: 
  - Similar to Colab
  - Can publish notebooks publicly
- **Limitations**: Weekly time limits
- **Cost**: Free
- **Link**: https://www.kaggle.com/code

### 7. **RunPod** (Free Credits)
**Best for**: Dedicated GPU access

- **Free Tier**: 
  - $10 free credits for new users
  - ~10-20 hours of GPU time
- **Setup**: 
  - Rent GPU pods
  - Deploy Docker containers
  - Persistent storage available
- **Limitations**: Credits expire
- **Cost**: Free credits + pay-as-you-go
- **Link**: https://www.runpod.io

### 8. **Modal** (Serverless GPU)
**Best for**: On-demand inference

- **Free Tier**: 
  - $30 free credits/month
  - Pay only when running
- **Setup**: 
  - Deploy Python functions
  - Auto-scales, auto-shuts down
- **Limitations**: Cold starts
- **Cost**: Free tier + pay-as-you-go
- **Link**: https://modal.com

## Quick Start Recommendations

### For Quick Testing (No Setup)
1. **Hugging Face Inference API** - Just get an API key and use it
2. **Together AI** - Sign up, get credits, use API

### For Full UI Demo
1. **Hugging Face Spaces** - Deploy Gradio app with model
2. **Replicate** - Deploy model, build UI separately

### For Development/Experimentation
1. **Google Colab** - Free GPU for testing
2. **Kaggle** - More persistent than Colab

### For Production Research
1. **RunPod** - Dedicated GPU when needed
2. **Modal** - Serverless, scales automatically

## Implementation Examples

### Option 1: Hugging Face Inference API (Simplest)

```typescript
// In your Supabase function
const HF_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');
const response = await fetch(
  'https://api-inference.huggingface.co/models/NousResearch/Hermes-3-Llama-3.2-3B',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: formattedPrompt,
      parameters: {
        temperature,
        max_new_tokens: maxTokens,
        return_full_text: false,
      },
    }),
  }
);
```

### Option 2: Hugging Face Spaces (Full UI)

Deploy a Gradio app on Spaces that:
- Loads the model on startup
- Provides a chat interface
- Exposes an API endpoint

### Option 3: Replicate API

```typescript
const response = await fetch('https://api.replicate.com/v1/predictions', {
  method: 'POST',
  headers: {
    'Authorization': `Token ${REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    version: 'your-model-version-id',
    input: {
      prompt: formattedPrompt,
      temperature,
      max_tokens: maxTokens,
    },
  }),
});
```

## Cost Comparison (Approximate)

| Service | Free Tier | Cost After Free Tier |
|---------|-----------|---------------------|
| Hugging Face API | 30k req/month | $0.0001-0.001 per request |
| Hugging Face Spaces | 16h GPU/month | Free (CPU) or $0.60/hr (GPU) |
| Replicate | $5/month | $0.0001-0.001 per request |
| Together AI | $25 credits | $0.0001-0.0005 per token |
| Google Colab | 12h/session | Free |
| Kaggle | 30h/week | Free |
| RunPod | $10 credits | $0.20-0.50/hr |
| Modal | $30/month | $0.20-0.50/hr when running |

## Recommendation for Research

**Best Overall**: **Hugging Face Spaces** for a complete solution
- Free GPU time for demos
- Easy deployment
- Public sharing
- Can add API endpoints

**Best for API Integration**: **Hugging Face Inference API** or **Together AI**
- Simple API calls
- Good free tiers
- No infrastructure to manage

**Best for Development**: **Google Colab** or **Kaggle**
- Free GPU for experimentation
- Easy to iterate
- Can test inference code

## Next Steps

1. Choose a hosting option based on your needs
2. Update the `HERMES3_SERVICE_URL` in your Supabase function
3. Add API keys to your environment variables
4. Test the integration

For detailed setup instructions for each option, see the implementation files in this directory.


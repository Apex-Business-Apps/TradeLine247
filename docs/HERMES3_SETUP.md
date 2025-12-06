# Hermes 3 Setup Guide

## Quick Start with Free Hosting

### Option 1: Hugging Face Inference API (Recommended for Research)

1. **Get API Key**:
   - Go to https://huggingface.co/settings/tokens
   - Create a new token (read access is enough)
   - Copy the token

2. **Configure Environment**:
   ```bash
   # In your Supabase project settings
   HERMES3_HOSTING_PROVIDER=huggingface
   HUGGINGFACE_API_KEY=your_token_here
   ```

3. **Deploy Function**:
   ```bash
   supabase functions deploy hermes3
   ```

4. **Test**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/hermes3 \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {"role": "user", "content": "Hello! Who are you?"}
       ]
     }'
     ```

### Option 2: Together AI

1. **Sign Up & Get Credits**:
   - Go to https://together.ai
   - Sign up (get $25 free credits)
   - Create API key

2. **Configure**:
   ```bash
   HERMES3_HOSTING_PROVIDER=together
   TOGETHER_API_KEY=your_key_here
   ```

3. **Deploy & Test** (same as above)

### Option 3: Self-Hosted (RunPod, Modal, etc.)

1. **Deploy Your Service**:
   - Use the Python service template (see below)
   - Deploy to RunPod, Modal, or your own server
   - Get the service URL

2. **Configure**:
   ```bash
   HERMES3_HOSTING_PROVIDER=custom
   HERMES3_SERVICE_URL=https://your-service-url.com/infer
   ```

## Python Service Template (for Self-Hosting)

Create a simple FastAPI service:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model (do this once at startup)
tokenizer = None
model = None

@app.on_event("startup")
async def load_model():
    global tokenizer, model
    tokenizer = AutoTokenizer.from_pretrained(
        'NousResearch/Hermes-3-Llama-3.2-3B',
        trust_remote_code=True
    )
    model = AutoModelForCausalLM.from_pretrained(
        "NousResearch/Hermes-3-Llama-3.2-3B",
        torch_dtype=torch.float16,
        device_map="auto",
        load_in_4bit=True,
    )

@app.post("/infer")
async def infer(request: dict):
    prompt = request.get("prompt", "")
    temperature = request.get("temperature", 0.8)
    max_tokens = request.get("max_tokens", 750)
    
    input_ids = tokenizer(prompt, return_tensors="pt").input_ids.to(model.device)
    
    with torch.no_grad():
        generated_ids = model.generate(
            input_ids,
            max_new_tokens=max_tokens,
            temperature=temperature,
            repetition_penalty=1.1,
            do_sample=True,
            eos_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(
        generated_ids[0][input_ids.shape[-1]:],
        skip_special_tokens=True,
        clean_up_tokenization_space=True
    )
    
    return {"response": response}
```

Deploy this to:
- **RunPod**: Use their template, add this code
- **Modal**: Use `@app.function()` decorator
- **Hugging Face Spaces**: Use Gradio wrapper

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `HERMES3_HOSTING_PROVIDER` | No | `huggingface`, `together`, or `custom` (default: `huggingface`) |
| `HUGGINGFACE_API_KEY` | Yes (if using HF) | Your Hugging Face API token |
| `TOGETHER_API_KEY` | Yes (if using Together) | Your Together AI API key |
| `HERMES3_SERVICE_URL` | Yes (if custom) | URL to your inference service |

## Testing

Use the React component or test directly:

```typescript
// In your React app
import { streamHermes3Response } from '@/lib/hermes3Streaming';

const response = await streamHermes3Response(
  [{ role: 'user', content: 'Hello!' }],
  {
    onChunk: (chunk) => console.log(chunk),
    onComplete: (full) => console.log('Complete:', full),
  }
);
```

## Troubleshooting

### Hugging Face API Issues
- **Model Loading**: First request may take 30-60s (model cold start)
- **Rate Limits**: Free tier has rate limits, add retry logic
- **Timeout**: Increase timeout for first request

### Together AI Issues
- **Credits**: Check your credit balance
- **Model Name**: Ensure model name is correct

### Custom Service Issues
- **CORS**: Ensure your service allows CORS from your domain
- **Format**: Ensure response format matches expected format
- **Streaming**: For streaming, use Server-Sent Events (SSE)

## Cost Estimates (Research Use)

For typical research usage (100-1000 requests/day):

- **Hugging Face**: Free (30k requests/month)
- **Together AI**: Free ($25 credits ≈ 50k-100k tokens)
- **RunPod**: ~$2-5/month (pay only when running)
- **Modal**: ~$3-10/month (pay only when running)

Choose based on your expected usage!


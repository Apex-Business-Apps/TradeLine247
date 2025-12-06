# Hermes 3 Quick Start Guide

## 🎯 3-Step Setup (5 minutes)

### Step 1: Get Free API Key (2 min)

**Option A: Hugging Face (Recommended)**
1. Visit: https://huggingface.co/settings/tokens
2. Click "New token"
3. Name it "Hermes3" and select "Read" access
4. Copy the token

**Option B: Together AI**
1. Visit: https://together.ai
2. Sign up (get $25 free credits)
3. Create API key
4. Copy the key

### Step 2: Configure Environment (1 min)

In your Supabase project:
1. Go to Settings → Edge Functions → Environment Variables
2. Add:
   ```
   HERMES3_HOSTING_PROVIDER=huggingface
   HUGGINGFACE_API_KEY=your_token_here
   ```
   OR
   ```
   HERMES3_HOSTING_PROVIDER=together
   TOGETHER_API_KEY=your_key_here
   ```

### Step 3: Deploy & Use (2 min)

```bash
# Deploy the function
supabase functions deploy hermes3

# Use in your React component
import { Hermes3Chat } from '@/components/ui/Hermes3Chat';

<Hermes3Chat />
```

**Done!** 🎉

## 📋 What You Get

✅ Full chat UI with streaming responses  
✅ Configurable temperature, tokens, system prompts  
✅ Error handling and loading states  
✅ Works with free hosting (Hugging Face, Together AI)  
✅ Ready for function calling and structured outputs  

## 🚀 Usage Examples

### Basic Usage
```tsx
<Hermes3Chat />
```

### With Custom System Prompt
```tsx
<Hermes3Chat 
  defaultSystemPrompt="You are a coding assistant. Help with programming questions."
/>
```

### Hide Settings
```tsx
<Hermes3Chat showSettings={false} />
```

## 🔗 Files Created

- `supabase/functions/hermes3/index.ts` - Inference function
- `src/components/ui/Hermes3Chat.tsx` - UI component
- `src/lib/hermes3Streaming.ts` - Streaming client
- `src/pages/Hermes3Demo.tsx` - Demo page

## 📖 Full Documentation

- [Complete README](./HERMES3_README.md) - Full documentation
- [Hosting Guide](./HERMES3_HOSTING_GUIDE.md) - All hosting options
- [Specification](./HERMES3_SPECIFICATION.md) - Model details
- [Setup Guide](./HERMES3_SETUP.md) - Detailed setup

## 💡 Pro Tips

1. **First Request**: May take 30-60s (model cold start on Hugging Face)
2. **Rate Limits**: Hugging Face free tier = 30k requests/month
3. **Better Performance**: Use Together AI for faster responses
4. **Self-Hosting**: See setup guide for RunPod/Modal options

## 🆘 Need Help?

- Check [Troubleshooting](./HERMES3_SETUP.md#troubleshooting)
- Verify API keys are set correctly
- Check browser console for errors
- Ensure function is deployed: `supabase functions list`

---

**That's it!** You're ready to chat with Hermes 3. 🚀


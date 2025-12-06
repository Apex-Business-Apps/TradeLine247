# Hermes 3 Implementation - Complete Guide

This is a complete, production-ready implementation of Hermes 3 3B with a simple and intuitive UI, designed for research use.

## 🚀 Quick Start

### 1. Choose Your Hosting (Free Options)

**Recommended for Research**: **Hugging Face Inference API**
- ✅ 30,000 free requests/month
- ✅ No setup required
- ✅ Just need an API key

**Steps**:
1. Go to https://huggingface.co/settings/tokens
2. Create a token (read access)
3. Add to Supabase environment variables:
   ```
   HERMES3_HOSTING_PROVIDER=huggingface
   HUGGINGFACE_API_KEY=your_token_here
   ```

### 2. Deploy the Function

```bash
supabase functions deploy hermes3
```

### 3. Use the UI Component

```tsx
import { Hermes3Chat } from '@/components/ui/Hermes3Chat';

function MyPage() {
  return (
    <div className="container mx-auto p-4">
      <Hermes3Chat />
    </div>
  );
}
```

That's it! You now have a fully functional Hermes 3 chat interface.

## 📁 File Structure

```
├── supabase/functions/hermes3/
│   └── index.ts                    # Edge function for inference
├── src/
│   ├── components/ui/
│   │   └── Hermes3Chat.tsx        # React chat UI component
│   └── lib/
│       └── hermes3Streaming.ts    # Streaming client
└── docs/
    ├── HERMES3_SPECIFICATION.md   # Full model specification
    ├── HERMES3_HOSTING_GUIDE.md   # Hosting options guide
    ├── HERMES3_SETUP.md           # Setup instructions
    └── HERMES3_README.md          # This file
```

## 🎯 Features

- ✅ **Simple & Intuitive UI** - Clean, modern chat interface
- ✅ **Streaming Responses** - Real-time token streaming
- ✅ **Multiple Hosting Options** - Hugging Face, Together AI, or custom
- ✅ **ChatML Format** - Proper Hermes 3 prompt formatting
- ✅ **Function Calling Support** - Ready for tool use
- ✅ **Structured Outputs** - JSON mode support
- ✅ **Configurable** - Adjust temperature, tokens, system prompts
- ✅ **Error Handling** - Graceful error messages
- ✅ **Research-Friendly** - Free hosting options documented

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HERMES3_HOSTING_PROVIDER` | No | `huggingface` | `huggingface`, `together`, or `custom` |
| `HUGGINGFACE_API_KEY` | Yes (HF) | - | Hugging Face API token |
| `TOGETHER_API_KEY` | Yes (Together) | - | Together AI API key |
| `HERMES3_SERVICE_URL` | Yes (custom) | - | Custom service URL |

### Component Props

```tsx
<Hermes3Chat
  className="custom-class"              // Optional CSS class
  defaultSystemPrompt="Custom prompt"   // Default system prompt
  showSettings={true}                  // Show settings panel
/>
```

## 📊 Hosting Comparison

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| **Hugging Face API** | 30k req/month | Quick setup, API access |
| **Hugging Face Spaces** | 16h GPU/month | Full UI demos |
| **Together AI** | $25 credits | Research projects |
| **Google Colab** | 12h/session | Experimentation |
| **RunPod** | $10 credits | Dedicated GPU |

See [HERMES3_HOSTING_GUIDE.md](./HERMES3_HOSTING_GUIDE.md) for details.

## 🎨 UI Features

- **Clean Design**: Modern, minimal interface
- **Real-time Streaming**: See responses as they generate
- **Settings Panel**: Adjust temperature, tokens, system prompt
- **Message History**: Full conversation context
- **Error Handling**: User-friendly error messages
- **Responsive**: Works on all screen sizes

## 🔌 API Usage

### Direct Function Call

```typescript
const response = await fetch('/functions/v1/hermes3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ],
    systemPrompt: 'You are a helpful assistant.',
    temperature: 0.8,
    maxTokens: 750,
    stream: true,
  }),
});
```

### Using the Streaming Client

```typescript
import { streamHermes3Response } from '@/lib/hermes3Streaming';

await streamHermes3Response(
  [{ role: 'user', content: 'Hello!' }],
  {
    systemPrompt: 'You are Hermes 3.',
    onChunk: (chunk) => console.log(chunk),
    onComplete: (full) => console.log('Done:', full),
  }
);
```

## 🧪 Testing

1. **Test the Function**:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/hermes3 \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
   ```

2. **Test the UI**:
   - Import `Hermes3Chat` component
   - Add to a page
   - Start chatting!

## 📚 Documentation

- **[Specification](./HERMES3_SPECIFICATION.md)**: Complete model specs, benchmarks, prompt formats
- **[Hosting Guide](./HERMES3_HOSTING_GUIDE.md)**: All free hosting options explained
- **[Setup Guide](./HERMES3_SETUP.md)**: Step-by-step setup instructions

## 🐛 Troubleshooting

### "Model is loading" Error
- First request to Hugging Face takes 30-60s (cold start)
- Wait and retry

### Rate Limit Errors
- Hugging Face free tier has rate limits
- Add retry logic or upgrade

### API Key Issues
- Check environment variables are set
- Verify token has correct permissions

### Streaming Not Working
- Check browser console for errors
- Verify function is deployed correctly
- Check CORS settings

## 💡 Tips

1. **For Research**: Use Hugging Face API (easiest, free)
2. **For Demos**: Use Hugging Face Spaces (full UI)
3. **For Development**: Use Google Colab (free GPU)
4. **For Production**: Consider RunPod or Modal (reliable)

## 📝 License

This implementation is for research purposes. Hermes 3 model is from Nous Research.

## 🙏 Credits

- **Model**: Hermes 3 3B by Nous Research
- **Base Model**: Llama 3.2 3B by Meta
- **Implementation**: Built for TradeLine 24/7 research

## 🔗 Links

- [Hermes 3 Model](https://huggingface.co/NousResearch/Hermes-3-Llama-3.2-3B)
- [Technical Report](https://arxiv.org/abs/2408.11857)
- [Function Calling Code](https://github.com/NousResearch/Hermes-Function-Calling)

---

**Ready to use!** Just set your API key and start chatting with Hermes 3. 🚀


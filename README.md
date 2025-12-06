# Hermes 3 3B Implementation

A complete, production-ready implementation of Hermes 3 3B with a simple and intuitive UI, designed for research use.

## 🚀 Quick Start

**Get started in 10 minutes!** See the [Click-by-Click Installation Guide](./docs/HERMES3_CLICK_BY_CLICK.md) for step-by-step instructions.

### 3 Simple Steps:

1. **Get Free API Key** (3 min) - [Hugging Face](https://huggingface.co/settings/tokens)
2. **Configure Supabase** (2 min) - Add environment variables
3. **Add Component** (3 min) - `<Hermes3Chat />` in your React app

## 📦 What's Included

- ✅ **Supabase Edge Function** - Inference endpoint with multi-provider support
- ✅ **React Chat UI** - Beautiful, streaming chat interface
- ✅ **Streaming Client** - Real-time response streaming
- ✅ **Full Documentation** - Complete guides and specifications
- ✅ **Free Hosting Options** - Hugging Face, Together AI, and more

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [**Click-by-Click Guide**](./docs/HERMES3_CLICK_BY_CLICK.md) | **Start here!** 31 numbered clicks, zero technical knowledge needed |
| [Installation Guide](./docs/HERMES3_INSTALL_GUIDE.md) | Detailed setup with troubleshooting |
| [Quick Start](./docs/HERMES3_QUICK_START.md) | 3-step quick reference |
| [Complete README](./docs/HERMES3_README.md) | Full documentation |
| [Hosting Guide](./docs/HERMES3_HOSTING_GUIDE.md) | All free hosting options explained |
| [Setup Guide](./docs/HERMES3_SETUP.md) | Detailed configuration |
| [Specification](./docs/HERMES3_SPECIFICATION.md) | Complete model specs |

## 🎯 Features

- **Simple & Intuitive UI** - Clean, modern chat interface
- **Streaming Responses** - Real-time token streaming
- **Multiple Hosting Options** - Hugging Face (free), Together AI, custom
- **ChatML Format** - Proper Hermes 3 prompt formatting
- **Function Calling Support** - Ready for tool use
- **Structured Outputs** - JSON mode support
- **Configurable** - Adjust temperature, tokens, system prompts
- **Research-Friendly** - Free hosting options documented

## 💻 Usage

### Basic Usage

```tsx
import { Hermes3Chat } from '@/components/ui/Hermes3Chat';

function MyPage() {
  return <Hermes3Chat />;
}
```

### With Custom Settings

```tsx
<Hermes3Chat 
  defaultSystemPrompt="You are a coding assistant."
  showSettings={true}
/>
```

## 🔧 Configuration

### Environment Variables (Supabase)

```
HERMES3_HOSTING_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_token_here
```

### Hosting Providers

- **Hugging Face** (Recommended) - 30k free requests/month
- **Together AI** - $25 free credits
- **Custom** - Your own service (RunPod, Modal, etc.)

See [Hosting Guide](./docs/HERMES3_HOSTING_GUIDE.md) for details.

## 📁 File Structure

```
├── supabase/functions/hermes3/
│   └── index.ts                    # Edge function for inference
├── src/
│   ├── components/ui/
│   │   └── Hermes3Chat.tsx        # React chat UI component
│   ├── lib/
│   │   └── hermes3Streaming.ts    # Streaming client
│   └── pages/
│       └── Hermes3Demo.tsx        # Demo page
└── docs/
    ├── HERMES3_CLICK_BY_CLICK.md   # Start here!
    ├── HERMES3_INSTALL_GUIDE.md   # Detailed guide
    ├── HERMES3_QUICK_START.md     # Quick reference
    ├── HERMES3_README.md          # Complete docs
    ├── HERMES3_HOSTING_GUIDE.md   # Hosting options
    ├── HERMES3_SETUP.md           # Setup instructions
    └── HERMES3_SPECIFICATION.md   # Model specs
```

## 🆘 Need Help?

1. **Start with**: [Click-by-Click Guide](./docs/HERMES3_CLICK_BY_CLICK.md)
2. **Troubleshooting**: See [Installation Guide](./docs/HERMES3_INSTALL_GUIDE.md#-troubleshooting)
3. **Questions**: Check the [Complete README](./docs/HERMES3_README.md)

## 🎓 About Hermes 3

Hermes 3 3B is a powerful language model from Nous Research, fine-tuned from Llama 3.2 3B. It features:
- Advanced agentic capabilities
- Function calling support
- Structured output generation
- Improved reasoning and multi-turn conversation

**Model**: [NousResearch/Hermes-3-Llama-3.2-3B](https://huggingface.co/NousResearch/Hermes-3-Llama-3.2-3B)  
**Technical Report**: [arXiv:2408.11857](https://arxiv.org/abs/2408.11857)

## 📝 License

This implementation is for research purposes. Hermes 3 model is from Nous Research.

## 🙏 Credits

- **Model**: Hermes 3 3B by [Nous Research](https://huggingface.co/NousResearch)
- **Base Model**: Llama 3.2 3B by Meta
- **Implementation**: Built for research and development

---

**Ready to start?** → [Click-by-Click Installation Guide](./docs/HERMES3_CLICK_BY_CLICK.md) 🚀

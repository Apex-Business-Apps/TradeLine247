# Hermes 3 - Click-by-Click Installation Guide

## 🎬 Video-Like Instructions (No Video Needed!)

Follow these exact clicks. No thinking required. Just do what it says.

---

## PART 1: Get Your Free API Key

### Click 1: Open Browser
- Click on your web browser icon (Chrome, Firefox, Edge, Safari - any works)

### Click 2: Go to Hugging Face
- Click in the address bar (where you type websites)
- Type: `huggingface.co`
- Press Enter

### Click 3: Sign Up (If Needed)
- **If you see "Sign in"**: Click it
- **If you don't have account**: Click "Sign up" (top right)
- Enter email → Click "Sign up"
- Check email → Click verification link
- Come back to huggingface.co

### Click 4: Go to Tokens Page
- Click in address bar
- Type: `huggingface.co/settings/tokens`
- Press Enter
- (Or: Click your profile picture → Settings → Access Tokens)

### Click 5: Create New Token
- Look for button that says **"New token"** or **"Create token"**
- Click it

### Click 6: Fill the Form
- **Name field**: Click in it, type: `Hermes3`
- **Type dropdown**: Click it, select **"Read"**
- **Generate button**: Click it

### Click 7: Copy Your Token
- You'll see a long code (starts with `hf_`)
- **Click the copy icon** (two squares) next to it
- **Open Notepad** (or any text app)
- **Paste it** (Ctrl+V or right-click → Paste)
- **Save the file** (name it "api-key.txt")
- ⚠️ **IMPORTANT**: You can only see this once! You just copied it - good!

### Click 8: Close the Page
- Click "Done" or just close the tab
- ✅ **You're done with Part 1!**

---

## PART 2: Add Key to Supabase

### Click 9: Open Supabase Dashboard
- Go to: `supabase.com/dashboard`
- Click on your project name

### Click 10: Open Settings
- Look at left sidebar
- Find **"Settings"** (gear icon ⚙️)
- Click it

### Click 11: Open Edge Functions
- In Settings menu, find **"Edge Functions"**
- Click it

### Click 12: Open Environment Variables
- Find **"Environment Variables"** or **"Secrets"**
- Click it

### Click 13: Add First Variable
- Click **"Add new secret"** or **"New variable"** button
- **Name field**: Click, type exactly: `HERMES3_HOSTING_PROVIDER`
- **Value field**: Click, type exactly: `huggingface`
- Click **"Save"** or **"Add"**

### Click 14: Add Second Variable
- Click **"Add new secret"** or **"New variable"** again
- **Name field**: Click, type exactly: `HUGGINGFACE_API_KEY`
- **Value field**: Click, paste your token (from the text file you saved)
- Click **"Save"** or **"Add"**

### Click 15: Verify
- You should see both variables listed:
  - `HERMES3_HOSTING_PROVIDER` = `huggingface`
  - `HUGGINGFACE_API_KEY` = `hf_...` (your token)
- ✅ **Part 2 done!**

---

## PART 3: Deploy the Function

### Click 16: Go to Edge Functions
- In Supabase dashboard, left sidebar
- Click **"Edge Functions"**

### Click 17: Deploy Function
- **Option A** (if you see "Deploy" button):
  - Click **"Deploy"**
  - Select function: `hermes3`
  - Click **"Deploy"** again

- **Option B** (if you see code editor):
  - Make sure function name says: `hermes3`
  - Click **"Deploy"** button (top right)

- **Option C** (if using terminal):
  - Open terminal
  - Type: `supabase functions deploy hermes3`
  - Press Enter
  - Wait for "Deployed successfully"

### Click 18: Wait for Success
- You'll see "Deployed successfully" or green checkmark
- ✅ **Part 3 done!**

---

## PART 4: Add Chat to Your App

### Click 19: Open Your Code Editor
- Open VS Code (or your code editor)
- Open your project folder

### Click 20: Find a Page File
- Look in `src/pages/` folder
- Click on any `.tsx` file (like `Index.tsx` or create new one)

### Click 21: Add Import Line
- Scroll to top of file
- Find other `import` lines
- Click at the end of the last import line
- Press Enter (new line)
- Type exactly: `import { Hermes3Chat } from '@/components/ui/Hermes3Chat';`

### Click 22: Find Where to Add Chat
- Scroll down in the file
- Find the `return (` section
- Look for where you want the chat to appear
- Click there (after some content, before closing `</div>`)

### Click 23: Add the Component
- Press Enter (new line)
- Type exactly: `<Hermes3Chat />`
- Press Enter

### Click 24: Save File
- Press **Ctrl+S** (Windows) or **Cmd+S** (Mac)
- Or click File → Save

### Click 25: Check Files Exist
- Make sure these files exist in your project:
  - ✅ `src/components/ui/Hermes3Chat.tsx` exists
  - ✅ `src/lib/hermes3Streaming.ts` exists
  - ✅ `supabase/functions/hermes3/index.ts` exists
- If any are missing, they should have been created automatically

### Click 26: Start Dev Server
- Open terminal in your project
- Type: `npm run dev` (or `yarn dev`)
- Press Enter
- Wait for "Local: http://localhost:5173" (or similar)

### Click 27: Open Browser
- Click the link that appeared (or go to `localhost:5173`)
- Navigate to the page where you added `<Hermes3Chat />`

### Click 28: See the Chat!
- You should see a chat interface
- ✅ **Part 4 done!**

---

## PART 5: Test It

### Click 29: Type a Message
- Click in the chat input box
- Type: `Hello!`
- Press Enter (or click Send button)

### Click 30: Wait (Important!)
- **First message takes 30-60 seconds** - this is normal!
- The AI model is "waking up"
- You'll see "Thinking..." or a loading spinner
- **Just wait** - don't refresh!

### Click 31: See Response
- After 30-60 seconds, you should see a response!
- 🎉 **It works!**

---

## ✅ Success Checklist

Before celebrating, verify:

- [ ] Got token from Hugging Face
- [ ] Saved token in text file
- [ ] Added `HERMES3_HOSTING_PROVIDER` = `huggingface` in Supabase
- [ ] Added `HUGGINGFACE_API_KEY` = (your token) in Supabase
- [ ] Deployed `hermes3` function
- [ ] Added `import { Hermes3Chat } from '@/components/ui/Hermes3Chat';` to your page
- [ ] Added `<Hermes3Chat />` in your page
- [ ] Saved the file
- [ ] Dev server is running
- [ ] Opened the page in browser
- [ ] Sent a test message
- [ ] Got a response (after waiting 30-60 seconds)

**If all checked ✅ → You're done!**

---

## 🆘 Quick Fixes

### "Can't find Hermes3Chat"
- **Click**: Check `src/components/ui/Hermes3Chat.tsx` exists
- **Click**: If missing, the file should be in your project (check file explorer)

### "API key error"
- **Click**: Supabase dashboard → Settings → Edge Functions → Environment Variables
- **Click**: Verify both variables are there
- **Click**: Check spelling is exact (copy-paste the names)

### "Function not found"
- **Click**: Supabase dashboard → Edge Functions
- **Click**: See if `hermes3` is listed
- **Click**: If not, deploy it again (Part 3)

### "Nothing happens when I type"
- **Click**: Open browser console (F12 key)
- **Click**: "Console" tab
- **Click**: Look for red errors
- **Click**: Copy error and check what it says

### "Takes forever"
- **Click**: Wait 60 seconds (first request is slow)
- **Click**: If still nothing, refresh page
- **Click**: Try again

---

## 📱 Visual Guide (What You Should See)

### After Step 7:
```
Token: hf_abc123xyz789...
[Copy icon] [Done]
```

### After Step 14:
```
Environment Variables:
✓ HERMES3_HOSTING_PROVIDER = huggingface
✓ HUGGINGFACE_API_KEY = hf_abc123...
```

### After Step 17:
```
Edge Functions:
✓ hermes3 (Deployed)
```

### After Step 23:
```tsx
import { Hermes3Chat } from '@/components/ui/Hermes3Chat';

return (
  <div>
    <Hermes3Chat />
  </div>
);
```

### After Step 28:
```
┌─────────────────────────┐
│  Hermes 3 Chat          │
│  NousResearch • 3B      │
├─────────────────────────┤
│                         │
│  Welcome to Hermes 3    │
│  Start a conversation... │
│                         │
├─────────────────────────┤
│ [Type your message...]  │
│                    [Send]│
└─────────────────────────┘
```

---

## 🎯 Final Step: Celebrate!

If you see the chat interface and got a response → **You did it!** 🎉

You now have a working AI chat interface powered by Hermes 3.

**Next steps** (optional):
- Click the gear icon to adjust settings
- Try different questions
- Customize the system prompt

---

**Remember**: First message is always slow (30-60 seconds). After that, responses are faster!

**Need help?** Go back to the step where you're stuck and double-check each click.


# Hermes 3 Installation Guide - CEO Friendly Edition

## 🎯 What You're Installing

A chat interface that talks to an AI model called "Hermes 3". Think of it like ChatGPT, but you control it.

**Time Required**: 10 minutes  
**Technical Skill**: None needed - just follow the clicks

---

## Step 1: Get Your Free API Key (3 minutes)

### Option A: Hugging Face (Easiest - Recommended)

1. **Open your web browser** (Chrome, Firefox, Safari - any browser works)

2. **Click this link**: https://huggingface.co/settings/tokens
   - Or copy and paste it into your browser's address bar

3. **If you see a login page**:
   - Click "Sign up" (top right)
   - Enter your email
   - Create a password
   - Click "Sign up"
   - Check your email and click the verification link

4. **Once logged in, you'll see a page that says "Access Tokens"**

5. **Click the button that says "New token"** (usually on the right side)

6. **Fill in the form**:
   - **Name**: Type `Hermes3` (or anything you want)
   - **Type**: Click the dropdown and select **"Read"**
   - **Click "Generate token"** button

7. **IMPORTANT**: A token will appear (looks like: `hf_abc123xyz...`)
   - **Click the copy icon** next to it (looks like two squares)
   - **Paste it into a text file** and save it (you'll need it in Step 2)
   - ⚠️ **You can only see this once!** Copy it now or you'll have to make a new one.

8. **Click "Done"** or close the page

✅ **You now have your API key!** Keep it safe.

---

## Step 2: Add the API Key to Your Project (2 minutes)

### If You're Using Supabase:

1. **Open your Supabase project dashboard**
   - Go to: https://supabase.com/dashboard
   - Click on your project

2. **Click "Settings"** (left sidebar, gear icon)

3. **Click "Edge Functions"** (in the Settings menu)

4. **Click "Environment Variables"** (or "Secrets" - depends on your version)

5. **Click "Add new secret"** or **"New variable"** button

6. **Add these two variables** (one at a time):

   **Variable 1:**
   - **Name**: Type exactly: `HERMES3_HOSTING_PROVIDER`
   - **Value**: Type exactly: `huggingface`
   - Click **"Save"** or **"Add"**

   **Variable 2:**
   - **Name**: Type exactly: `HUGGINGFACE_API_KEY`
   - **Value**: Paste the token you copied in Step 1
   - Click **"Save"** or **"Add"**

7. **Done!** You should see both variables listed.

---

## Step 3: Deploy the Function (2 minutes)

### Option A: Using Supabase Dashboard (Easiest)

1. **In your Supabase dashboard**, click **"Edge Functions"** (left sidebar)

2. **Click "Deploy"** or **"New Function"**

3. **If you see a code editor**:
   - Don't worry about the code
   - Just make sure the function name is: `hermes3`
   - Click **"Deploy"** button

### Option B: Using Terminal (If you have it set up)

1. **Open your terminal/command prompt**

2. **Type this command** and press Enter:
   ```bash
   supabase functions deploy hermes3
   ```

3. **Wait for it to finish** (you'll see "Deployed successfully")

---

## Step 4: Add the Chat Component to Your App (3 minutes)

### Step 4.1: Open Your Code Editor

1. **Open your project** in your code editor (VS Code, etc.)

2. **Navigate to the file** where you want to add the chat
   - Usually a page file like `src/pages/SomePage.tsx`
   - Or create a new page

### Step 4.2: Add the Import

1. **At the top of your file**, find the other `import` statements

2. **Add this line** (copy and paste exactly):
   ```typescript
   import { Hermes3Chat } from '@/components/ui/Hermes3Chat';
   ```

### Step 4.3: Add the Component

1. **Find where you want the chat to appear** in your page

2. **Add this code** (copy and paste):
   ```tsx
   <Hermes3Chat />
   ```

3. **Save the file** (Ctrl+S or Cmd+S)

### Step 4.4: Test It

1. **Start your development server** (if not already running):
   - In terminal, type: `npm run dev` or `yarn dev`
   - Press Enter

2. **Open your browser** and go to the page where you added the chat

3. **You should see a chat interface!**

4. **Type a message** like "Hello!" and press Enter

5. **Wait a moment** (first request takes 30-60 seconds - the AI is "waking up")

6. **You should get a response!** 🎉

---

## ✅ You're Done!

The chat should now be working. Here's what you can do:

- **Chat**: Just type and press Enter
- **Settings**: Click the gear icon to adjust temperature and tokens
- **Clear Chat**: Click the X icon to start over

---

## 🆘 Troubleshooting

### "Error: API key not configured"
- **Fix**: Go back to Step 2, make sure you added both environment variables correctly
- Check the spelling: `HERMES3_HOSTING_PROVIDER` and `HUGGINGFACE_API_KEY`

### "Model is loading" (takes forever)
- **Fix**: This is normal for the first request (30-60 seconds)
- Just wait, or refresh and try again

### "Rate limit exceeded"
- **Fix**: You've used your free requests for the month
- Wait until next month, or get a new Hugging Face account

### Chat doesn't appear
- **Fix**: 
  1. Check that you saved the file
  2. Make sure your dev server is running
  3. Check browser console for errors (F12 key)
  4. Make sure the import path is correct: `@/components/ui/Hermes3Chat`

### "Function not found"
- **Fix**: Go back to Step 3, make sure you deployed the function
- The function name must be exactly: `hermes3`

---

## 📞 Need More Help?

1. **Check the files exist**:
   - `supabase/functions/hermes3/index.ts` should exist
   - `src/components/ui/Hermes3Chat.tsx` should exist
   - `src/lib/hermes3Streaming.ts` should exist

2. **Check the console**:
   - Press F12 in your browser
   - Click "Console" tab
   - Look for red error messages
   - Copy them and ask for help

3. **Verify environment variables**:
   - In Supabase dashboard → Settings → Edge Functions → Environment Variables
   - Make sure both variables are there and spelled correctly

---

## 🎯 Quick Checklist

Before asking for help, check:

- [ ] Got API key from Hugging Face
- [ ] Added `HERMES3_HOSTING_PROVIDER` = `huggingface`
- [ ] Added `HUGGINGFACE_API_KEY` = (your token)
- [ ] Deployed the `hermes3` function
- [ ] Added `<Hermes3Chat />` to your page
- [ ] Saved all files
- [ ] Dev server is running
- [ ] Waited 30-60 seconds for first response

---

## 💡 Pro Tips

1. **First message is slow** - This is normal! The AI model needs to "wake up"
2. **Free tier limits** - Hugging Face gives 30,000 requests/month (plenty for testing)
3. **Settings button** - Click the gear icon to adjust how creative the AI is
4. **Clear chat** - Click X to start a new conversation

---

**That's it!** You now have a working AI chat interface. 🚀

If you get stuck, go back to the step where you're having trouble and double-check everything.


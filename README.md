# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/555a4971-4138-435e-a7ee-dfa3d713d1d3

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/555a4971-4138-435e-a7ee-dfa3d713d1d3) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/555a4971-4138-435e-a7ee-dfa3d713d1d3) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Environment configuration

Certain public environment variables must be present before running builds or tests:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the provided preflight script to verify they are set without printing their values:

```sh
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run verify:env:public
```

The CI workflow runs this script automatically; ensure the variables are available in your environment to avoid failures.


## Forwarding Wizard (no new vendors)

- **Rogers/Fido (mobile):** Activate `*21*<TradeLineNumber>#`, Deactivate `##21#`. [Rogers support]
- **TELUS/Koodo (mobile):** Activate `*21*<TradeLineNumber>#` to forward all calls. [TELUS support]
- **Bell Mobility:** Phone Settings → Call Forwarding → Always forward → set TradeLineNumber. [Bell support]
- **Landlines (Bell/Rogers/etc.):** Dial `*72`, then TradeLineNumber. If busy/no answer, repeat once. Disable with `*73`. [Bell/Rogers home phone support]

### Auto-verification
Click **Place test call & verify**. The system calls the old number; if forwarding is active, our inbound webhook marks the check **verified**. Check Twilio **Monitor → Logs → Error Logs** for any webhook 4xx/5xx.

### Outbound Caller ID
Use **Verify caller ID**. Twilio will call the legacy number and prompt for a 6-digit code displayed in-app.

### Hosted SMS (optional, off by default)
If SMS continuity is required before porting, enable **Hosted SMS** for the legacy number (US/CA; Developer Preview).

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

## Ops (SPA-only)
- Uptime/content monitor: GitHub → Actions → Prod Monitor (runs every 5m; Slack on fail).
- Synthetic call: GitHub → Actions → Twilio Synthetic Call (daily + on-demand).
- In-app checks: /qa/dashboard
Secrets required: SLACK_WEBHOOK_URL, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TO_E164, FROM_E164.

## GSC Finalization (manual)
1) Open Google Search Console for property https://www.tradeline247ai.com
2) Sitemaps → submit/refresh /sitemap.xml
3) URL Inspection → paste https://www.tradeline247ai.com/ → Request indexing
4) Coverage → resolve any warnings; validate fix

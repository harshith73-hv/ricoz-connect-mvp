<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- App data (channels, posts, tasks, webhook deliveries) lives in a client-side store (src/lib/store.tsx) persisted to localStorage — MVP mock persistence; swap for a database when multi-user sync is needed.
- Webhook ingestion goes through /api/public/webhooks/$hookId, which checks the API key and normalizes payloads via src/lib/webhook.ts — one shared normalizer for the endpoint and simulator.

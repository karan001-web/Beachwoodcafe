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

## Mandatory Deployment Rule (Vercel & GitHub Sync)
- **Always automatically deploy to Vercel Production**: Whenever any code changes or bug fixes are applied to this project, you MUST build and deploy them live to Vercel production (`beachwoodcafe.vercel.app`) using `npx vercel build --prod` and `npx vercel deploy --prebuilt --prod`, and push them to GitHub `origin/main`.
- Never leave changes only in the local workspace; ensure the live site is always updated and in sync.

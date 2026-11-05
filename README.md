# Product Catalog

Next.js (App Router) + TypeScript + Tailwind + Supabase. Collapsible category panel, Shopee-style product grid
(2 columns on phones, auto-fit on desktop), product popup with blurred background, search, shop filter,
and add / edit / delete for products.

## 1. Run locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (step 2)
npm run dev                        # http://localhost:3000
```

Check for type errors any time with `npm run typecheck`.

## 2. Set up Supabase

1. Create a project at supabase.com.
2. **SQL Editor -> New query**: paste all of `supabase/schema.sql` and run it. This creates the tables,
   the public `product-images` bucket, and the security rules (everyone can read, only a logged-in user can write).
3. **Project Settings -> API**: copy the Project URL and the `anon` public key into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   Never put the `service_role` key in this app.

## 3. Create the shared admin account

The login form asks for a **username**. The app turns it into the hidden email `username@catalog.app`
(change the domain with `NEXT_PUBLIC_LOGIN_EMAIL_DOMAIN`).

In Supabase: **Authentication -> Users -> Add user -> Create new user**
- Email: `buildx@catalog.app`
- Password: your chosen password
- Tick **Auto Confirm User**

Then log in on the site with username `buildx` and that password.
Also turn **off** public sign-ups: **Authentication -> Sign In / Providers -> Allow new users to sign up -> off**,
so nobody can create their own account and get write access.

To change the password later: Authentication -> Users -> the user -> Send password recovery / reset.
Do not store the password in the code or in GitHub.

## 4. Deploy on Vercel

1. Push this folder to a GitHub repo (`.env.local` is git-ignored).
2. vercel.com -> **Add New -> Project** -> import the repo. Next.js is detected automatically.
3. Add the environment variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   and `NEXT_PUBLIC_LOGIN_EMAIL_DOMAIN`, then **Deploy**.
4. In Supabase: **Authentication -> URL Configuration**, set Site URL to your Vercel URL.
5. Every push to `main` redeploys.

Notes: Vercel's free Hobby plan is for personal, non-commercial use. A free Supabase project pauses after about a
week of inactivity (resume it from the dashboard). Photos are compressed in the browser before upload to save space.

## How it works

- **Categories**: pencil icon in the left panel turns on edit mode (rename, delete, new category).
  The hamburger button in the page header collapses the panel; on phones it is a slide-in drawer.
- **Products**: `+` adds. Pencil icon: tap a product to edit it. Trash icon: tap one or more products, then
  press Delete. The popup also has Edit and Delete buttons.
- **Search**: searches the whole catalogue (name, product code, details, notes, shop, category, variations)
  when *All products* is selected. Pick a category first and the same search is limited to that category;
  the shop filter narrows it further.
- **Shop filter**: dropdown in the navbar; works together with category and search.

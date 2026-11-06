# BuildX Product Catalog

**A private, web-based product management and visual catalog application for BuildX.**

BuildX Product Catalog is a responsive web application designed to simplify how products are collected, organized, managed, and presented.

It replaces the traditional workflow of keeping product information in Notepad files and product photos in separate folders with one centralized platform.

Users can browse products, view product details, search the catalog, filter by shop, and access product images. The administrator can manage products, categories, shops, and product photos through an intuitive interface.

---

## 1. Project Overview

### What is BuildX Product Catalog?

BuildX Product Catalog is a centralized product information management system.

It is designed to organize products collected from different suppliers, manufacturers, and retail shops into a searchable digital catalog.

Each product has its own record containing:

- Product name
- Product price (Philippine pesos)
- Product code
- Category
- Shop or supplier
- Product photos
- Variations — each with a label, an optional color swatch, and an optional price override
- Product details
- Private notes

Variations are free-text labels, so they can describe colors ("Warm Grey"), sizes ("60 × 60 cm"), or any other specification. There is no separate size field — a size is simply a variation whose label reads like one.

The application provides a visual-first experience, allowing users to identify products through photographs rather than relying only on product names or written descriptions.

### Main Objectives

1. Centralize all product information in one application.
2. Organize products using categories and shops.
3. Make product searching faster and more convenient.
4. Simplify product creation, editing, and deletion.
5. Store and manage multiple product photographs.
6. Generate shareable product-detail images.
7. Provide access through desktop, tablet, and mobile devices.
8. Protect catalog management functions through administrator authentication.

---

## 2. Technology Stack

The application uses modern web technologies.

| Technology | Purpose |
|---|---|
| Next.js 15 | Application framework |
| React | User interface and components |
| TypeScript | Type safety and maintainability |
| Tailwind CSS 3 | Styling and responsive layouts |
| Lucide React | Icons |
| Supabase | Backend and database services |
| PostgreSQL | Product and catalog data storage |
| Supabase Storage | Product image storage |
| Supabase Auth | Administrator authentication |
| Supabase SSR | Server-side authentication and sessions |
| Vercel | Hosting and deployment |
| GitHub | Source code management and version control |

### Application Architecture

The application follows a frontend-and-backend architecture.

**Frontend**
- Built with Next.js and React.
- Displays the product catalog and management interface.
- Handles user interactions and form validation.
- Compresses product photographs in the browser before upload.
- Generates downloadable product-detail images.

**Backend**
- Supabase handles authentication and database operations.
- PostgreSQL stores product, category, shop, and image records.
- Supabase Storage stores uploaded product photographs.
- Row Level Security (RLS) controls database access.

**Deployment**
- GitHub stores the application source code.
- Vercel hosts the Next.js application.
- Supabase provides the database, authentication, and image storage.

---

## 3. Application Features

### 3.1 Authentication and Access Control

The application uses a login-first system.

Visitors must authenticate before accessing the main product catalog.

Features:
- Dedicated login page.
- Username-based login.
- Supabase authentication.
- Server-side session verification.
- Protected application routes.
- Logout confirmation.
- Session-based authentication using secure cookies.

**Access model:**

| User type | Access |
|---|---|
| Unauthenticated visitor | Login page only |
| Authenticated user | View and manage catalog |

The current system uses one shared administrator account. All authenticated accounts have editing permissions.

Public account registration should remain disabled unless the access-control model is updated.

### 3.2 Product Catalog Dashboard

The dashboard is the main interface for browsing and managing products.

It features:

- Shopee-style product card layout.
- Two-column product grid on mobile devices.
- Responsive auto-fitting grid on larger screens.
- Product cover photographs.
- Product names and prices.
- Product codes.
- Category labels.
- Shop information.
- Product colors and variation indicators.

The interface is designed to make product browsing visual, organized, and convenient.

### 3.3 Category Management

Categories organize products according to their product type.

The left sidebar contains a collapsible category panel.

Features:
- View all products.
- Browse individual categories.
- Add new categories.
- Rename existing categories.
- Delete categories.
- Category editing mode.
- Mobile-friendly sidebar drawer.

Category names are stored and displayed in uppercase. The selected category is bold; the others are semibold.

Deleting a category does not require deleting its products; affected products are moved to Uncategorized.

### 3.4 Product Management

The application provides product creation, editing, and deletion.

**Add Product**

Administrators can create a product by entering:

- Product name.
- Price in Philippine pesos.
- Product code.
- Category.
- Shop.
- Product photographs.
- Variations — a label plus an optional color swatch and price.
- Product details and private notes.

**Edit Product**

Existing product information can be modified through the product details popup.

Administrators can update product information, change the assigned category or shop, and manage photographs and variations.

**Delete Product**

Products can be deleted in two ways:

- **Single product** — the Delete button in the product details popup.
- **Several products at once** — turn on Delete mode in the toolbar, tap the cards to select them, then use the Delete (n) button. A confirmation dialog lists the selection before anything is removed.

Deleting a product also removes its stored photographs — both the optimized copy and the original file — and its image and variation records.

### 3.5 Shop Management

Shops represent the suppliers, manufacturers, or retail stores from which products are collected.

Features:
- Filter products by shop.
- View the number of products assigned to each shop.
- Add new shops through a popup.
- Delete existing shops.
- Reassign products before deleting a shop.
- Select a shop when creating or editing a product.

Deleting a shop does not automatically delete its products. The administrator must choose where its products should be reassigned, including the No shop option.

### 3.6 Search and Filtering

The search system allows users to find products using multiple fields.

Searchable information includes:

- Product name.
- Product code.
- Product details.
- Product notes.
- Shop name.
- Category name.
- Variation labels (colors, sizes, specifications).
- Variation color hex values and variation prices.

**Search behavior**

The query is debounced by 250 ms and matched against the loaded catalog in the browser — no request is sent per keystroke.

Every word in the query must appear somewhere in the product, so "grey 60" finds a product that has both "grey" and "60" across its fields. Matching is case-insensitive.

| Selected view | Search behavior |
|---|---|
| All Products | Searches across all categories |
| Individual Category | Searches only within the selected category |
| Shop filter | Further narrows the results to the selected shop |

Category and shop act as hard filters; the search runs on top of them.

The search bar and shop filter are accessible from the main navigation area.

### 3.7 Product Details Popup

Clicking a product card opens its detailed information popup.

The popup provides a centralized view of the product.

It includes:
- Product photographs.
- Product name.
- Price.
- Product code.
- Category.
- Shop.
- Variations, with color swatches where set.
- Product details.
- Private notes.

The background is blurred while the popup is open, helping users focus on the selected product.

On mobile the popup uses the full screen.

The popup also provides access to product editing, deletion, and image downloads.

### 3.8 Product Photo Management

Products can contain multiple photographs.

The first uploaded photograph serves as the product's cover image.

The application supports:
- Multiple photographs per product.
- Browser-side image compression.
- Optimized image uploads.
- Original image preservation when migration 002 is installed.
- Product gallery viewing.
- Original photograph downloads.

**Image storage structure**

The application maintains two versions of newly uploaded photographs:

| Image version | Purpose |
|---|---|
| Optimized image | Faster loading and product display |
| Original image | Downloading the untouched uploaded photograph |

Optimized images are resized so the longest edge is at most 1280 pixels and re-encoded as JPEG (quality 0.8).

Original photographs are stored without modifying their original file contents.

Files are stored under a per-product folder:

```text
product-images/
└── <product-id>/
    ├── <timestamp>.jpg              ← optimized display copy
    └── <timestamp>-original.<ext>   ← untouched upload
```

The optimized copy is always a JPEG; the original keeps its real extension (`.jpg`, `.png`, `.webp`, `.heic`, and so on).

Existing photographs uploaded before migration 002 continue to work using their optimized image paths.

If the `original_path` column has not been added yet, the application still runs: new uploads simply skip the original copy, and the download dialog notes that older photos are stored in their optimized form.

### 3.9 Product Image Downloads

The product details popup provides image download functionality.

There are two types of downloads.

**A. Original Product Photos**

Downloads the stored photograph files without applying additional resizing or compression.

The files are named after a lowercase slug of the product code (falling back to the product name, then `product`), numbered in gallery order, and keep their real extension:

```text
ltp6205-01.jpg
ltp6205-02.jpg
```

A product whose code is `#LX-LV8006` becomes `lx-lv8006-01.png`, and so on.

**B. Product Details Image**

Generates a shareable product information image directly in the browser.

Specifications:

- PNG format.
- 2160 × 2700 pixels.
- 4:5 aspect ratio.
- White background.
- BuildX logo centered across the top on a white header.
- Large product photograph.
- Product category.
- Product name.
- Price in Philippine pesos.
- Product code.
- Shop.
- Product variations when available.

The card ends with the last piece of product information — there is no footer strip and no secondary header text.

The generated image uses the currently selected photograph in the product gallery, rather than automatically selecting the first photograph. If that photograph cannot be loaded, the export stops with an error instead of producing a blank area.

The downloaded filename follows the same slug as the photo downloads:

```text
ltp6205-details.png
```

If a product does not have a product code, the product name is used as a fallback.

The generated image is created using HTML Canvas in the browser. It is not uploaded to Supabase.

---

## 4. Responsive Design

BuildX Product Catalog is designed to work across different screen sizes.

| Device | Interface behavior |
|---|---|
| Desktop | Expanded workspace and auto-fitting product grid |
| Tablet | Adaptive layout and optimized spacing |
| Mobile | Two-column product grid and collapsible sidebar drawer |

Responsive features include:

- Adaptive navigation.
- Mobile-friendly category navigation.
- Responsive product cards.
- Flexible product forms.
- Scrollable dropdowns.
- Mobile-friendly popup dialogs.
- Touch-friendly controls.
- Consistent typography and spacing.

The application aims to provide a consistent experience without requiring users to switch to a separate mobile application.

---

## 5. Database Structure

Supabase PostgreSQL is used as the primary database.

The main database entities are:

| Table | Responsibility |
|---|---|
| products | Stores product information |
| categories | Stores product categories |
| shops | Stores shop and supplier information |
| product_images | Stores product image metadata and storage paths |
| product_variants | Stores a product's variation options — a label, an optional color swatch, and an optional price |

### Product Relationships

- A product belongs to a category.
- A product can be assigned to a shop.
- A product can have multiple photographs.
- A product can contain multiple variations, each with a label, an optional color, and an optional price.
- Product image and variation records are associated with their corresponding product.

### Key Columns

| Table | Columns worth knowing |
|---|---|
| products | `name`, `price` (numeric), `code`, `description`, `notes`, `category_id`, `shop_id` |
| categories | `name`, `sort_order` |
| shops | `name` (unique) |
| product_images | `path` (optimized copy), `original_path` (untouched upload), `position` |
| product_variants | `label`, `color_hex`, `price`, `position` |

Deleting a product cascades to its `product_images` and `product_variants` rows. Deleting a category or shop sets the matching `products` column to `null` rather than deleting the product.

### Image Storage

Supabase Storage uses the public bucket:

`product-images`

The database stores image metadata and file paths, while the actual photographs are stored in Supabase Storage.

---

## 6. Project Folder Structure

The main project structure is organized as follows:

```text
Buildx-Product-Inventory/
│
├── app/
│   ├── login/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── CatalogApp.tsx
│   ├── CategoryModal.tsx
│   ├── ConfirmDialog.tsx
│   ├── DownloadDialog.tsx
│   ├── LoginPage.tsx
│   ├── Modal.tsx
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   ├── ProductForm.tsx
│   ├── ProductModal.tsx
│   ├── ShopDeleteDialog.tsx
│   ├── ShopFilter.tsx
│   ├── ShopModal.tsx
│   ├── ShopSelect.tsx
│   └── Sidebar.tsx
│
├── lib/
│   ├── config.ts
│   ├── detailsImage.ts
│   ├── download.ts
│   ├── format.ts
│   ├── image.ts
│   ├── supabase-server.ts
│   ├── supabase.ts
│   └── types.ts
│
├── public/
│   └── brand/
│       └── BuildX_Logo_Horizontal_2400px.png
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_add_product_code.sql
│   │   └── 002_add_image_original_path.sql
│   └── schema.sql
│
├── .env.local.example
├── .gitignore
├── middleware.ts
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### Key Modules

| File | Purpose |
|---|---|
| `middleware.ts` | Sends unauthenticated visitors to `/login` before any catalog page renders. |
| `app/page.tsx` | Server-side session check, then renders the catalog. |
| `app/login/page.tsx` | Login route; bounces signed-in users back to the catalog. |
| `lib/config.ts` | Public Supabase settings and the bucket name. Imported by both server and client code. |
| `lib/supabase.ts` | Browser Supabase client with cookie-based sessions. |
| `lib/supabase-server.ts` | Server Supabase client used by the pages above. |
| `lib/detailsImage.ts` | Draws the 2160 × 2700 product-details PNG on a canvas. |
| `lib/download.ts` | Saves original photos and triggers browser downloads. |
| `lib/image.ts` | Browser-side compression and original-file extension detection. |
| `public/brand/BuildX_Logo_Horizontal_2400px.png` | The logo used by the details image export. **Required** — the export reports an error if it is missing. |

---

## 7. Installation and Local Development

### Requirements

Before running the project, install:

- Node.js 18.18 or newer (an active LTS release is recommended).
- npm.
- Git.
- A Supabase account.
- A code editor such as Visual Studio Code.

### Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Buildx-Product-Inventory
```

All commands below are run from that repository root.

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create `.env.local` in the project root.

Copy the contents of `.env.local.example` and provide the required values.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

NEXT_PUBLIC_LOGIN_EMAIL_DOMAIN=catalog.app
```

Use the Supabase publishable key in the application's existing `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable.

Never use the Supabase `service_role` key in the frontend.

### Start the Development Server

```bash
npm run dev
```

Open:

http://localhost:3000

### Type Checking

```bash
npm run typecheck
```

This runs `tsc --noEmit` and reports type errors without writing any output files.

### Production Build

```bash
npm run build
```

### Run the Production Build Locally

```bash
npm start
```

Serves the build produced by `npm run build` on http://localhost:3000.

### Available Scripts

| Command | Runs | Purpose |
|---|---|---|
| `npm run dev` | `next dev` | Development server with hot reload |
| `npm run build` | `next build` | Production build |
| `npm start` | `next start` | Serves the production build |
| `npm run typecheck` | `tsc --noEmit` | Type checking only |

There is no separate lint script. `next build` runs the type check as part of the build.

---

## 8. Supabase Configuration

### Initial Database Setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Create a new query.
4. Paste the complete contents of `supabase/schema.sql`.
5. Run the SQL script.

This creates the application's database tables, storage bucket, and initial security policies.

### Existing Database Migrations

For databases created using an earlier version of the application, run the migrations in order.

**Migration 001: Product Code**

File:

`supabase/migrations/001_add_product_code.sql`

Adds the product-code field to support product identification and search.

**Migration 002: Original Image Path**

File:

`supabase/migrations/002_add_image_original_path.sql`

Adds the `original_path` column to `product_images`.

This allows newly uploaded photographs to retain their untouched originals alongside optimized display images.

The migration is additive and idempotent.

### Administrator Account

Create the administrator account through:

Supabase → Authentication → Users → Add User.

Example:

```text
Email: buildx@catalog.app
Password: YOUR_SECURE_PASSWORD
```

Enable Auto Confirm User.

The application converts the username into an email address using the configured login email domain.

For example:

```text
Username: buildx
Email: buildx@catalog.app
```

Disable public registration under:

Supabase → Authentication → Sign In / Providers.

Keep public sign-ups disabled while using the single-administrator account model.

---

## 9. Security and Data Protection

The application uses Supabase Authentication, server-side session verification, and PostgreSQL Row Level Security.

### Authentication

- Unauthenticated visitors are redirected to `/login`.
- Protected pages verify the user's Supabase session.
- Sessions are maintained using cookies through Supabase SSR.
- Logging out clears the session and returns the user to the login page.

### Database Security

The current database configuration allows public read access to catalog data and authenticated write access.

This means that hiding the dashboard behind the login page does not make the database API itself private.

Anyone with the public Supabase key may be able to read data permitted by the current RLS policies.

If catalog information must be completely private, the database policies and storage access policies must also be updated.

### Important Security Rules

1. Disable public account registration.
2. Use a strong administrator password.
3. Never expose the Supabase service-role key.
4. Keep `.env.local` out of GitHub.
5. Review RLS policies before introducing additional user accounts.
6. Use an email allowlist and role-based policies if separate administrator and viewer accounts are introduced.

**Current limitation:** Every authenticated user has editing permissions. The application does not currently implement separate viewer and administrator roles.

---

## 10. Deployment

The application is designed to be deployed using GitHub and Vercel.

### GitHub

1. Create a private GitHub repository.
2. Commit the application source code.
3. Ensure `.env.local` is excluded.
4. Push the source code to the `main` branch.

### Vercel

1. Log in to Vercel.
2. Select Add New → Project.
3. Import the GitHub repository.
4. Configure the environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_LOGIN_EMAIL_DOMAIN
```

5. Deploy the application.

### Supabase URL Configuration

After deployment, open:

Supabase → Authentication → URL Configuration.

Set the Site URL to the deployed Vercel address.

Configure any required redirect URLs for authentication.

### Automatic Deployment

Once GitHub is connected to Vercel, pushes to the configured production branch automatically trigger new deployments.

---

## 11. Current System Limitations and Considerations

- The current application uses a shared administrator account.
- All authenticated users can edit catalog information.
- The current database read policies allow public reads.
- Existing photographs uploaded before migration 002 do not have separate untouched original files.
- Product-detail share images are generated in the browser.
- The application requires an active Supabase project for database and image operations.
- Vercel Hobby is intended for personal, non-commercial use; review the applicable Vercel plan before commercial deployment.
- Free Supabase projects may pause after a period of inactivity.

---

## 12. Future Development

The following improvements can be considered for future versions.

| Feature | Description |
|---|---|
| User roles | Separate administrators and read-only viewers |
| Shop management | More advanced shop and supplier profiles |
| Product sorting | Sort by name, price, date, or shop |
| Product reordering | Drag-and-drop product arrangement |
| Category reordering | Customize category positions |
| Bulk import | Import products using CSV files |
| Product history | Track product information changes |
| Advanced filtering | Add price and variation filters alongside the existing category and shop filters |
| Export reports | Generate CSV and spreadsheet reports |
| Analytics dashboard | View product counts and catalog statistics |
| Backup and recovery | Improve database and image backup procedures |

These are potential enhancements, not features currently guaranteed to be implemented.

---

## 13. Project Maintenance

Before making changes to the application:

1. Pull the latest changes from GitHub.
2. Review the existing components and application structure.
3. Avoid modifying unrelated functionality.
4. Preserve the existing database relationships.
5. Test changes locally before deployment.
6. Run TypeScript checks.
7. Run a production build.
8. Review Supabase security policies before changing database behavior.
9. Commit and push only after testing.

Recommended validation commands:

```bash
npm run typecheck
npm run build
```

---

## 14. Project Purpose

BuildX Product Catalog is intended to become a centralized digital product library for BuildX.

Instead of manually searching through separate notes, screenshots, and product folders, users can access product information from a single organized platform.

The system combines product management, image storage, category organization, shop management, and shareable product information into one responsive web application.

**BuildX Product Catalog**

*Buy Better. Build Bigger.*


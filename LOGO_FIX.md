# Logo Asset Loading Fix Plan - `LOGO_FIX.md`

## 1. Problem Identification & Root Cause

The logo image displays correctly on `localhost` but is broken (loads alternative text `WBB Tailor Logo` and a broken image icon) on the test URL deployment.

### Underlying Causes:

1. **URL-Unsafe Filename and Special Characters**:
   - The logo file is currently named `Screenshot+2023-09-13+at+13.49.21 copy.webp` and is referenced as:
     ```html
     src="/Screenshot+2023-09-13+at+13.49.21 copy.webp"
     ```
   - **Spaces and Plus (+) Symbols in URLs**: In web standards, `+` and space (` `) characters have special meanings in URLs. Many web servers, proxies, and cloud hosting providers (e.g., Vercel, Netlify, AWS S3, Nginx) URL-decode the path. A plus sign `+` is often decoded into a space character (` `), or the space is encoded as `%20`. This mismatch prevents the hosting server from mapping the incoming request to the actual filename `Screenshot+2023-09-13+at+13.49.21 copy.webp` on disk, resulting in a **404 Not Found** error.
   - On the local Vite development server, the asset middleware is highly permissive and resolves it successfully, masking this deployment issue.

2. **Hardcoded Root Absolute Paths**:
   - The absolute path `src="/Screenshot+..."` assumes that the web app is hosted at the exact domain root (`https://example.com/`). If the test URL is deployed under a sub-path or sub-folder (e.g., `https://username.github.io/tailor-dashboard/`), the browser looks for the asset at the root (`https://username.github.io/Screenshot+...`), bypassing the project's subfolder entirely.

---

## 2. Recommended Solution

To ensure 100% reliability across all local, staging, and production environments, we should:
1. **Rename the file** to a URL-safe, clean lowercase name without spaces, special characters, or plus signs: `wbb-tailor-logo.webp`.
2. **Move the file from `public/` to the source code folder `src/assets/`** and **import it as a module** inside `Navigation.tsx`. 
   * **Why this is superior**: Vite will automatically process the imported image, hash the filename for cache busting (e.g., `wbb-tailor-logo-Cg9x2sB1.webp`), and dynamically generate the correct base-relative path so that the logo loads perfectly even if the project is deployed to a subpath/sub-directory!

---

## 3. Step-by-Step Implementation Phases & Checklist

### Phase 1: Asset Preparation & Renaming
- [x] Create a `src/assets` directory to house local static assets if it does not already exist.
- [x] Move `public/Screenshot+2023-09-13+at+13.49.21 copy.webp` to `src/assets/wbb-tailor-logo.webp`.
- [x] Remove duplicate or unused logo assets (e.g., `public/Screenshot+2023-09-13+at+13.49.21.webp`) to keep the repository clean.

### Phase 2: Updating Code References
- [x] Open [src/components/Navigation.tsx](file:///c:/Users/Lam/Desktop/Code%20Projects/tailor-dashboard/src/components/Navigation.tsx).
- [x] Import the logo at the top of the file:
  ```typescript
  import logoUrl from '../assets/wbb-tailor-logo.webp';
  ```
- [x] Replace the hardcoded absolute string in the `<img>` element with the imported reference:
  ```tsx
  <img
    src={logoUrl}
    alt="WBB Tailor Logo"
    className="h-12 md:h-20 lg:h-24 w-auto object-contain"
  />
  ```

### Phase 3: Verification & Local Testing
- [x] Run the local dev server (`npm run dev`) and verify that the logo loads correctly at `http://localhost:5173/`.
- [x] Run a production build locally (`npm run build`) to ensure Vite compiles the asset without errors.
- [x] Preview the production build locally using `npm run preview` to verify that the hashed asset resolves properly.
- [ ] Once deployed to the test URL, verify that the image resolves with an HTTP 200 status code under the network tab.

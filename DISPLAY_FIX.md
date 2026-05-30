# 🛠️ Blank Screen Diagnosis & Display Fix Plan

This document diagnoses the root causes of the blank white screen observed at `localhost:5174` after running `npm run dev`, and outlines a step-by-step implementation plan to resolve it.

---

## 🔍 Root Cause Analysis

Based on investigation, there are three distinct issues contributing to the blank screen:

### 1. Incompatible Vite Version (Major Upgrade)
* **What Happened:** Running `npm audit fix --force` upgraded the `vite` devDependency from a stable version (`^5.4.2`) to `^8.0.14`.
* **The Impact:** 
  * Vite 8 is a major/pre-release version introducing massive architectural changes (such as shifting to Rolldown/Oxc and deprecating standard Rollup/Esbuild options).
  * The existing React plugin `@vitejs/plugin-react` (`^4.3.1`) has a strict peer dependency on `vite@"^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"`. Upgrading to Vite 8 causes unresolved peer dependency warnings and breaks configuration compatibility.
  * Deprecation warnings are triggered (e.g., `esbuild` option, `optimizeDeps.rollupOptions`), which leads to runtime bundles failing to compile or evaluate correctly in the browser.

### 2. Missing Environment Variables (`.env` file)
* **What Happened:** The required local environment file `.env` is missing in the workspace root directory.
* **The Impact:**
  * In `src/lib/supabase.ts`, the app reads environment variables:
    ```typescript
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    ```
  * It immediately calls:
    ```typescript
    export const supabase = createClient(supabaseUrl, supabaseAnonKey, { ... });
    ```
  * Because these values are undefined, `@supabase/supabase-js` throws a synchronous runtime exception (`supabaseUrl is required`) at import/evaluation time.
  * Since `supabase` is imported transitively in `src/main.tsx` (via `src/contexts/AuthContext.tsx`), this exception halts JavaScript execution before React can mount the application to the `<div id="root"></div>` element. This results in an empty DOM and a blank screen.

### 3. Concurrent Dev Server Instances
* **What Happened:** Multiple instances of `npm run dev` are currently running in the background.
* **The Impact:**
  * The original port `5173` is occupied, forcing Vite to launch the second server on port `5174`. Running multiple node processes wastes CPU and memory resources and can lead to port conflicts and cache inconsistencies.

---

## 🛠️ Step-by-Step Implementation Plan

### Phase 1: Dependency Restoration
Restore Vite to a stable, compatible version to fix configuration and peer dependency issues while avoiding security vulnerabilities.

- [x] **Task 1.1:** Revert `package.json` devDependencies. Change `"vite": "^8.0.14"` to a stable and secure version compatible with your setup, such as `"vite": "^7.3.3"`.
- [x] **Task 1.2:** Remove current `node_modules` and the lockfile to ensure a clean state.
  ```powershell
  Remove-Item -Recurse -Force node_modules
  Remove-Item -Force package-lock.json
  ```
- [x] **Task 1.3:** Perform a fresh installation of dependencies.
  ```powershell
  npm install
  ```

### Phase 2: Environment Configuration & Defensive Coding
Create the missing `.env` file and introduce runtime safety checks in the code to prevent complete app crashes if credentials are missing in the future.

- [x] **Task 2.1:** Create a template `.env` file at the root of the project with local or mock keys.
  ```env
  VITE_SUPABASE_URL=https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```
- [x] **Task 2.2:** Add defensive configuration guards in `src/lib/supabase.ts` to log clear setup instructions in the console rather than crashing the React bundle.
  ```typescript
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "❌ Supabase environment variables are missing.\n" +
      "Please create a .env file in the project root with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
    );
  }
  ```

### Phase 3: Cleanup & Restart
Clean up running Node processes to prevent conflicts.

- [x] **Task 3.1:** Stop all active dev servers. You can run:
  ```powershell
  Stop-Process -Name "node" -Force
  ```
  *(Note: This stops all local Node processes. Alternatively, close the active terminals running `npm run dev`).*
- [x] **Task 3.2:** Start the dev server in a single terminal.
  ```powershell
  npm run dev
  ```

### Phase 4: Verification
Confirm that the application loads and functions correctly.

- [x] **Task 4.1:** Verify that the development server starts on the default port `localhost:5173`.
- [ ] **Task 4.2:** Open `http://localhost:5173` in the browser and confirm the login page or dashboard is displayed.
- [ ] **Task 4.3:** Verify that there are no red unhandled exception errors in the browser console.

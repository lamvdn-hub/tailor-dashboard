# Forgot Password Routing Fix Plan

This document outlines the diagnosis and step-by-step fix plan for the "forgot password" routing issue. Currently, clicking a password reset link results in a Netlify "Site not found" 404 error page.

---

## 1. Problem Identification

The routing issue is caused by two separate, compounding bugs:

### Bug A: Netlify Static Routing 404 (Primary Cause of "Site not found")
- **Root Cause**: The application is a Single Page React Application (SPA) using client-side routing (`react-router-dom`).
- **Explanation**: When a user clicks the password reset link, they are redirected to `https://<domain>/update-password?code=...`. Netlify attempts to look up a static physical file at `/update-password` or `/update-password/index.html`. Since Vite compiles everything into a single `index.html` bundle, no such file exists, causing Netlify to serve its standard **404 "Site not found"** page.
- **Fix**: We must configure a wildcard redirect rule on Netlify so that any route request defaults back to `/index.html`, allowing the client-side router (`react-router-dom`) to capture the route and load the update password screen.

### Bug B: Client-side PKCE Code Race Condition (Secondary Cause of Redirect Loops)
- **Root Cause**: In modern Supabase (v2), the authentication uses the PKCE flow. This passes a `code` query parameter (`?code=...`) rather than an implicit `#access_token` hash parameter.
- **Explanation**: When the `/update-password` page successfully loads, `isPasswordRecovery` is initially `false` because the async code-to-session exchange is still in progress. The `useEffect` inside `src/pages/UpdatePassword.tsx` only checks for `#access_token` hash parameters. Finding neither, it immediately redirects the user to `/login`, terminating the reset flow prematurely.
- **Fix**: Modify `src/pages/UpdatePassword.tsx` to recognize the `code` query parameter and wait for the Supabase client to complete the authentication exchange instead of immediately redirecting to `/login`.

---

## 2. Implementation Checklist

### Phase 1: Configure Wildcard Routing for Netlify
Configure the hosting environment to serve `/index.html` for any client-side routes.

- [x] **Task 1.1**: Create `_redirects` file in `public/` folder.
  - Path: `public/_redirects`
  - Content: `/*  /index.html  200`
  - *Note: Vite automatically copies all files in the `public/` directory into the build directory (`dist/`) during build execution.*
- [x] **Task 1.2**: Create a `netlify.toml` configuration in the project root to ensure redirection is robust across Netlify build pipelines.
  - Path: `netlify.toml`
  - Content:
    ```toml
    [[redirects]]
      from = "/*"
      to = "/index.html"
      status = 200
    ```

### Phase 2: Resolve the Client-Side PKCE Redirect Bug
Prevent the `UpdatePassword` page from redirecting the user to `/login` when a query parameter `code` is present.

- [x] **Task 2.1**: Update `src/pages/UpdatePassword.tsx`'s `useEffect` guard logic.
  - Add checks for query parameters to identify a recovery `code` from the PKCE flow.
  - Only redirect to `/login` if `isPasswordRecovery` is `false`, there is no `access_token` in the hash, and no `code` in the query search parameters.

---

## 3. Detailed Code Modifications Reference

### Target File: `src/pages/UpdatePassword.tsx`

#### Current Implementation (Lines 16–26):
```typescript
  useEffect(() => {
    if (!isPasswordRecovery) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const type = params.get('type');
      
      if (!accessToken || type !== 'recovery') {
        navigate('/login');
      }
    }
  }, [isPasswordRecovery, navigate]);
```

#### Proposed Implementation:
```typescript
  useEffect(() => {
    if (!isPasswordRecovery) {
      // 1. Check for legacy hash-based access token (implicit flow)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      // 2. Check for PKCE authorization code in the query parameters
      const queryParams = new URLSearchParams(window.location.search);
      const hasCode = queryParams.has('code');

      // Only redirect if there is no session recovery, no hash recovery, and no PKCE auth code
      if ((!accessToken || type !== 'recovery') && !hasCode) {
        navigate('/login');
      }
    }
  }, [isPasswordRecovery, navigate]);
```

---

## 4. Verification Plan

To verify that the password reset mechanism works perfectly after applying changes:

### Manual Testing Procedure
1. Go to `/login` and click **Forgot password?** (or navigate directly to `/password-reset`).
2. Input the user's email address and click **Send Reset Link**.
3. Retrieve the password reset link from the inbox.
4. Click the link and verify that:
   - The browser opens the correct route `https://<domain>/update-password?code=<token>` without returning a Netlify 404 "Site not found" page.
   - The page remains on the **Update Password** page instead of kicking the user back to the login page.
5. Enter a new password, submit the form, and verify that you are redirected to the login page.
6. Log in successfully using the new password.

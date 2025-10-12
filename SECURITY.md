# Security Considerations for Production Deployment

This document outlines critical security considerations when deploying this code playground to production.

## 🚨 Critical Issues (Must Fix Before Production)

### 1. **Iframe Sandbox - CRITICAL**

**Current Issue:**
```html
<iframe sandbox="allow-scripts allow-same-origin allow-forms allow-modals">
```

**Problem:** `allow-same-origin` is **DANGEROUS**. It allows the iframe to:
- Access parent window's localStorage, cookies, and IndexedDB
- Make requests to your domain with your users' credentials
- Potentially bypass CORS restrictions
- Access parent's DOM if origin matches

**Solution:**
```typescript
// Remove allow-same-origin for production
<iframe
  sandbox="allow-scripts allow-forms allow-modals allow-popups"
  // NO allow-same-origin!
/>
```

**Trade-off:** Without `allow-same-origin`, the iframe operates as `null` origin:
- ✅ Cannot access parent's storage/cookies
- ✅ Cannot make same-origin requests to your API
- ❌ `localStorage` won't persist (acceptable for playground)
- ❌ Some libraries may not work (rare)

### 2. **PostMessage Origin Validation - CRITICAL**

**Current Issue:**
```javascript
// In bundler.ts console interceptor
window.parent.postMessage({ ... }, '*');  // Accepts ANY origin!
```

**Problem:** Wildcard `'*'` allows malicious sites to receive messages.

**Solution:**
```typescript
// In Preview.tsx
const ALLOWED_ORIGINS = window.location.origin;

useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    // Validate origin
    if (event.origin !== window.location.origin) {
      return; // Ignore messages from other origins
    }

    if (event.data.type === "console") {
      // ... handle message
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);

// In bundler.ts - update the postMessage call
window.parent.postMessage({
  type: 'console',
  method: method,
  args: args
}, window.location.origin);  // Target specific origin
```

### 3. **Content Security Policy (CSP) Headers**

**Add to your hosting platform:**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://registry.npmjs.org https://esm.sh;
  frame-src 'self';
  worker-src 'self' blob:;
```

**Why:** Prevents XSS attacks and limits what external resources can be loaded.

### 4. **Rate Limiting**

**Problem:** Users can spam the bundler, consuming server resources.

**Solutions:**
- Client-side: Increase debounce from 500ms to 1000ms for production
- Server-side: If you add a backend, implement rate limiting (e.g., 10 builds/minute per user)
- Add max file size limits (e.g., 500KB per file)

```typescript
// In Preview.tsx
debounceTimerRef.current = setTimeout(() => {
  updatePreview();
}, 1000); // Increased from 500ms
```

## ⚠️ Medium Priority Issues

### 5. **Subdomain Isolation (Recommended)**

**Best Practice:** Serve iframe content from a different subdomain.

**Architecture:**
```
Main app:     app.yoursite.com
Iframe:       sandbox.yoursite.com
```

**Benefits:**
- Complete origin isolation
- Even with `allow-same-origin`, iframe can't access main app
- Industry standard (CodeSandbox, StackBlitz use this)

**Implementation:**
1. Deploy preview HTML to separate subdomain
2. Use `<iframe src="https://sandbox.yoursite.com/preview">` instead of `srcDoc`
3. Pass code via postMessage

### 6. **Resource Limits**

Add execution time limits:

```typescript
// In Preview.tsx
const EXECUTION_TIMEOUT = 10000; // 10 seconds

const updatePreview = useCallback(async () => {
  const timeoutId = setTimeout(() => {
    setConsoleMessages(prev => [...prev, {
      id: `${Date.now()}-timeout`,
      method: 'error',
      args: ['Execution timeout: Preview stopped after 10 seconds'],
      timestamp: Date.now(),
    }]);
    setIframeKey(prev => prev + 1); // Force reload to stop execution
  }, EXECUTION_TIMEOUT);

  try {
    const result = await bundleFiles(files);
    clearTimeout(timeoutId);
    // ... rest of code
  } catch (error) {
    clearTimeout(timeoutId);
    // ... error handling
  }
}, [files]);
```

### 7. **Prevent Top-Level Navigation**

Add to iframe:
```html
<iframe
  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"
  // Do NOT add allow-top-navigation
/>
```

### 8. **Sanitize Console Messages**

**Current Issue:** Objects are JSON.stringify'd but could still contain malicious content.

**Solution:**
```typescript
// In bundler.ts console interceptor
args: args.map(arg => {
  try {
    if (typeof arg === 'object') {
      // Limit object depth and size
      return JSON.stringify(arg, null, 2).slice(0, 1000); // Max 1000 chars
    }
    return String(arg).slice(0, 1000);
  } catch (e) {
    return '[Circular or complex object]';
  }
})
```

### 9. **XSS Prevention in User Code**

While users control their own iframe, prevent injection into parent:

```typescript
// Validate file names
const validateFileName = (name: string): boolean => {
  const validPattern = /^[a-zA-Z0-9_.-]+$/;
  return validPattern.test(name) && name.length < 100;
};

// Use in FileTree create/rename operations
if (!validateFileName(inputValue.trim())) {
  alert('Invalid file name. Use only letters, numbers, dots, dashes, and underscores.');
  return;
}
```

## 📋 Pre-Deployment Checklist

- [ ] Remove `allow-same-origin` from iframe sandbox
- [ ] Add origin validation to postMessage handlers
- [ ] Set up CSP headers
- [ ] Increase debounce timeout for production
- [ ] Add file size limits
- [ ] Add execution timeout
- [ ] Validate user input (file names, etc.)
- [ ] Sanitize console messages
- [ ] Consider subdomain isolation
- [ ] Add rate limiting (if using backend)
- [ ] Test with malicious payloads
- [ ] Review all external CDN dependencies (esm.sh, etc.)

## 🔒 Additional Hardening (Optional)

### 10. **Service Workers for Offline/Caching**

But be careful: Service workers have powerful capabilities.

### 11. **Authentication & User Isolation**

If you add user accounts:
- Never trust client-side code
- Validate all operations server-side
- Isolate user data properly
- Use secure session management

### 12. **HTTPS Only**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 13. **Monitoring**

- Monitor for unusual activity (extremely large bundles, rapid requests)
- Set up error tracking (Sentry, LogRocket)
- Monitor esm.sh availability (external dependency)

## 🎯 Deployment Platforms Recommendations

### Vercel (Recommended)
```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh; style-src 'self' 'unsafe-inline'; connect-src 'self' https://registry.npmjs.org https://esm.sh;"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Netlify
```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh;"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

## 📚 References

- [MDN: iframe sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [postMessage Security](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concerns)
- [OWASP Iframe Attacks](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)

---

**Remember:** This playground executes arbitrary user code. Defense in depth is critical!

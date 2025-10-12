# Deployment Guide

## ✅ Security Fixes Applied

The following critical security improvements have been implemented:

### 1. **Iframe Sandbox Hardening** ✅
- **Removed** `allow-same-origin` (CRITICAL FIX)
- Iframe now operates with `null` origin, preventing access to parent's storage/cookies
- Kept: `allow-scripts`, `allow-forms`, `allow-modals`, `allow-popups`

### 2. **PostMessage Origin Validation** ✅
- Changed from wildcard `'*'` to `window.location.origin`
- Added source validation in message handler
- Prevents malicious sites from sending fake console messages

### 3. **Console Message Sanitization** ✅
- Limited message size to 5000 characters
- Prevents DoS via extremely large console outputs
- Handles circular references safely

### 4. **Security Headers Configuration** ✅
- Created `vercel.json` and `netlify.toml` with CSP headers
- Configured X-Frame-Options, X-Content-Type-Options
- Set restrictive Permissions-Policy

## 🚀 Quick Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect to GitHub and push
git push origin main
```

The `vercel.json` file is already configured with security headers.

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Or connect to GitHub and push
git push origin main
```

The `netlify.toml` file is already configured with security headers.

### Other Platforms (Cloudflare Pages, AWS Amplify, etc.)

You'll need to configure these headers in your platform's settings:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh; style-src 'self' 'unsafe-inline'; connect-src 'self' https://registry.npmjs.org https://esm.sh;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

## ⚠️ Known Limitations

### localStorage/sessionStorage Won't Persist
**Impact:** User code cannot use browser storage APIs.

**Why:** We removed `allow-same-origin` for security.

**Workaround:** If you MUST have storage:
1. Deploy iframe to separate subdomain (e.g., `sandbox.yoursite.com`)
2. Re-add `allow-same-origin` (safe because different origin)

### Some Libraries May Not Work
**Impact:** Libraries that require `same-origin` checks might fail.

**Examples:**
- Authentication libraries (OAuth flows)
- Some payment integrations

**Workaround:** Use subdomain isolation (see below).

## 🏗️ Advanced: Subdomain Isolation (Optional)

For maximum security and functionality:

### Architecture
```
Main app:     app.yoursite.com
Sandbox:      sandbox.yoursite.com
```

### Implementation

1. **Deploy preview separately:**
```bash
# In your hosting platform, create subdomain: sandbox.yoursite.com
```

2. **Modify Preview.tsx:**
```typescript
// Instead of srcDoc, use src with subdomain
<iframe
  src={`https://sandbox.yoursite.com/preview?code=${encodeURIComponent(htmlContent)}`}
  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
  // allow-same-origin is now safe (different subdomain)
/>
```

3. **Create preview endpoint** at `sandbox.yoursite.com/preview`

**Benefits:**
- ✅ Complete origin isolation
- ✅ localStorage works
- ✅ Same-origin safe (different subdomain)

## 🧪 Testing Before Deployment

### 1. Test Security
```bash
# Check iframe sandbox
# Open DevTools → Elements → Find iframe
# Verify: sandbox="allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox"

# Test postMessage validation
# Try sending message from different origin - should be ignored
```

### 2. Test Functionality
- [ ] Create/edit/delete files
- [ ] Install packages
- [ ] Switch templates
- [ ] Console output works
- [ ] CSS imports work correctly
- [ ] Material UI template renders properly

### 3. Load Testing
- [ ] Create large files (100+ lines)
- [ ] Install multiple packages
- [ ] Rapid code changes (verify debounce)

## 📊 Monitoring (Post-Deployment)

### Set Up Error Tracking

**Sentry:**
```bash
npm install @sentry/react

# In src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

**LogRocket:**
```bash
npm install logrocket

# In src/main.tsx
import LogRocket from 'logrocket';
LogRocket.init('your-app/id');
```

### Monitor External Dependencies
- esm.sh uptime
- npm registry availability

### Performance Monitoring
- Bundle time (should be < 2s)
- Iframe render time
- Memory usage (watch for leaks)

## 🔒 Security Maintenance

### Regular Tasks
- [ ] Review security headers quarterly
- [ ] Update dependencies monthly
- [ ] Check for new iframe sandbox options
- [ ] Monitor for CSP violations

### Incident Response
1. If XSS found: Deploy fix immediately
2. If DoS attack: Add rate limiting
3. If CDN compromised: Switch CDN provider

## 🆘 Troubleshooting

### Preview not working after deployment
- Check browser console for CSP violations
- Verify esm.sh is reachable
- Check sandbox attributes

### Console messages not appearing
- Verify postMessage origin matches
- Check iframe source validation

### Styles not loading
- Check CSP `style-src` directive
- Verify CSS imports are correct

## 📚 Additional Resources

- [SECURITY.md](./SECURITY.md) - Detailed security analysis
- [README.md](./README.md) - Project documentation
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**Ready to Deploy?** ✅ Security fixes applied, configuration files created, you're good to go!

# Security Recommendations for Public Deployment

## Current Security Status
✅ Iframe sandbox enabled
✅ Message origin validation
✅ Separate domain deployment
✅ CSP headers configured

## Required for Public Access

### 1. User Authentication (CRITICAL)
**Status:** NOT IMPLEMENTED
**Risk Level:** 🔴 HIGH

**Implementation:**
```bash
npm install @clerk/clerk-react
# or
npm install @supabase/auth-ui-react
# or
npm install @auth0/auth0-react
```

**Why:** Prevents anonymous abuse, enables user tracking and banning.

### 2. Network Request Restrictions (CRITICAL)
**Status:** PARTIALLY IMPLEMENTED
**Risk Level:** 🔴 HIGH

**Add to `netlify.toml`:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://esm.sh https://cdn.jsdelivr.net https://ga.jspm.io;
      style-src 'self' 'unsafe-inline';
      connect-src 'self' https://esm.sh https://cdn.jsdelivr.net https://ga.jspm.io;
      img-src 'self' https: data:;
      font-src 'self' https: data:;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    '''
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

**Why:** Prevents using your site as a proxy for attacks.

### 3. Rate Limiting (REQUIRED)
**Status:** NOT IMPLEMENTED
**Risk Level:** 🟡 MEDIUM

**Implementation in `src/components/Preview.tsx`:**
```typescript
// Add these refs
const rateLimitRef = useRef({
  updates: 0,
  lastReset: Date.now(),
  bundleCount: 0,
});

// Inside updatePreview callback, add at the start:
const now = Date.now();
const timeSinceReset = now - rateLimitRef.current.lastReset;

// Reset counter every 10 seconds
if (timeSinceReset > 10000) {
  rateLimitRef.current.updates = 0;
  rateLimitRef.current.lastReset = now;
}

// Limit to 20 updates per 10 seconds
rateLimitRef.current.updates++;
if (rateLimitRef.current.updates > 20) {
  console.warn('[Preview] Rate limit exceeded');
  setConsoleMessages(prev => [...prev, {
    id: Date.now().toString(),
    method: 'error',
    args: ['⚠️ Too many updates. Please wait a moment.'],
    timestamp: Date.now()
  }]);
  return;
}
```

**Why:** Prevents spam, DDoS participation, crypto mining abuse.

### 4. Content Warning Banner (REQUIRED)
**Status:** NOT IMPLEMENTED
**Risk Level:** 🟡 MEDIUM

**Add to `src/components/Preview.tsx`:**
```tsx
<div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-2">
  <div className="flex items-center">
    <div className="flex-shrink-0">
      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </div>
    <div className="ml-3">
      <p className="text-sm text-yellow-700">
        <strong>Warning:</strong> Only run code you trust. User-generated content.
      </p>
    </div>
  </div>
</div>
```

**Why:** Legal protection, sets user expectations.

### 5. Session Limits (RECOMMENDED)
**Status:** NOT IMPLEMENTED
**Risk Level:** 🟢 LOW

**Implementation using localStorage:**
```typescript
// Track session usage
const SESSION_LIMIT = 50; // max 50 bundles per session
const sessionKey = 'playground_usage';

const usage = parseInt(localStorage.getItem(sessionKey) || '0');
if (usage >= SESSION_LIMIT) {
  alert('Session limit reached. Please refresh the page.');
  return;
}
localStorage.setItem(sessionKey, String(usage + 1));
```

**Why:** Prevents long-running abuse sessions.

### 6. Terms of Service & Abuse Reporting (REQUIRED)
**Status:** NOT IMPLEMENTED
**Risk Level:** 🟡 MEDIUM

**Create `ToS.tsx`:**
```tsx
export const TermsOfService = () => (
  <div className="prose">
    <h2>Acceptable Use Policy</h2>
    <p>By using this playground, you agree NOT to:</p>
    <ul>
      <li>Create phishing or scam pages</li>
      <li>Mine cryptocurrency</li>
      <li>Attack or probe other websites</li>
      <li>Host illegal content</li>
      <li>Circumvent security measures</li>
    </ul>
    <p><strong>Violations will result in permanent ban.</strong></p>

    <h3>Report Abuse</h3>
    <p>Email: abuse@yourdomain.com</p>
  </div>
);
```

**Why:** Legal protection, clear rules.

### 7. URL Obfuscation (OPTIONAL)
**Status:** NOT IMPLEMENTED
**Risk Level:** 🟢 LOW

**Make it clear code is user-generated:**
```typescript
// Change URL pattern from:
// code-playground.com/project-123

// To:
// code-playground.com/sandbox/user-abc123/project-xyz
// or
// sandbox-abc123.code-playground.com
```

**Why:** Makes it obvious content is user-generated.

## Attack Scenarios & Mitigations

| Attack | Risk | Mitigation |
|--------|------|------------|
| Proxy for CSRF attacks | 🔴 HIGH | CSP `connect-src` restriction |
| Phishing pages | 🔴 HIGH | Auth + Warning banner + ToS |
| Crypto mining | 🟡 MEDIUM | Rate limiting + Session limits |
| DDoS participation | 🟡 MEDIUM | Rate limiting + CSP |
| Illegal content | 🟡 MEDIUM | Auth + Reporting system + ToS |
| Spam/Abuse | 🟢 LOW | Auth + Rate limiting |

## Implementation Priority

**Week 1 (Launch Blockers):**
1. ✅ Add user authentication
2. ✅ Add CSP network restrictions
3. ✅ Add warning banner
4. ✅ Create Terms of Service

**Week 2 (Important):**
5. ✅ Implement rate limiting
6. ✅ Add abuse reporting email
7. ✅ Session limits

**Week 3 (Nice to have):**
8. ✅ URL obfuscation
9. ✅ Usage analytics
10. ✅ Admin dashboard for monitoring

## Monitoring & Response

**Set up alerts for:**
- Unusual network patterns
- High bundle counts from single user
- Error rate spikes
- Abuse reports

**Response plan:**
1. Ban user account (via auth provider)
2. Block IP (Netlify/Cloudflare)
3. Review code history
4. Report to authorities if illegal content

## Legal Protection

**Add to your site footer:**
```
User-generated content. We do not endorse or control user submissions.
Report abuse: abuse@yourdomain.com
```

**Include in ToS:**
- DMCA takedown process
- User liability for their code
- Right to terminate accounts
- No warranty/liability disclaimer

## External Dependencies

**Monitor these services:**
- esm.sh uptime
- cdn.jsdelivr.net uptime
- Auth provider status

**Have backup CDNs configured** in case primary goes down.

## Cost Considerations

**Public deployment costs:**
- Auth service: $0-25/mo (Clerk/Supabase free tier usually sufficient)
- Netlify bandwidth: $0 (usually under free tier)
- CDN costs: $0 (external CDNs)
- Monitoring: $0 (Sentry free tier)

**Total: ~$0-25/month for small-medium traffic**

## Recommended Services

**Authentication:**
- Clerk (easiest): https://clerk.com
- Supabase (open source): https://supabase.com
- Auth0 (enterprise): https://auth0.com

**Monitoring:**
- Sentry (errors): https://sentry.io
- LogRocket (sessions): https://logrocket.com
- Cloudflare Analytics (traffic): Free

**CDN/Security:**
- Cloudflare (proxy + DDoS): Free tier available
- Netlify (hosting + headers): Free tier sufficient

## Summary

**For internal use:** ✅ Current setup is perfect

**For public use:** ⚠️ Requires the following CRITICAL changes:
1. User authentication (prevent anonymous abuse)
2. Network restrictions (prevent proxy attacks)
3. Rate limiting (prevent resource abuse)
4. Warning banner + ToS (legal protection)

**Timeline to public-ready:** ~1-2 weeks of additional work

**Is it worth it?**
- If < 1000 users: Yes, manageable
- If > 10,000 users: Consider backend API for better control
- If viral potential: Add moderation team + automated scanning

---

**Bottom line:** Your current setup is NOT safe for public use without authentication + network restrictions. But with those changes, it's as secure as CodeSandbox/JSFiddle.

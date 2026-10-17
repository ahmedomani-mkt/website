---
name: ads-tracking-audit
description: Audit conversion tracking (Meta Pixel / WhatsApp / add-to-cart / lead) when ads are running or about to run, especially if "ads produced no calls/leads". Use on marketing/lead-gen sites.
---
# Ads tracking audit

Evidence: one incident (user ran ads, got no WhatsApp calls; the homepage fired only PageView) → medium confidence for the procedure.

1. **Map the funnel**: which pages receive ad traffic (ask the user for the ad destination), and every CTA on them (WhatsApp links, call, cart, forms).
2. **Check the pixel is installed on each landing page** (ID source, injection timing, CSP allows the platform hosts, ID sanitised).
3. **Per CTA, find the event** in code. List `page · CTA · event · status`. Missing ones are the likely cause of "no conversions".
4. **Fix**: central handler for link CTAs (e.g. Contact + custom event with placement), no duplicate events on pages that already fire their own, owner exclusion switch respected, cache pixel ID for early load.
5. **Test the client call** with a stubbed/wrapped `fbq` and a real click. State clearly that the platform's servers can't be seen from the sandbox.
6. **Tell the user what only they can check**: Test Events tool, ad type (click-to-WhatsApp conversations are counted by the platform, not the site), optimisation event, ad destination URL, learning period (~50 events/week).
7. Access for third parties (media buyer): via the platform's business settings with least privilege; never share site-admin or personal passwords.

Don't: claim conversions work, or that ads will perform, from code inspection alone.

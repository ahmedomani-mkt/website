---
paths:
  - "**/*.html"
  - "**/*.js"
---
# Tracking & ads rules
Evidence: corrections-log #21; one project only, so confidence is medium.

- Every conversion CTA (WhatsApp, call, add-to-cart, form) on **every page that can receive ad traffic** fires an event. Audit all pages, not only the catalog.
- One tracking function per event; pages that already fire their own event must not be double-counted.
- Sanitise tracking IDs (`^[A-Za-z0-9_-]{1,64}$`) before injecting them into inline scripts; keep the CSP allowing only needed hosts.
- Respect an owner "do not track" switch.
- Load the pixel as early as possible (cache the ID) so quick bounces are counted.
- You cannot see the ad platform's servers. Say so, and tell the user to confirm in the platform's test-events tool.

# CWB isolated static pilot

This directory is the stage-2 architecture skeleton for the CWB shadow-static pilot.
It is intentionally separate from the current Next.js application.

## Stage-2 boundary

- The frozen production source is commit `7b73675db9f94ac06602875f6970a7de191ee909`.
- The public baseline contains 54 URLs, 69 unique media resources, and zero SEO-audit findings.
- This branch builds a noindex architecture-status Preview only.
- It does not migrate the 54 public pages yet.
- It does not change Production, the production domain, DNS, R2, or any other site.
- The existing Next.js source remains untouched and is the rollback source of truth.

## Data layout

```text
static-pilot/
  contracts/              JSON Schemas and review rules
  data/
    site.json              site-wide invariants and approval policy
    routes.json            frozen 54-URL routing/SEO contract
    entities.json          content entities referenced by routes
    examples/              product and article automation examples
  approvals/               human approval boundary documentation
scripts/static/
  validate-contract.mjs    deterministic safety and consistency checks
  build-preview.mjs        dependency-free static Preview builder
```

## Commands

```powershell
npm run static:contract:validate
npm run static:preview:build
```

The Preview output is `static-pilot-dist/`. It contains no Next.js or React runtime.

## Automation contract

An agent may prepare content, OCR results, translations, schemas, route records, and a
Preview. It may not approve factual supplier claims, change a published URL, remove a
product, alter contact details, migrate content across sites, or promote Production.
Those actions are represented as explicit human gates in `data/site.json`.

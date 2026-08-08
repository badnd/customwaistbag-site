# Agent publishing boundary

The static pilot exposes a data-first publishing entry instead of coupling an agent to
HTML templates. An agent writes a versioned entity JSON file and a publish-job envelope,
then invokes deterministic validators and the Preview builder.

Pipeline:

`asset intake -> OCR -> draft -> fact review -> EN/RU -> Schema -> sitemap -> build -> Preview -> audits -> human approval -> Production`

The product contract carries display order, original and R2 asset paths, SHA256, pHash,
OCR state and hash-bound exemptions, bilingual copy and FAQ, evidence-backed facts,
structured data, sitemap/hreflang, related products, review state, and lifecycle action.

This does not implement the future P1-P6 operator client. It keeps those tools replaceable:

- Intake clients may create the same entity and job JSON through CLI, desktop UI, or API.
- Rendering consumes contracts, not client-specific payloads.
- Destructive actions remain representable but stop at `pending-human`.
- Production approval cannot be set to true by the current schemas.
- Credentials are environment references in deployment code, never content fields.

No interface is frozen to one AI provider, one UI, or one deployment vendor.

The static form transport must call
`window.CWBInquiryAnalytics.trackFormSuccess(sourceLocation)` only after its real endpoint
returns success. Button clicks and validation failures must not emit
`inquiry_form_submit`. Mailto and WhatsApp events are delegated from their real links,
so adding a new CTA does not require a second analytics implementation.

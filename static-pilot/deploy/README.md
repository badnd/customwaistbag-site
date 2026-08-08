# Static deployment notifications

Production deployment will run IndexNow and Cloudflare purge as visible, non-blocking
post-deploy jobs. Preview deployments do not notify search engines or purge Production.

## IndexNow contract

Input is the exact set of new or changed canonical URLs from the publish-job envelope.
The submitter sends the same verified URL set to Bing and Yandex using a platform secret.
No IndexNow key is stored in this repository.

Each provider attempt emits a `post-deploy-result.schema.json` record with HTTP status and
message. A missing key, empty changed-URL set, network error, or provider rejection may let
the deployment remain available, but the job is recorded as `ok: false` with the real
reason. `skipped: true` is never treated or reported as success.

## CDN purge contract

Cloudflare purge follows the same result schema and visibility rule. It runs only after a
successful Production deployment and uses Vercel environment variables. Failure does not
roll back a valid static deployment, but must fail the notification check and appear in
the deployment summary.

Actual network submitters and CI wiring are intentionally deferred until the migrated
pages exist in Steps 4-5. This stage fixes their input/output contracts so later wiring
does not require redesigning content or the Agent intake path.

The planned Production job order is: static preflight, deploy, direct-200 URL check,
IndexNow submit, and CDN purge. `seo:audit` runs against the deployed Preview/Production;
`dedup:lint`, `images:audit` (pHash), and `ocr:guard` remain repository preflight gates.

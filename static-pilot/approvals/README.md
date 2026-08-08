# Human approval gates

The static pipeline must stop before any of these actions:

1. Publishing or changing MOQ, certification, price, factory age, capacity, lead time,
   sample-fee policy, dimensions, materials, or any other supplier fact without evidence.
2. Deleting, unpublishing, redirecting, renaming, or changing an already published URL.
3. Moving a product or asset across sites.
4. Changing email, WhatsApp, WeChat, GA4, verification tags, domains, DNS, or credentials.
5. Promoting a Preview deployment to Production.
6. Sending a real inquiry, quote, delivery promise, or price commitment.

Agent output must carry `review.status = "pending-human"` until the operator approves it.
Credentials remain in platform secrets and are never stored in content JSON or reports.

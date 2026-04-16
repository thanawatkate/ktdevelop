# ktdevelop

## POS Integration (Security-First)

This project can sync quote data to a separate POS service using signed API requests.

### Environment Variables

Set these variables in `.env` when enabling sync:

- `POS_SYNC_ENABLED` (`true` or `false`)
- `POS_API_BASE_URL` (for example `https://pos.example.com`)
- `POS_API_KEY` (service-to-service API key)
- `POS_WEBHOOK_SECRET` (shared HMAC secret used for request signing)
- `POS_REQUEST_TIMEOUT_MS` (optional, default `1500`)
- `POS_SYNC_MAX_RETRIES` (optional, default `1`)
- `POS_SYNC_PROCESS_LIMIT` (optional, default `100` for worker batch size)

### Security Controls

- Every outbound request to POS includes:
	- `X-API-Key`
	- `X-Timestamp`
	- `X-Signature` (HMAC-SHA256 of `timestamp.body`)
	- `X-Idempotency-Key` (quote number)
- Quote creation remains resilient even if POS is temporarily unavailable.

### Admin Re-Sync Endpoint

- `POST /api/integrations/pos/quotes/:id`
- Requires admin authorization (same admin cookie/token flow as other admin APIs).
- Use this endpoint to retry syncing an existing quote to POS.

### Sync Queue Operations

This project stores quote sync states in `quote_pos_sync` and supports retry processing:

- Read latest statuses: `GET /api/admin/quotes/sync?limit=100`
- Process pending rows now: `POST /api/admin/quotes/sync` with optional body `{ "limit": 50 }`
- CLI worker command:

```bash
npm run pos:sync:pending
```

Recommended production setup: run the worker command on a scheduler (for example every 1-5 minutes).


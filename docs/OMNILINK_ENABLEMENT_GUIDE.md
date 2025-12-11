# OMNiLiNK Enablement (Optional)

Follow these steps when you’re ready to connect TradeLine 24/7 to the APEX OMNiLiNK bus. If you skip them, the app keeps working normally.

1) Get credentials from APEX / OMNiLiNK  
   - Base URL and Tenant ID (no secrets go in code).

2) Set environment variables  
   - `OMNILINK_ENABLED=true`  
   - `OMNILINK_BASE_URL=https://your-omnlink.example.com`  
   - `OMNILINK_TENANT_ID=your-tenant-id`

3) Redeploy / restart the app  
   - New env values take effect on the next deploy/restart.

4) Verify the connection  
   - Call `/health/omnlink` (HTTP) or run `npm run omnlink:health`.  
   - Look for `status: "ok"`.  
   - If it shows `disabled`, enable the env flag. If it shows `error`, fix the missing fields and try again.

Notes  
- OMNiLiNK is optional. If it’s disabled or unreachable, TradeLine 24/7 continues to run.  
- Keep credentials out of source control; use environment configuration only.


# Phase 5: DNS & SSL Configuration

**Status:** ⏳ PENDING  
**Date:** 2025-10-08

## Commands

```bash
# Verify CNAME
nslookup www.autorepai.ca

# Verify apex redirect
curl -sI https://autorepai.ca | grep -i "location\|^HTTP/"

# Verify SSL
curl -vI https://www.autorepai.ca/ 2>&1 | grep -E 'SSL|TLS|subject'
```

## Requirements
- www.autorepai.ca → CNAME to Lovable hostname
- autorepai.ca → 301 redirect to https://www.autorepai.ca
- Remove A/AAAA records for www
- Valid SSL certificate

**Gate:** ✅ PASS when all commands show correct output

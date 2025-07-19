# Security Setup for Diamond Finder

## API Key Authentication for Admin Endpoints

The admin refresh endpoints (`/admin/trigger-refresh` and `/admin/trigger-refresh-partial`) are protected with API key authentication to prevent unauthorized access.

### Setup Instructions

#### 1. Generate a Strong API Key

Generate a secure random API key. You can use one of these methods:

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator (use a trusted source)
# Visit: https://passwordsgenerator.net/ and generate a 32+ character key
```

#### 2. Set the API Key in Fly.io

```bash
# Replace 'your-generated-api-key-here' with the actual key
fly secrets set REFRESH_API_KEY=your-generated-api-key-here
```

Verify the secret was set:
```bash
fly secrets list
```

#### 3. Add the API Key to GitHub Repository Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Set:
   - **Name**: `REFRESH_API_KEY`
   - **Value**: The same API key you used in step 2
5. Click **Add secret**

### Testing the Setup

#### Test Manual Endpoint Call

```bash
# Replace 'your-api-key' with your actual key
curl -X POST "https://diamond-finder.fly.dev/admin/trigger-refresh" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key"
```

Expected response:
```json
{
  "success": true,
  "message": "Diamond database refresh triggered successfully in the background. Monitor progress via `fly logs`.",
  "note": "This process will continue running on the server. Check logs for completion status."
}
```

#### Test Unauthorized Access

```bash
# This should return 401 Unauthorized
curl -X POST "https://diamond-finder.fly.dev/admin/trigger-refresh" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "message": "Unauthorized. Valid API key required."
}
```

### GitHub Actions Integration

The scheduled diamond refresh workflow automatically includes the API key from repository secrets:

```yaml
- name: Trigger Diamond Refresh
  run: |
    response=$(curl -s -w "%{http_code}" -X POST \
      "https://diamond-finder.fly.dev/admin/trigger-refresh" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${{ secrets.REFRESH_API_KEY }}" \
      -o response_body.txt)
```

### Security Best Practices

1. **Keep the API key secret** - Never commit it to version control
2. **Rotate the key periodically** - Update both Fly.io and GitHub secrets
3. **Monitor access logs** - Check `fly logs` for unauthorized attempts
4. **Use HTTPS only** - The endpoints only work over HTTPS in production

### Troubleshooting

#### Common Issues

**401 Unauthorized Error:**
- Check that `REFRESH_API_KEY` is set in Fly.io: `fly secrets list`
- Verify the GitHub secret value matches the Fly.io secret
- Ensure the Authorization header format is correct: `Bearer <token>`

**Environment Variable Not Set:**
- If you see "REFRESH_API_KEY environment variable not set" in logs
- Run: `fly secrets set REFRESH_API_KEY=your-key-here`
- Restart the app: `fly apps restart diamond-finder`

**GitHub Actions Failing:**
- Check that the `REFRESH_API_KEY` repository secret exists
- Verify the secret value is correct
- Look at the GitHub Actions logs for specific error messages
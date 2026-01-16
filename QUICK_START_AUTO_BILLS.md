# Quick Start: Automatic Rent Bill Generation

## What's New?

Your plaza management system can now **automatically generate rent bills** on a specific day each month!

## How to Enable (3 Simple Steps)

### Step 1: Set the Generation Day
1. Login as Admin
2. Go to **Settings**
3. Set **Rent Bill Generation Day** (e.g., `5` for 5th of every month)
4. Save settings

### Step 2: Add Environment Variable
Add to your `.env.local` file (or hosting environment variables):

```bash
CRON_SECRET=your-secure-random-string-here
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Step 3: Deploy
- **If using Vercel**: Just deploy - it's already configured in `vercel.json`
- **If using other hosting**: Set up an external cron service (see full guide)

## Testing

Test locally by visiting (in development mode):
```
http://localhost:3000/api/cron/generate-rent-bills
```

You should see a response like:
```json
{
  "success": true,
  "message": "Rent bill generation completed",
  "statistics": {
    "total": 10,
    "generated": 8,
    "skipped": 2,
    "failed": 0
  }
}
```

## How It Works

- **Runs daily at 2:00 AM** (checks if today is the generation day)
- **Generates bills** for all businesses with rent management enabled
- **Skips duplicates** - won't generate twice for the same month
- **Skips advances** - won't generate if business already paid advance
- **Sets due date** to 15 days from generation
- **Logs everything** in Activity Logs

## Need Help?

See the complete setup guide: `AUTOMATIC_RENT_BILL_GENERATION_SETUP.md`

## What if I Don't Want Automatic Generation?

No problem! The system still works exactly as before:
- You can manually generate bills using "Generate All Bills" button
- Nothing changes if you don't set up the cron job
- The generation day setting is optional

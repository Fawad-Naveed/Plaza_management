# Automatic Rent Bill Generation Setup Guide

This guide explains how to set up automatic rent bill generation for your plaza management system.

## Overview

The system can automatically generate rent bills on a specific day of each month (e.g., 1st, 5th, 15th, etc.). This is configured in the Settings page under the "Rent Bill Generation Day" field.

## How It Works

1. **Configuration**: Admin sets the generation day in Settings (e.g., day 5 = bills generate on 5th of every month)
2. **Automatic Trigger**: A cron job runs daily at 2 AM (server time)
3. **Bill Generation**: If today matches the configured day, the system:
   - Checks all businesses with rent management enabled
   - Skips businesses that have already paid advance for the month
   - Skips businesses that already have a bill for the current month
   - Generates rent bills for all eligible businesses
   - Sets due date to 15 days from generation date
   - Logs all activities for tracking

## Setup Options

You have **three options** to enable automatic bill generation:

### Option 1: Vercel Cron (Recommended if deployed on Vercel)

If your application is deployed on Vercel:

1. The `vercel.json` file is already configured
2. Set the `CRON_SECRET` environment variable in your Vercel project:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `CRON_SECRET` = `your-secure-random-string-here`
   - Generate a secure random string: `openssl rand -base64 32`

3. Deploy your application - Vercel will automatically set up the cron job

**Vercel Cron runs daily at 2:00 AM UTC** and checks if today is the configured generation day.

### Option 2: External Cron Service (Works with any hosting)

If not using Vercel, use an external cron service:

#### Recommended Services:
- [cron-job.org](https://cron-job.org) (Free)
- [EasyCron](https://www.easycron.com) (Free tier available)
- [Cronitor](https://cronitor.io) (Free tier available)

#### Setup Steps:

1. **Add CRON_SECRET to your environment variables**:
   ```bash
   # In your .env.local file
   CRON_SECRET=your-secure-random-string-here
   ```

2. **Configure the cron service**:
   - URL: `https://your-domain.com/api/cron/generate-rent-bills`
   - Method: `POST`
   - Schedule: `Daily at 2:00 AM` (or your preferred time)
   - Headers:
     ```
     Authorization: Bearer your-secure-random-string-here
     ```

3. **Test the endpoint** (see Testing section below)

### Option 3: Manual Trigger (Not recommended for production)

For testing or if you want to manually generate bills:

1. The admin can manually click "Generate All Bills" button in the Rent Management section
2. This requires manual action each month

## Environment Variables

Add these to your `.env.local` file (or hosting platform's environment variables):

```bash
# Required: Secret key for cron authentication
CRON_SECRET=your-secure-random-string-here

# Generate a secure secret:
# openssl rand -base64 32
```

## Testing

### Test in Development (Local)

1. Set your rent bill generation day in Settings
2. Temporarily change the generation day to today's date
3. Visit: `http://localhost:3000/api/cron/generate-rent-bills`
4. Check the response for generation statistics

### Test in Production

```bash
# Using curl
curl -X POST https://your-domain.com/api/cron/generate-rent-bills \
  -H "Authorization: Bearer your-cron-secret"

# Expected response:
{
  "success": true,
  "message": "Rent bill generation completed",
  "date": "2026-01-15T...",
  "generationDay": 15,
  "statistics": {
    "total": 10,
    "generated": 8,
    "skipped": 2,
    "failed": 0
  }
}
```

## Monitoring

### Check if bills were generated:
1. Go to Admin Dashboard → Rent Management → All Bills
2. Filter by current month
3. Check Activity Logs for automatic generation entries

### Common Issues:

**Bills not generating?**
- Check that the generation day is set in Settings
- Verify today's date matches the configured day
- Check cron service logs
- Verify CRON_SECRET is correctly set
- Test the endpoint manually

**Bills generated multiple times?**
- The system has duplicate protection built-in
- Each business can only have one bill per month
- If you see duplicates, check your cron service configuration

**Some businesses skipped?**
- Businesses with rent advances are automatically skipped
- Businesses without rent management enabled are skipped
- Check Activity Logs for detailed information

## Security

The API endpoint is protected by:
1. **Bearer token authentication**: Only requests with the correct `CRON_SECRET` are processed
2. **No sensitive data exposure**: Errors don't reveal system details
3. **Rate limiting**: Vercel automatically rate-limits API routes

⚠️ **Important**: Keep your `CRON_SECRET` secure and never commit it to version control!

## Customization

To customize the automatic generation behavior, edit:
`/app/api/cron/generate-rent-bills/route.ts`

You can modify:
- Due date calculation (currently 15 days from generation)
- Terms & conditions selection
- Skip conditions
- Notification logic (future feature)

## Future Enhancements

Potential improvements:
- Email notifications to tenants when bills are generated
- SMS notifications
- Custom due date per business
- Configurable terms & conditions per bill
- Retry logic for failed generations
- Admin dashboard for cron job monitoring

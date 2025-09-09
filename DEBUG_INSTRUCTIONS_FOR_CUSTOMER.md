# Debug Version - Instructions for Customer

## How to Use the Debug Version

The debug version of the Plaza Management System will help us identify exactly what's causing the error on your computer.

### Step 1: Run the Debug Version
1. Install and run the debug version: `Darbaal Plaza Setup 0.1.0.exe`
2. When the application opens, you'll see **Developer Tools** window alongside the main application window
3. This is normal and expected for the debug version

### Step 2: Look for the Error
1. **In the main application window**: Look for any error messages or loading issues
2. **In the Developer Tools window**: Look for error messages in the "Console" tab

### Step 3: Capture the Error Information

**Option A: If you see an error in the main window:**
- Take a screenshot of the error message
- Include the full error text in your report

**Option B: If the application loads but doesn't work properly:**
1. In the Developer Tools window, click on the **"Console"** tab
2. Look for any messages in **red text** (these are errors)
3. Take a screenshot of the Console tab showing the errors

### Step 4: Check Network Connection
1. In the Developer Tools, click on the **"Network"** tab
2. Try to use a feature in the application (like loading the dashboard)
3. Look for any **failed requests** (shown in red in the Network tab)
4. Take a screenshot if you see failed network requests

### Step 5: Send Us the Information

Please send us:
1. **Screenshots** of any error messages
2. **Screenshots** of the Console tab if there are red error messages
3. **Screenshots** of the Network tab if there are failed requests
4. **Description** of what you were doing when the error occurred
5. **Your Windows version** (e.g., Windows 10, Windows 11)
6. **Internet connection status** (working/not working)

## Understanding Common Errors

### Network Errors
- Look for messages about "failed to fetch" or "network error"
- These usually mean internet connection issues

### JavaScript Errors
- Look for messages about "TypeError" or "ReferenceError" 
- These usually mean compatibility issues with your system

### Database Connection Errors
- Look for messages about "Supabase" or "database"
- These usually mean the app can't connect to our online database

## Quick Self-Help

Before contacting support:
1. **Check internet connection**: Try opening a website in your browser
2. **Run as Administrator**: Right-click the app → "Run as administrator"
3. **Disable Antivirus temporarily**: Your antivirus might be blocking the app
4. **Restart your computer**: Sometimes a simple restart helps

---

**Important**: The debug version is only for troubleshooting. Once we identify and fix the issue, we'll send you a regular version without the Developer Tools window.

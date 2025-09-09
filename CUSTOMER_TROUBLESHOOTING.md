# Plaza Management System - Troubleshooting Guide

## If you see "Application error: a client-side exception has occurred"

This error usually happens due to network connectivity or system compatibility issues. Here's how to resolve it:

### Quick Solutions

1. **Check Internet Connection**
   - Make sure your computer is connected to the internet
   - The application needs internet access to connect to the database

2. **Run as Administrator**
   - Right-click on the application
   - Select "Run as administrator"
   - This helps with Windows permission issues

3. **Restart the Application**
   - Close the application completely
   - Wait a few seconds
   - Open it again

4. **Windows Defender/Antivirus**
   - Your antivirus might be blocking the application
   - Add the application folder to your antivirus exclusions
   - Try temporarily disabling real-time protection

### Advanced Troubleshooting

5. **Enable Debug Mode**
   - If you have the debug version, it will show more detailed error information
   - Look for specific error messages in the developer console

6. **Check System Requirements**
   - Windows 10 or later (64-bit)
   - At least 4GB RAM
   - Active internet connection
   - .NET Framework (usually installed automatically)

7. **Clear Application Data**
   - Go to: `%APPDATA%/darbaal-plaza`
   - Delete the folder if it exists
   - Restart the application

### Getting Help

If none of these solutions work:

1. Take a screenshot of the error message
2. Note what you were doing when the error occurred
3. Check if you can access the internet from other applications
4. Contact support with:
   - Your Windows version
   - The screenshot of the error
   - Description of what happened

### Common Causes

- **Network Issues**: Most common cause - check internet connection
- **Firewall Blocking**: Windows Firewall or antivirus blocking the app
- **Missing Dependencies**: Windows might be missing required system files
- **Permissions**: Application doesn't have required permissions
- **Outdated Windows**: Very old Windows versions may not be compatible

---

**Note**: This application requires an active internet connection to work properly as it connects to an online database.

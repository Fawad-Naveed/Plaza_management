# Plaza Management System - Desktop App

A desktop application built with Next.js and Electron for managing plaza operations.

## Features

- Customer Management
- Bill Generation
- Payment Processing
- Gas Management
- Maintenance Tracking
- Reports & Analytics
- Meter Reading Management

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account and project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Set up database:
```bash
# Run SQL migration scripts in order
# Check the SQL files in the root directory
```

### Development Commands

```bash
# Web development
npm run dev          # Start Next.js dev server

# Electron development
npm run electron-dev # Start both Next.js and Electron in dev mode

# Build for production
npm run build        # Build Next.js app
npm run electron     # Run Electron with built app
```

## Building for Distribution

### Build Desktop App

```bash
# Build and package for current platform
npm run dist

# Build for specific platforms
npm run electron-build
```

### Build Targets

- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer (NSIS)
- **Linux**: `.AppImage` file

## Project Structure

```
├── app/                 # Next.js app directory
├── components/          # React components
├── electron/           # Electron main process
│   ├── main.js        # Main Electron process
│   └── preload.js     # Preload script
├── lib/               # Utilities and database
├── public/            # Static assets
└── out/              # Built static files (generated)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

## Database Setup

1. Create a Supabase project
2. Run the SQL migration scripts in order:
   - `scripts/001_create_plaza_schema.sql`
   - `scripts/002_create_maintenance_schema.sql`
   - Additional migration files as needed

## Security Features

- Context isolation enabled
- Node integration disabled
- Web security enabled
- External links opened in default browser
- Secure IPC communication

## Troubleshooting

### Common Issues

1. **Build fails**: Ensure all dependencies are installed
2. **Database connection**: Verify Supabase credentials
3. **Electron won't start**: Check if Next.js dev server is running

### Development Tips

- Use `npm run electron-dev` for development
- Check console logs in Electron DevTools
- Verify environment variables are set correctly


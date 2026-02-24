# TrackZen Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Copy your service role key (keep this secret!)

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=run_openssl_rand_base64_32_to_generate

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI (Optional)
CLAUDE_API_KEY=your_claude_api_key
```

### 4. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in your `.env` file.

### 5. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### 6. Push Database Schema

```bash
npm run db:push
```

This will create all necessary tables in your Supabase database.

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/trackzen.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Add all environment variables from `.env`
5. Update `NEXTAUTH_URL` to your production URL
6. Update Google OAuth redirect URI to include your production URL
7. Deploy!

### 3. Update Google OAuth

In Google Cloud Console, add your Vercel URL to authorized redirect URIs:
```
https://your-app.vercel.app/api/auth/callback/google
```

## Optional: AI Features

To enable AI-assisted plan generation:

### Option 1: Claude API (Recommended)

1. Sign up at [anthropic.com](https://www.anthropic.com/)
2. Get your API key
3. Add to `.env`: `CLAUDE_API_KEY=your_key`

### Option 2: OpenAI API

1. Sign up at [openai.com](https://openai.com/)
2. Get your API key
3. Add to `.env`: `OPENAI_API_KEY=your_key`

## Troubleshooting

### Database Connection Issues

- Make sure your Supabase project is active
- Check if your IP is allowed (Supabase → Settings → Database → Connection pooling)
- Verify `DATABASE_URL` format is correct

### NextAuth Issues

- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Verify Google OAuth credentials are correct

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Type Errors

```bash
# Regenerate types
npm run db:generate
```

## Database Management

### View Database

```bash
npm run db:studio
```

This opens Drizzle Studio at [https://local.drizzle.studio](https://local.drizzle.studio)

### Reset Database

⚠️ **Warning**: This will delete all data!

```bash
# Drop all tables and recreate
npm run db:push
```

## Development Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Generate database migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open database studio
npm run db:studio
```

## Support

If you encounter issues:

1. Check the [README.md](README.md) for common solutions
2. Search existing GitHub issues
3. Create a new issue with detailed error logs

Happy coding! 🚀

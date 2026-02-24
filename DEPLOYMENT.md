# 🚀 TrackZen Deployment Checklist

Use this checklist to deploy TrackZen to production.

## ☐ Phase 1: Local Setup & Testing

### 1. Environment Setup
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Generate NextAuth secret: `openssl rand -base64 32`

### 2. Database Setup (Supabase)
- [ ] Create Supabase account at supabase.com
- [ ] Create new project
- [ ] Copy Database URL from Settings → Database
- [ ] Copy Project URL from Settings → API
- [ ] Copy `anon` key from Settings → API
- [ ] Copy `service_role` key from Settings → API (**Keep secret!**)
- [ ] Add all keys to `.env`
- [ ] Run `npm run db:push` to create tables
- [ ] Verify tables created in Supabase dashboard

### 3. Google OAuth Setup
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project or select existing
- [ ] Enable Google+ API
- [ ] Go to Credentials → Create OAuth 2.0 Client ID
- [ ] Application type: Web application
- [ ] Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] Copy Client ID and Client Secret to `.env`

### 4. Test Locally
- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000`
- [ ] Test login with Google
- [ ] Create a test plan
- [ ] Create a test habit
- [ ] Log habit completion
- [ ] Check streak calculation
- [ ] Verify analytics display

### 5. (Optional) AI Setup
- [ ] Sign up for Claude API at anthropic.com OR OpenAI at openai.com
- [ ] Get API key
- [ ] Add `CLAUDE_API_KEY` or `OPENAI_API_KEY` to `.env`
- [ ] Test AI plan generation in /planner/new

## ☐ Phase 2: Production Deployment

### 1. GitHub Setup
- [ ] Create GitHub repository
- [ ] Push code to GitHub:
  ```bash
  git init
  git add .
  git commit -m "Initial commit - TrackZen v1.0"
  git branch -M main
  git remote add origin https://github.com/yourusername/trackzen.git
  git push -u origin main
  ```

### 2. Vercel Deployment
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign in with GitHub
- [ ] Click "New Project"
- [ ] Import your TrackZen repository
- [ ] Configure project:
  - Framework Preset: Next.js
  - Root Directory: ./
  - Build Command: `npm run build`
  - Output Directory: `.next`

### 3. Environment Variables (Vercel)
Add these in Vercel dashboard → Settings → Environment Variables:

**Database (Supabase)**
- [ ] `DATABASE_URL` = `postgresql://postgres:...@db.xxx.supabase.co:5432/postgres`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://xxx.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbG...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbG...` (**Production & Preview only**)

**NextAuth**
- [ ] `NEXTAUTH_URL` = `https://your-app.vercel.app`
- [ ] `NEXTAUTH_SECRET` = `your_generated_secret_from_openssl`

**Google OAuth**
- [ ] `GOOGLE_CLIENT_ID` = `xxx.apps.googleusercontent.com`
- [ ] `GOOGLE_CLIENT_SECRET` = `GOCSPX-xxx`

**AI (Optional)**
- [ ] `CLAUDE_API_KEY` = `sk-ant-xxx` (or)
- [ ] `OPENAI_API_KEY` = `sk-xxx`

### 4. Update Google OAuth
- [ ] Go back to Google Cloud Console
- [ ] Add production redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
- [ ] Save changes

### 5. Deploy
- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Visit your production URL
- [ ] Test login with Google
- [ ] Create a test plan
- [ ] Verify all features work

## ☐ Phase 3: Post-Deployment

### 1. Verification
- [ ] Test Google login on production
- [ ] Create and view plans
- [ ] Create and track habits
- [ ] Check streak system
- [ ] Test AI plan generation (if enabled)
- [ ] Verify analytics load correctly
- [ ] Test on mobile device
- [ ] Test on different browsers (Chrome, Firefox, Safari)

### 2. Performance
- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Check load time (<3s)
- [ ] Verify images load properly
- [ ] Test animations are smooth

### 3. Security
- [ ] Verify environment variables are not exposed
- [ ] Check API routes require authentication
- [ ] Test protected routes redirect to login
- [ ] Verify CSRF protection works

### 4. Monitoring (Optional)
- [ ] Set up Vercel Analytics
- [ ] Enable error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure alerts

## ☐ Phase 4: Documentation & Launch

### 1. Documentation
- [ ] Update README with production URL
- [ ] Add screenshots/demo video
- [ ] Document known issues (if any)
- [ ] Create user guide

### 2. Marketing (Optional)
- [ ] Share on social media
- [ ] Post on Product Hunt
- [ ] Share in relevant communities
- [ ] Create landing page SEO

### 3. Maintenance
- [ ] Set up regular database backups
- [ ] Monitor API usage (AI)
- [ ] Check Supabase free tier limits
- [ ] Plan for scaling if needed

---

## 🆘 Troubleshooting

### Build Fails on Vercel
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check build logs for specific errors
- Try local build: `npm run build`

### Google OAuth Not Working
- Verify redirect URI matches exactly
- Check `NEXTAUTH_URL` is set to production URL
- Ensure Google+ API is enabled
- Clear browser cookies and try again

### Database Connection Issues
- Check Supabase project is active
- Verify `DATABASE_URL` format is correct
- Ensure IP is allowed in Supabase settings
- Check connection pooling is enabled

### AI Features Not Working
- Verify API key is correct
- Check rate limits not exceeded
- See API provider dashboard for errors
- Test API key with curl

### Streak Not Updating
- Check user logged activity today
- Verify timezone is correct
- Check streak calculation in database
- Test streak API endpoint manually

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ Users can sign in with Google
- ✅ Plans can be created and viewed
- ✅ Habits can be tracked
- ✅ Streaks are calculated correctly
- ✅ Dashboard displays data
- ✅ Analytics show charts
- ✅ AI plan generation works (if enabled)
- ✅ Mobile version works
- ✅ No console errors
- ✅ Lighthouse score >85

---

## 📞 Support

If you encounter issues:
1. Check this checklist again
2. Review [SETUP.md](SETUP.md)
3. Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
4. Search GitHub issues
5. Create new issue with error logs

**Happy Deploying! 🚀**

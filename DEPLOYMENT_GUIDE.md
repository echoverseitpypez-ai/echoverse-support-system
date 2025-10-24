# 🚀 Deployment Guide - FREE Hosting

Complete guide to deploy EchoVerse IT Support System for **FREE** using Vercel (Frontend), Render (Backend), and Supabase (Database).

---

## 📋 Prerequisites

- ✅ GitHub account (already done!)
- ✅ Code uploaded to GitHub (already done!)
- ✅ Supabase account with database setup (already done!)
- 🆕 Vercel account (free)
- 🆕 Render account (free)

---

## 🎯 Deployment Architecture

```
┌─────────────────┐
│   Vercel        │  ← Frontend (React)
│   (FREE)        │     https://your-app.vercel.app
└────────┬────────┘
         │
         ↓ API Calls
┌─────────────────┐
│   Render        │  ← Backend (Express + WebSocket)
│   (FREE)        │     https://your-app.onrender.com
└────────┬────────┘
         │
         ↓ Database
┌─────────────────┐
│   Supabase      │  ← PostgreSQL Database
│   (FREE)        │     Already setup!
└─────────────────┘
```

---

## 🔧 Part 1: Deploy Backend to Render (FREE)

### Step 1: Create Render Account

1. Go to: https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub (easiest)
4. Authorize Render to access your repositories

### Step 2: Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your repository: `echoverse-support-system`
3. Configure:
   - **Name:** `echoverse-backend`
   - **Region:** Oregon (US West) - closest to Supabase
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Plan:** **FREE** ⭐

### Step 3: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these (get values from your `config/.env.server.local`):

```
NODE_ENV=production
PORT=3001
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
CORS_ORIGIN=https://your-app.vercel.app
```

**Note:** Leave `CORS_ORIGIN` empty for now, we'll update it after deploying frontend.

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Your backend URL will be: `https://echoverse-backend.onrender.com`
4. Test it: Visit `https://echoverse-backend.onrender.com/api/health`
   - Should return: `{"ok":true}`

---

## 🎨 Part 2: Deploy Frontend to Vercel (FREE)

### Step 1: Create Vercel Account

1. Go to: https://vercel.com
2. Click **"Sign Up"**
3. Sign up with GitHub (easiest)
4. Authorize Vercel

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your repository: `echoverse-support-system`
3. Configure:
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add:

```
VITE_API_URL=https://echoverse-backend.onrender.com
VITE_WS_URL=wss://echoverse-backend.onrender.com
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Use the Render URL you got from Part 1!

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Your frontend URL will be: `https://your-app.vercel.app`
4. Vercel will show you the URL after deployment

---

## 🔄 Part 3: Update Backend CORS

Now that you have your Vercel URL, update Render:

1. Go to Render Dashboard
2. Click your `echoverse-backend` service
3. Go to **"Environment"**
4. Update `CORS_ORIGIN` to: `https://your-app.vercel.app`
5. Click **"Save Changes"**
6. Service will automatically redeploy

---

## 🔐 Part 4: Update Supabase Settings

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Scroll to **"URL Configuration"**
5. Add your Vercel URL to allowed origins:
   - `https://your-app.vercel.app`

---

## ✅ Part 5: Test Your Deployment

### Test Backend
```bash
# Health check
curl https://echoverse-backend.onrender.com/api/health

# Should return: {"ok":true}
```

### Test Frontend
1. Visit: `https://your-app.vercel.app`
2. Try to login
3. Create a test ticket
4. Check if real-time features work

---

## 📝 Part 6: Update vercel.json

Before committing, update the backend URL in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://echoverse-backend.onrender.com/api/:path*"
    }
  ]
}
```

Replace `your-render-app.onrender.com` with your actual Render URL.

---

## 🔄 Part 7: Push Updates to GitHub

After updating `vercel.json`:

```bash
git add .
git commit -m "Update deployment configuration with production URLs"
git push origin main
```

Both Vercel and Render will automatically redeploy!

---

## ⚠️ Important Notes

### Render Free Tier Limitations
- **Sleeps after 15 minutes** of inactivity
- **First request after sleep:** ~30 seconds delay
- **Subsequent requests:** Normal speed

**Workaround:**
- Use UptimeRobot (free) to ping your backend every 14 minutes
- Keeps it awake during business hours

### Vercel Free Tier
- **100GB bandwidth/month**
- **No sleep time** - always fast!
- **Automatic SSL**
- **Global CDN**

### Supabase Free Tier
- **500MB database**
- **2GB bandwidth/month**
- **50,000 monthly active users**

---

## 🐛 Troubleshooting

### Backend Returns 502/503
- Wait 30 seconds (Render is waking up)
- Check Render logs for errors

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` is correct
- Check CORS settings on Render
- Check browser console for errors

### WebSocket Not Working
- Verify `VITE_WS_URL` uses `wss://` (not `ws://`)
- Check Render logs for WebSocket errors

### Database Connection Issues
- Verify Supabase environment variables
- Check Supabase project is active
- Verify RLS policies are correct

---

## 📊 Monitoring Your Deployment

### Render Dashboard
- View logs: Real-time server logs
- Metrics: CPU, Memory, Bandwidth
- Events: Deployment history

### Vercel Dashboard
- Analytics: Page views, performance
- Logs: Build and runtime logs
- Deployments: History and rollback

### Supabase Dashboard
- Database: Query performance
- API: Request logs
- Auth: User activity

---

## 🔄 Continuous Deployment

Both Vercel and Render are configured for **automatic deployment**:

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Automatic deployment triggers:
# ✅ Vercel rebuilds frontend (2-3 min)
# ✅ Render rebuilds backend (5-10 min)
```

---

## 💰 Total Cost: $0/month

- ✅ Vercel: FREE
- ✅ Render: FREE (with sleep)
- ✅ Supabase: FREE

**Perfect for:**
- Development
- Demos
- Low-traffic production
- Portfolio projects

---

## 🚀 Going to Production (Paid Plans)

When you're ready to scale:

### Render Pro ($7/month)
- No sleep time
- Better performance
- More resources

### Vercel Pro ($20/month)
- More bandwidth
- Better analytics
- Team features

### Supabase Pro ($25/month)
- More storage
- Better performance
- Priority support

---

## 📞 Need Help?

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

## ✅ Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Backend health check works
- [ ] Frontend deployed to Vercel
- [ ] Frontend loads correctly
- [ ] Backend CORS updated with Vercel URL
- [ ] Supabase allows Vercel domain
- [ ] Login works
- [ ] Tickets can be created
- [ ] Real-time features work
- [ ] WebSocket connects
- [ ] File uploads work
- [ ] Email notifications work (if configured)

---

**Congratulations! Your app is now live! 🎉**

**Frontend:** https://your-app.vercel.app  
**Backend:** https://echoverse-backend.onrender.com  
**Database:** Supabase (already configured)

---

*Last Updated: October 23, 2025*

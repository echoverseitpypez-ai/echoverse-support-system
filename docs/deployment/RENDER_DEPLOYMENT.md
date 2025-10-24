# Deploy Backend to Render (Free Tier)

## Prerequisites
- GitHub account
- Supabase project with Service Role Key

---

## Step 1: Push Your Code to GitHub

1. Create a new repository on GitHub
2. Initialize git and push:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (free, no credit card needed)

---

## Step 3: Deploy Backend

### Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:

**Settings:**
- **Name**: `echoverse-backend` (or your choice)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: (leave blank)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: **Free**

### Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these (get values from your `.env.server.local`):

| Key | Value |
|-----|-------|
| `PORT` | `3001` |
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
| `CORS_ORIGIN` | `http://localhost:3000,https://YOUR_VERCEL_APP.vercel.app` |
| `NODE_ENV` | `production` |

Optional SMTP (if you use email):
| Key | Value |
|-----|-------|
| `SMTP_HOST` | Your SMTP host |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your SMTP user |
| `SMTP_PASS` | Your SMTP password |

4. Click **"Create Web Service"**

---

## Step 4: Wait for Deployment

- Render will build and deploy (takes 2-5 minutes)
- Your backend URL will be: `https://echoverse-backend.onrender.com`
- Copy this URL for your frontend configuration

---

## Step 5: Test Your Backend

Visit: `https://YOUR_APP.onrender.com/api/health`

You should see: `{"ok": true}`

---

## Important Notes

### ⚠️ Free Tier Limitations:
- **Spins down after 15 minutes** of inactivity
- **First request takes 30-60 seconds** to wake up
- **512 MB RAM limit**

### 🔧 Reduce Sleep Issues:
Use **UptimeRobot** (free) to ping your backend every 14 minutes:
1. Sign up at https://uptimerobot.com
2. Add monitor: `https://YOUR_APP.onrender.com/api/health`
3. Set interval: 14 minutes

### 🔒 CORS Configuration:
Update `server/index.js` CORS to allow your Vercel frontend:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'https://YOUR_VERCEL_APP.vercel.app']
}))
```

---

## Next Steps

1. ✅ Backend deployed on Render
2. ⬜ Deploy frontend to Vercel
3. ⬜ Configure frontend to use Render backend URL
4. ⬜ Set up UptimeRobot to prevent sleep

See `VERCEL_DEPLOYMENT.md` for frontend deployment.

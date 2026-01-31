# Deployment Guide - Used Items Hub

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project set up
- Google Maps API key (optional, for delivery features)

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/yourusername/used-items-hub.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"

2. **Import Repository**
   - Connect your GitHub account
   - Select the `used-items-hub` repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `app` (if your project is in a subfolder)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables**
   Add these in Vercel project settings:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key (optional)
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `your-project.vercel.app`

### Step 3: Configure Supabase

1. **Update Supabase Auth Settings**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL to "Redirect URLs":
     ```
     https://your-project.vercel.app
     https://your-project.vercel.app/auth
     ```

2. **Run Database Schema**
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents of `supabase-schema.sql`
   - Paste and run in SQL Editor

3. **Create Storage Buckets**
   - Go to Storage → Create Bucket
   - Create bucket: `kyc_documents` (private)
   - Create bucket: `item_images` (public)
   - Set RLS policies as needed

### Step 4: Test Deployment

1. Visit your Vercel URL
2. Test authentication (sign up/login)
3. Test item creation
4. Test order flow (if Google Maps is configured)

## 🔧 Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build script

### Authentication Not Working
- Verify Supabase redirect URLs include Vercel domain
- Check environment variables are correct
- Ensure Supabase project is active

### Images Not Loading
- Verify storage buckets are created
- Check bucket policies allow public access (for `item_images`)
- Verify storage RLS policies are configured

### Google Maps Not Working
- Verify API key is set in environment variables
- Check Google Cloud Console for API restrictions
- Ensure Places API, Geocoding API, and Distance Matrix API are enabled

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |
| `VITE_GOOGLE_MAPS_API_KEY` | No | Google Maps API key (for delivery features) |

## 🎯 Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase redirect URLs updated
- [ ] Database schema executed
- [ ] Storage buckets created
- [ ] Authentication tested
- [ ] Item creation tested
- [ ] Order flow tested (if applicable)
- [ ] Mobile responsiveness verified
- [ ] Error handling verified

## 🔄 Continuous Deployment

Vercel automatically deploys on every push to your main branch. To deploy manually:

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" tab
4. Click "Redeploy" on latest deployment

## 📱 Custom Domain (Optional)

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatically provisioned

---

**Need Help?** Check Vercel docs: [vercel.com/docs](https://vercel.com/docs)

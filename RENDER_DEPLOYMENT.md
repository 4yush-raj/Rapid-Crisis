# Rapid Crisis Management System - Deployment Guide

## Free Deployment on Render

This guide will help you deploy your Rapid Crisis Management System to Render's free tier.

### Prerequisites
- GitHub account with your project pushed to a repository
- Render account (sign up at https://render.com - free for students)

### Step 1: Prepare Your Project

✅ **Already completed:**
- `requirements.txt` - Python dependencies
- `render.yaml` - Render deployment configuration
- `.env.example` - Environment variables template
- Updated Django settings for production

### Step 2: Set Up Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for Render deployment"

# Add remote (replace with your GitHub repo)
git remote add origin https://github.com/YOUR_USERNAME/rapid-crisis.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy on Render

1. **Go to Render Dashboard** → https://dashboard.render.com

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select your `rapid-crisis` repository
   - Choose "Python" as the environment

3. **Configure Service:**
   - **Name:** `crisis-backend` (or your preferred name)
   - **Branch:** `main`
   - **Build Command:** 
     ```
     pip install -r requirements.txt && python crisis_backend/manage.py migrate && python crisis_backend/manage.py collectstatic --noinput
     ```
   - **Start Command:**
     ```
     gunicorn crisis_backend.wsgi:application --bind 0.0.0.0:$PORT
     ```
   - **Plan:** Free (eligible for students)

4. **Add Environment Variables:**
   Click "Environment" and add these:
   
   ```
   SECRET_KEY=django-insecure-change-this-to-something-secure-on-production
   DEBUG=False
   ALLOWED_HOSTS=your-app-name.onrender.com,localhost
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```

5. **Deploy Frontend (Static Site):**
   - Click "New +" → "Static Site"
   - Connect the same repository
   - **Build Command:** 
     ```
     cd crisis_frontend && npm install && npm run build
     ```
   - **Publish Directory:** `crisis_frontend/dist`

### Step 4: Connect Frontend to Backend

After deployment, update your frontend API configuration:

Edit `crisis_frontend/src/services/api.js`:
```javascript
const API_URL = process.env.VITE_API_URL || 'https://your-backend-url.onrender.com';
```

In Render, set environment variable for static site:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### Step 5: Update Allowed Hosts

After Render assigns your URLs:

1. Go to your Backend Service on Render
2. Update `ALLOWED_HOSTS` environment variable with your actual Render domain
3. Update `CORS_ALLOWED_ORIGINS` with your frontend URL

### Important Notes for Free Tier

- **Spin-down:** Free services spin down after 15 minutes of inactivity
- **Cold start:** First request takes a few seconds to wake up the service
- **Storage:** Media uploads are not persistent across deployments
  - Consider using cloud storage (AWS S3, Cloudinary) for production
- **Database:** SQLite database resets on redeploy
  - For production, use PostgreSQL (free option available on Render)

### Upgrade to PostgreSQL (Optional)

For data persistence, upgrade to PostgreSQL:

1. Create a PostgreSQL database on Render (free tier available)
2. Update `render.yaml` database configuration
3. Update environment variables with database connection string

### Database Migrations

After deployment, run migrations if needed:
```bash
# In Render web service terminal
python crisis_backend/manage.py migrate
```

### Troubleshooting

**500 Error on deployment?**
- Check Render logs for details
- Ensure all environment variables are set
- Verify `SECRET_KEY` is set properly

**Frontend can't reach backend?**
- Verify backend URL in frontend code
- Check CORS settings in Django
- Ensure CORS_ALLOWED_ORIGINS includes frontend domain

**Static files not loading?**
- Run `collectstatic` command via Render shell
- Check STATIC_ROOT and STATIC_URL settings

### Support & Resources
- Render Documentation: https://render.com/docs
- Django Deployment: https://docs.djangoproject.com/en/6.0/howto/deployment/
- Student Pricing: https://render.com/students

---

**Your app will be live at:** `https://your-app-name.onrender.com`

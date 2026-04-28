# Quick Start Guide for Render Deployment

## 🚀 One-Click Deployment Steps

### 1. **Create Git Repository**
```bash
cd "c:\Users\Ayush Raj\OneDrive\Desktop\Rapid Crisis - copy 2"
git init
git add .
git commit -m "Initial commit - ready for Render"
git remote add origin https://github.com/YOUR_USERNAME/rapid-crisis.git
git push -u origin main
```

### 2. **Sign Up on Render (Free for Students)**
- Go to https://render.com
- Click "Sign up" → Select "GitHub" or use email
- Verify your student email for student benefits

### 3. **Deploy Backend**
- Go to Render Dashboard
- Click "New +" → "Web Service"
- Select your GitHub repository
- Set these values:
  - **Name:** `crisis-backend`
  - **Environment:** Python
  - **Build Command:** `pip install -r requirements.txt && python crisis_backend/manage.py migrate && python crisis_backend/manage.py collectstatic --noinput`
  - **Start Command:** `gunicorn crisis_backend.wsgi:application --bind 0.0.0.0:$PORT`
  - **Plan:** Free

### 4. **Set Backend Environment Variables**
In the Render dashboard, go to Environment and add:
```
SECRET_KEY=django-insecure-generate-new-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-backend-url.onrender.com,localhost
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

### 5. **Deploy Frontend**
- Click "New +" → "Static Site"
- Select same repository
- Set these values:
  - **Name:** `crisis-frontend`
  - **Build Command:** `cd crisis_frontend && npm install && npm run build`
  - **Publish Directory:** `crisis_frontend/dist`
  - **Plan:** Free

### 6. **Set Frontend Environment Variables**
In the Render dashboard for static site:
```
VITE_API_URL=https://your-backend-url.onrender.com
```

### 7. **Link Services Together**
Update `CORS_ALLOWED_ORIGINS` in backend with actual frontend URL after deployment.

## ✅ Done!
Your app is now live at:
- **Frontend:** `https://your-frontend-url.onrender.com`
- **Backend API:** `https://your-backend-url.onrender.com/api/`

## 📝 Important Notes

### Free Tier Limitations:
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-50 seconds
- SQLite database is ephemeral (resets on redeploy)

### Recommended Next Steps:
1. **Use PostgreSQL** for persistent data
2. **Configure cloud storage** for media uploads
3. **Set up monitoring** for errors

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed instructions.

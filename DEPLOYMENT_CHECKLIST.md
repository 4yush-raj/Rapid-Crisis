# 🚀 Render Deployment Checklist

## Pre-Deployment Checklist

- [ ] Python dependencies in `requirements.txt` ✓
- [ ] Django settings configured for production ✓
- [ ] Frontend environment variables configured ✓
- [ ] `.gitignore` set up ✓
- [ ] `render.yaml` created ✓
- [ ] `Procfile` created ✓
- [ ] `.env.example` created ✓

## GitHub Setup

- [ ] Create GitHub account
- [ ] Create new repository named `rapid-crisis`
- [ ] Clone repository locally:
  ```bash
  git clone https://github.com/YOUR_USERNAME/rapid-crisis.git
  cd rapid-crisis
  ```
- [ ] Copy all project files into repository
- [ ] Add and commit files:
  ```bash
  git add .
  git commit -m "Initial commit - ready for Render deployment"
  git push -u origin main
  ```

## Render Setup

### Account & Authentication
- [ ] Go to https://render.com
- [ ] Sign up with GitHub account
- [ ] Verify email (use student email for benefits)
- [ ] Connect GitHub account to Render
- [ ] Authorize Render to access your repositories

### Backend Service Setup
- [ ] Click "New +" → "Web Service"
- [ ] Select `rapid-crisis` repository
- [ ] Fill in form:
  - Name: `crisis-backend`
  - Environment: `Python`
  - Region: `Ohio` (free tier)
  - Branch: `main`
  - Build Command: 
    ```
    pip install -r requirements.txt && python crisis_backend/manage.py migrate && python crisis_backend/manage.py collectstatic --noinput
    ```
  - Start Command: 
    ```
    gunicorn crisis_backend.wsgi:application --bind 0.0.0.0:$PORT
    ```
  - Plan: `Free`
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (first build takes 3-5 minutes)
- [ ] Note the backend URL (e.g., `https://crisis-backend-xxxx.onrender.com`)

### Backend Environment Variables
- [ ] Go to backend service settings
- [ ] Add environment variables:
  ```
  SECRET_KEY=your-super-secret-key-here
  DEBUG=False
  ALLOWED_HOSTS=crisis-backend-xxxx.onrender.com,localhost
  CORS_ALLOWED_ORIGINS=https://crisis-frontend-xxxx.onrender.com
  ```
- [ ] Save environment variables

### Frontend Service Setup
- [ ] Click "New +" → "Static Site"
- [ ] Select `rapid-crisis` repository
- [ ] Fill in form:
  - Name: `crisis-frontend`
  - Branch: `main`
  - Build Command: 
    ```
    cd crisis_frontend && npm install && npm run build
    ```
  - Publish directory: `crisis_frontend/dist`
  - Plan: `Free`
- [ ] Click "Create Static Site"
- [ ] Wait for deployment
- [ ] Note the frontend URL (e.g., `https://crisis-frontend-xxxx.onrender.com`)

### Frontend Environment Variables
- [ ] Go to static site settings
- [ ] Add environment variable:
  ```
  VITE_API_URL=https://crisis-backend-xxxx.onrender.com
  ```
- [ ] Trigger redeploy by going to Deployments → Redeploy

### Final Setup
- [ ] Update backend `CORS_ALLOWED_ORIGINS` with actual frontend URL
- [ ] Redeploy backend service
- [ ] Test frontend by visiting frontend URL
- [ ] Check browser console for API connection errors

## Testing After Deployment

- [ ] [ ] Visit frontend URL - page loads without errors
- [ ] [ ] Navigate to login page
- [ ] [ ] Try to create an account
- [ ] [ ] Try to log in
- [ ] [ ] Create an incident
- [ ] [ ] Upload an image
- [ ] [ ] Check browser console for errors
- [ ] [ ] Check Render logs for backend errors

## Troubleshooting

### Backend won't deploy
- [ ] Check build logs in Render dashboard
- [ ] Ensure all dependencies are in `requirements.txt`
- [ ] Verify Python version in `runtime.txt`

### Frontend won't deploy
- [ ] Check build logs in Render dashboard
- [ ] Ensure `npm install` can run
- [ ] Check for TypeScript/build errors

### API calls fail
- [ ] Check `VITE_API_URL` environment variable
- [ ] Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
- [ ] Check backend logs for CORS errors
- [ ] Verify both services are running (green status)

### Database issues
- [ ] Check migrations ran successfully
- [ ] Look at backend logs for migration errors
- [ ] Re-run migrations via Render shell if needed

## Performance Optimization (Optional)

- [ ] [ ] Set up PostgreSQL for persistent database
- [ ] [ ] Configure Cloudinary for image uploads
- [ ] [ ] Enable caching headers in backend
- [ ] [ ] Optimize frontend bundle size

## Maintenance

- [ ] Check Render dashboard weekly for errors
- [ ] Monitor free tier quotas
- [ ] Plan upgrade to paid tier if needed
- [ ] Keep dependencies updated

---

**Deployment Complete! 🎉**

Your app is live and accessible:
- Frontend: `https://crisis-frontend-xxxx.onrender.com`
- Backend API: `https://crisis-backend-xxxx.onrender.com/api/`

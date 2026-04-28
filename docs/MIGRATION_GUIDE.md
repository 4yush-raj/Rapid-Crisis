# Django Refactoring Guide: PostgreSQL + ImageKit + Admin Bootstrapping

## Overview
This document outlines the changes made to the Rapid Crisis Django backend to implement:
1. **PostgreSQL Database** - Replacing SQLite for production readiness
2. **ImageKit Integration** - Cloud-based image storage and optimization
3. **Admin Bootstrapping System** - First-user becomes ADMIN automatically
4. **Enhanced Security** - Proper RBAC and credential protection

---

## Project Structure

```
root/
├── backend/                    # Django Backend
│   ├── crisis_backend/
│   │   ├── settings.py        # Updated for PostgreSQL & ImageKit
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── core/
│   │   ├── models.py          # Updated with image_url field
│   │   ├── views.py           # Updated with admin bootstrapping logic
│   │   ├── serializers.py     # Updated to enforce guest role on public registration
│   │   ├── permissions.py     # RBAC enforcement
│   │   ├── imagekit_utils.py  # NEW: ImageKit utilities
│   │   └── migrations/
│   ├── manage.py
│   ├── requirements.txt        # Added: psycopg2, imagekitio
│   └── .env.example           # Updated with PostgreSQL & ImageKit config
│
└── frontend/                   # React Frontend
    └── .env.example           # Updated API URL
```

---

## Key Changes

### 1. Database Configuration

**Changed from SQLite to PostgreSQL:**

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'rapid_crisis'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

**Requirements added:**
- `psycopg2-binary==2.9.9` - PostgreSQL adapter

### 2. ImageKit Integration

**Model Changes:**
```python
# Old: ImageField
image = models.ImageField(upload_to='incidents/', null=True, blank=True)

# New: URLField for ImageKit URLs
image_url = models.URLField(max_length=500, null=True, blank=True)
```

**Settings Configuration:**
```python
IMAGEKIT_PUBLIC_KEY = os.getenv('IMAGEKIT_PUBLIC_KEY', '')
IMAGEKIT_PRIVATE_KEY = os.getenv('IMAGEKIT_PRIVATE_KEY', '')
IMAGEKIT_URL_ENDPOINT = os.getenv('IMAGEKIT_URL_ENDPOINT', '')
IMAGEKIT_FOLDER = '/rapid-crisis'
```

**Utility Functions:**
New `core/imagekit_utils.py` provides:
- `upload_incident_image()` - Upload to ImageKit
- `delete_incident_image()` - Delete from ImageKit
- `get_image_url()` - Generate transformed URLs

**Requirements added:**
- `imagekitio==4.1.0` - ImageKit Python SDK

### 3. Admin Bootstrapping System

**First-User Registration becomes ADMIN:**

```python
# In UserCreateSerializer
def create(self, validated_data):
    password = validated_data.pop('password')
    
    # Check if this is the first user - if so, make them admin
    if User.objects.count() == 0:
        role = 'admin'
    else:
        role = 'guest'  # Public registration always creates guest users
    
    user = User(role=role, **validated_data)
    user.set_password(password)
    user.save()
    return user
```

**Behavior:**
- First user to register → Automatically becomes `ADMIN`
- All subsequent public registrations → Default to `GUEST` role
- Admin must explicitly create `STAFF` or additional `ADMIN` users

### 4. Enhanced Security & RBAC

**New Admin-Only Endpoints:**

```
POST /api/users/create_admin/     - Only ADMIN can create admins
POST /api/users/create_staff/     - Only ADMIN can create staff
```

**Permission Classes:**
- Public registration: `permissions.AllowAny()` (but role forced to GUEST)
- User list: `permissions.IsAuthenticated`
- Create ADMIN/STAFF: `permissions.IsAuthenticated, IsAdmin`
- Incident assignment: `IsAdmin`
- Incident updates: `IsStaff`

**Updated UserSerializer:**
```python
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'email', 'phone', 'department', 'age', 'gender']
        read_only_fields = ['id', 'username', 'role']  # Role is read-only
```

---

## Environment Configuration

### Backend `.env.example`

```env
# Django Core
SECRET_KEY="your-django-secret-key"
DEBUG=True
ALLOWED_HOSTS="localhost,127.0.0.1,your-domain.com"

# PostgreSQL Database
DB_NAME="rapid_crisis"
DB_USER="postgres"
DB_PASSWORD="your-password"
DB_HOST="localhost"
DB_PORT="5432"

# CORS
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# JWT
JWT_SECRET="your-jwt-secret-key"

# ImageKit
IMAGEKIT_PUBLIC_KEY="your-public-key"
IMAGEKIT_PRIVATE_KEY="your-private-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-imagekit-id"
```

### Frontend `.env.example`

```env
VITE_API_URL=http://localhost:8000/api
VITE_IMAGEKIT_PUBLIC_KEY=your-public-key
VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-imagekit-id
```

---

## Setup & Migration Guide

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create PostgreSQL Database

```bash
# Local development
createdb rapid_crisis
```

Or use Vercel PostgreSQL:
```
DATABASE_URL from Vercel dashboard
```

### 3. Update .env File

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

This will:
- Create all database tables
- Set up relationships
- Apply indexes

### 5. Create First Admin (if needed)

```bash
python manage.py createsuperuser
# Or simply register via API - first user becomes ADMIN
```

---

## API Endpoints

### Authentication & User Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/users/` | POST | None | Public registration (creates GUEST) |
| `/api/users/token/` | POST | None | Login (JWT token) |
| `/api/users/token/refresh/` | POST | None | Refresh JWT token |
| `/api/users/me/` | GET | Required | Get current user profile |
| `/api/users/create_staff/` | POST | ADMIN | Create STAFF user |
| `/api/users/create_admin/` | POST | ADMIN | Create ADMIN user |
| `/api/users/staff_list/` | GET | Required | List all staff |

### Incident Management

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/incidents/` | GET | Required | List incidents |
| `/api/incidents/` | POST | Required | Create incident (with ImageKit upload) |
| `/api/incidents/{id}/` | PATCH | STAFF | Update incident |
| `/api/incidents/{id}/assign_staff/` | POST | ADMIN | Assign staff |
| `/api/incidents/{id}/mark_resolved/` | POST | STAFF | Mark resolved |

---

## Security Audit Checklist

✅ **Role-Based Access Control**
- Admin routes protected with `IsAdmin` permission
- Staff routes protected with `IsStaff` permission
- Public endpoints don't expose sensitive data

✅ **Authentication**
- JWT tokens include user role
- Passwords hashed with Django's default hasher (PBKDF2)
- Session and CSRF protection enabled

✅ **Authorization**
- Public registration cannot create ADMIN/STAFF users
- Only ADMIN can manage user roles
- Incidents only visible to authenticated users

✅ **Credentials Protection**
- All sensitive config in `.env` (not in code)
- ImageKit keys protected
- Database credentials not exposed in API responses

✅ **Database Security**
- PostgreSQL replaces SQLite (handles concurrent requests)
- Proper foreign key constraints
- Cascading deletes configured

---

## Testing the Admin Bootstrap

### Step 1: Clear Database (first-time setup)
```bash
python manage.py flush  # Caution: deletes all data
```

### Step 2: Register First User
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "first_admin",
    "email": "admin@crisis.com",
    "password": "SecurePass123!",
    "phone": "555-0000"
  }'
```

Response includes `role: "admin"` ✓

### Step 3: Register Second User
```bash
curl -X POST http://localhost:8000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "regular_user",
    "email": "user@crisis.com",
    "password": "SecurePass123!",
    "phone": "555-0001"
  }'
```

Response includes `role: "guest"` ✓

### Step 4: Admin Creates Staff (as first_admin)
```bash
curl -X POST http://localhost:8000/api/users/create_staff/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "username": "staff_member",
    "email": "staff@crisis.com",
    "password": "SecurePass123!",
    "phone": "555-0002",
    "department": "fire"
  }'
```

Response includes `role: "staff"` ✓

---

## ImageKit Integration Testing

### Upload Image with Incident

```javascript
// Frontend example
const formData = new FormData();
formData.append('title', 'Fire at Downtown');
formData.append('description', 'Structure fire');
formData.append('image', imageFile);  // File object
formData.append('location', '123 Main St');
formData.append('latitude', 40.7128);
formData.append('longitude', -74.0060);

const response = await fetch('http://localhost:8000/api/incidents/', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const incident = await response.json();
console.log(incident.image_url);  // ImageKit URL
```

---

## Deployment Considerations

### Vercel (Frontend)
- Set `VITE_API_URL` to production backend URL
- Set ImageKit public key

### Heroku/Render (Backend)
1. Add PostgreSQL addon
2. Set `DATABASE_URL` environment variable
3. Set all ImageKit credentials
4. Run migrations: `python manage.py migrate`
5. Collect static files: `python manage.py collectstatic`

### Production Checklist
- [ ] Set `DEBUG=False` in production
- [ ] Set strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` correctly
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up database backups
- [ ] Monitor ImageKit usage/limits
- [ ] Configure error logging (Sentry recommended)

---

## Troubleshooting

### PostgreSQL Connection Error
```
Error: could not connect to server
```
**Solution:** Check DB_HOST, DB_PORT, and credentials in .env

### ImageKit Upload Fails
```
ImageKit credentials not found
```
**Solution:** Ensure all three ImageKit variables set in .env

### First User Not Admin
```
New user created with role: guest
```
**Solution:** Check `User.objects.count()` in database - may have existing users

### Migration Issues
```
django.db.utils.ProgrammingError: relation does not exist
```
**Solution:** Run `python manage.py migrate` after PostgreSQL setup

---

## References
- [Django PostgreSQL Setup](https://docs.djangoproject.com/en/6.0/ref/databases/#postgresql-notes)
- [ImageKit Python SDK](https://github.com/imagekit-developer/imagekit-python)
- [JWT Authentication in Django](https://django-rest-framework-simplejwt.readthedocs.io/)

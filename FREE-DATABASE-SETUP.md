# Free Database Setup Guide

This guide shows how to set up free database services for your Hurdle app to replace the $15/month DigitalOcean managed database.

## 🆓 Option 1: Supabase (Recommended)

**Free Tier:** 500MB storage, 2GB bandwidth, 50,000 monthly active users

### Setup Steps:

1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up
2. **Create Project**: Click "New Project" and choose a name
3. **Get Connection Details**: Go to Settings → Database
4. **Update Environment Variables** in DigitalOcean App Platform:
   ```
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your-password
   ```

### Advantages:
- PostgreSQL-based (same SQL syntax)
- Built-in dashboard and analytics
- Real-time subscriptions available
- Generous free tier

## 🆓 Option 2: Railway

**Free Tier:** $5 monthly credit (covers small databases)

### Setup Steps:

1. **Create Account**: Go to [railway.app](https://railway.app) and sign up
2. **Create Project**: Click "New Project" → "Provision PostgreSQL"
3. **Get Connection String**: Copy the DATABASE_URL from the Variables tab
4. **Update Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/dbname
   ```

### Advantages:
- Simple setup
- PostgreSQL and MySQL support
- Good for development and small apps

## 🆓 Option 3: Neon

**Free Tier:** 1GB storage, 100,000 reads/writes per month

### Setup Steps:

1. **Create Account**: Go to [neon.tech](https://neon.tech) and sign up
2. **Create Database**: Create a new project
3. **Get Connection String**: Copy from the dashboard
4. **Update Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:pass@host/dbname
   ```

### Advantages:
- Serverless PostgreSQL
- Automatic scaling
- Branch databases for development

## 🏠 Option 4: Browser localStorage (Current Default)

**Cost:** FREE (no external service needed)

### How it works:
- Game statistics stored in browser's localStorage
- Data persists between sessions on the same device
- No cross-device synchronization
- No server-side storage needed

### Advantages:
- Zero cost
- No setup required
- Works offline
- Privacy-friendly (data stays local)

### Limitations:
- Data lost if browser cache is cleared
- No cross-device synchronization
- Limited to ~5-10MB storage

## 🔧 Implementation

The app automatically detects the available storage method:

1. **If database environment variables are set**: Uses external database
2. **If no database configured**: Falls back to localStorage
3. **If database connection fails**: Gracefully falls back to localStorage

## 💡 Recommendation

For a personal project or small-scale deployment:
- **Use localStorage** (current default) - completely free
- **Upgrade to Supabase** if you need cross-device sync or analytics

For production with multiple users:
- **Use Supabase** for the generous free tier and PostgreSQL features
- **Use Railway** if you prefer simplicity and don't mind the $5 credit limit

## 🚀 Deployment

The current configuration uses localStorage by default, so you can deploy immediately with:

```bash
cd terraform
terraform apply
```

Your app will work perfectly with localStorage, and you can add an external database later if needed.
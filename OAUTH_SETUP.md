# OAuth Setup Guide for ClassLens

This guide explains how to set up Google and Microsoft OAuth authentication for ClassLens.

## Frontend Setup

### 1. Environment Variables (`.env` in frontend folder)

Add the following environment variables to your `.env` file in the frontend directory:

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
VITE_BACKEND_URL=http://localhost:5000
```

## Backend Setup

### 1. Install Dependencies

The backend already includes axios in package.json. If it doesn't, install it:

```bash
cd backend
npm install axios
```

### 2. Environment Variables (`.env` in backend folder)

Add the following environment variables to your `.env` file in the backend directory:

```
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret_here

# JWT Secret (already should exist)
JWT_SECRET=your_jwt_secret_here
```

## Setting Up Google OAuth

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**

### Step 2: Create OAuth 2.0 Credentials

1. Go to **Credentials** in the left menu
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)
5. Copy your **Client ID** and **Client Secret**

### Step 3: Add to Environment Variables

Add the credentials to your `.env` files:

**Frontend (.env):**
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

**Backend (.env):**
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Setting Up Microsoft OAuth

### Step 1: Register an Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Enter app name (e.g., "ClassLens")
5. Set supported account types to **Accounts in any organizational directory and personal Microsoft accounts**

### Step 2: Add Redirect URI

1. In your app's settings, go to **Authentication**
2. Click **Add a platform** → **Web**
3. Add redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### Step 3: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Copy the secret value (you'll only see it once!)

### Step 4: Get Application (Client) ID

1. Go to **Overview**
2. Copy the **Application (client) ID**

### Step 5: Add to Environment Variables

**Frontend (.env):**
```
VITE_MICROSOFT_CLIENT_ID=your_application_id_here
```

**Backend (.env):**
```
MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

## How It Works

### User Flow

1. User clicks "Google" or "Microsoft" button on login page
2. Browser redirects to OAuth provider's login page
3. After successful authentication, user is redirected to `/auth/callback`
4. Frontend exchanges the authorization code for user info via backend
5. Backend verifies the code with OAuth provider and creates/updates user in Firebase
6. User is automatically logged in and redirected to dashboard

### New User Creation

When a user signs in with OAuth for the first time:
- A new user account is created in Firebase automatically
- Default role is set to `student`
- User can later change their role in settings if needed
- Email and name are pulled from the OAuth provider

### Existing User Login

If a user already has an account and signs in with OAuth:
- The OAuth provider ID is linked to the existing account
- User keeps their existing role and settings
- Both email/password and OAuth can be used (if email/password was previously set)

## Testing

### Local Testing

1. Make sure both frontend and backend are running
2. Frontend runs on `http://localhost:5173` (Vite default)
3. Backend runs on `http://localhost:5000`
4. OAuth redirect URI should be `http://localhost:3000/auth/callback` (or match your frontend port)

### Testing Steps

1. Go to login page
2. Click "Google" or "Microsoft" button
3. Complete OAuth flow with test account
4. Should be redirected to dashboard after successful authentication

## Troubleshooting

### "Invalid redirect URI" error
- Verify the redirect URI in your OAuth app settings matches exactly
- Check that it's registered in both Google Cloud Console and Azure Portal

### "Client ID not found" error
- Ensure environment variables are properly set in `.env` files
- Restart backend server after adding env variables

### OAuth window closes immediately
- Check browser console for errors
- Verify that `VITE_GOOGLE_CLIENT_ID` and `VITE_MICROSOFT_CLIENT_ID` are set in frontend

### User created but can't log in
- Check Firebase console to verify user was created
- Ensure backend is correctly handling the OAuth callback
- Check server logs for error messages

## Production Deployment

When deploying to production:

1. Update redirect URIs in Google Cloud Console and Azure Portal with your production domain
2. Set environment variables in your production environment
3. Use your production database (Firebase)
4. Ensure SSL/HTTPS is enabled (OAuth requires it)

## Security Notes

- Never commit `.env` files to version control
- Keep `GOOGLE_CLIENT_SECRET` and `MICROSOFT_CLIENT_SECRET` private
- Use HTTPS in production
- Regularly rotate client secrets

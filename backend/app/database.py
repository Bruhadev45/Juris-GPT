from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client (will fail gracefully if credentials are not set)
try:
    supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)
except Exception as e:
    print(f"Warning: Supabase client initialization failed: {e}")
    print("The app will run but database operations will fail until credentials are set.")
    supabase = None

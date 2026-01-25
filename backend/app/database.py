import os
from dotenv import load_dotenv

load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Client Supabase - création conditionnelle pour les tests
TESTING = os.getenv("TESTING", "false").lower() == "true"

if TESTING:
    # Mock client pour les tests
    supabase = None
else:
    from supabase import create_client, Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

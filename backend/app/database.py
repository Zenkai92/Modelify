import os
from dotenv import load_dotenv

load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Client Supabase - création conditionnelle pour les tests
TESTING = os.getenv("TESTING", "false").lower() == "true"

if TESTING:
    # Mock client pour les tests
    supabase = None
    supabase_admin = None
else:
    from supabase import create_client, Client
    # Client standard (anon key) — soumis au RLS
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    # Client admin (service role key) — bypasse le RLS pour les opérations backend (ex: storage uploads)
    _service_key = SUPABASE_SERVICE_KEY or SUPABASE_KEY
    supabase_admin: Client = create_client(SUPABASE_URL, _service_key)

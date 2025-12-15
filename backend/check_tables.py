from app.database import supabase

try:
    print("Exploration des tables disponibles...")
    
    # Test avec la table ProjectDocuments
    result = supabase.table('ProjectDocuments').select('*').limit(5).execute()
    print("Table ProjectDocuments trouvée !")
    print(f"Colonnes/structure: {result.data}")
    
    # Voir le schéma de la table
    schema_result = supabase.table('ProjectDocuments').select('count', count='exact').execute()
    print(f"Nombre d'enregistrements: {schema_result.count}")
    
except Exception as e:
    print(f"Erreur: {e}")
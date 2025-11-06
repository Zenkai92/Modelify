from app.database import supabase

try:
    print("🔄 Test de connexion Supabase...")
    
    # Test simple de connexion
    result = supabase.table('project_requests').select('count', count='exact').execute()
    print("✅ Connexion Supabase réussie !")
    print(f"📊 Nombre d'enregistrements dans project_requests: {result.count}")
    
    # Test d'insertion simple
    test_data = {
        "title": "Test connexion",
        "description": "Test de connexion à la base de données",
        "type_project": "web",
        "goal": "test"
    }
    
    insert_result = supabase.table('project_requests').insert(test_data).execute()
    print("✅ Test d'insertion réussi !")
    
    # Supprimer le test
    supabase.table('project_requests').delete().eq('title', 'Test connexion').execute()
    print("✅ Test nettoyé !")
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    print("Vérifiez que la table 'project_requests' existe dans votre base Supabase")
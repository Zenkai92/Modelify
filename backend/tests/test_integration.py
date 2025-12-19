import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

class TestIntegration(unittest.TestCase):
    """
    Suite de tests d'intégration "Safe" (Mocked).
    Ces tests vérifient le bon fonctionnement de l'API et de la logique métier
    SANS se connecter à la vraie base de données Supabase.
    """
    
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        """Vérifie que l'API est en ligne"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy"})

    @patch('app.routers.projects.supabase')
    def test_create_project_complete_flow(self, mock_supabase):
        """
        Test le flux complet de création de projet :
        1. Réception des données
        2. Insertion en base (simulée)
        3. Upload de fichier (simulé)
        4. Réponse API
        """
        # --- CONFIGURATION DES MOCKS ---
        
        # 1. Mock pour l'insertion dans 'Projects' et 'ProjectsImages'
        def table_side_effect(table_name):
            mock_t = MagicMock()
            if table_name == 'Projects':
                # Simule le retour de l'ID 123 après insertion
                mock_t.insert.return_value.execute.return_value.data = [{"id": 123}]
            elif table_name == 'ProjectsImages':
                # Simule le retour de l'ID 456 après insertion d'image
                mock_t.insert.return_value.execute.return_value.data = [{"id": 456}]
            return mock_t
            
        mock_supabase.table.side_effect = table_side_effect

        # 2. Mock pour le stockage (Storage)
        mock_storage_response = MagicMock()
        mock_bucket = mock_supabase.storage.from_.return_value
        mock_bucket.upload.return_value = mock_storage_response

        # --- PRÉPARATION DES DONNÉES ---
        files = [
            ('files', ('test_image.jpg', b'fake image content', 'image/jpeg'))
        ]
        data = {
            "title": "Projet Test Intégration",
            "descriptionClient": "Description du projet de test",
            "typeProject": "architecture",
            "goal": "Vérifier le mocking",
            "userId": "user-test-uuid",
            "nbElements": "1",
            "detailLevel": "high"
        }

        # --- EXÉCUTION ---
        response = self.client.post("/api/projects", data=data, files=files)

        # --- VÉRIFICATIONS ---
        # 1. Code HTTP
        self.assertEqual(response.status_code, 200)
        
        # 2. Contenu de la réponse
        json_resp = response.json()
        self.assertEqual(json_resp['message'], "Demande de projet créée avec succès")
        self.assertEqual(json_resp['projectId'], 123)

        # 3. Vérifier que Supabase a été appelé correctement
        # On vérifie qu'on a bien essayé d'insérer dans la table Projects
        mock_supabase.table.assert_any_call('Projects')
        # On vérifie qu'on a bien essayé d'uploader dans le bucket 'project-images'
        mock_supabase.storage.from_.assert_called_with('project-images')

    @patch('app.routers.projects.supabase')
    def test_create_project_validation_error(self, mock_supabase):
        """
        Test que l'API rejette bien une demande incomplète (champs manquants)
        """
        # Données incomplètes (manque 'userId', 'goal', etc.)
        data = {
            "title": "Projet Incomplet",
            # "descriptionClient": "Manquante", 
        }

        response = self.client.post("/api/projects", data=data)

        # FastAPI doit renvoyer 422 Unprocessable Entity pour les champs manquants
        self.assertEqual(response.status_code, 422)
        
        # On vérifie que la base de données N'A PAS été appelée
        mock_supabase.table.assert_not_called()

    @patch('app.routers.projects.supabase')
    def test_create_project_db_error(self, mock_supabase):
        """
        Test la gestion d'erreur si la base de données est inaccessible
        """
        # On simule une exception lors de l'appel à la base
        mock_supabase.table.side_effect = Exception("Erreur de connexion Supabase simulée")

        data = {
            "title": "Projet Crash DB",
            "descriptionClient": "Test crash",
            "typeProject": "test",
            "goal": "Crash",
            "userId": "user-123"
        }

        response = self.client.post("/api/projects", data=data)

        # L'API doit capturer l'erreur et renvoyer 500
        self.assertEqual(response.status_code, 500)
        self.assertIn("Erreur lors de la création", response.json()['detail'])

if __name__ == '__main__':
    unittest.main()

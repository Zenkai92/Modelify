import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.dependencies import get_current_user


class TestIntegration(unittest.TestCase):
    """
    Suite de tests d'intégration (Mocked).
    Ces tests vérifient le bon fonctionnement de l'API et de la logique métier
    """

    def setUp(self):
        # Override authentication dependency
        self.mock_user = MagicMock()
        self.mock_user.id = "test_user_id"
        app.dependency_overrides[get_current_user] = lambda: self.mock_user

        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides = {}

    def test_health_check(self):
        """Vérifie que l'API est en ligne"""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy"})

    @patch("app.routers.projects.validate_mime_type", return_value="image/jpeg")
    @patch("app.routers.projects.supabase")
    def test_create_project_complete_flow(self, mock_supabase, mock_validate_mime):
        """
        Test le flux complet de création de projet :
        1. Réception des données
        2. Insertion en base (simulée)
        3. Upload de fichier (simulé)
        4. Réponse API
        """

        def table_side_effect(table_name):
            mock_t = MagicMock()
            if table_name == "Projects":
                # Mock pour l'insertion
                mock_t.insert.return_value.execute.return_value.data = [{"id": 123}]

                # Mock pour le count (select -> eq -> neq -> execute)
                mock_select_chain = MagicMock()
                mock_t.select.return_value = mock_select_chain
                mock_select_chain.eq.return_value = mock_select_chain
                mock_select_chain.neq.return_value = mock_select_chain

                mock_count_result = MagicMock()
                mock_count_result.count = 0
                mock_select_chain.execute.return_value = mock_count_result

            elif table_name == "ProjectsImages":
                mock_t.insert.return_value.execute.return_value.data = [{"id": 456}]
            return mock_t

        mock_supabase.table.side_effect = table_side_effect

        mock_storage_response = MagicMock()
        mock_bucket = mock_supabase.storage.from_.return_value
        mock_bucket.upload.return_value = mock_storage_response

        files = [("files", ("test_image.jpg", b"fake image content", "image/jpeg"))]
        data = {
            "title": "Projet Test Intégration",
            "descriptionClient": "Description du projet de test",
            "use": "Vérifier le mocking",
            "userId": "user-test-uuid",
            "nbElements": "1",
            "detailLevel": "high",
        }

        response = self.client.post("/api/projects", data=data, files=files)

        self.assertEqual(response.status_code, 200)

        json_resp = response.json()
        self.assertEqual(json_resp["message"], "Demande de projet créée avec succès")
        self.assertEqual(json_resp["projectId"], 123)

        mock_supabase.table.assert_any_call("Projects")
        mock_supabase.storage.from_.assert_called_with("project-images")

    @patch("app.routers.projects.supabase")
    def test_create_project_validation_error(self, mock_supabase):
        """
        Test que l'API rejette bien une demande incomplète (champs manquants)
        """
        # Données incomplètes (manque 'userId', 'use', etc.)
        data = {
            "title": "Projet Incomplet",
            # "descriptionClient": "Manquante",
        }

        response = self.client.post("/api/projects", data=data)

        # FastAPI doit renvoyer 422 Unprocessable Entity pour les champs manquants
        self.assertEqual(response.status_code, 422)

        # On vérifie que la base de données N'A PAS été appelée
        mock_supabase.table.assert_not_called()

    @patch("app.routers.projects.supabase")
    def test_create_project_db_error(self, mock_supabase):
        """
        Test la gestion d'erreur si la base de données est inaccessible
        """
        # On simule une exception lors de l'appel à la base
        mock_supabase.table.side_effect = Exception(
            "Erreur de connexion Supabase simulée"
        )

        data = {
            "title": "Projet Crash DB",
            "descriptionClient": "Test crash",
            "use": "Crash",
            "userId": "user-123",
        }

        response = self.client.post("/api/projects", data=data)

        # L'API doit capturer l'erreur et renvoyer 500
        self.assertEqual(response.status_code, 500)
        self.assertIn("Erreur lors de la création", response.json()["detail"])

    @patch("app.routers.projects.supabase")
    def test_get_all_projects(self, mock_supabase):
        """Test récupération de la liste des projets"""
        # Mock user role check (standard user)
        mock_user_query = MagicMock()
        mock_user_query.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "role": "particulier"
        }

        # Mock projects query
        mock_project_query = MagicMock()
        mock_project_query.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": 123, "title": "Test Project"}
        ]

        def table_side_effect(table_name):
            if table_name == "Users":
                return mock_user_query
            elif table_name == "Projects":
                return mock_project_query
            return MagicMock()

        mock_supabase.table.side_effect = table_side_effect

        response = self.client.get("/api/projects")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["projects"]), 1)

    @patch("app.routers.projects.supabase")
    def test_get_project_detail(self, mock_supabase):
        """Test récupération d'un projet spécifique"""
        mock_project_query = MagicMock()
        mock_project_query.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": 123, "title": "Test Project", "userId": "test_user_id"}
        ]

        mock_images_query = MagicMock()
        mock_images_query.select.return_value.eq.return_value.execute.return_value.data = (
            []
        )

        def table_side_effect(table_name):
            if table_name == "Projects":
                return mock_project_query
            elif table_name == "ProjectsImages":
                return mock_images_query
            return MagicMock()

        mock_supabase.table.side_effect = table_side_effect

        response = self.client.get("/api/projects/123")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Test Project")

    @patch("app.routers.projects.supabase")
    def test_update_project(self, mock_supabase):
        """Test mise à jour d'un projet"""
        # Mock existing project check
        mock_project_query = MagicMock()
        # First call for check (select), Second call for update
        mock_project_query.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": 123, "userId": "test_user_id", "status": "en attente"}
        ]
        mock_project_query.update.return_value.eq.return_value.execute.return_value.data = [
            {"id": 123, "title": "Updated Title"}
        ]

        mock_supabase.table.return_value = mock_project_query

        response = self.client.put("/api/projects/123", data={"title": "Updated Title"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["project"]["title"], "Updated Title")

    @patch("app.routers.users.supabase")
    def test_create_user(self, mock_supabase):
        """Test création d'un utilisateur"""
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
            {"id": "new_user_id"}
        ]

        user_data = {
            "id": "new_user_id",
            "email": "new@test.com",
            "firstName": "New",
            "lastName": "User",
            "role": "particulier",
        }
        response = self.client.post("/api/users", json=user_data)
        self.assertEqual(response.status_code, 201)

    @patch("app.routers.users.supabase")
    def test_get_users_forbidden(self, mock_supabase):
        """Test accès refusé à la liste des utilisateurs pour non-admin"""
        # Mock user role check returning 'particulier'
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
            "role": "particulier"
        }

        response = self.client.get("/api/users")
        self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()

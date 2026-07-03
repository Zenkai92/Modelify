import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import UploadFile, HTTPException
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.projects import (
    sanitize_filename,
    validate_mime_type,
    create_project_request,
    get_project_count,
    refuse_project_quote,
)
from tests.base_test import BaseAsyncTestCase


class TestProjectsUnit(BaseAsyncTestCase):
    """Tests unitaires des projets"""

    def setUp(self):
        super().setUp()
        self.mock_user = MagicMock()
        self.mock_user.id = "user123"

    async def test_get_project_count(self):
        """Compteur projets actifs → retourne count et limite"""
        with patch("app.routers.projects.supabase") as mock_supabase:
            mock_count_response = MagicMock()
            mock_count_response.count = 1
            mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute.return_value = (
                mock_count_response
            )

            result = await get_project_count(current_user=self.mock_user)

            self.assertEqual(result, {"active_projects": 1, "limit": 2})
            mock_supabase.table.assert_called_with("Projects")

    def test_sanitize_filename(self):
        """Noms fichiers → nettoyage caractères spéciaux"""
        self.assertEqual(sanitize_filename("mon fichier.jpg"), "monfichier.jpg")
        self.assertEqual(sanitize_filename("test/hack.exe"), "testhack.exe")
        self.assertEqual(sanitize_filename("image_123.png"), "image_123.png")
        self.assertEqual(sanitize_filename("..\\etc\\passwd"), "..etcpasswd")
        self.assertEqual(sanitize_filename("valid-file.pdf"), "valid-file.pdf")

    @patch("app.routers.projects.magic", None)  # Force magic to None to test fallback
    def test_validate_mime_type_fallback(self):
        """Sans python-magic → fallback sur type déclaré"""
        content = b"%PDF-1.4..."
        declared = "application/pdf"
        self.assertEqual(validate_mime_type(content, declared), "application/pdf")

    @patch("app.routers.projects.magic")
    def test_validate_mime_type_magic(self, mock_magic):
        """Avec python-magic → détection MIME réelle"""
        mock_magic.from_buffer.return_value = "image/jpeg"
        content = b"\xff\xd8\xff..."
        declared = "application/octet-stream"  # Wrong declared type

        result = validate_mime_type(content, declared)

        self.assertEqual(result, "image/jpeg")
        mock_magic.from_buffer.assert_called_once()

    @patch("app.routers.projects.validate_mime_type", return_value="image/png")
    @patch("app.routers.projects.supabase_admin")
    @patch("app.routers.projects.supabase")
    async def test_create_project_file_validation_success(self, mock_supabase, mock_supabase_admin, mock_validate_mime):
        """Fichier valide → upload effectué"""
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "test.png"
        mock_file.content_type = "image/png"
        mock_file.read.return_value = b"fake-image-content"

        # Mock active projects count (0 projects)
        mock_count_response = MagicMock()
        mock_count_response.count = 0
        mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute.return_value = (
            mock_count_response
        )

        mock_insert_response = MagicMock()
        mock_insert_response.data = [{"id": "proj123"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_insert_response
        )

        # Upload storage et insert ProjectsImages passent par le client admin
        mock_supabase_admin.storage.from_.return_value.upload.return_value = {
            "key": "path/to/file"
        }

        result = await create_project_request(
            title="Test Project",
            descriptionClient="Desc",
            files=[mock_file],
            current_user=self.mock_user,
        )

        self.assertEqual(result["status"], "success")
        mock_supabase_admin.storage.from_.return_value.upload.assert_called()
        mock_supabase_admin.table.assert_called_with("ProjectsImages")

    @patch("app.routers.projects.supabase_admin")
    @patch("app.routers.projects.supabase")
    async def test_create_project_file_validation_failure(self, mock_supabase, mock_supabase_admin):
        """Fichier .exe → upload ignoré"""
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "virus.exe"
        mock_file.content_type = "application/x-msdownload"
        mock_file.read.return_value = b"MZ..."

        # Mock active projects count (0 projects)
        mock_count_response = MagicMock()
        mock_count_response.count = 0
        mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute.return_value = (
            mock_count_response
        )

        mock_insert_response = MagicMock()
        mock_insert_response.data = [{"id": "proj123"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_insert_response
        )

        result = await create_project_request(
            title="Test Project",
            descriptionClient="Desc",
            files=[mock_file],
            current_user=self.mock_user,
        )

        self.assertEqual(result["status"], "success")
        mock_supabase_admin.storage.from_.return_value.upload.assert_not_called()

    @patch("app.routers.projects.supabase")
    async def test_create_project_limit_reached(self, mock_supabase):
        """Limite 2 projets atteinte → HTTP 400"""
        # Mock active projects count >= 2
        mock_count_response = MagicMock()
        mock_count_response.count = 2
        mock_supabase.table.return_value.select.return_value.eq.return_value.not_.in_.return_value.execute.return_value = (
            mock_count_response
        )

        with self.assertRaises(HTTPException) as cm:
            await create_project_request(
                title="Test Project",
                descriptionClient="Desc",
                files=[],
                current_user=self.mock_user,
            )

        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("Limite de projets atteinte", cm.exception.detail)

    def _mock_project_fetch(self, mock_supabase, project):
        """Configure le mock supabase pour retourner un projet donné"""
        mock_response = MagicMock()
        mock_response.data = [project] if project else []
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

    @patch("app.routers.projects.cancel_quote")
    @patch("app.routers.projects.supabase_admin")
    @patch("app.routers.projects.supabase")
    async def test_refuse_quote_success(self, mock_supabase, mock_supabase_admin, mock_cancel_quote):
        """Client propriétaire refuse un devis envoyé → statut 'devis_refusé' + annulation Stripe"""
        self._mock_project_fetch(mock_supabase, {
            "id": "proj123",
            "userId": "user123",
            "status": "devis_envoyé",
            "stripe_quote_id": "qt_123",
        })

        mock_update_response = MagicMock()
        mock_update_response.data = [{"id": "proj123", "status": "devis_refusé"}]
        mock_supabase_admin.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_update_response
        )

        result = await refuse_project_quote("proj123", current_user=self.mock_user)

        self.assertEqual(result["project"]["status"], "devis_refusé")
        mock_cancel_quote.assert_called_once_with("qt_123")
        update_args = mock_supabase_admin.table.return_value.update.call_args[0][0]
        self.assertEqual(update_args["status"], "devis_refusé")

    @patch("app.routers.projects.supabase")
    async def test_refuse_quote_not_owner(self, mock_supabase):
        """Utilisateur non propriétaire → HTTP 403"""
        self._mock_project_fetch(mock_supabase, {
            "id": "proj123",
            "userId": "autre_user",
            "status": "devis_envoyé",
        })

        with self.assertRaises(HTTPException) as cm:
            await refuse_project_quote("proj123", current_user=self.mock_user)

        self.assertEqual(cm.exception.status_code, 403)

    @patch("app.routers.projects.supabase")
    async def test_refuse_quote_invalid_status(self, mock_supabase):
        """Projet sans devis en attente (ex: payé) → HTTP 400"""
        self._mock_project_fetch(mock_supabase, {
            "id": "proj123",
            "userId": "user123",
            "status": "payé",
        })

        with self.assertRaises(HTTPException) as cm:
            await refuse_project_quote("proj123", current_user=self.mock_user)

        self.assertEqual(cm.exception.status_code, 400)

    @patch("app.routers.projects.cancel_quote", side_effect=Exception("Stripe down"))
    @patch("app.routers.projects.supabase_admin")
    @patch("app.routers.projects.supabase")
    async def test_refuse_quote_stripe_failure_still_refuses(
        self, mock_supabase, mock_supabase_admin, mock_cancel_quote
    ):
        """Échec annulation Stripe → le refus aboutit quand même"""
        self._mock_project_fetch(mock_supabase, {
            "id": "proj123",
            "userId": "user123",
            "status": "paiement_attente",
            "stripe_quote_id": "qt_123",
        })

        mock_update_response = MagicMock()
        mock_update_response.data = [{"id": "proj123", "status": "devis_refusé"}]
        mock_supabase_admin.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_update_response
        )

        result = await refuse_project_quote("proj123", current_user=self.mock_user)

        self.assertEqual(result["project"]["status"], "devis_refusé")

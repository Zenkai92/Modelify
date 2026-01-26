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
            mock_supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.execute.return_value = (
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
    @patch("app.routers.projects.supabase")
    async def test_create_project_file_validation_success(self, mock_supabase, mock_validate_mime):
        """Fichier valide → upload effectué"""
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "test.png"
        mock_file.content_type = "image/png"
        mock_file.read.return_value = b"fake-image-content"

        # Mock active projects count (0 projects)
        mock_count_response = MagicMock()
        mock_count_response.count = 0
        mock_supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.execute.return_value = (
            mock_count_response
        )

        mock_insert_response = MagicMock()
        mock_insert_response.data = [{"id": "proj123"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_insert_response
        )

        mock_supabase.storage.from_.return_value.upload.return_value = {
            "key": "path/to/file"
        }
        mock_supabase.storage.from_.return_value.get_public_url.return_value = (
            "http://url/file.png"
        )

        result = await create_project_request(
            title="Test Project",
            descriptionClient="Desc",
            use="Perso",
            files=[mock_file],
            current_user=self.mock_user,
        )

        self.assertEqual(result["status"], "success")
        mock_supabase.storage.from_.return_value.upload.assert_called()

    @patch("app.routers.projects.supabase")
    async def test_create_project_file_validation_failure(self, mock_supabase):
        """Fichier .exe → upload ignoré"""
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "virus.exe"
        mock_file.content_type = "application/x-msdownload"
        mock_file.read.return_value = b"MZ..."

        # Mock active projects count (0 projects)
        mock_count_response = MagicMock()
        mock_count_response.count = 0
        mock_supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.execute.return_value = (
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
            use="Perso",
            files=[mock_file],
            current_user=self.mock_user,
        )

        self.assertEqual(result["status"], "success")
        mock_supabase.storage.from_.return_value.upload.assert_not_called()

    @patch("app.routers.projects.supabase")
    async def test_create_project_limit_reached(self, mock_supabase):
        """Limite 2 projets atteinte → HTTP 400"""
        # Mock active projects count >= 2
        mock_count_response = MagicMock()
        mock_count_response.count = 2
        mock_supabase.table.return_value.select.return_value.eq.return_value.neq.return_value.execute.return_value = (
            mock_count_response
        )

        with self.assertRaises(HTTPException) as cm:
            await create_project_request(
                title="Test Project",
                descriptionClient="Desc",
                use="Perso",
                files=[],
                current_user=self.mock_user,
            )

        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("Limite de projets atteinte", cm.exception.detail)

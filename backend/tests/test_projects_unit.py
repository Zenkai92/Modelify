import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import UploadFile
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.projects import sanitize_filename, validate_mime_type, create_project_request

class TestProjectsUnit(unittest.IsolatedAsyncioTestCase):

    def test_sanitize_filename(self):
        """
        Teste le nettoyage des noms de fichiers.
        """
        self.assertEqual(sanitize_filename("mon fichier.jpg"), "monfichier.jpg")
        self.assertEqual(sanitize_filename("test/hack.exe"), "testhack.exe")
        self.assertEqual(sanitize_filename("image_123.png"), "image_123.png")
        self.assertEqual(sanitize_filename("..\\etc\\passwd"), "..etcpasswd")
        self.assertEqual(sanitize_filename("valid-file.pdf"), "valid-file.pdf")

    @patch('app.routers.projects.magic', None) # Force magic to None to test fallback
    def test_validate_mime_type_fallback(self):
        """
        Teste la validation MIME quand python-magic n'est pas disponible.
        """
        content = b"%PDF-1.4..."
        declared = "application/pdf"
        self.assertEqual(validate_mime_type(content, declared), "application/pdf")

    @patch('app.routers.projects.magic')
    def test_validate_mime_type_magic(self, mock_magic):
        """
        Teste la validation MIME avec python-magic.
        """
        mock_magic.from_buffer.return_value = "image/jpeg"
        content = b"\xff\xd8\xff..."
        declared = "application/octet-stream" # Wrong declared type
        
        result = validate_mime_type(content, declared)
        
        self.assertEqual(result, "image/jpeg")
        mock_magic.from_buffer.assert_called_once()

    @patch('app.routers.projects.supabase')
    async def test_create_project_file_validation_success(self, mock_supabase):
        """
        Teste la création de projet avec un fichier valide.
        """
        mock_user = MagicMock()
        mock_user.id = "user123"
        
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "test.png"
        mock_file.content_type = "image/png"
        mock_file.read.return_value = b"fake-image-content"
        
        mock_insert_response = MagicMock()
        mock_insert_response.data = [{"id": "proj123"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_insert_response
        
        mock_supabase.storage.from_.return_value.upload.return_value = {"key": "path/to/file"}
        mock_supabase.storage.from_.return_value.get_public_url.return_value = "http://url/file.png"
        
        result = await create_project_request(
            title="Test Project",
            descriptionClient="Desc",
            use="Perso",
            files=[mock_file],
            current_user=mock_user
        )
        
        self.assertEqual(result['status'], "success")
        mock_supabase.storage.from_.return_value.upload.assert_called()

    @patch('app.routers.projects.supabase')
    async def test_create_project_file_validation_failure(self, mock_supabase):
        """
        Teste que les fichiers invalides sont ignorés.
        """
        mock_user = MagicMock()
        mock_user.id = "user123"
        
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "virus.exe"
        mock_file.content_type = "application/x-msdownload"
        mock_file.read.return_value = b"MZ..."
        
        mock_insert_response = MagicMock()
        mock_insert_response.data = [{"id": "proj123"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = mock_insert_response
        
        result = await create_project_request(
            title="Test Project",
            descriptionClient="Desc",
            use="Perso",
            files=[mock_file],
            current_user=mock_user
        )
        
        self.assertEqual(result['status'], "success")
        mock_supabase.storage.from_.return_value.upload.assert_not_called()

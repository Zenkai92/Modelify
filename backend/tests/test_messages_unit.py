import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import UploadFile, HTTPException
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.messages import get_project_messages, send_project_message
from tests.base_test import BaseAsyncTestCase


def make_supabase_admin(project=None, role="user", messages=None, inserted=None):
    """
    Construit un mock de supabase_admin routé par nom de table :
    Projects (accès projet), Users (rôle + nom expéditeur), ProjectsMessages.
    """
    mock_admin = MagicMock()

    projects_table = MagicMock()
    projects_table.select.return_value.eq.return_value.execute.return_value.data = (
        [project] if project else []
    )

    users_table = MagicMock()
    users_table.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
        "role": role,
        "firstName": "Jean",
        "lastName": "Dupont",
    }

    messages_table = MagicMock()
    messages_table.select.return_value.eq.return_value.order.return_value.execute.return_value.data = (
        messages or []
    )
    messages_table.insert.return_value.execute.return_value.data = (
        [inserted] if inserted else []
    )

    tables = {
        "Projects": projects_table,
        "Users": users_table,
        "ProjectsMessages": messages_table,
    }
    mock_admin.table.side_effect = lambda name: tables[name]
    mock_admin.storage.from_.return_value.create_signed_url.return_value = {
        "signedURL": "https://signed.example/img"
    }
    return mock_admin, messages_table


class TestMessagesUnit(BaseAsyncTestCase):
    """Tests unitaires de la messagerie projet"""

    def setUp(self):
        super().setUp()
        self.mock_user = MagicMock()
        self.mock_user.id = "user123"
        self.project = {"id": "proj1", "userId": "user123"}

    async def test_get_messages_owner(self):
        """Propriétaire → liste des messages avec nom d'expéditeur aplati"""
        messages = [
            {
                "id": "msg1",
                "projectId": "proj1",
                "senderId": "user123",
                "sender_role": "client",
                "content": "Bonjour",
                "fileUrl": None,
                "created_at": "2026-07-08T10:00:00+00:00",
                "Users": {"firstName": "Jean", "lastName": "Dupont"},
            }
        ]
        mock_admin, _ = make_supabase_admin(project=self.project, messages=messages)

        with patch("app.routers.messages.supabase_admin", mock_admin):
            result = await get_project_messages("proj1", current_user=self.mock_user)

        self.assertEqual(len(result["messages"]), 1)
        self.assertEqual(result["messages"][0]["senderName"], "Jean Dupont")
        self.assertEqual(result["messages"][0]["content"], "Bonjour")

    async def test_get_messages_project_not_found(self):
        """Projet inexistant → 404"""
        mock_admin, _ = make_supabase_admin(project=None)

        with patch("app.routers.messages.supabase_admin", mock_admin):
            with self.assertRaises(HTTPException) as ctx:
                await get_project_messages("missing", current_user=self.mock_user)

        self.assertEqual(ctx.exception.status_code, 404)

    async def test_get_messages_forbidden(self):
        """Ni propriétaire ni admin → 403"""
        project = {"id": "proj1", "userId": "someone-else"}
        mock_admin, _ = make_supabase_admin(project=project, role="user")

        with patch("app.routers.messages.supabase_admin", mock_admin):
            with self.assertRaises(HTTPException) as ctx:
                await get_project_messages("proj1", current_user=self.mock_user)

        self.assertEqual(ctx.exception.status_code, 403)

    async def test_send_message_empty(self):
        """Message sans texte ni image → 400"""
        mock_admin, _ = make_supabase_admin(project=self.project)

        with patch("app.routers.messages.supabase_admin", mock_admin):
            with self.assertRaises(HTTPException) as ctx:
                await send_project_message(
                    "proj1", content="   ", file=None, current_user=self.mock_user
                )

        self.assertEqual(ctx.exception.status_code, 400)

    async def test_send_text_message_success(self):
        """Message texte du client → insertion avec sender_role 'client'"""
        inserted = {
            "id": "msg1",
            "projectId": "proj1",
            "senderId": "user123",
            "sender_role": "client",
            "content": "Bonjour",
            "fileUrl": None,
            "created_at": "2026-07-08T10:00:00+00:00",
        }
        mock_admin, messages_table = make_supabase_admin(
            project=self.project, inserted=inserted
        )

        with patch("app.routers.messages.supabase_admin", mock_admin):
            result = await send_project_message(
                "proj1", content="Bonjour", file=None, current_user=self.mock_user
            )

        self.assertEqual(result["message"], "Message envoyé")
        insert_arg = messages_table.insert.call_args[0][0]
        self.assertEqual(insert_arg["sender_role"], "client")
        self.assertEqual(insert_arg["content"], "Bonjour")
        self.assertIsNone(insert_arg["fileUrl"])

    async def test_send_message_admin_role(self):
        """Admin non propriétaire → accès autorisé et sender_role 'admin'"""
        project = {"id": "proj1", "userId": "someone-else"}
        inserted = {
            "id": "msg2",
            "projectId": "proj1",
            "senderId": "user123",
            "sender_role": "admin",
            "content": "Réponse admin",
            "fileUrl": None,
            "created_at": "2026-07-08T10:05:00+00:00",
        }
        mock_admin, messages_table = make_supabase_admin(
            project=project, role="admin", inserted=inserted
        )

        with patch("app.routers.messages.supabase_admin", mock_admin):
            result = await send_project_message(
                "proj1", content="Réponse admin", file=None, current_user=self.mock_user
            )

        self.assertEqual(result["message"], "Message envoyé")
        insert_arg = messages_table.insert.call_args[0][0]
        self.assertEqual(insert_arg["sender_role"], "admin")

    async def test_send_message_invalid_file_type(self):
        """Fichier non-image → 400, aucun upload"""
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "virus.exe"
        mock_file.content_type = "application/x-msdownload"
        mock_file.read.return_value = b"MZ..."

        mock_admin, _ = make_supabase_admin(project=self.project)

        with patch("app.routers.messages.supabase_admin", mock_admin), patch(
            "app.routers.messages.validate_mime_type",
            return_value="application/x-msdownload",
        ):
            with self.assertRaises(HTTPException) as ctx:
                await send_project_message(
                    "proj1", content=None, file=mock_file, current_user=self.mock_user
                )

        self.assertEqual(ctx.exception.status_code, 400)
        mock_admin.storage.from_.return_value.upload.assert_not_called()

    async def test_send_image_message_success(self):
        """Image valide → upload storage + fileUrl dans l'insertion"""
        mock_file = AsyncMock(spec=UploadFile)
        mock_file.filename = "avancement.png"
        mock_file.content_type = "image/png"
        mock_file.read.return_value = b"fake-image-content"

        inserted = {
            "id": "msg3",
            "projectId": "proj1",
            "senderId": "user123",
            "sender_role": "client",
            "content": "Voici une photo",
            "fileUrl": "messages/proj1/123_avancement.png",
            "created_at": "2026-07-08T10:10:00+00:00",
        }
        mock_admin, messages_table = make_supabase_admin(
            project=self.project, inserted=inserted
        )

        with patch("app.routers.messages.supabase_admin", mock_admin), patch(
            "app.routers.messages.validate_mime_type", return_value="image/png"
        ):
            result = await send_project_message(
                "proj1",
                content="Voici une photo",
                file=mock_file,
                current_user=self.mock_user,
            )

        self.assertEqual(result["message"], "Message envoyé")
        mock_admin.storage.from_.return_value.upload.assert_called_once()
        insert_arg = messages_table.insert.call_args[0][0]
        self.assertTrue(insert_arg["fileUrl"].startswith("messages/proj1/"))
        # L'URL renvoyée au frontend est signée
        self.assertEqual(result["data"]["fileUrl"], "https://signed.example/img")


if __name__ == "__main__":
    unittest.main()

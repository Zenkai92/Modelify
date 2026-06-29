import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import HTTPException, status
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.users import (
    create_user,
    get_users,
    update_current_user_profile,
)
from app.schemas.users import UserCreate, UserUpdate
from tests.base_test import BaseAsyncTestCase


class TestUsersUnit(BaseAsyncTestCase):
    """Tests unitaires des utilisateurs"""

    def setUp(self):
        super().setUp()

    @patch("app.routers.users.supabase")
    async def test_create_user_security_role_enforcement(self, mock_supabase):
        """Rôle 'admin' injecté → forcé à 'user'"""
        user_input = UserCreate(
            id="user_123",
            email="hacker@example.com",
            password="password123",
            role="admin",  # Tentative d'injection de rôle
            firstName="Hacker",
            lastName="Man",
        )

        mock_response = MagicMock()
        mock_response.data = [
            {"id": "123", "email": "hacker@example.com", "role": "user"}
        ]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_response
        )

        response = await create_user(user_input)

        args, _ = mock_supabase.table.return_value.insert.call_args
        inserted_data = args[0]
        self.assertEqual(inserted_data["role"], "user")
        self.assertEqual(response["user"]["role"], "user")

    @patch("app.routers.users.supabase")
    async def test_get_users_access_control_admin(self, mock_supabase):
        """Admin → accès liste utilisateurs autorisé"""
        mock_user = MagicMock()
        mock_user.id = "admin_id"

        mock_admin_check = MagicMock()
        mock_admin_check.data = {"role": "admin"}
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = (
            mock_admin_check
        )

        mock_users_list = MagicMock()
        mock_users_list.data = [{"id": "u1"}, {"id": "u2"}]

        mock_query_builder = mock_supabase.table.return_value

        mock_select_builder = MagicMock()
        mock_query_builder.select.return_value = mock_select_builder

        mock_eq_builder = MagicMock()
        mock_select_builder.eq.return_value = mock_eq_builder
        mock_single_builder = MagicMock()
        mock_eq_builder.single.return_value = mock_single_builder
        mock_single_builder.execute.return_value.data = {"role": "admin"}

        mock_select_builder.execute.return_value.data = [{"id": "u1"}, {"id": "u2"}]

        result = await get_users(current_user=mock_user)

        self.assertEqual(len(result), 2)

    @patch("app.routers.users.supabase")
    async def test_get_users_access_control_forbidden(self, mock_supabase):
        """Non-admin → HTTP 403"""
        mock_user = MagicMock()
        mock_user.id = "user_id"

        mock_query_builder = mock_supabase.table.return_value
        mock_select_builder = MagicMock()
        mock_query_builder.select.return_value = mock_select_builder

        mock_eq_builder = MagicMock()
        mock_select_builder.eq.return_value = mock_eq_builder
        mock_single_builder = MagicMock()
        mock_eq_builder.single.return_value = mock_single_builder

        mock_single_builder.execute.return_value.data = {"role": "user"}

        with self.assertRaises(HTTPException) as cm:
            await get_users(current_user=mock_user)

        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)

    @patch("app.routers.users.supabase")
    async def test_update_profile_success(self, mock_supabase):
        """Mise à jour profil → champs persistés + updateAt ajouté"""
        mock_user = MagicMock()
        mock_user.id = "user_123"

        mock_response = MagicMock()
        mock_response.data = [
            {"id": "user_123", "firstName": "Jean", "lastName": "Dupont"}
        ]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        payload = UserUpdate(firstName="Jean", lastName="Dupont", companyName="ACME")
        result = await update_current_user_profile(payload, current_user=mock_user)

        args, _ = mock_supabase.table.return_value.update.call_args
        updated_data = args[0]
        self.assertEqual(updated_data["firstName"], "Jean")
        self.assertEqual(updated_data["companyName"], "ACME")
        self.assertIn("updateAt", updated_data)
        self.assertEqual(result["user"]["id"], "user_123")

    @patch("app.routers.users.supabase")
    async def test_update_profile_ignores_sensitive_fields(self, mock_supabase):
        """Champs sensibles (role/email/id) jamais écrits via /users/me"""
        mock_user = MagicMock()
        mock_user.id = "user_123"

        mock_response = MagicMock()
        mock_response.data = [{"id": "user_123", "firstName": "Jean"}]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = (
            mock_response
        )

        # UserUpdate ignore déjà role/email/id (champs absents du schéma),
        # mais on vérifie qu'ils ne fuient pas dans la requête de mise à jour.
        payload = UserUpdate(firstName="Jean")
        await update_current_user_profile(payload, current_user=mock_user)

        args, _ = mock_supabase.table.return_value.update.call_args
        updated_data = args[0]
        self.assertNotIn("role", updated_data)
        self.assertNotIn("email", updated_data)
        self.assertNotIn("id", updated_data)

    async def test_update_profile_empty_payload_rejected(self):
        """Payload vide → HTTP 400 (rien à mettre à jour)"""
        mock_user = MagicMock()
        mock_user.id = "user_123"

        payload = UserUpdate()
        with self.assertRaises(HTTPException) as cm:
            await update_current_user_profile(payload, current_user=mock_user)

        self.assertEqual(cm.exception.status_code, status.HTTP_400_BAD_REQUEST)

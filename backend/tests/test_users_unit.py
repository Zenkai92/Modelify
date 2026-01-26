import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import HTTPException, status
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.routers.users import create_user, get_users
from app.schemas.users import UserCreate
from tests.base_test import BaseAsyncTestCase


class TestUsersUnit(BaseAsyncTestCase):
    """Tests unitaires des utilisateurs"""

    def setUp(self):
        super().setUp()

    @patch("app.routers.users.supabase")
    async def test_create_user_security_role_enforcement(self, mock_supabase):
        """Rôle 'admin' injecté → forcé à 'particulier'"""
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
            {"id": "123", "email": "hacker@example.com", "role": "particulier"}
        ]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = (
            mock_response
        )

        response = await create_user(user_input)

        args, _ = mock_supabase.table.return_value.insert.call_args
        inserted_data = args[0]
        self.assertEqual(inserted_data["role"], "particulier")
        self.assertEqual(response["user"]["role"], "particulier")

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

        mock_single_builder.execute.return_value.data = {"role": "particulier"}

        with self.assertRaises(HTTPException) as cm:
            await get_users(current_user=mock_user)

        self.assertEqual(cm.exception.status_code, status.HTTP_403_FORBIDDEN)

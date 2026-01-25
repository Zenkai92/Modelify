import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.dependencies import get_current_user


class TestAuthUnit(unittest.IsolatedAsyncioTestCase):

    @patch("app.dependencies.supabase")
    async def test_get_current_user_valid_token(self, mock_supabase):
        """
        Teste la récupération d'un utilisateur avec un token valide.
        """
        token = "valid_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        mock_user = MagicMock()
        mock_user.id = "user123"
        mock_user.email = "test@example.com"

        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_supabase.auth.get_user.return_value = mock_response

        user = await get_current_user(credentials)

        self.assertEqual(user.id, "user123")
        mock_supabase.auth.get_user.assert_called_with(token)

    @patch("app.dependencies.supabase")
    async def test_get_current_user_invalid_token(self, mock_supabase):
        """
        Teste le rejet d'un token invalide.
        """
        token = "invalid_token"
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

        mock_supabase.auth.get_user.return_value = MagicMock(user=None)

        with self.assertRaises(HTTPException) as cm:
            await get_current_user(credentials)

        self.assertEqual(cm.exception.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("app.dependencies.supabase")
    async def test_get_current_user_exception(self, mock_supabase):
        """
        Teste la gestion des exceptions lors de l'appel à Supabase.
        """
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")
        mock_supabase.auth.get_user.side_effect = Exception("Connection error")

        with self.assertRaises(HTTPException) as cm:
            await get_current_user(credentials)

        self.assertEqual(cm.exception.status_code, status.HTTP_401_UNAUTHORIZED)

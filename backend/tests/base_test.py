"""
Base test class with enhanced output formatting
"""
import unittest
import sys


class BaseTestCase(unittest.TestCase):
    """Classe de base pour les tests synchrones avec affichage amélioré"""

    def setUp(self):
        """Affiche les informations du test avant son exécution"""
        test_name = self._testMethodName
        test_doc = self._testMethodDoc or "Pas de description"
        
        print("\n" + "=" * 70)
        print(f"📋 TEST: {test_name}")
        print(f"📝 Description: {test_doc}")
        print("-" * 70)

    def tearDown(self):
        """Affiche le statut du test après son exécution"""
        try:
            result = self._outcome.result
            
            # Vérifier si le test a échoué (compatible pytest et unittest)
            if result is None:
                status = "✅ OK"
            elif hasattr(result, 'errors') and hasattr(result, 'failures'):
                errors = [e for e in result.errors if e[0] is self]
                failures = [f for f in result.failures if f[0] is self]
                
                if errors:
                    status = "❌ ERREUR"
                elif failures:
                    status = "❌ ÉCHEC"
                else:
                    status = "✅ OK"
            else:
                # pytest doesn't use the same result structure
                status = "✅ OK"
        except (AttributeError, TypeError):
            status = "✅ OK"
        
        print(f"📊 Statut: {status}")
        print("=" * 70)


class BaseAsyncTestCase(unittest.IsolatedAsyncioTestCase):
    """Classe de base pour les tests asynchrones avec affichage amélioré"""

    def setUp(self):
        """Affiche les informations du test avant son exécution"""
        test_name = self._testMethodName
        test_doc = self._testMethodDoc or "Pas de description"
        
        print("\n" + "=" * 70)
        print(f"📋 TEST: {test_name}")
        print(f"📝 Description: {test_doc}")
        print("-" * 70)

    def tearDown(self):
        """Affiche le statut du test après son exécution"""
        try:
            result = self._outcome.result
            
            # Vérifier si le test a échoué (compatible pytest et unittest)
            if result is None:
                status = "✅ OK"
            elif hasattr(result, 'errors') and hasattr(result, 'failures'):
                errors = [e for e in result.errors if e[0] is self]
                failures = [f for f in result.failures if f[0] is self]
                
                if errors:
                    status = "❌ ERREUR"
                elif failures:
                    status = "❌ ÉCHEC"
                else:
                    status = "✅ OK"
            else:
                # pytest doesn't use the same result structure
                status = "✅ OK"
        except (AttributeError, TypeError):
            status = "✅ OK"
        
        print(f"📊 Statut: {status}")
        print("=" * 70)

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
        result = self._outcome.result
        test_name = self._testMethodName
        
        # Vérifier si le test a échoué
        if result is None:
            status = "✅ OK"
        else:
            errors = [e for e in result.errors if e[0] is self]
            failures = [f for f in result.failures if f[0] is self]
            
            if errors:
                status = "❌ ERREUR"
            elif failures:
                status = "❌ ÉCHEC"
            else:
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
        result = self._outcome.result
        test_name = self._testMethodName
        
        # Vérifier si le test a échoué
        if result is None:
            status = "✅ OK"
        else:
            errors = [e for e in result.errors if e[0] is self]
            failures = [f for f in result.failures if f[0] is self]
            
            if errors:
                status = "❌ ERREUR"
            elif failures:
                status = "❌ ÉCHEC"
            else:
                status = "✅ OK"
        
        print(f"📊 Statut: {status}")
        print("=" * 70)

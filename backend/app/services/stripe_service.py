import stripe
import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Configuration de la clé API depuis les variables d'environnement
# Assurez-vous d'avoir STRIPE_SECRET_KEY dans votre .env
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def get_or_create_customer(email: str, name: str, user_id: str) -> str:
    """
    Récupère un client Stripe existant par email ou en crée un nouveau.
    Retourne l'ID du client Stripe (cus_...).
    """
    try:
        # 1. Recherche par email
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            return customers.data[0].id

        # 2. Création si inexistant
        customer = stripe.Customer.create(
            email=email, name=name, metadata={"user_id": user_id}
        )
        return customer.id
    except Exception as e:
        logger.error(f"Erreur Stripe (Customer): {str(e)}")
        raise e


def create_quote(customer_id: str, amount_eur: float, project_title: str) -> dict:
    """
    Crée un devis (Quote) dans Stripe pour un montant donné.
    Retourne l'objet Quote.
    """
    try:
        # Convertir en centimes (Stripe utilise les plus petites unités)
        amount_cents = int(amount_eur * 100)

        # Création du devis
        # Note: Stripe Quote API est un peu particulière. Pour des produits "à la volée" (one-time),
        # il est préférable de créer d'abord un Price ou d'utiliser la structure correcte.
        # L'erreur précédente indiquait que 'product_data' n'est pas supporté directement dans quote.line_items.price_data

        # Solution: On crée d'abord un produit et un prix "one-off"
        price = stripe.Price.create(
            unit_amount=amount_cents,
            currency="eur",
            product_data={"name": f"Projet : {project_title}"},
        )

        quote = stripe.Quote.create(
            customer=customer_id,
            line_items=[
                {
                    "price": price.id,
                    "quantity": 1,
                }
            ],
            description=f"Devis pour le projet {project_title}",
            # Important : permet de générer une facture une fois accepté
            collection_method="send_invoice",
            invoice_settings={
                "days_until_due": 30  # Facture payable sous 30 jours après acceptation
            },
        )

        # Finalisation immédiate pour générer le PDF/Lien
        # Si vous voulez laisser le devis en brouillon, commentez cette ligne
        finalized_quote = stripe.Quote.finalize_quote(quote.id)

        return finalized_quote

    except Exception as e:
        logger.error(f"Erreur Stripe (Quote): {str(e)}")
        raise e


def create_checkout_session(
    customer_id: str,
    amount_eur: float,
    project_title: str,
    project_id: str,
    success_url: str,
    cancel_url: str,
) -> str:
    """
    Crée une session de paiement Stripe Checkout et retourne l'URL de redirection.
    """
    try:
        amount_cents = int(amount_eur * 100)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f"Projet : {project_title}",
                        },
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            # Métadonnée cruciale pour retrouver le projet lors du webhook
            metadata={"project_id": project_id, "type": "project_payment"},
        )
        return session.url
    except Exception as e:
        logger.error(f"Erreur Stripe (Checkout): {str(e)}")
        raise e

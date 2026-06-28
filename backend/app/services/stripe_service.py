import stripe
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def get_or_create_customer(email: str, name: str, user_id: str) -> str:
    """
    Récupère un client Stripe existant par email ou en crée un nouveau.
    Retourne l'ID du client Stripe (cus_...).
    """
    try:
        customers = stripe.Customer.list(email=email, limit=1)
        if customers.data:
            return customers.data[0].id

        customer = stripe.Customer.create(
            email=email, name=name, metadata={"user_id": user_id}
        )
        return customer.id
    except Exception as e:
        logger.error(f"Erreur Stripe (Customer): {str(e)}")
        raise e


def create_stripe_product_and_price(title: str, description: str, price_eur: float) -> dict:
    """
    Crée un Product et un Price dans Stripe lors de la création d'un produit.
    Retourne {"stripe_product_id": "prod_...", "stripe_price_id": "price_..."}.
    """
    try:
        product = stripe.Product.create(
            name=title,
            description=description or title,
        )
        price = stripe.Price.create(
            product=product.id,
            unit_amount=int(price_eur * 100),
            currency="eur",
        )
        return {"stripe_product_id": product.id, "stripe_price_id": price.id}
    except Exception as e:
        logger.error(f"Erreur Stripe (create Product+Price): {str(e)}")
        raise e


def update_stripe_product_and_price(
    stripe_product_id: str,
    old_price_id: str,
    title: str,
    description: str,
    new_price_eur: float,
    price_changed: bool,
) -> str:
    """
    Met à jour le Product Stripe (nom, description).
    Si le prix a changé, archive l'ancien Price et crée un nouveau.
    Retourne le stripe_price_id actif (nouveau si changement, ancien sinon).
    """
    try:
        stripe.Product.modify(stripe_product_id, name=title, description=description or title)

        if price_changed:
            new_price = stripe.Price.create(
                product=stripe_product_id,
                unit_amount=int(new_price_eur * 100),
                currency="eur",
            )
            if old_price_id:
                try:
                    stripe.Price.modify(old_price_id, active=False)
                except Exception:
                    pass
            return new_price.id

        return old_price_id
    except Exception as e:
        logger.error(f"Erreur Stripe (update Product+Price): {str(e)}")
        raise e


def create_quote(customer_id: str, amount_eur: float, project_title: str) -> dict:
    """
    Crée un devis (Quote) dans Stripe pour un montant donné.
    Retourne l'objet Quote finalisé.
    """
    try:
        amount_cents = int(amount_eur * 100)

        price = stripe.Price.create(
            unit_amount=amount_cents,
            currency="eur",
            product_data={"name": f"Projet : {project_title}"},
        )

        quote = stripe.Quote.create(
            customer=customer_id,
            line_items=[{"price": price.id, "quantity": 1}],
            description=f"Devis pour le projet {project_title}",
            collection_method="send_invoice",
            invoice_settings={"days_until_due": 30},
        )

        return stripe.Quote.finalize_quote(quote.id)

    except Exception as e:
        logger.error(f"Erreur Stripe (Quote): {str(e)}")
        raise e


def create_product_checkout_session(
    customer_id: str,
    price_id: str,
    product_id: str,
    user_id: str,
    success_url: str,
    cancel_url: str,
) -> str:
    """
    Crée une session Stripe Checkout pour l'achat d'un produit
    en utilisant le stripe_price_id stocké en base.
    Retourne l'URL de redirection.
    """
    try:
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "type": "product_purchase",
                "product_id": product_id,
                "user_id": user_id,
            },
        )
        return session.url
    except Exception as e:
        logger.error(f"Erreur Stripe (Product Checkout): {str(e)}")
        raise e


def create_cart_checkout_session(
    customer_id: str,
    items: list,
    user_id: str,
    success_url: str,
    cancel_url: str,
) -> str:
    """
    Crée une session Stripe Checkout pour l'achat de plusieurs produits (panier)
    en une seule transaction. `items` est une liste de {"price_id", "product_id"}.
    Retourne l'URL de redirection.
    """
    try:
        line_items = [{"price": item["price_id"], "quantity": 1} for item in items]
        product_ids = ",".join(item["product_id"] for item in items)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "type": "cart_purchase",
                "product_ids": product_ids,
                "user_id": user_id,
            },
        )
        return session.url
    except Exception as e:
        logger.error(f"Erreur Stripe (Cart Checkout): {str(e)}")
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
    Crée une session de paiement Stripe Checkout pour un projet.
    Retourne l'URL de redirection.
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
                        "product_data": {"name": f"Projet : {project_title}"},
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"project_id": project_id, "type": "project_payment"},
        )
        return session.url
    except Exception as e:
        logger.error(f"Erreur Stripe (Checkout): {str(e)}")
        raise e

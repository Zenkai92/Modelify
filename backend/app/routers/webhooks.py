from fastapi import APIRouter, HTTPException, Request
from app.database import supabase, supabase_admin
from datetime import datetime, timezone
import stripe
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook pour recevoir les confirmations de paiement de Stripe
    (paiement de projet, achat produit unitaire ou panier).
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    if not webhook_secret:
        logger.error(
            "STRIPE_WEBHOOK_SECRET manquant dans les variables d'environnement"
        )
        raise HTTPException(status_code=500, detail="Configuration serveur manquante")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError as e:
        logger.error(f"Webhook Error (ValueError): {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Webhook Error (SignatureVerificationError): {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        logger.error(f"Webhook Error (Unknown): {e}")
        raise HTTPException(status_code=400, detail="Webhook processing error")

    # Gestion de l'événement 'checkout.session.completed'
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        event_type = metadata.get("type")

        if event_type == "project_payment":
            project_id = metadata.get("project_id")
            if project_id:
                logger.info(f"WEBHOOK: Paiement projet confirmé pour {project_id}")
                try:
                    supabase_admin.table("Projects").update(
                        {
                            "status": "payé",
                            "stripe_invoice_id": session.get("payment_intent"),
                            "updatedAt": datetime.now(timezone.utc).date().isoformat(),
                        }
                    ).eq("id", project_id).execute()
                    logger.info("Statut projet mis à jour -> payé")
                except Exception as db_error:
                    logger.error(f"Erreur DB update projet {project_id}: {db_error}")

        elif event_type == "product_purchase":
            product_id = metadata.get("product_id")
            user_id = metadata.get("user_id")
            if product_id and user_id:
                logger.info(f"WEBHOOK: Achat produit confirmé — produit {product_id} par user {user_id}")
                try:
                    supabase_admin.table("Orders").insert(
                        {
                            "product_id": product_id,
                            "client_id": user_id,
                            "stripe_session_id": session.get("id"),
                            "stripe_payment_intent_id": session.get("payment_intent"),
                            "amount_paid": session.get("amount_total", 0) / 100,
                            "status": "completed",
                        }
                    ).execute()
                    logger.info("Achat produit enregistré dans Orders")
                except Exception as db_error:
                    logger.error(f"Erreur DB insert Orders: {db_error}")

        elif event_type == "cart_purchase":
            product_ids = [p for p in metadata.get("product_ids", "").split(",") if p]
            user_id = metadata.get("user_id")
            if product_ids and user_id:
                logger.info(f"WEBHOOK: Achat panier confirmé — {len(product_ids)} produit(s) par user {user_id}")
                try:
                    prices = (
                        supabase.table("Products").select("id,price").in_("id", product_ids).execute()
                    )
                    price_map = {p["id"]: p["price"] for p in (prices.data or [])}

                    orders_rows = [
                        {
                            "product_id": product_id,
                            "client_id": user_id,
                            "stripe_session_id": session.get("id"),
                            "stripe_payment_intent_id": session.get("payment_intent"),
                            "amount_paid": price_map.get(product_id, 0),
                            "status": "completed",
                        }
                        for product_id in product_ids
                    ]
                    supabase_admin.table("Orders").insert(orders_rows).execute()
                    logger.info(f"Achat panier enregistré dans Orders ({len(orders_rows)} ligne(s))")
                except Exception as db_error:
                    logger.error(f"Erreur DB insert Orders (panier): {db_error}")

    # On renvoie toujours 200 OK pour dire à Stripe "Bien reçu", même si l'event ne nous intéresse pas
    return {"status": "success"}

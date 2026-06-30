from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.database import supabase, supabase_admin
from app.dependencies import get_current_user
from app.services.stripe_service import get_or_create_customer, create_cart_checkout_session
import logging
import os
import traceback
import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()
logger = logging.getLogger(__name__)


class CartCheckoutRequest(BaseModel):
    product_ids: list[str]


@router.post("/cart/checkout", status_code=status.HTTP_200_OK)
async def checkout_cart(payload: CartCheckoutRequest, current_user=Depends(get_current_user)):
    """
    Initier le paiement Stripe pour l'achat de plusieurs produits (panier) en une
    seule session Stripe Checkout. Retourne l'URL de redirection vers Stripe.
    """
    product_ids = list(dict.fromkeys(payload.product_ids))
    if not product_ids:
        raise HTTPException(status_code=400, detail="Le panier est vide")

    try:
        products_query = supabase.table("Products").select("*").in_("id", product_ids).execute()
        products = products_query.data or []

        found_ids = {p["id"] for p in products}
        missing_ids = [pid for pid in product_ids if pid not in found_ids]
        if missing_ids:
            raise HTTPException(status_code=404, detail=f"Produit(s) introuvable(s) : {', '.join(missing_ids)}")

        missing_price = [p["id"] for p in products if not p.get("stripe_price_id")]
        if missing_price:
            raise HTTPException(
                status_code=400,
                detail="Un ou plusieurs produits ne sont pas encore disponibles à l'achat",
            )

        already = (
            supabase_admin.table("Orders")
            .select("product_id")
            .eq("client_id", current_user.id)
            .in_("product_id", product_ids)
            .eq("status", "completed")
            .execute()
        )
        if already.data:
            already_ids = [o["product_id"] for o in already.data]
            raise HTTPException(
                status_code=400,
                detail=f"Vous avez déjà acheté ce(s) produit(s) : {', '.join(already_ids)}",
            )

        user_data = supabase_admin.table("Users").select("*").eq("id", current_user.id).single().execute()
        if not user_data.data:
            raise HTTPException(status_code=404, detail="Utilisateur introuvable")

        user = user_data.data
        stripe_customer_id = user.get("stripe_customer_id")

        if not stripe_customer_id:
            client_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user.get("email")
            stripe_customer_id = get_or_create_customer(user["email"], client_name, current_user.id)
            supabase_admin.table("Users").update({"stripe_customer_id": stripe_customer_id}).eq("id", current_user.id).execute()

        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

        items = [{"price_id": p["stripe_price_id"], "product_id": p["id"]} for p in products]

        checkout_url = create_cart_checkout_session(
            customer_id=stripe_customer_id,
            items=items,
            user_id=current_user.id,
            success_url=f"{base_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/payment/cancel",
        )

        return {"checkout_url": checkout_url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de l'initiation du paiement panier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cart/purchased-ids", status_code=status.HTTP_200_OK)
async def get_purchased_ids(current_user=Depends(get_current_user)):
    """Retourne les ids des produits déjà achetés par l'utilisateur courant."""
    try:
        result = (
            supabase_admin.table("Orders")
            .select("product_id")
            .eq("client_id", current_user.id)
            .eq("status", "completed")
            .execute()
        )
        return {"product_ids": [o["product_id"] for o in (result.data or [])]}
    except Exception as e:
        logger.error(f"Erreur récupération des achats: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.get("/orders/mine", status_code=status.HTTP_200_OK)
async def get_my_product_orders(current_user=Depends(get_current_user)):
    """Retourne toutes les commandes de produits (achat depuis la boutique) de l'utilisateur."""
    try:
        result = (
            supabase_admin.table("Orders")
            .select("id, product_id, status, created_at, stripe_session_id")
            .eq("client_id", current_user.id)
            .order("created_at", desc=True)
            .execute()
        )
        orders = result.data or []

        if not orders:
            return []

        product_ids = list({o["product_id"] for o in orders if o.get("product_id")})
        products_result = (
            supabase.table("Products")
            .select("*")
            .in_("id", product_ids)
            .execute()
        )
        products_by_id = {p["id"]: p for p in (products_result.data or [])}

        return [
            {
                "id": o["id"],
                "product_id": o["product_id"],
                "status": o["status"],
                "created_at": o["created_at"],
                "stripe_session_id": o["stripe_session_id"],
                "product": products_by_id.get(o["product_id"]),
            }
            for o in orders
        ]
    except Exception as e:
        logger.error(f"Erreur récupération commandes produits: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.get("/cart/order-status", status_code=status.HTTP_200_OK)
async def get_order_status(session_id: str, current_user=Depends(get_current_user)):
    """
    Vérifie si une session de paiement a été enregistrée dans Orders.
    Si non, interroge Stripe directement et crée les commandes si le paiement est confirmé.
    Fonctionne pour les achats produit et panier.
    """
    try:
        # 1. Déjà en base ?
        existing = (
            supabase_admin.table("Orders")
            .select("id")
            .eq("client_id", current_user.id)
            .eq("stripe_session_id", session_id)
            .eq("status", "completed")
            .execute()
        )
        if existing.data:
            return {"completed": True, "count": len(existing.data)}

        # 2. Interroger Stripe directement
        try:
            stripe_session = stripe.checkout.Session.retrieve(session_id)
        except Exception as e:
            logger.error(f"Erreur récupération session Stripe: {e}\n{traceback.format_exc()}")
            return {"completed": False, "count": 0}

        if stripe_session.payment_status != "paid":
            return {"completed": False, "count": 0}

        # 3. Vérifier que la session appartient bien à cet utilisateur
        metadata = stripe_session.metadata._data if stripe_session.metadata else {}
        user_id = metadata.get("user_id")
        if not user_id or user_id != current_user.id:
            return {"completed": False, "count": 0}

        event_type = metadata.get("type")
        payment_intent = stripe_session.payment_intent
        amount_total = (stripe_session.amount_total or 0) / 100
        inserted = 0

        if event_type == "product_purchase":
            product_id = metadata.get("product_id")
            if product_id:
                supabase_admin.table("Orders").insert({
                    "product_id": product_id,
                    "client_id": user_id,
                    "stripe_session_id": session_id,
                    "stripe_payment_intent_id": payment_intent,
                    "amount_paid": amount_total,
                    "status": "completed",
                }).execute()
                inserted = 1
                logger.info(f"Commande produit créée via vérification directe: user={user_id}, product={product_id}")

        elif event_type == "cart_purchase":
            product_ids = [p.strip() for p in metadata.get("product_ids", "").split(",") if p.strip()]
            if product_ids:
                prices_res = supabase_admin.table("Products").select("id,price").in_("id", product_ids).execute()
                price_map = {p["id"]: p["price"] for p in (prices_res.data or [])}
                rows = [
                    {
                        "product_id": pid,
                        "client_id": user_id,
                        "stripe_session_id": session_id,
                        "stripe_payment_intent_id": payment_intent,
                        "amount_paid": price_map.get(pid, 0),
                        "status": "completed",
                    }
                    for pid in product_ids
                ]
                supabase_admin.table("Orders").insert(rows).execute()
                inserted = len(rows)
                logger.info(f"Commandes panier créées via vérification directe: user={user_id}, {inserted} produit(s)")

        return {"completed": inserted > 0, "count": inserted}

    except Exception as e:
        logger.error(f"Erreur vérification statut commande: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

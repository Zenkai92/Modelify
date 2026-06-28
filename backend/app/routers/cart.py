from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.database import supabase
from app.dependencies import get_current_user
from app.services.stripe_service import get_or_create_customer, create_cart_checkout_session
import logging
import os

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
            supabase.table("Orders")
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

        user_data = supabase.table("Users").select("*").eq("id", current_user.id).single().execute()
        if not user_data.data:
            raise HTTPException(status_code=404, detail="Utilisateur introuvable")

        user = user_data.data
        stripe_customer_id = user.get("stripe_customer_id")

        if not stripe_customer_id:
            client_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip() or user.get("email")
            stripe_customer_id = get_or_create_customer(user["email"], client_name, current_user.id)
            supabase.table("Users").update({"stripe_customer_id": stripe_customer_id}).eq("id", current_user.id).execute()

        base_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

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
            supabase.table("Orders")
            .select("product_id")
            .eq("client_id", current_user.id)
            .eq("status", "completed")
            .execute()
        )
        return {"product_ids": [o["product_id"] for o in (result.data or [])]}
    except Exception as e:
        logger.error(f"Erreur récupération des achats: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")


@router.get("/cart/order-status", status_code=status.HTTP_200_OK)
async def get_order_status(session_id: str, current_user=Depends(get_current_user)):
    """Vérifie si une session de paiement panier a bien été enregistrée dans Orders."""
    try:
        result = (
            supabase.table("Orders")
            .select("id")
            .eq("client_id", current_user.id)
            .eq("stripe_session_id", session_id)
            .eq("status", "completed")
            .execute()
        )
        rows = result.data or []
        return {"completed": bool(rows), "count": len(rows)}
    except Exception as e:
        logger.error(f"Erreur vérification statut commande: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

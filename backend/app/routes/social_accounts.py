from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.config import settings
from app.models import get_db
from app.models.brand import BrandSettings
from app.models.social_account import SocialAccount


router = APIRouter(prefix="/social-accounts", tags=["social-accounts"])

META_PLATFORMS = {"facebook", "instagram"}


class SocialAccountRequest(BaseModel):
    brand_id: int
    platform: str
    handle: str
    account_id: str
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    scopes: Optional[str] = None
    is_active: bool = True

    @field_validator("platform")
    @classmethod
    def validate_platform(cls, value):
        platform = value.strip().lower()
        if platform not in META_PLATFORMS:
            raise ValueError("Only facebook and instagram are supported for publishing right now")
        return platform


class SocialAccountUpdateRequest(BaseModel):
    handle: Optional[str] = None
    account_id: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    scopes: Optional[str] = None
    is_active: Optional[bool] = None


def serialize_account(account: SocialAccount) -> dict:
    return {
        "id": account.id,
        "brand_id": account.brand_id,
        "platform": account.platform,
        "handle": account.handle,
        "account_id": account.account_id,
        "token_expires_at": account.token_expires_at,
        "scopes": account.scopes,
        "is_active": account.is_active,
        "last_error": account.last_error,
        "created_at": account.created_at,
        "updated_at": account.updated_at,
        "has_access_token": bool(account.access_token),
    }


def get_brand_or_404(db: Session, brand_id: int) -> BrandSettings:
    brand = db.query(BrandSettings).filter(BrandSettings.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Business not found")
    return brand


@router.get("/")
def list_social_accounts(brand_id: int, db: Session = Depends(get_db)):
    get_brand_or_404(db, brand_id)
    accounts = (
        db.query(SocialAccount)
        .filter(SocialAccount.brand_id == brand_id)
        .order_by(SocialAccount.platform.asc(), SocialAccount.created_at.desc())
        .all()
    )
    return [serialize_account(account) for account in accounts]


@router.post("/")
def create_social_account(request: SocialAccountRequest, db: Session = Depends(get_db)):
    get_brand_or_404(db, request.brand_id)
    existing = (
        db.query(SocialAccount)
        .filter(SocialAccount.brand_id == request.brand_id)
        .filter(SocialAccount.platform == request.platform)
        .first()
    )
     
    if existing:
        for key, value in request.model_dump().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return serialize_account(existing)

    account = SocialAccount(**request.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.put("/{account_id}")
def update_social_account(account_id: int, request: SocialAccountUpdateRequest, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")

    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(account, key, value)

    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.delete("/{account_id}")
def delete_social_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(SocialAccount).filter(SocialAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")

    db.delete(account)
    db.commit()
    return {"message": "Social account disconnected"}


@router.get("/meta/oauth-url")
def get_meta_oauth_url(brand_id: int):
    if not settings.meta_app_id or not settings.meta_redirect_uri:
        raise HTTPException(status_code=400, detail="META_APP_ID and META_REDIRECT_URI are required for OAuth.")

    scopes = [
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list",
        "instagram_basic",
        "instagram_content_publish",
        "business_management",
    ]
    scope = ",".join(scopes)
    return {
        "url": (
            f"https://www.facebook.com/{settings.meta_graph_version}/dialog/oauth"
            f"?client_id={settings.meta_app_id}"
            f"&redirect_uri={settings.meta_redirect_uri}"
            f"&state={brand_id}"
            f"&scope={scope}"
        )
    }

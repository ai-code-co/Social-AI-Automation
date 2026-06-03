from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from app.models import get_db
from app.models.brand import BrandSettings
from app.models.post import Platform, Post

router = APIRouter(tags=["brands"])

ALLOWED_PLATFORMS = {platform.value for platform in Platform}


class BrandSettingsRequest(BaseModel):
    company_name: str
    industry: str = "general"
    tone: str = "professional"
    target_audience: str = "customers, followers, and potential buyers"
    brand_voice: str = "clear, trustworthy, and engaging"
    topics: str = "product updates, educational tips, community stories, offers"
    hashtags: str = "#Business #SocialMedia #Marketing"
    enabled_platforms: str = "instagram,facebook"

    @field_validator("topics")
    @classmethod
    def require_topics(cls, value):
        topics = [topic.strip() for topic in value.split(",") if topic.strip()]
        if not topics:
            raise ValueError("Add at least one default content topic")
        return ", ".join(topics)

    @field_validator("enabled_platforms")
    @classmethod
    def validate_enabled_platforms(cls, value):
        platforms = [platform.strip().lower() for platform in value.split(",") if platform.strip()]
        if not platforms:
            raise ValueError("Choose at least one platform")

        invalid_platforms = [platform for platform in platforms if platform not in ALLOWED_PLATFORMS]
        if invalid_platforms:
            raise ValueError(f"Unsupported platforms: {', '.join(invalid_platforms)}")

        return ",".join(dict.fromkeys(platforms))


@router.get("/brands/")
def list_brands(db: Session = Depends(get_db)):
    return db.query(BrandSettings).order_by(BrandSettings.created_at.desc()).all()


@router.post("/brands/")
def create_brand(request: BrandSettingsRequest, db: Session = Depends(get_db)):
    brand = BrandSettings(**request.model_dump())
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.get("/brands/{brand_id}")
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.query(BrandSettings).filter(BrandSettings.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Business not found")
    return brand


@router.put("/brands/{brand_id}")
def update_brand(brand_id: int, request: BrandSettingsRequest, db: Session = Depends(get_db)):
    brand = db.query(BrandSettings).filter(BrandSettings.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Business not found")

    for key, value in request.model_dump().items():
        setattr(brand, key, value)

    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/brands/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    brand = db.query(BrandSettings).filter(BrandSettings.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Business not found")

    post_count = db.query(Post).filter(Post.brand_id == brand_id).count()
    if post_count:
        raise HTTPException(
            status_code=400,
            detail="This business has posts. Delete or reassign its posts before deleting the business.",
        )

    db.delete(brand)
    db.commit()
    return {"message": f"Business {brand_id} deleted"}


# Backward-compatible routes for the earlier single-brand frontend.
@router.get("/brand/")
def get_first_brand(db: Session = Depends(get_db)):
    brand = db.query(BrandSettings).order_by(BrandSettings.created_at.desc()).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand settings not found")
    return brand


@router.post("/brand/")
def save_first_brand(request: BrandSettingsRequest, db: Session = Depends(get_db)):
    brand = db.query(BrandSettings).order_by(BrandSettings.created_at.desc()).first()
    if not brand:
        brand = BrandSettings(**request.model_dump())
        db.add(brand)
    else:
        for key, value in request.model_dump().items():
            setattr(brand, key, value)

    db.commit()
    db.refresh(brand)
    return brand

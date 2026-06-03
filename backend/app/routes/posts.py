from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import get_db, Platform, Post, PostStatus
from app.models.brand import BrandSettings
from app.services.openai_service import generate_post
from app.tasks.post_tasks import auto_generate_posts

router = APIRouter(prefix="/posts", tags=["posts"])


class GeneratePostRequest(BaseModel):
    platform: str
    topic: Optional[str] = None
    brand_id: Optional[int] = None
    brand_voice: Optional[str] = None
    hashtags: Optional[str] = None


class UpdatePostRequest(BaseModel):
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[PostStatus] = None
    brand_id: Optional[int] = None


def get_brand_or_404(db: Session, brand_id: Optional[int]) -> Optional[BrandSettings]:
    if brand_id is None:
        return None

    brand = db.query(BrandSettings).filter(BrandSettings.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Business not found")
    return brand


def get_default_topic(brand: Optional[BrandSettings]) -> str:
    if not brand:
        return "new offer or useful update for the audience"

    topics = [
        topic.strip()
        for topic in (brand.topics or "").split(",")
        if topic.strip()
    ]
    if not topics:
        raise HTTPException(
            status_code=400,
            detail="Add default content topics to this business before generating without a topic.",
        )

    return topics[datetime.now().timetuple().tm_yday % len(topics)]


def get_enabled_platforms(brand: Optional[BrandSettings]) -> set[str]:
    if not brand:
        return {platform.value for platform in Platform}

    platforms = {
        platform.strip().lower()
        for platform in (brand.enabled_platforms or "").split(",")
        if platform.strip()
    }
    return platforms or {"instagram", "facebook"}


@router.post("/generate")
def generate_and_save_post(request: GeneratePostRequest, db: Session = Depends(get_db)):
    brand = get_brand_or_404(db, request.brand_id)
    brand_voice = request.brand_voice or (brand.brand_voice if brand else "clear, trustworthy, and engaging")
    hashtags = request.hashtags or (brand.hashtags if brand else "#Business #SocialMedia #Marketing")
    topic = request.topic.strip() if request.topic else get_default_topic(brand)
    platform = request.platform.strip().lower()
    enabled_platforms = get_enabled_platforms(brand)

    if platform not in enabled_platforms:
        raise HTTPException(
            status_code=400,
            detail=f"{brand.company_name if brand else 'This business'} is not configured for {platform}.",
        )

    content = generate_post(
        platform=platform,
        topic=topic,
        brand_voice=brand_voice,
        hashtags=hashtags,
        business_name=brand.company_name if brand else "the business",
        industry=brand.industry if brand else "general",
        target_audience=brand.target_audience if brand else "customers and followers",
    )

    post = Post(
        brand_id=request.brand_id,
        platform=platform,
        caption=content["caption"],
        hashtags=content["hashtags"],
        image_prompt=content["image_prompt"],
        status=PostStatus.draft,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.post("/generate-batch")
def trigger_batch_generation(brand_id: Optional[int] = None):
    count = auto_generate_posts(brand_id=brand_id)
    scope = "selected business" if brand_id else "all businesses"
    return {"message": f"Generated {count} posts for {scope}"}


@router.get("/")
def get_all_posts(
    status: Optional[str] = None,
    platform: Optional[str] = None,
    brand_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Post)
    if brand_id is not None:
        query = query.filter(Post.brand_id == brand_id)
    if status:
        query = query.filter(Post.status == status)
    if platform:
        query = query.filter(Post.platform == platform)
    return query.order_by(Post.created_at.desc()).all()


@router.post("/approve-all")
def approve_all_pending(brand_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Post).filter(Post.status == PostStatus.pending_approval)
    if brand_id is not None:
        query = query.filter(Post.brand_id == brand_id)

    posts = query.all()
    if not posts:
        return {"message": "No pending posts to approve"}

    for post in posts:
        post.status = PostStatus.approved

    db.commit()
    return {"message": f"Approved {len(posts)} posts"}


@router.get("/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/{post_id}/approve")
def approve_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.status not in [PostStatus.draft, PostStatus.pending_approval]:
        raise HTTPException(status_code=400, detail=f"Cannot approve a post with status '{post.status}'")
    post.status = PostStatus.approved
    db.commit()
    db.refresh(post)
    return {"message": f"Post {post_id} approved", "post": post}


@router.post("/{post_id}/pause")
def pause_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = PostStatus.paused
    db.commit()
    db.refresh(post)
    return {"message": f"Post {post_id} paused", "post": post}


@router.put("/{post_id}")
def update_post(post_id: int, request: UpdatePostRequest, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if request.brand_id is not None:
        get_brand_or_404(db, request.brand_id)
        post.brand_id = request.brand_id
    if request.caption:
        post.caption = request.caption
    if request.hashtags:
        post.hashtags = request.hashtags
    if request.scheduled_at:
        post.scheduled_at = request.scheduled_at
    if request.status:
        post.status = request.status

    db.commit()
    db.refresh(post)
    return {"message": f"Post {post_id} updated", "post": post}


@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": f"Post {post_id} deleted"}

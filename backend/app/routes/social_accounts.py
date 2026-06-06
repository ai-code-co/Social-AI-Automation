import json
from datetime import datetime, timedelta
from html import escape
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.auth import create_access_token, decode_access_token, get_current_user
from app.config import settings
from app.models import get_db
from app.models.brand import BrandSettings
from app.models.social_account import SocialAccount
from app.models.user import User


router = APIRouter(prefix="/social-accounts", tags=["social-accounts"])

META_PLATFORMS = {"facebook", "instagram"}
META_PLACEHOLDERS = {"", "your_meta_app_id", "your_meta_app_secret"}


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


class MetaConnectPageRequest(BaseModel):
    page_token: str


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


def get_brand_or_404(db: Session, brand_id: int, current_user: User) -> BrandSettings:
    brand = (
        db.query(BrandSettings)
        .filter(BrandSettings.id == brand_id)
        .filter(BrandSettings.user_id == current_user.id)
        .first()
    )
    if not brand:
        raise HTTPException(status_code=404, detail="Business not found")
    return brand


def get_account_or_404(db: Session, account_id: int, current_user: User) -> SocialAccount:
    account = (
        db.query(SocialAccount)
        .join(BrandSettings, SocialAccount.brand_id == BrandSettings.id)
        .filter(SocialAccount.id == account_id)
        .filter(BrandSettings.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found")
    return account


def graph_url(path: str) -> str:
    version = settings.meta_graph_version.strip().lstrip("/")
    return f"https://graph.facebook.com/{version}/{path.lstrip('/')}"


def validate_meta_settings(require_secret: bool = False):
    app_id = (settings.meta_app_id or "").strip()
    app_secret = (settings.meta_app_secret or "").strip()
    redirect_uri = (settings.meta_redirect_uri or "").strip()

    missing = []
    if app_id in META_PLACEHOLDERS:
        missing.append("META_APP_ID")
    if require_secret and app_secret in META_PLACEHOLDERS:
        missing.append("META_APP_SECRET")
    if not redirect_uri or redirect_uri.startswith("http:///"):
        missing.append("META_REDIRECT_URI")

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Meta OAuth is not configured correctly. Update: {', '.join(missing)}.",
        )


def raise_for_meta_error(response: httpx.Response) -> dict:
    try:
        data = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Meta returned a non-JSON response with status {response.status_code}",
        ) from exc

    if response.is_error or "error" in data:
        error = data.get("error", {})
        raise HTTPException(status_code=400, detail=error.get("message") or "Meta request failed")

    return data


def save_meta_account(
    db: Session,
    brand_id: int,
    platform: str,
    handle: str,
    account_id: str,
    access_token: str,
    scopes: str,
    token_expires_at: datetime | None = None,
) -> SocialAccount:
    existing = (
        db.query(SocialAccount)
        .filter(SocialAccount.brand_id == brand_id)
        .filter(SocialAccount.platform == platform)
        .first()
    )
    data = {
        "brand_id": brand_id,
        "platform": platform,
        "handle": handle,
        "account_id": account_id,
        "access_token": access_token,
        "scopes": scopes,
        "token_expires_at": token_expires_at,
        "is_active": True,
        "last_error": None,
    }

    if existing:
        for key, value in data.items():
            setattr(existing, key, value)
        return existing

    account = SocialAccount(**data)
    db.add(account)
    return account


def render_meta_message(title: str, message: str, success: bool = False) -> HTMLResponse:
    color = "#0f766e" if success else "#be123c"
    post_message_type = "meta-connected" if success else "meta-connect-error"
    return HTMLResponse(
        f"""
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{escape(title)}</title>
            <style>
              body {{
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: #f6f7fb;
                color: #0f172a;
              }}
              main {{
                width: min(92vw, 28rem);
                border: 1px solid #e2e8f0;
                border-radius: 0.75rem;
                background: white;
                padding: 1.5rem;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
              }}
              h1 {{ margin: 0 0 0.5rem; font-size: 1.25rem; color: {color}; }}
              p {{ margin: 0; line-height: 1.6; color: #475569; }}
              button {{
                margin-top: 1rem;
                width: 100%;
                min-height: 2.75rem;
                border: 0;
                border-radius: 0.5rem;
                background: #0f172a;
                color: white;
                font-weight: 700;
                cursor: pointer;
              }}
            </style>
          </head>
          <body>
            <main>
              <h1>{escape(title)}</h1>
              <p>{escape(message)}</p>
              <button onclick="window.close()">Close</button>
            </main>
            <script>
              if (window.opener) {{
                window.opener.postMessage({{ type: "{post_message_type}" }}, "*");
              }}
            </script>
          </body>
        </html>
        """
    )


def render_page_picker(pages: list[dict]) -> HTMLResponse:
    page_cards = []
    for page in pages:
        instagram = page.get("instagram")
        instagram_label = (
            f"Instagram: @{escape(instagram.get('username') or instagram.get('name') or instagram.get('id'))}"
            if instagram
            else "No linked Instagram Business account found"
        )
        page_cards.append(
            f"""
            <button class="page-card" type="button" data-token="{escape(page['page_token'])}">
              <span class="page-name">{escape(page['name'])}</span>
              <span class="page-meta">Facebook Page ID: {escape(page['id'])}</span>
              <span class="page-meta">{instagram_label}</span>
            </button>
            """
        )

    return HTMLResponse(
        f"""
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>Choose Meta Page</title>
            <style>
              body {{
                margin: 0;
                min-height: 100vh;
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                background: #f6f7fb;
                color: #0f172a;
              }}
              main {{
                width: min(92vw, 34rem);
                margin: 0 auto;
                padding: 1.25rem 0;
              }}
              .panel {{
                border: 1px solid #e2e8f0;
                border-radius: 0.75rem;
                background: white;
                padding: 1rem;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
              }}
              h1 {{ margin: 0; font-size: 1.25rem; }}
              p {{ margin: 0.4rem 0 1rem; color: #64748b; line-height: 1.5; }}
              .page-card {{
                display: block;
                width: 100%;
                min-height: 5.25rem;
                margin-top: 0.75rem;
                padding: 0.9rem;
                border: 1px solid #cbd5e1;
                border-radius: 0.625rem;
                background: #f8fafc;
                color: #0f172a;
                text-align: left;
                cursor: pointer;
              }}
              .page-card:hover {{ border-color: #14b8a6; background: #f0fdfa; }}
              .page-name {{ display: block; font-weight: 800; }}
              .page-meta {{ display: block; margin-top: 0.35rem; font-size: 0.8125rem; color: #64748b; }}
              .status {{ margin-top: 1rem; min-height: 1.5rem; font-size: 0.875rem; color: #0f766e; }}
            </style>
          </head>
          <body>
            <main>
              <div class="panel">
                <h1>Choose a Facebook Page</h1>
                <p>The selected Page will be connected for publishing. If it has a linked Instagram Business account, that will be connected too.</p>
                {"".join(page_cards)}
                <div class="status" id="status"></div>
              </div>
            </main>
            <script>
              const statusEl = document.getElementById("status");
              document.querySelectorAll(".page-card").forEach((button) => {{
                button.addEventListener("click", async () => {{
                  statusEl.textContent = "Connecting selected Page...";
                  document.querySelectorAll(".page-card").forEach((item) => item.disabled = true);
                  try {{
                    const response = await fetch("/social-accounts/meta/connect-page", {{
                      method: "POST",
                      headers: {{ "Content-Type": "application/json" }},
                      body: JSON.stringify({{ page_token: button.dataset.token }}),
                    }});
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.detail || "Unable to connect Page");
                    statusEl.textContent = data.message || "Connected";
                    if (window.opener) {{
                      window.opener.postMessage({{ type: "meta-connected" }}, "*");
                    }}
                    setTimeout(() => window.close(), 900);
                  }} catch (error) {{
                    statusEl.style.color = "#be123c";
                    statusEl.textContent = error.message;
                    document.querySelectorAll(".page-card").forEach((item) => item.disabled = false);
                  }}
                }});
              }});
            </script>
          </body>
        </html>
        """
    )


@router.get("/")
def list_social_accounts(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_brand_or_404(db, brand_id, current_user)
    accounts = (
        db.query(SocialAccount)
        .filter(SocialAccount.brand_id == brand_id)
        .order_by(SocialAccount.platform.asc(), SocialAccount.created_at.desc())
        .all()
    )
    return [serialize_account(account) for account in accounts]


@router.post("/")
def create_social_account(
    request: SocialAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_brand_or_404(db, request.brand_id, current_user)
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
def update_social_account(
    account_id: int,
    request: SocialAccountUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = get_account_or_404(db, account_id, current_user)

    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(account, key, value)

    db.commit()
    db.refresh(account)
    return serialize_account(account)


@router.delete("/{account_id}")
def delete_social_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = get_account_or_404(db, account_id, current_user)

    db.delete(account)
    db.commit()
    return {"message": "Social account disconnected"}


@router.get("/meta/oauth-url")
def get_meta_oauth_url(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_brand_or_404(db, brand_id, current_user)
    validate_meta_settings()

    state = create_access_token(
        json.dumps({"type": "meta_oauth", "user_id": current_user.id, "brand_id": brand_id}),
        expires_delta=timedelta(minutes=15),
    )
    scopes = [
        "pages_manage_posts",
        "pages_read_engagement",
        "pages_show_list",
        "business_management",
    ]
    if settings.meta_instagram_oauth_enabled:
        scopes.extend(["instagram_basic", "instagram_content_publish"])
    params = urlencode(
        {
            "client_id": settings.meta_app_id,
            "redirect_uri": settings.meta_redirect_uri,
            "state": state,
            "scope": ",".join(scopes),
            "response_type": "code",
        }
    )
    return {
        "url": f"https://www.facebook.com/{settings.meta_graph_version}/dialog/oauth?{params}"
    }


@router.get("/meta/callback", response_class=HTMLResponse)
def meta_oauth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_message: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if error:
        return render_meta_message("Meta connection cancelled", error_message or error)
    if not code or not state:
        return render_meta_message("Meta connection failed", "Meta did not return the required authorization code.")

    state_subject = decode_access_token(state)
    if not state_subject:
        return render_meta_message("Meta connection expired", "Please start the connection again from the Social tab.")

    try:
        state_data = json.loads(state_subject)
    except json.JSONDecodeError:
        return render_meta_message("Meta connection failed", "The Meta connection state is invalid.")

    user_id = state_data.get("user_id")
    brand_id = state_data.get("brand_id")
    if state_data.get("type") != "meta_oauth" or not user_id or not brand_id:
        return render_meta_message("Meta connection failed", "The Meta connection state is invalid.")

    brand = db.query(BrandSettings).filter(BrandSettings.id == brand_id, BrandSettings.user_id == user_id).first()
    if not brand:
        return render_meta_message("Business not found", "This Meta connection does not match an active business.")
    try:
        validate_meta_settings(require_secret=True)
    except HTTPException as exc:
        return render_meta_message("Meta is not configured", str(exc.detail))

    try:
        token_response = httpx.get(
            graph_url("oauth/access_token"),
            params={
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "redirect_uri": settings.meta_redirect_uri,
                "code": code,
            },
            timeout=30,
        )
        token_data = raise_for_meta_error(token_response)
        user_access_token = token_data.get("access_token")
        if not user_access_token:
            return render_meta_message("Meta connection failed", "Meta did not return an access token.")

        long_lived_response = httpx.get(
            graph_url("oauth/access_token"),
            params={
                "grant_type": "fb_exchange_token",
                "client_id": settings.meta_app_id,
                "client_secret": settings.meta_app_secret,
                "fb_exchange_token": user_access_token,
            },
            timeout=30,
        )
        long_lived_data = raise_for_meta_error(long_lived_response)
        user_access_token = long_lived_data.get("access_token") or user_access_token
        expires_in = long_lived_data.get("expires_in")

        page_fields = "id,name,access_token,tasks"
        if settings.meta_instagram_oauth_enabled:
            page_fields = f"{page_fields},instagram_business_account{{id,username,name}}"
        pages_response = httpx.get(
            graph_url("me/accounts"),
            params={
                "fields": page_fields,
                "access_token": user_access_token,
            },
            timeout=30,
        )
        try:
            pages_data = raise_for_meta_error(pages_response)
        except HTTPException:
            if not settings.meta_instagram_oauth_enabled:
                raise
            pages_response = httpx.get(
                graph_url("me/accounts"),
                params={
                    "fields": "id,name,access_token,tasks",
                    "access_token": user_access_token,
                },
                timeout=30,
            )
            pages_data = raise_for_meta_error(pages_response)
    except HTTPException as exc:
        return render_meta_message("Meta connection failed", str(exc.detail))
    except httpx.HTTPError as exc:
        return render_meta_message("Meta connection failed", f"Unable to reach Meta: {exc}")

    token_expires_at = None
    if expires_in:
        token_expires_at = (datetime.utcnow() + timedelta(seconds=int(expires_in))).isoformat()

    pages = []
    for page in pages_data.get("data", []):
        page_access_token = page.get("access_token")
        if not page.get("id") or not page.get("name") or not page_access_token:
            continue

        instagram = page.get("instagram_business_account")
        page_payload = {
            "type": "meta_page",
            "user_id": user_id,
            "brand_id": brand_id,
            "id": page["id"],
            "name": page["name"],
            "access_token": page_access_token,
            "scopes": "pages_manage_posts,pages_read_engagement,pages_show_list",
            "token_expires_at": token_expires_at,
            "instagram": instagram,
        }
        page["page_token"] = create_access_token(
            json.dumps(page_payload),
            expires_delta=timedelta(minutes=15),
        )
        page["instagram"] = instagram
        pages.append(page)

    if not pages:
        return render_meta_message(
            "No Pages found",
            "Meta did not return any Facebook Pages with publishing access for this account.",
        )

    return render_page_picker(pages)


@router.post("/meta/connect-page")
def connect_meta_page(request: MetaConnectPageRequest, db: Session = Depends(get_db)):
    page_subject = decode_access_token(request.page_token)
    if not page_subject:
        raise HTTPException(status_code=401, detail="This Meta page selection has expired. Start again from the Social tab.")

    try:
        page_data = json.loads(page_subject)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid Meta page selection") from exc

    if page_data.get("type") != "meta_page":
        raise HTTPException(status_code=400, detail="Invalid Meta page selection")

    brand_id = page_data["brand_id"]
    user_id = page_data["user_id"]
    brand = db.query(BrandSettings).filter(BrandSettings.id == brand_id, BrandSettings.user_id == user_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Business not found")

    token_expires_at = None
    if page_data.get("token_expires_at"):
        token_expires_at = datetime.fromisoformat(page_data["token_expires_at"])

    save_meta_account(
        db=db,
        brand_id=brand_id,
        platform="facebook",
        handle=page_data["name"],
        account_id=page_data["id"],
        access_token=page_data["access_token"],
        scopes=page_data.get("scopes") or "",
        token_expires_at=token_expires_at,
    )

    instagram = page_data.get("instagram")
    connected = ["Facebook Page"]
    if instagram and instagram.get("id"):
        instagram_handle = instagram.get("username") or instagram.get("name") or instagram["id"]
        save_meta_account(
            db=db,
            brand_id=brand_id,
            platform="instagram",
            handle=f"@{instagram_handle}" if not str(instagram_handle).startswith("@") else instagram_handle,
            account_id=instagram["id"],
            access_token=page_data["access_token"],
            scopes="instagram_basic,instagram_content_publish,pages_show_list",
            token_expires_at=token_expires_at,
        )
        connected.append("Instagram Business account")

    db.commit()
    return {"message": f"Connected {' and '.join(connected)}"}

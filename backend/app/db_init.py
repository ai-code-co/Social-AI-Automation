from sqlalchemy import inspect, text
from app.models.base import Base, engine
from app.models import Post, BrandSettings


def init_db():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)

    if inspector.has_table("posts"):
        columns = {column["name"] for column in inspector.get_columns("posts")}
        if "brand_id" not in columns:
            with engine.begin() as connection:
                connection.execute(text("ALTER TABLE posts ADD COLUMN brand_id INTEGER"))
                connection.execute(text("CREATE INDEX IF NOT EXISTS ix_posts_brand_id ON posts (brand_id)"))

    if inspector.has_table("brand_settings"):
        columns = {column["name"] for column in inspector.get_columns("brand_settings")}
        if "enabled_platforms" not in columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE brand_settings ADD COLUMN enabled_platforms VARCHAR(255) DEFAULT 'instagram,facebook'")
                )

    print("Database tables are ready")


if __name__ == "__main__":
    init_db()

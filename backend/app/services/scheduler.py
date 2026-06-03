from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tasks.post_tasks import auto_generate_posts
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def start_scheduler():
    # Generate posts every day at 8:00 AM
    scheduler.add_job(
        auto_generate_posts,
        trigger=CronTrigger(hour=8, minute=0),
        id="daily_post_generation",
        replace_existing=True,
    )

    # Also run every Monday at 9:00 AM for weekly batch
    scheduler.add_job(
        auto_generate_posts,
        trigger=CronTrigger(day_of_week="mon", hour=9, minute=0),
        id="weekly_post_generation",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("✅ Scheduler started — posts will auto-generate daily at 8AM")

def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")
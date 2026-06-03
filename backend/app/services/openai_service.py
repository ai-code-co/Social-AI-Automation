from openai import OpenAI
from app.config import settings

client = OpenAI(api_key=settings.openai_api_key)

PLATFORM_RULES = {
    "instagram": "Keep it under 150 words. Conversational, visual, emoji-friendly.",
    "facebook": "Keep it under 200 words. Engaging and shareable.",
    "linkedin": "Professional tone, under 250 words. Insight-driven.",
    "twitter": "Under 280 characters. Punchy and direct.",
    "tiktok": "Fun, trendy, under 100 words. Hook in first line.",
    "youtube": "Engaging video description, 150-200 words. Include call to action.",
}

def generate_post(
    platform: str,
    topic: str,
    brand_voice: str,
    hashtags: str,
    business_name: str = "the business",
    industry: str = "general",
    target_audience: str = "customers and followers",
) -> dict:
    platform_rule = PLATFORM_RULES.get(platform, "Keep it concise and professional.")

    prompt = f"""
You are a social media content creator for {business_name}, a business in the {industry} industry.

Brand voice: {brand_voice}
Target audience: {target_audience}
Platform: {platform}
Topic: {topic}
Platform rules: {platform_rule}
Default hashtags to include: {hashtags}

Generate a social media post with:
1. A compelling caption
2. Relevant hashtags (include the default ones)
3. A short image prompt describing the ideal visual for this post

Respond in this exact format:
CAPTION: <caption here>
HASHTAGS: <hashtags here>
IMAGE_PROMPT: <image prompt here>
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )

    raw = response.choices[0].message.content
    result = {"caption": "", "hashtags": "", "image_prompt": ""}

    for line in raw.splitlines():
        if line.startswith("CAPTION:"):
            result["caption"] = line.replace("CAPTION:", "").strip()
        elif line.startswith("HASHTAGS:"):
            result["hashtags"] = line.replace("HASHTAGS:", "").strip()
        elif line.startswith("IMAGE_PROMPT:"):
            result["image_prompt"] = line.replace("IMAGE_PROMPT:", "").strip()

    return result

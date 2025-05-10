# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.models.bias_model import predict_bias
from app.models.fake_model import detect_fake_probability
from app.models.trust_score import get_trust_score

app = FastAPI(
    title="News Analyzer API",
    version="0.2.0",
    description="AI 정치 성향·가짜 뉴스·언론 신뢰도 분석"
)

# ──────────────────────────────────────────────────────────────
# CORS: 크롬 확장에서 백엔드 호출할 때 필요
# ──────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # 프로덕션에선 허용 도메인만 지정
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────
# Pydantic 스키마
# ──────────────────────────────────────────────────────────────
class Article(BaseModel):
    content: str
    source: str

class AnalysisResult(BaseModel):
    bias: str
    fake_probability: float
    trust_score: float
    source: str

# ──────────────────────────────────────────────────────────────
# 라우터
# ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "News Analyzer API is running."}

@app.post("/analyze", response_model=AnalysisResult, tags=["Analyze"])
def analyze(article: Article):
    """
    본문·언론사를 받아 정치 성향 / 가짜 뉴스 확률 / 신뢰도 점수를 반환
    """
    bias          = predict_bias(article.content)
    fake_prob     = detect_fake_probability(article.content)
    trust_score   = get_trust_score(article.source)

    return AnalysisResult(
        bias=bias,
        fake_probability=fake_prob,
        trust_score=trust_score,
        source=article.source
    )
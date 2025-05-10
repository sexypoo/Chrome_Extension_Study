"""
Fake-news detection utilities
-----------------------------

• 모델 : mrm8488/bert-tiny-fake-news-detection  (binary: FAKE / REAL)
• 긴 입력(>512 token) → 512 token씩 슬라이딩 분할 →
   - 다수결(FAKE ≥ REAL)   → 최종 확률 = FAKE chunk 비율
"""

from collections import Counter
from typing import List
from transformers import pipeline

# ─────────────────────────────────────────────────────────────────────────────
# 1. 모델 · 토크나이저 로드
# ─────────────────────────────────────────────────────────────────────────────
fake_detector = pipeline(
    "text-classification",
    model="mrm8488/bert-tiny-finetuned-fake-news-detection",
    tokenizer="mrm8488/bert-tiny-finetuned-fake-news-detection",
    device=-1      # GPU 사용 시 0
)
tokenizer = fake_detector.tokenizer

# ─────────────────────────────────────────────────────────────────────────────
# 2. 내부 헬퍼 : 512 token 이하 청크 단일 예측
# ─────────────────────────────────────────────────────────────────────────────
def _chunk_score(text: str) -> float:
    """
    512 token 이하 텍스트 1개를 예측해 'FAKE' 확률(float) 반환.
    """
    result = fake_detector(
        text,
        truncation=True,
        max_length=512
    )[0]

    label = result["label"]
    score = float(result["score"])
    return score if label in ("FAKE", "LABEL_1", "1") else 1.0 - score

# ─────────────────────────────────────────────────────────────────────────────
# 3. 퍼블릭 API : 긴 기사 슬라이딩-윈도우 예측
# ─────────────────────────────────────────────────────────────────────────────
def detect_fake_probability(text: str, stride: int = 384) -> float:
    """
    긴 기사(fake 여부) 예측 확률 [0.0–1.0].

    Args:
        text   (str) : 기사 원문
        stride (int) : 윈도우 이동 간격 (384이면 128 token 중첩)

    Returns:
        float 0.0 (진짜) ~ 1.0 (가짜)
    """
    try:
        input_ids: List[int] = tokenizer.encode(text, add_special_tokens=False)
        probs: List[float] = []

        # ❶ 512 이하면 바로 예측
        if len(input_ids) <= 512:
            probs.append(_chunk_score(text))
        else:
            # ❷ 512 token 윈도우 분할
            for i in range(0, len(input_ids), stride):
                chunk_ids = input_ids[i : i + 512]
                chunk_txt = tokenizer.decode(chunk_ids)
                probs.append(_chunk_score(chunk_txt))
                if i + 512 >= len(input_ids):
                    break

        # ❸ 최종 확률 = 각 청크 fake 확률 평균
        return round(sum(probs) / len(probs), 3)

    except Exception as exc:
        print("[FakeModel] Detection failed:", exc)
        return 0.5   # 알 수 없을 때 중립값
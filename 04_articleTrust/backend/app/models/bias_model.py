"""
Political bias classification utilities
---------------------------------------

• 모델: matous-volf/political-leaning-politics  (RoBERTa-base, 3-way)
• 토크나이저: launch/POLITICS  (모델 카드 안내대로 별도 경로 사용)
• 입력이 512 token(모델 한계) 초과할 때는  *슬라이딩 윈도우* 방식으로
  512 token씩 잘라 모든 청크를 예측 → 최다 득표 레이블을 반환합니다.
"""

from collections import Counter
from typing import List

from transformers import pipeline

# ──────────────────────────────────────────────────────────────────────────────
# 1. 모델 & 토크나이저 로드 (한 번만 실행)
# ──────────────────────────────────────────────────────────────────────────────
classifier = pipeline(
    "text-classification",
    model="matous-volf/political-leaning-politics",
    tokenizer="launch/POLITICS",
    device=-1  # GPU 사용 시 0
)
tokenizer = classifier.tokenizer  # encode/decode 에 직접 사용

# ──────────────────────────────────────────────────────────────────────────────
# 2. 레이블 매핑
# ──────────────────────────────────────────────────────────────────────────────
label_map = {
    "LABEL_0": "left",  "0": "left",
    "LABEL_1": "center","1": "center",
    "LABEL_2": "right", "2": "right"
}

# ──────────────────────────────────────────────────────────────────────────────
# 3. 내부 헬퍼: 512 token 이하 청크 단일 예측
# ──────────────────────────────────────────────────────────────────────────────
def _predict_chunk(text: str) -> str:
    """
    512 token 이하 텍스트 1개에 대해 모델 예측 레이블 ID를 반환
    """
    result = classifier(
        text,
        truncation=True,        # 512 초과 시 자동 잘라내기(안전장치)
        max_length=512
    )[0]
    return result["label"]


# ──────────────────────────────────────────────────────────────────────────────
# 4. 퍼블릭 API: 긴 기사 다수결 예측
# ──────────────────────────────────────────────────────────────────────────────
def predict_bias(text: str, stride: int = 384) -> str:
    """
    긴 기사(>512 token)를 슬라이딩 윈도우로 분할해 최다 득표 레이블 반환.

    Args:
        text   (str) : 기사 원문
        stride (int) : 창을 옮길 토큰 간격. 384이면 128 token 중첩.

    Returns:
        "left" | "center" | "right" | "unknown"
    """
    try:
        # ❶ 전체 문서를 토큰화(특수토큰 제외) 후 슬라이딩 윈도우 적용
        input_ids: List[int] = tokenizer.encode(text, add_special_tokens=False)
        labels: List[str] = []

        if len(input_ids) <= 512:
            # 짧은 기사는 바로 예측
            labels.append(_predict_chunk(text))
        else:
            # 긴 기사는 512token씩 분할
            for i in range(0, len(input_ids), stride):
                chunk_ids = input_ids[i : i + 512]
                chunk_text = tokenizer.decode(chunk_ids)
                labels.append(_predict_chunk(chunk_text))
                if i + 512 >= len(input_ids):      # 마지막 청크면 종료
                    break

        # ❷ 최다 득표 라벨 → 사람 친화적 문자열 변환
        most_common_id = Counter(labels).most_common(1)[0][0]
        return label_map.get(most_common_id, "unknown")

    except Exception as exc:
        # 예외 발생 시 서버 로그에 남기고 'unknown' 반환
        print("[BiasModel] Prediction failed:", exc)
        return "unknown"
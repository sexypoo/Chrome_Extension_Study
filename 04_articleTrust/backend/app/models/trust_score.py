"""
trust_score.py
--------------

언론사 → 신뢰도 점수를 간단히 매핑하는 유틸리티.
실제 서비스에선 DB나 외부 API로 대체될 수 있습니다.
"""

# 0.0 ~ 5.0  (숫자는 예시)
MEDIA_TRUST = {
    "nytimes.com": 4.5,
    "washingtonpost.com": 4.4,
    "foxnews.com": 2.3,
    "cnn.com": 3.8,
    "bbc.com": 4.6,
    "조선일보": 2.3,
    "한겨레": 4.1,
    "중앙일보": 3.0,
    "경향신문": 4.0,
    "kbs.co.kr": 4.7,
    "mbn.co.kr": 2.2,
}

def _normalize(source: str) -> str:
    """
    'https://www.bbc.com' → 'bbc.com' 으로 단순 정규화
    """
    source = source.lower()
    if source.startswith("http"):
        source = source.split("//", 1)[1]
    if source.startswith("www."):
        source = source[4:]
    return source.split("/")[0]  # 도메인만 남김

def get_trust_score(source: str) -> float:
    """
    언론사 이름(또는 도메인) → 신뢰도 점수 반환.
    미등록 언론사는 3.0(중립값)으로 처리.
    """
    key = _normalize(source)
    return MEDIA_TRUST.get(key, MEDIA_TRUST.get(source, 3.0))
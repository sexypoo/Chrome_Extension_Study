import pytest

@pytest.mark.parametrize(
    "payload",
    [
        {
            "content": "조 바이든 대통령은 오늘 새 법안을 발표하며...",
            "source": "뉴욕타임스"
        },
        {
            "content": "윤석열 대통령은 경제 관련 회의를 주재했다...",
            "source": "조선일보"
        },
    ],
)
def test_analyze_endpoint(client, payload):
    r = client.post("/analyze", json=payload)
    assert r.status_code == 200

    body = r.json()

    # 필수 키 존재 여부
    for key in ("bias", "fake_probability", "trust_score", "source"):
        assert key in body

    # 값 유효성
    assert body["bias"] in {"left", "center", "right", "unknown"}
    assert 0.0 <= body["fake_probability"] <= 1.0
    assert 0.0 <= body["trust_score"] <= 5.0
    assert body["source"] == payload["source"]
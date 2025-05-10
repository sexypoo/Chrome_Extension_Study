# tests/test_models.py
from app import models  # 모듈 트리를 통째로 가져오기
import pytest

bias_model = models.bias_model  # 가독성용 별칭

def test_predict_bias_short_text(monkeypatch):
    # ❶ bias_model 모듈 객체에 직접 패치
    monkeypatch.setattr(bias_model, "predict_bias", lambda _: "left")

    # ❷ 동일 모듈 객체를 통해 호출
    assert bias_model.predict_bias("아무 텍스트") == "left"
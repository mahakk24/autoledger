from app.ml.pipeline.classifier import classify_transaction
from app.ml.pipeline.anomaly import detect_anomaly
from datetime import datetime


def test_classify_aws():
    cat, conf = classify_transaction("AWS Amazon Web Services", "cloud hosting")
    assert cat == "software"
    assert conf > 0.5


def test_classify_salary():
    cat, conf = classify_transaction("Employee Salary payroll", "monthly salary")
    assert cat == "payroll"
    assert conf > 0.4


def test_classify_marketing():
    cat, conf = classify_transaction("Facebook Ads campaign", "marketing spend")
    assert cat == "marketing"


def test_classify_revenue():
    cat, conf = classify_transaction("Client Invoice payment received", "")
    assert cat == "revenue"


def test_anomaly_normal_transaction():
    is_anomaly, score, reason = detect_anomaly(15000, datetime(2024, 6, 12, 11, 30))
    assert isinstance(is_anomaly, bool)
    assert isinstance(score, float)


def test_anomaly_huge_amount():
    is_anomaly, score, reason = detect_anomaly(99_000_000, datetime(2024, 6, 12, 2, 0))
    assert is_anomaly is True
    assert "large amount" in reason or reason != ""


def test_anomaly_weekend():
    # Saturday = weekday 5
    is_anomaly, score, reason = detect_anomaly(500_000, datetime(2024, 6, 15, 3, 0))
    assert is_anomaly is True

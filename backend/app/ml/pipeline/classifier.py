"""
Transaction category classifier.
TF-IDF on merchant name + description, trained on synthetic startup data.
Persists model to disk after first training run.
"""
import pickle
import os
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/classifier.pkl")

# Curated training pairs — (text, category)
TRAINING_DATA = [
    ("AWS Amazon Web Services cloud hosting", "software"),
    ("Google Cloud Platform GCP compute", "software"),
    ("GitHub subscription developer tools", "software"),
    ("Figma design tool subscription", "software"),
    ("Notion workspace productivity", "software"),
    ("Slack communication platform", "software"),
    ("Zoom video conferencing meetings", "software"),
    ("Razorpay payment gateway fees", "software"),
    ("DigitalOcean droplet hosting", "software"),
    ("Stripe payment processing", "software"),
    ("salary payroll employee wages monthly", "payroll"),
    ("employee compensation engineering team", "payroll"),
    ("HR payroll processing salaries", "payroll"),
    ("contractor payment freelance project", "contractor"),
    ("consulting fees professional services", "contractor"),
    ("freelance developer contract work", "contractor"),
    ("Facebook Ads advertising campaign", "marketing"),
    ("Google Ads marketing PPC", "marketing"),
    ("LinkedIn sponsored content promotion", "marketing"),
    ("Instagram ads brand awareness", "marketing"),
    ("office rent lease monthly", "rent"),
    ("coworking space desk rental", "rent"),
    ("WeWork office space", "rent"),
    ("electricity bill power BESCOM", "utilities"),
    ("internet broadband connection ACT", "utilities"),
    ("water bill municipal", "utilities"),
    ("flight booking travel IndiGo", "travel"),
    ("hotel accommodation Oyo MakeMyTrip", "travel"),
    ("Uber Ola cab transport", "travel"),
    ("client payment invoice received", "revenue"),
    ("subscription revenue monthly SaaS", "revenue"),
    ("consulting revenue project delivery", "revenue"),
    ("miscellaneous office supplies expense", "other"),
    ("petty cash reimbursement", "other"),
]


def get_classifier():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return _train()


def _train():
    texts, labels = zip(*TRAINING_DATA)
    # Augment by repeating — gives better TF-IDF stability
    aug_texts = list(texts) * 8
    aug_labels = list(labels) * 8

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, lowercase=True)),
        ("clf", RandomForestClassifier(n_estimators=150, random_state=42)),
    ])
    pipeline.fit(aug_texts, aug_labels)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)
    return pipeline


def classify_transaction(merchant: str, description: str = "") -> tuple[str, float]:
    """Returns (category_name, confidence_0_to_1)."""
    clf = get_classifier()
    text = f"{merchant} {description}".strip()
    proba = clf.predict_proba([text])[0]
    idx = int(np.argmax(proba))
    return clf.classes_[idx], float(proba[idx])

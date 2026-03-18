"""
Improved transaction classifier with explainability.
- 3x more training data covering Indian startup context
- Feature importance explanation for every classification
- Returns top keywords that drove the decision
"""
import pickle
import os
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/classifier_v2.pkl")

TRAINING_DATA = [
    ("AWS Amazon Web Services cloud compute EC2 S3", "software"),
    ("Google Cloud Platform GCP BigQuery", "software"),
    ("Microsoft Azure cloud subscription", "software"),
    ("GitHub repository code hosting", "software"),
    ("GitLab CI CD pipeline", "software"),
    ("Figma design prototyping tool", "software"),
    ("Notion workspace productivity docs", "software"),
    ("Slack team communication messaging", "software"),
    ("Zoom video meeting conferencing", "software"),
    ("Google Workspace Gmail Drive", "software"),
    ("Razorpay payment gateway fees", "software"),
    ("Stripe payment processing", "software"),
    ("Jira project management Atlassian", "software"),
    ("Mixpanel analytics product", "software"),
    ("Intercom customer support chat", "software"),
    ("HubSpot CRM marketing", "software"),
    ("Sentry error monitoring", "software"),
    ("DigitalOcean droplet VPS hosting", "software"),
    ("Cloudflare CDN DNS security", "software"),
    ("Twilio SMS messaging API", "software"),
    ("SendGrid email API transactional", "software"),
    ("DataDog monitoring observability", "software"),
    ("salary payroll monthly employee wages", "payroll"),
    ("employee compensation engineering team", "payroll"),
    ("staff salary payment HR", "payroll"),
    ("payroll processing monthly wages disbursement", "payroll"),
    ("CTC salary credit employee account", "payroll"),
    ("EPF PF contribution employee provident fund", "payroll"),
    ("gratuity payment employee", "payroll"),
    ("contractor payment freelance project", "contractor"),
    ("consulting fees professional services invoice", "contractor"),
    ("freelance developer contract work", "contractor"),
    ("agency fees creative design", "contractor"),
    ("legal fees advocate lawyer", "contractor"),
    ("CA chartered accountant audit fees", "contractor"),
    ("consultant retainer monthly fees", "contractor"),
    ("Facebook Ads advertising campaign social media", "marketing"),
    ("Google Ads PPC search advertising", "marketing"),
    ("LinkedIn sponsored content B2B marketing", "marketing"),
    ("Instagram ads brand awareness promotion", "marketing"),
    ("content marketing blog SEO agency", "marketing"),
    ("PR agency public relations media", "marketing"),
    ("influencer marketing campaign", "marketing"),
    ("email marketing campaign newsletter", "marketing"),
    ("office rent lease monthly Bangalore", "rent"),
    ("coworking space WeWork desk rental", "rent"),
    ("91springboard desk space rent", "rent"),
    ("office premises lease agreement", "rent"),
    ("BESCOM electricity bill power Bangalore", "utilities"),
    ("ACT Broadband internet connection", "utilities"),
    ("Airtel broadband fiber internet", "utilities"),
    ("electricity power bill monthly", "utilities"),
    ("water bill municipal corporation", "utilities"),
    ("IndiGo airlines flight booking", "travel"),
    ("Air India flight ticket", "travel"),
    ("MakeMyTrip hotel booking", "travel"),
    ("OYO hotel accommodation", "travel"),
    ("Uber business cab ride", "travel"),
    ("Ola corporate ride", "travel"),
    ("railway IRCTC train ticket", "travel"),
    ("client invoice payment received", "revenue"),
    ("customer payment subscription monthly", "revenue"),
    ("SaaS revenue monthly recurring MRR", "revenue"),
    ("consulting revenue project delivery", "revenue"),
    ("product sale revenue income", "revenue"),
    ("advance payment client project", "revenue"),
    ("office supplies stationery petty cash", "other"),
    ("team lunch food meal coffee", "other"),
    ("medical reimbursement health", "other"),
    ("bank charges fees processing", "other"),
    ("insurance premium policy", "other"),
]


def get_classifier():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return _train()


def _train():
    texts, labels = zip(*TRAINING_DATA)
    aug_texts = list(texts) * 10
    aug_labels = list(labels) * 10

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 3), min_df=1, lowercase=True,
            sublinear_tf=True, max_features=5000,
        )),
        ("clf", RandomForestClassifier(
            n_estimators=200, max_depth=20, random_state=42, n_jobs=-1,
        )),
    ])
    pipeline.fit(aug_texts, aug_labels)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)
    return pipeline


def classify_transaction(merchant: str, description: str = "") -> tuple[str, float]:
    clf = get_classifier()
    text = f"{merchant} {description}".strip()
    proba = clf.predict_proba([text])[0]
    idx = int(np.argmax(proba))
    return clf.classes_[idx], float(proba[idx])


def explain_classification(merchant: str, description: str = "") -> dict:
    """Returns classification with top keywords that drove the decision."""
    clf = get_classifier()
    text = f"{merchant} {description}".strip()

    tfidf = clf.named_steps["tfidf"]
    forest = clf.named_steps["clf"]

    proba = clf.predict_proba([text])[0]
    idx = int(np.argmax(proba))
    category = clf.classes_[idx]
    confidence = float(proba[idx])

    X = tfidf.transform([text])
    feature_names = tfidf.get_feature_names_out()
    importances = forest.feature_importances_

    non_zero = X.nonzero()[1]
    scored = []
    for fi in non_zero:
        if fi < len(importances):
            scored.append((feature_names[fi], float(importances[fi])))

    scored.sort(key=lambda x: x[1], reverse=True)
    top_keywords = [kw for kw, _ in scored[:5] if kw.strip()]

    all_probs = {
        clf.classes_[i]: round(float(proba[i]) * 100, 1)
        for i in range(len(clf.classes_))
    }

    return {
        "category": category,
        "confidence": round(confidence * 100, 1),
        "top_keywords": top_keywords,
        "all_probabilities": dict(sorted(all_probs.items(), key=lambda x: x[1], reverse=True)),
        "explanation": f"Classified as '{category}' ({confidence*100:.0f}% confidence) based on: {', '.join(top_keywords[:3]) if top_keywords else merchant}",
    }

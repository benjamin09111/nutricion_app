---
name: machine-learning-engineering
description: General Machine Learning Engineering practices. Covers model lifecycle, feature engineering, evaluation metrics, and deployment (MLOps).
---

# Machine Learning Engineering Standards

This skill covers the end-to-end lifecycle of building and deploying ML models, from simple regressions to complex neural networks.

## 1. Problem Framing

- **Supervised vs Unsupervised**: Do we have labeled data (e.g., patient outcomes)?
- **Regression vs Classification**: Are we predicting a number (blood sugar level) or a category (Risk: High/Low)?
- **Baseline**: Always establish a dump heuristic baseline (e.g., "Predict the average") before training a model. If your model doesn't beat the average, it's useless.

## 2. Data Engineering (Feature Store)

- **Garbage In, Garbage Out**: 80% of ML is data cleaning.
- **Normalization**: Scale inputs (0-1 or -1 to 1). Neural networks fail with unscaled data.
- **Categorical Encoding**: One-Hot Encoding vs Embeddings.
- **Splitting**: STRICT separation of Train / Validation / Test sets to avoid data leakage.

## 3. Model Selection Strategy

- **Tabular Data** (Excel, SQL): XGBoost / LightGBM / CatBoost usually beat Deep Learning.
- **Unstructured Data** (Images, Text): Deep Learning (Transformers, CNNs).
- **Start Simple**: Logistic Regression -> Random Forest -> Gradient Boosting -> Neural Net. Don't jump to Deep Learning immediately.

## 4. MLOps (Deployment)

- **Model format**: ONNX is the universal standard for portability.
- **Serving**:
  - *Realtime*: API (FastAPI) wrapping the `model.predict()`.
  - *Batch*: Nightly jobs processing thousands of rows.
- **Drift Monitoring**: Models rot. Monitor the input distribution. If inputs change (e.g., "Patient age range changed"), retrain.

## 5. Evaluation Metrics

- **Accuracy is misleading** (especially in imbalanced medical data).
- Use **Precision** (False Positives matter?) vs **Recall** (False Negatives matter?).
- For medical screening, Recall usually wins (better to have a false alarm than miss a diagnosis).

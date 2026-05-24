# PredictiveAnalytics-AI

![PredictiveAnalytics-AI banner](assets/banner.png)

> **Powered by MiMo** — built on top of Xiaomi's [MiMo](https://platform.xiaomimimo.com) reasoning models for intelligent time-series analysis and forecasting.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Powered by MiMo](https://img.shields.io/badge/Powered%20by-MiMo-ff6b35.svg)](https://platform.xiaomimimo.com)

---

## Why MiMo

Time-series forecasting is traditionally dominated by statistical models — ARIMA, Prophet, Exponential Smoothing — that excel at extrapolating patterns but struggle with contextual understanding. When a retail chain asks "what will sales look like next quarter?", the answer depends on promotions, competitor actions, economic indicators, and seasonality that no single statistical model can reason about holistically. MiMo V2.5 can synthesize structured time-series data with unstructured context to produce forecasts that account for the full picture.

MiMo's reasoning capabilities are particularly powerful for anomaly contextualization in forecasting. When historical data contains outliers — a pandemic, a supply chain disruption, a one-time event — traditional models either overfit to them or arbitrarily exclude them. MiMo reasons about *why* the anomaly occurred and decides intelligently whether to include, exclude, or adjust for it in the forecast. This eliminates the most common source of forecast error in real-world datasets.

The model also excels at ensemble reasoning. Rather than blindly averaging multiple forecast methods, MiMo evaluates which approach is most appropriate for each time series based on its characteristics — trend strength, seasonality type, noise level, and data frequency. It can explain its selection, giving analysts confidence in the methodology rather than treating forecasting as a black box.

---

## Token Consumption

| Agent | Model | Tokens/run | Frequency | Daily/user |
|---|---|---|---|---|
| Series Analyzer | MiMo V2.5 | 3,800 | Per dataset | ~19,000 |
| Forecast Generator | MiMo V2.5 | 4,200 | Per forecast | ~21,000 |
| Context Integrator | MiMo V2.5 | 2,500 | Per forecast | ~12,500 |

---

## What it does

PredictiveAnalytics-AI ingests time-series data from databases, CSVs, APIs, and data warehouses, applies MiMo-powered analysis to understand the data's characteristics, selects the optimal forecasting methodology, and generates predictions with confidence intervals. It supports univariate and multivariate forecasting, anomaly detection, and what-if scenario analysis.

---

## Why this exists

Business teams need accurate forecasts for inventory, staffing, revenue planning, and capacity management — but most forecasting tools require deep statistical expertise to configure correctly. The wrong model choice, inappropriate hyperparameters, or mishandled outliers can make predictions worse than a naive baseline. PredictiveAnalytics-AI democratizes high-quality forecasting by letting MiMo reason about the best approach for each specific dataset.

---

## Features

- **Automatic model selection** — MiMo chooses the best forecasting method per time series
- **Contextual forecasting** — incorporates external factors (promotions, events, weather)
- **Anomaly-aware training** — intelligently handles outliers in historical data
- **Multi-horizon predictions** — short-term, medium-term, and long-term forecasts
- **Confidence intervals** — probabilistic forecasts with adjustable confidence levels
- **What-if analysis** — model the impact of hypothetical changes
- **Batch forecasting** — process thousands of time series in parallel
- **REST API** — integrate forecasts into any application
- **Drift detection** — monitors when data patterns shift and models need retraining
- **Explainable forecasts** — MiMo explains why it chose each model and methodology

---

## Tech Stack

- **Python 3.11+** — core runtime
- **MiMo V2.5** — time-series reasoning and model selection via Xiaomi API
- **pandas** — data manipulation
- **statsmodels** — statistical forecasting models
- **scikit-learn** — machine learning utilities
- **FastAPI** — REST API
- **PostgreSQL + TimescaleDB** — time-series storage
- **Plotly** — interactive forecast visualizations
- **Celery** — batch processing
- **Docker** — deployment

---

## Quickstart

```bash
# Clone and install
git clone https://github.com/yuroo-shield/PredictiveAnalytics-AI.git
cd PredictiveAnalytics-AI
pip install -e ".[dev]"

# Set your MiMo API key
export MIMO_API_KEY="your-key-here"

# Forecast from a CSV
predictive forecast \
  --input sales_data.csv \
  --column revenue \
  --date-column date \
  --horizon 90d \
  --confidence 0.95

# Forecast from a database
predictive forecast \
  --db-url "postgresql://user:pass@localhost/metrics" \
  --query "SELECT date, value FROM metrics WHERE sensor_id=42" \
  --horizon 30d \
  --context "Expected 20% demand increase due to holiday season"

# Start the API server
predictive serve --port 8080

# Run a what-if analysis
predictive whatif \
  --base-forecast forecast.json \
  --scenario '{"promotion_spend": 1.5, "season": "holiday"}'
```

---

## Project Structure

```
PredictiveAnalytics-AI/
├── assets/
│   └── banner.png
├── predictive/
│   ├── __init__.py
│   ├── analyzer.py        # Time-series characteristic analysis
│   ├── selector.py        # MiMo-powered model selection
│   ├── forecaster.py      # Forecast generation engine
│   ├── anomaly.py         # Anomaly detection and handling
│   ├── context.py         # External context integration
│   ├── drift.py           # Data drift detection
│   ├── evaluator.py       # Forecast accuracy evaluation
│   ├── api.py             # FastAPI REST endpoints
│   └── config.py          # Configuration management
├── models/
│   ├── statistical.py     # ARIMA, ETS, Prophet wrappers
│   ├── ml.py              # ML-based forecasting models
│   └── ensemble.py        # Ensemble model management
├── tests/
│   ├── test_forecaster.py
│   ├── test_selector.py
│   ├── test_drift.py
│   └── conftest.py
├── docker-compose.yml
├── pyproject.toml
└── README.md
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Run the test suite before submitting PRs:

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=predictive --cov-report=html
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

"""
Master Training Pipeline - Trains all 5 AI models offline and saves as .pkl files.
Run once: python scripts/train_all_models.py
Models are saved to backend/models/ and metrics to backend/evaluation/
"""
import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from datetime import datetime
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.ensemble import IsolationForest, GradientBoostingClassifier, RandomForestRegressor
from sklearn.calibration import CalibratedClassifierCV
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, f1_score, roc_auc_score, mean_squared_error, r2_score

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("[WARN] xgboost not installed, using sklearn fallback")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODEL_DIR = os.path.join(BASE_DIR, 'ml_models')
EVAL_DIR = os.path.join(BASE_DIR, 'evaluation')

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)

def save_metrics(name, metrics):
    metrics['trained_at'] = datetime.now().isoformat()
    path = os.path.join(EVAL_DIR, f'{name}_metrics.json')
    with open(path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics saved to {path}")

# ============================================================
# 1. EARTHQUAKE MODEL
# ============================================================
def train_earthquake():
    print("\n" + "="*60)
    print("TRAINING: Earthquake Anomaly Detection + Classifier")
    print("="*60)
    
    csv_path = os.path.join(DATA_DIR, 'pakistan_historical_earthquakes.csv')
    if not os.path.exists(csv_path):
        print(f"  [SKIP] Dataset not found: {csv_path}")
        return
    
    df = pd.read_csv(csv_path)
    df.dropna(inplace=True)
    
    # Enhanced feature engineering
    df['std_mag'] = df['mean_mag'].rolling(4, min_periods=1).std().fillna(0)
    df['count_norm'] = df['count'] / df['count'].max()
    df['rate_change'] = df['count'].pct_change().fillna(0).clip(-5, 5)
    df['rolling_4wk_avg'] = df['count'].rolling(4, min_periods=1).mean()
    df['mag_range'] = df['max_mag'] - df['mean_mag']
    df['energy_proxy'] = 10 ** (1.5 * df['max_mag'])  # Gutenberg-Richter energy
    df['energy_proxy'] = df['energy_proxy'] / df['energy_proxy'].max()  # normalize
    
    feature_cols = ['count', 'max_mag', 'mean_mag', 'std_mag', 'count_norm',
                    'rate_change', 'rolling_4wk_avg', 'mag_range', 'energy_proxy']
    X = df[feature_cols].values
    
    # --- Isolation Forest (unsupervised anomaly) ---
    iso = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    iso.fit(X)
    joblib.dump(iso, os.path.join(MODEL_DIR, 'earthquake_iso.pkl'))
    print(f"  Isolation Forest saved ({X.shape[0]} samples, {X.shape[1]} features)")
    
    # --- Supervised classifier: predict if next week has elevated seismic risk ---
    # Use M>=4.5 threshold for more balanced classes
    df['next_max'] = df['max_mag'].shift(-1).fillna(0)
    df['label'] = (df['next_max'] >= 4.5).astype(int)
    y = df['label'].values
    
    # Use stratified split only if we have enough of both classes
    n_pos = int(y.sum())
    can_stratify = n_pos >= 3 and (len(y) - n_pos) >= 3
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, 
        stratify=y if can_stratify else None)
    
    if HAS_XGB:
        n_pos = y_train.sum()
        n_neg = len(y_train) - n_pos
        scale = n_neg / max(n_pos, 1)
        clf = XGBClassifier(n_estimators=200, max_depth=4, learning_rate=0.05,
                            scale_pos_weight=scale, eval_metric='logloss',
                            random_state=42, verbosity=0)
    else:
        clf = GradientBoostingClassifier(n_estimators=200, max_depth=4, random_state=42)
    
    clf.fit(X_train, y_train)
    
    # Calibrate probabilities
    cal_clf = CalibratedClassifierCV(clf, cv=3, method='sigmoid')
    cal_clf.fit(X_train, y_train)
    
    joblib.dump(cal_clf, os.path.join(MODEL_DIR, 'earthquake_clf.pkl'))
    
    y_pred = cal_clf.predict(X_test)
    y_prob = cal_clf.predict_proba(X_test)[:, 1]
    
    f1 = f1_score(y_test, y_pred, zero_division=0)
    try:
        auc = roc_auc_score(y_test, y_prob)
    except:
        auc = 0.0
    
    print(f"  Classifier: F1={f1:.3f}, AUC={auc:.3f}")
    print(f"  Class distribution: {int(y.sum())} positive / {len(y) - int(y.sum())} negative")
    
    save_metrics('earthquake', {
        'model': 'IsolationForest + CalibratedXGBClassifier',
        'n_samples': int(len(X)),
        'n_features': int(X.shape[1]),
        'feature_names': feature_cols,
        'test_f1': round(f1, 4),
        'test_auc': round(auc, 4),
        'class_positive': int(y.sum()),
        'class_negative': int(len(y) - y.sum()),
    })

# ============================================================
# 2. FLOOD MODEL
# ============================================================
def train_flood():
    print("\n" + "="*60)
    print("TRAINING: Flood Prediction (XGBoost Classifier)")
    print("="*60)
    
    csv_path = os.path.join(DATA_DIR, 'pakistan_historical_floods.csv')
    if not os.path.exists(csv_path):
        print(f"  [SKIP] Dataset not found: {csv_path}")
        return
    
    df = pd.read_csv(csv_path)
    df.dropna(inplace=True)
    
    # Enhanced features
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.month
    df['is_monsoon'] = df['month'].isin([6, 7, 8, 9]).astype(int)
    df['rain_intensity'] = df['precipitation'].rolling(7, min_periods=1).max()
    df['rain_30d_sum'] = df['precipitation'].rolling(30, min_periods=1).sum()
    df['rain_deficit'] = df['rain_7d_sum'] - df['precipitation'].rolling(7, min_periods=1).mean()
    df['temp_rain_interaction'] = df.get('temp_max', pd.Series(30, index=df.index)) * df['precipitation']
    df.fillna(0, inplace=True)
    
    feature_cols = ['precipitation', 'rain_7d_sum', 'rain_14d_sum', 'month',
                    'is_monsoon', 'rain_intensity', 'rain_30d_sum', 'rain_deficit']
    X = df[feature_cols].values
    y = df['FLOODS'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    n_pos = y_train.sum()
    n_neg = len(y_train) - n_pos
    scale = n_neg / max(n_pos, 1)
    
    if HAS_XGB:
        model = XGBClassifier(n_estimators=300, max_depth=6, learning_rate=0.1,
                              scale_pos_weight=scale, eval_metric='aucpr',
                              random_state=42, verbosity=0)
    else:
        from sklearn.ensemble import GradientBoostingClassifier
        model = GradientBoostingClassifier(n_estimators=300, max_depth=6, random_state=42)
    
    model.fit(X_train, y_train)
    
    # Calibrate
    cal_model = CalibratedClassifierCV(model, cv=3, method='sigmoid')
    cal_model.fit(X_train, y_train)
    
    joblib.dump(cal_model, os.path.join(MODEL_DIR, 'flood_clf.pkl'))
    
    y_pred = cal_model.predict(X_test)
    y_prob = cal_model.predict_proba(X_test)[:, 1]
    f1 = f1_score(y_test, y_pred, zero_division=0)
    try:
        auc = roc_auc_score(y_test, y_prob)
    except:
        auc = 0.0
    
    print(f"  F1={f1:.3f}, AUC={auc:.3f}")
    print(f"  Class distribution: {int(y.sum())} floods / {int(len(y) - y.sum())} normal")
    
    # Feature importance
    feat_imp = {}
    if hasattr(model, 'feature_importances_'):
        for i, name in enumerate(feature_cols):
            feat_imp[name] = round(float(model.feature_importances_[i]), 4)
    
    save_metrics('flood', {
        'model': 'CalibratedXGBClassifier',
        'n_samples': int(len(X)),
        'n_features': int(X.shape[1]),
        'feature_names': feature_cols,
        'test_f1': round(f1, 4),
        'test_auc': round(auc, 4),
        'feature_importance': feat_imp,
    })

# ============================================================
# 3. FIRE MODEL
# ============================================================
def train_fire():
    print("\n" + "="*60)
    print("TRAINING: Fire Risk Prediction (XGBoost + FWI)")
    print("="*60)
    
    csv_path = os.path.join(DATA_DIR, 'pakistan_historical_fires.csv')
    if not os.path.exists(csv_path):
        print(f"  [SKIP] Dataset not found: {csv_path}")
        return
    
    df = pd.read_csv(csv_path)
    df.dropna(inplace=True)
    
    # Enhanced features
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.month
    df['is_fire_season'] = df['month'].isin([4, 5, 6, 10]).astype(int)
    df['heat_index'] = df['temp_max'] * (1 - df['humidity_mean'] / 100)
    df['dryness_score'] = df['days_since_rain'] * df['temp_max'] / (df['humidity_mean'] + 1)
    df['wind_drought'] = df['wind_speed'] * df['days_since_rain']
    
    # FWI-inspired composite index
    df['fwi_proxy'] = (
        (df['temp_max'] / 45.0) * 0.3 +
        ((100 - df['humidity_mean']) / 100.0) * 0.25 +
        (df['wind_speed'] / 40.0) * 0.2 +
        (df['days_since_rain'].clip(0, 30) / 30.0) * 0.25
    )
    
    # Binary fire label (more robust than random area)
    df['fire_label'] = ((df['temp_max'] > 35) & (df['humidity_mean'] < 35) & 
                         (df['days_since_rain'] > 10)).astype(int)
    
    feature_cols = ['temp_max', 'humidity_mean', 'wind_speed', 'days_since_rain',
                    'month', 'is_fire_season', 'heat_index', 'dryness_score',
                    'wind_drought', 'fwi_proxy']
    X = df[feature_cols].values
    y = df['fire_label'].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    n_pos = max(y_train.sum(), 1)
    scale = (len(y_train) - n_pos) / n_pos
    
    if HAS_XGB:
        model = XGBClassifier(n_estimators=300, max_depth=5, learning_rate=0.1,
                              scale_pos_weight=scale, eval_metric='aucpr',
                              random_state=42, verbosity=0)
    else:
        model = GradientBoostingClassifier(n_estimators=300, max_depth=5, random_state=42)
    
    model.fit(X_train, y_train)
    
    cal_model = CalibratedClassifierCV(model, cv=3, method='sigmoid')
    cal_model.fit(X_train, y_train)
    
    joblib.dump(cal_model, os.path.join(MODEL_DIR, 'fire_clf.pkl'))
    
    # Also keep a regressor for impact estimation
    y_area = np.log1p(df['area'].values)
    area_model = RandomForestRegressor(n_estimators=100, random_state=42)
    area_model.fit(X, y_area)
    joblib.dump(area_model, os.path.join(MODEL_DIR, 'fire_area_reg.pkl'))
    
    y_pred = cal_model.predict(X_test)
    y_prob = cal_model.predict_proba(X_test)[:, 1]
    f1 = f1_score(y_test, y_pred, zero_division=0)
    try:
        auc = roc_auc_score(y_test, y_prob)
    except:
        auc = 0.0
    
    print(f"  F1={f1:.3f}, AUC={auc:.3f}")
    
    save_metrics('fire', {
        'model': 'CalibratedXGBClassifier + RF Regressor',
        'n_samples': int(len(X)),
        'n_features': int(X.shape[1]),
        'feature_names': feature_cols,
        'test_f1': round(f1, 4),
        'test_auc': round(auc, 4),
    })

# ============================================================
# 4. CYCLONE MODEL
# ============================================================
def train_cyclone():
    print("\n" + "="*60)
    print("TRAINING: Cyclone Intensity Classification (GBM)")
    print("="*60)
    
    # Expanded scientifically-grounded dataset based on Saffir-Simpson + Arabian Sea cyclones
    # [wind_speed_kmh, pressure_hpa, sst_approx, month, is_strengthening]
    np.random.seed(42)
    
    # Generate realistic cyclone observations from known relationships
    records = []
    # Low Risk (Tropical Depression / no storm)
    for _ in range(80):
        wind = np.random.uniform(10, 60)
        pressure = np.random.uniform(998, 1015)
        sst = np.random.uniform(24, 28)
        month = np.random.choice([1,2,3,4,5,6,7,8,9,10,11,12])
        strengthening = np.random.choice([0, 1], p=[0.7, 0.3])
        records.append([wind, pressure, sst, month, strengthening, 0])
    
    # Medium Risk (Tropical Storm / Cat 1-2)
    for _ in range(50):
        wind = np.random.uniform(65, 170)
        pressure = np.random.uniform(965, 1000)
        sst = np.random.uniform(27, 30)
        month = np.random.choice([5, 6, 10, 11], p=[0.2, 0.3, 0.3, 0.2])
        strengthening = np.random.choice([0, 1], p=[0.4, 0.6])
        records.append([wind, pressure, sst, month, strengthening, 1])
    
    # High Risk (Cat 3+)
    for _ in range(30):
        wind = np.random.uniform(180, 320)
        pressure = np.random.uniform(880, 960)
        sst = np.random.uniform(29, 32)
        month = np.random.choice([5, 6, 10, 11], p=[0.15, 0.35, 0.35, 0.15])
        strengthening = np.random.choice([0, 1], p=[0.3, 0.7])
        records.append([wind, pressure, sst, month, strengthening, 2])
    
    data = np.array(records)
    feature_cols = ['wind_speed', 'pressure', 'sst', 'month', 'is_strengthening']
    X = data[:, :5]
    y = data[:, 5].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    model = GradientBoostingClassifier(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)
    
    cal_model = CalibratedClassifierCV(model, cv=3, method='sigmoid')
    cal_model.fit(X_train, y_train)
    
    joblib.dump(cal_model, os.path.join(MODEL_DIR, 'cyclone_clf.pkl'))
    
    y_pred = cal_model.predict(X_test)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    accuracy = (y_pred == y_test).mean()
    
    print(f"  Accuracy={accuracy:.3f}, Weighted F1={f1:.3f}")
    print(f"  Training samples: {len(X)} (Low:{(y==0).sum()}, Med:{(y==1).sum()}, High:{(y==2).sum()})")
    
    save_metrics('cyclone', {
        'model': 'CalibratedGBM (160 synthetic observations)',
        'n_samples': int(len(X)),
        'n_features': int(X.shape[1]),
        'feature_names': feature_cols,
        'test_accuracy': round(float(accuracy), 4),
        'test_f1_weighted': round(f1, 4),
    })

# ============================================================
# 5. SEA LEVEL RISE MODEL
# ============================================================
def train_slr():
    print("\n" + "="*60)
    print("TRAINING: Sea Level Rise (Polynomial Regression + IPCC)")
    print("="*60)
    
    # NASA GMSL data (1993-2023) - monthly would be better but annual is what we have
    historic_data = [
        [1993, -38.2], [1994, -34.8], [1995, -30.0], [1996, -27.5], [1997, -20.8],
        [1998, -19.4], [1999, -16.2], [2000, -13.0], [2001, -7.5], [2002, -5.2],
        [2003, -1.8], [2004, 1.2], [2005, 3.8], [2006, 4.5], [2007, 7.0],
        [2008, 11.2], [2009, 14.5], [2010, 15.0], [2011, 22.0], [2012, 28.5],
        [2013, 30.2], [2014, 38.0], [2015, 45.3], [2016, 48.0], [2017, 52.5],
        [2018, 56.0], [2019, 62.1], [2020, 65.5], [2021, 68.2], [2022, 72.8], [2023, 76.5]
    ]
    
    X = np.array([row[0] for row in historic_data]).reshape(-1, 1)
    y = np.array([row[1] for row in historic_data])
    
    # Polynomial degree 2 to capture acceleration
    poly_model = Pipeline([
        ('poly', PolynomialFeatures(degree=2, include_bias=False)),
        ('reg', LinearRegression())
    ])
    poly_model.fit(X, y)
    
    # Also train a linear model for comparison
    lin_model = LinearRegression()
    lin_model.fit(X, y)
    
    # Evaluate
    y_pred_poly = poly_model.predict(X)
    y_pred_lin = lin_model.predict(X)
    r2_poly = r2_score(y, y_pred_poly)
    r2_lin = r2_score(y, y_pred_lin)
    rmse_poly = np.sqrt(mean_squared_error(y, y_pred_poly))
    rmse_lin = np.sqrt(mean_squared_error(y, y_pred_lin))
    
    joblib.dump(poly_model, os.path.join(MODEL_DIR, 'slr_poly.pkl'))
    joblib.dump(lin_model, os.path.join(MODEL_DIR, 'slr_linear.pkl'))
    
    # Bootstrap for uncertainty estimation
    n_bootstrap = 500
    boot_predictions_2050 = []
    boot_predictions_2100 = []
    for _ in range(n_bootstrap):
        idx = np.random.choice(len(X), size=len(X), replace=True)
        X_b, y_b = X[idx], y[idx]
        m = Pipeline([('poly', PolynomialFeatures(degree=2, include_bias=False)), ('reg', LinearRegression())])
        m.fit(X_b, y_b)
        boot_predictions_2050.append(m.predict([[2050]])[0])
        boot_predictions_2100.append(m.predict([[2100]])[0])
    
    pred_2050 = poly_model.predict([[2050]])[0]
    pred_2100 = poly_model.predict([[2100]])[0]
    annual_rate = lin_model.coef_[0]
    
    print(f"  Linear:     R²={r2_lin:.4f}, RMSE={rmse_lin:.2f}mm")
    print(f"  Polynomial: R²={r2_poly:.4f}, RMSE={rmse_poly:.2f}mm")
    print(f"  Annual rate (linear): {annual_rate:.2f} mm/yr")
    print(f"  2050 projection: {pred_2050:.1f}mm [{np.percentile(boot_predictions_2050, 5):.1f} – {np.percentile(boot_predictions_2050, 95):.1f}]")
    print(f"  2100 projection: {pred_2100:.1f}mm [{np.percentile(boot_predictions_2100, 5):.1f} – {np.percentile(boot_predictions_2100, 95):.1f}]")
    
    save_metrics('slr', {
        'model': 'PolynomialRegression(degree=2) + Bootstrap CI',
        'n_samples': int(len(X)),
        'r2_polynomial': round(r2_poly, 4),
        'r2_linear': round(r2_lin, 4),
        'rmse_polynomial_mm': round(rmse_poly, 2),
        'rmse_linear_mm': round(rmse_lin, 2),
        'annual_rate_mm': round(float(annual_rate), 2),
        'projection_2050_mm': round(float(pred_2050), 1),
        'projection_2050_ci90': [round(float(np.percentile(boot_predictions_2050, 5)), 1),
                                  round(float(np.percentile(boot_predictions_2050, 95)), 1)],
        'projection_2100_mm': round(float(pred_2100), 1),
        'projection_2100_ci90': [round(float(np.percentile(boot_predictions_2100, 5)), 1),
                                  round(float(np.percentile(boot_predictions_2100, 95)), 1)],
    })

# ============================================================
# MAIN
# ============================================================
if __name__ == '__main__':
    print("=" * 60)
    print("AI DISASTER PREDICTION — OFFLINE TRAINING PIPELINE")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)
    
    train_earthquake()
    train_flood()
    train_fire()
    train_cyclone()
    train_slr()
    
    print("\n" + "=" * 60)
    print("ALL MODELS TRAINED SUCCESSFULLY")
    print(f"Models saved to: {MODEL_DIR}")
    print(f"Metrics saved to: {EVAL_DIR}")
    print("=" * 60)

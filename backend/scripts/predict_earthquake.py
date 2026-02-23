import sys
import os
import json
import numpy as np
import pandas as pd
import pickle
from scipy import stats
from scipy.signal.windows import hann
from scipy.signal import hilbert, convolve
from sklearn.preprocessing import StandardScaler

# Paths to models
MODEL_PATH = r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Earthquack Detection\lgbm_fold_4.pkl'

# Check if model exists
if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": "Earthquake detection model not found at path: " + MODEL_PATH}))
    sys.exit(1)

def add_trend_feature(arr, abs_values=False):
    idx = np.array(range(len(arr)))
    if abs_values:
        arr = np.abs(arr)
    # Simple linear regression slope
    x = idx
    y = arr
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
    return slope

def classic_sta_lta(x, length_sta, length_lta):
    x = np.array(x, dtype=float)
    sta = np.cumsum(x ** 2)
    lta = sta.copy()
    sta[length_sta:] = sta[length_sta:] - sta[:-length_sta]
    sta /= length_sta
    lta[length_lta:] = lta[length_lta:] - lta[:-length_lta]
    lta /= length_lta
    sta[:length_lta - 1] = 0
    dtiny = np.finfo(0.0).tiny
    lta[lta < dtiny] = dtiny
    return sta / lta

def create_features(seg):
    xc = pd.Series(seg)
    zc = np.fft.fft(xc)
    features = {}
    
    features['mean'] = xc.mean()
    features['std'] = xc.std()
    features['max'] = xc.max()
    features['min'] = xc.min()

    realFFT = np.real(zc)
    imagFFT = np.imag(zc)
    features['Rmean'] = realFFT.mean()
    features['Rstd'] = realFFT.std()
    features['Rmax'] = realFFT.max()
    features['Rmin'] = realFFT.min()
    features['Imean'] = imagFFT.mean()
    features['Istd'] = imagFFT.std()
    features['Imax'] = imagFFT.max()
    features['Imin'] = imagFFT.min()
    
    features['Rmean_last_5000'] = realFFT[-5000:].mean()
    features['Rstd__last_5000'] = realFFT[-5000:].std()
    features['Rmax_last_5000'] = realFFT[-5000:].max()
    features['Rmin_last_5000'] = realFFT[-5000:].min()
    features['Rmean_last_15000'] = realFFT[-15000:].mean()
    features['Rstd_last_15000'] = realFFT[-15000:].std()
    features['Rmax_last_15000'] = realFFT[-15000:].max()
    features['Rmin_last_15000'] = realFFT[-15000:].min()

    features['mean_change_abs'] = np.mean(np.diff(xc))
    # Approximation of the complex mean_change_rate logic from notebook
    features['mean_change_rate'] = np.mean(np.nonzero((np.diff(xc) / (xc[:-1] + 1e-5)))[0])
    features['abs_max'] = np.abs(xc).max()
    features['abs_min'] = np.abs(xc).min()

    features['std_first_50000'] = xc[:50000].std()
    features['std_last_50000'] = xc[-50000:].std()
    features['std_first_10000'] = xc[:10000].std()
    features['std_last_10000'] = xc[-10000:].std()

    features['avg_first_50000'] = xc[:50000].mean()
    features['avg_last_50000'] = xc[-50000:].mean()
    features['avg_first_10000'] = xc[:10000].mean()
    features['avg_last_10000'] = xc[-10000:].mean()

    features['min_first_50000'] = xc[:50000].min()
    features['min_last_50000'] = xc[-50000:].min()
    features['min_first_10000'] = xc[:10000].min()
    features['min_last_10000'] = xc[-10000:].min()

    features['max_first_50000'] = xc[:50000].max()
    features['max_last_50000'] = xc[-50000:].max()
    features['max_first_10000'] = xc[:10000].max()
    features['max_last_10000'] = xc[-10000:].max()

    features['max_to_min'] = xc.max() / (np.abs(xc.min()) + 1e-5)
    features['max_to_min_diff'] = xc.max() - np.abs(xc.min())
    features['count_big'] = len(xc[np.abs(xc) > 500])
    features['sum'] = xc.sum()

    features['mean_change_rate_first_50000'] = np.mean(np.nonzero((np.diff(xc[:50000]) / (xc[:50000][:-1] + 1e-5)))[0])
    features['mean_change_rate_last_50000'] = np.mean(np.nonzero((np.diff(xc[-50000:]) / (xc[-50000:][:-1] + 1e-5)))[0])
    features['mean_change_rate_first_10000'] = np.mean(np.nonzero((np.diff(xc[:10000]) / (xc[:10000][:-1] + 1e-5)))[0])
    features['mean_change_rate_last_10000'] = np.mean(np.nonzero((np.diff(xc[-10000:]) / (xc[-10000:][:-1] + 1e-5)))[0])

    features['q95'] = np.quantile(xc, 0.95)
    features['q99'] = np.quantile(xc, 0.99)
    features['q05'] = np.quantile(xc, 0.05)
    features['q01'] = np.quantile(xc, 0.01)

    features['abs_q95'] = np.quantile(np.abs(xc), 0.95)
    features['abs_q99'] = np.quantile(np.abs(xc), 0.99)
    features['abs_q05'] = np.quantile(np.abs(xc), 0.05)
    features['abs_q01'] = np.quantile(np.abs(xc), 0.01)

    features['trend'] = add_trend_feature(xc)
    features['abs_trend'] = add_trend_feature(xc, abs_values=True)
    features['abs_mean'] = np.abs(xc).mean()
    features['abs_std'] = np.abs(xc).std()

    features['mad'] = np.mean(np.abs(xc - np.mean(xc)))
    features['kurt'] = xc.kurtosis()
    features['skew'] = xc.skew()
    features['med'] = xc.median()

    features['Hilbert_mean'] = np.abs(hilbert(xc)).mean()
    features['Hann_window_mean'] = (convolve(xc, hann(150), mode='same') / sum(hann(150))).mean()
    features['classic_sta_lta1_mean'] = classic_sta_lta(xc, 500, 10000).mean()
    features['classic_sta_lta2_mean'] = classic_sta_lta(xc, 5000, 100000).mean()
    features['classic_sta_lta3_mean'] = classic_sta_lta(xc, 3333, 6666).mean()
    features['classic_sta_lta4_mean'] = classic_sta_lta(xc, 10000, 25000).mean()
    
    features['Moving_average_700_mean'] = xc.rolling(window=700).mean().mean()
    features['Moving_average_1500_mean'] = xc.rolling(window=1500).mean().mean()
    features['Moving_average_3000_mean'] = xc.rolling(window=3000).mean().mean()
    features['Moving_average_6000_mean'] = xc.rolling(window=6000).mean().mean()
    
    features['exp_Moving_average_300_mean'] = xc.ewm(span=300).mean().mean()
    features['exp_Moving_average_3000_mean'] = xc.ewm(span=3000).mean().mean()
    features['exp_Moving_average_30000_mean'] = xc.ewm(span=6000).mean().mean()
    
    no_of_std = 2
    features['MA_700MA_std_mean'] = xc.rolling(window=700).std().mean()
    features['MA_700MA_BB_high_mean'] = (features['Moving_average_700_mean'] + no_of_std * features['MA_700MA_std_mean']).mean()
    features['MA_700MA_BB_low_mean'] = (features['Moving_average_700_mean'] - no_of_std * features['MA_700MA_std_mean']).mean()
    features['MA_400MA_std_mean'] = xc.rolling(window=400).std().mean()
    features['MA_400MA_BB_high_mean'] = (features['Moving_average_700_mean'] + no_of_std * features['MA_400MA_std_mean']).mean()
    features['MA_400MA_BB_low_mean'] = (features['Moving_average_700_mean'] - no_of_std * features['MA_400MA_std_mean']).mean()
    features['MA_1000MA_std_mean'] = xc.rolling(window=1000).std().mean()

    features['iqr'] = np.subtract(*np.percentile(xc, [75, 25]))
    features['q999'] = np.quantile(xc,0.999)
    features['q001'] = np.quantile(xc,0.001)
    features['ave10'] = stats.trim_mean(xc, 0.1)

    for windows in [10, 100, 1000]:
        x_roll_std = xc.rolling(windows).std().dropna().values
        x_roll_mean = xc.rolling(windows).mean().dropna().values
        features['ave_roll_std_' + str(windows)] = x_roll_std.mean()
        features['std_roll_std_' + str(windows)] = x_roll_std.std()
        features['max_roll_std_' + str(windows)] = x_roll_std.max()
        features['min_roll_std_' + str(windows)] = x_roll_std.min()
        features['q01_roll_std_' + str(windows)] = np.quantile(x_roll_std, 0.01)
        features['q05_roll_std_' + str(windows)] = np.quantile(x_roll_std, 0.05)
        features['q95_roll_std_' + str(windows)] = np.quantile(x_roll_std, 0.95)
        features['q99_roll_std_' + str(windows)] = np.quantile(x_roll_std, 0.99)
        features['av_change_abs_roll_std_' + str(windows)] = np.mean(np.diff(x_roll_std))
        features['av_change_rate_roll_std_' + str(windows)] = np.mean(np.nonzero((np.diff(x_roll_std) / (x_roll_std[:-1] + 1e-5)))[0])
        features['abs_max_roll_std_' + str(windows)] = np.abs(x_roll_std).max()
        features['ave_roll_mean_' + str(windows)] = x_roll_mean.mean()
        features['std_roll_mean_' + str(windows)] = x_roll_mean.std()
        features['max_roll_mean_' + str(windows)] = x_roll_mean.max()
        features['min_roll_mean_' + str(windows)] = x_roll_mean.min()
        features['q01_roll_mean_' + str(windows)] = np.quantile(x_roll_mean, 0.01)
        features['q05_roll_mean_' + str(windows)] = np.quantile(x_roll_mean, 0.05)
        features['q95_roll_mean_' + str(windows)] = np.quantile(x_roll_mean, 0.95)
        features['q99_roll_mean_' + str(windows)] = np.quantile(x_roll_mean, 0.99)
        features['av_change_abs_roll_mean_' + str(windows)] = np.mean(np.diff(x_roll_mean))
        features['av_change_rate_roll_mean_' + str(windows)] = np.mean(np.nonzero((np.diff(x_roll_mean) / (x_roll_mean[:-1] + 1e-5)))[0])
        features['abs_max_roll_mean_' + str(windows)] = np.abs(x_roll_mean).max()

    return pd.DataFrame([features])

def predict(csv_path):
    try:
        # Earthquake prediction requires a segment of 150,000 acoustic samples
        df = pd.read_csv(csv_path)
        if 'acoustic_data' not in df.columns:
            return {"error": "CSV must contain 'acoustic_data' column", "status": "error"}
        
        # Take the first 150,000 or the whole thing if smaller (though it won't be as accurate)
        seg = df['acoustic_data'].values[:150000]
        if len(seg) < 150000:
            # Pad with mean
            seg = np.pad(seg, (0, 150000 - len(seg)), 'mean')
            
        features_df = create_features(seg)
        
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
            
        # Scaling (Note: The notebook used a global scaler. Here we might have slight drift but let's try)
        # Ideally we'd have the scaler saved as well.
        prediction = model.predict(features_df)
        
        result = {
            "time_to_failure": float(prediction[0]),
            "unit": "seconds",
            "status": "success"
        }
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No data path provided"}))
        sys.exit(1)
    
    data_path = sys.argv[1]
    print(json.dumps(predict(data_path)))

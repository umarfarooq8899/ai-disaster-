import sys
import os
import json
import torch
import torch.nn as nn
import numpy as np
import rasterio
import cv2
from PIL import Image
from torchvision import models, transforms

# Paths to models
MODEL_PATH = r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Flood Detection\resnet_model_checkpoint.pth'

# Check if model exists
if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": "Flood detection model weights not found at path: " + MODEL_PATH}))
    sys.exit(1)

# Transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5])
])

def speckle_reduce(img, ksize=5):
    return cv2.medianBlur(img.astype(np.uint8), ksize)

def percentile_stretch(band, pmin=2, pmax=98):
    lo, hi = np.nanpercentile(band, (pmin, pmax))
    band = np.clip(band, lo, hi)
    band = (band - lo) / (hi - lo) if hi > lo else np.zeros_like(band)
    return (band * 255).astype(np.uint8)

def apply_clahe(band, clip_limit=2.0, tile_grid_size=(8,8)):
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    return clahe.apply(band)

def preprocess_image(image_path):
    with rasterio.open(image_path) as src:
        cnt = src.count
        fname = os.path.basename(image_path)
        is_s1 = "/S1" in image_path or fname.startswith("S1")
        is_s2 = "/S2" in image_path or fname.startswith("S2")

        if is_s1:
            arr = src.read(1).astype(float)
            lo, hi = np.nanmin(arr), np.nanmax(arr)
            norm = ((arr - lo) / (hi - lo) * 255).astype(np.uint8) if hi > lo else np.zeros_like(arr, dtype=np.uint8)
            clean = speckle_reduce(norm)
            rgb = np.stack([clean]*3, axis=-1)
        elif is_s2 and cnt >= 3:
            r = src.read(4).astype(float) if cnt >= 4 else src.read(1).astype(float)
            g = src.read(3).astype(float) if cnt >= 3 else src.read(1).astype(float)
            b = src.read(2).astype(float) if cnt >= 3 else src.read(1).astype(float)
            r, g, b = apply_clahe(percentile_stretch(r)), apply_clahe(percentile_stretch(g)), apply_clahe(percentile_stretch(b))
            rgb = np.stack([r, g, b], axis=-1)
        else:
            arr = src.read(1).astype(float)
            arr = (arr - arr.min()) / (arr.max() - arr.min()) if arr.max() > arr.min() else np.zeros_like(arr)
            arr = (arr * 255).astype(np.uint8)
            rgb = np.stack([arr]*3, axis=-1)
    
    pil = Image.fromarray(rgb)
    return transform(pil).unsqueeze(0)

def predict(image_path):
    try:
        device = torch.device("cpu")
        model = models.resnet50(pretrained=False)
        model.fc = nn.Linear(model.fc.in_features, 2)
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model.eval()

        input_tensor = preprocess_image(image_path)
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = nn.Softmax(dim=1)(outputs)
            conf, pred = torch.max(probs, 1)
        
        classes = ["No Flood", "Flood"]
        result = {
            "prediction": classes[pred.item()],
            "confidence": float(conf.item()),
            "status": "success"
        }
        return result
    except Exception as e:
        return {"error": str(e), "status": "error"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    
    img_path = sys.argv[1]
    print(json.dumps(predict(img_path)))

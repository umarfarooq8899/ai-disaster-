import sys
import os
import json
import numpy as np
import cv2
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TF logs
from tensorflow.keras.models import load_model

# Paths to models
MODEL_PATH = r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Fire Detection\fire_detection_resnet50_V1.h5'

# Check if model exists
if not os.path.exists(MODEL_PATH):
    print(json.dumps({"error": "Fire detection model weights not found at path: " + MODEL_PATH}))
    sys.exit(1)

def predict(image_path):
    try:
        model = load_model(MODEL_PATH)
        
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Cannot read image", "status": "error"}
            
        image = cv2.resize(image, (224, 224))
        image = image / 255.0
        image = np.expand_dims(image, axis=0)

        preds = model.predict(image, verbose=0)
        # Assuming class 0 is 'fire' and 1 is 'no_fire' or similar based on le.fit_transform
        # In the notebook: le.fit_transform(labels) -> 'fire'/'no_fire'
        # Usually alphabetical: 'fire'=0, 'no_fire'=1
        
        classes = ["Fire", "No Fire"]
        pred_idx = np.argmax(preds[0])
        confidence = float(np.max(preds[0]))
        
        result = {
            "prediction": classes[pred_idx],
            "confidence": confidence,
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

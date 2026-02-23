import json
import os

def extract_notebook_code(nb_path, out_path):
    with open(nb_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        for i, cell in enumerate(data['cells']):
            if cell['cell_type'] == 'code':
                source = ''.join(cell['source'])
                f.write(f"--- CELL {i} ---\n")
                f.write(source)
                f.write("\n\n")

nb_files = [
    r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Flood Detection\flood_detection.ipynb',
    r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Fire Detection\Fire_Detection.ipynb',
    r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Earthquack Detection\Earthquake_EDA_and_Prediction.ipynb'
]

for nb in nb_files:
    out = os.path.basename(nb).replace('.ipynb', '_code.txt')
    print(f"Extracting {nb} to {out}")
    extract_notebook_code(nb, out)

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

nb_file = r'c:\Users\HP\Downloads\ai-disaster\model_training\Climate-Disasters-Warning-Systems-main\Sea-Level Rise Detection\SLR_GRACE.ipynb'
out = 'SLR_GRACE_code.txt'
print(f"Extracting {nb_file} to {out}")
extract_notebook_code(nb_file, out)

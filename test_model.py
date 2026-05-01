import pickle
import numpy as np

model = pickle.load(open("models/best_model.pkl", "rb"))
print("✅ Modèle chargé avec succès !")
print(f"Type du modèle : {type(model)}")
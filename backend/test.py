import base64
from PIL import Image 
from PIL import ImageOps
from io import BytesIO
import numpy as np
import matplotlib.pyplot as plt
from keras.models import load_model
from tensorflow.keras.models import load_model
import cv2
import json
import numpy as np

# def image_to_json(image_path, json_path):
#     # Load the image in grayscale
#     image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    
#     if image is None:
#         raise ValueError(f"Image not found or unable to read the image at {image_path}")
    
#     # Resize the image to 28x28 if needed
#     image = cv2.resize(image, (28, 28))
    
#     # Normalize the image to the range [0, 1]
#     image = image / 255.0# Convert the image to a list
#     image_list = image.tolist()  # Convert NumPy array to a Python list# Create a dictionary to store the image data
#     data = {
#         'image': image_list
#     }
    
#     # Write the JSON data to a file
#     with open(json_path, 'w') as json_file:
#         json.dump(data, json_file, indent=4)  # Indent for readability# Example usage:

# json_path ='C:/Users/s-le/Desktop/handwritten_digit.json'
# def read_json(json_path):
#     # Open and read the JSON file
#     with open(json_path, 'r') as json_file:
#         data = json.load(json_file)  # Correct usage of json.load()
    
#     base64_image = data['image']
#      # Base64デコード
#     image_data = base64.b64decode(base64_image)
    
    # Pillowを使って画像データを開く
    # image = Image.open(BytesIO(image_data))

    # return image
# image_to_json('C:/Users/s-le/Desktop/handwritten_digit.png', 'C:/Users/s-le/Desktop/handwritten_digit.json')
# 新しい画像を生成
jsondata  ={'file': 'data:image/png;base64,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'}
# image = read_json(json_path)
# Giải mã Base64 thành dữ liệu nhị phân
# Step 1: Base64の文字列からバイナリデータにデコード
base64_str = jsondata['file'].split(',')[1]
image_data = base64.b64decode(base64_str)

# Step 2: バイナリデータを画像に変換
image = Image.open(BytesIO(image_data))

# Step 3: 画像をRGBAモードに変換（透明背景を扱うため）
image = image.convert("RGBA")

# Step 4: 新しい画像を作成し、背景を白に設定
new_image = Image.new("RGBA", image.size, "WHITE")
new_image.paste(image, (0, 0), image)  # 画像を貼り付け（アルファチャンネルを保持）# Step 5: 画像をRGBモードに変換してアルファチャンネルを削除
final_image = new_image.convert("RGB")

# Step 6: 画像を28x28にリサイズ
final_image = final_image.resize((28, 28))

# Step 7: 画像を1チャンネルのグレースケールに変換
final_image = final_image.convert("L")  # 'L'は1チャンネルのグレースケールモード# モデルに入力できるように画像をNumpy配列に変換import numpy as np
image_array = np.array(final_image)
image_array = image_array.reshape((28, 28, 1))  # (28, 28, 1)の形にリシェイプ# 必要であれば、ピクセル値を0-1に正規化
image_array = image_array.astype('float32') / 255.0
image_array = np.expand_dims(image_array, axis=0)
# 画像を表示
plt.imshow(image_array.squeeze(), cmap='gray')
plt.title("Processed Image")
plt.axis('off')  # 軸を非表示にする
# final_image.show()
print(f"Shape of image_array: {image_array.shape}")
print(f"Sample image data (first pixel): {image_array[0, 0, 0, 0]}")

model = load_model('C:/Users/s-le/Desktop/model.h5')

# 画像データをモデルに入力して予測を行う
predictions = model.predict(image_array)

# 最も高い確率のインデックスを取得
predicted_class = np.argmax(predictions, axis=1)
# 各クラスのインデックス
indices = [1, 2, 3, 4]

# 指定されたクラスの予測確率を表示
for index in indices:
    print(f"クラス {index} の予測確率: {predictions[0][index]:.4f}")

print(image_array.shape)  # Prints the dimensions of the image
plt.show()


import base64
from PIL import Image 
from io import BytesIO
import numpy as np
import matplotlib.pyplot as plt
import cv2
# import tensorflow as tf

def showimage(resized_image_np):
    # 例として、(1, 28, 28, 1) の形状を持つ画像データを扱う
    # 画像の形状が (1, 28, 28, 1) であれば、(28, 28) に変換
    if resized_image_np.shape == (1, 28, 28, 1):
        resized_image_np = resized_image_np.reshape(28, 28)

    # 画像を表示ｓ
    plt.imshow(resized_image_np, cmap='gray')
    plt.title("Resized Image")
    plt.show()

def changeImage(jsondata):
    # jsondata  ={'file': 'data:image/png;base64,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'}
    # jsondata = jsondata['file']
    if jsondata:
        base64_image_data = jsondata.split(',')[1]  # 'data:image/png;base64,' を除去

        try:
            # Base64デコードして画像データを取得する
            image_data = base64.b64decode(base64_image_data)

            # 画像データをPIL.Imageで開く
            image = Image.open(BytesIO(image_data))
            
            if image.mode == 'RGBA':
                # 黒い背景で新しい画像を作成
                background = Image.new('RGB', image.size, (0, 0, 0))
                # 白い部分（アルファチャンネル）を塗りつぶす
                white_image = Image.new('RGB', image.size, (255, 255, 255))
                # アルファチャンネルをマスクとして使用
                mask = image.split()[3]
                # 背景に数字を白くペースト
                background.paste(white_image, (0, 0), mask)
                image = background
            
            # PILを使って画像のサイズ変更（モデルが期待するサイズにリサイズ）
            resized_image = image.resize((28, 28), Image.Resampling.LANCZOS)
            # PIL画像をNumPy配列に変換
            resized_image_np = np.array(resized_image)

            # 画像のチャンネル数を確認し、必要に応じて変換
            if resized_image_np.ndim == 3 and resized_image_np.shape[2] == 4:
                # RGBA形式の場合、RGB形式に変換
                resized_image_np = cv2.cvtColor(resized_image_np, cv2.COLOR_RGBA2RGB)

            # チャンネル数を1に変更して、(28, 28, 1)の形状に変換
            if resized_image_np.ndim == 3 and resized_image_np.shape[2] == 3:
                resized_image_np = cv2.cvtColor(resized_image_np, cv2.COLOR_RGB2GRAY)
                resized_image_np = np.expand_dims(resized_image_np, axis=-1)  # チャンネル次元を追加

            # モデルへの入力用にデータを正規化（0-1の範囲に変換）
            resized_image_np = resized_image_np / 255.0
            # モデルの入力形状に合わせてバッチ次元を追加
            resized_image_np = np.expand_dims(resized_image_np, axis=0)
            return resized_image_np
        except Exception as e:
            print(f"エラーが発生しました: {e}")
    else:
        print("画像データがJSONに含まれていません。")
# showimage(changeImage())
def saveimage(image_array):
    # 画像を保存
    plt.imsave('/app/random_image.png', image_array, cmap='gray')
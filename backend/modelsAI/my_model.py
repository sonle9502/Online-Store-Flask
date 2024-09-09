import tensorflow as tf
from tensorflow.keras.datasets import mnist
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
from tensorflow.keras.utils import to_categorical
import matplotlib.pyplot as plt
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.layers import Dropout
from tensorflow.keras.layers import BatchNormalization

# MNIST データセットのロード
(x_train, y_train), (x_test, y_test) = mnist.load_data()

# データの前処理
x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0

# ラベルをカテゴリカル形式に変換
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

def create_model():
    model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(28, 28, 1)),
    BatchNormalization(),
    MaxPooling2D((2, 2)),
    
    Conv2D(64, (3, 3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D((2, 2)),
    
    Conv2D(128, (3, 3), activation='relu'),
    BatchNormalization(),
    MaxPooling2D((2, 2)),
    
    Flatten(),
    Dense(128, activation='relu'),
    BatchNormalization(),
    Dropout(0.5),
    Dense(10, activation='softmax')
    
    ])

    # 学習率を低めに設定 
    model.compile(optimizer=tf.keras.optimizers.RMSprop(learning_rate=0.0001),
              loss='categorical_crossentropy',
              metrics=['accuracy'])
    
    return model


datagen = ImageDataGenerator(
    rotation_range=15,  # 回転範囲を拡大
    width_shift_range=0.2,  # 水平方向のシフトを増加
    height_shift_range=0.2,  # 垂直方向のシフトを増加
    zoom_range=0.2,  # ズーム範囲を拡大
    shear_range=0.15,  # シアー変換を追加
    horizontal_flip=True  # 水平反転を追加
)

def train_model(model, x_train, y_train, x_test, y_test):
    # エポック数を10に増やす , バッチサイズを32に減らす, データ拡張を適用して訓練, 学習率スケジューリング
    lr_scheduler = tf.keras.callbacks.LearningRateScheduler(lambda epoch: 1e-4 * 10**(epoch / 20))
    model.fit(datagen.flow(x_train, y_train, batch_size=32), epochs=20, validation_data=(x_test, y_test), callbacks=[lr_scheduler])
    test_loss, test_acc = model.evaluate(x_test, y_test)
    print(f"test_loss: {test_loss} Test accuracy: {test_acc}")

def save_model(model, filename='C://Users//s-le//Desktop//editmodel.h5'):
    model.save(filename)
    print(f"Model saved to {filename}")

def test():
    # 1つの画像を表示する
    plt.imshow(x_train[4].reshape(28, 28), cmap='gray')
    plt.title(f"Label: {np.argmax(y_train[0])}")
    print(f"Sample image shape: {x_train[0].shape}")  # 例: (28, 28, 1)
    print(f"Sample image data: {x_train[0][0][0]}")  # 例: 0.0 (画像の最初のピクセルの値)
    print("x_train shape:", x_train.shape)
    print("x_test shape:", x_test.shape)
    print("x_train data range:", np.min(x_train), "to", np.max(x_train))

    plt.show()

if __name__ == "__main__":
    model = create_model()
    train_model(model, x_train, y_train, x_test, y_test)
    # 1つの画像のサンプルを表示する
    test()
    save_model(model)

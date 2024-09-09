import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

# TensorFlowのバージョンとCUDAサポートの確認
print(tf.__version__)
print("Built with CUDA:", tf.test.is_built_with_cuda())

# データの読み込み
(x_train_src, y_train_src), (x_test_src, y_test_src) = tf.keras.datasets.mnist.load_data()
print(x_train_src.shape)
print(y_train_src.shape)
print(x_test_src.shape)
print(y_test_src.shape)

# チャンネルの次元を追加
input_shape = (28, 28, 1)
x_train = x_train_src.reshape(x_train_src.shape[0], 28, 28, 1)
x_test = x_test_src.reshape(x_test_src.shape[0], 28, 28, 1)

# データの正規化
x_train = x_train / 255.0
x_test = x_test / 255.0

# ラベルをone-hotエンコーディング
y_train = tf.keras.utils.to_categorical(y_train_src, 10)
y_test = tf.keras.utils.to_categorical(y_test_src, 10)

print(x_train.shape)
print(x_test.shape)

# 画像表示用の関数
def convert_image(arr, show=True, title="", w=28, h=28):
    img = Image.fromarray((arr.reshape(w, h) * 255).astype(np.uint8))
    if show:
        plt.imshow(img, cmap='gray')
        plt.title(title)
    return img

def convert_images(srcs, length, show=True, cols=5, w=28, h=28):
    rows = int(length / cols + 1)
    dst = Image.new('L', (w * cols, h * rows))  # 'L'はグレースケール
    for j in range(rows):
        for i in range(cols):
            ptr = i + j * cols
            if ptr < length:
                img = convert_image(srcs[ptr], show=False, w=w, h=h)
                dst.paste(img, (i * w, j * h))
    if show:
        plt.imshow(dst, cmap='gray')
    return dst

plt.subplot(1, 2, 1)
convert_images(x_train, 50)
plt.subplot(1, 2, 2)
convert_images(x_test, 50)
plt.show()

# モデルの構築
def MNISTConvModel(input_shape, predicates_class_n):
    inputs = tf.keras.layers.Input(shape=input_shape)
    x = tf.keras.layers.Conv2D(32, kernel_size=(3, 3), activation='relu')(inputs)
    x = tf.keras.layers.Conv2D(64, kernel_size=(3, 3), activation='relu')(x)
    x = tf.keras.layers.MaxPooling2D(pool_size=(2, 2))(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    x = tf.keras.layers.Flatten()(x)  # 2D(12*12*64) -> 1D(9216)
    x = tf.keras.layers.Dense(120, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.5)(x)
    predicates = tf.keras.layers.Dense(predicates_class_n, activation='softmax')(x)
    return tf.keras.models.Model(inputs=inputs, outputs=predicates)

model = MNISTConvModel(input_shape=input_shape, predicates_class_n=10)
model.summary()

# モデルのコンパイルと訓練
batch_size = 128
epochs = 20

model.compile(
    loss='categorical_crossentropy',
    optimizer='adadelta',
    metrics=['accuracy']
)

tensorboard_cb = tf.keras.callbacks.TensorBoard(log_dir="./tflogs/", histogram_freq=1)
history = model.fit(
    x_train, y_train,
    batch_size=batch_size,
    epochs=epochs,
    verbose=2,
    validation_data=(x_test, y_test),
    callbacks=[tensorboard_cb],
)



# モデルの評価
scores = model.evaluate(x_test, y_test, verbose=2)
print('loss:', scores[0], 'accuracy:', scores[1])

# モデルの保存
model.save('C:/Users/s-le/Desktop/mnist_model.h5')

print("save sucessfull")
# # 学習結果の確認
plt.subplot(2, 1, 1)
plt.plot(range(epochs), history.history['accuracy'], label='accuracy')
plt.plot(range(epochs), history.history['val_accuracy'], label='val_accuracy')
plt.legend(loc='center left', bbox_to_anchor=(1, 0.5))

plt.subplot(2, 1, 2)
plt.plot(range(epochs), history.history['loss'], label='loss')
plt.plot(range(epochs), history.history['val_loss'], label='val_loss')
plt.legend(loc='center left', bbox_to_anchor=(1, 0.5))
# plt.show()
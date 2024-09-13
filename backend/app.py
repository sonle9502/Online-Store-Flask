from flask import Flask, render_template, request, redirect, url_for, send_file, jsonify, send_from_directory, session
from flask_migrate import Migrate
from datetime import datetime, timedelta
import os
from config import DevelopmentConfig, TestingConfig, ProductionConfig
from models.flaskmodel import SQLAlchemy_db, Todo, Image, Comment
from models.mysql import MysqlClass
import changeImage
from PIL import Image as IM
import logging
from dotenv import load_dotenv
from io import BytesIO
from forms import CommentForm
from flask_wtf.csrf import CSRFProtect, generate_csrf ,CSRFError
from flask_cors import CORS
# import openai
# import tensorflow as tf
# import torch
import librosa
import cv2
import numpy as np
import base64
import io
import pytz
from flask_sqlalchemy import SQLAlchemy
from users.usermodels import User
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from functools import wraps
import random
import string

# 各種設定と拡張機能のインスタンス化
flask_sqlalchemy = 0
mySql = 1
app = Flask(__name__, static_folder='frontend/build', template_folder='frontend/build')
# app.config['DEBUG'] = True
app.secret_key = 'your_secret_key'  # シークレットキーを設定
app.config['WTF_CSRF_TIME_LIMIT'] = None  # 必要に応じて時間制限を無効にする

db = SQLAlchemy()
migrate = Migrate()
csrf = CSRFProtect(app)

# Flask-Loginの設定
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'add'

@login_manager.user_loader
def load_user(email):   
    return User.get(email)
# Blueprintの登録
from users.auth import auth_bp  # Blueprintをインポート
app.register_blueprint(auth_bp)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'id' not in session:
            # 認証エラーが発生した場合のレスポンスを返す
            response = jsonify({'message': 'Unauthorized access'})
            response.status_code = 401
            return response
        return f(*args, **kwargs)
    return decorated_function

# MySQLflask_sqlalchemyのURIを設定
if flask_sqlalchemy:
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'data', 'db.sqlite')}"
    db = SQLAlchemy_db
    db.init_app(app)
    migrate = Migrate(app, db)

# MySQLデータベースのURIを設定
if mySql:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://FlaskDB:Future0308@localhost:3306/tododb'
    # db = MysqlClass.mysql_db
    db.init_app(app)
    migrate = Migrate(app, db)

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, supports_credentials=True)
load_dotenv()

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

env = os.environ.get('FLASK_ENV', 'development')

if env == 'development':
    app.config.from_object(DevelopmentConfig)
elif env == 'testing':
    app.config.from_object(TestingConfig)
else:
    app.config.from_object(ProductionConfig)

# モデルのロード
# try:
#     model = tf.keras.models.load_model('/app/modelsAI/editmodel.h5')
#     print("Model loaded successfully!")
# except Exception as e:
#     print(f"Error loading model: {e}")

# getcsrftoken
@app.route('/api/get-csrf-token', methods=['GET'])
def get_csrf_token():
    try:
        csrf_token = generate_csrf()
        return jsonify({'csrf_token': csrf_token})
    except Exception as e:
        app.logger.error(f"Error generating CSRF token: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    return jsonify({'error': 'CSRF token is missing or invalid'}), 400

# 静的ファイルと React アプリケーションのルーティング
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

# Windowsのバックスラッシュをスラッシュに変換
path = os.path.join('frontend', 'build')
@app.route('/<path:path>', methods=['GET'])
def serve_react_app(path):
    if path == '':
        path = 'index.html'
    a = app.static_folder
    return send_from_directory(a, path)

#画像認識
@app.route('/predict-image', methods=['POST'])
def predict_image():
    try:
        logging.info("Starting image processing...")
        datafile = request.json.get('file')
        index_value = request.json.get('index')
        if not datafile:
            raise ValueError("No data received")
        
        logging.info(f"Received image data length: {datafile}")
        logging.info(f"Received image data length: {index_value}")

        # デバッグ用ログ
        logging.info("Calling changeImage()")
        image_array = changeImage.changeImage(datafile)
        changeImage.saveimage(image_array)
        print(f"changeImage() returned shape: {np.array(image_array).shape}")

        if index_value == 'number':
            # 画像データをモデルに入力して予測を行う
            predictions = model.predict(image_array)
            # すべてのクラスの予測確率を含めて返す
            prediction_probabilities = predictions[0].tolist()
        elif index_value == 'kanji':
            # 画像データをモデルに入力して予測を行う
            # predictions = model.predict(image_array)
            # すべてのクラスの予測確率を含めて返す
            prediction_probabilities = [1, 2, 3]
            logging.info(f"Received image data length: {prediction_probabilities}")

        return jsonify({'predictions': prediction_probabilities}), 200

    except Exception as e:
        logging.error(f"Error processing image: {e}")
        return jsonify({'error': 'Failed to process image'}), 500
    
#音声処理
@app.route('/predict-audio', methods=['POST'])
def predict_audio():
    file = request.files['audio']
    audio, sr = librosa.load(file, sr=None)
    # モデルの推論コードをここに記述
    prediction = "dummy_result"  # モデルの予測結果
    return jsonify({'prediction': prediction})

def generate_tracking_number():
    date_part = datetime.now().strftime("%Y%m%d%H%M%S")  # 現在の日時をベースにした部分
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))  # ランダムな文字列
    return f'TN{date_part}{random_part}'

#getimage
@app.route('/image/<int:id>')
def get_image(id):
    if mySql:
        try:
            # MySQLから画像データを取得
            result = MysqlClass.get_image(id)
            
            if isinstance(result, dict) and 'filename' in result and 'data' in result:
                filename = result['filename']
                image_data = result['data']

                # データをbase64にエンコード
                encoded_image = base64.b64encode(image_data).decode('utf-8')
                
                # JSON形式で返す
                return jsonify({
                    'filename': filename,
                    'image': encoded_image
                })
            else:
                return jsonify({'error': 'Image not found or invalid data format'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        try:
            image = Image.query.get_or_404(id)
            return send_file(BytesIO(image.data), mimetype='image/jpeg')
        except Exception as e:
            return jsonify({'error': str(e)}), 500

#generate-description by openAI
@app.route('/api/generate-description', methods=['POST'])
def generate_description():
    try:
        data = request.json
        query = data.get('query')

        # 新しいOpenAI APIの呼び出し
        response = openai.Completion.create(
            model="text-davinci-003",  # または他のモデル
            prompt=query,
            max_tokens=150
        )

        # レスポンスから説明文を取得
        description = response['choices'][0]['text'].strip()
        return jsonify({"description": description}), 200
    except Exception as e:
        app.logger.error("Error generating description: %s", str(e))
        return jsonify({"error": str(e)}), 500

#uploadimage
@app.route('/upload_images/<int:id>', methods=['POST'])
def upload_images(id):
    if mySql:
        if 'files' not in request.files:
            return jsonify({"error": "No files part"}), 400
        
        files = request.files.getlist('files')
        if not files:
            return jsonify({"error": "No files selected"}), 400
        
        try:
            for file in files:
                if file.filename == '':
                    continue
                
                filename_tuple=file.filename,
                filename = filename_tuple[0]
                image_data=file.read(),
                todo_id=id
                result = MysqlClass.upload_image(filename, todo_id, image_data)
            if result:
                return jsonify({'message': 'Image uploaded successfully', 'id': result}), 200
            else:
                return jsonify({'error': 'Failed to upload image'}), 500
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
        
    else:
        if 'files' not in request.files:
            return jsonify({"error": "No files part"}), 400
        
        files = request.files.getlist('files')
        if not files:
            return jsonify({"error": "No files selected"}), 400
        
        try:
            for file in files:
                if file.filename == '':
                    continue
                
                image = Image(
                    filename=file.filename,
                    data=file.read(),
                    todo_id=id
                )
                db.session.add(image)
            
            db.session.commit()
            return jsonify({"message": "Files uploaded successfully!"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
#gettask
@app.route('/api/taskdetail/<int:id>', methods=['GET'])
def get_task(id):
    if mySql:
        task_tuple = MysqlClass.get_task_detail(id)
        task = task_tuple[0]
        if task is None:
            return jsonify({"error": "Data retrieval error"}), 500

        # Backend: 適切な形式に変換
        task['due_date'] = task['due_date'].strftime('%Y-%m-%dT%H:%M')

        # コメントをcreated_atでソート（新しいものが上）し、フォーマットを変更
        task['comments'] = sorted(
            task['comments'], 
            key=lambda x: datetime.strptime(x['created_at'], '%Y-%m-%d %H:%M:%S.%f'), 
            reverse=True
        )

        # ソート後、created_atを希望の形式に変更
        for comment in task['comments']:
            comment['created_at'] = datetime.strptime(comment['created_at'], '%Y-%m-%d %H:%M:%S.%f').strftime('%Y/%m/%d - %H:%M')

        result = jsonify(task)

        return result, 200
    else:
        todo = Todo.query.get_or_404(id)
        comments = Comment.query.filter_by(todo_id=id).order_by(Comment.created_at.desc()).all()
        
        offset = timedelta(hours=9)
        comments_data = [
            {
                'id': comment.id,
                'content': comment.content,
                'created_at': (comment.created_at + offset).strftime('%Y-%m-%d %H:%M:%S')
            }
            for comment in comments
        ]
        
        images_data = [
            {
                'id': image.id,
                'filename': image.filename,
                'url': url_for('get_image', id=image.id)
            }
            for image in todo.images
        ]

        return jsonify({
            'id': todo.id,
            'content': todo.content,
            'description': todo.description,
            'created_at': todo.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'due_date': todo.due_date.strftime('%Y-%m-%dT%H:%M:%S'),
            'comments': comments_data,
            'images': images_data
        })

#searchtasks
@app.route('/search', methods=['GET'])
def search_tasks():
    if request.method == 'GET':
            try:
                query = request.args.get('query', '')   
                if not query:
                    return jsonify([])  # クエリがない場合は空のリストを返す
                result = MysqlClass.search(query)
                print(result)
                if result:
                    return jsonify(result)
                else:
                    return jsonify({'error': 'Failed to upload image'}), 500
            except Exception as e:
                print(f"Unexpected error: {e}")
                return jsonify({'error': 'Internal Server Error'}), 500
    else:
        query = request.args.get('query', '')
        
        if not query:
            return jsonify([])  # クエリがない場合は空のリストを返す
        
        # データベースからクエリに一致するタスクを検索し、created_atでソート
        tasks = Todo.query.filter(Todo.content.ilike(f'%{query}%')).order_by(Todo.created_at.desc()).all()
        
        # タスクを辞書形式で返す
        result = [task.to_dict() for task in tasks]
        
        return jsonify(result)

#Updatetask
@app.route('/api/update_task/<int:id>', methods=['POST'])
def update_task(id):
    if mySql:
        if request.method == 'POST':
            try:
                data = request.get_json()
                content = data.get('content')
                description = data.get('description')
                due_date_str =  "2024-09-01T17:00:00+09:00"
                
                # ISO 8601 形式の文字列を UTC datetime オブジェクトに変換
                utc_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                
                # JST (UTC+9) のタイムゾーンオブジェクトを作成
                jst = pytz.timezone('Asia/Tokyo')
                
                # UTC datetime を JST に変換
                due_date = utc_date.astimezone(jst)
                result = MysqlClass.update_task(id,content,description,due_date)
                if result:
                    return jsonify({'message': 'Image uploaded successfully', 'id': result}), 200
                else:
                    return jsonify({'error': 'Failed to upload image'}), 500
            except Exception as e:
                print(f"Unexpected error: {e}")
                return jsonify({'error': 'Internal Server Error'}), 500
        return result
    else:
        todo = Todo.query.get_or_404(id)
        data = request.json
        todo.content = data['content']
        todo.description = data['description']
        todo.due_date = datetime.strptime(data['due_date'], '%Y-%m-%dT%H:%M')
        db.session.commit()
        return jsonify({'message': 'Task updated successfully'}), 200
#addcomment
@app.route('/api/tasks/<int:id>/comments', methods=['POST'])
def add_comment(id):
    if mySql:
        if request.method == 'POST':
            data = request.json
            todo_id=id
            new_comment = data['content']
            result = MysqlClass.add_comment(todo_id,new_comment)
            return jsonify({'message': 'Comment added successfully'}), 200
    else:
        data = request.json
        new_comment = Comment(content=data['content'], todo_id=id)
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({'message': 'Comment added successfully'}), 200

@app.route('/api/tasks/<int:task_id>/price', methods=['PUT'])
def update_unit_price(task_id):
    if mySql:
        try:
            data = request.get_json()
            new_price = data.get('unitPrice')
            if new_price is not None:
                result = MysqlClass.update_unitPrice(task_id, new_price)
                if result is None:
                    return jsonify({"error": "Data retrieval error"}), 500
                return jsonify(result), 200
            else:
                return jsonify({"error": "No price provided"}), 400
        except Exception as e:
            logging.error(f"An error occurred: {e}")
            return jsonify({"error": "Internal Server Error"}), 500
    else:
        return jsonify({"error": "Database not available"}), 500

#admin
# @app.route('/api/loginsussec', methods=['GET'])
# @login_required
# def loginsuccess():
#     return jsonify({"message": "LoginAA successful"}), 200
#viewer
@app.route('/api/viewer', methods=['GET'])
@login_required
def login_viewer():
    return jsonify({"message": "LoginAA successful"}), 200
#getalltasks
@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    try:
        if mySql:
            tasks = MysqlClass.get_all_data()
            if tasks is None:
                return jsonify({"error": "Data retrieval error"}), 500
            return jsonify(tasks), 200
        else:
            tasks = Todo.query.order_by(Todo.created_at.desc()).all()
            task_list = [task.to_dict() for task in tasks]
            return jsonify(task_list), 200
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return jsonify({"error": "Internal Server Error"}), 500


@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

# 東京時間 (JST) タイムゾーンを定義
JST = pytz.timezone('Asia/Tokyo')
#addtask
@app.route('/add', methods=['POST'])
def add():
    if mySql:
        if request.method == 'POST':
            try:
                data = request.get_json()
                content = data.get('content')
                description = data.get('description')
                due_date_str = data.get('dueDate')
                quantity_title = data.get('quantity_title')
                
                # ISO 8601 形式の文字列を UTC datetime オブジェクトに変換
                utc_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
                
                # JST (UTC+9) のタイムゾーンオブジェクトを作成
                jst = pytz.timezone('Asia/Tokyo')
                
                # UTC datetime を JST に変換
                due_date = utc_date.astimezone(jst)

                # Add task to the database
                task_id = MysqlClass.add_task(content, description, due_date, quantity_title)

                if task_id:
                    return jsonify({'taskId': task_id}), 201
                else:
                    return jsonify({'error': 'Failed to add task'}), 500
            except Exception as e:
                print(f"Unexpected error: {e}")
                return jsonify({'error': 'Internal Server Error'}), 500
    else:
        if request.method == 'POST':
            data = request.get_json()
            content = data.get('content')
            description = data.get('description')
            due_date_str = data.get('dueDate')

            try:
                due_date = datetime.fromisoformat(due_date_str)
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid date format"}), 400

            new_task = Todo(
                content=content,
                description=description,
                due_date=due_date
            )
            db.session.add(new_task)
            db.session.commit()
            return jsonify({"message": "Task created"}), 201
        
#logout
@app.route('/api/logout', methods=['POST'])
def logout():
    if request.method == 'POST':
        logout_user()  # Flask-Loginでユーザーをログアウト
        session.clear()  # 全てのセッションデータをクリア
        return jsonify({"message": "Logged out successfully"}), 200
    
@app.route('/home1', methods=['GET', 'POST'])
def add_new_item():  # 関数名が 'add' ではない
    return "test"

@app.route('/cart/add', methods=['POST'])
def cart():
    if mySql:
        if request.method == 'POST':
            data = request.get_json()  # JSON 形式のリクエストデータを取得
            productID = data.get('productID')  
            quantity = data.get('quantity')  
            userID = data.get('userId')  
            # MySQLから画像データを取得
            success = MysqlClass.cart(userID, productID, quantity)
            if success:
                return jsonify({"message": "Task deleted successfully"}), 200
            else:
                return jsonify({"message": "Task not found or error occurred"}), 404
            
@app.route('/api/purchase', methods=['POST'])
def purchase():
    if request.method == 'POST':
        data = request.get_json()  # JSON 形式のリクエストデータを取得
        user_id = data.get('user_id')
        total_amount = data.get('total_amount')  # クライアントから送られてきた合計金額

        # データベースから再計算した合計金額を取得
        total_amount_from_db = MysqlClass.get_total_amount(user_id)

        if total_amount == total_amount_from_db:
            tracking_number = generate_tracking_number()
            # 金額が一致する場合、注文を作成
            order_id = MysqlClass.create_order(user_id, total_amount, tracking_number )

            if order_id:
                # カートアイテムを注文アイテムとして移行
                success = MysqlClass.move_items_to_order(user_id, order_id)

                if success:
                    # カートのアイテムを削除
                    MysqlClass.delete_items_from_cart(user_id)
                    return jsonify({"message": "Order placed successfully"}), 200
                else:
                    return jsonify({"message": "Error occurred while moving items to order"}), 500
            else:
                return jsonify({"message": "Error occurred while creating order"}), 500
        else:
            # 金額が一致しない場合、エラーメッセージを返す
            return jsonify({"message": "Total amount mismatch"}), 400
            
@app.route('/api/delete-cart', methods=['DELETE'])
def delete_cart_item():
    if request.method == 'DELETE':
        data = request.get_json()  # JSON 形式のリクエストデータを取得
        
        # リクエストデータの検証
        if not data or 'itemId' not in data:
            return jsonify({"message": "Invalid request data or 'cart_id' not provided"}), 400
        
        itemId = data.get('itemId')
        
        # アイテムの削除を試みる
        success = MysqlClass.delete_cart_item(itemId)
        
        if success:
            # 削除が成功した場合
            return jsonify({"message": "Item deleted successfully"}), 200
        else:
            # 削除が失敗した場合
            return jsonify({"message": "Item not found or error occurred"}), 404
    return jsonify({"message": "Invalid request method"}), 405

@app.route('/api/update-delivery-status', methods=['POST'])
def update_delivery_status():
    data = request.json
    order_item_id = data.get('order_item_id')
    new_status = data.get('new_status')
    userId = data.get('userId')
    # MySQLから画像データを取得
    success = MysqlClass.update_delivery_status(order_item_id, new_status, userId)
    if success:
        return jsonify({"message": "Item update successfully"}), 200
    else:
        return jsonify({"message": "Item not found or error occurred"}), 404
    
@app.route('/api/update-user-info', methods=['POST'])
def update_user_info():
    data = request.json
    userId = data.get('user_id')
    address = data.get('address')
    paymentMethod = data.get('paymentMethod')
    
    # MySQLから画像データを取得
    success = MysqlClass.update_user_info(userId, address, paymentMethod)
    if success:
        return jsonify({"message": "Item update successfully"}), 200
    else:
        return jsonify({"message": "Item not found or error occurred"}), 404
    
@app.route('/api/get-user-info', methods=['POST'])
def get_user_info():
    data = request.json
    userId = data.get('user_id')
    # MySQLからユーザー情報を取得
    result = MysqlClass.get_user_info(userId)
    if result:
        # 結果を整形して返す
        item = result[0]  # 配列の最初の要素を取得
        item_data = {
            "email": item[0],
            "username": item[1],
            "address": item[2],
            "paymentMethod": item[3],
        }
        return jsonify(item_data), 200
    else:
        return jsonify({"message": "No user_info found or error occurred"}), 404

# GET order-item
@app.route('/api/all-orders', methods=['POST'])
def get_all_orders():
    # MySQLから画像データを取得
    result = MysqlClass.get_all_orders()
    if result:
        
        # Format the result
        formatted_result = []
        for item in result:
            # 画像データをBase64エンコード
            image_base64 = base64.b64encode(item[5]).decode('utf-8') if item[5] else None
             # `order_date`をISOフォーマットに変換
            order_date_iso = item[0].isoformat() if isinstance(item[0], datetime) else item[0]
            item_data = {
                "order_date": order_date_iso,
                "tracking_number": item[1],
                "product_id": item[2],
                "quantity": item[3],
                "unitPrice": item[4],
                "image": image_base64,
                "delivery_status": item[6],     
                "shipping_address":item[7],
                "user_id":item[8],
                "order_item_id":item[9],
                "Editor":item[10],
            }
            formatted_result.append(item_data)
        return jsonify({"order_items": formatted_result}), 200
    else:
        return jsonify({"message": "No cart items found or error occurred"}), 404
    
# GET order-item
@app.route('/api/order-items', methods=['POST'])
def get_oder_items():
    data = request.get_json()  # JSON 形式のリクエストデータを取得
    user_id = data.get('user_id') 
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    # MySQLから画像データを取得
    result = MysqlClass.get_order_item(user_id)
    if result:
        
        # Format the result
        formatted_result = []
        for item in result:
            # 画像データをBase64エンコード
            image_base64 = base64.b64encode(item[5]).decode('utf-8') if item[5] else None
             # `order_date`をISOフォーマットに変換
            order_date_iso = item[0].isoformat() if isinstance(item[0], datetime) else item[0]
            item_data = {
                "order_date": order_date_iso,
                "tracking_number": item[1],
                "product_id": item[2],
                "quantity": item[3],
                "unitPrice": item[4],
                "image": image_base64,
                "delivery_status": item[6],     
            }
            formatted_result.append(item_data)
        return jsonify({"order_items": formatted_result}), 200
    else:
        return jsonify({"message": "No cart items found or error occurred"}), 404

@app.route('/api/user-addresses', methods=['POST', 'PUT'])
def manage_user_addresses():
    if request.method == 'POST':
        data = request.get_json()
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        # ここで MySQL からユーザーの住所データを取得
        result = MysqlClass.get_user_address(user_id)
        if result:
            # Format the result
            item_data = {
                "address": result[0],
                "payment_method": result[1],
            }
            return jsonify(item_data)
        else:
            return jsonify({"message": "No cart items found or error occurred"}), 404

    if request.method == 'PUT':
        data = request.get_json()
        user_id = data.get('user_id')
        address = data.get('address')
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        # ここで MySQL で住所を更新
        success = MysqlClass.update_address(user_id, address)
        if success:
            return jsonify({"message": "Update address successfully"}), 200
        else:
            return jsonify({"message": "Address not found or error occurred"}), 404

# カートアイテムを取得するエンドポイント
@app.route('/api/cart-items', methods=['POST','PUT'])
def get_cart_items():
    if request.method == 'POST':
        data = request.get_json()  # JSON 形式のリクエストデータを取得
        user_id = data.get('user_id') 
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400

        # MySQLから画像データを取得
        result = MysqlClass.get_cart_item(user_id)
        
        if result:
            
            # Format the result
            formatted_result = []
            for item in result:
                # 画像データをBase64エンコード
                image_base64 = base64.b64encode(item[3]).decode('utf-8') if item[3] else None
                item_data = {
                    "user_id": item[0],
                    "quantity": item[1],
                    "product_id": item[2],
                    "image": image_base64,
                    "unitPrice": item[4],
                    "content": item[5],
                    "cart_item_id": item[6],
                    "quantity_title": item[7],
                    "cart_id": item[8]

                }
                formatted_result.append(item_data)
            return jsonify({"cart_items": formatted_result}), 200
        else:
            return jsonify({"message": "No cart items found or error occurred"}), 404
    if request.method == 'PUT':
            data = request.get_json()  # JSON 形式のリクエストデータを取得
            cartItemId = data.get('cartItemId')
            quantity = data.get('quantity')

            # データベースから再計算した合計金額を取得
            success = MysqlClass.update_quantity(cartItemId, quantity)
            if success:
                return jsonify({"message": "Item update successfully"}), 200
            else:
                return jsonify({"message": "Item not found or error occurred"}), 404

#login
@app.route('/api/dangnhap', methods=['POST'])
# @csrf.exempt
def login():
    if request.method == 'POST':
        data = request.get_json()  # JSON 形式のリクエストデータを取得
        email = data.get('email')  
        password = data.get('password')
        isRegister = data.get('isRegister')
        
        #Register Acount
        if isRegister == True:
            User.create_user(email, password)
            return jsonify({"message": "Success"}), 200
        #Login
        else:
            email = data.get('email')  # データが存在する場合に取得
            password = data.get('password')

            if email is None or password is None:
                return jsonify({'error': 'Missing email or password'}), 400
            
            user = User.get(email)

            if user is None:
                return jsonify({'error': 'User not found'}), 404
            
            if User.check_password(user.password_hash, password):
                session['id'] = user.id
                session['role'] = user.role
                # 役割に応じたリダイレクト処理
                if user.role == 'admin':
                    return jsonify({
                        'status': 'success',
                        'role': user.role,
                        'userID': user.id,
                        'redirect_url': url_for('get_tasks')
                    })
                elif user.role == 'viewer':
                    return jsonify({
                        'status': 'success',
                        'role': user.role,
                        'userID': user.id,
                        'redirect_url': url_for('get_tasks')
                    })
                elif user.role == 'delivery':
                    return jsonify({
                        'status': 'success',
                        'role': user.role,
                        'userID': user.id,
                        'redirect_url': url_for('get_tasks')
                    })
                elif user.role == 'picker':
                    return jsonify({
                        'status': 'success',
                        'role': user.role,
                        'userID': user.id,
                        'redirect_url': url_for('get_tasks')
                    })
            else:
                return jsonify({"error": "Invalid password"}), 403
            

#deletetask
@app.route('/api/deletetask/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    if mySql:
        # MySQLから画像データを取得
        success = MysqlClass.delete_task(task_id)
        if success:
            return jsonify({"message": "Task deleted successfully"}), 200
        else:
            return jsonify({"message": "Task not found or error occurred"}), 404
    else:
        task = Todo.query.get_or_404(task_id)
        
        for image in task.images:
            db.session.delete(image)
        for comment in task.comments:
            db.session.delete(comment)
    
        db.session.delete(task)
        db.session.commit()
       
        return '', 204
#deleteimag
@app.route('/api/images/<int:id>', methods=['DELETE'])
def delete_image(id):
    if mySql:
        # MySQLから画像データを取得
        success = MysqlClass.delete_image(id)
        if success:
            return jsonify({"message": "Task deleted successfully"}), 200
        else:
            return jsonify({"message": "Task not found or error occurred"}), 404
    else:
        image = Image.query.get(id)
        if image:
            db.session.delete(image)
            db.session.commit()
            return jsonify({'message': 'Image deleted successfully'}), 200
        else:
            return jsonify({'error': 'Image not found'}), 404
    
#updatecomment,deletecomment    
@app.route('/api/comment/<int:comment_id>', methods=['PUT', 'DELETE'])
def modify_comment(comment_id):
    if mySql:
        if request.method == 'PUT':
            data = request.json
            content = data['content']
            success = MysqlClass.update_comment(comment_id,content)
            if success:
                return jsonify({"message": "Task deleted successfully"}), 200
            else:
                return jsonify({"message": "Task not found or error occurred"}), 404
        elif request.method == 'DELETE':
            # MySQLから画像データを取得
            success = MysqlClass.delete_comment(comment_id)
            if success:
                return jsonify({"message": "Task deleted successfully"}), 200
            else:
                return jsonify({"message": "Task not found or error occurred"}), 404
    else:
        comment = Comment.query.get_or_404(comment_id)

        if request.method == 'PUT':
            data = request.json
            comment.content = data['content']
            db.session.commit()
            return jsonify({'message': 'Comment updated successfully'}), 200

        elif request.method == 'DELETE':
            db.session.delete(comment)
            db.session.commit()
            return jsonify({'message': 'Comment deleted successfully'}), 200

@app.route('/detail/<int:id>', methods=['GET', 'POST'])
def detail(id):
    todo = Todo.query.get_or_404(id)
    comment_form = CommentForm()
    
    if request.method == 'POST':
        if 'update_task' in request.form:
            todo.content = request.form['content']
            todo.description = request.form['description']
            todo.due_date = datetime.strptime(request.form['due_date'], '%Y-%m-%dT%H:%M')
            db.session.commit()
            return redirect(url_for('detail', id=id))
        
        elif 'add_comment' in request.form:
            if comment_form.validate_on_submit():
                new_comment = Comment(content=comment_form.content.data, todo_id=id)
                db.session.add(new_comment)
                db.session.commit()
                return redirect(url_for('detail', id=id))
            return redirect(url_for('detail', id=id))

    comments = Comment.query.filter_by(todo_id=id).order_by(Comment.created_at.desc()).all()

    for comment in comments:
        offset = timedelta(hours=9)
        comment.created_at_local = (comment.created_at + offset).strftime('%Y-%m-%d %H:%M:%S')
    
    return render_template('detail.html', todo=todo, form=comment_form, comments=comments)

@app.errorhandler(Exception)
def handle_exception(e):
    # エラーの詳細をログに出力
    import traceback
    app.logger.error(f"Exception: {str(e)}")
    app.logger.error(traceback.format_exc())
    return jsonify(error=str(e)), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    # HTTPS 用にサーバーの証明書と秘密鍵を指定
    # context = (
    #     'server.crt',
    #     'server.key'
    # )
    # HTTPS サーバーを起動
    app.run(host='0.0.0.0', port=5000)




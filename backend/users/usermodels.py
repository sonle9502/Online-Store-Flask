import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash

class User:
    def __init__(self, id, email, password_hash=None, role=None):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.role = role

    @staticmethod
    def connect_db():
        return mysql.connector.connect(
            host="localhost",
            user="FlaskDB",
            password="Future0308",
            database="tododb",
            charset='utf8mb4'
        )

    @staticmethod
    def get_db_connection():
        return User.connect_db()

    @staticmethod
    def get(email):
        connection = User.get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT id, email, password_hash ,role FROM users WHERE email = %s', (email,))
        user = cursor.fetchone()
        connection.close()
        if user:
            return User(user['id'], user['email'], user['password_hash'], user['role'])
        return None

    @staticmethod
    def create_user(email, password):
        connection = User.get_db_connection()
        cursor = connection.cursor()
        password_hash = generate_password_hash(password)
        cursor.execute('INSERT INTO users (email, password_hash) VALUES (%s, %s)', (email, password_hash))
        connection.commit()
        user_id = cursor.lastrowid
        connection.close()
        return user_id

    @staticmethod
    def update_user(user_id, email=None, password=None):
        connection = User.get_db_connection()
        cursor = connection.cursor()
        if email:
            cursor.execute('UPDATE users SET email = %s WHERE id = %s', (email, user_id))
        if password:
            password_hash = generate_password_hash(password)
            cursor.execute('UPDATE users SET password_hash = %s WHERE id = %s', (password_hash, user_id))
        connection.commit()
        connection.close()

    @staticmethod
    def delete_user(user_id):
        connection = User.get_db_connection()
        cursor = connection.cursor()
        cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
        connection.commit()
        connection.close()

    def check_password(password_hash, password):
        return check_password_hash(password_hash, password)

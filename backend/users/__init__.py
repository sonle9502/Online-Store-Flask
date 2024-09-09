from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector

# MySQLの接続設定
db_config = {
    'user': 'your_user',
    'password': 'your_password',
    'host': 'localhost',
    'database': 'your_database'
}

def get_db_connection():
    connection = mysql.connector.connect(**db_config)
    return connection

class User:
    def __init__(self, id, email, password_hash=None):
        self.id = id
        self.email = email
        self.password_hash = password_hash

    @staticmethod
    def get(user_id):
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT id, email, password_hash FROM user WHERE id = %s', (user_id,))
        user = cursor.fetchone()
        connection.close()
        if user:
            return User(user['id'], user['email'], user['password_hash'])
        return None

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

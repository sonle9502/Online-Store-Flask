from flask_sqlalchemy import SQLAlchemy
from flask import current_app
from .sqlwrite import GenStringSQL
import MySQLdb
import json
from MySQLdb.cursors import DictCursor  # Import DictCursor for dictionary-style results
from datetime import datetime

class MysqlClass:
    # SQLAlchemyのインスタンス
    mysql_db = SQLAlchemy()

    @classmethod
    def connect_db(cls):
        # SQLAlchemyから接続情報を抽出する（例: `mysql+mysqldb://`を使う）
        return MySQLdb.connect(
            host="localhost",
            user="FlaskDB",
            password="Future0308",
            db="tododb",
            charset='utf8mb4'
        )
    
    @classmethod
    def create_order(cls, user_id, total_amount):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # 注文を作成するクエリ
                sql = "INSERT INTO orders (user_id, total_amount, status) VALUES (%s, %s, 'completed')"
                cursor.execute(sql, (user_id, total_amount))
                connection.commit()
                return cursor.lastrowid  # 新しい注文のIDを返す
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()  # トランザクションのロールバック
            return None
        finally:
            connection.close()

    @classmethod
    def delete_items_from_cart(cls, user_id):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # カートアイテムを削除するクエリ
                sql = "DELETE FROM cart_item WHERE cart_id IN (SELECT cart_id FROM cart WHERE user_id = %s)"
                cursor.execute(sql, (user_id,))
                connection.commit()
                return True
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return False
        finally:
            connection.close()

    @classmethod
    def move_items_to_order(cls, user_id, order_id):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # カートのアイテムを注文アイテムに移行するクエリ
                sql = """
                    INSERT INTO order_items (order_id, product_id, quantity, price)
                    SELECT %s, ci.item_id, ci.quantity, t.unitPrice
                    FROM cart_item ci
                    JOIN cart c ON ci.cart_id = c.cart_id
                    JOIN todo t ON ci.item_id = t.id
                    WHERE c.user_id = %s
                """
                cursor.execute(sql, (order_id, user_id))
                connection.commit()
                return True
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return False
        finally:
            connection.close()

    @classmethod
    def get_total_amount(cls, user_id):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                sql = """
                    SELECT 
                        CAST(SUM(ci.quantity * t.unitPrice) AS UNSIGNED) AS total_amount  -- 合計金額を整数に変換
                    FROM 
                        cart c
                    JOIN 
                        cart_item ci ON c.cart_id = ci.cart_id
                    JOIN 
                        todo t ON ci.item_id = t.id
                    WHERE 
                        c.user_id = %s
                    GROUP BY 
                        c.user_id;
                """
                cursor.execute(sql, (user_id,))  # Note the comma to create a tuple
                connection.commit()
                
                # Fetch results
                result = cursor.fetchall()  # Use fetchall() to retrieve all rows
                total_amount = result[0][0]
                return total_amount
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()  # トランザクションのロールバック
            return None
        finally:
            connection.close()

    @classmethod
    def delete_cart_item(cls, itemId):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                sql = "DELETE FROM cart_item WHERE cart_item_id = %s;"
                cursor.execute(sql, (itemId,))
                connection.commit()
                return cursor.rowcount  # 削除された行数を返す
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()  # トランザクションのロールバック
            return None
        finally:
            connection.close()
    @classmethod
    def get_cart_item(cls, user_id):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                sql = """
                    SELECT 
                    c.user_id,
                    ci.quantity,
                    ci.item_id AS product_id,
                    i.data as image,
                    t.unitPrice,
                    t.content,
                    ci.cart_item_id,
                    t.quantity_title,
                    ci.cart_id
                    FROM 
                        cart c
                    JOIN 
                        cart_item ci ON c.cart_id = ci.cart_id
                    JOIN 
                        image i ON ci.item_id = i.todo_id  -- cart_item.item_id と image.todo_id をマッピング
                    JOIN 
	                    todo t ON ci.item_id = t.id	
                    WHERE 
                        c.user_id = %s;
                """
                cursor.execute(sql, (user_id,))  # Note the comma to create a tuple
                connection.commit()
                
                # Fetch results
                result = cursor.fetchall()  # Use fetchall() to retrieve all rows
                return result
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()  # トランザクションのロールバック
            return None
        finally:
            connection.close()

    @classmethod
    def cart(cls, user_id, product_id, quantity):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # 既存のアクティブなカートがあるかをチェック
                sql_check_cart = """
                    SELECT cart_id FROM cart 
                    WHERE user_id = %s AND status = 'active'
                    LIMIT 1
                """
                cursor.execute(sql_check_cart, (user_id,))
                result = cursor.fetchone()

                if result:
                    # アクティブなカートが存在する場合、そのIDを使用
                    cart_id = result[0]
                    print(f"Existing active cart found with ID: {cart_id}")
                else:
                    # アクティブなカートが存在しない場合、新しいカートを作成
                    sql_create_cart = "INSERT INTO cart (user_id, status) VALUES (%s, 'active')"
                    cursor.execute(sql_create_cart, (user_id,))
                    connection.commit()
                    cart_id = cursor.lastrowid  # 新しく作成されたカートのIDを取得
                    print(f"New cart created with ID: {cart_id}")

                # カートアイテムを追加
                sql_add_item = """
                    INSERT INTO cart_item (cart_id, item_id, quantity)
                    VALUES (%s, %s, %s)
                """
                cursor.execute(sql_add_item, (cart_id, product_id, quantity))
                connection.commit()

                return cart_id  # カートのIDを返す

        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()

    @classmethod
    def upload_image(cls, filename, todo_id, image_data):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                sql = "INSERT INTO image (filename, todo_id, data) VALUES (%s, %s, %s)"
                image_data = image_data[0]
                cursor.execute(sql, (filename, todo_id, image_data))
                connection.commit()
                return cursor.lastrowid
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()  # トランザクションのロールバック
            return None
        finally:
            connection.close()

    @classmethod
    def update_unitPrice(cls, task_id, new_price):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                sql = """
                        UPDATE todo
                        SET unitPrice = %s
                        WHERE id = %s;
                    """
                cursor.execute(sql, (new_price, task_id))
                connection.commit()
                return cursor.lastrowid
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()  # トランザクションのロールバック
            return None
        finally:
            connection.close()

    @classmethod
    def search(cls, query):
        connection = cls.connect_db()
        try:
            with connection.cursor(MySQLdb.cursors.DictCursor) as cursor:
                # 検索クエリの準備
                search_pattern = f"%{query}%"
                select_sql = """
                SELECT 
    t.id AS id,
    t.content AS content,
    t.description AS description,
    t.created_at,
    t.due_date,
    JSON_ARRAYAGG(
        JSON_OBJECT('id', i.id, 'filename', i.filename)
    ) AS images,
    JSON_ARRAYAGG(
        JSON_OBJECT('id', c.id, 'content', c.content)
    ) AS comments
FROM 
    todo t
LEFT JOIN 
    image i ON t.id = i.todo_id
LEFT JOIN 
    comment c ON t.id = c.todo_id
WHERE 
    t.description LIKE %s OR t.content LIKE %s
GROUP BY 
    t.id;

                """
                cursor.execute(select_sql, (search_pattern, search_pattern))
                results = cursor.fetchall()
                
                # JSON文字列を辞書形式に変換（存在する場合）
                # フィールドの形式を修正
                results = cls.delete_multi(results)
                return results
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()

    @classmethod
    def delete_image(cls, image_id):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # Insert a new comment associated with the todo_id
                insert_sql = """
                DELETE FROM image
                WHERE id = %s;
                """
                cursor.execute(insert_sql, (image_id,))

                # Commit the transaction to save the new comment
                connection.commit()
                return 200
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()

    @classmethod
    def delete_comment(cls, comment_id):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # Insert a new comment associated with the todo_id
                insert_sql = """
                DELETE FROM comment
                WHERE id = %s;
                """
                cursor.execute(insert_sql, (comment_id,))

                # Commit the transaction to save the new comment
                connection.commit()
                return 200
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()

    @classmethod
    def add_comment(cls, todo_id, new_comment):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # Insert a new comment associated with the todo_id
                insert_sql = """
                INSERT INTO comment (todo_id, content)
                VALUES (%s, %s);
                """
                cursor.execute(insert_sql, (todo_id, new_comment))

                # Commit the transaction to save the new comment
                connection.commit()
                return 200
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()

    @classmethod
    def update_comment(cls, comment_id, content):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # Insert a new comment associated with the todo_id
                insert_sql = """
                UPDATE comment
                SET content = %s
                WHERE id = %s;
                """
                cursor.execute(insert_sql, (content, comment_id))
                # Commit the transaction to save the new comment
                connection.commit()
                return 200
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()
            
    @classmethod
    def update_task(cls, id, content, description, due_date):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # Define the SQL query
                sql = """
                UPDATE todo
                SET 
                    content = %s,
                    description = %s,
                    due_date = %s
                WHERE id = %s;
                """
                # Execute the query with the provided values
                cursor.execute(sql, (content, description, due_date, id))
                # Commit the transaction to save the changes
                connection.commit()
                return 200
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()
    
    @classmethod
    def get_image(cls, image_id):
        connection = cls.connect_db()
        try:
            with connection.cursor(MySQLdb.cursors.DictCursor) as cursor:
                sql = "SELECT * FROM image WHERE id = %s"  # テーブル名が正しいか確認
                cursor.execute(sql, (image_id,))
                result = cursor.fetchone()
                return result
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            return None
        except Exception as e:  # 一般的な例外もキャッチ
            print(f"Unexpected error: {e}")
            return None
        finally:
            connection.close()

    @classmethod
    def delete_task(cls, task_id):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # Delete the task itself
                sql_task = "DELETE FROM todo WHERE id = %s"
                cursor.execute(sql_task, (task_id,))
                # Check if any row was affected
                if cursor.rowcount == 0:
                    return False  # No row deleted, task not found
            connection.commit()
            return True  # Task successfully deleted
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return False  # Error occurred during deletion
        finally:
            connection.close()

    @classmethod
    def get_all_data(cls):
        connection = cls.connect_db()
        try:
            with connection.cursor(MySQLdb.cursors.DictCursor) as cursor:
                sql = GenStringSQL.sqlstring("all_data")
                cursor.execute(sql)
                results = cursor.fetchall()
                results = cls.delete_multi(results)
                # # JSON文字列を辞書形式に変換
                # for record in results:
                #     # 'images'のJSON文字列を辞書形式に変換し、idがNoneのアイテムを削除し、重複を除去
                #     if 'images' in record and record['images']:
                #         try:
                #             record['images'] = json.loads(record['images'])
                #             # 'id'がNoneのアイテムを削除
                #             record['images'] = [image for image in record['images'] if image.get('id') is not None]
                #             # 'id'で重複を除去
                #             seen_ids = set()
                #             unique_images = []
                #             for image in record['images']:
                #                 if image['id'] not in seen_ids:
                #                     seen_ids.add(image['id'])
                #                     unique_images.append(image)
                #             record['images'] = unique_images
                #         except json.JSONDecodeError as e:
                #             print(f"Failed to decode 'images' for record id {record.get('id')}: {e}")
                #             record['images'] = []

                #     # 'comments'のJSON文字列を辞書形式に変換し、idがNoneのアイテムを削除し、重複を除去
                #     if 'comments' in record and record['comments']:
                #         try:
                #             record['comments'] = json.loads(record['comments'])
                #             # 'id'がNoneのアイテムを削除
                #             record['comments'] = [comment for comment in record['comments'] if comment.get('id') is not None]
                #             # 'id'で重複を除去
                #             seen_ids = set()
                #             unique_comments = []
                #             for comment in record['comments']:
                #                 if comment['id'] not in seen_ids:
                #                     seen_ids.add(comment['id'])
                #                     unique_comments.append(comment)
                #             # 新しい順にソート
                #             unique_comments.sort(key=lambda x: x['id'], reverse=True)
                #             record['comments'] = unique_comments
                #         except json.JSONDecodeError as e:
                #             print(f"Failed to decode 'comments' for record id {record.get('id')}: {e}")
                #             record['comments'] = []


                return results
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            return None
        finally:
            connection.close()
    
    @classmethod
    def add_task(cls, content, description, due_date_str, quantity_title):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                # Define the SQL query
                sql = """
                    INSERT INTO todo (content, description, due_date, created_at, quantity_title)
                    VALUES (%s, %s, %s, NOW(), %s);
                """
                # Execute the query with the provided values
                cursor.execute(sql, (content, description, due_date_str, quantity_title))
                # Commit the transaction
                connection.commit()
                # Return the ID of the newly inserted task
                return cursor.lastrowid
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            connection.rollback()
            return None
        finally:
            connection.close()

    @classmethod
    def get_task_detail(cls, id):
        connection = cls.connect_db()
        try:
            with connection.cursor(MySQLdb.cursors.DictCursor) as cursor:
                sql = GenStringSQL.sqlstring("only_task")
                cursor.execute(sql,(id,))
                results = cursor.fetchall()
                
                # JSON文字列を辞書形式に変換し、NULLや空の場合に対応
            for record in results:
                if 'images' in record:
                    record['images'] = json.loads(record['images']) if record['images'] else []
                if 'comments' in record:
                    record['comments'] = json.loads(record['comments']) if record['comments'] else []
                
                return results
        except MySQLdb.MySQLError as e:
            print(f"Error: {e}")
            return None
        finally:
            connection.close()

    @classmethod
    def add_user(cls, name, email):
        connection = cls.connect_db()
        try:
            with connection.cursor() as cursor:
                sql = "INSERT INTO User (name, email) VALUES (%s, %s)"
                cursor.execute(sql, (name, email))
                connection.commit()
        except MySQLdb.MySQLError as e:
            # エラー処理
            print(f"Error: {e}")
            connection.rollback()
        finally:
            connection.close()

    @classmethod
    def delete_multi(cls,results):
        # JSON文字列を辞書形式に変換
        for record in results:
            # 'images'のJSON文字列を辞書形式に変換し、idがNoneのアイテムを削除し、重複を除去
            if 'images' in record and record['images']:
                try:
                    record['images'] = json.loads(record['images'])
                    # 'id'がNoneのアイテムを削除
                    record['images'] = [image for image in record['images'] if image.get('id') is not None]
                    # 'id'で重複を除去
                    seen_ids = set()
                    unique_images = []
                    for image in record['images']:
                        if image['id'] not in seen_ids:
                            seen_ids.add(image['id'])
                            unique_images.append(image)
                    record['images'] = unique_images
                except json.JSONDecodeError as e:
                    print(f"Failed to decode 'images' for record id {record.get('id')}: {e}")
                    record['images'] = []

            # 'comments'のJSON文字列を辞書形式に変換し、idがNoneのアイテムを削除し、重複を除去
            if 'comments' in record and record['comments']:
                try:
                    record['comments'] = json.loads(record['comments'])
                    # 'id'がNoneのアイテムを削除
                    record['comments'] = [comment for comment in record['comments'] if comment.get('id') is not None]
                    # 'id'で重複を除去
                    seen_ids = set()
                    unique_comments = []
                    for comment in record['comments']:
                        if comment['id'] not in seen_ids:
                            seen_ids.add(comment['id'])
                            unique_comments.append(comment)
                    # 新しい順にソート
                    unique_comments.sort(key=lambda x: x['id'], reverse=True)
                    record['comments'] = unique_comments
                except json.JSONDecodeError as e:
                    print(f"Failed to decode 'comments' for record id {record.get('id')}: {e}")
                    record['comments'] = []
        return results


    @classmethod
    def init_app(cls, app):
        cls.mysql_db.init_app(app)

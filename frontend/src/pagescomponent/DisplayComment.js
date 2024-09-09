import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './DisplayComment.css'; // CSSファイルをインポート

const DisplayComment = ({ comment, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment?.content || ''); // nullチェックを追加
  const inputRef = useRef(null);
  const [likes, setLikes] = useState(0);
  const [showMenu, setShowMenu] = useState(false); // メニューの表示状態
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 }); // メニューの位置
  const commentRef = useRef(null); // コメント要素の参照
  const menuRef = useRef(null); // メニューの参照

  // CSRFトークンを取得して状態にセットする関数
  const fetchCsrfToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
      method: 'GET',
      credentials: 'include'  // クッキーをサーバーと一緒に送信
    });
  
    if (response.ok) {
      const data = await response.json();
      console.log(data)
      return data.csrf_token;
    } else {
      throw new Error('CSRF token is not found in response');
    }
  };

  // メニューの外側をクリックした時に閉じる
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        showMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setShowMenu(false); // メニューを閉じる
      }
    };

    document.addEventListener('mousedown', handleOutsideClick); // 'mousedown'イベントを使用
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick); // クリーンアップ
    };
  }, [showMenu]);

  // コメントのオプションメニューを表示
  const handleCommentClick = (event) => {
    event.stopPropagation(); // イベントバブリングを停止して親要素への伝搬を防ぐ
    setShowMenu((prevShowMenu) => !prevShowMenu);

    if (commentRef.current && menuRef.current) {
      const commentRect = commentRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect(); // メニューのサイズを取得
    
      setMenuPosition({
        x: commentRect.left + window.scrollX + (commentRect.width - menuRect.width) / 2, // コメントの中央にメニューを配置
        y: commentRect.top + window.scrollY + (commentRect.height - menuRect.height) / 2, // コメントの中央にメニューを配置
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(comment.content); // クリップボードにコピー
    setShowMenu(false); // メニューを閉じる
  };

  const onLike = () => {
    setLikes(likes + 1);
    // 必要に応じて、ここでAPI呼び出しなどのロジックを追加
    console.log(`Liked comment with ID: ${comment.id}`);
  };

  // 編集モードにする
  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  // 編集を保存する
const handleSave = async () => {
  // CSRF トークンを取得
  const csrfToken = await fetchCsrfToken();

  if (!csrfToken) {
    console.error('CSRF token is missing');
    return;
  }

  if (!comment.id) {
    alert('コメントIDが無効です。編集を保存できません。');
    return;
  }

  try {
    await axios.put(
      `${API_BASE_URL}/api/comment/${comment.id}`,
      { content: editedContent },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken, // CSRFトークンをヘッダーに追加
        },
        withCredentials: true, // クッキーを送信するためのオプションを追加
      }
    );

    setIsEditing(false);
    onUpdate(); // タスクデータの再取得や状態の更新
  } catch (error) {
    console.error('Error updating comment:', error);
  }
};


  // 編集をキャンセルする
  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(comment.content); // 編集をキャンセルした場合、元のコンテンツにリセット
  };

  // コメントを削除する
  const handleDelete = async () => {
    if (!comment.id) {
      alert('コメントIDが無効です。削除できません。');
      return;
    }

    const confirmed = window.confirm('このコメントを削除してもよろしいですか？');
    // CSRF トークンを取得
    const csrfToken = await fetchCsrfToken();

    if (!csrfToken) {
      console.error('CSRF token is missing');
      return;
    }
    if (confirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/comment/${comment.id}`, {
          headers: {
            'X-CSRFToken': csrfToken, // CSRFトークンをヘッダーに追加
          },
          withCredentials: true, // クッキーを送信するためのオプションを追加
        });

        onDelete(comment.id); // 親コンポーネントに削除完了を通知
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  // 編集状態の際にフォーカスを設定
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.selectionStart = inputRef.current.value.length;
    }
  }, [isEditing]);

  // コメントがない場合の表示
  if (!comment) {
    return <p className="no-comment">コメントがありません</p>;
  }

  if (!comment.id) {
    return <p className="no-comment">コメントIDがありません</p>;
  }

  return (
    <div className="card comment-card">
      <div className="card-body">
        {isEditing ? (
          <div>
            <input
              type="text"
              className="form-control comment-content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              ref={inputRef}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave(); // Enterキーが押されたら保存
                }
              }}
            />
            <div className="edit-buttons">
              <button onClick={handleSave} className="btn btn-success">Save</button>
              <button onClick={handleCancel} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <p
              className="card-text comment-content"
              onClick={handleCommentClick} // コメントをクリックしてメニューを表示
              ref={commentRef}
            >
              {comment.content}
            </p>
            
            <div className="">
              
              <button 
                className="btn btn-success me-2"
                onClick={onLike}
              >
                👍 Like
              </button>
              <span className="timestamp">{comment.created_at}</span>
            </div>
          </>
        )}
      </div>
      {/* メニューウィンドウ */}
      {showMenu && (
        <div
          ref={menuRef} // メニューの参照を追加
          className="comment-menu"
          style={{
            position: 'absolute',
            top: `${menuPosition.y}px`,
            left: `${menuPosition.x}px`,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            padding: '8px',
            borderRadius: '4px',
            zIndex: 1000,
          }}
        >
          <button onClick={handleEdit} className="btn btn-secondary">Edit</button>
          <button onClick={handleDelete} className="btn btn-danger">Delete</button>
          <button onClick={handleCopy} className="btn btn-info">Copy</button>
        </div>
      )}
    </div>
  );
};

export default DisplayComment;

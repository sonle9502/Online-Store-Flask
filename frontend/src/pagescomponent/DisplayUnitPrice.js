import React, { useState, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const DisplayUnitPrice = ({ taskId, unitPrice, onSave }) => {
  const [price, setPrice] = useState(unitPrice);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);
  const [role] = useState(localStorage.getItem('role') || '');

  // CSRFトークンを取得して状態にセットする関数
  const fetchCsrfToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
      method: 'GET',
      credentials: 'include' // クッキーをサーバーと一緒に送信
    });

    if (response.ok) {
      const data = await response.json();
      return data.csrf_token;
    } else {
      throw new Error('CSRF token is not found in response');
    }
  };

  // 更新された価格をデータベースに保存する関数
  const saveUnitPriceToDatabase = async (newPrice) => {
    try {
      const csrfToken = await fetchCsrfToken(); // CSRFトークンを取得

      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/tasks/${taskId}/price`,
        { unitPrice: newPrice },
        {
          headers: {
            'Content-Type': 'application/json', // JSONのContent-Typeを指定
            'X-CSRFToken': csrfToken, // 正しいCSRFトークンヘッダーキーを使用
          },
          withCredentials: true, // リクエストと一緒にクッキーを送信
        }
      );

      if (response.status === 200) {
        onSave(newPrice); // 成功時にローカル状態を更新
      } else {
        console.error('Failed to update unit price:', response.status, response.data);
      }
    } catch (error) {
      console.error('Error updating unit price:', error);
    }
  };

  const handleBlur = async () => {
    await saveUnitPriceToDatabase(price); // 更新された価格を保存
    setIsEditing(false); // 編集モードを終了
  };

  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value); // 入力された値を数値に変換
    setPrice(newPrice); // 状態を更新
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(price);
  };

  return (
    <div className="unit-price-container">
      {isEditing && role === 'admin' ? (
        <input
          type="number"
          className="unit-price-input"
          ref={inputRef}
          value={price}
          onBlur={handleBlur} // 編集が終わった際に保存
          onChange={handlePriceChange} // 価格の変更を処理
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur(); // Enterキーで保存
            }
          }}
        />
      ) : (
        <p
          className="unit-price"
          onClick={() => {
            if (role === 'admin') {
              setIsEditing(true);
              setTimeout(() => {
                inputRef.current?.focus(); // 編集モードに切り替えた後、フォーカスを設定
              }, 0);
            }
          }}
        >
          {formatPrice(price)} {/* フォーマットされた価格を表示 */}
        </p>
      )}
    </div>
  );
};


export default DisplayUnitPrice;

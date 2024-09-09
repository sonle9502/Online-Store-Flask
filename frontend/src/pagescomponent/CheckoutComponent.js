import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios'; // axiosをインポート
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const CheckoutSection = styled.div`
  /* Add your styles here */
`;

const Button = styled.button`
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  color: white;
  background-color: #007bff;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #0056b3;
  }
`;

const CheckoutComponent = ({ taskFlist }) => {
  const taskUnitPrice = taskFlist.unitPrice;
  const quantityTitle = taskFlist.quantity_title; // quantity_titleを取得
  const isTaskAvailable = taskUnitPrice !== undefined;
  const navigate = useNavigate();  // navigateフックを使用

  // 初期状態
  const [customQuantity, setCustomQuantity] = useState('1'); // デフォルトをquantity_titleに設定

  // Custom quantity input change handler
  const handleCustomQuantityChange = (e) => {
    const value = e.target.value;
    if (/^\d+$/.test(value)) { // Check if input is a valid integer
      setCustomQuantity(value);
    }
  };

  // CSRFトークンを取得して状態にセットする関数
  const fetchCsrfToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
      method: 'GET',
      credentials: 'include'  // クッキーをサーバーと一緒に送信
    });
  
    if (response.ok) {
      const data = await response.json();
      return data.csrf_token;
    } else {
      throw new Error('CSRF token is not found in response');
    }
  };

  // カートにアイテムを追加する関数
  const handleAddToCart = async () => { 
    try {
      // CSRF トークンを取得
      const csrfToken = await fetchCsrfToken();

      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }

      // ローカルストレージからユーザーIDを取得
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('User ID is missing');
        return;
      }

      // カートに追加するアイテムのデータを作成
      const cartItem = {
        productID: taskFlist.id,
        unitPrice: taskFlist.unitPrice,
        quantity: customQuantity, // Use custom quantity if provided
        userId: userId,
      };

      // サーバーに POST リクエストを送信
      const response = await axios.post(`${API_BASE_URL}/cart/add`, cartItem, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken // CSRF トークンをヘッダーに追加
        },
        withCredentials: true // クッキーを送信する場合は、これを true に設定
      });

      if (response.status === 200) {
        // 成功した場合の処理
        alert('アイテムがカートに追加されました');
      } else {
        // エラーハンドリング
        console.error('Failed to add item to cart:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding item to cart:', error.message || error);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart(); // データ保存が完了するまで待つ
    navigate('/cart-item');
    window.location.reload(); // ページ全体をリフレッシュ
  };

  // Calculate total
  const total = taskUnitPrice.toLocaleString() * customQuantity;

  return (
    <CheckoutSection>
      <h2>会計</h2>
      {isTaskAvailable ? (
        <>
          <p>Weight: ¥{taskUnitPrice.toLocaleString()} /{quantityTitle}</p>
          
          {/* Custom quantity input */}
          <label>
            Quantity:
            <input
              type="number"
              value={customQuantity}
              onChange={handleCustomQuantityChange}
              placeholder="1"
              min="1"
              style={{ marginLeft: '10px', width: '50px' }} // ここで幅を設定
            />
          </label>

          {/* Total display */}
          <p>Total: ¥{total.toLocaleString()}</p>
          
          {/* Buttons */}
          <div>
            <Button onClick={handleAddToCart}>カートに入れる</Button>
            <Button onClick={handleBuyNow} style={{ backgroundColor: '#28a745' }}>今すぐ買う</Button>
          </div>
        </>
      ) : (
        <p>Task details are not available.</p>
      )}
      <p>ここに会計の詳細が表示されます。</p>
    </CheckoutSection>
  );
};

export default CheckoutComponent;

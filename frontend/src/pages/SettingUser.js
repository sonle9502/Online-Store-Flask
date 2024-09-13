import React, { useState, useEffect } from 'react';
import Header from '../ComponentsAmind/Header1';
import styled from 'styled-components';
import { API_BASE_URL } from '../config';

const Container = styled.div`
  padding: 80px;
  max-width: 1000px;
  margin: 0 auto;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

const PaymentContainer = styled.li`
  padding: 10px;
  border: 0px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${props => (props.selected ? '#f0f0f0' : '#fff')};
  text-align: left;
`;

const Input = styled.input`
  width: 90%;
  padding: 10px;
  margin-bottom: 0px;
  border: 1px solid #7d7a7a;
  border-radius: 5px;
`;

const Loader = styled.div`
  border: 8px solid #f3f3f3;
  border-top: 8px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
  display: block;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// 決済方法のオプション
const PAYMENT_METHODS = {
  CREDIT_CARD: 'クレジットカード',
  PAYPAL: 'PayPal',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
  BANK_TRANSFER: '銀行振込',
};

const AddressContainer = styled.li`
  padding: 10px;
  border: 0px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${props => (props.selected ? '#f0f0f0' : '#fff')};
  text-align: left;
`;

const EditUserInfo = () => {
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [currentMethod, setCurrentMethod] = useState(PAYMENT_METHODS.CREDIT_CARD); // デフォルトを設定
  const [addressValue, setAddresses] = useState('');
  const [isLoading, setIsLoading] = useState(true); // フェッチ中かどうかの状態
  const [error, setError] = useState(null); // エラー状態の管理

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.csrf_token;
      } else {
        throw new Error('CSRF token is not found in response');
      }
    } catch (error) {
      setError('Failed to fetch CSRF token.');
      console.error('Error fetching CSRF token:', error);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const csrfToken = await fetchCsrfToken();
        if (!csrfToken) {
          console.error('CSRF token is missing');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/get-user-info`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        if (data) {
          setAddresses(data.address || ''); // 住所を設定
          setCurrentMethod(data.paymentMethod || PAYMENT_METHODS.CREDIT_CARD); // 支払い方法がnullの場合、デフォルトを設定
        } 
      } catch (error) {
        setError('Error fetching user information.');
        console.error('Error fetching user information:', error);
      } finally {
        setIsLoading(false); // ローディング状態を解除
      }
    };

    fetchUserInfo();
  }, [userId]);

  const handleSave = async () => {
    if (isLoading) return; // ローディング中はボタンを無効にする

    try {
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/update-user-info`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ user_id: userId, address: addressValue, paymentMethod: currentMethod })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.message) {
        console.log(data.message);
      } else {
        console.error('No message found in response data');
      }
    } catch (error) {
      setError('Error updating user information.');
      console.error('Error updating user information:', error);
    }
  };

  const handleMethodChange = (e) => {
    const newMethod = e.target.value;
    setCurrentMethod(newMethod);
  };

  return (
    <div>
      <Header />
      <Container>
        <h1>ユーザ情報編集</h1>

        {isLoading ? (
          <Loader /> // ローディング中にスピナーを表示
        ) : (
          <>
            {error && <p style={{ color: 'red' }}>{error}</p>} {/* エラーメッセージの表示 */}
            <AddressContainer>
              住所：
              <Input
                type="text"
                value={addressValue}
                onChange={(e) => setAddresses(e.target.value)}
              />
            </AddressContainer>

            <PaymentContainer>
              決済方法:
              <select value={currentMethod} onChange={handleMethodChange} style={{ margin: '0 10px' }}>
                {Object.values(PAYMENT_METHODS).map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </PaymentContainer>
            <Button onClick={handleSave} disabled={isLoading}>Save</Button>
          </>
        )}
      </Container>
    </div>
  );
};

export default EditUserInfo;

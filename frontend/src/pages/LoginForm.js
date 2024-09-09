import React, { useState, useEffect } from 'react';
import './LoginForm.css'; // 必要に応じてスタイルを適用

import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [isRegister, setIsRegister] = useState(false); 
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
        method: 'GET',
        credentials: 'include'  // クッキーをサーバーと一緒に送信
      });
  
      if (response.ok) {
        const data = await response.json();
        return data.csrf_token;
      } else {
        const errorText = await response.text(); // レスポンスの詳細を取得
        console.error('Error fetching CSRF token:', errorText);
        throw new Error('CSRF token is not found in response');
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error.message);
      throw error; // エラーを再スローしてhandleSubmitでキャッチする
    }
  };
  

  // タスクを送信する関数
const handleSubmit = async (event) => {
  event.preventDefault();

  // email, password, isRegister が正しく初期化されているか確認
  const taskData = {
    email,
    password,
    isRegister
  };

  console.log("Sending task data:", taskData);  // デバッグ情報の追加

  try {
    const csrfToken = await fetchCsrfToken();
    if (!csrfToken) {
      console.error('CSRF token is missing');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/dangnhap`, {
      method: 'POST',
      credentials: 'include', // クッキー情報を含めてリクエストを送信
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken // CSRFトークンをヘッダーに追加
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json(); // 成功の場合に JSON データを取得

    // ユーザーの役割を localStorage に保存
    localStorage.setItem('role', data.role);  // サーバーから返されるロールを使用する
    localStorage.setItem('userId', data.userID); 
    console.log('localStorage:', data);

    // ロールに基づいてリダイレクト
    if (data.role === 'admin') {
      navigate('/home', { state: { role: data.role } });
    } else {
      navigate('/home', { state: { role: data.role } });
    }

  } catch (error) {
    console.error('Error:', error);
    setMessage(`ログインに失敗しました: ${error.message}`); // エラーメッセージを状態にセット
  }
};

  return (
    <div className="auth-container">
      <h2 className="auth-title">{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {isRegister && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="auth-input"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-input"
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
        />
        <button type="submit" className="auth-button">
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      {message && <p className="auth-message">{message}</p>}
      <button onClick={() => setIsRegister(!isRegister)} className="toggle-button">
        {isRegister
          ? 'Already have an account? Login'
          : "Don't have an account? Register"}
      </button>
    </div>
  );
}

export default LoginForm;

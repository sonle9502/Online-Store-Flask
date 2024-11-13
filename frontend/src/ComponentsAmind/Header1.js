import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { FaHome } from 'react-icons/fa';
import './Header1.css'; // 必要に応じてスタイルを適用
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const [role] = useState(localStorage.getItem('role') || '');

  // CSRFトークンを取得して状態にセットする関数
  const fetchCsrfToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
      method: 'GET',
      credentials: 'include'  // クッキーをサーバーと一緒に送信
    });
    console.log(API_BASE_URL)
    if (response.ok) {
      const data = await response.json();
      return data.csrf_token;
    } else {
      throw new Error('CSRF token is not found in response');
    }
  };
  
  const handleLogout = async () => {
    const isConfirmed = window.confirm('ログアウトしますか？');
  
    if (isConfirmed) {
      try {
        const csrfToken = await fetchCsrfToken();
        if (!csrfToken) {
          console.error('CSRF token is missing');
          return;
        }
  
        const response = await fetch(`${API_BASE_URL}/api/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',  // クッキーをサーバーと一緒に送信
          body: JSON.stringify({})  // 空の JSON オブジェクトをボディに含める
        });
  
        if (!response.ok) {
          throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
        }
  
        // ローカルストレージとセッションストレージをクリア
        localStorage.clear();  // 全てのlocalStorageをクリア
        sessionStorage.clear();  // 全てのsessionStorageをクリア
        
        // リダイレクト処理を追加
        window.location.href = '/'; 
        console.log('Logged out successfully');
      } catch (error) {
        console.error('Error logging out:', error.message);
      }
    } else {
      console.log('キャンセルされました');
    }
  };

  // ユーザーボタンクリックハンドラ
  const handleUserClick = () => {
    navigate('/user');
  };

  const handleUserSettingClick = () => {
    navigate('/SettingUser');
  };

  const handleCartClick = () => {
    navigate('/cart-item');  // 'navigate.push'
  };

  const handleAllorderClick = () => {
    navigate('/CheckAllOrders');  // 'navigate.push'
  };

  return (
    <div>
      {/* Visible Header Content */}
      <header className="header">
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="d-flex w-100 align-items-center">
            <div className="d-flex">
              <Link
                className="navbar-brand"
                to={{
                  pathname: "/home",
                  state: { role: role }, // ここで状態を渡します
                }}
              >
                <FaHome size={24} />  {/* Using FaHome icon from react-icons */}
                Home
              </Link>
              <a className="navbar-brand" href="/handwritten">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-pen"
                  viewBox="0 0 16 16"
                >
                  <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z"/>
                </svg>
                手書き
              </a>
              <a className="navbar-brand" href="/kanjihandwriting">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-pen"
                  viewBox="0 0 16 16"
                >
                  <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001zm-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708l-1.585-1.585z"/>
                </svg>
                漢字手書き
              </a>
            </div>
              
            <div className="d-flex ml-auto">
              {role !== 'viewer' && (
                  <div className="mr-2">
                    <button className="btn btn-outline-primary" onClick={handleAllorderClick}>
                      All Order
                    </button>
                  </div>
                )}
              <div className="mr-2">
                <button className="btn btn-outline-primary" onClick={handleCartClick}>
                  <FontAwesomeIcon icon={faShoppingCart} className="cart-icon" />
                </button>
              </div>
              {/* User Dropdown Menu */}
              <NavDropdown title={<FontAwesomeIcon icon={faUser} className="nav-dropdown-icon"/>} id="basic-nav-dropdown">
                <NavDropdown.Item onClick={handleUserClick}>注文履歴</NavDropdown.Item>
                <NavDropdown.Item onClick={handleUserSettingClick}>UserSetting</NavDropdown.Item>
                <NavDropdown.Item className="custom-logout-item" onClick={handleLogout}>ログアウト</NavDropdown.Item>
              </NavDropdown>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}

export default Header;

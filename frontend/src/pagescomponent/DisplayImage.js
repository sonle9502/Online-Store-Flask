import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
// import './DisplayImage.css'; // 上記のCSSをインポート

const ImageWrapper = styled.div`
  position: relative;
  width: ${({ isFullWidth }) => isFullWidth ? 'calc(100% - 10px)' : 'calc(50% - 10px)'};
  box-sizing: border-box;
  margin-bottom: 10px;
`;

const StyledImage = styled.img`
  width: 100%; /* 親要素の幅に合わせる */
  height: auto; /* 高さを自動調整 */
  max-height: 450px; /* 最大高さを設定 */
  border-radius: 5px;
  object-fit: cover; /* 画像のアスペクト比を保ちつつカバーする */
  display: block; /* 画像をブロック表示にする */
  cursor: pointer;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  padding: 0;
  margin: 0;
  z-index: 1;
`;

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Black background with 50% opacity
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    maxWidth: '90%', // Increase the maximum width
    maxHeight: '90%', // Increase the maximum height
    padding: '0',
    border: 'none', // Optional: Remove border if you don't want one
  },
};


const DisplayImage = ({ imageId, onDelete, taskId, role, isFullWidth, taskFlist }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const navigate = useNavigate();
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

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

  useEffect(() => {
    if (!imageId) {
      console.error('No imageId provided');
      return;
    }

    const fetchImage = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/image/${imageId}`, {
          responseType: 'json', // まずJSONとして受け取る
        });

        if (response.data.image) {
          // base64形式の場合
          setImageSrc(`data:image/jpeg;base64,${response.data.image}`);
        } else {
          // バイナリデータの場合
          const responseBlob = await axios.get(`${API_BASE_URL}/image/${imageId}`, {
            responseType: 'blob', // バイナリデータとして再取得
          });
          const url = URL.createObjectURL(new Blob([responseBlob.data]));
          setImageSrc(url);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      }
    };

    fetchImage();
  }, [imageId]);

  const handleDeleteImage = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this image?');
    
    if (!confirmDelete) {
      return;
    }
  
    // CSRF トークンを取得
    const csrfToken = await fetchCsrfToken();
  
    if (!csrfToken) {
      console.error('CSRF token is missing');
      return;
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken // 取得したCSRFトークンを使用
        },
        credentials: 'include' // セッションクッキーを送信するためのオプションを追加
      });
  
      if (response.ok) {
        onDelete(); // 削除成功時のコールバックを呼び出し
      } else {
        console.error('Failed to delete image:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
  

  return (
    <>
      <ImageWrapper isFullWidth={isFullWidth}>
        {imageSrc ? (
          <>
            <StyledImage
              src={imageSrc}
              alt="Uploaded"
              onClick={() => {
                if (isFullWidth) {
                  openModal();
                } else {
                  navigate(`/task/${taskId}`, { state: { taskFlist } });
                }
              }}
            />
            {role === 'admin' && (
              <DeleteButton onClick={handleDeleteImage}>x</DeleteButton>
            )}
          </>
        ) : (
          <p>Loading...</p>
        )}
      </ImageWrapper>

      {/* Modal Component */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Image Modal"
      >
        <img src={imageSrc} alt="Uploaded" style={{ width: '100%', height: 'auto' }} />
      </Modal>
    </>
  );
};

export default DisplayImage;

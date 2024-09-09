import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const UploadImages = ({ taskId ,onUploadSuccess, role}) => {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();
  const fileInputRef = useRef(null); // Create a ref for the file input

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

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      // CSRF トークンを取得
      const csrfToken = await fetchCsrfToken();
  
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
  
      if (!taskId) {
        console.error('No task ID provided');
        return;
      }
  
      if (!files || files.length === 0) {
        console.warn('No files selected for upload');
        return;
      }
  
      const formData = new FormData();
      // FileList を配列に変換
      Array.from(files).forEach(file => formData.append('files', file));
  
      const response = await axios.post(`${API_BASE_URL}/upload_images/${taskId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': csrfToken,
        },
        withCredentials: true,  // これを追加
      });
  
      console.log('Files uploaded successfully:', response.data);
  
      // File input と state をクリア
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFiles([]);
  
      // ページ遷移とコールバックの実行
      navigate('/home', { state: { role } });
      onUploadSuccess();
  
    } catch (error) {
      if (error.response) {
        console.error('Server error:', error.response.data);
      } else if (error.request) {
        console.error('Network error or no response received:', error.request);
      } else {
        console.error('Error uploading files:', error.message);
      }
    }
  };
  

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} /> {/* Attach the ref to the input */}
      <button type="submit">Upload</button>
    </form>
  );
};

export default UploadImages;

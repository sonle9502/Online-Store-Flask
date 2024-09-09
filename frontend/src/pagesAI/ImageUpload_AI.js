import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  // CSRFトークンを取得
  useEffect(() => {
    fetch(`${API_BASE_URL}/get-csrf-token`, {
      credentials: 'include' // クッキー情報を含める
    })
      .then(response => response.json())
      .then(data => {
        setCsrfToken(data.csrf_token);
        console.log('CSRF Token:', data.csrf_token);
      })
      .catch(error => console.error('Error fetching CSRF token:', error));
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/predict-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRFToken': csrfToken, // 取得したCSRFトークンを含める
        },
        withCredentials: true // 必要に応じてクッキー情報を含める
      });
      setPrediction(response.data.prediction);
    } catch (error) {
      console.error('Error uploading the file:', error);
    }
  };

  return (
    <div>
      <h1>Image Upload and Prediction</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload and Predict</button>
      </form>
      {prediction && (
        <div>
          <h2>Prediction Result:</h2>
          <p>{prediction}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

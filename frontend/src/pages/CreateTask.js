import React, { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート
import './CreateTask.css'; // CSSファイルをインポート
import { API_BASE_URL } from '../config';

function CreateTask() {
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [quantity_title, setWeight] = useState(''); // Add state for weight

  // 説明文を生成する関数
  const generateDescription = async (query) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-description`, {
        query
      }, {
        headers: {
          'X-CSRF-Token': fetchCsrfToken() // ヘッダー名をサーバーの設定に合わせる
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error generating description:', error.response?.data || error.message);
      throw error;
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
      console.log(data)
      return data.csrf_token;
    } else {
      throw new Error('CSRF token is not found in response');
    }
  };

  // 日付をISO 8601形式にフォーマットする関数
  const formatDateForBackend = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.error('Invalid Date:', dateStr); // デバッグ用
      return '';
    }
    return date.toISOString(); // ISO 8601形式に変換
  };

  // 説明文を生成して状態にセットする関数
  const handleGenerateDescription = async () => {
    if (content) {
      try {
        const generatedDescription = await generateDescription(content);
        setDescription(generatedDescription); // 生成された説明を設定
        console.log('Generated Description:', generatedDescription); // デバッグ用に表示
      } catch (error) {
        console.error('Error generating description:', error);
      }
    } else {
      console.error('Content is empty');
    }
  };

  // タスクを送信する関数
const handleSubmit = async (event) => {
  event.preventDefault(); // フォームのデフォルトの送信を防ぐ

  try {
    const csrfToken = await fetchCsrfToken(); // CSRFトークンを取得

    if (!csrfToken) {
      console.error('CSRF token is missing');
      return;
    }

    console.log("CSRF Token:", csrfToken);

    const formattedDueDate = formatDateForBackend(dueDate);
    const taskData = {
      content,
      description,
      dueDate: formattedDueDate,
      quantity_title: quantity_title

    };

    console.log("Sending task data:", taskData); // デバッグ情報

    const response = await fetch(`${API_BASE_URL}/add`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(taskData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Task created:', data);
      window.location.href = '/home';
    } else {
      const errorText = await response.text();
      throw new Error(errorText);
    }
  } catch (error) {
    console.error('Error submitting task:', error.message); // エラーメッセージを修正
  }
};


  return (
    <div>
      <h1>Create Task</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <input
            type="text"
            className="form-control"
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            className="form-control"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="weight">quantity_title</label>
          <input
            type="text"
            className="form-control"
            id="quantity_title"
            value={quantity_title}
            onChange={(e) => setWeight(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            type="datetime-local"
            className="form-control"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Create Task
        </button>
      </form>
    </div>
  );
}

export default CreateTask;

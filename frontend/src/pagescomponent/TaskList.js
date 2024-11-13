import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import DisplayImage from './DisplayImage'; // 必要なコンポーネントをインポート
import UploadImages from './UploadImages'; // 必要なコンポーネントをインポート
import UnitPrice from './DisplayUnitPrice'; // 必要なコンポーネントをインポート

import './TaskList.css';

// ImageContainerを定義
const ImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px; /* 画像間のスペース */
`;


const TaskList = ({ role }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [quantityTitle, setQuantityTitle] = useState('');

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
    if (location.state?.tasks) {
      setTasks(location.state.tasks);
    } else {
      fetchTasks();
    }
  }, [location.state]);

  useEffect(() => {
    // クエリパラメータを取得
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('query') || '';
    
    // クエリパラメータが空または空白のみでない場合は検索結果を取得、そうでない場合はタスクを取得
    if (queryParam.trim() !== '') {
      setQuery(queryParam);
      fetchResults(queryParam);
    } else {
      setQuery('');  // クエリをクリア
      fetchTasks();
    }
  }, [location.search]); // 依存関係に location.search を指定

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'GET',
        credentials: 'include',
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/');
      // onClick={() => navigate(`/task/${taskId}`)}

        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        setTasks(data);
        console.log(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchResults = async (searchQuery) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/search`, {
        params: { query: searchQuery }
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  // タスク削除関数
const deleteTask = async (taskId, query) => {
  try {
    // CSRF トークンを取得
    const csrfToken = await fetchCsrfToken();

    if (!csrfToken) {
      console.error('CSRF token is missing');
      return;
    }

    // CSRF トークンのログ出力
    console.log("CSRF Token:", csrfToken);

    // タスク削除リクエスト
    await axios.delete(`${API_BASE_URL}/api/deletetask/${taskId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      withCredentials: true // クッキーを送信する場合は、これを true に設定
    });

    // 成功後の処理
    query ? fetchResults(query) : fetchTasks();
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

const handleSave = async () => {
  try {
    // CSRFトークンの取得
    const csrfToken = await fetchCsrfToken();

    if (!csrfToken) {
      console.error('CSRF token is missing');
      return;
    }

    // タスクの数量タイトルをサーバーに更新
    const response = await fetch(`${API_BASE_URL}/api/update_quantity_title`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ 
        task_id: editingTaskId, // 編集しているタスクのID
        quantity_title: quantityTitle, // 更新する数量タイトル
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Update successful:', data);

    // 成功後の処理
    setEditingTaskId(null); // 編集モードを終了
    fetchTasks(); // タスクを再取得して更新を反映

  } catch (error) {
    console.error('Error updating quantity title:', error);
  }
};

const handleCancel = () => {
  setQuantityTitle('');
  setEditingTaskId(null);
};

const isFullWidth = false; 

  return (
    <div className="task-list">
      <div className="container">
        <div className="list-group">
          <h1 style={{ color: 'black' }}>Hello, My Shop!</h1>
          {(query ? results : tasks).length === 0 ? (
            <p>No tasks found.</p>
          ) : (
            <div className="row">
            {(query ? results : tasks).map((task) => (
            <div className="col-md-6 mb-4 d-flex align-items-stretch" key={task.id}>
            <div className="list-group-item task-card flex-fill">
              {/* Task Content and Description */}
              <div className="flex-grow-1">
              <div className="content" style={{ whiteSpace: 'pre-line' }}>
                商品:
                {task.content.split('\n').map((line, index) => (
                  <span key={index}>
                    &nbsp;&nbsp;&nbsp;&nbsp;{line}
                    <br />
                  </span>
                ))}
              </div>

              <div className="description" style={{ whiteSpace: 'pre-line', paddingBottom: '20px' }}>
                Detail:{"\n"}
                {task.description.split('\n').map((line, index) => (
                  <span key={index}>
                    &nbsp;&nbsp;&nbsp;&nbsp;{line}
                    <br />
                  </span>
                ))}
              </div>

              {/* Image Container */}
              <ImageContainer>
                {task.images && Array.isArray(task.images) && task.images.map((image) => (
                  <DisplayImage 
                    key={`${task.id}-${image.id}`}
                    imageId={image.id}
                    onDelete={() => query ? fetchResults(query) : fetchTasks()}
                    taskId = {task.id}
                    role={role} 
                    isFullWidth={isFullWidth}
                    taskFlist = {task}
                  />
                ))}
              </ImageContainer >
              <div>
                <span>
                  {role === 'admin' ? (
                    editingTaskId === task.id ? (
                      <div>
                        <input
                          type="text"
                          value={quantityTitle}
                          onChange={(e) => setQuantityTitle(e.target.value)}
                        />
                        <button onClick={handleSave}>Save</button>
                        <button onClick={handleCancel}>Cancel</button>
                      </div>
                    ) : (
                      <span onClick={() => {
                        setQuantityTitle(task.quantity_title);
                        setEditingTaskId(task.id);
                      }}>
                        {task.quantity_title}
                      </span>
                    )
                  ) : (
                    <span>{task.quantity_title}</span>
                  )}
                  <UnitPrice 
                  unitPrice={task.unitPrice} 
                  taskId={task.id}
                  onSave={(newPrice) => {
                    // Function to save the updated price, for example:
                    // Update the task with the new price
                    task.unitPrice = newPrice;
                    // Add any additional logic here, such as API calls to save the updated price to a backend server
                  }}
                />
                </span>
                
              </div>
              
              
              </div>

              {/* Task Actions */}
              <div className="btn-group" role="group" aria-label="Task actions">
              {role === 'admin' && (
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      deleteTask(task.id);
                    }
                  }}
                  className="btn btn-danger">
                  Delete Task
                </button>
              )}
              </div>

              {/* Image Upload (Admin Only) */}
              {role === 'admin' && (     
              <UploadImages taskId={task.id} onUploadSuccess={() => query ? fetchResults(query) : fetchTasks()} role={role} />
              )}
              {/* ■ 追加された行 */}
              <div style={{ marginTop: '0px' }}>
                <a href="" 
                onClick={() => navigate(`/task/${task.id}`, { state: { taskFlist: task } })}>
                今すぐチェック
                </a>
              </div>
            </div>
            </div>
            ))}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskList;


// const TaskList = () => {
//   return (
//  <h3 className="mb-3">Comments</h3>
// )
// };
// export default TaskList;
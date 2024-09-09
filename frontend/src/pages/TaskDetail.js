import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import Header1 from '../ComponentsAmind/Header1';
import Footer from '../ComponentsAmind/Footer';
import DisplayImage from '../pagescomponent/DisplayImage';
import DisplayComment from '../pagescomponent/DisplayComment';
import DisplayContentTask from '../pagescomponent/DisplayContentTask';
import CheckoutComponent from '../pagescomponent/CheckoutComponent';

import './TaskDetail.css';
import { API_BASE_URL } from '../config';



const MainPageWrapper = styled.div`
  display: flex; /* フレックスボックスを使用して横並びに配置 */
  gap: 10px; /* コンポーネント間のスペース */
`;

const StyledImage = styled.div`
  flex: 3; /* Takes up 30% of the space (3 / (3 + 4 + 4)) */
  min-width: 0; /* Prevent overflow */
  max-width: 13%; /* Optional: ensures it does not exceed 30% */
  padding: 10px; /* Add padding if needed */
  box-sizing: border-box; /* Ensure padding does not affect total width */
`;

const StyledContentTask = styled.div`
  flex: 4; /* Takes up 35% of the space (4 / (3 + 4 + 4)) */
  min-width: 0; /* Prevent overflow */
  max-width: 50%; /* Optional: ensures it does not exceed 35% */
  padding: 10px; /* Add padding if needed */
  box-sizing: border-box; /* Ensure padding does not affect total width */
`;

const StyledCheckout = styled.div`
  flex: 4; /* Takes up 35% of the space (4 / (3 + 4 + 4)) */
  min-width: 0; /* Prevent overflow */
  max-width: 37%; /* Optional: ensures it does not exceed 35% */
  padding: 10px; /* Add padding if needed */
  box-sizing: border-box; /* Ensure padding does not affect total width */
`;
// ImageContainerを定義
const ImageContainer = styled.div`
  display: flex;
    flex-wrap: wrap; /* 画像を折り返す */
    gap: 10px; /* 画像間のスペース */
    width: 30%; /* 全体のコンテナ幅を親要素の30%に設定 */
`;

const TaskDetail = () => {
    
    const { taskId } = useParams();
    const [task, setTask] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [showNotification, setShowNotification] = useState(false);  // 通知の表示状態を管理
    const location = useLocation();
    const { taskFlist } = location.state || {}; 

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

    const fetchTask = async () => {
    try {
            const response = await axios.get(`${API_BASE_URL}/api/taskdetail/${taskId}`);
            console.log("Fetched task data:", response.data); // デバッグ用
              setTask(response.data);
        } catch (error) {
            console.error('Error fetching task details:', error);
        }
        };

    useEffect(() => {
        fetchTask();
    }, [taskId]);

    const handleUpdate = async (event) => {
        event.preventDefault();
      
        // CSRF トークンを取得
        const csrfToken = await fetchCsrfToken();
      
        if (!csrfToken) {
          console.error('CSRF token is missing');
          return;
        }
      
        const updatedTask = {
          content: event.target.content.value,
          description: event.target.description.value,
          // due_date: event.target.due_date.value
        };
      
        try {
          await axios.post(
            `${API_BASE_URL}/api/update_task/${taskId}`,
            updatedTask,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken, // CSRFトークンをヘッダーに追加
              },
              withCredentials: true,  // クッキーを送信するためのオプションを追加
            }
          );
      
          fetchTask(); // 更新後にタスクデータを再取得
          setShowNotification(true);  // 通知を表示
        } catch (error) {
          console.error('Error updating task:', error);
          setShowNotification(true);  // 通知を表示
        }
      };
      

    const handleCloseNotification = () => {
        setShowNotification(false);  // 通知を非表示
    };

    const handleAddComment = async (event) => {
        event.preventDefault();
        try {
          // CSRF トークンを取得
          const csrfToken = await fetchCsrfToken();
          
          if (!csrfToken) {
            console.error('CSRF token is missing');
            return;
          }
      
          console.log('Adding comment:', newComment); // Debug: Log the comment being added
      
          await axios.post(
            `${API_BASE_URL}/api/tasks/${taskId}/comments`,
            { content: newComment },
            {
              headers: {
                'Content-Type': 'application/json', // Set the content type to JSON
                'X-CSRFToken': csrfToken, // Use the correct CSRF token header key
              },
              withCredentials: true, // Send cookies with the request
            }
          );
      
          setNewComment(''); // Clear the new comment input
          fetchTask(); // コメント追加後にタスクデータを再取得
        } catch (error) {
          console.error('Error adding comment:', error);
        }
      };
      

    if (!task) return <p>Loading...</p>;

    const images = Array.isArray(taskFlist.images) ? taskFlist.images : [];
    const comments = Array.isArray(task.comments) ? task.comments : [];
    const isFullWidth = true; 

    return (
        <div>
            <Header1 />
            <div className="container mt-4">
                <div className="task-detail">
                    <h2>Task Details</h2>
                    <MainPageWrapper>
                        {images.length === 0 ? (
                            <p>No images available</p>
                        ) : (
                            <StyledImage>
                            {images.map((image) => (
                                image.id ? (
                                <DisplayImage
                                    key={image.id}
                                    imageId={image.id}
                                    onDelete={fetchTask}
                                    isFullWidth={isFullWidth}
                                />
                                ) : (
                                <p key={image.id}>Invalid image data</p>
                                )
                            ))}
                            </StyledImage>
                        )}

                        <StyledContentTask>
                            <DisplayContentTask task={task} handleUpdate={handleUpdate} />
                        </StyledContentTask>
                        <StyledCheckout>
                            <CheckoutComponent taskFlist = {taskFlist}/>
                        </StyledCheckout>
                    </MainPageWrapper>
                    {showNotification && (
                        <div className="notification-window">
                            <p>タスクが正常に更新されました。</p>
                            <button onClick={handleCloseNotification} className="close-button">閉じる</button>
                        </div>
                    )}

                    <form onSubmit={handleAddComment} className="wide-form mt-4">
                        <div className="mb-3">
                            <label htmlFor="newComment" className="form-label">Add New Comment:</label>
                            <input
                                type="text"
                                id="newComment"
                                className="form-control"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-custom">Add Comment</button>
                    </form>

                    <div className="comments">
                        <h3 className="mb-3">Comments</h3>
                        {comments.length === 0 ? (
                            <p>No comments available</p>
                        ) : (
                            comments.map((comment) => (
                                <DisplayComment
                                    key={comment.id}
                                    comment={comment}
                                    onUpdate={fetchTask}
                                    onDelete={fetchTask}
                                />
                            ))
                        )}
                    </div>

                    <h3>Images</h3>
                    {images.length === 0 ? (
                        <p>No images available</p>
                    ) : (
                        <ImageContainer>
                            {images.map((image) => (
                                <DisplayImage
                                    key={image.id}
                                    imageId={image.id}
                                    onDelete={fetchTask}
                                    isFullWidth={isFullWidth}
                                />
                            ))}
                        </ImageContainer>
                    )}

                    <div className="btn-group mt-3">
                        <button 
                            onClick={() => window.history.back()}
                            className="btn btn-secondary">
                            Back
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TaskDetail;

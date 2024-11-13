import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './HandwritingInput.css';

function HandwritingInput() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [csrfToken, setCsrfToken] = useState('');
    const canvasRef = useRef(null);

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

    const handleMouseDown = (event) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
        canvas.addEventListener('mousemove', handleMouseMove);
    };

    const handleMouseMove = (event) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
    };

    const handleMouseUp = async () => {
        const canvas = canvasRef.current;
        canvas.removeEventListener('mousemove', handleMouseMove);
    
        try {
            // CSRFトークンを取得
            const csrfToken = await fetchCsrfToken();
    
            if (!csrfToken) {
                console.error('CSRF token is missing');
                return;
            }
    
            // CSRFトークンのログ出力
            console.log("CSRF Token:", csrfToken);
    
            // CSRFトークンを使ってhandleSubmitを呼び出し
            handleSubmit(csrfToken);
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        }
    };    

    const handleClearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPredictions([]);  // 結果をクリア
    };

    const handleSubmit = async (csrfToken) => {
        setLoading(true);
        setError(null);
    
        try {
            const canvas = canvasRef.current;
            const imageData = canvas.toDataURL('image/png');

    
            const response = await axios.post(`${API_BASE_URL}/predict-image`, {
                file: imageData , index : "number"
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                withCredentials: true
            });

    
            const sortedPredictions = response.data.predictions
                .map((probability, index) => ({ probability, index }))
                .sort((a, b) => b.probability - a.probability);
    
            setPredictions(sortedPredictions);
        } catch (error) {
            const errorMessage = error.response?.data?.error || '画像のアップロードに失敗しました';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    

    // 最も確率が高い予測を1つだけ取得
    const topPrediction = predictions.length > 0 ? predictions[0] : null;

    return (
        <div className="handwriting">
            <div className="container">
                <canvas
                    ref={canvasRef}
                    width="280"
                    height="280"
                    style={{ border: '1px solid black' }}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                />
                <div>
                    <button onClick={handleClearCanvas} disabled={loading}>Clear</button>
                </div>
                {error && <p aria-live="assertive">{error}</p>}
                <h3>Prediction:</h3>
                {topPrediction ? (
                    <div>
                        <p>結果: {topPrediction.index}</p>
                        <p>確率: {(topPrediction.probability * 100).toFixed(2)}%</p>
                    </div>
                ) : (
                    <p>予測結果がありません。</p>
                )}
            </div>
        </div>
    );
}

export default HandwritingInput;

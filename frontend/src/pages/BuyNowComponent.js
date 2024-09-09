import React, { useState, useEffect } from 'react';
import axios from 'axios'; // axiosをインポート
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Styled components
const Container = styled.div`
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 20px;
  color: #333;
`;

const InputField = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
`;

const TotalPrice = styled.div`
  font-size: 18px;
  margin-bottom: 20px;
  text-align: center;
`;

const BuyButton = styled.button`
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
  }
`;

const BuyNowComponent = ({ userId, productId, unitPrice }) => {
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(unitPrice);
  const [cartData, setCartData] = useState(null); // カートデータの状態を管理
  const [error, setError] = useState('');

  useEffect(() => {
    // カートとカートアイテムを取得するAPIを呼び出す
    axios.get(`${API_BASE_URL}/api/cart/${userId}`)
      .then(response => {
        const { cart, items } = response.data;
        setCartData({ cart, items });
        // デフォルトで最初のアイテムの情報を設定
        if (items.length > 0) {
          setSelectedQuantity(items[0].quantity);
          setTotalPrice(items[0].quantity * unitPrice);
        }
      })
      .catch(err => {
        console.error('Error fetching cart data:', err);
        setError('Error fetching cart data.');
      });
  }, [userId]);

  const handleQuantityChange = (e) => {
    const quantity = parseInt(e.target.value);
    setSelectedQuantity(quantity);
    setTotalPrice(quantity * unitPrice);
  };

  const handleBuyNow = () => {
    const userId = localStorage.getItem('userId');
    const productID = localStorage.getItem('productID');
    const quantity = localStorage.getItem('quantity');
    
  };

  return (
    <Container>
      <Title>Buy Now</Title>
      {error ? (
        <div>{error}</div>
      ) : cartData ? (
        <>
          <InputField
            type="number"
            value={selectedQuantity}
            onChange={handleQuantityChange}
            min="1"
          />
          <TotalPrice>Total Price: ${totalPrice}</TotalPrice>
          <BuyButton onClick={handleBuyNow}>Buy Now</BuyButton>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </Container>
  );
};

export default BuyNowComponent;
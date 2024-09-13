import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../ComponentsAmind/Header1';
import styled from 'styled-components';
import { API_BASE_URL } from '../config';

const Container = styled.div`
  padding: 20px;
  max-width: 1000px; /* Adjust the maximum width as needed */
  margin: 0 auto; /* Center the container */
`;
const ListItem = styled.li`
  display: flex;
  align-items: flex-start; /* Align items at the start */
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  position: relative; /* Allows absolute positioning within the item */
`;

const Image = styled.img`
  width: 150px;
  height: 150px;
  margin-right: 20px; /* Adjust the margin to increase/decrease space */
`;

const ItemDetails = styled.div`
  flex: 1; /* Take up available space */
  display: flex;
  flex-direction: column;
`;

const AddressList = styled.ul`
  list-style: none;
  padding: 0;
`;

const AddressItem = styled.li`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-top: 70px; 
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${props => (props.selected ? '#f0f0f0' : '#fff')};
  text-align: left; /* テキストを左寄せにする */
`;

const Loader = styled.div`
  border: 8px solid #f3f3f3;
  border-top: 8px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
  display: block;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const UserPage = () => {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]); // Corrected casing for consistency
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setLoading] = useState(true);


  const fetchCsrfToken = async () => {
    const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return data.csrf_token;
    } else {
      throw new Error('CSRF token is not found in response');
    }
  };

  const fetchOrderItems = async () => {
    try {
      if (!userId) {
        console.error('User ID is missing in localStorage');
        return;
      }
  
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        setLoading(false); // ロード状態を終了
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/order-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId }),
      });
  
      if (response.ok) {
        const data = await response.json();
        setOrderItems(data.order_items || []); // Ensure orderItems is always an array
        console.log(data);
      } else {
        console.error(`Failed to fetch order items: ${response.status} ${response.statusText}`);
        setOrderItems([]); // Reset to empty array on error
      }
    } catch (error) {
      console.error('Error fetching order items:', error.message);
      setOrderItems([]); // Reset to empty array on error
    } finally {
      setLoading(false); // ロード状態を終了
    }
  };
  

  const calculateItemSubtotal = (item) => {
    let quantity = 0;
  
    if (typeof item.quantity === 'string') { // Check if quantity is a string
      if (item.quantity.endsWith('Kg')) {
        quantity = parseFloat(item.quantity) || 0;
      } else if (item.quantity.endsWith('g')) {
        quantity = (parseFloat(item.quantity) || 0) / 1000;
      } else {
        quantity = parseFloat(item.quantity) || 0;
      }
    } else if (typeof item.quantity === 'number') { // Handle case when quantity is a number
      quantity = item.quantity;
    } else {
      console.error('Unexpected quantity type:', typeof item.quantity, item.quantity);
    }
  
    const unitPrice = parseFloat(item.unitPrice) || 0;
    return quantity * unitPrice;
  };
  

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + calculateItemSubtotal(item), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const fetchUserAddresses = async () => {
    try {
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/user-addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId })
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched addresses:', data); // デバッグ
        setAddresses(data.address || []);
        setLoading(false);
      } else {
        console.error(`Failed to fetch addresses: ${response.status} ${response.statusText}`);
        console.log('addresses**',addresses.length)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error.message);
    }
  };
  
  const handleAddressClick = () => {
    navigate('/EditAddress');
  };

  useEffect(() => {
    fetchUserAddresses();
    fetchOrderItems();
  }, []);

  
  return (
    <div>
      <Header />
      {isLoading ? (
        <Loader />
        ) : (
      <>
        <AddressItem onClick={handleAddressClick} style={{ cursor: 'pointer' }}>
                {addresses.length === 0 ? (
                  <>配達住所： 住所を入力してください。</> // 住所がない場合のメッセージ
                ) : (
                  <>配達住所： {addresses}</> // 住所がある場合に配達住所を表示
                )}
        </AddressItem>
        <Container>
          <h2>注文履歴</h2>
          {orderItems && orderItems.length > 0 ? ( // Ensure orderItems is defined
            <ul>
              {orderItems.map((item) => (
                <ListItem key={item.cart_item_id}>
                  {item.image && (
                    <Image
                      src={`data:image/jpeg;base64,${item.image}`}
                      alt={`Product ${item.product_id}`}
                    />
                  )}
                  <p>
                    <p>delivery_status: {item.delivery_status}</p>
                    <p>注文日: {new Date(item.order_date).toLocaleDateString('ja-JP')} {new Date(item.order_date).toLocaleTimeString('ja-JP')}</p>
                    <p>商品_ID: {item.product_id}</p>
                  </p>
                  <ItemDetails>
                    <p>Tracking_number: {item.tracking_number}</p>
                    <p>Unit Price: {formatCurrency(item.unitPrice)} </p>
                    <p>Quantity: {item.quantity} </p>
                    <p>Subtotal: {formatCurrency(calculateItemSubtotal(item))}</p>
                  </ItemDetails>
                </ListItem>
              ))}
            </ul>
          ) : (
            <p>No items in your cart.</p>
          )}
          <h3>Total: {formatCurrency(calculateTotal())}</h3>
          <h2>ポイント残高</h2>
        </Container>
      </>
      )}
    </div>
  );
};

export default UserPage;

import React, { useEffect, useState } from 'react';
import Header from '../ComponentsAmind/Header1';
import styled from 'styled-components';
import { API_BASE_URL } from '../config';

const Container = styled.div`
  padding: 80px;
  max-width: 900px; /* Adjust the maximum width as needed */
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

const DeleteButton = styled.button`
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  background-color: #dc3545;
  color: white;
  cursor: pointer;

  &:hover {
    background-color: #c82333;
  }
`;

const CartItem = () => {
  const [cartItems, setCartItems] = useState([]);

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

  const fetchCartItems = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('User ID is missing in localStorage');
        return;
      }

      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart-items`, {
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
        setCartItems(data.cart_items);
      } else {
        console.error(`Failed to fetch cart items: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error.message);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/delete-cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ itemId: itemId }),  // `body`として`cart_id`を送信
      });
  
      if (response.ok) {
        // 削除操作が成功した場合、状態を更新
        setCartItems(prevItems => prevItems.filter(item => item.cart_item_id !== itemId));
      } else {
        console.error(`Failed to delete item: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error.message);
    }
  };
  
  
  

  const handleQuantityChange = (cartItemId, newQuantity) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.cart_item_id === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handlePurchase  = async () => {
    try {
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
      // ローカルストレージからユーザーIDを取得
      const userId = localStorage.getItem('userId');

      const response = await fetch(`${API_BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,  // userId を含める
          cart_items: cartItems,
          total_amount: calculateTotal(),
        }),
      });

      if (response.ok) {
        console.log('Cart items updated successfully');
      } else {
        console.error(`Failed to update cart items: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving cart items:', error.message);
    }
  };

  const calculateItemSubtotal = (item) => {
    let quantity = 0;

    if (item.quantity.endsWith('Kg')) {
      quantity = parseFloat(item.quantity) || 0;
    } else if (item.quantity.endsWith('g')) {
      quantity = (parseFloat(item.quantity) || 0) / 1000;
    } else {
      quantity = parseFloat(item.quantity) || 0;
    }

    const unitPrice = parseFloat(item.unitPrice) || 0;
    return quantity * unitPrice;
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + calculateItemSubtotal(item), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  return (
    <div>
      <Header />
      <Container>
        <h2>Your Cart</h2>
        {cartItems.length > 0 ? (
          <ul>
            {cartItems.map((item) => (
              <ListItem key={item.cart_item_id}>
                {item.image && (
                  <Image
                    src={`data:image/jpeg;base64,${item.image}`}
                    alt={`Product ${item.product_id}`}
                  />
                )}
                <ItemDetails>
                  {/* <p>Product ID: {item.product_id}</p> */}
                  <p>商品: {item.content}</p>
                  <p>Unit Price: {item.unitPrice} /{item.quantity_title}</p>
                  <p>
                    Quantity:
                    <input
                      type="number"
                      value={item.quantity.replace(/Kg$/, '')} // Remove 'Kg' for display
                      onChange={(e) => handleQuantityChange(item.cart_item_id, `${e.target.value}Kg`)}
                      placeholder="1"
                      min="1"
                      style={{ marginLeft: '10px', width: '50px' }}
                    />
                  </p>
                  <p>Subtotal: {formatCurrency(calculateItemSubtotal(item))}</p>
                </ItemDetails>
                <DeleteButton onClick={() => handleDelete(item.cart_item_id)}>Delete</DeleteButton>
              </ListItem>
            ))}
          </ul>
        ) : (
          <p>No items in your cart.</p>
        )}
        <h3>Total: {formatCurrency(calculateTotal())}</h3>
        <button onClick={handlePurchase}>上記で買う</button>
      </Container>
    </div>
  );
};

export default CartItem;

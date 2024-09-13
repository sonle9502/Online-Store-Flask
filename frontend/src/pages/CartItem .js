import React, { useEffect, useState } from 'react';
import Header from '../ComponentsAmind/Header1';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const Container = styled.div`
  padding: 80px;
  max-width: 900px; /* Adjust the maximum width as needed */
  margin: 0 auto; /* Center the container */
`;

const ListItem = styled.li`
  display: flex;
  margin-top: 20px; 
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

const AddressItem = styled.li`
  padding: 00px;
  border: 0px solid #ddd;
  padding-left: 0px; 
  border-radius: 5px;
  margin-top: 0px; 
  margin-bottom: 0px; /* 下部のマージンを設定 */
  cursor: pointer;
  background-color: ${props => (props.selected ? '#f0f0f0' : '#fff')};
  text-align: left; /* テキストを左寄せにする */
`;

const Payment_method = styled.li`
  padding: 10px;
  padding-left: 0px; 
  border: 0px solid #ddd;
  border-radius: 5px;
  margin-top: 5px; 
  margin-bottom: 10px; /* 下部のマージンを設定 */
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
  position: relative; /* Add position relative */
  top: 70px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const CartItem = () => {
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payment_method, setPayment_method] = useState([]);
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [isLoading, setLoading] = useState(true);
  const navigate = useNavigate();

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
  
  const handleQuantityChange = async (cartItemId, newQuantity) => {
    try {
      const csrfToken = await fetchCsrfToken();  // CSRFトークンを取得
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
      
      // 状態を即時更新
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.cart_item_id === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
  
      // データベースのquantityを変更するためのAPIリクエストを送信
      const response = await fetch(`${API_BASE_URL}/api/cart-items`, {
        method: 'PUT',  // または 'POST' に変更する
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,  // CSRFトークンを送信
        },
        credentials: 'include',  // 必要であれば、クッキーを含める
        body: JSON.stringify({ quantity: newQuantity, cartItemId: cartItemId }),
      });
  
      if (!response.ok) {
        console.error(`Failed to update quantity: ${response.status} ${response.statusText}`);
      } else {
        console.log('Quantity updated successfully in the database.');
      }
    } catch (error) {
      console.error('Error updating quantity:', error.message);
    }
  };

  const handlePurchase  = async () => {
    try {
      console.log(addresses.length)
      // Check if addresses are provided
      if (!addresses || addresses.length === 0) {
        // Prompt user to input addresses
        const isConfirmed = window.confirm('住所が入力されていません。住所を入力してください。続行しますか？');
        if (!isConfirmed) {
          console.log('User canceled the purchase process');
          return;
        }
        navigate('/EditAddress');
        return
        // Optionally, you can redirect to an address input page here
        // navigate('/address-input'); // Example: redirect to address input page
      }
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
          addresses,addresses,
        }),
      });

      if (response.ok) {
        console.log('Cart items updated successfully');
        navigate('/user');
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
        console.log("address",data)
        console.log('Fetched addresses:', data); // デバッグ
        setAddresses(data.address || []);
        setPayment_method(data.payment_method || [])
        setLoading(false); // ローディング状態を解除
      } else {
        console.error(`Failed to fetch addresses: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error.message);
    }
  };

  const handleAddressClick = () => {
    navigate('/EditAddress');
  };

  const handlePaymentMethod = () => {
    navigate('/SettingUser');
  };

  useEffect(() => {
    fetchUserAddresses();
    fetchCartItems();
  }, []);

  return (
    <div>
      <Header />
      <Container>
          <h1>Your Cart</h1>
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
            <Payment_method onClick={handlePaymentMethod} style={{ cursor: 'pointer' }}>
              {payment_method.length === 0 ? (
                <>Payment_method： Loading...</> // 住所がない場合のメッセージ
              ) : (
                <>Payment_method： {payment_method}</> // 住所がある場合に配達住所を表示
              )}
            </Payment_method>
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
                      onChange={(e) => handleQuantityChange(item.cart_item_id, `${e.target.value}`)}
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

        
      </>
    )}
      </Container>
      
    </div>
  );
};

export default CartItem;

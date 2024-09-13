import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const AddressContainer = styled.li`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${props => (props.selected ? '#f0f0f0' : '#fff')};
  text-align: left;
`;

const Input = styled.input`
  width: 90%;
  padding: 10px;
  margin-bottom: 0px;
  border: 1px solid #ddd;
  border-radius: 5px;
`;

const Button = styled.button`
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 16px;
`;


const AddressItem = ({ address, selected, param }) => {
  const navigate = useNavigate();
  const [addressValue, setAddresses] = useState(address || '');
  const [userId] = useState(localStorage.getItem('userId') || '');

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
      } else {
        console.error(`Failed to fetch addresses: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error.message);
    }
  };

  const handleSave = async () => {
    try {
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/api/user-addresses`, {
        method: 'PUT',  // PUT メソッドで送信
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId, address: addressValue }),
      });
  
      if (response.ok) {
        navigate(-1); // 前のページに遷移
      } else {
        console.error(`Failed to update address: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating address:', error.message);
    }
  };

  useEffect(() => {
    fetchUserAddresses();
  }, []);

  const handleBlur = (e) => {
    const newAddress = e.target.value;
    setAddresses(newAddress);
  };

  return (
    <AddressContainer selected={selected} >
      住所：
      <Input
        type="text"
        value={addressValue}
        onChange={(e) => setAddresses(e.target.value)}
        onBlur={handleBlur}
      />
      {param !== 'setting' && (
            <Button onClick={handleSave}>Save</Button>
          )}
    </AddressContainer>
  );
};

export default AddressItem;

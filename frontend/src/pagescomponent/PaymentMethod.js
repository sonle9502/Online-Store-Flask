import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const PaymentContainer = styled.li`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${props => (props.selected ? '#f0f0f0' : '#fff')};
  text-align: left;
`;

// 決済方法のオプション
const PAYMENT_METHODS = {
  CREDIT_CARD: 'クレジットカード',
  PAYPAL: 'PayPal',
};

const PaymentCalculator = ({ selectedMethod, onPaymentMethodChange }) => {
  const [currentMethod, setCurrentMethod] = useState(selectedMethod || PAYMENT_METHODS.CREDIT_CARD);

  useEffect(() => {
    setCurrentMethod(selectedMethod);
  }, [selectedMethod]);

  const handleMethodChange = (e) => {
    const newMethod = e.target.value;
    setCurrentMethod(newMethod);
    onPaymentMethodChange(newMethod);
  };

  return (
    <PaymentContainer>
      決済方法:
      <select value={currentMethod} onChange={handleMethodChange} style={{ margin: '0 10px' }}>
        {Object.values(PAYMENT_METHODS).map((method) => (
          <option key={method} value={method}>
            {method}
          </option>
        ))}
      </select>
    </PaymentContainer>
  );
};

export default PaymentCalculator;

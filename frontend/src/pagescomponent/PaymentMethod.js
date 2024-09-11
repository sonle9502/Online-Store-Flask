import React, { useState } from 'react';

// 決済方法のオプション
const PAYMENT_METHODS = {
  CREDIT_CARD: 'クレジットカード',
  PAYPAL: 'PayPal',
};

const PaymentCalculator = () => {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS.CREDIT_CARD);

  // 決済方法が変更されたときの処理
  const handleMethodChange = (e) => {
    setSelectedMethod(e.target.value);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <div>
        <label>
          決済方法:
          <select value={selectedMethod} onChange={handleMethodChange} style={{ margin: '0 10px' }}>
            {Object.values(PAYMENT_METHODS).map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};

export default PaymentCalculator;

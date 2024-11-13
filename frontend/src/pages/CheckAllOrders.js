import React, { useEffect, useState } from 'react';
import { useTable, useFilters, useGlobalFilter } from 'react-table';
import Header from '../ComponentsAmind/Header1';
import styled from 'styled-components';
import { FaCheckCircle, FaHourglassHalf, FaShippingFast } from 'react-icons/fa';
import { API_BASE_URL } from '../config';

// スタイルの定義
const Container = styled.div`
  padding: 20px;
  margin-top: 70px !important; /* 競合を回避するために !important を追加 */
    margin-bottom: 10px !important; /* 競合を回避するために !important を追加 */
  max-width: 1200px;
  margin: 0 auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 10px;
  border: 1px solid #ddd;
  background-color: #f4f4f4;
`;

const Td = styled.td`
  padding: 10px;
  border: 1px solid #ddd;
`;

const Input = styled.input.attrs({ type: 'search' })`
  padding: 5px;
  margin-bottom: 10px;
`;

// EditableCell コンポーネント
const EditableCell = ({
  value: initialValue,
  row: { index, original },
  column: { id },
  updateMyData,
  editableOptions,
}) => {
  const renderIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <FaCheckCircle style={{ color: 'green' }} />;
      case 'Processing':
        return <FaHourglassHalf style={{ color: 'orange' }} />;
      case 'Shipped':
        return <FaShippingFast style={{ color: 'blue' }} />;
      default:
        return null;
    }
  };

  // 初期値としてアイコンを設定
  const [value, setValue] = useState(initialValue || 'Processing');
  const [icon, setIcon] = useState(renderIcon(initialValue || 'Processing'));
  const [userId] = useState(localStorage.getItem('userId') || '');

  useEffect(() => {
    setIcon(renderIcon(value));
  }, [value]);

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

  const onChange = async (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIcon(renderIcon(newValue)); // アイコンを更新
    updateMyData(index, id, newValue);
    updateMyData(index, 'Editor', userId);

    try {
      const csrfToken = await fetchCsrfToken();
      if (!csrfToken) {
        console.error('CSRF token is missing');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/update-delivery-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          order_item_id: original.order_item_id,
          new_status: newValue,
          userId:userId,
        }),
      });
      if (!response.ok) {
        console.error('Failed to update delivery status:', response.statusText);
      } else {
        const result = await response.json();
        console.log(result.message);
      }
    } catch (error) {
      console.error('Error updating delivery status:', error.message);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <select value={value} onChange={onChange} style={{ marginRight: '8px' }}>
        {editableOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {icon} {/* 状態に応じたアイコンを表示 */}
    </div>
  );
};


const CheckAllOrders = () => {
  const [orderItems, setOrderItems] = useState([]);
  const [userId] = useState(localStorage.getItem('userId') || '');

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.csrf_token;
      } else {
        throw new Error('Failed to fetch CSRF token');
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error.message);
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
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/all-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        if (Array.isArray(data.order_items)) {
          setOrderItems(data.order_items);
        } else {
          console.error('Unexpected response format:', data);
        }
      } else {
        console.error(`Failed to fetch order items: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching order items:', error.message);
    }
  };

  const calculateItemSubtotal = (item) => {
    let quantity = 0;

    if (typeof item.quantity === 'string') {
      if (item.quantity.endsWith('Kg')) {
        quantity = parseFloat(item.quantity) || 0;
      } else if (item.quantity.endsWith('g')) {
        quantity = (parseFloat(item.quantity) || 0) / 1000;
      } else {
        quantity = parseFloat(item.quantity) || 0;
      }
    } else if (typeof item.quantity === 'number') {
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

  const ColumnFilter = ({ column: { filterValue, preFilteredRows, setFilter } }) => {
    return (
      <input
        value={filterValue || ''}
        onChange={e => setFilter(e.target.value || undefined)} // フィルタを空にするには undefined を設定
        placeholder={`Search ${preFilteredRows.length} records...`}
        style={{
          marginTop: '5px',
          marginBottom: '5px',
        }}
      />
    );
  };

  const updateMyData = (rowIndex, columnId, value) => {
    setOrderItems(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...row,
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  const columns = React.useMemo(
    () => [
      {
        Header: 'UserID',
        accessor: 'user_id',
      }
      ,
      {
        Header: 'Order_item_id',
        accessor: 'order_item_id',
      }
      ,
      {
        Header: 'Order Date',
        accessor: 'order_date',
        Cell: ({ value }) => new Date(value).toLocaleString('ja-JP'),
      }
      ,
      {
        Header: 'Tracking Number',
        accessor: 'tracking_number',
      },
      {
        Header: 'Product ID',
        accessor: 'product_id',
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
      },
      {
        Header: 'Unit Price',
        accessor: 'unitPrice',
        Cell: ({ value }) => formatCurrency(value),
      },
      {
        Header: 'Subtotal',
        accessor: 'subtotal',
        Cell: ({ row }) => formatCurrency(calculateItemSubtotal(row.original)),
      },
      {
        Header: 'Shipping Address',
        accessor: 'shipping_address',
        // Filter: ColumnFilter,
      }
      ,
      {
        Header: 'Delivery Status',
        accessor: 'delivery_status',
        Cell: ({ value, row, column }) => (
          <EditableCell
            value={value}
            row={row}
            column={column}
            updateMyData={updateMyData}
            editableOptions={['Processing', 'Completed', 'Shipped']} // プルダウンリストのオプション
          />
        ),
      },
      {
        Header: 'Editor',
        accessor: 'Editor',
      },
    ],
    []
  );

  const data = React.useMemo(
    () =>
      orderItems.map((item) => ({
        ...item,
        subtotal: calculateItemSubtotal(item),
      })),
    [orderItems]
  );

  

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, setGlobalFilter, state: { globalFilter } } = useTable(
    {
      columns,
      data,
      updateMyData,
    },
    useGlobalFilter,
    // useFilters
  );

  useEffect(() => {
    fetchOrderItems();
  }, [userId]);

  return (
    <div>
      <Header />
      <Container>
        <h2>注文リスト</h2>
        <Input
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
        <Table {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <Th {...column.getHeaderProps()}>{column.render('Header')}</Th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {rows.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => (
                    <Td {...cell.getCellProps()}>{cell.render('Cell')}</Td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </Table>
        <h3>Total: {formatCurrency(calculateTotal())}</h3>
      </Container>
    </div>
  );
};

export default CheckAllOrders;

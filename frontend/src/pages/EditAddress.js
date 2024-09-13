import React from 'react';
import Header from '../ComponentsAmind/Header1';
import AddressItem from '../pagescomponent/AddressItem';
import styled from 'styled-components';

const Container = styled.div`
  padding: 80px;
  max-width: 1000px; /* Adjust the maximum width as needed */
  margin: 0 auto; /* Center the container */
`;
const EditAddress = () => {
  return (
    <div>
    <Header />
    <Container>
      <h1>ユーザ情報編集</h1>
      <AddressItem/>
    </Container>
    </div>
    
  );
};

export default EditAddress;

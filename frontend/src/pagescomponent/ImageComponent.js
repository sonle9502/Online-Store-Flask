// ImageComponent.jsx
import React from 'react';
import styled from 'styled-components';

const ImageSection = styled.div`
  flex: 1;
  padding: 20px;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
`;

const Img = styled.img`
  width: 100%;
  height: auto;
`;

const ImageComponent = () => {
  return (
    <ImageSection>
      <Img src="your-image-url.jpg" alt="Product" />
    </ImageSection>
  );
};

export default ImageComponent;

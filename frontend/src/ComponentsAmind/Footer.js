import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// Styled component for the footer
const StyledFooter = styled.footer`
  background-color: #95adc8;
  color: #fff; /* Improved contrast */
  padding: 10px 0;
  width: 100%;
  z-index: 1000;
  position: fixed;
  bottom: 0;
  left: 0;
  height: 100px;
  display: ${(props) => (props.show ? 'block' : 'none')}; /* Conditionally show/hide */
`;

// Footer component
function Footer() {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.pageYOffset + window.innerHeight;
      const bottomPosition = document.documentElement.scrollHeight;

      if (scrollPosition >= bottomPosition) {
        setShowFooter(true);
      } else {
        setShowFooter(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <StyledFooter show={showFooter}>
      <div className="container text-center text-muted">
        <span>&copy; 2024 To-Do App</span>
      </div>
    </StyledFooter>
  );
}

export default Footer;

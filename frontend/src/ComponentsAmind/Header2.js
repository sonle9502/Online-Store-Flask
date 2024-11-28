import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavDropdown } from 'react-bootstrap';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

// Styled Components
const Header = styled.header`
  height: 70px;
  width: 100%;
  position: fixed;
  top: 60px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #42464a;
  border-bottom: 1px solid #ddd;
  padding: 0;
  z-index: 998;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center; /* 垂直方向の中央揃え */
  justify-content: center; /* 水平方向の中央揃え */
  max-width: 900px;
  width: 100%;
  height: 100%;
  gap: 20px; /* アイテム間のスペースを調整 */
`;

const StyledForm = styled.form`
  display: flex;
  align-items: center;
  width: 400px;
  height: 90%; /* 高さをheader2と揃える */
  justify-content: flex-start; /* 左揃えに変更 */
  margin-left: 20px; /* 左側のスペースを調整 */
  margin-right: 10px;
  /* または padding-left: 20px; を使用しても良い */
`;

const StyledButton = styled.button`
  height: 50px;
  margin-left: 10px;
  padding: 5px 10px;
  text-align: center;
  display: flex;
  align-items: center; /* 垂直方向の中央揃え */
  justify-content: center; /* 水平方向の中央揃え */
`;

const NavDropdownIcon = styled(FontAwesomeIcon)`
  font-size: 30px;
  color: #ff5722;
  margin-right: 20px;
`;

function Header2({ role }) {
  const navigate = useNavigate();

  useEffect(() => {
    const header = document.querySelector('.header2');
    if (!header) return;
    const triggerHeight = header.offsetHeight;

    const handleScroll = () => {
      if (window.scrollY > triggerHeight) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = event.target.elements.query.value;
    navigate(`/search?query=${encodeURIComponent(query)}`, { state: { role: role } });
  };

  const handleCreateTask = () => {
    navigate('/create-task');
  };

  const handleUserClick = () => {
    // navigate('/cart-item');  
  };

  return (
    <Header>
      <SearchContainer>
        
        <StyledForm onSubmit={handleSearch}>
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search tasks..."
            name="query"
          />
          <StyledButton className="btn btn-outline-success me-2" type="submit">
            Search
          </StyledButton>

          {/* roleが "admin" 場合のみ表示 */}
          {role === 'admin' && (
            <StyledButton className="btn btn-primary" onClick={handleCreateTask}>
              Create New product
            </StyledButton>
          )}
        </StyledForm>
        <NavDropdown title={<NavDropdownIcon icon={faBoxOpen} />} className="custom-cart-icon">
          <NavDropdown.Item onClick={handleUserClick}>釣エサー</NavDropdown.Item>
          <NavDropdown.Item onClick={handleUserClick}>釣道具</NavDropdown.Item> 
          <NavDropdown.Item onClick={handleUserClick}>食材</NavDropdown.Item>
        </NavDropdown>
      </SearchContainer>
    </Header>
  );
}

export default Header2;

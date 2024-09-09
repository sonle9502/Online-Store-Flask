import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header2.css';

function Header2 ({ role }) {
  const navigate = useNavigate();

  useEffect(() => {
    const header = document.querySelector('.header2');
    if (!header) return; // header が null なら処理を中止
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

  return (
    <header className="header2">
      <div className="search-container">
        <form onSubmit={handleSearch} className="d-flex align-items-center">
          <input
            className="form-control me-2"
            type="search"
            placeholder="Search tasks..."
            name="query"
          />
          <button className="btn btn-outline-success me-2" type="submit">
            Search
          </button>

          {/* roleが "admin" 場合のみ表示 */}
          {role == 'admin' && (
            <button className="btn btn-primary" onClick={handleCreateTask}>
              Create New Task
            </button>
          )}
        </form>
      </div>
    </header>
  );
}

export default Header2;

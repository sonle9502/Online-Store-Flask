import React, { useEffect, useState } from 'react';
import './Footer.css';

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
    <footer className="footer" style={{ display: showFooter ? 'block' : 'none' }}>
      <div className="container text-center text-muted">
        <span>&copy; 2024 To-Do App</span>
      </div>
    </footer>
  );
}

export default Footer;

import Header1 from '../ComponentsAmind/Header1';
import Header2 from '../ComponentsAmind/Header2';
import Footer from '../ComponentsAmind/Footer';
import TaskList from '../pagescomponent/TaskList';
import ScrollToTopButton from '../ComponentsAmind/ScrollToTopButton';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const Search = () => {
  const location = useLocation();
  
  // 初回読み込み時にlocation.stateからroleを取得しlocalStorageに保存
  useEffect(() => {
    if (location.state?.role) {
      localStorage.setItem('role', location.state.role);
    }
  }, [location.state]);

  // localStorageからroleを取得
  const role = localStorage.getItem('role') || ''; 

  return (
    <div>
      <Header1 role={role} />
      <Header2 role={role} />
      <TaskList role={role} />
      <Footer />
      <ScrollToTopButton />
    </div>
  );
};

export default Search;

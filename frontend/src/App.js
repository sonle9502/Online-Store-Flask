import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateTask from './pages/CreateTask';
import HomePage from './pages/HomePage';
import TaskDetail from './pages/TaskDetail';  
import Handwritten from './pages/Handwritten';
import Kanjiwriten from './pages/Kanjiwriten';
import LoginForm from './pages/LoginForm';
import UserPage from './pages/UserPage';
import BuyNow from './pages/BuyNowComponent';
import EditAddress from './pages/EditAddress';
import CheckAllOrders from './pages/CheckAllOrders';
import SettingUser from './pages/SettingUser';
import CartItem from './pages/CartItem ';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<HomePage />} />
          <Route path="/create-task" element={<CreateTask />} />
          <Route path="/task/:taskId" element={<TaskDetail />} /> 
          <Route path="/cart-item" element={<CartItem />} /> 
          <Route path="/buynow" element={<BuyNow />} /> 
          <Route path="/user" element={<UserPage />} /> 
          <Route path="/EditAddress" element={<EditAddress />} /> 
          <Route path="/CheckAllOrders" element={<CheckAllOrders />} /> 
          <Route path="/SettingUser" element={<SettingUser />} /> 
          <Route path="/handwritten" element={<Handwritten />} /> 
          <Route path="/kanjihandwriting" element={<Kanjiwriten />} /> 
          {/* 他のルートをここに追加 */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

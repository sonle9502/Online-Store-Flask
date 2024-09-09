import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateTask from './pages/CreateTask';
import HomePage from './pages/HomePage';
import TaskDetail from './pages/TaskDetail';  
import Handwritten from './pages/Handwritten';
import Kanjiwriten from './pages/Kanjiwriten';
import LoginForm from './pages/LoginForm';
import BuyNow from './pages/BuyNowComponent';
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
          <Route path="/handwritten" element={<Handwritten />} /> 
          <Route path="/kanjihandwriting" element={<Kanjiwriten />} /> 
          {/* 他のルートをここに追加 */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

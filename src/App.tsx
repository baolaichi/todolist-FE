import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import SurveyTaking from './pages/SurveyTaking';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MainLayout from './components/MainLayout';
import Groups from './pages/Groups';       // Trang danh sách nhóm
import GroupDetail from './pages/GroupDetail'; // Trang chi tiết nhóm (Chat + Task)
import AdminDashboard from './pages/AdminDashboard'; 
import SurveyManagement from './pages/SurveyManagement';

import { App as AntdApp } from 'antd';

function App() {
  return (
    <AntdApp>
    <BrowserRouter>
      <Routes>
        {/* --- NHÓM PUBLIC (Không cần đăng nhập) --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/survey/:id" element={<SurveyTaking />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* --- NHÓM PRIVATE (Cần đăng nhập & Có Menu) --- */}
        {/* MainLayout sẽ bọc các trang con bên trong, hiển thị Sidebar và Header */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/surveys" element={<SurveyManagement />} />
          
          {/* Route cho chức năng Nhóm */}
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Xử lý trang 404 nếu nhập sai link (Tùy chọn) */}
        <Route path="*" element={
            <div style={{textAlign: 'center', marginTop: 50}}>
                <h1>404 - Không tìm thấy trang</h1>
                <a href="/">Quay về trang chủ</a>
            </div>
        } />
      </Routes>
    </BrowserRouter>
    </AntdApp>
  );
}

export default App;
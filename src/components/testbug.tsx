import React, { useEffect } from 'react';
import { Layout, Menu, notification } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- CHỨC NĂNG THÔNG BÁO (POLLING) ---
  useEffect(() => {
    // Hàm kiểm tra thông báo từ Backend
    const checkAlerts = async () => {
      try {
        const res = await axiosClient.get<string[]>('/user/alerts');
        if (res.data && res.data.length > 0) {
          // 1. Phát nhạc
          const audio = new Audio('[https://www.soundjay.com/buttons/sounds/button-3.mp3](https://www.soundjay.com/buttons/sounds/button-3.mp3)'); // Link nhạc demo
          audio.play().catch(() => {}); // Catch lỗi nếu trình duyệt chặn autoplay

          // 2. Hiện thông báo góc màn hình
          res.data.forEach((msg) => {
            notification.warning({
              title: 'CẢNH BÁO HẠN CHÓT',
              message: 'CẢNH BÁO HẠN CHÓT',
              description: msg,
              duration: 10, // Hiện 10 giây
            });
          });
        }
      } catch (error) {
        console.error("Lỗi check alert", error);
      }
    };

    // Chạy mỗi 30 giây
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    axiosClient.post('/auth/logout'); // Gọi API báo Backend (Blacklist)
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            {
              key: '/dashboard',
              icon: <UserOutlined />,
              label: 'Công việc của tôi',
              onClick: () => navigate('/dashboard'),
            },
            {
              key: '/groups',
              icon: <TeamOutlined />,
              label: 'Nhóm làm việc',
              onClick: () => navigate('/groups'),
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Đăng xuất',
              danger: true,
              onClick: handleLogout,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 20px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
           <span style={{fontWeight: 'bold'}}>Xin chào, {localStorage.getItem('username')}</span>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
            <Outlet /> {/* Nơi hiển thị nội dung trang con */}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
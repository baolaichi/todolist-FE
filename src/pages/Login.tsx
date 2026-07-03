import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App as AntdApp } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import type { AuthResponse } from '../types';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Gọi API Login
      const res = await axiosClient.post<AuthResponse>('/auth/login', {
        username: values.username,
        password: values.password
      });
      
      // Lưu token vào LocalStorage (Để dùng cho các request sau)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', values.username); // Lưu tên để chat/hiển thị
      
      message.success('Đăng nhập thành công!');
      navigate('/dashboard'); // Chuyển hướng sang trang chính
      
    } catch (error) {
      message.error('Sai tài khoản hoặc mật khẩu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' // Nền gradient giống trang Register
    }}>
      <Card style={{ width: 400, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 5 }}>Đăng Nhập</Title>
          <Text type="secondary">Chào mừng bạn quay trở lại hệ thống</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập Username!' }]}
          >
            <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          >
            <Input.Password prefix={<LockOutlined className="site-form-item-icon" />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{height: '45px', fontSize: '16px', fontWeight: 'bold'}}>
              Đăng Nhập
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <div style={{ marginBottom: 10 }}>
                <Text>Chưa có tài khoản? </Text>
                <Link to="/register" style={{ fontWeight: 'bold', color: '#1890ff' }}>Đăng ký ngay</Link>
            </div>
            <Link to="/forgot-password" style={{ fontSize: 13, color: '#888' }}>Quên mật khẩu?</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
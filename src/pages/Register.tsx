import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App as AntdApp } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Gọi API đăng ký
      // Lưu ý: API backend thường trả về User object, không phải Token
      await axiosClient.post('/auth/register', {
        email: values.email,
        username: values.username,
        password: values.password,
      });

      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      
      // Chuyển hướng về trang Login
      navigate('/login'); 
      
    } catch (error: any) {
      console.error(error);
      // Hiển thị lỗi từ backend nếu có (ví dụ: Username đã tồn tại)
      const errorMsg = error.response?.data?.message || error.response?.data || 'Đăng ký thất bại!';
      message.error(typeof errorMsg === 'string' ? errorMsg : 'Đăng ký thất bại!');
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
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' // Nền gradient nhẹ
    }}>
      <Card style={{ width: 400, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 5 }}>Đăng Ký</Title>
          <Text type="secondary">Tạo tài khoản để quản lý công việc</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập Email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập Username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập Mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{height: '45px', fontSize: '16px'}}>
              Đăng Ký Ngay
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text>Đã có tài khoản? </Text>
            <Link to="/" style={{ fontWeight: 'bold' }}>Đăng nhập</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
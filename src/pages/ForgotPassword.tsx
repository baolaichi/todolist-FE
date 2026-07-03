import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Steps, message, Result } from 'antd';
import { MailOutlined, LockOutlined, NumberOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(''); // Lưu email để dùng cho bước 2
  const navigate = useNavigate();

  // --- BƯỚC 1: GỬI YÊU CẦU OTP ---
  const handleSendOtp = async (values: any) => {
    setLoading(true);
    try {
      // API backend: POST /auth/forgot-password?email=...
      // Lưu ý: Backend dùng @RequestParam nên phải gửi dạng params
      await axiosClient.post('/auth/forgot-password', null, {
        params: { email: values.email }
      });

      message.success('Mã OTP đã được gửi! Vui lòng kiểm tra email (hoặc Console BE).');
      setEmail(values.email);
      setCurrentStep(1); // Chuyển sang bước nhập OTP
    } catch (error: any) {
      message.error(error.response?.data || 'Email không tồn tại hoặc lỗi hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  // --- BƯỚC 2: ĐỔI MẬT KHẨU ---
  const handleResetPassword = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        email: email,
        otp: values.otp,
        newPassword: values.newPassword
      };

      await axiosClient.post('/auth/reset-password', payload);
      
      setCurrentStep(2); // Chuyển sang màn hình thành công
    } catch (error: any) {
      message.error(error.response?.data || 'Mã OTP sai hoặc hết hạn!');
    } finally {
      setLoading(false);
    }
  };

  // --- GIAO DIỆN TỪNG BƯỚC ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Nhập Email
        return (
          <Form onFinish={handleSendOtp} layout="vertical" size="large">
            <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
              Nhập email đã đăng ký để nhận mã xác thực.
            </Text>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập Email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Nhập email của bạn" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Gửi mã xác nhận
            </Button>
          </Form>
        );

      case 1: // Nhập OTP & Pass mới
        return (
          <Form onFinish={handleResetPassword} layout="vertical" size="large">
            <div style={{ marginBottom: 20, background: '#f0f5ff', padding: 10, borderRadius: 8 }}>
              <Text>Đang đặt lại mật khẩu cho: <strong>{email}</strong></Text>
            </div>

            <Form.Item
              name="otp"
              rules={[{ required: true, message: 'Vui lòng nhập mã OTP!' }]}
            >
              <Input prefix={<NumberOutlined />} placeholder="Nhập mã OTP (6 số)" maxLength={6} />
            </Form.Item>

            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
            </Form.Item>

            <Form.Item
              name="confirm"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu mới" />
            </Form.Item>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button onClick={() => setCurrentStep(0)}>Quay lại</Button>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Đổi mật khẩu
              </Button>
            </div>
          </Form>
        );

      case 2: // Thành công
        return (
          <Result
            status="success"
            title="Đổi mật khẩu thành công!"
            subTitle="Bây giờ bạn có thể đăng nhập bằng mật khẩu mới."
            extra={[
              <Button type="primary" key="login" onClick={() => navigate('/')}>
                Về trang đăng nhập
              </Button>,
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Card style={{ width: 450, padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
        
        {/* Nút Back chỉ hiện ở bước 0 */}
        {currentStep === 0 && (
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 20, color: '#666' }}>
            <ArrowLeftOutlined style={{ marginRight: 5 }} /> Quay lại đăng nhập
          </Link>
        )}

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <Title level={3} style={{ color: '#1890ff', marginBottom: 5 }}>Quên Mật Khẩu</Title>
        </div>

        {/* Thanh tiến trình */}
        <Steps 
          current={currentStep} 
          size="small" 
          style={{ marginBottom: 30 }}
          items={[
            { title: 'Xác thực Email' },
            { title: 'Đặt lại Pass' },
            { title: 'Hoàn tất' },
          ]}
        />

        {/* Nội dung thay đổi theo bước */}
        {renderStepContent()}

      </Card>
    </div>
  );
};

export default ForgotPassword;
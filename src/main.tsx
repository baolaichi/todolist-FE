import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Import file CSS chung mà chúng ta đã làm đẹp
import { ConfigProvider } from 'antd';
import vnVN from 'antd/locale/vi_VN'; // Import tiếng Việt cho Ant Design

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // Bạn có thể bỏ StrictMode nếu thấy nó gây log 2 lần khó chịu khi dev
    <ConfigProvider
      locale={vnVN} // Chuyển ngôn ngữ các component Antd sang tiếng Việt
      theme={{
        token: {
          colorPrimary: '#0958d9', // Xanh đậm chuẩn WCAG
          colorText: '#141414',    // Đen đậm
          colorTextSecondary: '#595959', // Xám đậm
          colorBgLayout: '#f0f2f5', // Nền layout
          borderRadius: 8,         // Bo góc mặc định
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <App />
    </ConfigProvider>
  // </React.StrictMode>,
);
import React, { useEffect, useState, useRef } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, notification, Popover, Typography, Empty, Modal, Button, Descriptions, Input, Tooltip } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  BellOutlined,
  DashboardOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  IdcardOutlined,
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import type { Group, ChatMessage } from '../types';
import dayjs from 'dayjs';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;


const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const username = localStorage.getItem('username');

  // --- STATE GIAO DIỆN ---
  const [collapsed, setCollapsed] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  
  const [role, setRole] = useState('');
  // State Profile
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  // --- STATE CHAT HEADS (Tích hợp trực tiếp) ---
  const [showChatHeads, setShowChatHeads] = useState(false);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const activeChatIdRef = useRef<number | null>(null); // Ref để socket đọc state mới nhất
  
  const [miniMessages, setMiniMessages] = useState<ChatMessage[]>([]);
  const [miniInput, setMiniInput] = useState('');
  
  const miniMessagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<any>(null);

  // Đồng bộ State -> Ref cho Chat (Fix lỗi Stale Closure)
  useEffect(() => {
      activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
      // Lấy thông tin user để check role
      axiosClient.get('/user/profile').then(res => {
          setUserProfile(res.data);
          setRole(res.data.role); // Lưu role
      }).catch(() => {});
      // ...
  }, []);

  // --- 1. CHECK TOKEN & INIT DATA ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    const initSystem = async () => {
      try {
          // 1. Load Groups cho Chat Heads
          const resGroups = await axiosClient.get<Group[]>('/user/groups');
          setMyGroups(resGroups.data);
          if (resGroups.data.length > 0) connectGlobalSocket(resGroups.data);

          // 2. Load Alerts cho Chuông thông báo
          const resAlerts = await axiosClient.get<any[]>('/user/alerts');
          const alertsData = resAlerts.data || [];
          setNotificationsList(alertsData);

          // Hiện thông báo nếu có
          if (alertsData.length > 0) {
            const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3');
            audio.play().catch(() => {});
            alertsData.forEach((item: any) => {
                const desc = typeof item === 'string' ? item : `Công việc "${item.title}" đã quá hạn!`;
                api.warning({ message: '⏳ CẢNH BÁO HẠN CHÓT', description: desc, duration: 5, placement: 'topRight' } as any);
            });
          }
      } catch (e: any) {
          if (e.response?.status === 401) handleLogout();
          console.error(e);
      }
    };
    initSystem();

    return () => {
        if (stompClientRef.current) stompClientRef.current.disconnect();
    };
  }, [navigate]);

  // --- 2. SOCKET LOGIC (CHAT TỔNG) ---
  const connectGlobalSocket = (groups: Group[]) => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    client.debug = () => {};
    const token = localStorage.getItem('token');

    client.connect({ 'Authorization': `Bearer ${token}` }, () => {
        console.log("✅ Global Chat Connected");
        groups.forEach(group => {
            client.subscribe(`/topic/group/${group.id}`, (payload) => {
                const newMessage = JSON.parse(payload.body);
                handleIncomingMessage(newMessage, group.id);
            });
        });
    }, () => {});
    stompClientRef.current = client;
  };

  const handleIncomingMessage = (msg: ChatMessage, groupId: number) => {
    const currentOpenId = activeChatIdRef.current;

    // Tin nhắn của mình
    if (msg.sender.username === username) {
        if (currentOpenId === groupId) {
           setMiniMessages(prev => {
               if (prev.some(m => m.id === msg.id)) return prev;
               return [...prev, msg];
           });
           setTimeout(scrollMiniChatBottom, 100);
        }
        return;
    }

    // Tin nhắn người khác
    if (currentOpenId === groupId) {
        setMiniMessages(prev => [...prev, msg]);
        setTimeout(scrollMiniChatBottom, 100);
    } else {
        setUnreadMap(prev => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));
        setShowChatHeads(true); // Bung chat heads ra để báo hiệu
        const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
        audio.play().catch(() => {});
    }
  };

  const handleOpenMiniChat = async (groupId: number) => {
    if (activeChatId === groupId) {
        setActiveChatId(null); // Đóng nếu đang mở
        return;
    }
    setActiveChatId(groupId);
    setUnreadMap(prev => ({ ...prev, [groupId]: 0 })); // Reset unread
    
    try {
        const res = await axiosClient.get(`/chat/history/${groupId}`);
        setMiniMessages(res.data);
        setTimeout(scrollMiniChatBottom, 100);
    } catch (e) { }
  };

  const scrollMiniChatBottom = () => {
    miniMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMiniChat = async () => {
    if (!miniInput.trim() || !activeChatId) return;
    const tempMsg = miniInput;
    setMiniInput('');
    try {
        const res = await axiosClient.post('/chat/send', { groupId: activeChatId, content: tempMsg });
        setMiniMessages(prev => [...prev, res.data]);
        setTimeout(scrollMiniChatBottom, 50);
    } catch (e) { console.error("Lỗi gửi tin"); }
  };

  // --- 3. PROFILE & LOGOUT & ALERTS ---
  const handleOpenProfile = async () => {
    setIsProfileOpen(true);
    try {
      const res = await axiosClient.get('/user/profile');
      setUserProfile(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) handleLogout();
      else setUserProfile({ username: username, email: '...', role: 'VIEWER' });
    }
  };

  const handleDismissAlert = async (item: any) => {
    try {
        if (item.group) await axiosClient.patch(`/user/groups/tasks/${item.id}/dismiss`);
        else await axiosClient.patch(`/user/tasks/${item.id}/dismiss-alert`);
        setNotificationsList(prev => prev.filter(n => n.id !== item.id));
    } catch (error) { console.error(error); }
  };

  const handleLogout = async () => {
    try { await axiosClient.post('/auth/logout'); } catch(e) {}
    localStorage.clear();
    window.location.href = '/';
  };

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, onClick: handleOpenProfile },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
  ];

  const notificationContent = (
    <div style={{ width: 350, maxHeight: 400, overflowY: 'auto' }}>
      {notificationsList.length === 0 ? (
        <Empty description="Không có thông báo mới" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notificationsList.map((item: any, index: number) => {
            const isGroup = !!item.group;
            return (
                <div key={index} style={{ padding: '12px', background: '#fff1f0', borderRadius: '8px', borderLeft: '4px solid #ff4d4f', display: 'flex', gap: '12px', position: 'relative' }}>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px', marginTop: '2px' }} />
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <Text strong style={{ color: '#cf1322', display: 'block' }}>{isGroup ? '[Nhóm] ' : '[Cá nhân] '} Quá hạn</Text>
                        <Tooltip title="Đã hiểu"><CheckCircleOutlined onClick={() => handleDismissAlert(item)} style={{cursor: 'pointer', color: '#1890ff', fontSize: 16}}/></Tooltip>
                    </div>
                    <div style={{fontWeight: 600, marginBottom: 2}}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>Hạn chót: {dayjs(item.deadline).format('DD/MM HH:mm')}</div>
                  </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Tính tổng số tin chưa đọc
  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {contextHolder}

      {/* --- SIDEBAR --- */}
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        width={260} 
        theme="light" 
        breakpoint="lg"
        collapsedWidth="80" 
        style={{ 
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)', 
            zIndex: 100,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
        }}
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0' }}>
            {collapsed ? (
                <h2 style={{ color: '#1890ff', margin: 0, fontWeight: 800, fontSize: '20px' }}>IA</h2>
            ) : (
                <h2 style={{ color: '#1890ff', margin: 0, fontWeight: 800, fontSize: '20px' }}>INVENTORY APP</h2>
            )}
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ borderRight: 0, padding: '16px 8px' }}
          items={[
            { key: '/dashboard', icon: <DashboardOutlined />, label: 'Tổng quan', onClick: () => navigate('/dashboard') },
            { key: '/surveys', icon: <MessageOutlined />, label: 'Khảo sát', onClick: () => navigate('/surveys') },
            { key: '/groups', icon: <TeamOutlined />, label: 'Nhóm làm việc', onClick: () => navigate('/groups') },
            
            // --- THÊM MỤC ADMIN ---
            ...((role === 'ADMIN' || role === 'ROLE_ADMIN') ? [{
                key: '/admin',
                icon: <SettingOutlined />, 
                label: 'Quản trị hệ thống',
                onClick: () => navigate('/admin')
            }] : []),
            
            { type: 'divider' },
            // ...
          ]}
        />
      </Sider>

      <Layout>
        {/* --- CONTENT WRAPPER (TỰ ĐỘNG CĂN CHỈNH) --- */}
        <div style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            
            {/* Header */}
            <Header style={{ padding: '0 24px', background: 'linear-gradient(90deg, #0958d9 0%, #003eb3 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(9,88,217,0.3)', position: 'sticky', top: 0, zIndex: 99 }}>
                <span style={{ fontWeight: 600, fontSize: 18, color: '#fff', letterSpacing: 0.5 }}>
                    {location.pathname.includes('/dashboard') ? 'Quản lý công việc' : location.pathname.includes('/surveys') ? 'Quản lý Khảo sát' : 'Hệ thống'}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <Popover content={notificationContent} title="Thông báo quá hạn" trigger="click" placement="bottomRight">
                        <Badge count={notificationsList.length} overflowCount={99}>
                            <BellOutlined style={{ fontSize: 22, cursor: 'pointer', color: '#fff' }} />
                        </Badge>
                    </Popover>
                    
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#fff' }}>
                            <span style={{ fontWeight: 500 }}>{username}</span>
                            <Avatar style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }} icon={<UserOutlined />} />
                        </div>
                    </Dropdown>
                </div>
            </Header>

            {/* Nội dung chính (Boxed Layout) */}
            <Content style={{ margin: '24px 24px 0', flex: 1 }}>
                {/* Giới hạn chiều rộng max 1200px để giao diện gọn gàng trên màn hình lớn */}
                <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                    <div className="site-layout-content">
                         <Outlet />
                    </div>
                </div>
            </Content>

            <div style={{ textAlign: 'center', padding: '20px', color: '#595959', fontSize: '12px' }}>
                ©2025 Inventory App System
            </div>
        </div>
      </Layout>

      {/* --- FLOAT CHAT BUTTONS (CHAT HEADS) --- */}
      <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          
          {/* Danh sách Chat Heads */}
          <div style={{ 
              display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 10, 
              opacity: showChatHeads ? 1 : 0, 
              transform: showChatHeads ? 'translateY(0)' : 'translateY(20px)',
              pointerEvents: showChatHeads ? 'auto' : 'none', 
              transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
          }}>
              {myGroups.map(group => (
                  <Tooltip title={group.name} placement="left" key={group.id}>
                      <Badge count={unreadMap[group.id] || 0}>
                          <Avatar 
                            size={50} 
                            style={{ 
                                cursor: 'pointer', 
                                backgroundColor: '#fff', 
                                color: '#1890ff',
                                border: activeChatId === group.id ? '3px solid #1890ff' : '1px solid #d9d9d9',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}
                            icon={<TeamOutlined />}
                            onClick={() => handleOpenMiniChat(group.id)}
                          >{group.name[0].toUpperCase()}</Avatar>
                      </Badge>
                  </Tooltip>
              ))}
          </div>

          {/* Nút Toggle Chat Tổng */}
          <Badge count={totalUnread} overflowCount={99}>
            <Button 
                type="primary" 
                shape="circle" 
                size="large" 
                style={{ width: 60, height: 60, boxShadow: '0 6px 16px rgba(24, 144, 255, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                icon={showChatHeads ? <CloseOutlined style={{fontSize: 24}} /> : <MessageOutlined style={{fontSize: 24}} />}
                onClick={() => setShowChatHeads(!showChatHeads)}
            />
          </Badge>
      </div>

      {/* --- MINI CHAT WINDOW --- */}
      {activeChatId && (
          <div style={{
              position: 'fixed', right: 100, bottom: 24, 
              width: 340, height: 480, 
              background: '#fff', borderRadius: 16, 
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
              zIndex: 2001, overflow: 'hidden', border: '1px solid #f0f0f0',
              animation: 'slideIn 0.3s ease'
          }}>
              <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                      {myGroups.find(g => g.id === activeChatId)?.name}
                  </span>
                  <CloseOutlined onClick={() => setActiveChatId(null)} style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 12, background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {miniMessages.map((msg, idx) => {
                      const isMe = msg.sender.username === username;
                      return (
                          <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                              {!isMe && <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, marginLeft: 8 }}>{msg.sender.username}</div>}
                              <div style={{
                                  padding: '8px 14px',
                                  borderRadius: 18,
                                  background: isMe ? '#1890ff' : '#fff',
                                  color: isMe ? '#fff' : '#1e293b',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  fontSize: 13,
                                  borderBottomRightRadius: isMe ? 4 : 18,
                                  borderBottomLeftRadius: isMe ? 18 : 4
                              }}>
                                  {msg.content}
                              </div>
                          </div>
                      )
                  })}
                  <div ref={miniMessagesEndRef} />
              </div>

              <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8, background: '#fff' }}>
                  <Input 
                      value={miniInput} 
                      onChange={e => setMiniInput(e.target.value)} 
                      onPressEnter={handleSendMiniChat}
                      placeholder="Nhập tin nhắn..."
                      style={{ borderRadius: 20, background: '#f1f5f9', border: 'none' }}
                  />
                  <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={handleSendMiniChat} />
              </div>
          </div>
      )}

      {/* Modal Profile */}
      <Modal title="Thông tin cá nhân" open={isProfileOpen} onCancel={() => setIsProfileOpen(false)} footer={[<Button key="close" type="primary" onClick={() => setIsProfileOpen(false)}>Đóng</Button>]} centered width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <Avatar size={80} style={{ backgroundColor: '#1890ff', marginBottom: 16 }} icon={<UserOutlined />} />
          <Title level={4} style={{ margin: 0 }}>{userProfile?.username || username}</Title>
          <Text type="secondary">Thành viên hệ thống</Text>
        </div>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label={<><UserOutlined /> Tên</>}>{userProfile?.username || username}</Descriptions.Item>
          <Descriptions.Item label={<><MailOutlined /> Email</>}>{userProfile?.email}</Descriptions.Item>
          <Descriptions.Item label={<><IdcardOutlined /> Vai trò</>}><Badge status="processing" text={userProfile?.role} color="blue"/></Descriptions.Item>
        </Descriptions>
      </Modal>
    </Layout>
  );
};

export default MainLayout;
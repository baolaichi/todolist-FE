import React, { useEffect, useState, useRef } from 'react';
import { Avatar, Badge, Tooltip, Input, Button } from 'antd';
import { TeamOutlined, CloseOutlined, SendOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import type { Group, ChatMessage } from '../types';

const ChatHeads: React.FC = () => {
  const username = localStorage.getItem('username');
  
  // --- STATE ---
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<number, number>>({});
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [miniMessages, setMiniMessages] = useState<ChatMessage[]>([]);
  const [miniInput, setMiniInput] = useState('');
  
  const miniMessagesEndRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<any>(null);

  // 1. Load danh sách nhóm và kết nối Socket Global
  useEffect(() => {
    const initChatSystem = async () => {
        try {
            const res = await axiosClient.get<Group[]>('/user/groups');
            setMyGroups(res.data);
            connectGlobalSocket(res.data);
        } catch (e) { console.error("Lỗi init chat system", e); }
    };
    initChatSystem();

    return () => {
        if (stompClientRef.current) stompClientRef.current.disconnect();
    };
  }, []);

  // 2. Hàm kết nối Socket
  const connectGlobalSocket = (groups: Group[]) => {
      const socket = new SockJS('http://localhost:8080/ws');
      const client = Stomp.over(socket);
      client.debug = null;

      const token = localStorage.getItem('token');
      client.connect({ 'Authorization': `Bearer ${token}` }, () => {
          // Vòng lặp đăng ký nhận tin cho TẤT CẢ nhóm
          groups.forEach(group => {
              client.subscribe(`/topic/group/${group.id}`, (payload) => {
                  const newMessage = JSON.parse(payload.body);
                  handleIncomingMessage(newMessage, group.id);
              });
          });
      });
      stompClientRef.current = client;
  };

  // 3. Xử lý tin nhắn đến
  const handleIncomingMessage = (msg: ChatMessage, groupId: number) => {
      if (msg.sender.username === username) {
          // Nếu đang mở đúng box này thì thêm vào luôn
          if (activeChatId === groupId) {
             setMiniMessages(prev => [...prev, msg]);
             setTimeout(scrollMiniChatBottom, 100);
          }
          return;
      }

      // Tin nhắn của người khác
      if (activeChatId === groupId) {
          setMiniMessages(prev => [...prev, msg]);
          setTimeout(scrollMiniChatBottom, 100);
      } else {
          setUnreadMap(prev => ({ ...prev, [groupId]: (prev[groupId] || 0) + 1 }));
          const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-16.mp3');
          audio.play().catch(() => {});
      }
  };

  // 4. Mở Mini Chat Box
  const handleOpenMiniChat = async (groupId: number) => {
      if (activeChatId === groupId) {
          setActiveChatId(null);
          return;
      }

      setActiveChatId(groupId);
      setUnreadMap(prev => ({ ...prev, [groupId]: 0 }));
      
      try {
          const res = await axiosClient.get(`/chat/history/${groupId}`);
          setMiniMessages(res.data);
          setTimeout(scrollMiniChatBottom, 100);
      } catch (e) { console.error(e); }
  };

  const scrollMiniChatBottom = () => {
      miniMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 5. Gửi tin
  const handleSendMiniChat = async () => {
      if (!miniInput.trim() || !activeChatId) return;
      const tempMsg = miniInput;
      setMiniInput('');
      try {
          const res = await axiosClient.post('/chat/send', {
              groupId: activeChatId,
              content: tempMsg
          });
          setMiniMessages(prev => [...prev, res.data]);
          setTimeout(scrollMiniChatBottom, 50);
      } catch (e) { console.error("Lỗi gửi tin"); }
  };

  return (
    <>
      {/* CHAT HEADS (BONG BÓNG) */}
      <div style={{ position: 'fixed', right: 20, bottom: 100, display: 'flex', flexDirection: 'column', gap: 15, zIndex: 1000 }}>
          {myGroups.map(group => (
              <Tooltip title={group.name} placement="left" key={group.id}>
                  <Badge count={unreadMap[group.id] || 0} overflowCount={99}>
                      <Avatar 
                        size={50} 
                        style={{ 
                            cursor: 'pointer', 
                            backgroundColor: '#fff', 
                            color: '#1890ff',
                            border: activeChatId === group.id ? '3px solid #1890ff' : '1px solid #ddd',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                        icon={<TeamOutlined />}
                        // Avatar placeholder
                        src={`https://ui-avatars.com/api/?name=${group.name}&background=random`} 
                        onClick={() => handleOpenMiniChat(group.id)}
                      />
                  </Badge>
              </Tooltip>
          ))}
      </div>

      {/* MINI CHAT BOX */}
      {activeChatId && (
          <div style={{
              position: 'fixed', right: 90, bottom: 20, 
              width: 320, height: 450, 
              background: '#fff', borderRadius: 12, 
              boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column',
              zIndex: 1001, overflow: 'hidden', border: '1px solid #eee'
          }}>
              <div style={{ padding: '10px 15px', background: '#1890ff', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>
                      {myGroups.find(g => g.id === activeChatId)?.name}
                  </span>
                  <CloseOutlined onClick={() => setActiveChatId(null)} style={{ cursor: 'pointer' }} />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 10, background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {miniMessages.map((msg, idx) => {
                      const isMe = msg.sender.username === username;
                      return (
                          <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                              {!isMe && <div style={{ fontSize: 10, color: '#888', marginBottom: 2, marginLeft: 4 }}>{msg.sender.username}</div>}
                              <div style={{
                                  padding: '8px 12px',
                                  borderRadius: 12,
                                  background: isMe ? '#1890ff' : '#fff',
                                  color: isMe ? '#fff' : '#333',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                  fontSize: 13
                              }}>
                                  {msg.content}
                              </div>
                          </div>
                      )
                  })}
                  <div ref={miniMessagesEndRef} />
              </div>

              <div style={{ padding: 10, borderTop: '1px solid #eee', display: 'flex', gap: 8, background: '#fff' }}>
                  <Input 
                      size="small" 
                      value={miniInput} 
                      onChange={e => setMiniInput(e.target.value)} 
                      onPressEnter={handleSendMiniChat}
                      placeholder="Nhập tin nhắn..."
                      style={{ borderRadius: 15 }}
                  />
                  <Button type="primary" shape="circle" size="small" icon={<SendOutlined />} onClick={handleSendMiniChat} />
              </div>
          </div>
      )}
    </>
  );
};

export default ChatHeads;
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Row, Col, Card, Input, Button, Avatar, Tag, Tabs, 
  message, Tooltip, Modal, Form, Table, Select, DatePicker, Empty, Descriptions, Popconfirm, Upload, Breadcrumb, Timeline 
} from 'antd';
import { 
  SendOutlined, UserAddOutlined, PlusOutlined, EyeOutlined, CheckCircleOutlined, 
  EditOutlined, DeleteOutlined, FolderOutlined, FileTextOutlined, UploadOutlined, 
  HomeOutlined, ArrowUpOutlined, FileImageOutlined, FilePdfOutlined, DownloadOutlined,
  FormOutlined
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import type { ChatMessage, GroupMember, Task, WorkLog } from '../types';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import dayjs from 'dayjs';

// QUAN TRỌNG: Để rỗng để tự động theo domain khi deploy (qua Nginx)
// Nếu chạy local dev thì axiosClient đã có baseURL rồi, nhưng fetch/socket cần cái này.
// Khi deploy, Nginx sẽ lo phần /api và /ws
const API_BASE_URL = ''; 

const GroupDetail: React.FC = () => {
  const { id } = useParams(); 
  const myUsername = localStorage.getItem('username');
  const [messageApi, contextHolder] = message.useMessage();
  
  // --- STATE DỮ LIỆU ---
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  
  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const stompClientRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Task
  const [groupTasks, setGroupTasks] = useState<Task[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm] = Form.useForm();
  
  // Chi tiết Task & Báo cáo
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [dailyReports, setDailyReports] = useState<WorkLog[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportTaskId, setReportTaskId] = useState<number | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [taskLogs, setTaskLogs] = useState<WorkLog[]>([]); 

  // Tài liệu
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderContent, setFolderContent] = useState<any>({ subFolders: [], files: [] });
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderForm] = Form.useForm();
  const [previewFile, setPreviewFile] = useState<{ url: string, type: string, name: string } | null>(null);

  // Member
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // --- HELPER ---
  const getMyUserId = () => members.find(m => m.username === myUsername)?.userId;
  const isLeader = () => groupInfo?.myRole === 'LEADER';
  
  const canEditTask = (task: Task) => {
      if (isLeader()) return true;
      const isAssigned = task.assignees?.some((a: any) => a.username === myUsername);
      return isAssigned || task.userId === getMyUserId();
  };
  const canDeleteTask = () => isLeader();

  const addMessageToState = (newMessage: ChatMessage) => {
    setMessages((prev) => {
        const exists = prev.some(m => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
    });
  };

  // --- 1. INIT ---
  useEffect(() => {
    if (!id) return;

    axiosClient.get(`/user/groups/${id}`).then(res => setGroupInfo(res.data)).catch(() => {});
    loadMembers();
    loadGroupTasks();
    loadFolderContent(null); 
    loadDailyReports();

    axiosClient.get(`/chat/history/${id}`).then(res => {
      setMessages(res.data);
      setTimeout(scrollToBottom, 100);
    });

    // WebSocket: Dùng đường dẫn tương đối '/ws' để Nginx xử lý
    const socket = new SockJS('/ws');
    const client = Stomp.over(socket);
    client.debug = () => {}; // Tắt log debug rác
    
    const token = localStorage.getItem('token');
    
    client.connect({ 'Authorization': `Bearer ${token}` }, () => {
      client.subscribe(`/topic/group/${id}`, (payload) => {
        const newMessage = JSON.parse(payload.body);
        addMessageToState(newMessage);
        setTimeout(scrollToBottom, 100);
      });
    }, () => {});

    stompClientRef.current = client;
    return () => { if (stompClientRef.current?.connected) stompClientRef.current.disconnect(); };
  }, [id]);

  useEffect(() => scrollToBottom(), [messages]);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadMembers = () => axiosClient.get(`/user/groups/${id}/members`).then(res => setMembers(res.data));
  const loadGroupTasks = () => axiosClient.get(`/user/groups/${id}/tasks`).then(res => setGroupTasks(res.data));
  const loadDailyReports = () => axiosClient.get(`/user/groups/${id}/daily-reports`).then(res => setDailyReports(res.data)).catch(() => {});
  
  const loadTaskLogs = async (taskId: number) => {
      try {
          const res = await axiosClient.get(`/user/groups/tasks/${taskId}/work-logs`);
          setTaskLogs(res.data);
      } catch (e) {}
  };

  // --- FILE MANAGER ---
  const loadFolderContent = async (folderId: number | null) => {
      try {
          const res = await axiosClient.get(`/user/groups/${id}/folders`, { params: { folderId } });
          setFolderContent(res.data);
          setCurrentFolderId(folderId);
      } catch (e) { messageApi.error("Lỗi tải tài liệu"); }
  };

  const handleCreateFolder = async (values: any) => {
      try {
          await axiosClient.post(`/user/groups/${id}/folders`, { name: values.name, parentId: currentFolderId });
          messageApi.success("Tạo thư mục thành công");
          setIsCreateFolderOpen(false);
          folderForm.resetFields();
          loadFolderContent(currentFolderId);
      } catch (e) { messageApi.error("Lỗi tạo thư mục"); }
  };

  // UPLOAD FILE (Fix lỗi 403/CORS khi deploy)
  const handleUploadFile = async (options: any) => {
      if (!currentFolderId) {
          messageApi.warning("Vui lòng vào một thư mục để upload!"); return;
      }
      const { file, onSuccess, onError } = options;
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');

      try {
          // Dùng đường dẫn tương đối /api/... để đi qua Nginx
          const response = await fetch(`/api/user/groups/${id}/folders/${currentFolderId}/files`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
          });

          if (!response.ok) throw new Error('Upload thất bại');
          messageApi.success("Upload thành công");
          if (onSuccess) onSuccess("Ok");
          loadFolderContent(currentFolderId);
      } catch (e: any) { 
          messageApi.error("Lỗi upload file"); 
          if (onError) onError(e); 
      }
  };

  const handleDeleteFolder = async (folderId: number) => {
      try {
          await axiosClient.delete(`/user/groups/${id}/folders/${folderId}`);
          messageApi.success("Đã xóa thư mục!");
          loadFolderContent(currentFolderId);
      } catch (e: any) { messageApi.error("Lỗi xóa thư mục"); }
  };

  const handleDeleteFile = async (fileId: number) => {
      try {
          await axiosClient.delete(`/user/groups/${id}/files/${fileId}`);
          messageApi.success("Đã xóa file!");
          loadFolderContent(currentFolderId);
      } catch (e: any) { messageApi.error("Lỗi xóa file"); }
  };

  const handleViewFile = (file: any) => {
      // Xử lý đường dẫn ảnh: Nginx phục vụ tại /uploads/
      // Nếu file.url đã bắt đầu bằng /uploads thì giữ nguyên (tương đối)
      const fullUrl = file.url; 
      if (file.type?.includes('image')) setPreviewFile({ url: fullUrl, type: 'image', name: file.name });
      else if (file.type?.includes('pdf')) setPreviewFile({ url: fullUrl, type: 'pdf', name: file.name });
      else window.open(fullUrl, '_blank');
  };

  const getFileIcon = (type: string) => {
      if (type?.includes('image')) return <FileImageOutlined style={{fontSize: 24, color: '#ff85c0'}} />;
      if (type?.includes('pdf')) return <FilePdfOutlined style={{fontSize: 24, color: '#ff4d4f'}} />;
      return <FileTextOutlined style={{fontSize: 24, color: '#597ef7'}} />;
  };

  // --- CHAT LOGIC ---
  const handleSendChat = async () => {
    if (!inputMsg.trim()) return;
    const tempMsg = inputMsg;
    setInputMsg('');
    try {
      const res = await axiosClient.post('/chat/send', { groupId: Number(id), content: tempMsg });
      addMessageToState(res.data);
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      messageApi.error("Lỗi gửi tin nhắn!");
      setInputMsg(tempMsg);
    }
  };

  // --- TASK LOGIC ---
  const openCreateTaskModal = () => {
      setEditingTask(null);
      taskForm.resetFields();
      setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
      setEditingTask(task);
      const assigneeIds = task.assignees?.map((a: any) => a.userId) || [];
      taskForm.setFieldsValue({
          title: task.title,
          description: task.description,
          assigneeIds: assigneeIds,
          priority: task.priority,
          status: task.status,
          deadline: task.deadline ? dayjs(task.deadline) : null
      });
      setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (values: any) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status || 'TODO',
        groupId: Number(id),
        assigneeIds: values.assigneeIds || [],
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD HH:mm:ss') : null
      };
      
      if (editingTask) {
          await axiosClient.put(`/user/groups/tasks/${editingTask.id}`, payload);
          messageApi.success("Cập nhật thành công!");
          if (viewTask?.id === editingTask.id) {
              const updatedAssignees = members
                 .filter(m => payload.assigneeIds.includes(m.userId))
                 .map(m => ({ userId: m.userId, username: m.username }));
              setViewTask({ ...viewTask, ...payload, status: values.status, assignees: updatedAssignees } as any);
          }
      } else {
          await axiosClient.post('/user/groups/tasks', payload);
          messageApi.success("Giao việc thành công!");
      }
      
      setIsTaskModalOpen(false);
      taskForm.resetFields();
      loadGroupTasks();
    } catch (error: any) {
      messageApi.error(error.response?.data?.message || "Lỗi xử lý công việc!");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
      try {
          await axiosClient.delete(`/user/groups/tasks/${taskId}`);
          messageApi.success("Đã xóa!");
          loadGroupTasks();
      } catch (error: any) { messageApi.error("Lỗi xóa"); }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
      try {
          await axiosClient.patch(`/user/tasks/${taskId}/status`, { status: newStatus });
          messageApi.success("Cập nhật trạng thái xong!");
          loadGroupTasks();
          if (viewTask && viewTask.id === taskId) setViewTask({ ...viewTask, status: newStatus as any });
      } catch (e: any) { messageApi.error("Lỗi cập nhật"); }
  };

  const handleSendReport = async () => {
      if (!reportContent.trim() || !reportTaskId) {
          messageApi.warning("Vui lòng nhập nội dung báo cáo!"); return;
      }
      setReportLoading(true);
      try {
          await axiosClient.post(`/user/groups/tasks/${reportTaskId}/report`, { content: reportContent });
          messageApi.success("Báo cáo thành công!");
          setIsReportModalOpen(false);
          setReportContent('');
          loadDailyReports();
          loadTaskLogs(reportTaskId);
      } catch (e: any) { messageApi.error(e.response?.data || "Lỗi gửi báo cáo"); }
      finally { setReportLoading(false); }
  };

  const openDetailModal = async (taskId: number) => {
    try {
        // Gọi API Task Nhóm
        const res = await axiosClient.get(`/user/groups/tasks/${taskId}`);
        setViewTask(res.data);
        loadTaskLogs(taskId);
        setIsDetailOpen(true);
    } catch (e) { messageApi.error("Không thể xem chi tiết"); }
  };

  const handleAddMember = async (values: any) => {
      try {
          await axiosClient.post(`/user/groups/${id}/members`, { emailOrUsername: values.username });
          messageApi.success("Mời thành công!");
          setIsAddMemberOpen(false);
          loadMembers();
      } catch (e: any) { messageApi.error(e.response?.data || "Lỗi mời thành viên"); }
  };

  // --- UI RENDER ---
  const taskColumns = [
    { title: 'Công việc', dataIndex: 'title', render: (t: string) => <b>{t}</b> },
    { title: 'Người làm', dataIndex: 'assignees', render: (assignees: any[]) => (
        <Avatar.Group max={{ count: 3 }}>
            {assignees?.map((u: any) => (
                <Tooltip title={u.username} key={u.userId}>
                    <Avatar style={{backgroundColor: '#1890ff'}}>{u.username[0].toUpperCase()}</Avatar>
                </Tooltip>
            ))}
        </Avatar.Group>
    )},
    { title: 'Hạn chót', dataIndex: 'deadline', width: 100, render: (d: string) => d ? dayjs(d).format('DD/MM') : '-' },
    { title: 'TT', dataIndex: 'status', width: 80, render: (s: string) => <Tag color={s === 'DONE' ? 'green' : 'orange'}>{s}</Tag> },
    {
        title: '', width: 110, key: 'action',
        render: (_: any, record: Task) => (
            <div style={{display: 'flex', gap: 4}}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(record.id)} />
                {canEditTask(record) && <Button size="small" icon={<EditOutlined style={{color:'#1890ff'}}/>} onClick={() => openEditTaskModal(record)} />}
                {canDeleteTask() && <Popconfirm title="Xóa?" onConfirm={() => handleDeleteTask(record.id)}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>}
            </div>
        )
    }
  ];

  const breadcrumbItems = [
    { title: <a onClick={(e) => {e.preventDefault(); loadFolderContent(null);}}><HomeOutlined /> Gốc</a> },
    ...(currentFolderId ? [{ title: folderContent.currentFolderName || '...' }] : [])
  ];

  const tabItems = [
    {
        key: '1', label: 'Công việc',
        children: (
            <div style={{padding: 12, height: '100%', overflowY: 'auto'}}>
                {isLeader() && <Button type="primary" block icon={<PlusOutlined />} onClick={openCreateTaskModal} style={{marginBottom: 10}}>Giao việc mới</Button>}
                <Table dataSource={groupTasks} columns={taskColumns} rowKey="id" pagination={false} size="small" scroll={{ x: 500 }} />
            </div>
        )
    },
    {
        key: '2', label: 'Tài liệu',
        children: (
            <div style={{padding: 12, height: '100%', display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
                    <Breadcrumb items={breadcrumbItems} />
                    <div style={{display: 'flex', gap: 5}}>
                        <Button size="small" icon={<PlusOutlined />} onClick={() => setIsCreateFolderOpen(true)}/>
                        <Upload customRequest={handleUploadFile} showUploadList={false}><Button size="small" icon={<UploadOutlined />} disabled={!currentFolderId}/></Upload>
                    </div>
                </div>
                {currentFolderId && <div onClick={() => loadFolderContent(folderContent.parentFolderId)} style={{cursor: 'pointer', padding: '5px', color: '#1890ff', fontSize: 12}}><ArrowUpOutlined /> Lên cấp trên</div>}
                <div style={{flex: 1, overflowY: 'auto'}}>
                    {[...folderContent.subFolders, ...folderContent.files].length === 0 ? <Empty description="Trống" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {folderContent.subFolders.map((item: any) => (
                                <div key={'folder_' + item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f9f9f9', border: '1px solid #eee' }} onClick={() => loadFolderContent(item.id)}>
                                    <div style={{ fontSize: 24 }}><FolderOutlined style={{color: '#faad14'}} /></div>
                                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{item.name}</div><div style={{ fontSize: 11, color: '#888' }}>Bởi {item.createdBy}</div></div>
                                    {(isLeader() || item.createdBy === myUsername) && <Popconfirm title="Xóa?" onConfirm={(e) => {e?.stopPropagation(); handleDeleteFolder(item.id)}}><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} /></Popconfirm>}
                                </div>
                            ))}
                            {folderContent.files.map((item: any) => (
                                <div key={'file_' + item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 8, cursor: 'default', backgroundColor: '#fff', border: '1px solid #eee' }} onClick={() => handleViewFile(item)}>
                                    <div style={{ fontSize: 24 }}>{getFileIcon(item.type)}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{item.name}</div><div style={{ fontSize: 11, color: '#888' }}>Bởi {item.uploadedBy}</div></div>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <Tooltip title="Tải xuống"><Button type="text" size="small" icon={<DownloadOutlined />} onClick={(e) => { e.stopPropagation(); window.open(`${API_BASE_URL}${item.url}`, '_blank'); }} /></Tooltip>
                                        {(isLeader() || item.uploadedBy === myUsername) && <Popconfirm title="Xóa?" onConfirm={(e) => {e?.stopPropagation(); handleDeleteFile(item.id)}}><Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} /></Popconfirm>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    },
    {
        key: '3', label: `Thành viên`,
        children: (
            <div style={{padding: 12, height: '100%', overflowY: 'auto'}}>
                {isLeader() && <Button type="dashed" block icon={<UserAddOutlined />} onClick={() => setIsAddMemberOpen(true)} style={{marginBottom: 10}}>Mời thành viên</Button>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {members.map((item) => (
                    <div key={item.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar style={{backgroundColor: '#87d068'}}>{item.username[0].toUpperCase()}</Avatar>
                            <div><div style={{ fontWeight: 500 }}>{item.username}</div><div style={{ fontSize: 11, color: '#999' }}>{item.email}</div></div>
                        </div>
                        <Tag color={item.role === 'LEADER' ? 'gold' : 'default'}>{item.role}</Tag>
                    </div>
                  ))}
                </div>
            </div>
        )
    }
  ];

  if (isLeader()) {
      tabItems.push({
          key: '4', label: 'Báo cáo ngày',
          children: (
              <div style={{padding: 20, height: '100%', overflowY: 'auto'}}>
                  <h4 style={{marginBottom: 20}}>Hoạt động nhóm hôm nay</h4>
                  {dailyReports.length === 0 ? <Empty description="Chưa có báo cáo nào" /> : (
                      <Timeline mode="left">
                          {dailyReports.map(log => (
                              <Timeline.Item label={dayjs(log.createdAt).format('HH:mm')} key={log.id}>
                                  <p style={{margin: 0}}><strong>{log.reporterName}</strong> báo cáo trong <a>{log.taskTitle}</a>:</p>
                                  <p style={{margin: 0, color: '#555'}}>{log.content}</p>
                              </Timeline.Item>
                          ))}
                      </Timeline>
                  )}
              </div>
          )
      });
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {contextHolder}

      <Card style={{ marginBottom: 16, flexShrink: 0, background: '#f5f7fa' }} styles={{ body: { padding: '12px 24px' } }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div><h2 style={{margin: 0, color: '#0958d9'}}>{groupInfo?.name || 'Loading...'}</h2><span style={{color: '#888'}}>{groupInfo?.description}</span></div>
            <Avatar.Group max={{ count: 5 }}>{members.map(m => (<Tooltip title={`${m.username} (${m.role})`} key={m.userId}><Avatar style={{backgroundColor: m.role === 'LEADER' ? '#f56a00' : '#87d068'}}>{m.username[0].toUpperCase()}</Avatar></Tooltip>))}</Avatar.Group>
          </div>
      </Card>

      <Row gutter={[16, 16]} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* CỘT TABS CHỨC NĂNG (Trái - To) */}
        <Col xs={24} lg={17} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } }}>
                <Tabs defaultActiveKey="1" type="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }} items={tabItems} />
            </Card>
        </Col>

        {/* CỘT CHAT (Phải - Nhỏ) */}
        <Col xs={24} lg={7} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card 
            title={<span style={{ color: '#fff' }}>Thảo luận nhóm</span>} 
            headStyle={{ background: '#0958d9', borderBottom: 'none' }}
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '2px solid #0958d9', borderRadius: '12px', overflow: 'hidden' }} 
            styles={{ body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 16 } }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10, marginBottom: 10 }}>
              {messages.length === 0 && <Empty description="Chưa có tin nhắn" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {messages.map((msg, index) => {
                  const isMe = msg.sender.username === myUsername;
                  return ( <div key={msg.id || index} style={{ textAlign: isMe ? 'right' : 'left', marginBottom: 12 }}> <div style={{ fontSize: 11, color: '#999', marginBottom: 2, padding: '0 4px' }}>{!isMe && <strong>{msg.sender.username} • </strong>}{dayjs(msg.sentAt).format('HH:mm')}</div> <span style={{ display: 'inline-block', padding: '8px 14px', borderRadius: 16, background: isMe ? '#0958d9' : '#f0f2f5', color: isMe ? '#fff' : '#141414', maxWidth: '100%', wordBreak: 'break-word', textAlign: 'left' }}>{msg.content}</span> </div> );
                })}
              </div>
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 5, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
              <Input value={inputMsg} onChange={e => setInputMsg(e.target.value)} onPressEnter={handleSendChat} placeholder="Nhập tin..." style={{borderRadius: 20}} />
              <Button type="primary" shape="circle" icon={<SendOutlined />} onClick={handleSendChat} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* MODALS */}
      <Modal title="Mời thành viên" open={isAddMemberOpen} onCancel={() => setIsAddMemberOpen(false)} footer={null}><Form onFinish={handleAddMember} layout="vertical"><Form.Item name="username" label="Email/Username" rules={[{required: true}]}><Input /></Form.Item><Button type="primary" htmlType="submit" block>Mời ngay</Button></Form></Modal>
      <Modal title="Tạo thư mục" open={isCreateFolderOpen} onCancel={() => setIsCreateFolderOpen(false)} footer={null}><Form form={folderForm} onFinish={handleCreateFolder} layout="vertical"><Form.Item name="name" label="Tên thư mục" rules={[{required: true}]}><Input /></Form.Item><Button type="primary" htmlType="submit" block>Tạo</Button></Form></Modal>
      
      <Modal title={editingTask ? "Cập nhật" : "Giao việc"} open={isTaskModalOpen} onCancel={() => setIsTaskModalOpen(false)} footer={null}>
          <Form form={taskForm} onFinish={handleSaveTask} layout="vertical">
              <Form.Item name="title" label="Tiêu đề" rules={[{required: true}]}><Input /></Form.Item>
              <Form.Item name="description" label="Mô tả"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item name="assigneeIds" label="Giao cho (Chọn nhiều)" rules={[{required: true}]}>
                  <Select mode="multiple" placeholder="Chọn thành viên" disabled={!isLeader()}>{members.map(m => (<Select.Option key={m.userId} value={m.userId}>{m.username} ({m.email})</Select.Option>))}</Select>
              </Form.Item>
              <div style={{ display: 'flex', gap: 10 }}>
                  <Form.Item name="deadline" label="Hạn chót" style={{flex:1}}><DatePicker showTime style={{width: '100%'}} /></Form.Item>
                  <Form.Item name="priority" label="Ưu tiên" style={{flex:1}} initialValue="MEDIUM"><Select><Select.Option value="HIGH">Cao</Select.Option><Select.Option value="MEDIUM">TB</Select.Option><Select.Option value="LOW">Thấp</Select.Option></Select></Form.Item>
              </div>
              <Form.Item name="status" label="Trạng thái" initialValue="TODO"><Select><Select.Option value="TODO">Chưa làm</Select.Option><Select.Option value="IN_PROGRESS">Đang làm</Select.Option><Select.Option value="DONE">Hoàn thành</Select.Option></Select></Form.Item>
              <Button type="primary" htmlType="submit" block>{editingTask ? "Lưu thay đổi" : "Giao việc"}</Button>
          </Form>
      </Modal>

      <Modal title="Chi tiết công việc" open={isDetailOpen} onCancel={() => setIsDetailOpen(false)} footer={[<Button key="close" onClick={() => setIsDetailOpen(false)}>Đóng</Button>]} width={700}>
        {viewTask ? (
          <Tabs defaultActiveKey="1" items={[
             {
                 key: '1', label: 'Thông tin chung',
                 children: (
                     <div>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Tiêu đề"><b>{viewTask.title}</b></Descriptions.Item>
                            <Descriptions.Item label="Mô tả">{viewTask.description}</Descriptions.Item>
                            <Descriptions.Item label="Trạng thái"><Tag color={viewTask.status === 'DONE' ? 'green' : 'orange'}>{viewTask.status}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Hạn chót">{dayjs(viewTask.deadline).format('HH:mm DD/MM')}</Descriptions.Item>
                            <Descriptions.Item label="Người thực hiện">
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {viewTask.assignees?.map((a: any) => (<Tag key={a.userId} color="blue">{a.username}</Tag>))}
                                </div>
                            </Descriptions.Item>
                        </Descriptions>
                        {canEditTask(viewTask) && (
                            <div style={{marginTop: 15, display: 'flex', gap: 10, justifyContent: 'center'}}>
                                <Button onClick={() => handleUpdateStatus(viewTask.id, 'IN_PROGRESS')}>Đang làm</Button>
                                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(viewTask.id, 'DONE')}>Hoàn thành</Button>
                            </div>
                        )}
                     </div>
                 )
             },
             {
                 key: '2', label: 'Tiến độ & Báo cáo',
                 children: (
                     <div>
                         {canEditTask(viewTask) && (
                             <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
                                 <Input placeholder="Nội dung báo cáo..." value={reportContent} onChange={e => setReportContent(e.target.value)} onPressEnter={() => {setReportTaskId(viewTask.id); handleSendReport();}}/>
                                 <Button type="primary" icon={<SendOutlined />} loading={reportLoading} onClick={() => {setReportTaskId(viewTask.id); handleSendReport();}}>Gửi</Button>
                             </div>
                         )}
                         <div style={{maxHeight: 300, overflowY: 'auto'}}>
                             {taskLogs.length === 0 ? <Empty description="Chưa có báo cáo nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
                                 <Timeline>
                                     {taskLogs.map(log => (
                                         <Timeline.Item key={log.id} color="blue">
                                             <p style={{margin: 0}}><strong>{log.reporterName}</strong> <span style={{fontSize: 11, color: '#999'}}>{dayjs(log.createdAt).format('HH:mm DD/MM')}</span></p>
                                             <p style={{margin: 0}}>{log.content}</p>
                                         </Timeline.Item>
                                     ))}
                                 </Timeline>
                             )}
                         </div>
                     </div>
                 )
             }
          ]} />
        ) : <p>Loading...</p>}
      </Modal>

      <Modal open={!!previewFile} onCancel={() => setPreviewFile(null)} footer={null} width={800} centered title={previewFile?.name} styles={{ body: { padding: 0, height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}}>
          {previewFile?.type === 'image' ? <img src={previewFile.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <iframe src={previewFile?.url} title="PDF Preview" width="100%" height="100%" style={{border: 'none'}} />}
      </Modal>
    </div>
  );
};

export default GroupDetail;
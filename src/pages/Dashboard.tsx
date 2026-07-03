import { useEffect, useState } from 'react';
import { Table, Tag, Button, Tabs, Modal, Form, Input, DatePicker, Select, message, Tooltip, Popconfirm, Descriptions } from 'antd';
import { 
  CheckCircleOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined // <--- 1. Import icon xem chi tiết
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import type { Task } from '../types';
import dayjs from 'dayjs';

// Component chính
const Dashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State cho Modal Tạo/Sửa (Giữ nguyên)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null); 
  
  // --- 2. STATE MỚI CHO MODAL CHI TIẾT ---
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);

  const [filterType, setFilterType] = useState('all'); 
  const [form] = Form.useForm();

  // 1. Load danh sách task (Giữ nguyên)
  const fetchTasks = async (type: string = 'all') => {
    setLoading(true);
    try {
      let url = '/user/tasks/show';
      if (type !== 'all') url = `/user/tasks/filter?type=${type}`;
      const res = await axiosClient.get<Task[]>(url);
      setTasks(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(filterType); }, [filterType]);

  // --- 3. HÀM MỚI: MỞ MODAL CHI TIẾT ---
  const openDetailModal = async (id: number) => {
    try {
      // Gọi API lấy chi tiết task (Backend bạn đã viết endpoint này)
      const res = await axiosClient.get<Task>(`/user/tasks/detail/${id}`);
      setViewTask(res.data);
      setIsDetailOpen(true);
    } catch (error) {
      message.error("Không thể xem chi tiết task này");
    }
  };

  // 2. Xử lý mở Modal Tạo/Sửa (Giữ nguyên)
  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      deadline: task.deadline ? dayjs(task.deadline) : null 
    });
    setIsModalOpen(true);
  };

  // 3. Xử lý Submit (Giữ nguyên)
  const handleSaveTask = async (values: any) => {
    try {
      const payload = {
        ...values,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DDTHH:mm:ss') : null,
      };

      if (editingTask) {
        await axiosClient.put(`/user/tasks/update/${editingTask.id}`, payload); // Đã sửa lại URL theo đúng chuẩn REST nếu cần
        message.success('Cập nhật thành công!');
      } else {
        // Nếu API backend là /add thì giữ nguyên, nếu chuẩn REST là POST /user/tasks
        await axiosClient.post('/user/tasks/add', payload); 
        message.success('Tạo mới thành công!');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchTasks(filterType); 
    } catch (error: any) {
      message.error(error.response?.data || 'Có lỗi xảy ra!');
    }
  };

  // 4. Xử lý Xóa Task (Giữ nguyên)
  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/user/tasks/delete/${id}`); // Đã sửa URL cho chuẩn
      message.success('Đã xóa công việc!');
      fetchTasks(filterType);
    } catch (error) {
      message.error('Lỗi khi xóa!');
    }
  };

  // 5. Xử lý Hoàn thành nhanh (Giữ nguyên)
  const handleComplete = async (id: number) => {
    try {
      await axiosClient.patch(`/user/tasks/${id}/status`, { status: 'DONE' });
      message.success('Đã hoàn thành!');
      fetchTasks(filterType);
    } catch (error) { message.error('Lỗi cập nhật'); }
  };

  // --- CẤU HÌNH CỘT BẢNG ---
  const columns = [
    { 
      title: 'Tiêu đề', 
      dataIndex: 'title', 
      width: '30%',
      render: (text: string, record: Task) => (
        <div>
          <div style={{fontWeight: 'bold', fontSize: 15}}>{text}</div>
          <div style={{color: '#888', fontSize: 13}}>{record.description}</div>
        </div>
      ) 
    },
    { 
      title: 'Hạn chót', 
      dataIndex: 'deadline', 
      render: (text: string) => {
        if (!text) return <Tag>Không có</Tag>;
        const date = dayjs(text);
        const isOverdue = date.isBefore(dayjs()) && true; 
        
        return (
          <Tooltip title={isOverdue ? "Đã quá hạn!" : "Hạn chót"}>
            <Tag color={isOverdue ? 'red' : 'blue'} icon={isOverdue ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />}>
              {date.format('HH:mm DD/MM/YYYY')}
            </Tag>
          </Tooltip>
        );
      }
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      render: (status: string) => {
        let color = status === 'DONE' ? 'green' : status === 'IN_PROGRESS' ? 'orange' : 'default';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { 
      title: 'Ưu tiên', 
      dataIndex: 'priority',
      render: (p: string) => {
        let color = p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'gold' : 'blue';
        return <Tag color={color}>{p}</Tag>;
      } 
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180, // Tăng độ rộng để chứa đủ nút
      render: (_: any, record: Task) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {/* --- 4. NÚT XEM CHI TIẾT (MỚI) --- */}
          <Tooltip title="Xem chi tiết">
            <Button 
              type="default" 
              shape="circle" 
              icon={<EyeOutlined />} 
              onClick={() => openDetailModal(record.id)} 
            />
          </Tooltip>

          {/* Nút Sửa */}
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="text" 
              shape="circle" 
              icon={<EditOutlined style={{ color: '#1890ff' }} />} 
              onClick={() => openEditModal(record)} 
            />
          </Tooltip>

          {/* Nút Xóa */}
          <Popconfirm 
            title="Bạn có chắc muốn xóa?" 
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa" cancelText="Hủy"
          >
            <Tooltip title="Xóa">
              <Button type="text" shape="circle" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
          
           {/* Nút Hoàn thành nhanh */}
           {record.status !== 'DONE' && (
            <Tooltip title="Đánh dấu xong">
              <Button type="text" shape="circle" icon={<CheckCircleOutlined style={{ color: 'green' }} />} onClick={() => handleComplete(record.id)} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <h2 style={{margin: 0}}>Danh sách công việc</h2>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreateModal} style={{borderRadius: 8}}>
          Thêm công việc
        </Button>
      </div>

      <Tabs
        defaultActiveKey="all"
        onChange={(key) => setFilterType(key)}
        type="card"
        items={[
          { label: 'Tất cả', key: 'all' },
          { label: 'Hôm nay', key: 'today' },
          { label: 'Tuần này', key: 'this_week' },
          { label: '⚡ Quá hạn', key: 'overdue' },
        ]}
      />

      <Table 
        dataSource={tasks} 
        columns={columns} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 6 }}
      />

      {/* --- MODAL TẠO/SỬA (Giữ nguyên) --- */}
      <Modal 
        title={editingTask ? "Cập nhật công việc" : "Thêm công việc mới"} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null}
      >
        <Form form={form} onFinish={handleSaveTask} layout="vertical">
           <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề!' }]}>
             <Input placeholder="Ví dụ: Fix bug Login..." />
           </Form.Item>
           <Form.Item name="description" label="Mô tả chi tiết">
             <Input.TextArea rows={3} placeholder="Mô tả..." />
           </Form.Item>
           <div style={{ display: 'flex', gap: 16 }}>
             <Form.Item name="deadline" label="Hạn chót" style={{ flex: 1 }} rules={[{ required: true }]}>
               <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
             </Form.Item>
             <Form.Item name="priority" label="Độ ưu tiên" style={{ flex: 1 }} initialValue="MEDIUM">
               <Select>
                 <Select.Option value="HIGH">Cao (🔥)</Select.Option>
                 <Select.Option value="MEDIUM">Trung bình</Select.Option>
                 <Select.Option value="LOW">Thấp</Select.Option>
               </Select>
             </Form.Item>
           </div>
           {editingTask && (
            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Select.Option value="TODO">Chưa làm</Select.Option>
                <Select.Option value="IN_PROGRESS">Đang làm</Select.Option>
                <Select.Option value="DONE">Hoàn thành</Select.Option>
              </Select>
            </Form.Item>
           )}
           <Button type="primary" htmlType="submit" block size="large">
             {editingTask ? 'Lưu thay đổi' : 'Tạo mới'}
           </Button>
        </Form>
      </Modal>

      {/* --- 5. MODAL XEM CHI TIẾT (MỚI THÊM VÀO) --- */}
      <Modal
        title="Chi tiết công việc"
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>Đóng</Button>,
          // Nút chuyển sang sửa nhanh từ màn hình chi tiết
          <Button key="edit" type="primary" onClick={() => { setIsDetailOpen(false); if(viewTask) openEditModal(viewTask); }}>
            Chỉnh sửa ngay
          </Button>
        ]}
      >
        {viewTask ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Tiêu đề">
                <b style={{fontSize: 16}}>{viewTask.title}</b>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" style={{whiteSpace: 'pre-wrap'}}>
                {viewTask.description || <i style={{color:'#999'}}>Không có mô tả</i>}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
                <Tag color={viewTask.status === 'DONE' ? 'green' : viewTask.status === 'IN_PROGRESS' ? 'orange' : 'red'}>
                    {viewTask.status}
                </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Độ ưu tiên">
                <Tag color={viewTask.priority === 'HIGH' ? 'red' : 'blue'}>{viewTask.priority}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hạn chót">
                {viewTask.deadline ? dayjs(viewTask.deadline).format('HH:mm DD/MM/YYYY') : 'Không giới hạn'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
                {/* Cần đảm bảo DTO có trả về creatAt/createdAt */}
                {viewTask.creatAt ? dayjs(viewTask.creatAt).format('HH:mm DD/MM/YYYY') : ''}
            </Descriptions.Item>
            {viewTask.groupId && (
                <Descriptions.Item label="Thuộc nhóm">ID: {viewTask.groupId}</Descriptions.Item>
            )}
          </Descriptions>
        ) : <p>Đang tải...</p>}
      </Modal>
    </div>
  );
};

export default Dashboard;
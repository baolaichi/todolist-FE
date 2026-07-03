import { useEffect, useState } from 'react';
import { Card, List, Button, message, Modal, Form, Input, Typography, Badge } from 'antd';
import { ArrowRightOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import type { Group } from '../types';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Load danh sách nhóm
  const fetchGroups = async () => {
    setLoading(true);
    try {
      // Gọi API lấy danh sách nhóm của tôi
      const res = await axiosClient.get<Group[]>('/user/groups');
      setGroups(res.data);
    } catch (error) {
      message.error('Không tải được danh sách nhóm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  // Xử lý tạo nhóm mới
  const handleCreateGroup = async (values: any) => {
    try {
      await axiosClient.post('/user/groups', values);
      message.success("Tạo nhóm thành công!");
      setIsModalOpen(false);
      form.resetFields();
      fetchGroups(); // Reload lại danh sách
    } catch (e) {
      message.error("Lỗi tạo nhóm (Có thể tên bị trùng hoặc lỗi server)");
    }
  };

  return (
    <div className="groups-container">
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center'}}>
        <Title level={2} style={{margin: 0}}>Nhóm làm việc</Title>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
          Tạo nhóm mới
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
        dataSource={groups}
        loading={loading}
        renderItem={(item) => (
          <List.Item>
            <Card 
              hoverable
              title={
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                   <TeamOutlined style={{color: '#1890ff'}} /> 
                   <span title={item.name} style={{overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.name}</span>
                </div>
              }
              actions={[
                <Button type="link" onClick={() => navigate(`/groups/${item.id}`)}>
                    Vào nhóm <ArrowRightOutlined />
                </Button>
              ]}
              style={{height: '100%', display: 'flex', flexDirection: 'column'}}
              bodyStyle={{flex: 1}}
            >
              <div style={{height: 60, overflow: 'hidden', marginBottom: 10}}>
                  <Paragraph ellipsis={{ rows: 2, expandable: false }} type="secondary">
                    {item.description || 'Chưa có mô tả'}
                  </Paragraph>
              </div>
              <div>
                 <Badge status="processing" text={`${item.memberCount || 1} thành viên`} />
              </div>
            </Card>
          </List.Item>
        )}
      />
      
      {/* Modal Tạo Nhóm */}
      <Modal 
        title="Tạo nhóm làm việc mới" 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null}
      >
          <Form form={form} onFinish={handleCreateGroup} layout="vertical">
              <Form.Item name="name" label="Tên nhóm" rules={[{required: true, message: 'Vui lòng nhập tên nhóm'}]}>
                  <Input placeholder="Ví dụ: Team Backend, Dự án A..." />
              </Form.Item>
              <Form.Item name="description" label="Mô tả">
                  <Input.TextArea rows={3} placeholder="Mô tả mục tiêu của nhóm..." />
              </Form.Item>
              <Button type="primary" htmlType="submit" block size="large">Hoàn tất</Button>
          </Form>
      </Modal>
    </div>
  );
};

export default Groups;
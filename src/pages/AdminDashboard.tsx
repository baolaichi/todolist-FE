import React, {useEffect, useState}    from "react";
import { Card, Row, Col, Statistic, Table, Button, message, Popconfirm, Tag, Tabs } from "antd";
import { UserOutlined, TeamOutlined, FileDoneOutlined, DeleteOutlined } from "@ant-design/icons";
import axiosClient from "../api/axiosClient";

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>({});
    const [users, setUsers] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [surveys, setSurveys] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const resStats = await axiosClient.get('/admin/stats');
            setStats(resStats.data);
            
            const resUsers = await axiosClient.get('/admin/users');
            setUsers(resUsers.data);

            const resReviews = await axiosClient.get('/admin/reviews');
            setReviews(resReviews.data);

            const resSurveys = await axiosClient.get('/admin/surveys');
            setSurveys(resSurveys.data);
        } catch (error) {
            message.error("Bạn không có quyền truy cập Admin hoặc có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        try {
            await axiosClient.delete(`/admin/users/${id}`);
            message.success("Đã xóa user!");
            loadData();
        } catch (e) {
            message.error("Lỗi khi xóa user");
        }
    };

    const handleDeleteSurvey = async (id: number) => {
        try {
            await axiosClient.delete(`/admin/surveys/${id}`);
            message.success("Đã xóa khảo sát!");
            loadData();
        } catch (e) {
            message.error("Lỗi khi xóa khảo sát");
        }
    };

    const handleDeleteReview = async (id: number) => {
        try {
            await axiosClient.delete(`/admin/reviews/${id}`);
            message.success("Đã xóa đánh giá!");
            loadData();
        } catch (e) {
            message.error("Lỗi khi xóa đánh giá");
        }
    };

    const handleApproveReview = async (id: number) => {
        try {
            await axiosClient.put(`/admin/reviews/${id}/approve`);
            message.success("Đã duyệt đánh giá!");
            loadData();
        } catch (e) {
            message.error("Lỗi khi duyệt đánh giá");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Username', dataIndex: 'username', key: 'username', render: (text: string) => <b>{text}</b> },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Vai trò', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role}</Tag> },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                record.role !== 'ADMIN' && ( // Không cho xóa chính mình hoặc admin khác
                    <Popconfirm title="Xóa user này?" onConfirm={() => handleDeleteUser(record.id)}>
                        <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                )
            )
        }
    ];

    const surveyColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title', render: (text: string) => <b>{text}</b> },
        { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>{status}</Tag> },
        { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (text: string) => new Date(text).toLocaleString('vi-VN') },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <Popconfirm title="Xóa khảo sát này?" onConfirm={() => handleDeleteSurvey(record.id)}>
                    <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
                </Popconfirm>
            )
        }
    ];

    const reviewColumns = [
        { title: 'ID', dataIndex: 'id', width: 60 },
        { title: 'Người đánh giá', dataIndex: 'authorName', render: (text: any) => <b>{text || 'Ẩn danh'}</b> },
        { 
            title: 'Đánh giá', 
            dataIndex: 'rating', 
            render: (rating: number) => (
                <span style={{ color: '#faad14', fontSize: 18 }}>
                    {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </span>
            ) 
        },
        { title: 'Nội dung phản hồi', dataIndex: 'comment' },
        { title: 'Trạng thái', dataIndex: 'approved', render: (approved: boolean) => <Tag color={approved ? 'green' : 'orange'}>{approved ? 'Đã duyệt' : 'Chờ duyệt'}</Tag> },
        { title: 'Thời gian', dataIndex: 'createdAt', render: (text: string) => new Date(text).toLocaleString('vi-VN') },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!record.approved && (
                        <Button type="primary" size="small" onClick={() => handleApproveReview(record.id)}>Duyệt</Button>
                    )}
                    <Popconfirm title="Xóa đánh giá này?" onConfirm={() => handleDeleteReview(record.id)}>
                        <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
                    </Popconfirm>
                </div>
            )
        }
    ];

    return (
        <div className="dashboard-container">
            <h2>Quản trị hệ thống</h2>
            
            <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="Quản lý Người dùng" key="1">
                    {/* Thống kê */}
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={8}>
                            <Card>
                                <Statistic title="Tổng User" value={stats.totalUsers} prefix={<UserOutlined />} valueStyle={{ color: '#3f8600' }} />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic title="Tổng Nhóm" value={stats.totalGroups} prefix={<TeamOutlined />} valueStyle={{ color: '#cf1322' }} />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic title="Tổng Task" value={stats.totalTasks} prefix={<FileDoneOutlined />} valueStyle={{ color: '#1890ff' }} />
                            </Card>
                        </Col>
                    </Row>

                    {/* Bảng quản lý User */}
                    <Card title="Danh sách người dùng">
                        <Table 
                            dataSource={users} 
                            columns={columns} 
                            rowKey="id" 
                            loading={loading} 
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Quản lý Khảo sát" key="2">
                    <Card title="Tất cả khảo sát trên hệ thống">
                        <Table 
                            dataSource={surveys} 
                            columns={surveyColumns} 
                            rowKey="id" 
                            loading={loading} 
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Quản lý Đánh giá" key="3">
                    <Card title="Phản hồi (Feedback) từ người dùng">
                        <Table
                            dataSource={reviews}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            columns={reviewColumns}
                        />
                    </Card>
                </Tabs.TabPane>
            </Tabs>
        </div>
    );
}

export default AdminDashboard;
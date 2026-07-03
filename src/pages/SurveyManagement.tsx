import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Typography, App as AntdApp, Card, Row, Col, Checkbox, Popconfirm, Upload } from 'antd';
import { PlusOutlined, DeleteOutlined, MinusCircleOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const SurveyManagement: React.FC = () => {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSurveyId, setEditingSurveyId] = useState<number | null>(null);
    const [form] = Form.useForm();
    const { message, modal } = AntdApp.useApp();

    const fetchSurveys = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/surveys');
            setSurveys(res.data);
        } catch (error) {
            message.error("Lỗi khi tải danh sách Bài Tập / Khảo Sát.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveys();
    }, []);

    const handleCreateOrUpdate = async (values: any) => {
        try {
            if (values.questions) {
                values.questions = values.questions.map((q: any) => ({
                    ...q,
                    options: q.options ? q.options.map((opt: any) => {
                        let parsedImageUrl = null;
                        if (typeof opt.imageUrl === 'string') {
                            parsedImageUrl = opt.imageUrl;
                        } else if (Array.isArray(opt.imageUrl) && opt.imageUrl.length > 0) {
                            const file = opt.imageUrl[0];
                            if (file.response && file.response.url) {
                                parsedImageUrl = file.response.url;
                            } else if (file.url) {
                                parsedImageUrl = file.url;
                            }
                        }
                        return {
                            content: opt.content,
                            imageUrl: parsedImageUrl,
                            isCorrect: opt.isCorrect || false
                        };
                    }) : []
                }));
            }

            if (editingSurveyId) {
                await axiosClient.put(`/surveys/${editingSurveyId}`, values);
                message.success("Cập nhật Bài Tập / Khảo Sát thành công");
            } else {
                await axiosClient.post('/surveys', values);
                message.success("Tạo Bài Tập / Khảo Sát thành công");
            }
            
            setIsModalVisible(false);
            form.resetFields();
            setEditingSurveyId(null);
            fetchSurveys();
        } catch (error) {
            message.error("Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại Backend.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await axiosClient.delete(`/surveys/${id}`);
            message.success("Đã xóa Bài Tập / Khảo Sát!");
            fetchSurveys();
        } catch (error) {
            message.error("Lỗi khi xóa.");
        }
    };

    const openEditModal = (record: any) => {
        setEditingSurveyId(record.id);
        
        const transformedRecord = {
            ...record,
            questions: record.questions?.map((q: any) => ({
                ...q,
                options: q.options?.map((opt: any) => ({
                    ...opt,
                    imageUrl: opt.imageUrl ? [{
                        uid: opt.id || '-1',
                        name: 'image',
                        status: 'done',
                        url: opt.imageUrl
                    }] : []
                }))
            }))
        };
        
        form.setFieldsValue(transformedRecord);
        setIsModalVisible(true);
    };

    const copyToClipboard = (id: number) => {
        const link = `${window.location.origin}/survey/${id}`;
        navigator.clipboard.writeText(link);
        message.success("Đã copy link!");
    };

    const [isResponseVisible, setIsResponseVisible] = useState(false);
    const [responses, setResponses] = useState([]);
    
    const fetchResponses = async (id: number) => {
        try {
            const res = await axiosClient.get(`/surveys/${id}/responses`);
            setResponses(res.data);
            setIsResponseVisible(true);
        } catch (error) {
            message.error("Lỗi khi tải phản hồi");
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
        { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm') },
        {
            title: 'Hành động',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button type="link" onClick={() => copyToClipboard(record.id)}>Copy Link</Button>
                    <Button type="link" onClick={() => fetchResponses(record.id)}>Xem Kết Quả</Button>
                    <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>Sửa</Button>
                    <Popconfirm title="Bạn có chắc chắn muốn xóa?" onConfirm={() => handleDelete(record.id)} okText="Có" cancelText="Không">
                        <Button danger type="link">Xóa</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <Title level={3}>Quản lý Bài Tập / Khảo Sát</Title>
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => {
                    form.resetFields();
                    setEditingSurveyId(null);
                    form.setFieldsValue({ questions: [{ content: '', type: 'TEXT' }] });
                    setIsModalVisible(true);
                }}>
                    Tạo Bài Tập / Khảo Sát
                </Button>
            </div>
            
            <Table columns={columns} dataSource={surveys} rowKey="id" loading={loading} />

            <Modal 
                title={<Title level={4}>{editingSurveyId ? 'Sửa Bài Tập / Khảo Sát' : 'Tạo Bài Tập / Khảo Sát'}</Title>} 
                open={isModalVisible} 
                onCancel={() => setIsModalVisible(false)} 
                onOk={() => form.submit()}
                width={800}
                okText="Lưu Lại"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleCreateOrUpdate}>
                    <Card style={{ marginBottom: 20, background: '#fafafa' }}>
                        <Form.Item name="title" label="Tiêu đề khảo sát" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                            <Input size="large" placeholder="Ví dụ: Khảo sát chất lượng dịch vụ" />
                        </Form.Item>
                        <Form.Item name="description" label="Mô tả ngắn">
                            <Input.TextArea rows={2} placeholder="Nhập một vài mô tả..." />
                        </Form.Item>
                    </Card>

                    <Form.List name="questions">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <Card 
                                        key={key} 
                                        style={{ marginBottom: 20 }} 
                                        title={`Câu hỏi ${index + 1}`}
                                        extra={<Button danger type="text" icon={<DeleteOutlined />} onClick={() => remove(name)}>Xóa</Button>}
                                    >
                                        <Row gutter={16}>
                                            <Col span={16}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'content']}
                                                    rules={[{ required: true, message: 'Nhập nội dung câu hỏi' }]}
                                                >
                                                    <Input placeholder="Nội dung câu hỏi" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'type']}
                                                    rules={[{ required: true }]}
                                                >
                                                    <Select placeholder="Loại câu hỏi">
                                                        <Option value="TEXT">Văn bản (Tự luận)</Option>
                                                        <Option value="SINGLE_CHOICE">Trắc nghiệm (1 đáp án)</Option>
                                                        <Option value="MULTIPLE_CHOICE">Trắc nghiệm (Nhiều đáp án)</Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        {/* Hiển thị options nếu loại là trắc nghiệm */}
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prevValues, currentValues) => 
                                                prevValues.questions?.[name]?.type !== currentValues.questions?.[name]?.type
                                            }
                                        >
                                            {({ getFieldValue }) => {
                                                const type = getFieldValue(['questions', name, 'type']);
                                                if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
                                                    return (
                                                        <Form.List name={[name, 'options']}>
                                                            {(optionFields, { add: addOption, remove: removeOption }) => (
                                                                <div style={{ paddingLeft: 20 }}>
                                                                    <Text strong style={{ display: 'block', marginBottom: 10 }}>Các lựa chọn:</Text>
                                                                    {optionFields.map((optField, optIndex) => (
                                                                        <Space key={optField.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                                            <Form.Item
                                                                                {...optField}
                                                                                name={[optField.name, 'content']}
                                                                                rules={[{ required: true, message: 'Nhập nội dung lựa chọn' }]}
                                                                                style={{ margin: 0, width: 300 }}
                                                                            >
                                                                                <Input placeholder={`Lựa chọn ${optIndex + 1}`} />
                                                                            </Form.Item>
                                                                            <Form.Item
                                                                                {...optField}
                                                                                name={[optField.name, 'imageUrl']}
                                                                                valuePropName="fileList"
                                                                                getValueFromEvent={(e) => {
                                                                                    if (Array.isArray(e)) return e;
                                                                                    return e?.fileList;
                                                                                }}
                                                                                style={{ margin: 0, width: 200 }}
                                                                            >
                                                                                <Upload
                                                                                    name="file"
                                                                                    action={`${axiosClient.defaults.baseURL}/v1/public/upload`}
                                                                                    maxCount={1}
                                                                                    listType="picture"
                                                                                    onChange={(info) => {
                                                                                        if (info.file.status === 'done') {
                                                                                            message.success(`Tải ảnh thành công.`);
                                                                                            // Set the actual string URL in another field or map it later
                                                                                        } else if (info.file.status === 'error') {
                                                                                            message.error(`Tải ảnh thất bại.`);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
                                                                                </Upload>
                                                                            </Form.Item>
                                                                            <Form.Item
                                                                                {...optField}
                                                                                name={[optField.name, 'isCorrect']}
                                                                                valuePropName="checked"
                                                                                style={{ margin: 0 }}
                                                                            >
                                                                                <Checkbox>Đáp án đúng</Checkbox>
                                                                            </Form.Item>
                                                                            <MinusCircleOutlined onClick={() => removeOption(optField.name)} style={{ color: 'red' }} />
                                                                        </Space>
                                                                    ))}
                                                                    <Button type="dashed" onClick={() => addOption()} block icon={<PlusOutlined />}>
                                                                        Thêm lựa chọn
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </Form.List>
                                                    );
                                                }
                                                if (type === 'TEXT') {
                                                    return (
                                                        <div style={{ marginTop: 16 }}>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'correctAnswer']}
                                                                label="Đáp án đúng (Tùy chọn - Dùng để chấm điểm tự động)"
                                                                style={{ margin: 0 }}
                                                            >
                                                                <Input placeholder="Nhập đáp án đúng (Không phân biệt hoa thường)" />
                                                            </Form.Item>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                Bỏ trống nếu đây là câu hỏi khảo sát thông thường không chấm điểm.
                                                            </Text>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        </Form.Item>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add({ type: 'TEXT' })} block icon={<PlusOutlined />} size="large">
                                    Thêm câu hỏi mới
                                </Button>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            <Modal 
                title="Danh sách Phản hồi" 
                open={isResponseVisible} 
                onCancel={() => setIsResponseVisible(false)} 
                footer={[<Button key="close" onClick={() => setIsResponseVisible(false)}>Đóng</Button>]}
                width={800}
            >
                {responses.length === 0 ? (
                    <Text type="secondary">Chưa có ai trả lời bài tập / khảo sát này.</Text>
                ) : (
                    <Table
                        tableLayout="fixed"
                        columns={[
                            {
                                title: 'Người làm',
                                key: 'user',
                                width: '40%',
                                render: (_, record: any) => record.user ? record.user.username : 'Ẩn danh'
                            },
                            {
                                title: 'Ngày nộp',
                                dataIndex: 'createdAt',
                                key: 'createdAt',
                                width: '35%',
                                align: 'center',
                                render: (text: string) => dayjs(text).format('DD/MM/YYYY HH:mm')
                            },
                            {
                                title: 'Điểm số',
                                key: 'score',
                                width: '25%',
                                align: 'center',
                                render: (_, record: any) => record.totalGradedQuestions > 0 
                                    ? <Text type="success" strong>{record.score} / {record.totalGradedQuestions}</Text>
                                    : <Text type="secondary">Không có</Text>
                            }
                        ]}
                        dataSource={responses}
                        rowKey="id"
                        scroll={{ y: 400 }}
                        pagination={{ pageSize: 10 }}
                        expandRowByClick={true}
                        expandable={{
                            expandedRowRender: (record: any) => (
                                <div style={{ padding: '16px 24px', background: '#f8f9fa', borderRadius: '12px', margin: '8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 12, color: '#4255ff' }}>
                                        Chi tiết câu trả lời
                                    </Text>
                                    <Table
                                        tableLayout="fixed"
                                        columns={[
                                            { title: 'STT', key: 'index', render: (_, __, index) => <span style={{ color: '#888' }}>{index + 1}</span>, width: 60, align: 'center' },
                                            { title: 'Câu hỏi', key: 'question', width: '45%', render: (_, ans: any, idx) => <Text strong>{ans.question?.content || `Câu ${idx + 1}`}</Text> },
                                            { title: 'Câu trả lời', dataIndex: 'content', key: 'content', render: (text: string) => <Text type="secondary">{text}</Text> }
                                        ]}
                                        dataSource={record.answers || []}
                                        pagination={false}
                                        rowKey="id"
                                        size="small"
                                    />
                                </div>
                            )
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default SurveyManagement;

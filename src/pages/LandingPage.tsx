import React, { useState, useEffect } from 'react';
import { Typography, Button, Input, Carousel, Rate, App as AntdApp, Row, Col, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { ArrowRightOutlined, EditOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { message } = AntdApp.useApp();
    const [surveyCode, setSurveyCode] = useState('');
    const [reviews, setReviews] = useState<any[]>([]);

    useEffect(() => {
        // Fetch approved reviews
        axiosClient.get('/v1/public/reviews')
            .then(res => setReviews(res.data))
            .catch(err => console.error("Could not load reviews", err));
    }, []);

    const handleJoinSurvey = () => {
        if (!surveyCode) {
            message.warning("Vui lòng nhập mã khảo sát!");
            return;
        }
        navigate(`/survey/${surveyCode}`);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f9fc', fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                .header-nav { padding: 15px 50px; }
                .hero-section { padding: 100px 20px; }
                .hero-title { font-size: 3.5rem; line-height: 1.2; letter-spacing: -1px; }
                .survey-input-group { 
                    display: flex; gap: 12px; max-width: 550px; margin: 0 auto; 
                    background: white; padding: 10px; border-radius: 16px; 
                    box-shadow: 0 20px 40px rgba(0,0,0,0.08); 
                    border: 2px solid #0958d9;
                }
                .deco-icon { opacity: 0.2; }
                .feature-section { padding: 80px 20px; }
                .testimonial-section { padding: 80px 20px; }
                .testimonial-card { 
                    text-align: center; max-width: 700px; margin: 0 auto; 
                    padding: 40px; background: #f8f9fc; border-radius: 24px; 
                    border: 2px solid #0958d9;
                }
                
                @media (max-width: 768px) {
                    .header-nav { padding: 15px 20px; }
                    .hero-section { padding: 60px 15px; }
                    .hero-title { font-size: 2.2rem; }
                    .survey-input-group { 
                        flex-direction: column; background: transparent; 
                        padding: 0; box-shadow: none; 
                    }
                    .survey-input-group .ant-input { margin-bottom: 12px; }
                    .deco-icon { display: none; }
                    .feature-section { padding: 40px 15px; }
                    .testimonial-section { padding: 40px 15px; }
                    .testimonial-card { padding: 20px; border-radius: 16px; }
                    .header-buttons { display: none !important; }
                }
            `}</style>
            {/* Header */}
            <header className="header-nav" style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                background: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 1000,
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #0958d9, #1677ff)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 'bold' }}>
                        Q
                    </div>
                    <Title level={3} style={{ margin: 0, color: '#1a1d28', fontWeight: 800, letterSpacing: '-0.5px' }}>QuizMaster</Title>
                </div>
                <div className="header-buttons" style={{ display: 'flex', gap: '15px' }}>
                    {localStorage.getItem('token') ? (
                        <Button type="primary" style={{ background: '#0958d9', fontWeight: 600, borderRadius: '8px', padding: '0 24px' }} onClick={() => navigate('/dashboard')}>
                            Vào Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button type="text" style={{ fontWeight: 600, color: '#595959' }} onClick={() => navigate('/login')}>Đăng nhập</Button>
                            <Button type="primary" style={{ background: '#0958d9', fontWeight: 600, borderRadius: '8px', padding: '0 24px' }} onClick={() => navigate('/register')}>
                                Tạo tài khoản
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero-section" style={{ 
                background: 'linear-gradient(180deg, #f0f2ff 0%, #f8f9fc 100%)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'inline-block', padding: '6px 16px', background: '#e6f4ff', color: '#0958d9', borderRadius: '20px', fontWeight: 700, marginBottom: 20, fontSize: 14 }}>
                        🚀 Nền tảng tạo bài tập & khảo sát #1
                    </div>
                    <Title level={1} className="hero-title" style={{ fontWeight: 900, color: '#141414', marginBottom: 24 }}>
                        Học tập và Kiểm tra <br/> <span style={{ color: '#0958d9' }}>Chưa bao giờ thú vị đến thế</span>
                    </Title>
                    <Paragraph style={{ fontSize: '1.1rem', color: '#595959', marginBottom: 40, padding: '0 10px' }}>
                        Tạo các bài trắc nghiệm, bài tập tự luận và khảo sát tương tác chỉ trong vài phút. Chia sẻ dễ dàng và chấm điểm tự động.
                    </Paragraph>

                    <div className="survey-input-group">
                        <Input 
                            size="large" 
                            placeholder="Nhập mã bài tập / khảo sát..." 
                            value={surveyCode}
                            onChange={(e) => setSurveyCode(e.target.value)}
                            onPressEnter={handleJoinSurvey}
                            style={{ border: 'none', boxShadow: 'none', fontSize: '1.1rem', background: '#f5f7fa', borderRadius: '10px' }}
                        />
                        <Button type="primary" size="large" onClick={handleJoinSurvey} style={{ background: '#0958d9', borderRadius: '10px', fontWeight: 600, padding: '0 30px' }}>
                            Tham gia <ArrowRightOutlined />
                        </Button>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="deco-icon" style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '4rem', transform: 'rotate(-20deg)' }}>📚</div>
                <div className="deco-icon" style={{ position: 'absolute', top: '20%', right: '10%', fontSize: '5rem', transform: 'rotate(15deg)' }}>🎯</div>
                <div className="deco-icon" style={{ position: 'absolute', bottom: '10%', left: '15%', fontSize: '3rem', transform: 'rotate(10deg)' }}>💡</div>
            </section>

            {/* Features Section */}
            <section className="feature-section" style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={8}>
                        <Card bordered={false} style={{ borderRadius: 16, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
                            <div style={{ width: 60, height: 60, background: '#e0e7ff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <EditOutlined style={{ fontSize: 28, color: '#4255ff' }} />
                            </div>
                            <Title level={4} style={{ color: '#1a1d28' }}>Tạo câu hỏi dễ dàng</Title>
                            <Text style={{ color: '#586380', fontSize: 15 }}>Hỗ trợ đa dạng loại câu hỏi: trắc nghiệm, nhiều lựa chọn, và tự luận.</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card bordered={false} style={{ borderRadius: 16, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
                            <div style={{ width: 60, height: 60, background: '#dcfce7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <ThunderboltOutlined style={{ fontSize: 28, color: '#22c55e' }} />
                            </div>
                            <Title level={4} style={{ color: '#1a1d28' }}>Chấm điểm tự động</Title>
                            <Text style={{ color: '#586380', fontSize: 15 }}>Hệ thống tự động chấm điểm và trả kết quả tức thì cho người làm bài.</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={8}>
                        <Card bordered={false} style={{ borderRadius: 16, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
                            <div style={{ width: 60, height: 60, background: '#fef3c7', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <TrophyOutlined style={{ fontSize: 28, color: '#f59e0b' }} />
                            </div>
                            <Title level={4} style={{ color: '#1a1d28' }}>Giao diện sinh động</Title>
                            <Text style={{ color: '#586380', fontSize: 15 }}>Mang đến trải nghiệm mượt mà, đẹp mắt, tạo cảm hứng học tập và làm việc.</Text>
                        </Card>
                    </Col>
                </Row>
            </section>

            {/* Testimonials */}
            <section className="testimonial-section" style={{ background: 'white' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 50 }}>
                        <Title level={2} style={{ color: '#1a1d28', fontWeight: 800 }}>Người dùng nói gì về chúng tôi?</Title>
                        <Text style={{ fontSize: 16, color: '#586380' }}>Hàng ngàn giáo viên và học sinh đã tin dùng QuizMaster.</Text>
                    </div>

                    {reviews.length > 0 ? (
                        <Carousel autoplay dots={{ className: 'custom-dots' }} style={{ padding: '0 20px 40px' }}>
                            {reviews.map((r, idx) => (
                                <div key={idx}>
                                    <div className="testimonial-card">
                                        <Rate disabled defaultValue={r.rating} style={{ fontSize: 24, marginBottom: 20, color: '#fadb14' }} />
                                        <Title level={3} style={{ fontWeight: 600, color: '#1a1d28', lineHeight: 1.5 }}>
                                            "{r.comment || 'Trải nghiệm tuyệt vời!'}"
                                        </Title>
                                        <div style={{ marginTop: 20 }}>
                                            <Text strong style={{ fontSize: 18, color: '#4255ff' }}>{r.authorName || 'Người dùng ẩn danh'}</Text>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fc', borderRadius: 24 }}>
                            <Text type="secondary" style={{ fontSize: 16 }}>Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm và để lại nhận xét!</Text>
                        </div>
                    )}
                </div>
            </section>
            
            {/* Footer */}
            <footer style={{ background: '#1a1d28', padding: '40px 20px', textAlign: 'center', color: '#8b949e' }}>
                <Text style={{ color: '#8b949e' }}>© 2026 QuizMaster. Tất cả các quyền được bảo lưu.</Text>
            </footer>
        </div>
    );
};

export default LandingPage;

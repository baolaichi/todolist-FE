import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Input, Button, Card, Rate, Modal, App as AntdApp, Radio, Checkbox, Space } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

const { Title, Text } = Typography;

const SurveyTaking: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = AntdApp.useApp();
    const [survey, setSurvey] = useState<any>(null);
    const username = localStorage.getItem('username');
    const [isStarted, setIsStarted] = useState(false);
    const [answers, setAnswers] = useState<any>({});
    const [isFinished, setIsFinished] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewRating, setReviewRating] = useState(5);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!username) {
            message.warning("Bạn cần đăng nhập để làm bài này!");
            navigate('/login');
            return;
        }

        if (id && isNaN(Number(id))) {
            message.error("Mã bài tập / khảo sát không hợp lệ! Vui lòng nhập số.");
            navigate('/');
            return;
        }

        axiosClient.get(`/v1/public/surveys/${id}`)
            .then(res => setSurvey(res.data))
            .catch(() => message.error('Không tìm thấy bài tập / khảo sát! Vui lòng kiểm tra lại đường dẫn.'));
    }, [id, message, username, navigate]);

    const handleStart = () => {
        setIsStarted(true);
        setCurrentIndex(0);
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers({ ...answers, [questionId]: value });
    };

    const handleToggleMultipleChoice = (questionId: number, optionContent: string) => {
        const currentArr = answers[questionId] || [];
        if (currentArr.includes(optionContent)) {
            setAnswers({ ...answers, [questionId]: currentArr.filter((item: string) => item !== optionContent) });
        } else {
            setAnswers({ ...answers, [questionId]: [...currentArr, optionContent] });
        }
    };

    const handleSubmit = async () => {
        try {
            const formattedAnswers = Object.keys(answers).map(qId => {
                const answerValue = answers[qId];
                const content = Array.isArray(answerValue) ? answerValue.join(', ') : answerValue;
                return {
                    question: { id: parseInt(qId) },
                    content: content
                };
            });

            const res = await axiosClient.post(`/surveys/${id}/responses`, {
                answers: formattedAnswers
            });
            
            setSubmitResult(res.data);
            setIsFinished(true);
        } catch (error) {
            message.error("Có lỗi xảy ra khi nộp bài");
        }
    };

    const submitReview = async () => {
        try {
            await axiosClient.post('/v1/public/reviews', {
                authorName: username,
                rating: reviewRating,
                comment: reviewComment
            });
            message.success("Cảm ơn bạn đã đánh giá!");
            navigate('/');
        } catch (error) {
            message.error("Lỗi khi gửi đánh giá");
        }
    };

    if (!survey) return <div style={{ padding: 50, textAlign: 'center' }}>Đang tải... (Bạn có chắc là Backend đã chạy?)</div>;

    const totalQuestions = survey.questions?.length || 0;
    const currentQuestion = survey.questions?.[currentIndex];

    return (
        <div className="survey-container" style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            justifyContent: 'center',
            backgroundColor: '#f0f2f5',
            fontFamily: "'Inter', sans-serif",
            paddingTop: 80
        }}>
            {/* Top Toolbar */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                height: 60,
                background: 'linear-gradient(90deg, #0958d9 0%, #003eb3 100%)',
                boxShadow: '0 2px 10px rgba(9, 88, 217, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                zIndex: 1000
            }}>
                <Button 
                    type="text" 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => navigate(-1)}
                    style={{ fontSize: 16, fontWeight: 500, color: '#ffffff' }}
                    className="toolbar-btn"
                >
                    Quay lại
                </Button>
                <div style={{ color: '#ffffff', fontWeight: 600, fontSize: 18, letterSpacing: 0.5 }}>
                    KHẢO SÁT
                </div>
                <Button 
                    type="text" 
                    icon={<HomeOutlined />} 
                    onClick={() => navigate('/')}
                    style={{ fontSize: 16, fontWeight: 500, color: '#ffffff' }}
                    className="toolbar-btn"
                >
                    Trang chủ
                </Button>
            </div>
            <style>{`
                .toolbar-btn:hover {
                    background: rgba(255, 255, 255, 0.15) !important;
                    color: #ffffff !important;
                }
                .quizlet-card {
                    background: #ffffff !important;
                    border-radius: 16px !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
                    border: 2px solid #0958d9 !important;
                }
                .quizlet-btn-primary {
                    background: #0958d9 !important;
                    border: none !important;
                    border-radius: 8px !important;
                    color: #fff !important;
                    font-weight: 600 !important;
                    font-size: 16px !important;
                    transition: background 0.2s;
                }
                .quizlet-btn-primary:hover {
                    background: #3342cc !important;
                }
                .quizlet-btn-secondary {
                    background: #ffffff !important;
                    border: 2px solid #d9ddff !important;
                    border-radius: 8px !important;
                    color: #4255ff !important;
                    font-weight: 600 !important;
                    font-size: 16px !important;
                }
                .quizlet-btn-secondary:hover {
                    background: #f6f7fb !important;
                }
                .option-block {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                .option-box {
                    padding: 16px 20px;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 16px;
                    color: #141414;
                    display: flex;
                    align-items: center;
                    background: #ffffff;
                }
                .option-box:hover {
                    border-color: #0958d9;
                    background: #f0f5ff;
                }
                .option-box.selected {
                    border-color: #0958d9;
                    background: #e6f4ff;
                    font-weight: 600;
                    box-shadow: 0 4px 12px rgba(9, 88, 217, 0.15);
                }
                .progress-bar-container {
                    background: #e8e8e8;
                    height: 8px;
                    border-radius: 4px;
                    margin: 20px 0;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    background: #4255ff;
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .survey-container {
                    padding: 40px 20px;
                }
                .quizlet-card-inner {
                    padding: 40px 20px;
                }
                .survey-title {
                    font-size: 30px !important;
                }
                
                @media (max-width: 576px) {
                    .survey-container { padding: 15px 10px; }
                    .quizlet-card-inner { padding: 20px 15px; }
                    .survey-title { font-size: 24px !important; }
                    .option-block { padding: 12px 15px; font-size: 15px; }
                    .quizlet-btn-primary, .quizlet-btn-secondary { width: 100% !important; max-width: none !important; margin-bottom: 10px; }
                    .action-buttons { flex-direction: column-reverse; gap: 10px; }
                    .action-buttons button { margin-bottom: 0; }
                    .completion-score { font-size: 36px !important; }
                    .completion-msg { font-size: 20px !important; }
                }
            `}</style>
            
            <div style={{ width: '100%', maxWidth: 700 }}>
                {!isStarted ? (
                    <Card className="quizlet-card quizlet-card-inner" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 20, color: '#4255ff' }}>📝</div>
                        <Title level={2} className="survey-title" style={{ color: '#1a1d28', fontWeight: 700 }}>{survey.title}</Title>
                        <Text type="secondary" style={{ fontSize: 16, color: '#586380', display: 'block', marginBottom: 40 }}>
                            {survey.description}
                        </Text>
                        <Button className="quizlet-btn-primary" size="large" onClick={handleStart} style={{ height: 56, width: '100%', maxWidth: 300 }}>
                            Tiếp theo 🚀
                        </Button>
                    </Card>
                ) : !isFinished ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Title level={4} style={{ margin: 0, color: '#1a1d28' }}>{survey.title}</Title>
                            <Text strong style={{ color: '#586380' }}>
                                {currentIndex + 1} / {totalQuestions}
                            </Text>
                        </div>
                        
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}></div>
                        </div>
                        
                        {totalQuestions === 0 ? (
                            <Card className="quizlet-card quizlet-card-inner" style={{ textAlign: 'center' }}>
                                <Text style={{ fontSize: 18, color: '#586380' }}>Bài tập này chưa có câu hỏi nào.</Text>
                            </Card>
                        ) : (
                            <Card className="quizlet-card quizlet-card-inner" style={{ minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flexGrow: 1 }}>
                                    <Text strong style={{ fontSize: 22, color: '#1a1d28', display: 'block', marginBottom: 30, lineHeight: 1.5 }}>
                                        {currentQuestion.content}
                                    </Text>
                                    
                                    {currentQuestion.type === 'TEXT' && (
                                        <Input.TextArea 
                                            rows={4} 
                                            placeholder="Nhập câu trả lời của bạn..." 
                                            value={answers[currentQuestion.id] || ''}
                                            onChange={e => handleAnswerChange(currentQuestion.id, e.target.value)}
                                            style={{ borderRadius: 12, border: '2px solid #e8e8e8', fontSize: 16, padding: 16 }}
                                        />
                                    )}

                                    {currentQuestion.type === 'SINGLE_CHOICE' && (
                                        <div>
                                            {currentQuestion.options?.map((opt: any) => {
                                                const isSelected = answers[currentQuestion.id] === opt.content;
                                                return (
                                                    <div 
                                                        key={opt.id} 
                                                        className={`option-block ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => handleAnswerChange(currentQuestion.id, opt.content)}
                                                    >
                                                            <div style={{
                                                                width: 24, height: 24, borderRadius: '50%', 
                                                                border: `2px solid ${isSelected ? '#4255ff' : '#ccc'}`, 
                                                                marginRight: 16, marginTop: 2,
                                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                                flexShrink: 0
                                                            }}>
                                                                {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4255ff' }}></div>}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                {opt.imageUrl && (
                                                                    <img 
                                                                        src={opt.imageUrl} 
                                                                        alt="option" 
                                                                        style={{ maxWidth: '100%', maxHeight: 200, display: 'block', marginBottom: 10, borderRadius: 8, objectFit: 'contain' }} 
                                                                    />
                                                                )}
                                                                <span style={{ display: 'block', marginTop: opt.imageUrl ? 0 : 2 }}>{opt.content}</span>
                                                            </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                                        <div>
                                            <Text type="secondary" style={{ display: 'block', marginBottom: 15 }}>* Chọn nhiều đáp án</Text>
                                            {currentQuestion.options?.map((opt: any) => {
                                                const selectedArr = answers[currentQuestion.id] || [];
                                                const isSelected = selectedArr.includes(opt.content);
                                                return (
                                                    <div 
                                                        key={opt.id} 
                                                        className={`option-block ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => handleToggleMultipleChoice(currentQuestion.id, opt.content)}
                                                    >
                                                            <div style={{
                                                                width: 24, height: 24, borderRadius: 6, 
                                                                border: `2px solid ${isSelected ? '#4255ff' : '#ccc'}`, 
                                                                marginRight: 16, marginTop: 2,
                                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                                background: isSelected ? '#4255ff' : 'transparent',
                                                                flexShrink: 0
                                                            }}>
                                                                {isSelected && <span style={{ color: '#fff', fontSize: 14 }}>✓</span>}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                {opt.imageUrl && (
                                                                    <img 
                                                                        src={opt.imageUrl} 
                                                                        alt="option" 
                                                                        style={{ maxWidth: '100%', maxHeight: 200, display: 'block', marginBottom: 10, borderRadius: 8, objectFit: 'contain' }} 
                                                                    />
                                                                )}
                                                                <span style={{ display: 'block', marginTop: opt.imageUrl ? 0 : 2 }}>{opt.content}</span>
                                                            </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                        
                        <div className="action-buttons" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30 }}>
                            <Button 
                                className="quizlet-btn-secondary" 
                                size="large" 
                                style={{ width: 120, height: 50 }}
                                disabled={currentIndex === 0}
                                onClick={() => setCurrentIndex(currentIndex - 1)}
                            >
                                Trước
                            </Button>
                            
                            {currentIndex < totalQuestions - 1 ? (
                                <Button 
                                    className="quizlet-btn-primary" 
                                    size="large" 
                                    style={{ width: 120, height: 50 }}
                                    onClick={() => setCurrentIndex(currentIndex + 1)}
                                >
                                    Tiếp theo
                                </Button>
                            ) : (
                                <Button 
                                    className="quizlet-btn-primary" 
                                    size="large" 
                                    style={{ width: 140, height: 50, background: '#18b77d' }}
                                    onClick={handleSubmit}
                                >
                                    Nộp bài 💌
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <Card className="quizlet-card quizlet-card-inner" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 20 }}>🎉</div>
                        <Title level={2} style={{ color: '#1a1d28', fontWeight: 700 }}>Hoàn thành!</Title>
                        <Text style={{ fontSize: 16, color: '#586380', display: 'block', marginBottom: 30 }}>Bạn đã hoàn thành bài tập này.</Text>
                        
                        {submitResult && submitResult.totalGradedQuestions > 0 && (
                            <div style={{ 
                                background: '#f0f2ff', borderRadius: 16, padding: 30, 
                                margin: '0 auto 30px', border: '2px solid #d9ddff', maxWidth: 400 
                            }}>
                                <Text strong style={{ fontSize: 18, color: '#586380', display: 'block', marginBottom: 10 }}>Kết quả của bạn</Text>
                                <Text strong className="completion-score" style={{ fontSize: 48, color: (submitResult.score / submitResult.totalGradedQuestions) >= 0.7 ? '#18b77d' : '#ff4d4f' }}>
                                    {Math.round((submitResult.score / submitResult.totalGradedQuestions) * 100)}%
                                </Text>
                                <Text strong className="completion-msg" style={{ fontSize: 24, display: 'block', color: (submitResult.score / submitResult.totalGradedQuestions) >= 0.7 ? '#18b77d' : '#ff4d4f', marginTop: 10 }}>
                                    {(submitResult.score / submitResult.totalGradedQuestions) >= 0.7 ? '🏆 Chúc mừng bạn đã đạt điểm xuất sắc!' : '💪 Không sao đâu, lần sau hãy cố gắng hơn nhé!'}
                                </Text>
                                <Text style={{ display: 'block', color: '#586380', marginTop: 10, fontSize: 16 }}>
                                    Đúng {submitResult.score} trên tổng số {submitResult.totalGradedQuestions} câu ({(submitResult.score / submitResult.totalGradedQuestions * 10).toFixed(1)} điểm)
                                </Text>
                            </div>
                        )}

                        <div style={{ 
                            background: '#fafafa', borderRadius: 12, padding: 25, 
                            margin: '0 auto 30px', border: '1px solid #f0f0f0', maxWidth: 400 
                        }}>
                            <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 10 }}>Bạn đánh giá bài làm này thế nào?</Text>
                            <Rate value={reviewRating} onChange={setReviewRating} style={{ fontSize: 28, color: '#fadb14', marginBottom: 15 }} />
                            <Input.TextArea rows={3} placeholder="Hãy để lại nhận xét của bạn (không bắt buộc)..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} style={{ marginBottom: 15 }} />
                            <Button type="primary" onClick={submitReview} style={{ width: '100%', height: 40, borderRadius: 8, background: '#4255ff' }}>
                                Gửi đánh giá & Về trang chủ
                            </Button>
                        </div>

                        <Button type="text" onClick={() => navigate('/')} style={{ height: 40, width: 200, color: '#586380' }}>
                            Bỏ qua đánh giá, về trang chủ 🏠
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default SurveyTaking;

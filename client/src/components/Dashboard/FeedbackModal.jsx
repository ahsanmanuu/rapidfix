import { useState } from 'react';
import { Button, IconButton, Typography, Box, Rating } from '@mui/material';
import { Close, Check, Star, SentimentVeryDissatisfied, SentimentDissatisfied, SentimentSatisfied, SentimentSatisfiedAlt, SentimentVerySatisfied } from '@mui/icons-material';

const customIcons = {
    1: { icon: <SentimentVeryDissatisfied color="error" />, label: 'Very Dissatisfied' },
    2: { icon: <SentimentDissatisfied color="error" />, label: 'Dissatisfied' },
    3: { icon: <SentimentSatisfied color="warning" />, label: 'Neutral' },
    4: { icon: <SentimentSatisfiedAlt color="success" />, label: 'Satisfied' },
    5: { icon: <SentimentVerySatisfied color="success" />, label: 'Very Satisfied' },
};

const IconContainer = (props) => {
    const { value, ...other } = props;
    return <span {...other} className="mx-2 hover:scale-125 transition-transform">{customIcons[value].icon}</span>;
};

const FeedbackModal = ({ job, onClose, onSubmit }) => {
    // Structured survey questions based on Laboratory Services Template
    const [survey, setSurvey] = useState({
        timeliness: 0,
        expertise: 0,
        professionalism: 0,
        honesty: 0,
        behavior: 0,
        knowledge: 0,
        respect: 0,
        overall: 0
    });

    // Additional metrics for backend compatibility mapped later if needed
    const [recommend, setRecommend] = useState(0); // NPS Score
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Map survey to the detailed object expected by backend or stick to new schema
        // Assuming backend handles flexible JSON or we map these 5 to the previous 8 fields conceptually
        // For now, let's send this clean structure.
        const payload = {
            ...survey,
            recommendationScore: recommend
        };
        onSubmit(job.id, payload, comment);
    };

    const handleRatingChange = (key, value) => {
        setSurvey(prev => ({ ...prev, [key]: value }));
    };

    const questions = [
        { id: 'timeliness', label: 'Timeliness', question: 'Was the technician punctual?' },
        { id: 'expertise', label: 'Expertise', question: 'Did they show good technical skills?' },
        { id: 'professionalism', label: 'Professionalism', question: 'Was the interaction professional?' },
        { id: 'honesty', label: 'Honesty', question: 'Was the pricing and service honest?' },
        { id: 'behavior', label: 'Behavior', question: 'Was their behavior appropriate?' },
        { id: 'knowledge', label: 'Knowledge', question: 'Did they answer your questions well?' },
        { id: 'respect', label: 'Respect', question: 'Did they treat you with respect?' },
        { id: 'overall', label: 'Overall', question: 'Your overall satisfaction?' },
    ];

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white text-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                    <div>
                        <Typography variant="h6" fontWeight="bold" color="primary" sx={{ fontSize: '1.1rem' }}>Service Feedback</Typography>
                        <p className="text-slate-500 text-xs mt-0.5">Ref: {job.serviceType} (#{job.id.slice(-6)})</p>
                    </div>
                    <IconButton onClick={onClose} size="small" color="error">
                        <Close />
                    </IconButton>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Matrix Table */}
                    <div className="space-y-3">
                        {questions.map((q) => (
                            <div key={q.id} className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-blue-200 transition-colors">
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-700 text-sm">{q.label}</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">{q.question}</p>
                                </div>
                                <div className="shrink-0 self-end sm:self-auto">
                                    <Rating
                                        name={q.id}
                                        value={survey[q.id]}
                                        onChange={(_, val) => handleRatingChange(q.id, val)}
                                        precision={1}
                                        size="medium"
                                        emptyIcon={<Star style={{ opacity: 0.3 }} fontSize="inherit" />}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recommendation NPS */}
                    <div className="p-3 rounded-lg border border-slate-100 bg-blue-50/30">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-slate-700 text-xs">Recommend to a friend?</h4>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">{recommend}/10</span>
                        </div>
                        <div className="flex justify-between gap-1">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setRecommend(num)}
                                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all ${recommend === num
                                        ? 'bg-blue-600 text-white shadow-md scale-110'
                                        : 'bg-white border border-slate-200 text-slate-500 hover:bg-white hover:border-blue-300'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium uppercase tracking-wide px-0.5">
                            <span>No</span>
                            <span>Yes</span>
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <textarea
                            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                            rows="2"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Optional comments..."
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={onClose}
                            size="small"
                            sx={{ flex: 1, borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<Check fontSize="small" />}
                            sx={{ flex: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 'bold', fontSize: '0.75rem', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
                        >
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;

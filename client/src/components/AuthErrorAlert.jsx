import { useEffect, useState } from 'react';
import { XCircle, X } from 'lucide-react';

const AuthErrorAlert = ({ message, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onClose, 300); // Wait for exit animation
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 10000,
                transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '20px 25px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(249, 89, 89, 0.3)',
                    borderLeft: '5px solid #f95959',
                    maxWidth: '400px',
                    minWidth: '300px'
                }}
            >
                <div style={{ marginRight: '15px', color: '#f95959' }}>
                    <XCircle size={32} />
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '16px', fontWeight: '700', fontFamily: "'Montserrat', sans-serif" }}>
                        Login Failed
                    </h4>
                    <p style={{ margin: 0, color: '#666', fontSize: '13px', fontFamily: "'Montserrat', sans-serif" }}>
                        {message}
                    </p>
                </div>
                <button
                    onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#999',
                        cursor: 'pointer',
                        padding: '5px',
                        marginLeft: '10px',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.color = '#333'}
                    onMouseLeave={e => e.target.style.color = '#999'}
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default AuthErrorAlert;

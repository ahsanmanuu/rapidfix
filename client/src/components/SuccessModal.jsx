import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessModal = ({ isOpen, onComplete }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onComplete();
            }, 2500); // Auto redirect after 2.5s
            return () => clearTimeout(timer);
        }
    }, [isOpen, onComplete]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                textAlign: 'center',
                animation: 'scaleUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)'
                }}>
                    <CheckCircle size={50} color="#fff" strokeWidth={3} />
                </div>
                <h2 style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#333',
                    marginBottom: '10px',
                    fontFamily: "'Montserrat', sans-serif"
                }}>
                    Welcome Aboard!
                </h2>
                <p style={{
                    fontSize: '18px',
                    color: '#666',
                    fontFamily: "'Montserrat', sans-serif"
                }}>
                    Registration Successful. Redirecting to Dashboard...
                </p>
            </div>
            <style>
                {`
                    @keyframes scaleUp {
                        from { transform: scale(0.5); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                `}
            </style>
        </div>
    );
};

export default SuccessModal;

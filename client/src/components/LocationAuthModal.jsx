import { useState, useEffect } from 'react';
import { MapPin, ShieldCheck, CheckCircle } from 'lucide-react';

const LocationAuthModal = ({ isOpen, onConfirm }) => {
    const [isChecked, setIsChecked] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setIsVisible(false); // Immediate hide for logic, cleanup via timeout if needed
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease'
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '24px',
                padding: '40px',
                width: '90%',
                maxWidth: '500px',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                transform: isVisible ? 'scale(1)' : 'scale(0.9)',
                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                border: '1px solid rgba(249, 89, 89, 0.1)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#fff0f0',
                    color: '#f95959',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                }}>
                    <MapPin size={40} strokeWidth={2.5} />
                </div>

                <h2 style={{
                    color: '#333',
                    fontSize: '24px',
                    fontWeight: '800',
                    fontFamily: "'Montserrat', sans-serif",
                    marginBottom: '16px'
                }}>
                    Location Access Required
                </h2>

                <p style={{
                    color: '#666',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    fontFamily: "'Montserrat', sans-serif",
                    marginBottom: '24px'
                }}>
                    <strong>Location Permission is MANDATORY.</strong><br />
                    Please register from your <strong>Original Work Place</strong>, otherwise
                    <span style={{ color: '#f95959', fontWeight: 'bold' }}> Job Assignments will not work correctly.</span>
                </p>

                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '16px',
                    marginBottom: '30px',
                    textAlign: 'left',
                    border: '1px solid #eee'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => setIsChecked(!isChecked)}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            border: `2px solid ${isChecked ? '#f95959' : '#ddd'}`,
                            backgroundColor: isChecked ? '#f95959' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                            marginTop: '2px',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}>
                            {isChecked && <CheckCircle size={16} color="#fff" />}
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: '#555', fontFamily: "'Montserrat', sans-serif" }}>
                            I agree to the <strong>Partner Terms & Conditions</strong> and certify that I am currently at my base of operations.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => isChecked && onConfirm()}
                    disabled={!isChecked}
                    style={{
                        background: isChecked ? 'linear-gradient(45deg, #f95959, #ff7b7b)' : '#eee',
                        color: isChecked ? '#fff' : '#aaa',
                        border: 'none',
                        padding: '16px 32px',
                        borderRadius: '30px',
                        fontSize: '14px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        cursor: isChecked ? 'pointer' : 'not-allowed',
                        width: '100%',
                        boxShadow: isChecked ? '0 10px 20px rgba(249, 89, 89, 0.3)' : 'none',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    <ShieldCheck size={20} />
                    Enable Location & Proceed
                </button>
            </div>
        </div>
    );
};

export default LocationAuthModal;

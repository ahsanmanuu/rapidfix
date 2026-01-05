const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "w-full py-3 px-6 rounded-lg font-bold transition-all transform hover:-translate-y-0.5 shadow-lg active:translate-y-0 focus:outline-none";

    const variants = {
        primary: "text-white hover:opacity-90",
        secondary: "bg-gray-700 text-white hover:bg-gray-600",
        danger: "bg-red-600 text-white hover:bg-red-700"
    };

    const gradientStyle = variant === 'primary' ? { backgroundImage: 'var(--gradient-main)' } : {};

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${className}`}
            style={gradientStyle}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;

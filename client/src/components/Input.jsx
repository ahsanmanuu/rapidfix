const Input = ({ label, type = 'text', ...props }) => {
    return (
        <div className="mb-4">
            <label className="block text-gray-400 text-sm font-bold mb-2 ml-1">
                {label}
            </label>
            <input
                type={type}
                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                {...props}
            />
        </div>
    );
};

export default Input;

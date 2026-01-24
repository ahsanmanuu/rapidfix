import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-slate-800">
            <h1 className="text-9xl font-extrabold text-blue-600 mb-4">404</h1>
            <h2 className="text-3xl font-bold mb-6">Page Not Found</h2>
            <p className="text-gray-500 mb-8 max-w-md text-center">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link
                to="/"
                className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
            >
                Go to Homepage
            </Link>
        </div>
    );
};

export default NotFound;

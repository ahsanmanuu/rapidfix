import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 text-white p-8">
                    <div className="bg-red-900/50 p-8 rounded-xl max-w-2xl w-full border border-red-500">
                        <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
                        <div className="bg-black/50 p-4 rounded text-sm font-mono overflow-auto max-h-60 mb-4">
                            <p className="text-red-300 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre className="text-gray-400">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-colors"
                        >
                            Reload Page
                        </button>
                        <button
                            onClick={this.props.onClose}
                            className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

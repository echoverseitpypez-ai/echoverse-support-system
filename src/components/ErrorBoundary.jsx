import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
            <div style={{ padding: '3rem' }}>
              <h2 style={{ color: 'var(--danger-600)', marginBottom: '1rem' }}>
                🚨 Something went wrong
              </h2>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  className="btn primary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
                <button 
                  className="btn secondary"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
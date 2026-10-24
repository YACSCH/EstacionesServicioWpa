import { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faRotate } from '@fortawesome/free-solid-svg-icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <h2>Algo salió mal</h2>
          <p>Se ha producido un error inesperado. Puedes intentar recargar la página.</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" className="btn btn--primary" onClick={this.handleReload}>
              <FontAwesomeIcon icon={faRotate} /> Recargar página
            </button>
            <button type="button" className="btn btn--ghost" onClick={this.handleReset}>
              Volver a intentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

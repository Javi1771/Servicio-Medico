/* eslint-disable @typescript-eslint/no-unused-vars */

import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  //! Actualiza el estado cuando ocurre un error
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  //* Puedes registrar el error en un servicio de logging
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturó un error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      //* Puedes personalizar este mensaje o mostrar un componente alternativo
      return <h1>Algo salió mal.</h1>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

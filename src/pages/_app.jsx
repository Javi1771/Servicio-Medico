import "../styles/globals.css";
import { FormularioProvider } from "../context/FormularioContext";
import AuthGuard from "../components/AuthGuard";
import Head from "next/head";
import ErrorBoundary from "../components/ErrorBoundary";
import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    //* Manejador que se ejecuta al intentar recargar/cerrar la pestaña
    const handleBeforeUnload = (event) => {
      //* Para algunos navegadores, es necesario prevenir el evento
      //* y asignar algo a event.returnValue (aunque ya no se usa texto personalizado).
      event.preventDefault();
      event.returnValue = "";
      //* Esto indicará al navegador que muestre el cuadro de confirmación estándar
    };

    //* Suscribimos el evento
    window.addEventListener("beforeunload", handleBeforeUnload);

    //* Al desmontar, quitamos el listener para evitar fugas de memoria
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href="/pandora.ico" type="image/x-icon" />
        <title>PANDORA</title>
      </Head>
      <ErrorBoundary>
        <FormularioProvider>
          <AuthGuard>
            <Component {...pageProps} />
          </AuthGuard>
        </FormularioProvider>
      </ErrorBoundary>
    </>
  );
}

export default MyApp;

import "../styles/globals.css";
import { FormularioProvider } from "../context/FormularioContext";
import AuthGuard from "../components/AuthGuard";
import Head from "next/head";
import ErrorBoundary from "../components/ErrorBoundary";
import { useEffect } from "react";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    //* Variable para controlar si debemos interceptar
    let shouldIntercept = true;

    const handleBeforeUnload = (event) => {
      if (!shouldIntercept) {
        return;
      }
      
      event.preventDefault();
      event.returnValue = "";
    };

    //* Deshabilitar la interceptación durante navegaciones internas
    const handleRouteChangeStart = () => {
      shouldIntercept = false;
      //* Reactivar después de un breve delay
      setTimeout(() => {
        shouldIntercept = true;
      }, 100);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [router]);

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
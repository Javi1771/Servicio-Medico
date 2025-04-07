import "../styles/globals.css";
// import { useEffect } from "react";
import { FormularioProvider } from "../context/FormularioContext";
import AuthGuard from "../components/AuthGuard";
import Head from "next/head";
import ErrorBoundary from "../components/ErrorBoundary";

function MyApp({ Component, pageProps }) {
  // useEffect(() => {
  //   const handleBeforeUnload = (e) => {
  //     e.preventDefault();
  //     e.returnValue = '';
  //   };

  //   window.addEventListener("beforeunload", handleBeforeUnload);
  //   return () => {
  //     window.removeEventListener("beforeunload", handleBeforeUnload);
  //   };
  // }, []);

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

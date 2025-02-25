// import "../styles/globals.css";
// import { useEffect } from "react";
// import { FormularioProvider } from "../context/FormularioContext";
// import AuthGuard from "../components/AuthGuard";

// function MyApp({ Component, pageProps }) {
//   useEffect(() => {
//     // Prevenir recargas de página no deseadas
//     const handleBeforeUnload = (e) => {
//       e.preventDefault();
//       e.returnValue = ''; // Standard for most browsers
//     };
    
//     window.addEventListener("beforeunload", handleBeforeUnload);

//     return () => {
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//     };
//   }, []);

//   return (
//     <FormularioProvider>
//       <AuthGuard>
//         <Component {...pageProps} />
//       </AuthGuard>
//     </FormularioProvider>
//   );
// }

// export default MyApp;

 
import "../styles/globals.css";
import { FormularioProvider } from "../context/FormularioContext";
import AuthGuard from "../components/AuthGuard";
import Head from "next/head"; // ✅ Importa Head de Next.js

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <title>Mi Aplicación</title>
      </Head>

      <FormularioProvider>
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      </FormularioProvider>
    </>
  );
}

export default MyApp;

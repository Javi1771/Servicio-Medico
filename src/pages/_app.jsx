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

function MyApp({ Component, pageProps }) {
  return (
    <FormularioProvider>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </FormularioProvider>
  );
}

export default MyApp;
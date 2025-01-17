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

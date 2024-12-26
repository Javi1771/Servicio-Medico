import '../styles/globals.css';
import { FormularioProvider } from "../context/FormularioContext";

function MyApp({ Component, pageProps }) {
  return (
    <FormularioProvider>
      <Component {...pageProps} />
    </FormularioProvider>
  );
}

export default MyApp;

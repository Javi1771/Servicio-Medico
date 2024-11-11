import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const AuthGuard = ({ children }) => {
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const verifyAccess = () => {
            const token = Cookies.get('token');
            const clavetipousuario = Cookies.get('clavetipousuario'); // Obtener el tipo de usuario

            if (token) {
                // Verificar el tipo de usuario y redirigir al dashboard correspondiente
                switch (clavetipousuario) {
                    case '1': // Doctor
                        if (router.pathname !== '/dashboard-doctor') {
                            router.push('/dashboard-doctor');
                        } else {
                            setIsVerified(true);
                        }
                        break;
                    case '2': // Enfermera
                        if (router.pathname !== '/dashboard-enfermera') {
                            router.push('/dashboard-enfermera');
                        } else {
                            setIsVerified(true);
                        }
                        break;
                    case '3': // Administración Pases
                        if (router.pathname !== '/dashboard-administracion-pases') {
                            router.push('/dashboard-administracion-pases');
                        } else {
                            setIsVerified(true);
                        }
                        break;
                    case '4': // Contadora
                        if (router.pathname !== '/dashboard-contadora') {
                            router.push('/dashboard-contadora');
                        } else {
                            setIsVerified(true);
                        }
                        break;
                    case '5': // Capturista Recetas Generales
                        if (router.pathname !== '/dashboard-capturista') {
                            router.push('/dashboard-capturista');
                        } else {
                            setIsVerified(true);
                        }
                        break;
                    case '6': // Administrador
                        if (router.pathname !== '/dashboard-administrador') {
                            router.push('/dashboard-administrador');
                        } else {
                            setIsVerified(true);
                        }
                        break;
                    default:
                        // Si el tipo de usuario no es válido, redirigir al login
                        router.push('/');
                        break;
                }
            } else {
                // Si no existe el token, redirigir al login
                router.push('/');
            }
        };

        verifyAccess(); // Verificar acceso en el montaje del componente
    }, [router.pathname]);

    if (!isVerified) return null;

    return <>{children}</>;
};

export default AuthGuard;

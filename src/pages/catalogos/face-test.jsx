// pages/face-test.jsx
import FaceAuth from "./components/FaceAuth";

export default function FaceTestPage() {
  // Esta URL sería la que tienes guardada en tu BD (Cloudinary).
  // Por ejemplo:
  const storedCloudinaryUrl = "https://res.cloudinary.com/dkohopldz/image/upload/v1737733796/foto_carlos_f6vhks.jpg";

  return (
    <div>
      <h1>Prueba de Autenticación Facial</h1>
      <FaceAuth storedImageUrl={storedCloudinaryUrl} />
    </div>
  );
}

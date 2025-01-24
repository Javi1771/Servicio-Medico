// pages/face-test.jsx
import FaceAuth from "./components/FaceAuth";
import styles from "../css/FaceTestPage.module.css";

export default function FaceTestPage() {
  const storedCloudinaryUrl = "https://res.cloudinary.com/dkohopldz/image/upload/v1737733796/foto_carlos_f6vhks.jpg";

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Prueba de Autenticación Facial</h1>
      <div className={styles.faceAuthContainer}>
        <FaceAuth storedImageUrl={storedCloudinaryUrl} />
      </div>
    </div>
  );
}

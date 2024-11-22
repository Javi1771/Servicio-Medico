// farmacia/components/Banner.jsx
import React from "react";
import Image from "next/image";
import styles from "../../css/EstilosFarmacia/RegisterMedicamento.module.css";

const Banner = ({ imageSrc, altText }) => {
  return (
    <div className={styles.banner}>
      <Image
        src={imageSrc}
        alt={altText}
        layout="responsive"
        width={1200} // Ancho
        height={200} // Reducir altura
        className={styles.image}
        priority
      />
    </div>
  );
};

export default Banner;

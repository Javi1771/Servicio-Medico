// components/RecetasPendientes.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../css/EstilosFarmacia/RecetasPendientes.module.css';
import { 
  FaCalendarAlt, 
  FaExclamationCircle, 
  FaClipboardList, 
  FaTimes,
  FaChevronDown,
  FaPills
} from 'react-icons/fa';

const RecetasPendientes = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para almacenar medicamentos de cada receta (clave: FOLIO_SURTIMIENTO)
  const [medicationDetails, setMedicationDetails] = useState({});
  // Estado para controlar el modal de medicamentos
  const [modalVisible, setModalVisible] = useState(false);
  const [modalFolio, setModalFolio] = useState(null);

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Mostrar 12 tarjetas por página

  useEffect(() => {
    const fetchPendientes = async () => {
      try {
        const res = await fetch('/api/farmacia/recetasPendientes');
        if (!res.ok) {
          throw new Error('Error al obtener las recetas pendientes');
        }
        const json = await res.json();
        // La API ya trae TOP 100 ordenados por FOLIO_SURTIMIENTO DESC
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPendientes();
  }, []);

  if (loading) return <p>Cargando recetas pendientes...</p>;
  if (error) return <p>Error: {error}</p>;

  // Función para obtener medicamentos pendientes de un surtimiento
  const fetchMedications = async (folio) => {
    try {
      const res = await fetch(`/api/farmacia/detalleSurtimientos?id=${folio}`);
      if (!res.ok) {
        throw new Error('Error al obtener medicamentos pendientes');
      }
      const meds = await res.json();
      setMedicationDetails(prev => ({ ...prev, [folio]: meds }));
    } catch (err) {
      console.error(err);
    }
  };

  // Función para abrir el modal y cargar medicamentos si es necesario
  const openModal = (folio) => {
    if (!medicationDetails[folio]) {
      fetchMedications(folio);
    }
    setModalFolio(folio);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalFolio(null);
  };

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className={styles.container}>
      {/* Botón de regresar */}
      <div className={styles.backButtonContainer}>
        <Link href="/inicio-servicio-medico" className={styles.backButton}>
          Regresar
        </Link>
      </div>

      {/* Contenedor para título y descripción */}
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>
          <FaExclamationCircle className={styles.iconLeft} />
          Recetas Pendientes
        </h1>
        <p className={styles.description}>
          <FaClipboardList className={styles.iconLeft} />
          Consulta aquí las últimas recetas que quedaron pendientes para darles seguimiento y asegurar su pronta atención.
        </p>
      </div>

      <div className={styles.cardsContainer}>
        {currentItems.map((item) => {
          const folio = item.FOLIO_SURTIMIENTO;
          return (
            <div className={styles.card} key={folio}>
              <div className={styles.cardContent}>
                {/* Ícono grande en el centro */}
                <FaCalendarAlt className={styles.cardIcon} />

                {/* Información principal */}
                <div className={styles.cardTitle}>
                  Fecha: {item.FECHA_EMISION}
                </div>
                <div className={styles.cardSubtitle}>
                  Nómina: {item.NOMINA}
                </div>
                <div className={styles.cardSubtitle}>
                  Paciente: {item.NOMBRE_PACIENTE}
                </div>

                {/* Estatus */}
                <div className={styles.statusTag}>
                  <FaExclamationCircle style={{ marginRight: '4px' }} />
                  Pendiente
                </div>
              </div>

              {/* Footer con botón para ver medicamentos pendientes */}
              <div className={styles.cardFooter}>
                <button
                  className={styles.viewMoreBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(folio);
                  }}
                >
                  <FaChevronDown className={styles.iconLeft} />
                  Ver medicamentos pendientes
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
            onClick={() => goToPage(page)}
          >
            {page}
          </button>
        ))}

        <button
          className={styles.pageButton}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </div>

      {/* Modal de medicamentos pendientes */}
      {modalVisible && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={closeModal}>
              <FaTimes />
            </button>
            <h2 className={styles.modalTitle}>
              Medicamentos pendientes para surtimiento: {modalFolio}
            </h2>
            <div className={styles.modalBody}>
              {medicationDetails[modalFolio] && medicationDetails[modalFolio].length > 0 ? (
                medicationDetails[modalFolio].map((med) => (
                  <div key={med.claveMedicamento} className={styles.medicationCard}>
                    <div className={styles.infoRow}>
                      <FaPills className={styles.iconLeft} />
                      <strong>Clave Medicamento:</strong>
                      <span className={styles.value}>{med.claveMedicamento}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FaClipboardList className={styles.iconLeft} />
                      <strong>Indicaciones:</strong>
                      <span className={styles.value}>{med.indicaciones}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.iconLeft}>💊</span>
                      <strong>Cantidad:</strong>
                      <span className={styles.value}>{med.cantidad}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.iconLeft}>📦</span>
                      <strong>Piezas:</strong>
                      <span className={styles.value}>{med.piezas}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <FaExclamationCircle className={styles.iconLeft} style={{ color: '#666' }} />
                      <strong>Entregado:</strong>
                      <span className={styles.value}>{med.entregado}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No hay medicamentos pendientes.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecetasPendientes;

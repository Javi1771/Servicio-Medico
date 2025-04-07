// components/RecetasPendientes.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
import TopMedicamentos from './components/topMedicamentos'; // Asegúrate de que la ruta sea correcta

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

  // Estado para el contenedor del modal, que crearemos dinámicamente
  const [modalContainer, setModalContainer] = useState(null);

  // Creamos y agregamos un contenedor para el modal al body del documento
  useEffect(() => {
    const modalDiv = document.createElement('div');
    document.body.appendChild(modalDiv);
    setModalContainer(modalDiv);
    return () => {
      document.body.removeChild(modalDiv);
    };
  }, []);

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
    <div className={styles.mainContainer}>
      {/* Fila superior: Recetas Pendientes */}
      <div className={styles.recetasContainer}>
        {/* Botón de regresar */}
        <div className={styles.backButtonContainer}>
          <Link href="/inicio-servicio-medico" className={styles.backButton}>
            Regresar
          </Link>
        </div>

        {/* Título y descripción */}
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>
            <FaExclamationCircle className={styles.iconLeft} />
            Recetas Pendientes
          </h1>
          <p className={styles.description}>
            <FaClipboardList className={styles.iconLeft} />
            Consulta aquí las últimas recetas pendientes para darles seguimiento y asegurar su pronta atención.
          </p>
        </div>

        {/* Tarjetas de Recetas */}
        <div className={styles.cardsContainer}>
          {currentItems.map((item) => {
            const folio = item.FOLIO_SURTIMIENTO;
            return (
              <div className={styles.card} key={folio}>
                <div className={styles.cardContent}>
                  <FaCalendarAlt className={styles.cardIcon} />
                  <div className={styles.cardTitle}>Fecha: {item.FECHA_EMISION}</div>
                  <div className={styles.cardSubtitle}>Nómina: {item.NOMINA}</div>
                  <div className={styles.cardSubtitle}>Paciente: {item.NOMBRE_PACIENTE}</div>
                  <div className={styles.statusTag}>
                    <FaExclamationCircle style={{ marginRight: '4px' }} />
                    Pendiente
                  </div>
                </div>
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

        {/* Modal de medicamentos pendientes (React Portal) */}
        {modalVisible && modalContainer && ReactDOM.createPortal(
          <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>
                  Medicamentos pendientes: {modalFolio}
                </h2>
                <button className={styles.modalCloseBtn} onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>
              <div className={styles.modalBody}>
                {medicationDetails[modalFolio] && medicationDetails[modalFolio].length > 0 ? (
                  medicationDetails[modalFolio].map((med, index) => (
                    <div key={`${med.claveMedicamento}-${index}`} className={styles.medicationCard}>
                      {med.nombreMedicamento && (
                        <div className={styles.infoRow}>
                          <FaPills className={styles.iconLeft} />
                          <strong>Nombre:</strong>
                          <span className={styles.value}>{med.nombreMedicamento}</span>
                        </div>
                      )}
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
          </div>,
          modalContainer
        )}
      </div>

      {/* Fila inferior: Top Medicamentos */}
      <div className={styles.topMedicamentosWrapper}>
        <TopMedicamentos />
      </div>
    </div>
  );
};

export default RecetasPendientes;

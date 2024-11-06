import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import styles from '../css/especialidades.module.css';
import Image from 'next/image';
import { useRouter } from 'next/router';

export default function EspecialidadesTable() {
  const [especialidades, setEspecialidades] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Añadimos el estado para manejar el mensaje de éxito
  const [newEspecialidad, setNewEspecialidad] = useState({
    claveespecialidad: '',
    especialidad: '',
    especial: '',
    estatus: false,
  });
  const [selectedEspecialidad, setSelectedEspecialidad] = useState(null);

  // Conexión de la API para mostrar las especialidades
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/especialidades');
        const data = await response.json();
        setEspecialidades(data);
      } catch {
        setError('Error al cargar los datos');
      }
    };
    fetchData();
  }, []);

  const toggleModal = () => {
    setShowModal(!showModal);
    if (showModal) {
      setNewEspecialidad({
        claveespecialidad: '',
        especialidad: '',
        especial: '',
        estatus: false,
      });
      setSelectedEspecialidad(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEspecialidad({
      ...newEspecialidad,
      [name]: name === 'estatus' ? e.target.checked : value,
    });
  };

  const handleEditEspecialidad = (especialidad) => {
    setSelectedEspecialidad(especialidad);
    setNewEspecialidad(especialidad);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const especialidadData = {
      ...newEspecialidad,
      claveespecialidad: parseInt(newEspecialidad.claveespecialidad, 10),
      estatus: newEspecialidad.estatus,
    };

    try {
      if (selectedEspecialidad) {
        const response = await fetch('/api/editEspecialidad', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(especialidadData),
        });

        if (!response.ok) throw new Error('Error al actualizar la especialidad');
        
        const result = await response.json();
        console.log('Especialidad actualizada:', result);

        Swal.fire({
          icon: 'success',
          title: 'Especialidad Actualizada correctamente',
          showConfirmButton: false,
          timer: 2000,
        });

        setEspecialidades(await fetchEspecialidades());
        setShowSuccessMessage(true); // Mostrar mensaje de éxito
        toggleModal();
      } else {
        const response = await fetch('/api/crearEspecialidad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(especialidadData),
        });

        if (!response.ok) throw new Error('Error al agregar la especialidad FRONTEND');

        const result = await response.json();
        console.log('Especialidad agregada:', result);

        Swal.fire({
          icon: 'success',
          title: 'Especialidad Agregada correctamente',
          showConfirmButton: false,
          timer: 2000,
        });

        setEspecialidades(await fetchEspecialidades());
        setShowSuccessMessage(true); // Mostrar mensaje de éxito
        toggleModal();
      }

      // Ocultar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);

    } catch (error) {
      console.error(error);
      setError(selectedEspecialidad ? 'Error al actualizar la especialidad' : 'Error al agregar la especialidad FRONTEND');
    }
  };

  const fetchEspecialidades = async () => {
    const response = await fetch('/api/especialidades');
    const data = await response.json();
    return data;
  };

  const handleDeleteEspecialidad = async (claveespecialidad) => {
    const confirmDelete = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
    });

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(`/api/eliminarEspecialidad?claveespecialidad=${claveespecialidad}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar la especialidad');

        setEspecialidades(await fetchEspecialidades());

        Swal.fire('Eliminado', 'La especialidad ha sido eliminada', 'success');
      } catch (error) {
        console.error(error);
        setError('Error al eliminar la especialidad');
      }
    }
  };

  const router = useRouter();
  const handleBack = () => {
    router.back('/inicio-servicio-medico');
  };

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <Image
          src="/baner_sjr.png"
          alt="Banner"
          layout="responsive"
          width={1920}
          height={1080}
          className={styles.banner}
        />
        <button onClick={handleBack} className={styles.backButton}>Atrás</button>
        <h2 className={styles.title}>Lista de Especialidades</h2>
        {error && <p className={styles.error}>{error}</p>}
        {showSuccessMessage && ( // Mostrar el mensaje de éxito
          <div className={styles.successModal}>
            <p>Especialidad agregada o actualizada correctamente</p>
          </div>
        )}

        <input
          type="text"
          placeholder="Buscar especialidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.buttonContainer}>
          <button className={styles.button} onClick={toggleModal}>Agregar Especialidad</button>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Clave</th>
              <th>Especialidad</th>
              <th>Especial</th>
              <th>Estatus</th>
              <th>Editar / Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {especialidades.filter(especialidad => especialidad.especialidad.toLowerCase().includes(searchTerm.toLowerCase())).map((item, index) => (
              <tr key={index} className={styles.row}>
                <td>{item.claveespecialidad}</td>
                <td>{item.especialidad}</td>
                <td>{item.especial}</td>
                <td>{item.estatus ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button onClick={() => handleEditEspecialidad(item)} className={styles.editButton}>
                    Editar
                  </button>
                  <button onClick={() => handleDeleteEspecialidad(item.claveespecialidad)} className={styles.binButton}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && ReactDOM.createPortal(
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2 className={styles.modalHeader}>{selectedEspecialidad ? 'Editar Especialidad' : 'Agregar Especialidad'}</h2>
              <form className={styles.modalForm} onSubmit={handleSubmit}>
                <input type="number" name="claveespecialidad" placeholder="Clave Especialidad" onChange={handleInputChange} value={newEspecialidad.claveespecialidad} />
                <input type="text" name="especialidad" placeholder="Especialidad" onChange={handleInputChange} value={newEspecialidad.especialidad} />
                <input type="text" name="especial" placeholder="Especial" onChange={handleInputChange} value={newEspecialidad.especial} />
                <label htmlFor="estatus">Estatus</label>
                <input type="checkbox" name="estatus" onChange={handleInputChange} checked={newEspecialidad.estatus} />
                <button type="submit" className={styles.formSubmitBtn}>
                  {selectedEspecialidad ? 'Actualizar Especialidad' : 'Agregar Especialidad'}
                </button>
              </form>
              <button className={styles.closeButton} onClick={toggleModal}>Cerrar</button>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

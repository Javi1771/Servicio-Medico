// FarmaciaSurtimientos.jsx
import React, { useState } from 'react';

const FarmaciaSurtimientos = () => {
  const [folio, setFolio] = useState('');
  const { data, loading, error } = useFolioSurtimiento(folio);

  const handleInputChange = (e) => {
    setFolio(e.target.value);
  };

  return (
    <div className="farmacia-surtimientos">
      <h1>Farmacia Surtimientos</h1>
      <div>
        <label htmlFor="folio">Folio Surtimiento</label>
        <input
          id="folio"
          type="text"
          placeholder="FOLIO SURTIMIENTO"
          value={folio}
          onChange={handleInputChange}
          className="input-folio"
        />
      </div>

      {folio && (
        <div>
          <h2>Detalles del Surtimiento</h2>
          {loading && <p>Cargando...</p>}
          {error && <p>Error al cargar los detalles: {error.message}</p>}
          {data && <DetalleSurtimiento data={data} />}
        </div>
      )}
    </div>
  );
};

export default FarmaciaSurtimientos;

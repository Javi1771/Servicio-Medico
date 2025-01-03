/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import axios from "axios";

const EmailSender = () => {
  const [emailData, setEmailData] = useState({
    from: "jl728122@gmail.com",
    to: "",
    subject: "",
    html: "",
  });
  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({ ...prev, [name]: value }));
  };

  const sendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.html) {
      alert("Por favor, completa los campos requeridos.");
      return;
    }

    try {
      const response = await axios.post("/api/enviarEmail", emailData); // Llamada al backend
      setStatus(`Email enviado exitosamente a: ${emailData.to}`);
    } catch (error) {
      console.error("Error al enviar email:", error.response?.data || error.message);
      setStatus("Error al enviar el correo electrónico. Revisa la consola para más detalles.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-bold mb-8">Enviar Email con Resend</h1>

      <div className="w-full max-w-xl bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="from" className="block font-semibold mb-2">De:</label>
          <input
            type="text"
            id="from"
            name="from"
            value={emailData.from}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="to" className="block font-semibold mb-2">Para:</label>
          <input
            type="text"
            id="to"
            name="to"
            placeholder="correo1@dominio.com, correo2@dominio.com"
            value={emailData.to}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="subject" className="block font-semibold mb-2">Asunto:</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={emailData.subject}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="html" className="block font-semibold mb-2">Mensaje en HTML:</label>
          <textarea
            id="html"
            name="html"
            rows="4"
            value={emailData.html}
            onChange={handleChange}
            className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <button
          onClick={sendEmail}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Enviar Email
        </button>

        {status && <p className="mt-4 text-center text-lg font-semibold">{status}</p>}
      </div>
    </div>
  );
};

export default EmailSender;

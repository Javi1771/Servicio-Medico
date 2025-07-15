// pages/dashboard.js
import Head from 'next/head';
import MedicalDashboard from './components/MedicalDashboard';

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Dashboard Médico - Sistema de Consultas</title>
        <meta name="description" content="Dashboard completo con estadísticas y análisis de consultas médicas" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        <MedicalDashboard />
      </main>
    </>
  );
}
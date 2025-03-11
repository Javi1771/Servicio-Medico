import { connectToDatabase } from '../connectToDatabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const pool = await connectToDatabase();
      const result = await pool.request().query(`
        SELECT ID_PARENTESCO, PARENTESCO
        FROM PARENTESCO
        WHERE VISIBLE = 1
      `);
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error('Error fetching parentescos:', error);
      res.status(500).json({ error: 'Error fetching parentescos' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

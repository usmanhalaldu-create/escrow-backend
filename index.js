const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({ status: 'EscrowLayer API operational' });
});

// Transaction Routes
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { title, amount, buyer, seller } = req.body;
    const newTransaction = await prisma.transaction.create({
      data: { title, amount: parseFloat(amount), buyer, seller }
    });
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


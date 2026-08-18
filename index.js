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
    res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { title, amount, buyer, seller, status } = req.body;
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    const newTransaction = await prisma.transaction.create({
      data: {
        description: title, // Maps 'title' from JSON to 'description' in DB
        amount: parsedAmount,
        buyer,
        seller,
        status: status || "PENDING"
      }
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});

// Start server — Render assigns the port via process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`EscrowLayer API running on port ${PORT}`);
});

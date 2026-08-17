app.post('/api/transactions', async (req, res) => {
  try {
    const { title, amount, buyer, seller, status } = req.body;
    
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);

    const newTransaction = await prisma.transaction.create({
      data: {
        title,
        amount: parsedAmount,
        buyer,
        seller,
        status: status || "PENDING"
      }
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Database Insert Error:", error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});


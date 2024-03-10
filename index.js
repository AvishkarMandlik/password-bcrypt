const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mongoConnection = require('./mongoConn/mongoConn');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.post('/signup', async (req, res) => {
  const { username,email,phone, password, role } = req.body;
  const usersCollection = mongoConnection.getCollection('users');

  const existingUser = await usersCollection.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await usersCollection.insertOne({ username,email,phone, role, password: hashedPassword });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});


mongoConnection.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(console.error);

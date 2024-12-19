const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { LocalStorage } = require('node-localstorage');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const cors = require('cors');
const sqlite3 = require('sqlite3');

const app = express();
const db = new sqlite3.Database('../local.db')
const port = 3000;
const SECRET_KEY = "c02b3b7d94e80ce366aaa409ed659dd2584e7f48b97ea6990b59c188b0c9e39e6690240b758066fffb936b972b0dae310d73ca3fbdebf32fc32f3ce2058a19e9";
const localStorage = new LocalStorage('./scratch');
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:9000',
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));


// PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ETGProject',
    password: 'postgres',
    port: 5432,
});

// Test the database connection
pool.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log(dayjs().format('YYYY-MM-DD HH:mm:ss')+' Connected to the PostgreSQL database');
    }
});

// Routes

app.get('/', (req, res) => {
    //jwt authentication
    const token = localStorage.getItem('token');
    if (!token) {
      return res.status(403).send({ message: "No token provided!" });
    }

    jwt.verify(token,SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized!" });
        }
    });
    res.status(200).send('Welcome!');
});

app.post('/login', async (req, res) => {
  const { username,password } = req.body;
    //find user by username
    try {
      const user = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      const passwordIsValid = bcrypt.compareSync(password,user.rows[0].password);

      if (!passwordIsValid) {
        return res.status(404).send({ message:'Password not valid!'});
      }else{
        const token = jwt.sign({ id:user.id }, SECRET_KEY, { expiresIn: 3600 });
        localStorage.setItem("token", token);
        res.status(200).send({ token });
      }
    } catch (err) {
      console.error('Error fetching users credentials:', err);
      res.status(500).send('Server Error');
    }
});

app.get('/users', async (req, res) => {
    //jwt authentication
    const token = localStorage.getItem('token');
    if (!token) {
      return res.status(403).send({ message: "No token provided!" });
    }

    jwt.verify(token,SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized!" });
        }
    });
    //route functionality
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Server Error');
    }
});

app.get('/records', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
  });
  //route functionality
    try {
        const result = await pool.query('SELECT * FROM records');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching records:', err);
        res.status(500).send('Server Error');
    }
});

app.post('/users', async (req, res) => {
    //jwt authentication
    const token = localStorage.getItem('token');
    if (!token) {
      return res.status(403).send({ message: "No token provided!" });
    }

    jwt.verify(token,SECRET_KEY, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized!" });
        }
    });
    //route functionality
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO users (id,username,password) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
            [username, bcrypt.hashSync(password,8)]
        );
        res.status(201).json({ message: 'User added successfully.' });
    } catch (err) {
        console.error('Error adding user:', err);
        res.status(500).send('Server Error');
    }
});

app.post('/records', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
  });
  //route functionality
    let records = req.body;
    if (!Array.isArray(records)) {
      records = records.data;
    }

    const query = `INSERT INTO records (id,title,description,barcode,updated_at)
    VALUES ${records.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ')
    }`;
    const values = records.flatMap(row => [row.id, row.title, row.description, row.barcode, row.updated_at]);

    try {
        const result = await pool.query(query, values);
        res.status(200).json({ message: 'Record added successfully.', count: `${result.rowCount}` });
    } catch (err) {
        console.error('Error adding records:', err);
        res.status(500).send('Server Error');
    }

    try {
      db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          db.run('DELETE FROM Records', (err) => {
            if (err) {
              console.error('Error deleting rows:', err);
            }
          });
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error commiting data:', err);
            }
          });
      });
    }catch (err) {
      console.error('Error:',err);
    }
});

app.put('/users/:id', async (req,res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
  });
  //route functionality
  const userId = req.params.id;
  const {username, password} = req.body;

  try {
    if (!username && !password) {
      return res.status(400).json({ error: 'At least one field must be provided for update.' });
    }

    const updates = [];
    const values = [];
    let query = 'UPDATE users SET ';

    if (username) {
      updates.push('username = $' + (updates.length + 1));
      values.push(username);
    }
    if (password) {
      updates.push('password = $' + (updates.length + 1));
      values.push(bcrypt.hashSync(password,8));
    }

    query += updates.join(', ') + ' WHERE id = $' + (values.length + 1);
    values.push(userId);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.put('/records/:id', async (req,res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
  });
  //route functionality
  const recordId = req.params.id;
  const {title, description, barcode} = req.body;

  try {
    if (!title && !description && !barcode) {
      return res.status(400).json({ error: 'At least one field must be provided for update.' });
    }

    const updates = [];
    const values = [];
    let query = 'UPDATE records SET ';

    if (title) {
      updates.push('title = $' + (updates.length + 1));
      values.push(title);
    }
    if (description) {
      updates.push('description = $' + (updates.length + 1));
      values.push(description);
    }
    if (barcode) {
      updates.push('barcode = $' + (updates.length + 1));
      values.push(barcode);
    }

    query += updates.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = $' + (values.length + 1);
    values.push(recordId);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    res.status(200).json({ message: 'Record updated successfully.' });
  } catch (err) {
    console.error('Error updating record:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.delete('/users/:id', async (req,res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
  });
  //route functionality
  const userId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1',[userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:',err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/records/:id', async (req,res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token,SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Unauthorized!" });
      }
  });
  //route functionality
  const recordId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM records WHERE id = $1',[recordId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting record:',err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/records/view', async (req,res) => {
  try {
    db.all('SELECT * FROM Records', (err,rows) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Error fetching data from SQLite');
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Error:',err);
  }

});

app.post('/records/update', async (req,res) => {
  let newData = req.body;
  if (!Array.isArray(newData)) {
   newData = newData.data;
  }

  try {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('DELETE FROM Records', (err) =>{
        if (err) {
          console.error('Error deleting rows:', err);
        }
      });

      const sql = db.prepare('INSERT INTO Records (id,title,description,barcode,updated_at) values (?, ?, ?, ?, ?)');
      newData.forEach((element) => {
        sql.run(element.id, element.title, element.description, element.barcode, element.updated_at, (err) =>{
          if (err) {
            console.error('Error inserting rows:', err);
          }
        });
      });
      sql.finalize();

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error commiting data:', err);
        }
        res.status(200).json({ message: 'Table updated successfully' });
      });
    });
  }catch (err) {
    db.run('ROLLBACK', (err) =>{
        if (err) {
          console.error('Rollback failed:',err);
        }
    });
    console.error('Error:', err);
    res.status(500).json({ message:'Failed to update table', error: err.message });
  }
});

// Start the server
app.listen(port, () => {
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss')+` Server running on http://localhost:${port}`);
});

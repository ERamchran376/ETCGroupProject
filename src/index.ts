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
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const db = new sqlite3.Database('../local.db')
const port = 3000;
const SECRET_KEY = "c02b3b7d94e80ce366aaa409ed659dd2584e7f48b97ea6990b59c188b0c9e39e6690240b758066fffb936b972b0dae310d73ca3fbdebf32fc32f3ce2058a19e9";
localStorage = new LocalStorage('./scratch');
app.use(bodyParser.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation for my project',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use(cors({
  origin: 'http://localhost:9000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
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
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss') + ' Connected to the PostgreSQL database');
  }
});

// Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Token authentication
 *     description: Authenticates user session.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "welcome!"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized!
 *       500:
 *         description: Internal server error
 */
app.get('/', (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
  });
  res.status(200).send('Welcome!');
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: login
 *     description: Allows user to login to system.
 *     tags:
 *       - Authentication
 *     requestBody:
 *      description: Login credentials
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *                description: The user's username
 *              password:
 *                type: string
 *                description: The user's password
 *            required:
 *              - username
 *              - password
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The authentication token.
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid credentials.
 *       500:
 *         description: Internal server error
 */
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  //find user by username
  try {
    const user = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    if (user.rowCount === 0) {
      return res.status(404).send({ message: 'Invalid credentials!' });
    }
    const passwordIsValid = bcrypt.compareSync(password, user.rows[0].password);
    if (!passwordIsValid) {
      return res.status(404).send({ message: 'Invalid credentials!' });
    } else {
      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: 3600 });
      localStorage.setItem("token", token);
      res.status(200).send({ token });
    }
  } catch (err) {
    console.error('Error fetching users credentials:', err);
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Allows user to fetch all users from the db.
 *     tags:
 *       - Backend Actions
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Id of a user.
 *                    example: ce9babf9-576a-4b22-a44c-0a57cf52e98c
 *                  username:
 *                    type: string
 *                    description: Username of a user.
 *                    example: John Doe
 *                  password:
 *                    type: string
 *                    description: Passsword of a user.
 *                    example: $2a$08$xUbSmy.Ps.KEBTJzjfLk2ef7QAg85eLSYh6mS1Di/L8eh3dtqtpiu
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       500:
 *         description: Internal server error
 */
app.get('/users', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
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

/**
 * @swagger
 * /records:
 *   get:
 *     summary: Get all records
 *     description: Allows user to fetch all records from the db.
 *     tags:
 *       - Backend Actions
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Id of a record.
 *                    example: ce9babf9-576a-4b22-a44c-0a57cf52e98c
 *                  title:
 *                    type: string
 *                    description: Title of record.
 *                    example: Record 1
 *                  description:
 *                    type: string
 *                    description: Description of record.
 *                    example: Record 1 description
 *                  barcode:
 *                    type: string
 *                    description: Barcode of record.
 *                    example: 12345
 *                  updated_at:
 *                    type: string
 *                    description: Date of last update of record.
 *                    example: 2024-12-21T18:08:39.000Z
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       500:
 *         description: Internal server error
 */
app.get('/records', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
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

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Add new user
 *     description: Allows user to add a new user to the db.
 *     tags:
 *       - Backend Actions
 *     requestBody:
 *      description: User credentials
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *                description: The user's username
 *              password:
 *                type: string
 *                description: The user's password
 *            required:
 *              - username
 *              - password
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    description: User added successfully
 *                    example: User created successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       500:
 *         description: Internal server error
 */
app.post('/users', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
  });
  //route functionality
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO users (id,username,password) VALUES (gen_random_uuid(), $1, $2) RETURNING *',
      [username, bcrypt.hashSync(password, 8)]
    );
    res.status(201).json({ message: 'User added successfully.' });
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).send('Server Error');
  }
});

/**
 * @swagger
 * /records:
 *   post:
 *     summary: Add new record
 *     description: Allows user to add a new record to the db.
 *     tags:
 *       - Backend Actions
 *     requestBody:
 *      description: Record details
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  description: A uuid for the record
 *                title:
 *                  type: string
 *                  description: The title of the record
 *                description:
 *                  type: string
 *                  description: A description for the record
 *                barcode:
 *                  type: string
 *                  description: A barcode for the record
 *                updated_at:
 *                  type: string
 *                  description: Date and timestamp of a record
 *              required:
 *                - id
 *                - title
 *                - description
 *                - updated_at
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    description: Records added successfully
 *                    example: Records added successfully
 *                  count:
 *                    type: integer
 *                    description: No of records
 *                    example: 3
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       500:
 *         description: Internal server error
 */
app.post('/records', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
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
    VALUES ${records.map((_: any, i: number) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ')
    }`;
  const values = records.flatMap((row: { id: any; title: any; description: any; barcode: any; updated_at: any; }) => [row.id, row.title, row.description, row.barcode, row.updated_at]);

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
  } catch (err) {
    console.error('Error:', err);
  }
});

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update a user
 *     description: Allows user to update an existing users credentials in the db.
 *     parameters:
 *      - name: userId
 *        in: path
 *        required: true
 *        description: The ID of the user to update
 *        schema:
 *          type: string
 *          example: "0d18bf3c-74ad-4b46-9a10-2a3fcda92cd4"
 *     tags:
 *       - Backend Actions
 *     requestBody:
 *      description: User details
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *                description: The new username
 *              password:
 *                type: string
 *                description: The new password
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    description: User updated successfully
 *                    example: User updated successfully
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Missing field.
 *                   example: At least one field must be provided for update.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Missing field.
 *                   example: User not found.
 *       500:
 *         description: Internal server error
 */
app.put('/users/:id', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
  });
  //route functionality
  const userId = req.params.id;
  const { username, password } = req.body;

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
      values.push(bcrypt.hashSync(password, 8));
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

/**
 * @swagger
 * /records/{recordId}:
 *   put:
 *     summary: Update a record
 *     description: Allows user to update an existing records details in the db.
 *     parameters:
 *      - name: recordId
 *        in: path
 *        required: true
 *        description: The ID of the record to update
 *        schema:
 *          type: string
 *          example: "0d18bf3c-74ad-4b46-9a10-2a3fcda92cd4"
 *     tags:
 *       - Backend Actions
 *     requestBody:
 *      description: Record details
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                type: string
 *                description: The new title
 *              description:
 *                type: string
 *                description: The new description
 *              barcode:
 *                type: string
 *                description: The new barcode
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    description: User updated successfully
 *                    example: User updated successfully
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Missing field.
 *                   example: At least one field must be provided for update.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Missing field.
 *                   example: Record not found.
 *       500:
 *         description: Internal server error
 */
app.put('/records/:id', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
  });
  //route functionality
  const recordId = req.params.id;
  const { title, description, barcode } = req.body;

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

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     description: Allows user to delete a user from the the db.
 *     parameters:
 *      - name: userId
 *        in: path
 *        required: true
 *        description: The ID of the user to delete
 *        schema:
 *          type: string
 *          example: "0d18bf3c-74ad-4b46-9a10-2a3fcda92cd4"
 *     tags:
 *       - Backend Actions
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    description: User deleted successfully
 *                    example: User deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Missing field.
 *                   example: User not found.
 *       500:
 *         description: Internal server error
 */
app.delete('/users/:id', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
  });
  //route functionality
  const userId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /records/{recordId}:
 *   delete:
 *     summary: Delete a record
 *     description: Allows user to delete a record from the the db.
 *     parameters:
 *      - name: recordId
 *        in: path
 *        required: true
 *        description: The ID of the record to delete
 *        schema:
 *          type: string
 *          example: "0d18bf3c-74ad-4b46-9a10-2a3fcda92cd4"
 *     tags:
 *       - Backend Actions
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    description: Record deleted successfully
 *                    example: Record deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Unauthorized.
 *                   example: Unauthorized!
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Invalid token.
 *                   example: No token provided!
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Missing field.
 *                   example: Record not found.
 *       500:
 *         description: Internal server error
 */
app.delete('/records/:id', async (req, res) => {
  //jwt authentication
  const token = localStorage.getItem('token');
  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
  });
  //route functionality
  const recordId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM records WHERE id = $1', [recordId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting record:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /records/view:
 *   get:
 *     summary: View all records
 *     description: Allows user to view all records.
 *     tags:
 *       - Frontend Actions
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: Id of record
 *                    example: "c3bc2e79-1f2e-4988-9b85-7d80bbd1b9e1"
 *                  title:
 *                    type: string
 *                    description: Title of record
 *                    example: "record 1"
 *                  description:
 *                    type: string
 *                    description: Description of record
 *                    example: "record 1"
 *                  barcode:
 *                    type: string
 *                    description: Barcode of record
 *                    example: "1234"
 *                  updated_at:
 *                    type: string
 *                    description: Last updated date and time stamp of record
 *                    example: "2024-12-24 10:01:10.000178"
 *       500:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Missing field.
 *                   example: Error fetching data from SQLite.
 */
app.get('/records/view', async (req, res) => {
  try {
    db.all('SELECT * FROM Records', (err, rows) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).send('Error fetching data from SQLite');
      }
      res.json(rows);
    });
  } catch (err) {
    console.error('Error:', err);
  }

});

/**
 * @swagger
 * /records/update:
 *   post:
 *     summary: Update records
 *     description: Allows user to update records.
 *     tags:
 *       - Frontend Actions
 *     requestBody:
 *      description: Record details
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *                  description: A uuid for the record
 *                title:
 *                  type: string
 *                  description: The title of the record
 *                description:
 *                  type: string
 *                  description: A description for the record
 *                barcode:
 *                  type: string
 *                  description: A barcode for the record
 *                updated_at:
 *                  type: string
 *                  description: Date and timestamp of a record
 *              required:
 *                - id
 *                - title
 *                - description
 *                - updated_at
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *          application/json:
 *            schema:
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *                    description: Table updated successfully
 *                    example: "Table updated successfully"
 *       500:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Failed to update table.
 *                   example: Failed to update table.
 *                 error:
 *                    type: string 
 *                    description: error message
 *                    example: Error establishing connection
 */
app.post('/records/update', async (req, res) => {
  let newData = req.body;
  if (!Array.isArray(newData)) {
    newData = newData.data;
  }

  try {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('DELETE FROM Records', (err) => {
        if (err) {
          console.error('Error deleting rows:', err);
        }
      });

      const sql = db.prepare('INSERT INTO Records (id,title,description,barcode,updated_at) values (?, ?, ?, ?, ?)');
      newData.forEach((element) => {
        sql.run(element.id, element.title, element.description, element.barcode, element.updated_at, (err) => {
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
  } catch (err) {
    db.run('ROLLBACK', (err) => {
      if (err) {
        console.error('Rollback failed:', err);
      }
    });
    console.error('Error:', err);
    res.status(500).json({ message: 'Failed to update table', error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(dayjs().format('YYYY-MM-DD HH:mm:ss') + ` Server running on http://localhost:${port}`);
});

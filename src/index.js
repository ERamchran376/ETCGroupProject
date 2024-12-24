var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var LocalStorage = require('node-localstorage').LocalStorage;
var Pool = require('pg').Pool;
var uuidv4 = require('uuid').v4;
var dayjs = require('dayjs');
var cors = require('cors');
var sqlite3 = require('sqlite3');
var swaggerJsdoc = require('swagger-jsdoc');
var swaggerUi = require('swagger-ui-express');
var app = express();
var db = new sqlite3.Database('../local.db');
var port = 3000;
var SECRET_KEY = "c02b3b7d94e80ce366aaa409ed659dd2584e7f48b97ea6990b59c188b0c9e39e6690240b758066fffb936b972b0dae310d73ca3fbdebf32fc32f3ce2058a19e9";
localStorage = new LocalStorage('./scratch');
app.use(bodyParser.json());
// Swagger configuration
var swaggerOptions = {
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
var swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(cors({
    origin: 'http://localhost:9000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
// PostgreSQL connection pool
var pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ETGProject',
    password: 'postgres',
    port: 5432,
});
// Test the database connection
pool.connect(function (err) {
    if (err) {
        console.error('Error connecting to the database:', err);
    }
    else {
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
app.get('/', function (req, res) {
    //jwt authentication
    var token = localStorage.getItem('token');
    if (!token) {
        return res.status(403).send({ message: "No token provided!" });
    }
    jwt.verify(token, SECRET_KEY, function (err, decoded) {
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
app.post('/login', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var _a, username, password, user, passwordIsValid, token, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, username = _a.username, password = _a.password;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('SELECT * FROM users WHERE username = $1', [username])];
            case 2:
                user = _b.sent();
                if (user.rowCount === 0) {
                    return [2 /*return*/, res.status(404).send({ message: 'Invalid credentials!' })];
                }
                passwordIsValid = bcrypt.compareSync(password, user.rows[0].password);
                if (!passwordIsValid) {
                    return [2 /*return*/, res.status(404).send({ message: 'Invalid credentials!' })];
                }
                else {
                    token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: 3600 });
                    localStorage.setItem("token", token);
                    res.status(200).send({ token: token });
                }
                return [3 /*break*/, 4];
            case 3:
                err_1 = _b.sent();
                console.error('Error fetching users credentials:', err_1);
                res.status(500).send('Server Error');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.get('/users', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, result, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('SELECT * FROM users')];
            case 2:
                result = _a.sent();
                res.json(result.rows);
                return [3 /*break*/, 4];
            case 3:
                err_2 = _a.sent();
                console.error('Error fetching users:', err_2);
                res.status(500).send('Server Error');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.get('/records', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, result, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('SELECT * FROM records')];
            case 2:
                result = _a.sent();
                res.json(result.rows);
                return [3 /*break*/, 4];
            case 3:
                err_3 = _a.sent();
                console.error('Error fetching records:', err_3);
                res.status(500).send('Server Error');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.post('/users', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, _a, username, password, result, err_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                _a = req.body, username = _a.username, password = _a.password;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('INSERT INTO users (id,username,password) VALUES (gen_random_uuid(), $1, $2) RETURNING *', [username, bcrypt.hashSync(password, 8)])];
            case 2:
                result = _b.sent();
                res.status(201).json({ message: 'User added successfully.' });
                return [3 /*break*/, 4];
            case 3:
                err_4 = _b.sent();
                console.error('Error adding user:', err_4);
                res.status(500).send('Server Error');
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.post('/records', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, records, query, values, result, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                records = req.body;
                if (!Array.isArray(records)) {
                    records = records.data;
                }
                query = "INSERT INTO records (id,title,description,barcode,updated_at)\n    VALUES ".concat(records.map(function (_, i) { return "($".concat(i * 5 + 1, ", $").concat(i * 5 + 2, ", $").concat(i * 5 + 3, ", $").concat(i * 5 + 4, ", $").concat(i * 5 + 5, ")"); }).join(', '));
                values = records.flatMap(function (row) { return [row.id, row.title, row.description, row.barcode, row.updated_at]; });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query(query, values)];
            case 2:
                result = _a.sent();
                res.status(200).json({ message: 'Record added successfully.', count: "".concat(result.rowCount) });
                return [3 /*break*/, 4];
            case 3:
                err_5 = _a.sent();
                console.error('Error adding records:', err_5);
                res.status(500).send('Server Error');
                return [3 /*break*/, 4];
            case 4:
                try {
                    db.serialize(function () {
                        db.run('BEGIN TRANSACTION');
                        db.run('DELETE FROM Records', function (err) {
                            if (err) {
                                console.error('Error deleting rows:', err);
                            }
                        });
                        db.run('COMMIT', function (err) {
                            if (err) {
                                console.error('Error commiting data:', err);
                            }
                        });
                    });
                }
                catch (err) {
                    console.error('Error:', err);
                }
                return [2 /*return*/];
        }
    });
}); });
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
app.put('/users/:id', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, userId, _a, username, password, updates, values, query, result, err_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                userId = req.params.id;
                _a = req.body, username = _a.username, password = _a.password;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                if (!username && !password) {
                    return [2 /*return*/, res.status(400).json({ error: 'At least one field must be provided for update.' })];
                }
                updates = [];
                values = [];
                query = 'UPDATE users SET ';
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
                return [4 /*yield*/, pool.query(query, values)];
            case 2:
                result = _b.sent();
                if (result.rowCount === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'User not found.' })];
                }
                res.status(200).json({ message: 'User updated successfully.' });
                return [3 /*break*/, 4];
            case 3:
                err_6 = _b.sent();
                console.error('Error updating user:', err_6);
                res.status(500).json({ error: 'Internal server error.' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.put('/records/:id', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, recordId, _a, title, description, barcode, updates, values, query, result, err_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                recordId = req.params.id;
                _a = req.body, title = _a.title, description = _a.description, barcode = _a.barcode;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                if (!title && !description && !barcode) {
                    return [2 /*return*/, res.status(400).json({ error: 'At least one field must be provided for update.' })];
                }
                updates = [];
                values = [];
                query = 'UPDATE records SET ';
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
                return [4 /*yield*/, pool.query(query, values)];
            case 2:
                result = _b.sent();
                if (result.rowCount === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'Record not found.' })];
                }
                res.status(200).json({ message: 'Record updated successfully.' });
                return [3 /*break*/, 4];
            case 3:
                err_7 = _b.sent();
                console.error('Error updating record:', err_7);
                res.status(500).json({ error: 'Internal server error.' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.delete('/users/:id', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, userId, result, err_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                userId = req.params.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('DELETE FROM users WHERE id = $1', [userId])];
            case 2:
                result = _a.sent();
                if (result.rowCount === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'User not found' })];
                }
                res.status(200).json({ message: 'User deleted successfully' });
                return [3 /*break*/, 4];
            case 3:
                err_8 = _a.sent();
                console.error('Error deleting user:', err_8.message);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.delete('/records/:id', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var token, recordId, result, err_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = localStorage.getItem('token');
                if (!token) {
                    return [2 /*return*/, res.status(403).send({ message: "No token provided!" })];
                }
                jwt.verify(token, SECRET_KEY, function (err, decoded) {
                    if (err) {
                        return res.status(401).send({ message: "Unauthorized!" });
                    }
                });
                recordId = req.params.id;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query('DELETE FROM records WHERE id = $1', [recordId])];
            case 2:
                result = _a.sent();
                if (result.rowCount === 0) {
                    return [2 /*return*/, res.status(404).json({ error: 'Record not found' })];
                }
                res.status(200).json({ message: 'Record deleted successfully' });
                return [3 /*break*/, 4];
            case 3:
                err_9 = _a.sent();
                console.error('Error deleting record:', err_9.message);
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
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
app.get('/records/view', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        try {
            db.all('SELECT * FROM Records', function (err, rows) {
                if (err) {
                    console.error('Error fetching data:', err);
                    return res.status(500).send('Error fetching data from SQLite');
                }
                res.json(rows);
            });
        }
        catch (err) {
            console.error('Error:', err);
        }
        return [2 /*return*/];
    });
}); });
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
app.post('/records/update', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var newData;
    return __generator(this, function (_a) {
        newData = req.body;
        if (!Array.isArray(newData)) {
            newData = newData.data;
        }
        try {
            db.serialize(function () {
                db.run('BEGIN TRANSACTION');
                db.run('DELETE FROM Records', function (err) {
                    if (err) {
                        console.error('Error deleting rows:', err);
                    }
                });
                var sql = db.prepare('INSERT INTO Records (id,title,description,barcode,updated_at) values (?, ?, ?, ?, ?)');
                newData.forEach(function (element) {
                    sql.run(element.id, element.title, element.description, element.barcode, element.updated_at, function (err) {
                        if (err) {
                            console.error('Error inserting rows:', err);
                        }
                    });
                });
                sql.finalize();
                db.run('COMMIT', function (err) {
                    if (err) {
                        console.error('Error commiting data:', err);
                    }
                    res.status(200).json({ message: 'Table updated successfully' });
                });
            });
        }
        catch (err) {
            db.run('ROLLBACK', function (err) {
                if (err) {
                    console.error('Rollback failed:', err);
                }
            });
            console.error('Error:', err);
            res.status(500).json({ message: 'Failed to update table', error: err.message });
        }
        return [2 /*return*/];
    });
}); });
// Start the server
app.listen(port, function () {
    console.log(dayjs().format('YYYY-MM-DD HH:mm:ss') + " Server running on http://localhost:".concat(port));
});

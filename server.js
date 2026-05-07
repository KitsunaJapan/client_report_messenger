require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_PASSWORD   = process.env.APP_PASSWORD  || 'changeme';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret';

app.set('trust proxy', 1); // Renderのリバースプロキシを信頼

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: 'auto', // プロキシ経由のHTTPS接続を正しく判定
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

function requireAuth(req, res, next) {
  if (req.session?.authenticated) return next();
  res.redirect('/login');
}

app.get('/login', (req, res) => {
  if (req.session?.authenticated) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', (req, res) => {
  if (req.body.password === APP_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'パスワードが正しくありません' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.use('/', requireAuth, express.static(path.join(__dirname, 'public')));
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`起動中: http://localhost:${PORT}`);
});
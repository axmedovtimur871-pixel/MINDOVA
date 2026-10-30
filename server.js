import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const send = (file) => (req, res) =>
  res.sendFile(path.join(__dirname, file));

app.get('/', send('index.html'));
app.get('/admin', send('admin.html'));
app.get('/kabinet', send('dashboard.html'));
app.get('/verify', send('verify.html'));
app.get('/scan', send('scan.html'));
app.get('/connect', send('connect.html'));
app.get('/connect.html', send('connect.html'));
app.get('/scan.html', send('scan.html'));
app.get('/verify.html', send('verify.html'));
app.get('/login', send('login.html'));
app.get('/index.html', send('index.html'));
app.get('/admin.html', send('admin.html'));
app.get('/dashboard.html', send('dashboard.html'));
app.get('/login.html', send('login.html'));
// rasm fayllari (faqat papka ichidagi, .png/.jpg/.jpeg/.webp)
app.get(/^\/[\w.\-]+\.(png|jpe?g|webp)$/i, (req, res) =>
  res.sendFile(path.join(__dirname, req.path)));

app.get('*', send('index.html'));

app.listen(PORT, () =>
  console.log(`MINDOVA server ${PORT}-portda ishlayapti`));

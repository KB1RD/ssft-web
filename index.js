const express = require('express');
const exphbs  = require('express-handlebars');
const Busboy = require('busboy');
const QRCode = require('qrcode');

const inspect = require('util').inspect;

const app = express();

const responses = new Map();

const randomCharLen = parseInt(process.env.RANDOM_LEN) || 24;
let publicURL = process.env.PUBLIC_URL;

if (!publicURL) {
  console.error('Please specify the public URL by setting the PUBLIC_URL environment variable.');
  process.exit(-1);
}
if (publicURL.endsWith('/')) {
  publicURL = publicURL.slice(0, publicURL.length);
}

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.locals.layout = false;

app.get('/', function (req, res, next) {
  res.redirect('/app/');
  next();
});

app.get('/app/', async function (req, res, next) {
  const id = req.query.id || '';
  res.render('index', { id, qr: await QRCode.toDataURL(`${publicURL}${req.url}`) });
});

app.post('/app/', function (req, res, next) {
   let id = '';
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   for (let i = 0; i < randomCharLen; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
   }
  res.redirect(`/app/?id=${id}`);
});

app.get('/stream/:id?', function (req, res, next) {
  const id = req.params.id || '';
  if (!responses.has(id)) {
    responses.set(id, res);
  } else {
    res.status(403).send('Someone is already trying to download this file');
  }
  req.on('end', () => responses.delete(id));
});

app.post('/stream/:id?', function (req, res, next) {
  const id = req.params.id || '';
  if (responses.has(id)) {
    const busboy = new Busboy({ headers: req.headers });
    let piped = false;
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      if (fieldname === 'upload' && !piped) {
        const otherres = responses.get(id);
        otherres.set('Content-Encoding', encoding);
        otherres.type(mimetype);
        file.pipe(responses.get(id));
        piped = true;
        file.on('end', function() {
          otherres.status(200);
          responses.delete(id);
        });
      }
    });
    busboy.on('finish', function () {
      if (piped) {
        res.status(200).send('Transferred file successfully');
      } else {
        res.status(400).send('No file found in request');
      }
    });
    req.pipe(busboy);

    req.on('end', next);
  } else {
    res.status(404).send('No download attempted');
    next();
  }
});

app.listen(3000);
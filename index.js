const express = require('express');
const app = express();
const port = 3000;

const checkParams = ["a", "b", "c"];

app.get('/', (req, res) => {
  res.send('<h1>Привет, Октагон!</h1>');
});

app.get('/static', (req, res) => {
  res.json({ header: 'Hello', body: 'Octagon NodeJS Test' });
});

app.get('/dynamic', (req, res) => {
  // Проверяем наличие всех параметров и их тип
  for (let param of checkParams) {
    if (!req.query.hasOwnProperty(param) || isNaN(parseFloat(req.query[param]))) {
      res.json({ header: 'Error' });
      return;
    }
  }

  const a = parseFloat(req.query.a);
  const b = parseFloat(req.query.b);
  const c = parseFloat(req.query.c);

  const result = (a * b * c) / 3;
  res.json({ header: 'Calculated', body: result.toString() });
});

app.listen(port, () => {
    console.log(`Сервер запущен по адресу http://localhost:${port}`
    );
  });
const express = require('express');
const app = express();
const port = 3000;
const mysql = require('mysql2');
const TelegramBot = require('node-telegram-bot-api');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'chatbottests'
});

connection.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных: ' + err.stack);
    return;
  }
  console.log('Подключено к базе данных MySQL');
});

app.use(express.json()); // Позволяет серверу обрабатывать JSON в запросах

app.get('/', (req, res) => {
  res.send('<h1>Привет, Октагон!</h1>');
});

app.get('/getAllItems', (req, res) => {
  connection.query('SELECT * FROM chatbottests', (error, results, fields) => {
    if (error) {
      console.error('Ошибка выполнения запроса: ' + error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(results);
  });
});

app.post('/addItem', (req, res) => {
  const { name, desc } = req.body;

  if (!name || !desc) {
    res.status(400).json({ error: 'Bad Request: Missing name or desc in request body' });
    return;
  }

  connection.query('INSERT INTO chatbottests (name, `desc`) VALUES (?, ?)', [name, desc], (error, results, fields) => {
    if (error) {
      console.error('Ошибка выполнения запроса: ' + error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json({ id: results.insertId, name, desc });
  });
});


app.post('/deleteItem', (req, res) => {
  const { id } = req.body;

  if (!id) {
    res.status(400).json({ error: 'Bad Request: Missing id in request body' });
    return;
  }

  connection.query('DELETE FROM chatbottests WHERE id = ?', [id], (error, results, fields) => {
    if (error) {
      console.error('Ошибка выполнения запроса: ' + error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json({ success: true });
  });
});

app.post('/updateItem', (req, res) => {
  const { id, name, desc } = req.body;

  if (!id || !name || !desc) {
    res.status(400).json({ error: 'Ты ошибка!!!' });
    return;
  }
  connection.query('UPDATE chatbottests SET name = ?, `desc` = ? WHERE id = ?', [name, desc, id], (error, results, fields) => {
    if (error) {
      console.error('Ошибка выполнения запроса: ' + error.stack);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json({ id, name, desc });
  });
});

const token = '6912032226:AAHNco7NqbcutFQQFUn3KQ4qtxKCMJaJRcQ';
const bot = new TelegramBot(token, { polling: true });


bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет, Октагон! Напишите /help для получения подробной информации');
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const message = `
Список доступных команд:
/help - Выводит список команд с описанием
/site - Отправляет ссылку на сайт Октагона
/creator - Отправляет информацию о создателе бота
/list - Для проверки 6-го задания`
;
  bot.sendMessage(chatId, message);
});
bot.onText(/\/site/, (msg) => {
  const chatId = msg.chat.id;
  const message = 'Ссылка на сайт Октагона: https://students.forus.ru/';
  bot.sendMessage(chatId, message);
});

bot.onText(/\/creator/, (msg) => {
  const chatId = msg.chat.id;
  const message = 'Мой создатель: Филиппова Дарья';
  bot.sendMessage(chatId, message);
});


bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const message =` 
Список доступных команд:
/randomItem - Генерация случайного ID из диапазона записей в БД
/deleteItem - Запрос к БД для удаления предмета по ID
/getItemByID - Запрос к БД для получения предмета по ID`
;
  bot.sendMessage(chatId, message);
});

bot.onText(/\/randomItem/, (msg) => {
  const chatId = msg.chat.id;

  connection.query('SELECT id FROM chatbottests', (error, results, fields) => {
    if (error) {
      console.error('Ошибка выполнения запроса: ' + error.stack);
      bot.sendMessage(chatId, 'Произошла ошибка при получении случайного предмета.');
      return;
    }


    const randomIndex = Math.floor(Math.random() * results.length);
    const randomItemId = results[randomIndex].id;


    connection.query('SELECT * FROM chatbottests WHERE id = ?', [randomItemId], (error, results, fields) => {
      if (error) {
        console.error('Ошибка выполнения запроса: ' + error.stack);
        bot.sendMessage(chatId, 'Произошла ошибка при получении случайного предмета.');
        return;
      }


      const randomItem = results[0];
      const message = `(${randomItem.id}) - ${randomItem.name}: ${randomItem.desc}`;
      bot.sendMessage(chatId, message);
    });
  });
});

bot.onText(/^\/deleteItem(?:\s+(\S+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const itemId = match[1];

  if (!itemId) {
    bot.sendMessage(chatId, 'Чтобы команда сработала правильно укажите ID предмета: /deleteItem id');
    return;
  }


  connection.query('DELETE FROM chatbottests WHERE id = ?', [itemId], (error, results, fields) => {
    if (error) {
      console.error('Ошибка выполнения запроса: ' + error.stack);
      bot.sendMessage(chatId, 'Произошла ошибка при удалении предмета.');
      return;
    }


    if (results.affectedRows > 0) {
      bot.sendMessage(chatId, 'Предмет успешно удален.');
    } else {
      bot.sendMessage(chatId, 'Ошибка: предмет с указанным ID не найден.');
    }
  });
});



bot.onText(/\/getItemByID(?:\s+(\S+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const itemId = match[1];

  if (!itemId) {
    bot.sendMessage(chatId, 'Чтобы команда сработала правильно укажите ID предмета: /getItemByID id');
    return;
  }

  connection.query('SELECT * FROM chatbottests WHERE id = ?', [itemId], (error, results, fields) => {
    if (error) {
      console.error('Ошибка выполнения запроса: ' + error.stack);
      bot.sendMessage(chatId, 'Произошла ошибка при получении предмета.');
      return;
    }


    if (results.length > 0) {
      const item = results[0];
      const message = `(${item.id}) - ${item.name}: ${item.desc}`;
      bot.sendMessage(chatId, message);
    } else {
      bot.sendMessage(chatId, 'Предмет с указанным ID не найден.');
    }
  });
});


app.listen(port, () => {
  console.log(`Сервер запущен по адресу http://localhost:${port}`);
});

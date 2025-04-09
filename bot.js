const { Telegraf } = require('telegraf');
const bot = new Telegraf('7209885388:AAEOBty7DIXSgY_F0_05DhUntMy3jpCoPW0');  // Токен твоего бота

const ADMIN_ID = '744187097';  // Твой Telegram ID

// Обработка команды /start
bot.start((ctx) => {
  return ctx.reply('Добро пожаловать в Pick Your Hero!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🧾 Оформить заявку', callback_data: 'order' }]
      ]
    }
  });
});

// Обработка кнопки "Оформить заявку"
bot.action('order', (ctx) => {
  return ctx.editMessageText('Выберите способ оформления:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📷 Скин по фото. Отправьте фото вашего скина!', callback_data: 'photo' }],
        [{ text: '🎮 Сформировать скин', web_app: { url: 'https://telegram-mini-app-three-rho.vercel.app' } }]
      ]
    }
  });
});

// Обработка сообщений с фотографиями
bot.on('photo', async (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;  // Получаем имя или ник пользователя
  const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;  // Получаем file_id самого лучшего размера

  // Получаем файл с помощью File ID
  const file = await bot.telegram.getFile(photoId);

  // Путь к файлу будет в file.file_path
  const filePath = file.file_path;  // Пример: "photos/file_1.jpg"

  // Формируем URL для скачивания файла
  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${filePath}`;

  // Печатаем ссылку на файл
  console.log(fileUrl);  // Для дебага, чтобы проверить правильность URL

  // Отправляем ссылку админу и фото
  bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} прислал фото. File ID: ${photoId}`);
  bot.telegram.sendPhoto(ADMIN_ID, fileUrl, { caption: `Фото от ${user}` });

  // Ответ пользователю
  ctx.reply('Спасибо за отправленное фото! Мы обработаем ваш запрос.');
});

// Запуск бота
bot.launch();

console.log('Бот запущен');

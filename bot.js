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
        [{ text: '📷 Скин по фото', callback_data: 'photo' }],
        [{ text: '🎮 Сформировать скин', web_app: { url: 'https://telegram-mini-app-three-rho.vercel.app' } }]
      ]
    }
  });
});

// Обработка сообщений с фотографиями
bot.on('photo', async (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;  // Получаем ник пользователя или его имя
  const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;  // Берём самый лучший размер фото

  // Получаем файл с помощью File ID
  const file = await bot.telegram.getFile(photoId);
  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_TOKEN}/${file.file_path}`;

  // Сохраняем информацию о фотографии
  ctx.reply(`Пользователь ${user} отправил фотографию!`);

  // Отправляем фото и ник администратору
  bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} прислал фото. File ID: ${photoId}`);
  bot.telegram.sendPhoto(ADMIN_ID, fileUrl, { caption: `Фото отправлено пользователем ${user}` });

  // Ответ пользователю
  ctx.reply('Спасибо за отправленное фото! Мы обработаем ваш запрос.');
});

// Запуск бота
bot.launch();

console.log('Бот запущен');

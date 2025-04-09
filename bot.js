const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// Получаем ID администратора
const ADMIN_ID = '744187097'; // Замените на свой ID, чтобы получать уведомления

// Обработка команды /start
bot.start((ctx) => {
  return ctx.reply('Добро пожаловать в Pick Your Hero!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🧾 Оформить заявку', callback_data: 'order' }],
        [{ text: '💬 Связаться с нами', callback_data: 'contact' }]
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
bot.on('photo', (ctx) => {
  const user = ctx.from.username || ctx.from.first_name;  // Получаем никнейм пользователя или его имя
  const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;  // Берём самый лучший размер фото

  // Сохраняем информацию о фотографии
  ctx.reply(`Пользователь ${user} отправил фотографию!`);

  // Отправляем фото и ник администратору
  bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} прислал фото. File ID: ${photoId}`);

  // Ответ пользователю
  ctx.reply('Спасибо за отправленное фото! Мы обработаем ваш запрос.');
});

// Запуск бота
bot.launch();

console.log('Бот запущен');

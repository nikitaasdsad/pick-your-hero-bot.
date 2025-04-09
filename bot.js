const { Telegraf } = require('telegraf');
const bot = new Telegraf('7209885388:AAEOBty7DIXSgY_F0_05DhUntMy3jpCoPW0');  // Токен твоего бота

const ADMIN_ID = '744187097';  // Твой Telegram ID
let orderId = 0;  // Переменная для отслеживания номера заказа

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

// Обработка выбора "Скин по фото"
bot.action('photo', (ctx) => {
  return ctx.editMessageText('Отправьте фото вашего скина!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'order' }]
      ]
    }
  });
});

// Обработка кнопки "Назад"
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
  orderId++;  // Увеличиваем номер заказа
  const user = ctx.from.username || ctx.from.first_name;  // Получаем имя или ник пользователя
  const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;  // Получаем file_id самого лучшего размера

  // Отправляем ссылку админу
  bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} прислал фото.`);

  // Отправляем саму фотографию админу с подписью
  bot.telegram.sendPhoto(ADMIN_ID, photoId, { caption: `Фото от ${user}` });

  // Запрашиваем отмену запроса
  const cancelButton = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '❌ Отменить запрос', callback_data: `cancel_${orderId}` }]
      ]
    }
  };

  // Ответ пользователю
  ctx.reply('Спасибо за отправленное фото! Мы обработаем ваш запрос.', cancelButton);
});

// Обработка отмены запроса
bot.action(/^cancel_(\d+)$/, (ctx) => {
  const orderId = ctx.match[1];  // Получаем номер заказа из callback_data
  bot.telegram.sendMessage(ADMIN_ID, `Заказ номер ${orderId} отменен.`);

  // Возвращаем пользователя к выбору оформления заявки
  ctx.editMessageText('Заказ был отменен. Выберите способ оформления:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📷 Скин по фото. Отправьте фото вашего скина!', callback_data: 'photo' }],
        [{ text: '🎮 Сформировать скин', web_app: { url: 'https://telegram-mini-app-three-rho.vercel.app' } }]
      ]
    }
  });
});

// Запуск бота
bot.launch();

console.log('Бот запущен');

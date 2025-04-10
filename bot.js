const { Telegraf } = require('telegraf');
const bot = new Telegraf('7209885388:AAEOBty7DIXSgY_F0_05DhUntMy3jpCoPW0');  // Токен твоего бота

const ADMIN_ID = '744187097';  // Твой Telegram ID
let orderId = 0;  // Переменная для отслеживания номера заказа
let messages = {};  // Объект для хранения ID сообщений
let usersInProcess = {};  // Объект для отслеживания пользователей, которые уже в процессе оформления заявки

// Обработка команды /start
bot.start((ctx) => {
  const userId = ctx.from.id; // Получаем ID пользователя

  // Если у пользователя уже есть активная заявка, показываем кнопку для отмены
  if (usersInProcess[userId]) {
    return ctx.reply('Вы уже оформили заявку. Хотите отменить?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отменить заявку', callback_data: 'cancel_request' }]
        ]
      }
    });
  }

  return ctx.reply('Добро пожаловать в Pick Your Hero! Выберите способ оформления заявки:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🧾 Оформить заявку', callback_data: 'order' }]
      ]
    }
  });
});

// Обработка кнопки "Оформить заявку"
bot.action('order', (ctx) => {
  const userId = ctx.from.id; // Получаем ID пользователя

  // Проверяем, не отправил ли он уже запрос
  if (usersInProcess[userId]) {
    return ctx.reply('Вы уже оформили заявку. Хотите отменить?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отменить заявку', callback_data: 'cancel_request' }]
        ]
      }
    });
  }

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
  const userId = ctx.from.id; // Получаем ID пользователя

  // Проверяем, не отправил ли он уже запрос
  if (usersInProcess[userId]) {
    return ctx.reply('Вы уже оформили заявку. Хотите отменить?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отменить заявку', callback_data: 'cancel_request' }]
        ]
      }
    });
  }

  // Помечаем пользователя как того, кто оформляет заявку
  usersInProcess[userId] = true;

  return ctx.editMessageText('Отправьте фото вашего скина!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'order' }]
      ]
    }
  });
});

// Обработка сообщений с фотографиями
// Обработка сообщений с фотографиями
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;

  if (!usersInProcess[userId]) {
    return ctx.reply('Вы не начали оформление заявки. Нажмите на "Оформить заявку".');
  }

  orderId++;
  const user = ctx.from.username || ctx.from.first_name;
  const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  // Отправляем сообщение админу
  const message = await bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} прислал фото.`);

  messages[orderId] = {
    messageId: message.message_id,
    photoMessageId: null
  };

  const photoMessage = await bot.telegram.sendPhoto(ADMIN_ID, photoId, { caption: `Фото от ${user}` });
  messages[orderId].photoMessageId = photoMessage.message_id;

  // Ответ пользователю с кнопкой, как при старте
  await ctx.reply('Спасибо за отправленное фото! Мы обработаем ваш запрос. Если хотите отменить и отправить новую заявку, нажмите кнопку ниже.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '❌ Отменить заявку', callback_data: 'cancel_request' }]
      ]
    }
  });
});
  // Отправляем саму фотографию админу с подписью
  const photoMessage = await bot.telegram.sendPhoto(ADMIN_ID, photoId, { caption: `Фото от ${user}` });

  // Сохраняем ID сообщения с фото
  messages[orderId].photoMessageId = photoMessage.message_id;

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

  // Помечаем пользователя как того, кто оформил заявку
  usersInProcess[userId] = true;
});

// Обработка отмены запроса
bot.action(/^cancel_(\d+)$/, (ctx) => {
  const orderId = ctx.match[1];  // Получаем номер заказа из callback_data

  // Удаляем сообщения: сообщение о фото и сообщение с фото
  if (messages[orderId]) {
    const messageData = messages[orderId];
    
    // Удаляем оба сообщения
    bot.telegram.deleteMessage(ADMIN_ID, messageData.messageId);
    bot.telegram.deleteMessage(ADMIN_ID, messageData.photoMessageId);

    // Удаляем ID сообщения из объекта
    delete messages[orderId];
  }

  // Освобождаем пользователя для отправки нового запроса
  const userId = ctx.from.id;
  delete usersInProcess[userId];

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

// Обработка кнопки "Отменить заявку"
bot.action('cancel_request', (ctx) => {
  const userId = ctx.from.id;

  // Удаляем заявку пользователя
  delete usersInProcess[userId];

  // Возвращаем пользователя к выбору оформления заявки
  ctx.editMessageText('Вы отменили заявку. Выберите способ оформления:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🧾 Оформить заявку', callback_data: 'order' }]
      ]
    }
  });
});

// Запуск бота
bot.launch();

console.log('Бот запущен');

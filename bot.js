const { Telegraf } = require('telegraf');
const bot = new Telegraf('7209885388:AAEOBty7DIXSgY_F0_05DhUntMy3jpCoPW0'); // 🔐 Замени на свой токен

const ADMIN_ID = '744187097';  // ID админа
let orderId = 0;
let messages = {};
let usersInProcess = {};

// /start
bot.start((ctx) => {
  const userId = ctx.from.id;

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

// Кнопка "Оформить заявку"
bot.action('order', (ctx) => {
  const userId = ctx.from.id;

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

// Кнопка "Скин по фото"
bot.action('photo', (ctx) => {
  const userId = ctx.from.id;

  if (usersInProcess[userId]) {
    return ctx.reply('Вы уже оформили заявку. Хотите отменить?', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отменить заявку', callback_data: 'cancel_request' }]
        ]
      }
    });
  }

  usersInProcess[userId] = true;

  return ctx.editMessageText('Отправьте фото вашего скина!');
});

// Обработка фото
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;

  // Если пользователь не начал оформление заявки
  if (!usersInProcess[userId]) {
    return ctx.reply('Вы не начали оформление заявки. Нажмите на "Оформить заявку".');
  }

  // Если он уже присылал фото — игнорируем
  if (usersInProcess[userId] === 'photo_sent') {
    return; // просто молча пропускаем
  }

  // Помечаем, что фото получено
  usersInProcess[userId] = 'photo_sent';

  orderId++;
  const user = ctx.from.username || ctx.from.first_name;
  const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  const textMessage = await bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} прислал фото.`);
  const photoMessage = await bot.telegram.sendPhoto(ADMIN_ID, photoId, { caption: `Фото от ${user}` });

  messages[orderId] = {
    messageId: textMessage.message_id,
    photoMessageId: photoMessage.message_id
  };

  await ctx.reply('✅ Заявка оформлена. Если хотите отменить — нажмите кнопку ниже:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '❌ Отменить заявку', callback_data: 'cancel_request' }]
      ]
    }
  });
});

// Кнопка "❌ Отменить заявку"
bot.action('cancel_request', async (ctx) => {
  const userId = ctx.from.id;

  // Ищем и удаляем заказ этого пользователя
  for (const id in messages) {
    const msg = messages[id];
    try {
      await bot.telegram.deleteMessage(ADMIN_ID, msg.messageId);
      await bot.telegram.deleteMessage(ADMIN_ID, msg.photoMessageId);
    } catch (e) {
      console.log('Не удалось удалить сообщение:', e.message);
    }
    delete messages[id];
  }

  delete usersInProcess[userId];

  return ctx.editMessageText('Вы отменили заявку. Выберите способ оформления:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🧾 Оформить заявку', callback_data: 'order' }]
      ]
    }
  });
});

// Запуск
bot.launch();
console.log('Бот запущен');

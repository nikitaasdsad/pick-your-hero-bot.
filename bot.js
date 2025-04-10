const { Telegraf } = require('telegraf');
const bot = new Telegraf('7209885388:AAEOBty7DIXSgY_F0_05DhUntMy3jpCoPW0');

const ADMIN_ID = '744187097';
let orderId = 0;
let messages = {};
let usersInProcess = {};
let userComments = {};  // Объект для хранения комментариев пользователей

// ======================= Команда /start =======================
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

// ======================= Кнопка "Оформить заявку" =======================
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

// ======================= Кнопка "Скин по фото" =======================
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

  return ctx.editMessageText('Отправьте фото вашего скина!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'order' }]
      ]
    }
  });
});

// ======================= Приём фотографии =======================
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id;

  if (!usersInProcess[userId]) {
    return ctx.reply('Вы не начали оформление заявки. Нажмите на "Оформить заявку".');
  }

  orderId++;
  const user = ctx.from.username || ctx.from.first_name;
  const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  // Отправка сообщений админу
  const textMessage = await bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} прислал фото.`);
  const photoMessage = await bot.telegram.sendPhoto(ADMIN_ID, photoId, { caption: `Фото от ${user}` });

  // Сохраняем ID сообщений
  messages[orderId] = {
    messageId: textMessage.message_id,
    photoMessageId: photoMessage.message_id
  };

  await ctx.reply('✅ Заявка оформлена. Хотите оставить комментарий?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💬 Оставить комментарий', callback_data: 'add_comment' }],
        [{ text: '⏭️ Пропустить', callback_data: 'skip_comment' }]
      ]
    }
  });
});

// ======================= Обработка кнопки "Оставить комментарий" =======================
bot.action('add_comment', (ctx) => {
  const userId = ctx.from.id;

  return ctx.reply('Напишите ваш комментарий:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Назад', callback_data: 'order' }]
      ]
    }
  });
});

// ======================= Получение комментария от пользователя =======================
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;

  if (ctx.message.text && usersInProcess[userId] && !userComments[userId]) {
    // Сохраняем комментарий пользователя
    userComments[userId] = ctx.message.text;

    const user = ctx.from.username || ctx.from.first_name;
    const photoMessageId = messages[orderId].photoMessageId;

    // Отправляем сообщение админу с фото, информацией пользователя и комментарием
    await bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} оставил комментарий: \n"${ctx.message.text}"`);

    // Отправляем фото вместе с комментарием
    await bot.telegram.sendPhoto(ADMIN_ID, photoMessageId, {
      caption: `Фото от ${user}\nКомментарий: "${ctx.message.text}"`
    });

    await ctx.reply('Спасибо за ваш комментарий! Заявка оформлена.');

    delete usersInProcess[userId]; // Очистка состояния пользователя
    delete userComments[userId];  // Очистка комментария
  }
});

// ======================= Пропустить комментарий =======================
bot.action('skip_comment', async (ctx) => {
  const userId = ctx.from.id;
  const user = ctx.from.username || ctx.from.first_name;
  const photoMessageId = messages[orderId].photoMessageId;

  // Отправляем администратору только фото и информацию без комментария
  await bot.telegram.sendMessage(ADMIN_ID, `Пользователь ${user} с ником @${ctx.from.username || 'не указан'} не оставил комментарий.`);
  await bot.telegram.sendPhoto(ADMIN_ID, photoMessageId, {
    caption: `Фото от ${user}`
  });

  await ctx.reply('Вы пропустили комментарий. Заявка оформлена.');

  delete usersInProcess[userId]; // Очистка состояния пользователя
});

// ======================= Обработка отмены заявки =======================
bot.action('cancel_request', (ctx) => {
  const userId = ctx.from.id;

  // Удаляем все сообщения у админа, связанные с этим пользователем
  for (const id in messages) {
    if (messages[id]) {
      const { messageId, photoMessageId } = messages[id];
      bot.telegram.deleteMessage(ADMIN_ID, messageId).catch(() => {});
      bot.telegram.deleteMessage(ADMIN_ID, photoMessageId).catch(() => {});
      delete messages[id];
    }
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

// Запуск бота
bot.launch();
console.log('Бот запущен 🚀');

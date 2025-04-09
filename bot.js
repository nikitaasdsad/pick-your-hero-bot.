const { Telegraf } = require('telegraf');

const bot = new Telegraf('7209885388:AAEOBty7DIXSgY_F0_05DhUntMy3jpCoPW0');

bot.start((ctx) => {
  return ctx.reply('Добро пожаловать в Pick Your Hero!', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🧾 Оформить заявку', callback_data: 'order' }]
      ]
    }
  });
});

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

bot.action('photo', (ctx) => {
  return ctx.reply('Пришлите нам фото или описание скина, который вы хотите создать.');
});

bot.launch();

console.log('Бот запущен');

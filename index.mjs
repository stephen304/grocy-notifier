import fetch from 'node-fetch';
import cron from 'node-cron';
import wa from '@open-wa/wa-automate';

const GROCY_API_KEY = process.env.GROCY_API_KEY || "";
const GROCY_URL = process.env.GROCY_URL || "";
const WA_GROUP_ID = process.env.WA_GROUP_ID || "";
const CRON_CHORE_SCHEDULE = process.env.CRON_CHORE_SCHEDULE || "0 0 8 * * *";
const INDOCKER = process.env.INDOCKER || false;

wa.create({
  sessionId: "COVID_HELPER",
  multiDevice: true, //required to enable multiDevice support
  authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: true,
  inDocker: INDOCKER,
  qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
}).then(client => start(client));

const start = async (client) => {
  choreNotifierScheduler(client);
};

//Schedule chore notifier
const choreNotifierScheduler = async (client) => {
  cron.schedule(CRON_CHORE_SCHEDULE, async function () {
    const choresUrl = new URL('/api/chores', GROCY_URL);
    const req = await fetch(choresUrl, {
      headers: {
        'Content-Type': 'application/json',
        'GROCY-API-KEY': GROCY_API_KEY,
      },
    });
    const chores = await req.json();

    const dueChores = chores.filter(chore => {
      let now = new Date();
      now.setDate(now.getDate() + 2);
      return new Date(chore.next_estimated_execution_time) < now;
    });

    if (dueChores.length > 0) {
      // Send notification
      client.sendText(WA_GROUP_ID, `${dueChores.length} chores due today:\n${dueChores.sort((a, b) => (a.id-b.id)).map(chore => `${chore.id}) ${chore.chore_name}`).join('\n')}`);
    }

    console.log(dueChores);
  });
}

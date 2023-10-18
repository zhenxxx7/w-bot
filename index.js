const { Client, Location, List, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrTerminal = require('qrcode-terminal')

const client = new Client({
    authStrategy: new LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: { 
        // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
        headless: false
    }
});

client.initialize();

client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED');
    qrTerminal.generate(qr, {small: true})
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});

client.on('message', async msg => {
    const number = msg.from
    //console.log(number)

    if(msg.body === 'Menu'){
        msg.reply (`Menu : \n/student\n/teacher`)
    }

    if(msg.body === '/student'){
        msg.reply (`Menu : \n/IPK\n/IPS\n/Kehadiran Mahasiswa\n/Nilai Matakuliah`)
    }

    if(msg.body === '/teacher'){
        msg.reply (`Menu : coming soon`)
    }
});
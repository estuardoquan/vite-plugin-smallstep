const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');

async function getHttps(step = {}) {
    const delay = (t) => {
        return new Promise((resolve) => setTimeout(resolve, t));
    }
    let https = null;
    while (!https) {
        try {
            https = {
                cert: fs.readFileSync(step.crt),
                key: fs.readFileSync(step.key),
            };
        } catch (err) {
            await delay(5000);
            console.log(err);
        }
    }
    return https;
}
module.exports = (options = { steppath: '/home/step' }) => {
    const { steppath } = options;
    const step = {
        crt: path.resolve(steppath, 'site.crt'),
        key: path.resolve(steppath, 'site.key'),
    };
    return {
        name: 'vite-plugin-smallstep',
        async config(userConfig, { command, mode }) {
            const https = await getHttps(step);
            return {
                server: {
                    https: https,
                },
            };
        },
        // extracted from vite-plugin-restart
        configureServer(server) {
            const { crt } = step;
            server.watcher.add(crt);
            server.watcher.on('add', restart);
            server.watcher.on('change', restart);
            server.watcher.on('unlink', restart);
            function restart(file) {
                if (micromatch.isMatch(file, crt)) {
                    server.restart();
                }
            }
        },
    };
};

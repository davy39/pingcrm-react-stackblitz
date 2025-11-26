import express from 'express';
import { PHPRequestHandler, PHP } from '@php-wasm/universal';
import { loadNodeRuntime, createNodeFsMountHandler } from '@php-wasm/node';
import path from 'path';

const app = express();
const PORT = 3000; 
const PROJECT_ROOT = process.cwd();
const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');

(async () => {
    const handler = new PHPRequestHandler({
        documentRoot: PUBLIC_ROOT,
        absoluteUrl: `http://localhost:${PORT}`,
        getFileNotFoundAction: (path) => ({ type: 'internal-redirect', uri: '/index.php' }),
        
        phpFactory: async () => {
            const runtime = await loadNodeRuntime('8.4');
            const php = new PHP(runtime);
            
            php.onStdout = (c) => process.stdout.write(new TextDecoder().decode(c));
            php.onStderr = (c) => process.stderr.write(new TextDecoder().decode(c));

            await php.mount(PROJECT_ROOT, createNodeFsMountHandler(PROJECT_ROOT));
            php.chdir(PUBLIC_ROOT);
            return php;
        }
    });

    await handler.getPrimaryPhp();
    console.log("🐘 Laravel Wasm Server (PHP 8.4) Ready");

    app.use((req, res, next) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => { req.rawBody = Buffer.concat(chunks); next(); });
    });

    app.all('*', async (req, res) => {
        try {
            const result = await handler.request({
                method: req.method,
                url: `http://localhost:${PORT}${req.url}`,
                headers: req.headers,
                body: req.rawBody
            });

            const responseHeaders = {};
            let isHtml = false;

            for (const [key, value] of Object.entries(result.headers)) {
                const lowerKey = key.toLowerCase();

                if (lowerKey === 'content-length') continue;
                if (lowerKey === 'set-cookie') {
                    responseHeaders[key] = value;
                    continue;
                }
                const stringValue = Array.isArray(value) ? value.join(', ') : value;
                responseHeaders[key] = stringValue;
                if (lowerKey === 'content-type' && stringValue.includes('text/html')) {
                    isHtml = true;
                }
            }

            res.status(result.httpStatusCode);
            res.set(responseHeaders);

            if (isHtml) {
                let html = new TextDecoder().decode(result.bytes);
                html = html.replace('</body>', '<script type="module" src="/@vite/client"></script></body>');
                res.send(html);
            } else {
                res.end(result.bytes);
            }
        } catch (e) {
            console.error("PHP Request Error:", e);
            res.status(500).send('Internal Server Error');
        }
    });

    app.listen(PORT, () => console.log(`Listening on ${PORT}`));
})();
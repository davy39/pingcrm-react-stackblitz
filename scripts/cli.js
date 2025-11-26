import { PHP } from '@php-wasm/universal';
import { createNodeFsMountHandler, loadNodeRuntime } from '@php-wasm/node';

(async () => {
    const runtime = await loadNodeRuntime('8.4');
    const php = new PHP(runtime);
    const cwd = process.cwd();
    await php.mount(cwd, createNodeFsMountHandler(cwd));
    await php.chdir(cwd);

    const args = process.argv.slice(2);
    console.log(`🐘 Artisan : php ${args.join(' ')}`);
    
    const response = await php.cli(['php', ...args]);
    
    if (response.exitCode !== 0) process.exit(await response.exitCode);
})();
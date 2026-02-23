import { createApp } from './create-app';

const main = async () => {
    const app = await createApp();

    app.listen({ port: 3000 }, (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server running on ${address}`);
    });
};

main();

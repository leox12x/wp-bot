module.exports = {
    name: 'ping',
    description: 'Test if the bot is responding',
    usage: '!ping',
    category: 'utility',
    
    async execute(message, args, client, config) {
        try {
            const startTime = Date.now();
            const reply = await message.reply('🏓 Pong!');
            const endTime = Date.now();
            
            const latency = endTime - startTime;
            await reply.edit(`🏓 Pong!\n⏱️ Latency: ${latency}ms`);
            
        } catch (error) {
            console.error('Error in ping command:', error);
            await message.reply('❌ An error occurred while processing the ping command.');
        }
    }
};

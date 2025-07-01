const fs = require('fs');
const path = require('path');

console.log('🚀 Simple Logger Script Started');
console.log('📊 Node.js version:', process.version);
console.log('📂 Current directory:', process.cwd());

// Fix the syntax error in the original file
const testValue = 42;
console.log('✅ Test value:', testValue);

// Simulate some logging work
let counter = 0;
const interval = setInterval(() => {
    counter++;
    console.log(`📝 Log entry #${counter} - ${new Date().toISOString()}`);
    
    if (counter >= 5) {
        clearInterval(interval);
        console.log('🎉 Simple Logger Script Completed!');
        process.exit(0);
    }
}, 1000);

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    clearInterval(interval);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    clearInterval(interval);
    process.exit(0);
});

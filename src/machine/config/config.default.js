/*jshint node: true*/

module.exports = {
    port: 9009,
    hookId: 'FormulaMachineHook',
    environment: 'mono', // 'mono' || '' for native windows execution
    commands: {
        'constraints': '../src/machine/mono/Query.exe',
        'check': '../src/machine/mono/CommandLine.exe'
    },
    log: {
        transports: [{
            transportType: 'File',
            options: {
                name: 'info-file',
                filename: 'machine.log',
                level: 'info',
                json: false
            }
        }, {
            transportType: 'File',
            options: {
                name: 'error-file',
                filename: 'machine-error.log',
                level: 'error',
                handleExceptions: true, // ignored by default when you create the logger, see the logger.create function
                json: false
            }
        }]
    },
    mongo: {
        uri: 'mongodb://127.0.0.1:27017/4mlMachine',
        options: {
            db: {
                w: 1,
                native_parser: true // jshint ignore: line
            },
            server: {
                auto_reconnect: true, // jshint ignore: line
                socketOptions: {keepAlive: 1}
                //poolSize: 5 // default pool size is 5
            }
        }
    }
};

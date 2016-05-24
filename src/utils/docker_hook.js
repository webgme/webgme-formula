/**
 * @author kecso / https://github.com/kecso
 */

function dockerCommand(options) {
    var childProcess = require('child_process');
    return {
        cp: function (src, dst) {
            return childProcess.execSync('docker cp ' + src + ' ' + dst, options.cmd);
        },
        start: function () {
            return childProcess.execSync('docker run -d -i ' + options.imageId, options.cmd);
        },
        stop: function (containerId, callback) {
            return childProcess.exec('docker rm -f ' + containerId, options.cmd, callback);
        },
        run: function (containerId, callback) {
            return childProcess.exec('docker exec ' + containerId + ' mono ' + options.executable,
                options.cmd, callback);
        }
    };
}

function dockerTasker(options) {
    var working = false,
        queue = [],
        fs = require('fs'),
        cmd = new dockerCommand({
            cmd: {
                encoding: 'utf8',
                env: {
                    DOCKER_HOST: 'tcp://192.168.99.100:2376',
                    DOCKER_MACHINE_NAME: 'default',
                    DOCKER_TLS_VERIFY: 1,
                    DOCKER_CERT_PATH: '/Users/tamaskecskes/.docker/machine/machines/default'
                }
            },
            executable: 'CommandLine.exe -list -exit',
            imageId: '4ml'
        }),
        moveArtifacts = function (containerId, artifactHashes, callback) {
            queue.push({
                id: containerId,
                type: 'setup',
                hashes: artifactHashes,
                cb: callback
            });
        },
        getResult = function (containerId, callback) {
            queue.push({
                id: containerId,
                type: 'result',
                cb: callback
            });
        };

    setInterval(function () {
        var task;

        if (!working && queue.length > 0) {
            working = true;
            task = queue.shift();

            if (task.type === 'setup') {
                // TODO download the assets
                cmd.cp('model.4ml', task.id + ':usr/app/model.4ml');
                cmd.cp('constraints.4ml', task.id + ':usr/app/constraints.4ml');
                working = false;
                task.cb();
            } else {
                // TODO create result
                //cmd.cp(task.id + ':usr/app/result.json', 'result.json');
                working = false;
                //task.cb(null, JSON.parse(fs.readFileSync('result.json', 'utf8')));
                task.cb(null, {});
            }
        }
    }, options.checkInterval || 10);

    return function (task, callback) {
        // TODO handlling parameters
        var containerId = cmd.start().substr(0, 12);

        moveArtifacts(containerId, [], function (err) {
            cmd.run(containerId, function (err) {
                getResult(containerId, callback);
            });
        });
    };
}

var Express = require('express'),
    bodyParser = require('body-parser'),
    __docker_rest = new Express(),
    __dockerTasker = new dockerTasker({}),
    __httpServer;

__docker_rest.use(bodyParser.json());

__docker_rest.post('/4ml', function (req, res) {
    if (req && req.body) {
        __dockerTasker(req.body, function (err, result) {
            res.send(200, result);
        });
    }
});

__docker_rest.get('*', function (req, res) {
    console.log('do not get it :D ');
    res.send(400);
});

__httpServer = require('http').createServer(__docker_rest);

__httpServer.on('connection', function (socket) {
    console.log('someone just connected');
});
__httpServer.on('secureConnection', function (socket) {
    console.log('someone just securely connected');
});

__httpServer.on('clientError', function (err, socket) {
    console.log('clientError', err);
});

__httpServer.on('error', function (err) {
    console.error('whaaat?', err);
});

__httpServer.listen(9009, function (err) {
    if (err) {
        console.error('docker 4ml sevrer cannot be started', err);
        process.exit(1);
    }
    console.log('docker 4ml task server is up and running');
});


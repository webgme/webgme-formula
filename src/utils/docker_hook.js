/*jshint node:true, camelcase:false*/
/**
 * @author kecso / https://github.com/kecso
 */

function dockerCommand(options) {
    var childProcess = require('child_process');
    return {
        cp: function (src, dst) {
            try {
                return childProcess.execSync('docker cp ' + src + ' ' + dst, options.cmd);
            } catch (e) {
                // TODO do we need error handling here???
            }
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
        cmd = new dockerCommand(config),
        moveArtifacts = function (containerId, formulaModule, constraints, callback) {
            queue.push({
                id: containerId,
                type: 'setup',
                module: formulaModule,
                constraints: constraints,
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
        var task,
            result;

        if (!working && queue.length > 0) {
            working = true;
            task = queue.shift();

            if (task.type === 'setup') {
                // TODO download the assets
                fs.writeFileSync('model.4ml', task.module);
                cmd.cp('model.4ml', task.id + ':usr/app/model.4ml');
                fs.unlinkSync('model.4ml');
                fs.writeFileSync('constraints.json', JSON.stringify(task.constraints, null, 2));
                cmd.cp('constraints.json', task.id + ':usr/app/constraints.json');
                fs.unlinkSync('constraints.json');
                working = false;
                task.cb();
            } else {
                cmd.cp(task.id + ':usr/app/queryresults.json', 'queryresults.json');
                result = JSON.parse(fs.readFileSync('queryresults.json', 'utf8') || '{}');
                fs.unlinkSync('queryresults.json');
                cmd.stop(task.id);
                working = false;
                task.cb(null, result);
                // task.cb(null, {});
            }
        }
    }, options.checkInterval || 10);

    return function (task, callback) {
        // TODO handlling parameters
        var containerId = cmd.start().substr(0, 12);

        moveArtifacts(containerId, task.module, task.constraints, function (err) {
            cmd.run(containerId, function (err) {
                getResult(containerId, callback);
            });
        });
    };
}

var Express = require('express'),
    bodyParser = require('body-parser'),
    __docker_rest = new Express(),
    __dockerTasker,
    __httpServer,
    config = require('./docker.config');

// TODO better configuration support
if (typeof config !== 'object' || !config.cmd) {
    console.error('there is no configuration file!!!');
    process.exit(1);
}
__dockerTasker = new dockerTasker({});

__docker_rest.use(bodyParser.json());

__docker_rest.post('/4ml', function (req, res) {
    if (req && req.body) {
        __dockerTasker(req.body, function (err, result) {
            if (err) {
                res.status(500).send(e);
            } else {
                res.status(200).send(result);
            }
        });

    }
});

__httpServer = require('http').createServer(__docker_rest);

__httpServer.on('connection', function (socket) {
});
__httpServer.on('secureConnection', function (socket) {
});

__httpServer.on('clientError', function (err, socket) {
    console.log('clientError', err);
});

__httpServer.on('error', function (err) {
});

__httpServer.listen(config.port, function (err) {
    if (err) {
        console.error('docker 4ml sevrer cannot be started', err);
        process.exit(1);
    }
    console.log('docker 4ml task server is up and running');
});


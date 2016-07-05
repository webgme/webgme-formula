Configuration
=============

The easiest way to set your custom configuration is to include the default configuration and overwrite/appended to the default fields.

```
- ---------------------
./config/config.mine.js
- ---------------------

var config = require('./config.default');

config.addOns.enable = true;
config.addOns.basePaths.push('C:/addons');

module.exports = config;
```

### Which configuration file is being used?
To use any other configuration than the default you need to set the environment variable `NODE_ENV`. When the server starts the configuration file at `config/config.%NODE_ENV%.js` will be loaded. If `NODE_ENV` is not set it falls back to loading `config/config.default.js`.

To start the server using the configuration above,

windows

`set NODE_ENV=mine && npm start`

ubuntu

`NODE_ENV=mine npm start`


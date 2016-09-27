# Formula integration framework for WebGME
## More information
[Formula](http://formula.codeplex.com/)

## Formula Machine on linux
To run the .NET executable on linux requires [Mono](http://www.mono-project.com). Follow the instructions [described here](http://www.mono-project.com/docs/getting-started/install/linux/) and for ubuntu run:

```
sudo apt-get install mono-complete
```

Check it is available via:
```
mono --version
```

## Installation:
Here is the outline of the quickest and most compact deployment of the framework.

- Checkout the entire repository
- Create own configuration files (if necessary)
- Start Formula Machine ```npm run start_machine```
- Start WebGME server  ```npm run start```

## Extend your own deployment
If you already have your own deployment built with [webgme-cli](https://github.com/webgme/webgme-cli) you can follow these steps to add the FormulaEditor to your work.

- Import visualizer ```webgme import viz FormulaEditor webgme/formula```
- Import plugin ```webgme import plugin GenFORMULA webgme/formula```
- Create own configuration files (if necessary)
- Start Formula Machine ```npm run start_machine```
- Start WebGME server  ```npm start```

## Configuration:
The main configuration is the WebGME server [configuration](https://github.com/webgme/webgme/tree/master/config).
You can also configure some parameters of the Formula machine in a similar manner.

It is very important that you need to configure the component settings of the WebGME server
so it will try to connect to your Formula machine on the right port.
```
"FormulaEditor": {
    "baseUrl":"http://localhost:9009/4ml"
  }
```
In this example the url follows the default 9009 port of the Formula machine.
If you want to change the port, you need to update this setting accordingly.

It is also very important that the middleware has to be pointed correctly
in the WebGME configuration otherwise the client will not be able to access
the Formula machine. (there is no need to update this part of the default configuration)


### Useful commands for cloud machine
```sudo NODE_ENV=verbose npm run start_machine```

```sudo npm run start```

- `Ctrl + Z` - put job in background
- `jobs` - list background jobs
- `bg 1` - start background job (by id)
- `fg 1` - put job in foreground
- `Ctrl + C` - kill job in foreground

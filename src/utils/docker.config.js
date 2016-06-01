module.exports = {
    cmd: {
        encoding: 'utf8',
        env: { // These environment variables needs to be set properly in every deployment
            DOCKER_HOST: 'tcp://192.168.99.100:2376',
            DOCKER_MACHINE_NAME: 'default',
            DOCKER_TLS_VERIFY: 1,
            DOCKER_CERT_PATH: '/Users/tamaskecskes/.docker/machine/machines/default'
        }
    },
    executable: 'Query.exe -f model.4ml -c constraints.json', // we might come up with different/multiple execute options
    imageId: 'kecso/formula', // should point to a formula docker image that has the Query.exe
    port: 9009 // the listening port of the webserver
};
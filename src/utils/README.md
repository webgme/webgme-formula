# Webserver for [Docker](https://www.docker.com/) based [FORMULA](http://formula.codeplex.com/) execution

This application is a small webserver that provides Formula query checking service.

## Installation:

- make sure docker-daemon is installed on the machine where the webserver will run
- download the formula docker image `docker pull kecso/formula`
- set the proper values in the docker.config.js file
- start the webserver as a background task or create a service

## Usage:

- POST('/4ml')
    - body `{
   module:'the formula model in string format', 
   constraints:['names of the constraints that should be checked']}`
    - responeBody `{'name of constraint':true|false}`
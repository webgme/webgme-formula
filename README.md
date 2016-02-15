# Formula integration framework for WebGME

## Requirements:
[Formula](http://formula.codeplex.com/)


    nodemon combine_templates.js --ignore Templates.js --ext ejs
    nodemon ./node_modules/webgme/src/bin/run_plugin.js Export2FORMULA sm

    nodemon -w model.4ml --exec test_model.bat

    f:\SVN\formula\Bld\Drops\Formula_Release_x64\Formula.exe -l:"model.4ml" -w:"on" -ls -ap:"R=T(m2)" -ex:"0 R" -sv:"R Result.4ml" -x

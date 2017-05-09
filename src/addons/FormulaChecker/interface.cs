using ConstraintExecutor;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

public class Startup
{

    private CommandExecutor executor;
    public async Task<object> Invoke(dynamic input)
    {
        this.executor = new CommandExecutor();
        return (Func<object,Task<object>>)this.Run;
    }

    public async Task<object> Run(dynamic input)
    {
        string command = (string)input.command;
        string path = (string)input.path;
        string debugInfo;

        switch (command)
        {
            case "load":
                executor.DoLoadModel(path, out debugInfo);
                return debugInfo;
            case "loadLanguage":
                executor.DoLoadDomain(path, out debugInfo);
                return debugInfo;
            case "loadModel":
                executor.DoLoadModel(path, out debugInfo);
                return debugInfo;
            case "loadConstraints":
                return executor.DoLoadConstraints(path, "M", out debugInfo);
            case "query":
                object[] inputList = (object[])input.constraints;
                List<string> constraints = new List<string>();
                foreach(object cName in inputList){
                    constraints.Add((string)cName);
                }

                return executor.CheckConstraints(constraints);
            default:
                return "no command";
        }
    }
}
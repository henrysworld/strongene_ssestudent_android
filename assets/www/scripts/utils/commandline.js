

function startCommandLine() {

    // * Initialization
    new SaveLoad.InputFieldSaver("#xjx_input");
    var cmd = new CommandLine.Manager("#xjx_input", "#xjx_display");

    // * Define print
    cmd.define("print", printLine);
    function printLine( str ) {
        cmd.log(str);
        console.log(str);
    }

    // * Define clear
    cmd.define("clear", function () {
        cmd.clear();
    });

    // * Define help
    cmd.define("help", function () {
        cmd.log(" ");
        cmd.log("^^^^^^^^^^^^^^^^^^");
        cmd.log("httptest");
        cmd.log("print arg1");
        cmd.log("clear");
        cmd.log("help");
        cmd.log("vvvvvv HELP vvvvvv");
        cmd.log(" ");
    });


    // =============================================== APIs ========================================
    cmd.define("httptest", function () {
        cmd.log("^^^^^^^^^^^^^^^^^^");
        try{
            var httpReq = new plugin.HttpRequest();
            httpReq.getJSON("http://www.google.com", function(status, data) {
                cmd.log(data);
                console.log(data);
            });
        } catch ( error ) {
            console.log(error.error);
        }
    });

    // =============================================== run default ========================================
    // * Show help
    function runDefault() {
        console.log("running command line");
        cmd.runCommand("help");
        cmd.log('type "help" or define your own command in commandline.js.');
        cmd.runCommand("httptest");
    }

    // * show default
    runDefault();

}
var http = require('http'),
url = require("url"),
path = require("path"),
fs = require('fs'),
zlib = require("zlib"),
io = require('socket.io'),
mime = require("./mime").types,
config = require("./config"),
log = require("./log").Log,
tools = require("./serverTools").Tools,
defaultPort = 8080, port = defaultPort;

// 获取参数
process.argv.forEach(function (val, index, array) {
	var p = val.split("=");
	if (p.length > 1 && p[0] == "port") {
		port = p[1];
	} else if (p.length > 1 && p[0] == "log") {
		var logType = p[1];
		for (var i=0, l=log.levelList.length; i<l; i++) {
			if (log.levelList[i] === logType) {
				log.level = i;
				break;
			}
		}
	}
});

//获取默认路径
var modulePaths = module.paths, serverPath = "/", webPath = "";
if (modulePaths.length > 0) {
	serverPath = path.dirname(modulePaths[0]);
}
webPath = serverPath + "/web";
log.serverPath = serverPath;

var server = http.createServer(function (request, response) {

	var clientIp = request.connection.remoteAddress;
	
	//查找文件路径
    var pathname = url.parse(request.url).pathname;
	if (pathname.lastIndexOf("/") == pathname.length - 1) {
		pathname += config.DefaultPage;
	}
    var realPath = webPath + pathname.replace(/\.\./g, "");
	
	var ext = path.extname(realPath);

	ext = ext ? ext.slice(1) : 'unknown';
	//根据类型设置过期时间
	if (ext.match(config.Expires.fileMatch)) {
	    var expires = new Date();
		expires.setTime(expires.getTime() + config.Expires.maxAge * 1000);
		response.setHeader("Expires", expires.toUTCString());
		response.setHeader("Cache-Control", "max-age=" + config.Expires.maxAge);

	}
	var contentType = mime[ext] || "text/plain";
	response.setHeader("Content-Type", contentType);

	log.info(clientIp + " access url : "  +request.url);

	//判断文件是否存在
    fs.exists(realPath, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });

            response.write("This request URL " + pathname + " was not found on this server.");
			log.error(realPath + " is not exists!");
            response.end();
        } else {

			/*
			if (request.headers[ifModifiedSince] && lastModified == request.headers[ifModifiedSince]) {
				response.writeHead(304, "Not Modified");
				response.end();
			}*/

            fs.readFile(realPath, "binary", function (err, file) {
                if (err) {
                    response.writeHead(500, {
                        'Content-Type': 'text/plain'
                    });

                    response.end("realPath = " +realPath+ ", errno:" + err.errno + ", errcode:" + err.code );
                } else {

					//使用 gzip 压缩
					var raw = fs.createReadStream(realPath);
					var acceptEncoding = request.headers['accept-encoding'] || "";
					var matched = ext.match(config.Compress.match);
					if (matched && acceptEncoding.match(/\bgzip\b/)) {
						response.writeHead(200, "Ok", {
							'Content-Encoding': 'gzip'
						});
						raw.pipe(zlib.createGzip()).pipe(response);
					} else if (matched && acceptEncoding.match(/\bdeflate\b/)) {
						response.writeHead(200, "Ok", {
							'Content-Encoding': 'deflate'
						});
						raw.pipe(zlib.createDeflate()).pipe(response);
					} else {
						response.writeHead(200, "Ok");
						raw.pipe(response);
					}

                    //response.write(file, "binary");
                    //response.end();
                }
            });
        }
    });
});

server.listen(port);
log.info("http server is started. port : " + port);
log.info("web path : " + webPath);


//创建socket
var socketSetting = {
	//关闭 socket.io 的debug 信息
	"log level" : log.level
},
socket = io.listen(server, socketSetting), userList = {};

//添加连接监听
socket.on('connection', function(client){
	var clientIp = client.handshake.address.address, userName = tools.checkWhiteList(clientIp); 
	if (!userName) {
		return;
	}

	if (!userList[userName]) {
		userList[userName] = 1;
	} else {
		userList[userName] ++;
	}
	
	/*
	//连接成功则执行下面的监听
	client.on('message',function(event){ 
		console.log('Received message from client!',event);
	});
	*/
	
	//断开连接callback
	client.on('disconnect',function(){
		if (userList[userName]) {
			userList[userName] --;
			if (userList[userName] == 0) {
				delete userList[userName];
			}
		}
		log.info("client(" + userName + ") [" + clientIp + "] has disconnected");
		client.broadcast.emit('userDisConnected', {user: (userList[userName] > 0 ? userName + " 的马甲": userName), userList: userList});
	});
	
	//发送消息给客户端	
	client.emit('open', {userList: userList});
		
	client.on('sendMsg', function (data) {
		client.broadcast.emit('msg', { user: userName, msg: data.msg, msgType: data.msgType, userList: userList });
		log.debug("client(" + userName + ") [" + clientIp + "] send msg:\n" + data.msg);
	});
	//广播信息给除当前用户之外的用户
	client.broadcast.emit('userConnected', {user: (userList[userName] > 1 ? userName + " 的马甲": userName), userList: userList});
	//广播给全体客户端
	//io.sockets.emit('all users');
});
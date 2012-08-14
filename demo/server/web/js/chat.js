var Meeting = {
	maxMsg : 500,
	
	msgType : "txt",
	
	lastLiCss : "",

	init : function() {
		this.counter = $("#counter");
		this.content = $("#content");
		this.userList = $("#userList");
		this.msgText = $("#msg");
		this.msgCanvas = $("#msgCanvas");
		this.msgTypeTxt = $("#msgTypeTxt");
		this.msgTypeDraw = $("#msgTypeDraw");

		this._bind();
	},
	_bind : function() {
		this.msgTypeTxt.bind("change", function(){
			if (this.checked) {
				Meeting.showMsgText();
			} else {
				Meeting.showMsgCanvas();
			}
		});
		this.msgTypeDraw.bind("change", function(){
			if (this.checked) {
				Meeting.showMsgCanvas();
			} else {
				Meeting.showMsgText();
			}
		});
	},
	showMsgText : function() {
		Meeting.msgType = "txt";
		Meeting.msgCanvas.hide();
		Meeting.msgText.show();
	},
	showMsgCanvas : function() {
		Meeting.msgType = "img";
		Meeting.msgText.hide();
		Meeting.msgCanvas.show();
	},
	
	showMsg : function(from, msgTitle, msg, msgType) {
		if (!msg || msg.length == 0) {
			return;
		}
		var result = ["<li class='", this.lastLiCss, " ", from, "'>",
		msgTitle, (msgType=="txt" ? this.filterMsg(msg) : "<image class='msgImg' src='" + msg + "'>"),
		"</li>"];

		this.content.append(result.join(''));
		if (this.content.children().length > this.maxMsg) {
			$(this.content.children()[0]).remove();
		}
		this.lastLiCss = (this.lastLiCss.length>0 ? "" : "shadow");
		this.content.parent().scrollTop(this.content.get(0).scrollHeight)
	},
	sendMsg : function() {
		var msg = this.getMyMsg();
		if (msg.length > 0) {
			this.showMsg("me", "我说: ", this.getMyMsg(), this.msgType );
			socket.emit('sendMsg', { msgType:this.msgType, msg: this.getMyMsg() });
			this.msgText.get(0).value = "";
			DrawBoard.clearCanvas();
		}		
	},
	getMyMsg : function() {
		if (this.msgType=="txt") {
			return this.msgText.get(0).value;
		} else {
			var m = DrawBoard.board.get(0).toDataURL();
			if (m !== DrawBoard.emptyMsg) {
				return m;
			}
		}
	}, 
	showUserList : function(userList) {
		var u = [];
		for ( var ip in userList ) {
			var num = userList[ip];
			u.push("<li>");
			u.push(ip);
			if (num > 1) {
				u.push(" + " + (num-1) + " 个马甲");
			}
			u.push("</li>");
		}
		this.userList.empty().append(u.join(''));
	},
	filterMsg : function(msg) {

		return msg.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
					.replace(/((http|https):[^ ]*)/ig, "<a target='_blank' href='$1'>$1</a>");
	}
}


//显示桌面通知
var Notice = {
	support : true,
	permission : false,
	sendFlag : true,
	isOpening : false,
	init : function() {
		this.bind();
	},
	bind : function() {
		$(document).bind('click', this.checkPermission);
		$(window).bind('blur', function (e) {
			Notice.sendFlag = true;
		});
		$(window).bind('focus', function (e) {
			Notice.sendFlag = false;
		});
	},
	unbind : function() {
		$(document).unbind('click', this.checkPermission);
	},
	checkPermission : function (e) {
		if (Notice.support && !Notice.permission) {
			Notice.showDesktopNotice(true);
		}
	},
	showDesktopNotice : function (checkFlag){
		var myNotifications = window.webkitNotifications; 
		//判断浏览器是否支持webkitNotifications
		if(myNotifications){
			//判断是否获得了权限
			if(this.permission || myNotifications.checkPermission() == 0){
				this.permission = true;
				if (!!checkFlag || !this.sendFlag) return;
				//实例化通知对象
				var notification = myNotifications.createNotification('/img/notify.png','通知','秘密会所有新消息啦！');
				notification.ondisplay = function(){
					//显示通知前触发事件
				};
				notification.onclose = function(){
					//关闭通知后触发事件
					Notice.isOpening = false;
				};
				notification.show();//显示通知
				this.isOpening = true;
			}else{
				myNotifications.requestPermission();//获取用户权限
			}
		}else{
			this.support = false;
		}
	}
}
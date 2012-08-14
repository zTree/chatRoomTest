exports.Log = {
	DEFAULT: {name: "default", color:"\u001b[0m"},
	INFO: {name: "info", color:"\u001b[36m"},
	DEBUG: {name: "debug", color:"\u001b[43m"},
	ERROR: {name: "error", color:"\u001b[91m"},
	WARNING: {name: "warning", color:"\u001b[93m"},
	POS: {name: "", color:"\u001b[90m"},

	serverPath : "",
	levelList : ["error", "warning", "info", "debug"],
	level : 3,

	info : function(msg) {
		if (this.level < 2) return;
		this._log(this.INFO, msg);
	},
	debug : function(msg) {
		if (this.level < 3) return;
		this._log(this.DEBUG, msg);
	},
	error : function (msg) {
		if (this.level < 0) return;
		this._log(this.ERROR, msg);
	},
	warning: function (msg) {
		if (this.level < 1) return;
		this._log(this.WARNING, msg);
	},
	_log : function(type, msg) {
		var r = [this.getTime(), " [", type.color, type.name, this.DEFAULT.color, "] ", msg, "  -- ", this.POS.color, this.getPos(), this.DEFAULT.color];
		console.log(r.join(""));
	},

	format : function(num) {
		var s = num + "";
		return s.length > 1 ? s : ("0" + s);
	},

	getTime : function () {
		var t = new Date();
		return [t.getFullYear(), '-', this.format(t.getMonth() + 1) , '-', this.format(t.getDate()), ' ',
			this.format(t.getHours()), ':', this.format(t.getMinutes()), ':', this.format(t.getSeconds())].join('');
	},

	getPos : function () {
		try {
			throw new Error();
		} catch(e) {
			var cwd = process.cwd() + "/",
			eStack = e.stack.split("\n")[4];
			var pos = eStack.indexOf("(") > -1 ? eStack.split("(")[1].split(")")[0] : eStack.replace(/[ ]*at /, "");
			var realPath = pos.replace(cwd,"");
			realPath = this.serverPath.length > 0 ? realPath.replace(this.serverPath, "") : realPath;
			return realPath;
		}
	}
};

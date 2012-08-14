var DrawBoard = {
	
	init: function(options) {
		this.board = $("#" + options.userCanvas);
		this.pen = $("#" + options.pen);
		this.penRange = $("#" + options.penRange);
		this.color = $("#" + options.color);
		this.clearBtn = $("#" + options.clearBtn);
		this.backBtn = $("#" + options.backBtn);
		this.typePen = $("#" + options.typePen);
		this.context = this.board.get(0).getContext("2d");
		this.emptyMsg = DrawBoard.board.get(0).toDataURL();
		this.initPen();
		this._bind();
	},
	initPen : function() {
		var pen = DrawBoard.pen, penRange = DrawBoard.penRange.get(0).value,
		left = (21 - penRange)/2;
		pen.css({
			left:left, top:left, width:penRange + "px", height:penRange + "px",
			"-moz-border-radius": penRange/2 + "px",
			"-khtml-border-radius": penRange/2 + "px",
			"-webkit-border-radius": penRange/2 + "px",
			"border-radius": penRange/2 + "px"
		});
	},
	_bind: function() {
		this.board.bind("mousedown", this.drawStart)
		.bind("mouseup", this.drawEnd);
		this.penRange.bind("change", this.initPen);
		this.clearBtn.bind("click", this.clearCanvas);
		this.backBtn.bind("click", this.backCanvas);
	},
	drawStart: function(e) {
		var cont = DrawBoard.context, x = e.offsetX, y = e.offsetY;
		DrawBoard.curColor = DrawBoard.typePen.get(0).checked ? DrawBoard.color.get(0).value : "#FFFFFF";
		cont.save();
		cont.beginPath();
		cont.moveTo(x, y);

		DrawBoard.board.bind("mousemove", DrawBoard.drawMove);
		e.preventDefault();
		
	},
	drawMove: function(e) {
		var cont = DrawBoard.context, x = e.offsetX, y = e.offsetY;
		cont.lineTo(x, y);

		cont.lineWidth = DrawBoard.penRange.get(0).value;
		//cont.lineCap = "square"; // butt round
		cont.lineJoin = "round";
		cont.strokeStyle = DrawBoard.curColor;
		cont.stroke();
	},
	drawEnd: function(e) {
		var cont = DrawBoard.context;
		cont.closePath();		
		DrawBoard.board.unbind("mousemove", DrawBoard.drawMove);
	},
	clearCanvas: function(e) {
		DrawBoard.context.clearRect( 0, 0, DrawBoard.board.attr("width"), DrawBoard.board.attr("height") );
		DrawBoard.drawEnd();
	},
	backCanvas: function(e) {
		DrawBoard.context.restore();
	}
}
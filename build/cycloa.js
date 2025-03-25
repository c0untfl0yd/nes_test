"use strict";

/**
 * cycloa名前空間本体
 * @namespace
 * @type {Object}
 */
var cycloa = {};
/**
 * エラークラスの名前空間
 * @type {Object}
 * @namespace
 */
cycloa.err = {};
/**
 * ユーティリティの名前空間
 * @type {Object}
 */
cycloa.util = {};
cycloa.debug = false;

cycloa.NesPalette = new Uint32Array([
		0x787878, 0x2000B0, 0x2800B8, 0x6010A0, 0x982078, 0xB01030, 0xA03000, 0x784000,
		0x485800, 0x386800, 0x386C00, 0x306040, 0x305080, 0x000000, 0x000000, 0x000000,
		0xB0B0B0, 0x4060F8, 0x4040FF, 0x9040F0, 0xD840C0, 0xD84060, 0xE05000, 0xC07000,
		0x888800, 0x50A000, 0x48A810, 0x48A068, 0x4090C0, 0x000000, 0x000000, 0x000000,
		0xFFFFFF, 0x60A0FF, 0x5080FF, 0xA070FF, 0xF060FF, 0xFF60B0, 0xFF7830, 0xFFA000,
		0xE8D020, 0x98E800, 0x70F040, 0x70E090, 0x60D0E0, 0x787878, 0x000000, 0x000000,
		0xFFFFFF, 0x90D0FF, 0xA0B8FF, 0xC0B0FF, 0xE0B0FF, 0xFFB8E8, 0xFFC8B8, 0xFFD8A0,
		0xFFF090, 0xC8F080, 0xA0F0A0, 0xA0FFC8, 0xA0FFF0, 0xA0A0A0, 0x000000, 0x000000
]);


"use strict";
/**
 * 例外のベースクラスです
 * @param {string} name 例外クラス名
 * @param {string} message メッセージ
 * @const
 * @constructor
 */
cycloa.err.Exception = function (name, message) {
	/**
	 * 例外のメッセージのインスタンス
	 * @type {string}
	 * @const
	 * @private
	 */
	/**
	 * @const
	 * @type {string}
	 */
	this.name = name;
	this.message = "["+name.toString()+"] "+message;
};
cycloa.err.Exception.prototype.toString = function(){
	return this.message;
};
/**
 * エミュレータのコアで発生した例外です
 * @param {string} message
 * @constructor
 * @extends cycloa.err.Exception
 */
cycloa.err.CoreException = function (message) {
	cycloa.err.Exception.call(this, "CoreException", message);
};
cycloa.err.CoreException.prototype = {
	__proto__ : cycloa.err.Exception.prototype
};
/**
 * 実装するべきメソッドを実装してない例外です
 * @param {string} message
 * @constructor
 * @extends cycloa.err.Exception
 */
cycloa.err.NotImplementedException = function (message) {
	cycloa.err.Exception.call(this, "NotImplementedException", message);
};
cycloa.err.NotImplementedException.prototype = {
	__proto__: cycloa.err.Exception.prototype
};
/**
 * サポートしてない事を示す例外です
 * @param {string} message
 * @constructor
 */
cycloa.err.NotSupportedException = function ( message ) {
	cycloa.err.Exception.call(this, "NotSupportedException", message);
};
cycloa.err.NotSupportedException.prototype = {
	__proto__: cycloa.err.Exception.prototype
};


/**
 * @param {number} num
 * @param {number} [len = 8]
 * @return {string}
 */
cycloa.util.formatHex = function(num, len){
	len = len || 8;
	return ("0000" + num.toString(16).toUpperCase()).slice(-(len>>2));
};
"use strict";

/**
 * @constructor
 */
cycloa.Tracer = function (machine) {
	this.m = machine;
	/**
	 * 逆アセンブラ用の命令
	 * @type {Uint8Array}
	 * @private
	 */
	this.code_ = new Uint8Array(3 /*MAX_INST_LENGTH*/);
	/**
	 * 命令のコードをどれくらい読んだかを管理するインデックス
	 * @type {number}
	 * @private
	 */
	this.code_idx_ = 0;
	/**
	 *
	 * @type {*}
	 * @private
	 */
	this.addr_ = undefined;
	this.addr_repr_ = undefined;
	this.addr_resolved_repr_ = undefined;
	/**
	 */
	this.decode = function () {
		var inst_repr = this[this.opcode_ = this.m.read(this.m.PC)]();
		var inst = "$" + cycloa.util.formatHex(this.m.PC, 16) + ":";
		for (var i = 0, max = 3; i < max; ++i) {
			inst += i < this.code_idx_ ? cycloa.util.formatHex(this.code_[i]) + " " : "   ";
		}
		inst += " " + inst_repr;
		var regstr = "";
		regstr += "A: " + cycloa.util.formatHex(this.m.A, 8);
		regstr += " X: " + cycloa.util.formatHex(this.m.X, 8);
		regstr += " Y: " + cycloa.util.formatHex(this.m.Y, 8);
		regstr += " S: " + cycloa.util.formatHex(this.m.SP, 8);
		regstr += " P:";
		regstr += (this.m.P & 0x80) ? 'N' : 'n';
		regstr += (this.m.P & 0x40) ? 'V' : 'v';
		regstr += (this.m.P & 0x20) ? 'U' : 'u';
		regstr += (this.m.P & 0x10) ? 'B' : 'b';
		regstr += (this.m.P & 0x08) ? 'D' : 'd';
		regstr += (this.m.P & 0x04) ? 'I' : 'i';
		regstr += (this.m.P & 0x02) ? 'Z' : 'z';
		regstr += (this.m.P & 0x01) ? 'C' : 'c';
		return (inst + "                                             ").slice(0, 43) + regstr;
	};
	this.readCode_ = function (size) {
		for (var i = 0; i < size; ++i) {
			this.code_[i] = this.m.read(this.m.PC + i);
		}
		this.code_idx_ = size;
	};
	this.formatResolvedAddr_ = function () {
		return " = #$" + cycloa.util.formatHex(this.m.read(this.addr_));
	};
	this.addrNone = function(){
		this.readCode_(1);
		this.addr_repr_ = "";
		this.addr_resolved_repr_ = "";
	};
	this.addrImmediate = function () {
		this.readCode_(2);
		this.addr_ = this.m.PC + 1;
		this.addr_repr_ = "#$" + cycloa.util.formatHex(this.m.read(this.m.PC + 1));
		this.addr_resolved_repr_ = "";
	};
	this.addrZeropage = function () {
		this.readCode_(2);
		this.addr_ = this.m.read(this.m.PC + 1);
		this.addr_repr_ = "$" + cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrZeropageX = function () {
		this.readCode_(2);
		var base = this.m.read(this.m.PC + 1);
		this.addr_ = (base + this.m.X) & 0xff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base) + ",X @ $" + cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrZeropageY = function () {
		this.readCode_(2);
		var base = this.m.read(this.m.PC + 1);
		this.addr_ = (base + this.m.Y) & 0xff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base) + ",Y @ $" + cycloa.util.formatHex(this.addr_);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrAbsolute = function () {
		this.readCode_(3);
		this.addr_ = this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8);
		this.addr_repr_ = "$" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrAbsoluteX = function () {
		this.readCode_(3);
		var base = (this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8));
		this.addr_ = (base + this.m.X) & 0xffff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base, 16) + ",X @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrAbsoluteY = function () {
		this.readCode_(3);
		var base = (this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8));
		this.addr_ = (base + this.m.Y) & 0xffff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(base, 16) + ",Y @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrIndirect = function () { // used only in JMP
		this.readCode_(3);
		/** @const
		 *  @type {number} */
		var base = this.m.read(this.m.PC + 1) | (this.m.read(this.m.PC + 2) << 8);
		this.addr_ = this.m.read(base) | (this.m.read((base & 0xff00) | ((base + 1) & 0x00ff)) << 8); //bug of NES
		this.addr_repr_ = "($" + cycloa.util.formatHex(base, 16) + ") @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrIndirectX = function () {
		this.readCode_(2);
		/** @const
		 *  @type {number} */
		var base = (this.m.read(this.m.PC + 1) + this.m.X) & 0xff;
		this.addr_ = this.m.read(base) | (this.m.read((base + 1) & 0xff) << 8);
		this.addr_repr_ = "($" + cycloa.util.formatHex(base) + ",X) @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrIndirectY = function () {
		this.readCode_(2);
		/** @const
		 *  @type {number} */
		var base = this.m.read(this.m.PC + 1);
		this.addr_ = ((this.m.read(base) | (this.m.read((base + 1) & 0xff) << 8)) + this.m.Y);
		this.addr_repr_ = "($" + cycloa.util.formatHex(base) + "),Y @ $" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = this.formatResolvedAddr_();
	};
	this.addrRelative = function () {
		this.readCode_(2);
		/** @const
		 *  @type {number} */
		var offset = this.m.read(this.m.PC + 1);
		this.addr_ = ((offset >= 128 ? (offset - 256) : offset) + this.m.PC + 2) & 0xffff;
		this.addr_repr_ = "$" + cycloa.util.formatHex(this.addr_, 16);
		this.addr_resolved_repr_ = "";
	};
	this.LDA = function () {
		return "LDA " + this.addr_repr_ + this.addr_resolved_repr_;
	};
	this.LDY = function () {
		return "LDY " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.LDX = function () {
		return "LDX " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.STA = function () {
		return "STA " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.STX = function () {
		return "STX " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.STY = function () {
		return "STY " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.TXA_ = function () {
		return "TXA";
	};
	this.TYA_ = function () {
		return "TYA";
	};
	this.TXS_ = function () {
		return "TXS";
	};
	this.TAY_ = function () {
		return "TAY";
	};
	this.TAX_ = function () {
		return "TAX";
	};
	this.TSX_ = function () {
		return "TSX";
	};
	this.PHP_ = function () {
		return "PHP";
	};
	this.PLP_ = function () {
		return "PLP";
	};
	this.PHA_ = function () {
		return "PHA";
	};
	this.PLA_ = function () {
		return "PLA";
	};
	this.ADC = function () {
		return "ADC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.SBC = function () {
		return "SBC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CPX = function () {
		return "CPX " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CPY = function () {
		return "CPY " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CMP = function () {
		return "CMP " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.AND = function () {
		return "AND " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.EOR = function () {
		return "EOR " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ORA = function () {
		return "ORA " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.BIT = function () {
		return "BIT " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ASL_ = function () {
		return "ASL $registerA";
	};
	this.ASL = function () {
		return "ASL " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.LSR_ = function () {
		return "LSR $registerA";
	};
	this.LSR = function () {
		return "LSR " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ROL_ = function () {
		return "ROL $registerA";
	};
	this.ROL = function () {
		return "ROL " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.ROR_ = function () {
		return "ROR $registerA";
	};
	this.ROR = function () {
		return "ROR " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.INX_ = function () {
		return "INX";
	};
	this.INY_ = function () {
		return "INY";
	};
	this.INC = function () {
		return "INC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.DEX_ = function () {
		return "DEX";
	};
	this.DEY_ = function () {
		return "DEY";
	};
	this.DEC = function () {
		return "DEC " + this.addr_repr_ + this.addr_resolved_repr_
	};
	this.CLC_ = function () {
		return "CLC";
	};
	this.CLI_ = function () {
		return "CLI";
	};
	this.CLV_ = function () {
		return "CLV";
	};
	this.CLD_ = function () {
		return "CLD";
	};
	this.SEC_ = function () {
		return "SEC";
	};
	this.SEI_ = function () {
		return "SEI";
	};
	this.SED_ = function () {
		return "SED";
	};
	this.NOP_ = function () {
		return "NOP";
	};
	this.BRK_ = function () {
		return "BRK";
	};
	this.BCC = function () {
		return "BCC " + this.addr_repr_;
	};
	this.BCS = function () {
		return "BCS " + this.addr_repr_;
	};
	this.BEQ = function () {
		return "BEQ " + this.addr_repr_;
	};
	this.BNE = function () {
		return "BNE " + this.addr_repr_;
	};
	this.BVC = function () {
		return "BVC " + this.addr_repr_;
	};
	this.BVS = function () {
		return "BVS " + this.addr_repr_;
	};
	this.BPL = function () {
		return "BPL " + this.addr_repr_;
	};
	this.BMI = function () {
		return "BMI " + this.addr_repr_;
	};
	this.JSR = function () {
		return "JSR " + this.addr_repr_;
	};
	this.JMP = function () {
		return "JMP " + this.addr_repr_;
	};
	this.RTI_ = function () {
		return "RTI";
	};
	this.RTS_ = function () {
		return "RTS";
	};
	this.onInvalidOpcode = function () {
		return "UNDEFINED";
	};
	this[0x0] = function() { return this.BRK_(this.addrNone()); }; /* 0x0, BRK None */
	this[0x1] = function() { return this.ORA(this.addrIndirectX()); }; /* 0x1, ORA IndirectX */
	this[0x2] = function() { return this.onInvalidOpcode(); };
	this[0x3] = function() { return this.onInvalidOpcode(); };
	this[0x4] = function() { return this.onInvalidOpcode(); };
	this[0x5] = function() { return this.ORA(this.addrZeropage()); }; /* 0x5, ORA Zeropage */
	this[0x6] = function() { return this.ASL(this.addrZeropage()); }; /* 0x6, ASL Zeropage */
	this[0x7] = function() { return this.onInvalidOpcode(); };
	this[0x8] = function() { return this.PHP_(this.addrNone()); }; /* 0x8, PHP None */
	this[0x9] = function() { return this.ORA(this.addrImmediate()); }; /* 0x9, ORA Immediate */
	this[0xa] = function() { return this.ASL_(this.addrNone()); }; /* 0xa, ASL None */
	this[0xb] = function() { return this.onInvalidOpcode(); };
	this[0xc] = function() { return this.onInvalidOpcode(); };
	this[0xd] = function() { return this.ORA(this.addrAbsolute()); }; /* 0xd, ORA Absolute */
	this[0xe] = function() { return this.ASL(this.addrAbsolute()); }; /* 0xe, ASL Absolute */
	this[0xf] = function() { return this.onInvalidOpcode(); };
	this[0x10] = function() { return this.BPL(this.addrRelative()); }; /* 0x10, BPL Relative */
	this[0x11] = function() { return this.ORA(this.addrIndirectY()); }; /* 0x11, ORA IndirectY */
	this[0x12] = function() { return this.onInvalidOpcode(); };
	this[0x13] = function() { return this.onInvalidOpcode(); };
	this[0x14] = function() { return this.onInvalidOpcode(); };
	this[0x15] = function() { return this.ORA(this.addrZeropageX()); }; /* 0x15, ORA ZeropageX */
	this[0x16] = function() { return this.ASL(this.addrZeropageX()); }; /* 0x16, ASL ZeropageX */
	this[0x17] = function() { return this.onInvalidOpcode(); };
	this[0x18] = function() { return this.CLC_(this.addrNone()); }; /* 0x18, CLC None */
	this[0x19] = function() { return this.ORA(this.addrAbsoluteY()); }; /* 0x19, ORA AbsoluteY */
	this[0x1a] = function() { return this.onInvalidOpcode(); };
	this[0x1b] = function() { return this.onInvalidOpcode(); };
	this[0x1c] = function() { return this.onInvalidOpcode(); };
	this[0x1d] = function() { return this.ORA(this.addrAbsoluteX()); }; /* 0x1d, ORA AbsoluteX */
	this[0x1e] = function() { return this.ASL(this.addrAbsoluteX()); }; /* 0x1e, ASL AbsoluteX */
	this[0x1f] = function() { return this.onInvalidOpcode(); };
	this[0x20] = function() { return this.JSR(this.addrAbsolute()); }; /* 0x20, JSR Absolute */
	this[0x21] = function() { return this.AND(this.addrIndirectX()); }; /* 0x21, AND IndirectX */
	this[0x22] = function() { return this.onInvalidOpcode(); };
	this[0x23] = function() { return this.onInvalidOpcode(); };
	this[0x24] = function() { return this.BIT(this.addrZeropage()); }; /* 0x24, BIT Zeropage */
	this[0x25] = function() { return this.AND(this.addrZeropage()); }; /* 0x25, AND Zeropage */
	this[0x26] = function() { return this.ROL(this.addrZeropage()); }; /* 0x26, ROL Zeropage */
	this[0x27] = function() { return this.onInvalidOpcode(); };
	this[0x28] = function() { return this.PLP_(this.addrNone()); }; /* 0x28, PLP None */
	this[0x29] = function() { return this.AND(this.addrImmediate()); }; /* 0x29, AND Immediate */
	this[0x2a] = function() { return this.ROL_(this.addrNone()); }; /* 0x2a, ROL None */
	this[0x2b] = function() { return this.onInvalidOpcode(); };
	this[0x2c] = function() { return this.BIT(this.addrAbsolute()); }; /* 0x2c, BIT Absolute */
	this[0x2d] = function() { return this.AND(this.addrAbsolute()); }; /* 0x2d, AND Absolute */
	this[0x2e] = function() { return this.ROL(this.addrAbsolute()); }; /* 0x2e, ROL Absolute */
	this[0x2f] = function() { return this.onInvalidOpcode(); };
	this[0x30] = function() { return this.BMI(this.addrRelative()); }; /* 0x30, BMI Relative */
	this[0x31] = function() { return this.AND(this.addrIndirectY()); }; /* 0x31, AND IndirectY */
	this[0x32] = function() { return this.onInvalidOpcode(); };
	this[0x33] = function() { return this.onInvalidOpcode(); };
	this[0x34] = function() { return this.onInvalidOpcode(); };
	this[0x35] = function() { return this.AND(this.addrZeropageX()); }; /* 0x35, AND ZeropageX */
	this[0x36] = function() { return this.ROL(this.addrZeropageX()); }; /* 0x36, ROL ZeropageX */
	this[0x37] = function() { return this.onInvalidOpcode(); };
	this[0x38] = function() { return this.SEC_(this.addrNone()); }; /* 0x38, SEC None */
	this[0x39] = function() { return this.AND(this.addrAbsoluteY()); }; /* 0x39, AND AbsoluteY */
	this[0x3a] = function() { return this.onInvalidOpcode(); };
	this[0x3b] = function() { return this.onInvalidOpcode(); };
	this[0x3c] = function() { return this.onInvalidOpcode(); };
	this[0x3d] = function() { return this.AND(this.addrAbsoluteX()); }; /* 0x3d, AND AbsoluteX */
	this[0x3e] = function() { return this.ROL(this.addrAbsoluteX()); }; /* 0x3e, ROL AbsoluteX */
	this[0x3f] = function() { return this.onInvalidOpcode(); };
	this[0x40] = function() { return this.RTI_(this.addrNone()); }; /* 0x40, RTI None */
	this[0x41] = function() { return this.EOR(this.addrIndirectX()); }; /* 0x41, EOR IndirectX */
	this[0x42] = function() { return this.onInvalidOpcode(); };
	this[0x43] = function() { return this.onInvalidOpcode(); };
	this[0x44] = function() { return this.onInvalidOpcode(); };
	this[0x45] = function() { return this.EOR(this.addrZeropage()); }; /* 0x45, EOR Zeropage */
	this[0x46] = function() { return this.LSR(this.addrZeropage()); }; /* 0x46, LSR Zeropage */
	this[0x47] = function() { return this.onInvalidOpcode(); };
	this[0x48] = function() { return this.PHA_(this.addrNone()); }; /* 0x48, PHA None */
	this[0x49] = function() { return this.EOR(this.addrImmediate()); }; /* 0x49, EOR Immediate */
	this[0x4a] = function() { return this.LSR_(this.addrNone()); }; /* 0x4a, LSR None */
	this[0x4b] = function() { return this.onInvalidOpcode(); };
	this[0x4c] = function() { return this.JMP(this.addrAbsolute()); }; /* 0x4c, JMP Absolute */
	this[0x4d] = function() { return this.EOR(this.addrAbsolute()); }; /* 0x4d, EOR Absolute */
	this[0x4e] = function() { return this.LSR(this.addrAbsolute()); }; /* 0x4e, LSR Absolute */
	this[0x4f] = function() { return this.onInvalidOpcode(); };
	this[0x50] = function() { return this.BVC(this.addrRelative()); }; /* 0x50, BVC Relative */
	this[0x51] = function() { return this.EOR(this.addrIndirectY()); }; /* 0x51, EOR IndirectY */
	this[0x52] = function() { return this.onInvalidOpcode(); };
	this[0x53] = function() { return this.onInvalidOpcode(); };
	this[0x54] = function() { return this.onInvalidOpcode(); };
	this[0x55] = function() { return this.EOR(this.addrZeropageX()); }; /* 0x55, EOR ZeropageX */
	this[0x56] = function() { return this.LSR(this.addrZeropageX()); }; /* 0x56, LSR ZeropageX */
	this[0x57] = function() { return this.onInvalidOpcode(); };
	this[0x58] = function() { return this.CLI_(this.addrNone()); }; /* 0x58, CLI None */
	this[0x59] = function() { return this.EOR(this.addrAbsoluteY()); }; /* 0x59, EOR AbsoluteY */
	this[0x5a] = function() { return this.onInvalidOpcode(); };
	this[0x5b] = function() { return this.onInvalidOpcode(); };
	this[0x5c] = function() { return this.onInvalidOpcode(); };
	this[0x5d] = function() { return this.EOR(this.addrAbsoluteX()); }; /* 0x5d, EOR AbsoluteX */
	this[0x5e] = function() { return this.LSR(this.addrAbsoluteX()); }; /* 0x5e, LSR AbsoluteX */
	this[0x5f] = function() { return this.onInvalidOpcode(); };
	this[0x60] = function() { return this.RTS_(this.addrNone()); }; /* 0x60, RTS None */
	this[0x61] = function() { return this.ADC(this.addrIndirectX()); }; /* 0x61, ADC IndirectX */
	this[0x62] = function() { return this.onInvalidOpcode(); };
	this[0x63] = function() { return this.onInvalidOpcode(); };
	this[0x64] = function() { return this.onInvalidOpcode(); };
	this[0x65] = function() { return this.ADC(this.addrZeropage()); }; /* 0x65, ADC Zeropage */
	this[0x66] = function() { return this.ROR(this.addrZeropage()); }; /* 0x66, ROR Zeropage */
	this[0x67] = function() { return this.onInvalidOpcode(); };
	this[0x68] = function() { return this.PLA_(this.addrNone()); }; /* 0x68, PLA None */
	this[0x69] = function() { return this.ADC(this.addrImmediate()); }; /* 0x69, ADC Immediate */
	this[0x6a] = function() { return this.ROR_(this.addrNone()); }; /* 0x6a, ROR None */
	this[0x6b] = function() { return this.onInvalidOpcode(); };
	this[0x6c] = function() { return this.JMP(this.addrIndirect()); }; /* 0x6c, JMP Indirect */
	this[0x6d] = function() { return this.ADC(this.addrAbsolute()); }; /* 0x6d, ADC Absolute */
	this[0x6e] = function() { return this.ROR(this.addrAbsolute()); }; /* 0x6e, ROR Absolute */
	this[0x6f] = function() { return this.onInvalidOpcode(); };
	this[0x70] = function() { return this.BVS(this.addrRelative()); }; /* 0x70, BVS Relative */
	this[0x71] = function() { return this.ADC(this.addrIndirectY()); }; /* 0x71, ADC IndirectY */
	this[0x72] = function() { return this.onInvalidOpcode(); };
	this[0x73] = function() { return this.onInvalidOpcode(); };
	this[0x74] = function() { return this.onInvalidOpcode(); };
	this[0x75] = function() { return this.ADC(this.addrZeropageX()); }; /* 0x75, ADC ZeropageX */
	this[0x76] = function() { return this.ROR(this.addrZeropageX()); }; /* 0x76, ROR ZeropageX */
	this[0x77] = function() { return this.onInvalidOpcode(); };
	this[0x78] = function() { return this.SEI_(this.addrNone()); }; /* 0x78, SEI None */
	this[0x79] = function() { return this.ADC(this.addrAbsoluteY()); }; /* 0x79, ADC AbsoluteY */
	this[0x7a] = function() { return this.onInvalidOpcode(); };
	this[0x7b] = function() { return this.onInvalidOpcode(); };
	this[0x7c] = function() { return this.onInvalidOpcode(); };
	this[0x7d] = function() { return this.ADC(this.addrAbsoluteX()); }; /* 0x7d, ADC AbsoluteX */
	this[0x7e] = function() { return this.ROR(this.addrAbsoluteX()); }; /* 0x7e, ROR AbsoluteX */
	this[0x7f] = function() { return this.onInvalidOpcode(); };
	this[0x80] = function() { return this.onInvalidOpcode(); };
	this[0x81] = function() { return this.STA(this.addrIndirectX()); }; /* 0x81, STA IndirectX */
	this[0x82] = function() { return this.onInvalidOpcode(); };
	this[0x83] = function() { return this.onInvalidOpcode(); };
	this[0x84] = function() { return this.STY(this.addrZeropage()); }; /* 0x84, STY Zeropage */
	this[0x85] = function() { return this.STA(this.addrZeropage()); }; /* 0x85, STA Zeropage */
	this[0x86] = function() { return this.STX(this.addrZeropage()); }; /* 0x86, STX Zeropage */
	this[0x87] = function() { return this.onInvalidOpcode(); };
	this[0x88] = function() { return this.DEY_(this.addrNone()); }; /* 0x88, DEY None */
	this[0x89] = function() { return this.onInvalidOpcode(); };
	this[0x8a] = function() { return this.TXA_(this.addrNone()); }; /* 0x8a, TXA None */
	this[0x8b] = function() { return this.onInvalidOpcode(); };
	this[0x8c] = function() { return this.STY(this.addrAbsolute()); }; /* 0x8c, STY Absolute */
	this[0x8d] = function() { return this.STA(this.addrAbsolute()); }; /* 0x8d, STA Absolute */
	this[0x8e] = function() { return this.STX(this.addrAbsolute()); }; /* 0x8e, STX Absolute */
	this[0x8f] = function() { return this.onInvalidOpcode(); };
	this[0x90] = function() { return this.BCC(this.addrRelative()); }; /* 0x90, BCC Relative */
	this[0x91] = function() { return this.STA(this.addrIndirectY()); }; /* 0x91, STA IndirectY */
	this[0x92] = function() { return this.onInvalidOpcode(); };
	this[0x93] = function() { return this.onInvalidOpcode(); };
	this[0x94] = function() { return this.STY(this.addrZeropageX()); }; /* 0x94, STY ZeropageX */
	this[0x95] = function() { return this.STA(this.addrZeropageX()); }; /* 0x95, STA ZeropageX */
	this[0x96] = function() { return this.STX(this.addrZeropageY()); }; /* 0x96, STX ZeropageY */
	this[0x97] = function() { return this.onInvalidOpcode(); };
	this[0x98] = function() { return this.TYA_(this.addrNone()); }; /* 0x98, TYA None */
	this[0x99] = function() { return this.STA(this.addrAbsoluteY()); }; /* 0x99, STA AbsoluteY */
	this[0x9a] = function() { return this.TXS_(this.addrNone()); }; /* 0x9a, TXS None */
	this[0x9b] = function() { return this.onInvalidOpcode(); };
	this[0x9c] = function() { return this.onInvalidOpcode(); };
	this[0x9d] = function() { return this.STA(this.addrAbsoluteX()); }; /* 0x9d, STA AbsoluteX */
	this[0x9e] = function() { return this.onInvalidOpcode(); };
	this[0x9f] = function() { return this.onInvalidOpcode(); };
	this[0xa0] = function() { return this.LDY(this.addrImmediate()); }; /* 0xa0, LDY Immediate */
	this[0xa1] = function() { return this.LDA(this.addrIndirectX()); }; /* 0xa1, LDA IndirectX */
	this[0xa2] = function() { return this.LDX(this.addrImmediate()); }; /* 0xa2, LDX Immediate */
	this[0xa3] = function() { return this.onInvalidOpcode(); };
	this[0xa4] = function() { return this.LDY(this.addrZeropage()); }; /* 0xa4, LDY Zeropage */
	this[0xa5] = function() { return this.LDA(this.addrZeropage()); }; /* 0xa5, LDA Zeropage */
	this[0xa6] = function() { return this.LDX(this.addrZeropage()); }; /* 0xa6, LDX Zeropage */
	this[0xa7] = function() { return this.onInvalidOpcode(); };
	this[0xa8] = function() { return this.TAY_(this.addrNone()); }; /* 0xa8, TAY None */
	this[0xa9] = function() { return this.LDA(this.addrImmediate()); }; /* 0xa9, LDA Immediate */
	this[0xaa] = function() { return this.TAX_(this.addrNone()); }; /* 0xaa, TAX None */
	this[0xab] = function() { return this.onInvalidOpcode(); };
	this[0xac] = function() { return this.LDY(this.addrAbsolute()); }; /* 0xac, LDY Absolute */
	this[0xad] = function() { return this.LDA(this.addrAbsolute()); }; /* 0xad, LDA Absolute */
	this[0xae] = function() { return this.LDX(this.addrAbsolute()); }; /* 0xae, LDX Absolute */
	this[0xaf] = function() { return this.onInvalidOpcode(); };
	this[0xb0] = function() { return this.BCS(this.addrRelative()); }; /* 0xb0, BCS Relative */
	this[0xb1] = function() { return this.LDA(this.addrIndirectY()); }; /* 0xb1, LDA IndirectY */
	this[0xb2] = function() { return this.onInvalidOpcode(); };
	this[0xb3] = function() { return this.onInvalidOpcode(); };
	this[0xb4] = function() { return this.LDY(this.addrZeropageX()); }; /* 0xb4, LDY ZeropageX */
	this[0xb5] = function() { return this.LDA(this.addrZeropageX()); }; /* 0xb5, LDA ZeropageX */
	this[0xb6] = function() { return this.LDX(this.addrZeropageY()); }; /* 0xb6, LDX ZeropageY */
	this[0xb7] = function() { return this.onInvalidOpcode(); };
	this[0xb8] = function() { return this.CLV_(this.addrNone()); }; /* 0xb8, CLV None */
	this[0xb9] = function() { return this.LDA(this.addrAbsoluteY()); }; /* 0xb9, LDA AbsoluteY */
	this[0xba] = function() { return this.TSX_(this.addrNone()); }; /* 0xba, TSX None */
	this[0xbb] = function() { return this.onInvalidOpcode(); };
	this[0xbc] = function() { return this.LDY(this.addrAbsoluteX()); }; /* 0xbc, LDY AbsoluteX */
	this[0xbd] = function() { return this.LDA(this.addrAbsoluteX()); }; /* 0xbd, LDA AbsoluteX */
	this[0xbe] = function() { return this.LDX(this.addrAbsoluteY()); }; /* 0xbe, LDX AbsoluteY */
	this[0xbf] = function() { return this.onInvalidOpcode(); };
	this[0xc0] = function() { return this.CPY(this.addrImmediate()); }; /* 0xc0, CPY Immediate */
	this[0xc1] = function() { return this.CMP(this.addrIndirectX()); }; /* 0xc1, CMP IndirectX */
	this[0xc2] = function() { return this.onInvalidOpcode(); };
	this[0xc3] = function() { return this.onInvalidOpcode(); };
	this[0xc4] = function() { return this.CPY(this.addrZeropage()); }; /* 0xc4, CPY Zeropage */
	this[0xc5] = function() { return this.CMP(this.addrZeropage()); }; /* 0xc5, CMP Zeropage */
	this[0xc6] = function() { return this.DEC(this.addrZeropage()); }; /* 0xc6, DEC Zeropage */
	this[0xc7] = function() { return this.onInvalidOpcode(); };
	this[0xc8] = function() { return this.INY_(this.addrNone()); }; /* 0xc8, INY None */
	this[0xc9] = function() { return this.CMP(this.addrImmediate()); }; /* 0xc9, CMP Immediate */
	this[0xca] = function() { return this.DEX_(this.addrNone()); }; /* 0xca, DEX None */
	this[0xcb] = function() { return this.onInvalidOpcode(); };
	this[0xcc] = function() { return this.CPY(this.addrAbsolute()); }; /* 0xcc, CPY Absolute */
	this[0xcd] = function() { return this.CMP(this.addrAbsolute()); }; /* 0xcd, CMP Absolute */
	this[0xce] = function() { return this.DEC(this.addrAbsolute()); }; /* 0xce, DEC Absolute */
	this[0xcf] = function() { return this.onInvalidOpcode(); };
	this[0xd0] = function() { return this.BNE(this.addrRelative()); }; /* 0xd0, BNE Relative */
	this[0xd1] = function() { return this.CMP(this.addrIndirectY()); }; /* 0xd1, CMP IndirectY */
	this[0xd2] = function() { return this.onInvalidOpcode(); };
	this[0xd3] = function() { return this.onInvalidOpcode(); };
	this[0xd4] = function() { return this.onInvalidOpcode(); };
	this[0xd5] = function() { return this.CMP(this.addrZeropageX()); }; /* 0xd5, CMP ZeropageX */
	this[0xd6] = function() { return this.DEC(this.addrZeropageX()); }; /* 0xd6, DEC ZeropageX */
	this[0xd7] = function() { return this.onInvalidOpcode(); };
	this[0xd8] = function() { return this.CLD_(this.addrNone()); }; /* 0xd8, CLD None */
	this[0xd9] = function() { return this.CMP(this.addrAbsoluteY()); }; /* 0xd9, CMP AbsoluteY */
	this[0xda] = function() { return this.onInvalidOpcode(); };
	this[0xdb] = function() { return this.onInvalidOpcode(); };
	this[0xdc] = function() { return this.onInvalidOpcode(); };
	this[0xdd] = function() { return this.CMP(this.addrAbsoluteX()); }; /* 0xdd, CMP AbsoluteX */
	this[0xde] = function() { return this.DEC(this.addrAbsoluteX()); }; /* 0xde, DEC AbsoluteX */
	this[0xdf] = function() { return this.onInvalidOpcode(); };
	this[0xe0] = function() { return this.CPX(this.addrImmediate()); }; /* 0xe0, CPX Immediate */
	this[0xe1] = function() { return this.SBC(this.addrIndirectX()); }; /* 0xe1, SBC IndirectX */
	this[0xe2] = function() { return this.onInvalidOpcode(); };
	this[0xe3] = function() { return this.onInvalidOpcode(); };
	this[0xe4] = function() { return this.CPX(this.addrZeropage()); }; /* 0xe4, CPX Zeropage */
	this[0xe5] = function() { return this.SBC(this.addrZeropage()); }; /* 0xe5, SBC Zeropage */
	this[0xe6] = function() { return this.INC(this.addrZeropage()); }; /* 0xe6, INC Zeropage */
	this[0xe7] = function() { return this.onInvalidOpcode(); };
	this[0xe8] = function() { return this.INX_(this.addrNone()); }; /* 0xe8, INX None */
	this[0xe9] = function() { return this.SBC(this.addrImmediate()); }; /* 0xe9, SBC Immediate */
	this[0xea] = function() { return this.NOP_(this.addrNone()); }; /* 0xea, NOP None */
	this[0xeb] = function() { return this.onInvalidOpcode(); };
	this[0xec] = function() { return this.CPX(this.addrAbsolute()); }; /* 0xec, CPX Absolute */
	this[0xed] = function() { return this.SBC(this.addrAbsolute()); }; /* 0xed, SBC Absolute */
	this[0xee] = function() { return this.INC(this.addrAbsolute()); }; /* 0xee, INC Absolute */
	this[0xef] = function() { return this.onInvalidOpcode(); };
	this[0xf0] = function() { return this.BEQ(this.addrRelative()); }; /* 0xf0, BEQ Relative */
	this[0xf1] = function() { return this.SBC(this.addrIndirectY()); }; /* 0xf1, SBC IndirectY */
	this[0xf2] = function() { return this.onInvalidOpcode(); };
	this[0xf3] = function() { return this.onInvalidOpcode(); };
	this[0xf4] = function() { return this.onInvalidOpcode(); };
	this[0xf5] = function() { return this.SBC(this.addrZeropageX()); }; /* 0xf5, SBC ZeropageX */
	this[0xf6] = function() { return this.INC(this.addrZeropageX()); }; /* 0xf6, INC ZeropageX */
	this[0xf7] = function() { return this.onInvalidOpcode(); };
	this[0xf8] = function() { return this.SED_(this.addrNone()); }; /* 0xf8, SED None */
	this[0xf9] = function() { return this.SBC(this.addrAbsoluteY()); }; /* 0xf9, SBC AbsoluteY */
	this[0xfa] = function() { return this.onInvalidOpcode(); };
	this[0xfb] = function() { return this.onInvalidOpcode(); };
	this[0xfc] = function() { return this.onInvalidOpcode(); };
	this[0xfd] = function() { return this.SBC(this.addrAbsoluteX()); }; /* 0xfd, SBC AbsoluteX */
	this[0xfe] = function() { return this.INC(this.addrAbsoluteX()); }; /* 0xfe, INC AbsoluteX */
	this[0xff] = function() { return this.onInvalidOpcode(); };
};


"use strict";

/**
 * @constructor
 * */
cycloa.AbstractAudioFairy = function(){
	this.enabled = false;//supported or not.
	this.data = undefined;//audio data buffer to fill
	this.dataLength = 0;//length of the buffer
	this.dataIndex = undefined;// the index of the buffer
};

//called when all data buffer has been filled.
cycloa.AbstractAudioFairy.prototype.onDataFilled = function(){
};

/**
 * @constructor
 * */
cycloa.AbstractVideoFairy = function(){
	this.dispatchRendering = function(/* Uint8Array */ nesBuffer, /* Uint8 */ paletteMask){}; //called on vsync
};

/**
 * @constructor
 * */
cycloa.AbstractPadFairy = function(){
};

cycloa.AbstractPadFairy.prototype.A=0;
cycloa.AbstractPadFairy.prototype.B=1;
cycloa.AbstractPadFairy.prototype.SELECT=2;
cycloa.AbstractPadFairy.prototype.START=3;
cycloa.AbstractPadFairy.prototype.UP=4;
cycloa.AbstractPadFairy.prototype.DOWN=5;
cycloa.AbstractPadFairy.prototype.LEFT=6;
cycloa.AbstractPadFairy.prototype.RIGHT=7;
cycloa.AbstractPadFairy.prototype.TOTAL=8;
cycloa.AbstractPadFairy.prototype.MASK_A=1;
cycloa.AbstractPadFairy.prototype.MASK_B=2;
cycloa.AbstractPadFairy.prototype.MASK_SELECT=4;
cycloa.AbstractPadFairy.prototype.MASK_START=8;
cycloa.AbstractPadFairy.prototype.MASK_UP=16;
cycloa.AbstractPadFairy.prototype.MASK_DOWN=32;
cycloa.AbstractPadFairy.prototype.MASK_LEFT=64;
cycloa.AbstractPadFairy.prototype.MASK_RIGHT=128;
cycloa.AbstractPadFairy.prototype.MASK_ALL=255;
cycloa.AbstractPadFairy.prototype.state = 0; //button state


/**
 * ファミコンエミュレータ本体を表すクラスです。
 * @constructor
 */
cycloa.VirtualMachine = function(videoFairy, audioFairy, pad1Fairy, pad2Fairy) {
this.tracer = new cycloa.Tracer(this);

/** @type {number} */
this.A = 0;
/** @type {number} */
this.X = 0;
/** @type {number} */
this.Y = 0;
/** @type {number} */
this.PC = 0;
/** @type {number} */
this.SP = 0;
/** @type {number} */
this.P = 0;
/**
 * @const
 * @type {Uint8Array}
 */
this.__cpu__ram = new Uint8Array(new ArrayBuffer(0x800));
this.__cpu__rom = new Array(32);

this.__cpu__ZNFlagCache = cycloa.VirtualMachine.ZNFlagCache;
this.__cpu__TransTable = cycloa.VirtualMachine.TransTable;



this.__video__videoFairy = videoFairy;

this.__video__isEven = false;
this.__video__nowY = 0;
this.__video__nowX = 0;
this.__video__spriteHitCnt = 0;
this.__video__executeNMIonVBlank = false;
this.__video__spriteHeight = 8;
this.__video__patternTableAddressBackground = 0;
this.__video__patternTableAddress8x8Sprites = 0;
this.__video__vramIncrementSize = 1;
this.__video__colorEmphasis = 0;
this.__video__spriteVisibility = false;
this.__video__backgroundVisibility = false;
this.__video__spriteClipping = false;
this.__video__backgroundClipping = false;
this.__video__paletteMask = 0;
this.__video__nowOnVBnank = false;
this.__video__sprite0Hit = false;
this.__video__lostSprites = false;
this.__video__vramBuffer = 0;
this.__video__spriteAddr = 0;
this.__video__vramAddrRegister = 0x0;
this.__video__vramAddrReloadRegister = 0;
this.__video__horizontalScrollBits = 0;
this.__video__scrollRegisterWritten = false;
this.__video__vramAddrRegisterWritten = false;
this.__video__screenBuffer = new ArrayBuffer(256 * 240);
this.__video__screenBuffer8 = new Uint8Array(this.__video__screenBuffer);
this.__video__screenBuffer32 = new Uint32Array(this.__video__screenBuffer);
this.__video__spRam = new Uint8Array(256);
this.__video__palette = new Uint8Array(9*4);
this.__video__spriteTable = new Array(8);
for(var i=0; i< 8; ++i){
	this.__video__spriteTable[i] = {};
}

this.__video__pattern = new Array(0x10);

this.__video__vramMirroring = new Array(4);
this.__video__internalVram = new Array(4);
for(var i=0;i<4;++i){
	this.__video__internalVram[i] = new Uint8Array(0x400);
}


this.__audio__audioFairy = audioFairy;

this.__audio__LengthCounterConst = cycloa.VirtualMachine.LengthCounterConst;


// __rectangle1__ do nothing


// __rectangle1__ do nothing


this.__triangle__waveForm = [
		  0x0,0x1,0x2,0x3,0x4,0x5,0x6,0x7,0x8,0x9,0xA,0xB,0xC,0xD,0xE,0xF,
		  0xF,0xE,0xD,0xC,0xB,0xA,0x9,0x8,0x7,0x6,0x5,0x4,0x3,0x2,0x1,0x0
];



this.__noize__FrequencyTable = [
		4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068 //NTSC
		//4, 7, 14, 30, 60, 88, 118, 148, 188, 236, 354, 472, 708,  944, 1890, 3778 //PAL
];

this.__digital__FrequencyTable = [
		428, 380, 340, 320, 286, 254, 226, 214, 190, 160, 142, 128, 106,  84,  72,  54 //NTSC
		//398, 354, 316, 298, 276, 236, 210, 198, 176, 148, 132, 118,  98,  78,  66,  50
];
this.__pad__pad1Fairy = pad1Fairy || new cycloa.AbstractPadFairy();
this.__pad__pad2Fairy = pad2Fairy || new cycloa.AbstractPadFairy();

this.__pad__pad1Idx = 0;
this.__pad__pad2Idx = 0;


this.__vm__reservedClockDelta = 0;
/** @type {boolean} */
this.NMI = false;
/** @type {boolean} */
this.IRQ = false;
};

/**
 * VMを１フレーム分実行する
 */
cycloa.VirtualMachine.prototype.run = function () {
	
/**
 * @type {number}
 */
var __cpu__ZNFlagCache = this.__cpu__ZNFlagCache; var __cpu__TransTable = this.__cpu__TransTable;var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;

	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;
	var __audio__audioFairy = this.__audio__audioFairy; var __audio__enabled = __audio__audioFairy.enabled; var __audio__data=__audio__audioFairy.data; var __audio__data__length = __audio__audioFairy.dataLength;
	var __vm__run = true;
	var __vm__clockDelta;
	var __vm__reservedClockDelta = this.__vm__reservedClockDelta;
	this.__vm__reservedClockDelta = 0;
	while(__vm__run) {
		__vm__clockDelta = __vm__reservedClockDelta; __vm__reservedClockDelta = 0;
		//console.log(this.tracer.decode());
		
this.P |= 32; //必ずセットしてあるらしい。プログラム側から無理にいじっちゃった時用


if(this.NMI){
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	//from http://nesdev.parodius.com/6502_cpu.txt
	__vm__clockDelta += (7);;
	this.P &= 239;
	 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.PC >> 8;	 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.PC;	 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.P;;
	this.P |= 4;
	//this.PC = (this.read(0xFFFA) | (this.read(0xFFFB) << 8));
	this.PC = (this.__cpu__rom[31][0x3FA]| (this.__cpu__rom[31][0x3FB] << 8));
	this.NMI = false;
}else if(this.IRQ){
	this.onIRQ();
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	//from http://nesdev.parodius.com/6502_cpu.txt
	if((this.P & 4) !== 4){
		__vm__clockDelta += (7);;
		this.P &= 239;
		 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.PC >> 8;		 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.PC;		 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.P;		this.P |= 4;
		//this.PC = (this.read(0xFFFE) | (this.read(0xFFFF) << 8));
		this.PC = (this.__cpu__rom[31][0x3FE] | (this.__cpu__rom[31][0x3FF] << 8));
	}
}

if(this.needStatusRewrite){
	this.P = this.newStatus;
	this.needStatusRewrite = false;
}


			/**
			 * @const
			 * @type {number}
			 */
			var __cpu__pc = this.PC;

var __cpu__opbyte;

switch((__cpu__pc & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__opbyte = __cpu__ram[__cpu__pc & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__opbyte = this.__video__readReg(__cpu__pc);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__pc === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__opbyte =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__pc === 0x4016){
			__cpu__opbyte = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__pc === 0x4017){
			__cpu__opbyte = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__pc.toString(16));
		}else{
			__cpu__opbyte = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__opbyte = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__opbyte = __cpu__rom[(__cpu__pc>>10) & 31][__cpu__pc & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__opbyte = __cpu__rom[(__cpu__pc>>10) & 31][__cpu__pc & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__opbyte = __cpu__rom[(__cpu__pc>>10) & 31][__cpu__pc & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__opbyte = __cpu__rom[(__cpu__pc>>10) & 31][__cpu__pc & 0x3ff];
		break;
	}
}
/**
 * @const
 * @type {number}
 */
var __cpu__inst = __cpu__TransTable[__cpu__opbyte];
// http://www.llx.com/~nparker/a2/opcodes.html
switch( __cpu__inst & 15 ){
		case 0: { /* Immediate */
			
			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__pc+1);
			
			this.PC = __cpu__pc + 2;

		break;
	}
		case 1: { /* Zeropage */
			
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			var __cpu__addr;
			
switch((__cpu__addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr = __cpu__ram[__cpu__addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr = this.__video__readReg(__cpu__addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base === 0x4016){
			__cpu__addr = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base === 0x4017){
			__cpu__addr = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base.toString(16));
		}else{
			__cpu__addr = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
}

			
			this.PC = __cpu__pc + 2;

		break;
	}
		case 2: { /* ZeropageX */
			
			var __cpu__addr_base = __cpu__pc+1;
			
switch((__cpu__addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base = __cpu__ram[__cpu__addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base = this.__video__readReg(__cpu__addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base === 0x4016){
			__cpu__addr_base = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base === 0x4017){
			__cpu__addr_base = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base.toString(16));
		}else{
			__cpu__addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base + this.X) & 0xff;
			
			this.PC = __cpu__pc + 2;

		break;
	}
		case 3: { /* ZeropageY */
			
			var __cpu__addr_base = __cpu__pc+1;
			
switch((__cpu__addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base = __cpu__ram[__cpu__addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base = this.__video__readReg(__cpu__addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base === 0x4016){
			__cpu__addr_base = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base === 0x4017){
			__cpu__addr_base = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base.toString(16));
		}else{
			__cpu__addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base + this.Y) & 0xff;
			
			this.PC = __cpu__pc + 2;

		break;
	}
		case 4: { /* Absolute */
			
			var __cpu__addr_base1 = __cpu__pc+1;
			
switch((__cpu__addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base1 = __cpu__ram[__cpu__addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base1 = this.__video__readReg(__cpu__addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base1 === 0x4016){
			__cpu__addr_base1 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base1 === 0x4017){
			__cpu__addr_base1 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base1.toString(16));
		}else{
			__cpu__addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
}

			var __cpu__addr_base2 = __cpu__pc+2;
			
switch((__cpu__addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base2 = __cpu__ram[__cpu__addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base2 = this.__video__readReg(__cpu__addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base2 === 0x4016){
			__cpu__addr_base2 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base2 === 0x4017){
			__cpu__addr_base2 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base2.toString(16));
		}else{
			__cpu__addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base1 | (__cpu__addr_base2 << 8));
			
			this.PC = __cpu__pc + 3;

		break;
	}
		case 5: { /* AbsoluteX */
			
			var __cpu__addr_base1 = __cpu__pc+1;
			
switch((__cpu__addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base1 = __cpu__ram[__cpu__addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base1 = this.__video__readReg(__cpu__addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base1 === 0x4016){
			__cpu__addr_base1 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base1 === 0x4017){
			__cpu__addr_base1 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base1.toString(16));
		}else{
			__cpu__addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
}

			var __cpu__addr_base2 = __cpu__pc+2;
			
switch((__cpu__addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base2 = __cpu__ram[__cpu__addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base2 = this.__video__readReg(__cpu__addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base2 === 0x4016){
			__cpu__addr_base2 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base2 === 0x4017){
			__cpu__addr_base2 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base2.toString(16));
		}else{
			__cpu__addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base1 | (__cpu__addr_base2 << 8)) + this.X;
			if(((__cpu__addr ^ __cpu__addr_base) & 0x0100) !== 0) __vm__clockDelta += (1);
			
			this.PC = __cpu__pc + 3;

		break;
	}
		case 6: { /* AbsoluteY */
			
			var __cpu__addr_base1 = __cpu__pc+1;
			
switch((__cpu__addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base1 = __cpu__ram[__cpu__addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base1 = this.__video__readReg(__cpu__addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base1 === 0x4016){
			__cpu__addr_base1 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base1 === 0x4017){
			__cpu__addr_base1 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base1.toString(16));
		}else{
			__cpu__addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
}

			var __cpu__addr_base2 = __cpu__pc+2;
			
switch((__cpu__addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base2 = __cpu__ram[__cpu__addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base2 = this.__video__readReg(__cpu__addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base2 === 0x4016){
			__cpu__addr_base2 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base2 === 0x4017){
			__cpu__addr_base2 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base2.toString(16));
		}else{
			__cpu__addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base1 | (__cpu__addr_base2 << 8)) + this.Y;
			if(((__cpu__addr ^ __cpu__addr_base) & 0x0100) !== 0) __vm__clockDelta += (1);
			
			this.PC = __cpu__pc + 3;

		break;
	}
		case 7: { /* Indirect */
			
			var __cpu__addr_base1 = __cpu__pc+1;
			
switch((__cpu__addr_base1 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base1 = __cpu__ram[__cpu__addr_base1 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base1 = this.__video__readReg(__cpu__addr_base1);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base1 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base1 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base1 === 0x4016){
			__cpu__addr_base1 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base1 === 0x4017){
			__cpu__addr_base1 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base1.toString(16));
		}else{
			__cpu__addr_base1 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base1 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base1 = __cpu__rom[(__cpu__addr_base1>>10) & 31][__cpu__addr_base1 & 0x3ff];
		break;
	}
}

			var __cpu__addr_base2 = __cpu__pc+2;
			
switch((__cpu__addr_base2 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base2 = __cpu__ram[__cpu__addr_base2 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base2 = this.__video__readReg(__cpu__addr_base2);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base2 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base2 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base2 === 0x4016){
			__cpu__addr_base2 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base2 === 0x4017){
			__cpu__addr_base2 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base2.toString(16));
		}else{
			__cpu__addr_base2 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base2 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base2 = __cpu__rom[(__cpu__addr_base2>>10) & 31][__cpu__addr_base2 & 0x3ff];
		break;
	}
}

			var __cpu__addr_base3 = (__cpu__addr_base1 | (__cpu__addr_base2 << 8));

			var __cpu__addr_base4;
			
switch((__cpu__addr_base3 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base4 = __cpu__ram[__cpu__addr_base3 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base4 = this.__video__readReg(__cpu__addr_base3);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base3 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base4 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base3 === 0x4016){
			__cpu__addr_base4 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base3 === 0x4017){
			__cpu__addr_base4 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base3.toString(16));
		}else{
			__cpu__addr_base4 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base4 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base4 = __cpu__rom[(__cpu__addr_base3>>10) & 31][__cpu__addr_base3 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base4 = __cpu__rom[(__cpu__addr_base3>>10) & 31][__cpu__addr_base3 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base4 = __cpu__rom[(__cpu__addr_base3>>10) & 31][__cpu__addr_base3 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base4 = __cpu__rom[(__cpu__addr_base3>>10) & 31][__cpu__addr_base3 & 0x3ff];
		break;
	}
}

			var __cpu__addr_base5 = (__cpu__addr_base3 & 0xff00) | ((__cpu__addr_base3+1) & 0x00ff) /* bug of NES */;
			
switch((__cpu__addr_base5 & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base5 = __cpu__ram[__cpu__addr_base5 & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base5 = this.__video__readReg(__cpu__addr_base5);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base5 === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base5 =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base5 === 0x4016){
			__cpu__addr_base5 = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base5 === 0x4017){
			__cpu__addr_base5 = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base5.toString(16));
		}else{
			__cpu__addr_base5 = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base5 = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base5 = __cpu__rom[(__cpu__addr_base5>>10) & 31][__cpu__addr_base5 & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base5 = __cpu__rom[(__cpu__addr_base5>>10) & 31][__cpu__addr_base5 & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base5 = __cpu__rom[(__cpu__addr_base5>>10) & 31][__cpu__addr_base5 & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base5 = __cpu__rom[(__cpu__addr_base5>>10) & 31][__cpu__addr_base5 & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = __cpu__addr_base4 | (__cpu__addr_base5 << 8); 
			
			this.PC = __cpu__pc + 3;

		break;
	}
		case 8: { /* IndirectX */
			
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			
switch((__cpu__addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base = __cpu__ram[__cpu__addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base = this.__video__readReg(__cpu__addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base === 0x4016){
			__cpu__addr_base = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base === 0x4017){
			__cpu__addr_base = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base.toString(16));
		}else{
			__cpu__addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
}

			__cpu__addr_base = (__cpu__addr_base + this.X) & 0xff;
			/**
			 * @type {number}
			 */
			var __cpu__addr = __cpu__ram[__cpu__addr_base] | (__cpu__ram[(__cpu__addr_base + 1) & 0xff] << 8);
			
			this.PC = __cpu__pc + 2;

		break;
	}
		case 9: { /* IndirectY */
			
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			
switch((__cpu__addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base = __cpu__ram[__cpu__addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base = this.__video__readReg(__cpu__addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base === 0x4016){
			__cpu__addr_base = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base === 0x4017){
			__cpu__addr_base = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base.toString(16));
		}else{
			__cpu__addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__ram[__cpu__addr_base] | (__cpu__ram[(__cpu__addr_base + 1) & 0xff] << 8)) + this.Y;
			
			this.PC = __cpu__pc + 2;

		break;
	}
		case 10: { /* Relative */
			
			/**
			 * @type {number}
			 */
			var __cpu__addr_base = __cpu__pc+1;
			
switch((__cpu__addr_base & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__addr_base = __cpu__ram[__cpu__addr_base & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__addr_base = this.__video__readReg(__cpu__addr_base);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr_base === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__addr_base =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr_base === 0x4016){
			__cpu__addr_base = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr_base === 0x4017){
			__cpu__addr_base = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr_base.toString(16));
		}else{
			__cpu__addr_base = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__addr_base = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__addr_base = __cpu__rom[(__cpu__addr_base>>10) & 31][__cpu__addr_base & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__addr = (__cpu__addr_base >= 128 ? (__cpu__addr_base-256) : __cpu__addr_base) + __cpu__pc + 2;
			
			this.PC = __cpu__pc + 2;

		break;
	}
		case 11: { /* None */
			
			
			this.PC = __cpu__pc + 1;

		break;
	}
	default: { throw new cycloa.err.CoreException("Invalid opcode."); }
}
switch( (__cpu__inst & 65520) >> 4 ){
		case 0: {  /* LDA */
			
var tmpA;

switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		tmpA = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		tmpA = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			tmpA =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			tmpA = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			tmpA = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			tmpA = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		tmpA = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		tmpA = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		tmpA = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		tmpA = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		tmpA = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = tmpA];
		break;}
		case 1: {  /* LDX */
			
var tmpX;

switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		tmpX = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		tmpX = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			tmpX =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			tmpX = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			tmpX = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			tmpX = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		tmpX = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		tmpX = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		tmpX = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		tmpX = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		tmpX = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.X = tmpX];
		break;}
		case 2: {  /* LDY */
			
var tmpY;

switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		tmpY = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		tmpY = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			tmpY =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			tmpY = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			tmpY = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			tmpY = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		tmpY = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		tmpY = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		tmpY = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		tmpY = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		tmpY = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.Y = tmpY];
		break;}
		case 3: {  /* STA */
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = this.A;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, this.A);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = this.A & 15;			this.__rectangle0__decayEnabled = (this.A & 16) == 0;			this.__rectangle0__loopEnabled = (this.A & 32) == 32;			switch(this.A >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = this.A & 7;			this.__rectangle0__sweepIncreased = (this.A & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (this.A >> 4) & 3;			this.__rectangle0__sweepEnabled = (this.A&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (this.A);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((this.A & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[this.A >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = this.A & 15;			this.__rectangle1__decayEnabled = (this.A & 16) == 0;			this.__rectangle1__loopEnabled = (this.A & 32) == 32;			switch(this.A >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = this.A & 7;			this.__rectangle1__sweepIncreased = (this.A & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (this.A >> 4) & 3;			this.__rectangle1__sweepEnabled = (this.A&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (this.A);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((this.A & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[this.A >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((this.A & 128) == 128);			this.__triangle__linearCounterBuffer = this.A & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | this.A;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((this.A & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[this.A >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = this.A & 15;			this.__noize__decayEnabled = (this.A & 16) == 0;			this.__noize__loopEnabled = (this.A & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (this.A & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[this.A & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[this.A >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (this.A & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (this.A & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[this.A & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = this.A & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (this.A << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (this.A << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = this.A << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(this.A & 1)) this.__rectangle0__lengthCounter = 0;			if(!(this.A & 2)) this.__rectangle1__lengthCounter = 0;			if(!(this.A & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(this.A & 8)) this.__noize__lengthCounter = 0;			if(!(this.A & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((this.A & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(this.A & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((this.A & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, this.A); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, this.A);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, this.A);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, this.A);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, this.A);		break;	}}		break;}
		case 4: {  /* STX */
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = this.X;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, this.X);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = this.X & 15;			this.__rectangle0__decayEnabled = (this.X & 16) == 0;			this.__rectangle0__loopEnabled = (this.X & 32) == 32;			switch(this.X >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = this.X & 7;			this.__rectangle0__sweepIncreased = (this.X & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (this.X >> 4) & 3;			this.__rectangle0__sweepEnabled = (this.X&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (this.X);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((this.X & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[this.X >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = this.X & 15;			this.__rectangle1__decayEnabled = (this.X & 16) == 0;			this.__rectangle1__loopEnabled = (this.X & 32) == 32;			switch(this.X >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = this.X & 7;			this.__rectangle1__sweepIncreased = (this.X & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (this.X >> 4) & 3;			this.__rectangle1__sweepEnabled = (this.X&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (this.X);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((this.X & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[this.X >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((this.X & 128) == 128);			this.__triangle__linearCounterBuffer = this.X & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | this.X;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((this.X & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[this.X >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = this.X & 15;			this.__noize__decayEnabled = (this.X & 16) == 0;			this.__noize__loopEnabled = (this.X & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (this.X & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[this.X & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[this.X >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (this.X & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (this.X & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[this.X & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = this.X & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (this.X << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (this.X << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = this.X << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(this.X & 1)) this.__rectangle0__lengthCounter = 0;			if(!(this.X & 2)) this.__rectangle1__lengthCounter = 0;			if(!(this.X & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(this.X & 8)) this.__noize__lengthCounter = 0;			if(!(this.X & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((this.X & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(this.X & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((this.X & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, this.X); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, this.X);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, this.X);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, this.X);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, this.X);		break;	}}		break;}
		case 5: {  /* STY */
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = this.Y;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, this.Y);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = this.Y & 15;			this.__rectangle0__decayEnabled = (this.Y & 16) == 0;			this.__rectangle0__loopEnabled = (this.Y & 32) == 32;			switch(this.Y >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = this.Y & 7;			this.__rectangle0__sweepIncreased = (this.Y & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (this.Y >> 4) & 3;			this.__rectangle0__sweepEnabled = (this.Y&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (this.Y);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((this.Y & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[this.Y >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = this.Y & 15;			this.__rectangle1__decayEnabled = (this.Y & 16) == 0;			this.__rectangle1__loopEnabled = (this.Y & 32) == 32;			switch(this.Y >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = this.Y & 7;			this.__rectangle1__sweepIncreased = (this.Y & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (this.Y >> 4) & 3;			this.__rectangle1__sweepEnabled = (this.Y&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (this.Y);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((this.Y & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[this.Y >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((this.Y & 128) == 128);			this.__triangle__linearCounterBuffer = this.Y & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | this.Y;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((this.Y & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[this.Y >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = this.Y & 15;			this.__noize__decayEnabled = (this.Y & 16) == 0;			this.__noize__loopEnabled = (this.Y & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (this.Y & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[this.Y & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[this.Y >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (this.Y & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (this.Y & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[this.Y & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = this.Y & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (this.Y << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (this.Y << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = this.Y << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(this.Y & 1)) this.__rectangle0__lengthCounter = 0;			if(!(this.Y & 2)) this.__rectangle1__lengthCounter = 0;			if(!(this.Y & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(this.Y & 8)) this.__noize__lengthCounter = 0;			if(!(this.Y & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((this.Y & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(this.Y & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((this.Y & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, this.Y); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, this.Y);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, this.Y);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, this.Y);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, this.Y);		break;	}}		break;}
		case 6: {  /* TAX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.X = this.A];		break;}
		case 7: {  /* TAY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.Y = this.A];		break;}
		case 8: {  /* TSX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.X = this.SP];		break;}
		case 9: {  /* TXA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = this.X];		break;}
		case 10: {  /* TXS */
			this.SP = this.X;		break;}
		case 11: {  /* TYA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = this.Y];		break;}
		case 12: {  /* ADC */
			
			/**
			 * @type {number}
			 */
			var __cpu__adc_p = this.P;
			/**
			 * @type {number}
			 */
			var __cpu__adc_a = this.A;
			/**
			 * @type {number}
			 */
			var __cpu__adc_val; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__adc_val = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__adc_val = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__adc_val =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			__cpu__adc_val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			__cpu__adc_val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			__cpu__adc_val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__adc_val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__adc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__adc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__adc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__adc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__adc_result = (__cpu__adc_a + __cpu__adc_val + (__cpu__adc_p & 0x1)) & 0xffff;
			/**
			 * @type {number}
			 */
			var __cpu__adc_newA = __cpu__adc_result & 0xff;
			this.P = (__cpu__adc_p & 0xbe)
				| ((((__cpu__adc_a ^ val) & 0x80) ^ 0x80) & ((__cpu__adc_a ^ __cpu__adc_newA) & 0x80)) >> 1 //set V flag //いまいちよくわかってない（
				| ((__cpu__adc_result >> 8) & 0x1); //set C flag
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = __cpu__adc_newA];
		break;}
		case 13: {  /* AND */
			
var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}
;
/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A &= mem];
		break;}
		case 14: {  /* ASL */
			
			/**
			 * @type {number}
			 */
			var val; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			this.P = (this.P & 0xFE) | val >> 7;
			/**
			 * @type {number}
			 */
			var shifted = val << 1;
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = shifted << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}}
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[shifted & 0xff];
		break;}
		case 15: {  /* ASL_ */
			
			/**
			 * @type {number}
			 */
			var a = this.A;
			this.P = (this.P & 0xFE) | (a & 0xff) >> 7;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = (a << 1) & 0xff];
		break;}
		case 16: {  /* BIT */
			
			/**
			 * @type {number}
			 */
			var val; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			this.P = (this.P & 0x3d)
				| (val & 0xc0)
				| (__cpu__ZNFlagCache[this.A & val] & 0x2);
		break;}
		case 17: {  /* CMP */
			
			var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var val = (this.A - mem) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 18: {  /* CPX */
			
			var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var val = (this.X - mem) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 19: {  /* CPY */
			
			var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var val = (this.Y - mem) & 0xffff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[val & 0xff];
			this.P = (this.P & 0xfe) | (((val >> 8) & 0x1) ^ 0x1);
		break;}
		case 20: {  /* DEC */
			
			/**
			 * @type {number}
			 */
			var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			var val = (mem-1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[val];
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = val;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, val);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;			this.__rectangle0__decayEnabled = (val & 16) == 0;			this.__rectangle0__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = val & 7;			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;			this.__rectangle1__decayEnabled = (val & 16) == 0;			this.__rectangle1__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = val & 7;			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((val & 128) == 128);			this.__triangle__linearCounterBuffer = val & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;			this.__noize__decayEnabled = (val & 16) == 0;			this.__noize__loopEnabled = (val & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (val & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (val & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (val & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = val & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (val << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = val << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(val & 8)) this.__noize__lengthCounter = 0;			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((val & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(val & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((val & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, val); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, val);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, val);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, val);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, val);		break;	}}
		break;}
		case 21: {  /* DEX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.X = (this.X-1)&0xff];		break;}
		case 22: {  /* DEY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.Y = (this.Y-1)&0xff];		break;}
		case 23: {  /* EOR */
			
var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}
;
/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A ^= mem];
		break;}
		case 24: {  /* INC */
			
			/**
			 * @type {number}
			 */
			var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			var val = (mem+1) & 0xff;
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[val];
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = val;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, val);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;			this.__rectangle0__decayEnabled = (val & 16) == 0;			this.__rectangle0__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = val & 7;			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;			this.__rectangle1__decayEnabled = (val & 16) == 0;			this.__rectangle1__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = val & 7;			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((val & 128) == 128);			this.__triangle__linearCounterBuffer = val & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;			this.__noize__decayEnabled = (val & 16) == 0;			this.__noize__loopEnabled = (val & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (val & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (val & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (val & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = val & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (val << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = val << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(val & 8)) this.__noize__lengthCounter = 0;			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((val & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(val & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((val & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, val); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, val);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, val);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, val);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, val);		break;	}}
		break;}
		case 25: {  /* INX */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.X = (this.X+1)&0xff];		break;}
		case 26: {  /* INY */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.Y = (this.Y+1)&0xff];		break;}
		case 27: {  /* LSR */
			
			/**
			 * @type {number}
			 */
			var val; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			this.P = (this.P & 0xFE) | (val & 0x01);
			/**
			 * @type {number}
			 */
			var shifted = val >> 1;
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = shifted << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}}
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[shifted];
		break;}
		case 28: {  /* LSR_ */
			
			this.P = (this.P & 0xFE) | (this.A & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A >>= 1];
		break;}
		case 29: {  /* ORA */
			
var mem; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		mem = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		mem = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			mem =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			mem = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			mem = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			mem = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		mem = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		mem = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}
;
/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A |= mem];
		break;}
		case 30: {  /* ROL */
			
			/**
			 * @type {number}
			 */
			var val; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var p = this.P;
			/**
			 * @type {number}
			 */
			var shifted = ((val << 1) & 0xff) | (p & 0x01);
			this.P = (p & 0xFE) | (val >> 7);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[shifted];
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = shifted << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}}
		break;}
		case 31: {  /* ROL_ */
			
			/**
			 * @type {number}
			 */
			var a = this.A;
			/**
			 * @type {number}
			 */
			var p = this.P;
			this.P = (p & 0xFE) | ((a & 0xff) >> 7);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = (a << 1) | (p & 0x01)];
		break;}
		case 32: {  /* ROR */
			
			/**
			 * @type {number}
			 */
			var val; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		val = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		val = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			val =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var p = this.P;
			/**
			 * @type {number}
			 */
			var shifted = (val >> 1) | ((p & 0x01) << 7);
			this.P = (p & 0xFE) | (val & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[shifted];
			switch((__cpu__addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[__cpu__addr & 0x1fff] = shifted;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(__cpu__addr, shifted);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(__cpu__addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = shifted & 15;			this.__rectangle0__decayEnabled = (shifted & 16) == 0;			this.__rectangle0__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = shifted & 7;			this.__rectangle0__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle0__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (shifted);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = shifted & 15;			this.__rectangle1__decayEnabled = (shifted & 16) == 0;			this.__rectangle1__loopEnabled = (shifted & 32) == 32;			switch(shifted >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = shifted & 7;			this.__rectangle1__sweepIncreased = (shifted & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (shifted >> 4) & 3;			this.__rectangle1__sweepEnabled = (shifted&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (shifted);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((shifted & 128) == 128);			this.__triangle__linearCounterBuffer = shifted & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | shifted;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((shifted & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = shifted & 15;			this.__noize__decayEnabled = (shifted & 16) == 0;			this.__noize__loopEnabled = (shifted & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (shifted & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[shifted & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[shifted >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (shifted & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (shifted & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[shifted & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = shifted & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (shifted << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (shifted << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = shifted << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(shifted & 1)) this.__rectangle0__lengthCounter = 0;			if(!(shifted & 2)) this.__rectangle1__lengthCounter = 0;			if(!(shifted & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(shifted & 8)) this.__noize__lengthCounter = 0;			if(!(shifted & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((shifted & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(shifted & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((shifted & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(__cpu__addr, shifted); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(__cpu__addr, shifted);		break;	}}
		break;}
		case 33: {  /* ROR_ */
			
			/**
			 * @type {number}
			 */
			var p = this.P;
			/**
			 * @type {number}
			 */
			var a = this.A;
			/**
			 * @type {number}
			 */
			this.P = (p & 0xFE) | (a & 0x01);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = ((a >> 1) & 0x7f) | ((p & 0x1) << 7)];
		break;}
		case 34: {  /* SBC */
			
			/**
			 * @type {number}
			 */
			var __cpu__sbc_p = this.P;
			/**
			 * @type {number}
			 */
			var __cpu__sbc_a = this.A;
			/**
			 * @type {number}
			 */
			var __cpu__sbc_val; 
switch((__cpu__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__cpu__sbc_val = __cpu__ram[__cpu__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__cpu__sbc_val = this.__video__readReg(__cpu__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__cpu__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__cpu__sbc_val =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__cpu__addr === 0x4016){
			__cpu__sbc_val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__cpu__addr === 0x4017){
			__cpu__sbc_val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__cpu__addr.toString(16));
		}else{
			__cpu__sbc_val = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__cpu__sbc_val = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__cpu__sbc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__cpu__sbc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__cpu__sbc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__cpu__sbc_val = __cpu__rom[(__cpu__addr>>10) & 31][__cpu__addr & 0x3ff];
		break;
	}
}

			/**
			 * @type {number}
			 */
			var __cpu__sbc_result = (__cpu__sbc_a - __cpu__sbc_val - ((__cpu__sbc_p & 0x1) ^ 0x1)) & 0xffff;
			/**
			 * @type {number}
			 */
			var __cpu__sbc_newA = __cpu__sbc_result & 0xff;
			this.P = (__cpu__sbc_p & 0xbe)
				| ((__cpu__sbc_a ^ __cpu__sbc_val) & (__cpu__sbc_a ^ __cpu__sbc_newA) & 0x80) >> 1 //set V flag //いまいちよくわかってない（
				| (((__cpu__sbc_result >> 8) & 0x1) ^ 0x1);
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = __cpu__sbc_newA];
		break;}
		case 35: {  /* PHA */
			 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.A;		break;}
		case 36: {  /* PHP */
			
			// bug of 6502! from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
			 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.P | 0x10;
		break;}
		case 37: {  /* PLA */
			/* UpdateFlag */ this.P = (this.P & 0x7D) | __cpu__ZNFlagCache[this.A = /* ::CPU::Pop */ (__cpu__ram[0x0100 | (++this.SP & 0xff)])];		break;}
		case 38: {  /* PLP */
			
			/**
			 * @type {number}
			 */
			var val = /* ::CPU::Pop */ (__cpu__ram[0x0100 | (++this.SP & 0xff)]);
			if((this.P & 0x4) && !(val & 0x4)){
				// FIXME: ここどうする？？
				this.needStatusRewrite = true;
				this.newStatus =val;
				//this.P = val;
			}else{
				this.P = val;
			}
		break;}
		case 39: {  /* CLC */
			
			this.P &= (0xfe);
		break;}
		case 40: {  /* CLD */
			
			this.P &= (0xf7);
		break;}
		case 41: {  /* CLI */
			
			// http://twitter.com/#!/KiC6280/status/112348378100281344
			// http://twitter.com/#!/KiC6280/status/112351125084180480
			//FIXME
			this.needStatusRewrite = true;
			this.newStatus = this.P & (0xfb);
			//this.P &= 0xfb;
		break;}
		case 42: {  /* CLV */
			
			this.P &= (0xbf);
		break;}
		case 43: {  /* SEC */
			
			this.P |= 0x1;
		break;}
		case 44: {  /* SED */
			
			this.P |= 0x8;
		break;}
		case 45: {  /* SEI */
			
			this.P |= 0x4;
		break;}
		case 46: {  /* BRK */
			
			//NES ON FPGAには、
			//「割り込みが確認された時、Iフラグがセットされていれば割り込みは無視します。」
			//…と合ったけど、他の資料だと違う。http://nesdev.parodius.com/6502.txt
			//DQ4はこうしないと、動かない。
			/*
			if(this.P & 0x4){
				return;
			}*/
			this.PC++;
			 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.PC >> 8;
			 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = this.PC;
			this.P |= 0x10;
			 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = (this.P);
			this.P |= 0x4;
			//this.PC = (this.read(0xFFFE) | (this.read(0xFFFF) << 8));
			this.PC = (rom[31][0x3FE] | (rom[31][0x3FF] << 8));
		break;}
		case 47: {  /* NOP */
					break;}
		case 48: {  /* RTS */
			
			this.PC = (/* ::CPU::Pop */ (__cpu__ram[0x0100 | (++this.SP & 0xff)]) | (/* ::CPU::Pop */ (__cpu__ram[0x0100 | (++this.SP & 0xff)]) << 8)) + 1;
		break;}
		case 49: {  /* RTI */
			
			this.P = /* ::CPU::Pop */ (__cpu__ram[0x0100 | (++this.SP & 0xff)]);
			this.PC = /* ::CPU::Pop */ (__cpu__ram[0x0100 | (++this.SP & 0xff)]) | (/* ::CPU::Pop */ (__cpu__ram[0x0100 | (++this.SP & 0xff)]) << 8);
		break;}
		case 50: {  /* JMP */
			
			this.PC = __cpu__addr;
		break;}
		case 51: {  /* JSR */
			
			/**
			 * @const
			 * @type {number}
			 */
			var __cpu__jsr_stored_pc = this.PC-1;
			 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = __cpu__jsr_stored_pc >> 8;
			 /* ::CPU::Push */ __cpu__ram[0x0100 | (this.SP-- & 0xff)] = __cpu__jsr_stored_pc;
			this.PC = __cpu__addr;
		break;}
		case 52: {  /* BCC */
			
			if(!(this.P & 0x1)){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
		case 53: {  /* BCS */
			
			if(this.P & 0x1){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
		case 54: {  /* BEQ */
			
			if(this.P & 0x2){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
		case 55: {  /* BMI */
			
			if(this.P & 0x80){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
		case 56: {  /* BNE */
			
			if(!(this.P & 0x2)){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
		case 57: {  /* BPL */
			
			if(!(this.P & 0x80)){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
		case 58: {  /* BVC */
			
			if(!(this.P & 0x40)){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
		case 59: {  /* BVS */
			
			if(this.P & 0x40){
				__vm__clockDelta += ((((this.PC ^ __cpu__addr) & 0x0100) !== 0) ? 2 : 1);
				this.PC = __cpu__addr;
			}
		break;}
}
__vm__clockDelta += (__cpu__inst >> 16);


		
this.__video__nowX += __vm__clockDelta * 3;
while(this.__video__nowX >= 341){
	this.__video__nowX -= 341;
	/**
	 * @const
	 * @type {number}
	 */
	var __video__nowY = (++this.__video__nowY);
	if(__video__nowY <= 240){
		/**
		 * @const
		 * @type {Uint8Array}
		 */
		this.__video__spriteEval();
		if(this.__video__backgroundVisibility || this.__video__spriteVisibility) {
			// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
			this.__video__vramAddrRegister = (this.__video__vramAddrRegister & 0x7BE0) | (this.__video__vramAddrReloadRegister & 0x041F);
			this.__video__buildBgLine();
			this.__video__buildSpriteLine();
			var __video__vramAddrRegister = this.__video__vramAddrRegister + (1 << 12);
			__video__vramAddrRegister += (__video__vramAddrRegister & 0x8000) >> 10;
			__video__vramAddrRegister &= 0x7fff;
			if((__video__vramAddrRegister & 0x03e0) === 0x3c0){
				__video__vramAddrRegister &= 0xFC1F;
				__video__vramAddrRegister ^= 0x800;
			}
			this.__video__vramAddrRegister = __video__vramAddrRegister;
		}
	}else if(__video__nowY === 241){
		//241: The PPU just idles during this scanline. Despite this, this scanline still occurs before the VBlank flag is set.
		this.__video__videoFairy.dispatchRendering(__video__screenBuffer8, this.__video__paletteMask);
		__vm__run = false;
		this.__video__nowOnVBnank = true;
		this.__video__spriteAddr = 0;//and typically contains 00h at the begin of the VBlank periods
	}else if(__video__nowY === 242){
		// NESDEV: These occur during VBlank. The VBlank flag of the PPU is pulled low during scanline 241, so the VBlank NMI occurs here.
		// EVERYNES: http://nocash.emubase.de/everynes.htm#ppudimensionstimings
		// とあるものの…BeNesの実装だともっと後に発生すると記述されてる。詳しくは以下。
		// なお、$2002のレジスタがHIGHになった後にVBLANKを起こさないと「ソロモンの鍵」にてゲームが始まらない。
		// (NMI割り込みがレジスタを読み込みフラグをリセットしてしまう上、NMI割り込みが非常に長く、クリアしなくてもすでにVBLANKが終わった後に返ってくる)
		//nowOnVBlankフラグの立ち上がり後、数クロックでNMIが発生。
		this.NMI = this.__video__executeNMIonVBlank; /* reserve NMI if emabled */
		this.onVBlank();
	}else if(__video__nowY <= 261){
		//nowVBlank.
	}else if(__video__nowY === 262){
		this.__video__nowOnVBnank = false;
		this.__video__sprite0Hit = false;
		this.__video__nowY = 0;
		if(!this.__video__isEven){
			this.__video__nowX++;
		}
		this.__video__isEven = !this.__video__isEven;
		// the reload value is automatically loaded into the Pointer at the end of the vblank period (vertical reload bits)
		// from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
		if(this.__video__backgroundVisibility || this.__video__spriteVisibility){
			this.__video__vramAddrRegister = (this.__video__vramAddrRegister & 0x041F) | (this.__video__vramAddrReloadRegister & 0x7BE0);
		}
	}else{
		throw new cycloa.err.CoreException("Invalid scanline: "+this.__video__nowY);
	}
}


		this.__audio__frameCnt += (__vm__clockDelta * 240);
while(this.__audio__frameCnt >= 1786840){
	this.__audio__frameCnt -= 1786840;
	if(this.__audio__isNTSCmode){
		this.__audio__frameIRQCnt ++;
		switch(this.__audio__frameIRQCnt){
		case 1:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 2:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			break;
		case 3:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 4:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			if(this.__audio__frameIRQenabled){
				this.IRQ |= 1;			}
			this.__audio__frameIRQCnt = 0;
			break;
		default:
			throw new cycloa.err.CoreException("FIXME Audio::run interrupt NTSC");
		}
	}else{
		this.__audio__frameIRQCnt ++;
		switch(this.__audio__frameIRQCnt){
		case 1:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 2:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			break;
		case 3:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			break;
		case 4:
			break;
		case 5:
			//

if(this.__rectangle1__decayCounter === 0){
	this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate;
	if(this.__rectangle1__decayVolume === 0){
		if(this.__rectangle1__loopEnabled){
			this.__rectangle1__decayVolume = 0xf;
		}
	}else{
		this.__rectangle1__decayVolume--;
	}
}else{
	this.__rectangle1__decayCounter--;
}
if(this.__rectangle1__decayReloaded){
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayVolume = 0xf;
}


if(this.__rectangle0__decayCounter === 0){
	this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate;
	if(this.__rectangle0__decayVolume === 0){
		if(this.__rectangle0__loopEnabled){
			this.__rectangle0__decayVolume = 0xf;
		}
	}else{
		this.__rectangle0__decayVolume--;
	}
}else{
	this.__rectangle0__decayCounter--;
}
if(this.__rectangle0__decayReloaded){
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayVolume = 0xf;
}


if(this.__triangle__haltFlag){
	this.__triangle__linearCounter = this.__triangle__linearCounterBuffer;
}else if(this.__triangle__linearCounter != 0){
	this.__triangle__linearCounter--;
}
if(!this.__triangle__enableLinearCounter){
	this.__triangle__haltFlag = false;
}


if(this.__noize__decayCounter == 0){
	this.__noize__decayCounter = this.__noize__volumeOrDecayRate;
	if(this.__noize__decayVolume == 0){
		if(this.__noize__loopEnabled){
			this.__noize__decayVolume = 0xf;
		}
	}else{
		this.__noize__decayVolume--;
	}
}else{
	this.__noize__decayCounter--;
}
if(this.__noize__decayReloaded){
	this.__noize__decayReloaded = false;
	this.__noize__decayVolume = 0xf;
}

			//

if(this.__rectangle1__lengthCounter != 0 && !this.__rectangle1__loopEnabled){
	this.__rectangle1__lengthCounter--;
}
if(this.__rectangle1__sweepEnabled){
	if(this.__rectangle1__sweepCounter == 0){
		this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio;
		if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle1__shift = (this.__rectangle1__frequency >> this.__rectangle1__sweepShiftAmount);
			if(this.__rectangle1__sweepIncreased){
				this.__rectangle1__frequency += __rectangle1__shift;
			}else{
				this.__rectangle1__frequency -= __rectangle1__shift;
			}
		}
	}else{
		this.__rectangle1__sweepCounter--;
	}
}


if(this.__rectangle0__lengthCounter != 0 && !this.__rectangle0__loopEnabled){
	this.__rectangle0__lengthCounter--;
}
if(this.__rectangle0__sweepEnabled){
	if(this.__rectangle0__sweepCounter == 0){
		this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio;
		if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__sweepShiftAmount != 0){
			/**
			 * @type {number} uint16_t
			 */
			var __rectangle0__shift = (this.__rectangle0__frequency >> this.__rectangle0__sweepShiftAmount);
			if(this.__rectangle0__sweepIncreased){
				this.__rectangle0__frequency += __rectangle0__shift;
			}else{
				this.__rectangle0__frequency -= __rectangle0__shift;
					this.__rectangle0__frequency--;
			}
		}
	}else{
		this.__rectangle0__sweepCounter--;
	}
}


if(this.__triangle__lengthCounter != 0 && !this.__triangle__enableLinearCounter){
	this.__triangle__lengthCounter--;
}


if(this.__noize__lengthCounter != 0 && !this.__noize__loopEnabled){
	this.__noize__lengthCounter--;
}

			this.__audio__frameIRQCnt = 0;
			break;
		default:
			throw new cycloa.err.CoreException("FIXME Audio::run interrupt PAL");
		}
	}
}
this.__audio__clockCnt += (__vm__clockDelta * 22050);
while(this.__audio__clockCnt >= 1786840){
	/*unsigned int*/var __audio__processClock = 1786840 + this.__audio__leftClock;
	/*unsigned int*/var __audio__delta = (__audio__processClock / 22050) | 0;
	this.__audio__leftClock = __audio__processClock % 22050;
	this.__audio__clockCnt-= 1786840;
	/*int16_t*/ var __audio__sound = 0;

if(this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var __rectangle1__nowCounter = this.__rectangle1__freqCounter + __audio__delta;
	this.__rectangle1__freqCounter = __rectangle1__nowCounter % (this.__rectangle1__frequency + 1);
	this.__rectangle1__dutyCounter = (this.__rectangle1__dutyCounter + (__rectangle1__nowCounter  / (this.__rectangle1__frequency + 1))) & 15;
	if(this.__rectangle1__dutyCounter < this.__rectangle1__dutyRatio){
		__audio__sound += this.__rectangle1__decayEnabled ? this.__rectangle1__decayVolume : this.__rectangle1__volumeOrDecayRate;
	}else{
		__audio__sound += this.__rectangle1__decayEnabled ? -this.__rectangle1__decayVolume : -this.__rectangle1__volumeOrDecayRate;
	}
}


if(this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  <= 0x7ff){
	/* 
	 * @type {number} unsigned int
	 * @const
	 */
	var __rectangle0__nowCounter = this.__rectangle0__freqCounter + __audio__delta;
	this.__rectangle0__freqCounter = __rectangle0__nowCounter % (this.__rectangle0__frequency + 1);
	this.__rectangle0__dutyCounter = (this.__rectangle0__dutyCounter + (__rectangle0__nowCounter  / (this.__rectangle0__frequency + 1))) & 15;
	if(this.__rectangle0__dutyCounter < this.__rectangle0__dutyRatio){
		__audio__sound += this.__rectangle0__decayEnabled ? this.__rectangle0__decayVolume : this.__rectangle0__volumeOrDecayRate;
	}else{
		__audio__sound += this.__rectangle0__decayEnabled ? -this.__rectangle0__decayVolume : -this.__rectangle0__volumeOrDecayRate;
	}
}

if(this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0){
	//freqが1や0だと、ここでもモデルが破綻する。FF1のOPで発生。
	/* unsigned int */ var __triangle__nowCounter = this.__triangle__freqCounter + __audio__delta;
	var __triangle__freq = this.__triangle__frequency + 1;
	this.__triangle__freqCounter = __triangle__nowCounter % __triangle__freq;
	__audio__sound += this.__triangle__waveForm[this.__triangle__streamCounter = (this.__triangle__streamCounter + (__triangle__nowCounter  / __triangle__freq)) & 31];
}

if(this.__noize__lengthCounter != 0){
	/* unsigned int */var __noize__nowCounter = this.__noize__freqCounter + __audio__delta;
	/* const uint16_t */var __noize__divFreq = this.__noize__frequency + 1;
	/* const uint8_t */var __noize__shiftAmount = this.__noize__modeFlag ? 6 : 1;
	//FIXME: frequencyが小さい時に此のモデルが破綻する
	var __noize__shiftReg = this.__noize__shiftRegister;
	while(__noize__nowCounter >= __noize__divFreq){
		__noize__nowCounter -= __noize__divFreq;
		__noize__shiftReg =(__noize__shiftReg >> 1) | (((__noize__shiftReg ^ (__noize__shiftReg >> __noize__shiftAmount))  & 1) << 14);
	}

	if(((__noize__shiftReg & 1) == 1)){
		__audio__sound += this.__noize__decayEnabled ? -this.__noize__decayVolume : -this.__noize__volumeOrDecayRate;
	}else{
		__audio__sound += this.__noize__decayEnabled ? this.__noize__decayVolume : this.__noize__volumeOrDecayRate;
	}

	this.__noize__freqCounter = __noize__nowCounter;
	this.__noize__shiftRegister = __noize__shiftReg;
}

if(this.__digital__sampleLength != 0){
	/*unsigned int*/ var __digital__nowCounter = this.__digital__freqCounter + __audio__delta;
	/*const uint16_t*/var __digital__divFreq = this.__digital__frequency + 1;
	while(__digital__nowCounter >= __digital__divFreq){
		__digital__nowCounter -= divFreq;
			if(this.__digital__sampleBufferLeft == 0){
				this.__digital__sampleLength--;
				var __val__;
				var __digital__addr = this.__digital__sampleAddr;
				
switch((__digital__addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__digitl__val__ = __cpu__ram[__digital__addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__digitl__val__ = this.__video__readReg(__digital__addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(__digital__addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__digitl__val__ =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(__digital__addr === 0x4016){
			__digitl__val__ = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(__digital__addr === 0x4017){
			__digitl__val__ = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__digital__addr.toString(16));
		}else{
			__digitl__val__ = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__digitl__val__ = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__digitl__val__ = __cpu__rom[(__digital__addr>>10) & 31][__digital__addr & 0x3ff];
		break;
	}
}
				this.__digital__sampleBuffer = __digitl__val__;

				if(this.__digital__sampleAddr >= 0xffff){
					this.__digital__sampleAddr = 0x8000;
				}else{
					this.__digital__sampleAddr++;
				}
				this.__digital__sampleBufferLeft = 7;
				__vm__reservedClockDelta += (4);				if(this.__digital__sampleLength == 0){
					if(this.__digital__loopEnabled){
						this.__digital__sampleLength = this.__digital__sampleLengthBuffer;
					}else if(this.__digital__irqEnabled){
						this.IRQ |= 2;					}else{
						break;
					}
				}
			}
			this.__digital__sampleBuffer = this.__digital__sampleBuffer >> 1;
			if((this.__digital__sampleBuffer & 1) == 1){
				if(this.__digital__deltaCounter < 126){
					this.__digital__deltaCounter+=2;
				}
			}else{
				if(this.__digital__deltaCounter > 1){
					this.__digital__deltaCounter-=2;
				}
			}
			this.__digital__sampleBufferLeft--;
	}
	this.__digital__freqCounter = __digitl__nowCounter;
	__audio__sound += this.__digital__deltaCounter;
}

	if(__audio__enabled){
		__audio__data[__audio__audioFairy.dataIndex++] = __audio__sound / 100;
		if(__audio__audioFairy.dataIndex >= __audio__data__length){
			__audio__audioFairy.onDataFilled();
			__audio__data = __audio__audioFairy.data;
		}
	}
}


	}
	this.__vm__reservedClockDelta += __vm__reservedClockDelta;
	return __vm__run;
};

/**
 * 関数実行時に
 * @function
 */
cycloa.VirtualMachine.prototype.onHardReset = function () {
	this.NMI = false;
	this.IRQ = 0;
	this.onHardResetCPU();
	this.__video__onHardReset();
	this.__audio__onHardReset();
	this.__rectangle0__onHardReset();
	this.__rectangle1__onHardReset();
	this.__triangle__onHardReset();
	this.__noize__onHardReset();
	this.__digital__onHardReset();
};
cycloa.VirtualMachine.prototype.onReset = function () {
	this.NMI = false;
	this.IRQ = 0;
	this.onResetCPU();
	this.__video__onReset();
	this.__audio__onReset();
	this.__rectangle0__onReset();
	this.__rectangle1__onReset();
	this.__triangle__onReset();
	this.__noize__onReset();
	this.__digital__onReset();
};
cycloa.VirtualMachine.prototype.onVBlank = function(){
};
cycloa.VirtualMachine.prototype.onIRQ = function(){
};
cycloa.VirtualMachine.prototype.read = function(addr) { 
	var __val__;
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
	
switch((addr & 0xE000) >> 13){
	case 0:{ /* 0x0000 -> 0x2000 */
		__val__ = __cpu__ram[addr & 0x7ff];
		break;
	}
	case 1:{ /* 0x2000 -> 0x4000 */
		__val__ = this.__video__readReg(addr);
		break;
	}
	case 2:{ /* 0x4000 -> 0x6000 */
		if(addr === 0x4015){
		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).
			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */
			__val__ =
					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)
					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)
					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)
					|((this.__noize__lengthCounter != 0) ? 8 : 0)
					|((this.__digital__sampleLength != 0) ? 16 : 0)
					|(((this.IRQ & 1)) ? 64 : 0)
					|((this.IRQ & 2) ? 128 : 0);
			this.IRQ &= 254;
			this.IRQ &= 253;
		}else if(addr === 0x4016){
			__val__ = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;
		}else if(addr === 0x4017){
			__val__ = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;
		}else if(addr < 0x4018){
			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+addr.toString(16));
		}else{
			__val__ = this.readMapperRegisterArea(addr);
		}
		break;
	}
	case 3:{ /* 0x6000 -> 0x8000 */
		__val__ = 0;
		break;
	}
	case 4:{ /* 0x8000 -> 0xA000 */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 5:{ /* 0xA000 -> 0xC000 */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 6:{ /* 0xC000 -> 0xE000 */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
	case 7:{ /* 0xE000 -> 0xffff */
		__val__ = __cpu__rom[(addr>>10) & 31][addr & 0x3ff];
		break;
	}
}
;
	return __val__;
};

cycloa.VirtualMachine.prototype.write = function(addr, val) {
	var __cpu__rom = this.__cpu__rom; var __cpu__ram = this.__cpu__ram;
	switch((addr & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[addr & 0x1fff] = val;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(addr, val);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(addr & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = val & 15;			this.__rectangle0__decayEnabled = (val & 16) == 0;			this.__rectangle0__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = val & 7;			this.__rectangle0__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle0__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (val);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = val & 15;			this.__rectangle1__decayEnabled = (val & 16) == 0;			this.__rectangle1__loopEnabled = (val & 32) == 32;			switch(val >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = val & 7;			this.__rectangle1__sweepIncreased = (val & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (val >> 4) & 3;			this.__rectangle1__sweepEnabled = (val&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (val);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((val & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((val & 128) == 128);			this.__triangle__linearCounterBuffer = val & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | val;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((val & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = val & 15;			this.__noize__decayEnabled = (val & 16) == 0;			this.__noize__loopEnabled = (val & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (val & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[val & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[val >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (val & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (val & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[val & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = val & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (val << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (val << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = val << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(val & 1)) this.__rectangle0__lengthCounter = 0;			if(!(val & 2)) this.__rectangle1__lengthCounter = 0;			if(!(val & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(val & 8)) this.__noize__lengthCounter = 0;			if(!(val & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((val & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(val & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((val & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(addr, val); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(addr, val);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(addr, val);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(addr, val);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(addr, val);		break;	}};
};


cycloa.VirtualMachine.prototype.onHardResetCPU = function(){
		//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
		this.P = 0x24;
		this.A = 0x0;
		this.X = 0x0;
		this.Y = 0x0;
		this.SP = 0xfd;
		switch((0x4017 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[0x4017 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(0x4017, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4017 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = 0x00 << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4017, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4017, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4017, 0x00);		break;	}}		switch((0x4015 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[0x4015 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(0x4015, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4015 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = 0x00 << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4015, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4015, 0x00);		break;	}}		//this.PC = (this.read(0xFFFC) | (this.read(0xFFFD) << 8));
		this.PC = (this.__cpu__rom[31][0x3FC]| (this.__cpu__rom[31][0x3FD] << 8));

};

cycloa.VirtualMachine.prototype.onResetCPU = function () {
	//from http://wiki.nesdev.com/w/index.php/CPU_power_up_state
	//from http://crystal.freespace.jp/pgate1/nes/nes_cpu.htm
	this.__vm__reservedClockDelta += 6;
	this.SP -= 0x03;
	this.P |= 4;
	switch((0x4015 & 0xE000) >> 13) {	case 0:{ /* 0x0000 -> 0x2000 */		__cpu__ram[0x4015 & 0x1fff] = 0x00;		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		this.__video__writeReg(0x4015, 0x00);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		switch(0x4015 & 0x1f) {		case 0x0: { /* 4000h - APU Volume/Decay Channel 1 (Rectangle) */			this.__rectangle0__decayCounter = this.__rectangle0__volumeOrDecayRate = 0x00 & 15;			this.__rectangle0__decayEnabled = (0x00 & 16) == 0;			this.__rectangle0__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle0__dutyRatio = 2;				break;			case 1:				this.__rectangle0__dutyRatio = 4;				break;			case 2:				this.__rectangle0__dutyRatio = 8;				break;			case 3:				this.__rectangle0__dutyRatio = 12;				break;			}			break;		}		case 0x1: { /* 4001h - APU Sweep Channel 1 (Rectangle) */			this.__rectangle0__sweepShiftAmount = 0x00 & 7;			this.__rectangle0__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle0__sweepCounter = this.__rectangle0__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle0__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x2: { /* 4002h - APU Frequency Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x0700) | (0x00);			break;		}		case 0x3: { /* 4003h - APU Length Channel 1 (Rectangle) */			this.__rectangle0__frequency = (this.__rectangle0__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle0__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle0__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle0__decayReloaded = true;			break;		}		case 0x4: { /* 4004h - APU Volume/Decay Channel 2 (Rectangle) */			this.__rectangle1__decayCounter = this.__rectangle1__volumeOrDecayRate = 0x00 & 15;			this.__rectangle1__decayEnabled = (0x00 & 16) == 0;			this.__rectangle1__loopEnabled = (0x00 & 32) == 32;			switch(0x00 >> 6)			{			case 0:				this.__rectangle1__dutyRatio = 2;				break;			case 1:				this.__rectangle1__dutyRatio = 4;				break;			case 2:				this.__rectangle1__dutyRatio = 8;				break;			case 3:				this.__rectangle1__dutyRatio = 12;				break;			}			break;		}		case 0x5: { /* 4005h - APU Sweep Channel 2 (Rectangle) */			this.__rectangle1__sweepShiftAmount = 0x00 & 7;			this.__rectangle1__sweepIncreased = (0x00 & 0x8) === 0x0;			this.__rectangle1__sweepCounter = this.__rectangle1__sweepUpdateRatio = (0x00 >> 4) & 3;			this.__rectangle1__sweepEnabled = (0x00&0x80) === 0x80;			break;		}		case 0x6: { /* 4006h - APU Frequency Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x0700) | (0x00);			break;		}		case 0x7: { /* 4007h - APU Length Channel 2 (Rectangle) */			this.__rectangle1__frequency = (this.__rectangle1__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__rectangle1__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Writing to the length registers restarts the length (obviously),			and also restarts the duty cycle (channel 1,2 only), */			this.__rectangle1__dutyCounter = 0;			/* and restarts the decay volume (channel 1,2,4 only). */			this.__rectangle1__decayReloaded = true;			break;		}		case 0x8: { /* 4008h - APU Linear Counter Channel 3 (Triangle) */			this.__triangle__enableLinearCounter = ((0x00 & 128) == 128);			this.__triangle__linearCounterBuffer = 0x00 & 127;			break;		}		case 0x9: { /* 4009h - APU N/A Channel 3 (Triangle) */			/* unused */			break;		}		case 0xA: { /* 400Ah - APU Frequency Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x0700) | 0x00;			break;		}		case 0xB: { /* 400Bh - APU Length Channel 3 (Triangle) */			this.__triangle__frequency = (this.__triangle__frequency & 0x00ff) | ((0x00 & 7) << 8);			this.__triangle__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* Side effects 	Sets the halt flag */			this.__triangle__haltFlag = true;			break;		}		case 0xC: { /* 400Ch - APU Volume/Decay Channel 4 (Noise) */			this.__noize__decayCounter = this.__noize__volumeOrDecayRate = 0x00 & 15;			this.__noize__decayEnabled = (0x00 & 16) == 0;			this.__noize__loopEnabled = (0x00 & 32) == 32;			break;		}		case 0xd: { /* 400Dh - APU N/A Channel 4 (Noise) */			/* unused */			break;		}		case 0xe: { /* 400Eh - APU Frequency Channel 4 (Noise) */			this.__noize__modeFlag = (0x00 & 128) == 128;			this.__noize__frequency = this.__noize__FrequencyTable[0x00 & 15];			break;		}		case 0xF: { /* 400Fh - APU Length Channel 4 (Noise) */			/* Writing to the length registers restarts the length (obviously), */			this.__noize__lengthCounter = this.__audio__LengthCounterConst[0x00 >> 3];			/* and restarts the decay volume (channel 1,2,4 only). */			this.__noize__decayReloaded = true;			break;		}		/* ------------------------------------ DMC ----------------------------------------------------- */		case 0x10: { /* 4010h - DMC Play mode and DMA frequency */			this.__digital__irqEnabled = (0x00 & 128) == 128;			if(!this.__digital__irqEnabled){				this.IRQ &= 253;			}			this.__digital__loopEnabled = (0x00 & 64) == 64;			this.__digital__frequency = this.__digital__FrequencyTable[0x00 & 0xf];			break;		}		case 0x11: { /* 4011h - DMC Delta counter load register */			this.__digital__deltaCounter = 0x00 & 0x7f;			break;		}		case 0x12: { /* 4012h - DMC address load register */			this.__digital__sampleAddr = 0xc000 | (0x00 << 6);			break;		}		case 0x13: { /* 4013h - DMC length register */			this.__digital__sampleLength = this.__digital__sampleLengthBuffer = (0x00 << 4) | 1;			break;		}		case 0x14: { /* 4014h execute Sprite DMA */			/** @type {number} uint16_t */			var __audio__dma__addrMask = 0x00 << 8;			var __video__spRam = this.__video__spRam;			var __video__spriteAddr = this.__video__spriteAddr;			for(var i=0;i<256;++i){				var __audio__dma__addr__ = __audio__dma__addrMask | i;				var __audio_dma__val;				switch((__audio__dma__addr__ & 0xE000) >> 13){	case 0:{ /* 0x0000 -> 0x2000 */		__audio_dma__val = __cpu__ram[__audio__dma__addr__ & 0x7ff];		break;	}	case 1:{ /* 0x2000 -> 0x4000 */		__audio_dma__val = this.__video__readReg(__audio__dma__addr__);		break;	}	case 2:{ /* 0x4000 -> 0x6000 */		if(__audio__dma__addr__ === 0x4015){		 	/* Clears the frame interrupt flag after being read (but not the DMC interrupt flag).			   If an interrupt flag was set at the same moment of the read, it will read back as 1 but it will not be cleared. */			__audio_dma__val =					( (this.__rectangle0__lengthCounter != 0 && this.__rectangle0__frequency >= 0x8 && this.__rectangle0__frequency  < 0x800)	? 1 : 0)					|((this.__rectangle1__lengthCounter != 0 && this.__rectangle1__frequency >= 0x8 && this.__rectangle1__frequency  < 0x800) ? 2 : 0)					|((this.__triangle__lengthCounter != 0 && this.__triangle__linearCounter != 0) ? 4 : 0)					|((this.__noize__lengthCounter != 0) ? 8 : 0)					|((this.__digital__sampleLength != 0) ? 16 : 0)					|(((this.IRQ & 1)) ? 64 : 0)					|((this.IRQ & 2) ? 128 : 0);			this.IRQ &= 254;			this.IRQ &= 253;		}else if(__audio__dma__addr__ === 0x4016){			__audio_dma__val = (this.__pad__pad1Fairy.state >> ((this.__pad__pad1Idx++) & 7)) & 0x1;		}else if(__audio__dma__addr__ === 0x4017){			__audio_dma__val = (this.__pad__pad2Fairy.state >> ((this.__pad__pad2Idx++) & 7)) & 0x1;		}else if(addr < 0x4018){			throw new cycloa.err.CoreException('[FIXME] Invalid addr: 0x'+__audio__dma__addr__.toString(16));		}else{			__audio_dma__val = this.readMapperRegisterArea(addr);		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		__audio_dma__val = 0;		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}	case 7:{ /* 0xE000 -> 0xffff */		__audio_dma__val = __cpu__rom[(__audio__dma__addr__>>10) & 31][__audio__dma__addr__ & 0x3ff];		break;	}}				__video__spRam[(__video__spriteAddr+i) & 0xff] = __audio_dma__val;			}			__vm__clockDelta += 512;			break;		}		/* ------------------------------ CTRL -------------------------------------------------- */		case 0x15: { /* __audio__analyzeStatusRegister */			if(!(0x00 & 1)) this.__rectangle0__lengthCounter = 0;			if(!(0x00 & 2)) this.__rectangle1__lengthCounter = 0;			if(!(0x00 & 4)) { this.__triangle__lengthCounter = 0; this.__triangle__linearCounter = this.__triangle__linearCounterBuffer = 0; }			if(!(0x00 & 8)) this.__noize__lengthCounter = 0;			if(!(0x00 & 16)) { this.__digital__sampleLength = 0; }else if(this.__digital__sampleLength == 0){ this.__digital__sampleLength = this.__digital__sampleLengthBuffer;}			break;		}		case 0x16: {			if((0x00 & 1) === 1){				this.__pad__pad1Idx = 0;				this.__pad__pad2Idx = 0;			}			break;		}		case 0x17: { /* __audio__analyzeLowFrequentryRegister */			/* Any write to $4017 resets both the frame counter, and the clock divider. */			if(0x00 & 0x80) {				this.__audio__isNTSCmode = false;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 4;			}else{				this.__audio__isNTSCmode = true;				this.__audio__frameIRQenabled = true;				this.__audio__frameCnt = 1786360;				this.__audio__frameIRQCnt = 3;			}			if((0x00 & 0x40) === 0x40){				this.__audio__frameIRQenabled = false;				this.IRQ &= 254;			}			break;		}		default: {			/* this.writeMapperRegisterArea(0x4015, 0x00); */			break;		}		}		break;	}	case 3:{ /* 0x6000 -> 0x8000 */		break;	}	case 4:{ /* 0x8000 -> 0xA000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 5:{ /* 0xA000 -> 0xC000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 6:{ /* 0xC000 -> 0xE000 */		this.writeMapperCPU(0x4015, 0x00);		break;	}	case 7:{ /* 0xE000 -> 0xffff */		this.writeMapperCPU(0x4015, 0x00);		break;	}}	//this.PC = (read(0xFFFC) | (read(0xFFFD) << 8));
	this.PC = (this.__cpu__rom[31][0x3FC]| (this.__cpu__rom[31][0x3FD] << 8));
};

cycloa.VirtualMachine.ZNFlagCache = new Uint8Array([
	0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80,
	0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0x80
]);

cycloa.VirtualMachine.TransTable = new Uint32Array([459499, 393688, 255, 255, 255, 197073, 327905, 255, 197195, 131536, 131323, 255, 255, 262612, 393444, 255, 131994, 328153, 255, 255, 255, 262610, 393442, 255, 131707, 262614, 255, 255, 255, 262613, 393445, 255, 394036, 393432, 255, 255, 196865, 196817, 328161, 255, 262763, 131280, 131579, 255, 262404, 262356, 393700, 255, 131962, 327897, 255, 255, 255, 262354, 393698, 255, 131771, 262358, 255, 255, 255, 262357, 393701, 255, 394011, 393592, 255, 255, 255, 196977, 328113, 255, 197179, 131440, 131531, 255, 197412, 262516, 393652, 255, 132010, 328057, 255, 255, 255, 262514, 393650, 255, 131739, 262518, 255, 255, 255, 262517, 393653, 255, 393995, 393416, 255, 255, 255, 196801, 328193, 255, 262747, 131264, 131611, 255, 328487, 262340, 393732, 255, 132026, 327881, 255, 255, 255, 262338, 393730, 255, 131803, 262342, 255, 255, 255, 262341, 393733, 255, 255, 393272, 255, 255, 196689, 196657, 196673, 255, 131435, 255, 131227, 255, 262228, 262196, 262212, 255, 131914, 327737, 255, 255, 262226, 262194, 262211, 255, 131259, 262198, 131243, 255, 255, 262197, 255, 255, 131104, 393224, 131088, 255, 196641, 196609, 196625, 255, 131195, 131072, 131179, 255, 262180, 262148, 262164, 255, 131930, 327689, 255, 255, 262178, 262146, 262163, 255, 131755, 262150, 131211, 255, 262181, 262149, 262166, 255, 131376, 393496, 255, 255, 196913, 196881, 328001, 255, 131499, 131344, 131419, 255, 262452, 262420, 393540, 255, 131978, 327961, 255, 255, 255, 262418, 393538, 255, 131723, 262422, 255, 255, 255, 262421, 393541, 255, 131360, 393768, 255, 255, 196897, 197153, 328065, 255, 131483, 131616, 131835, 255, 262436, 262692, 393604, 255, 131946, 328233, 255, 255, 255, 262690, 393602, 255, 131787, 262694, 255, 255, 255, 262693, 393605, 255]);



cycloa.VirtualMachine.prototype.__video__onHardReset= function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	for(var i=0;i< 4;++i) {
		var iv = this.__video__internalVram[i];
		for(var j=0;j<0x400; ++j){
			iv[j] = 0;
		}
	}
	for(var i=0;i< 256;++i) {
		this.__video__spRam[i] = 0;
	}
	for(var i=0;i< 36;++i) {
		this.__video__palette[i] = 0;
	}
	this.__video__nowY=0;
	this.__video__nowX=0;
	//0x2000
	this.__video__executeNMIonVBlank = false;
	this.__video__spriteHeight = 8;
	this.__video__patternTableAddressBackground = 0x0000;
	this.__video__patternTableAddress8x8Sprites = 0x0000;
	this.__video__vramIncrementSize = 1;
	//0x2005 & 0x2000
	this.__video__vramAddrReloadRegister = 0x0000;
	this.__video__horizontalScrollBits = 0;
	//0x2001
	this.__video__colorEmphasis = 0;
	this.__video__spriteVisibility = false;
	this.__video__backgroundVisibility = false;
	this.__video__spriteClipping = true;
	this.__video__backgroundClipping = true;
	this.__video__paletteMask = 0x3f;
	//0x2003
	this.__video__spriteAddr = 0;
	//0x2005/0x2006
	this.__video__vramAddrRegisterWritten = false;
	this.__video__scrollRegisterWritten = false;
	//0x2006
	this.__video__vramAddrRegister = 0;
};
cycloa.VirtualMachine.prototype.__video__onReset = function() {
	//from http://wiki.nesdev.com/w/index.php/PPU_power_up_state
	//0x2000
	this.__video__executeNMIonVBlank = false;
	this.__video__spriteHeight = 8;
	this.__video__patternTableAddressBackground = 0x0000;
	this.__video__patternTableAddress8x8Sprites = 0x0000;
	this.__video__vramIncrementSize = 1;
	//0x2005 & 0x2000
	this.__video__vramAddrReloadRegister = 0x0000;
	this.__video__horizontalScrollBits = 0;
	//0x2001
	this.__video__colorEmphasis = 0;
	this.__video__spriteVisibility = false;
	this.__video__backgroundVisibility = false;
	this.__video__spriteClipping = true;
	this.__video__backgroundClipping = true;
	this.__video__paletteMask = 0x3f;
	//0x2005/0x2006
	this.__video__vramAddrRegisterWritten = false;
	this.__video__scrollRegisterWritten = false;
	//0x2007
	this.__video__vramBuffer = 0;
};

cycloa.VirtualMachine.prototype.__video__spriteEval = function() {
	/**
	 * @type {Uint8Array}
	 * @const
	 */
	var spRam = this.__video__spRam;
	/**
	 * @type {number}
	 * @const
	 */
	var y = this.__video__nowY-1;
	/** @type {number} */
	var _spriteHitCnt = 0;
	this.__video__lostSprites = false;
	/**
	 * @type {number}
	 * @const
	 */
	var _sprightHeight = this.__video__spriteHeight;
	/**
	 * @type {boolean}
	 * @const
	 */	
	var bigSprite = _sprightHeight === 16;
	/**
	 * @type {object[]}
	 * @const
	 */
	var spriteTable = this.__video__spriteTable;
	/**
	 * @type {number}
	 * @const
	 */
	var spriteTileAddrBase = this.__video__patternTableAddress8x8Sprites;
	for(var i=0;i<256;i+=4){
		/** @type {number} */
		var spY = spRam[i]+1;
		/** @type {number} */
		var spYend = spY+_sprightHeight;
		/** @type {boolean} */
		var hit = false;
		if(spY <= y && y < spYend){//Hit!
			if(_spriteHitCnt < 8){
				hit = true;
				/** type {object} */
				var slot = spriteTable[_spriteHitCnt];
				slot.idx = i>>2;
				slot.y = spY;
				slot.x = spRam[i+3];
				if(bigSprite){
					//8x16
					/**
					 * @type {number}
					 * @const
					 */
					var val = spRam[i+1];
					slot.tileAddr = (val & 1) << 12 | (val & 0xfe) << 4;
				}else{
					//8x8
					slot.tileAddr = (spRam[i+1] << 4) | spriteTileAddrBase;
				}
				/**
				 * @type {number}
				 * @const
				 */
				var attr = spRam[i+2];
				slot.paletteNo = 4 | (attr & 3);
				slot.isForeground = (attr & (1<<5)) === 0;
				slot.flipHorizontal = (attr & (1<<6)) !== 0;
				slot.flipVertical = (attr & (1<<7)) !== 0;
				_spriteHitCnt++;
			}else{
				//本当はもっと複雑な仕様みたいなものの、省略。
				//http://wiki.nesdev.com/w/index.php/PPU_sprite_evaluation
				this.__video__lostSprites = true;
				break;
			}
		}
	}
	//残りは無効化
	this.__video__spriteHitCnt = _spriteHitCnt;
	for(var i=_spriteHitCnt;i< 8;i++){
		spriteTable[i].y=255;
	}
};

cycloa.VirtualMachine.prototype.__video__buildBgLine = function(){
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;	var _color = 0 | __video__palette[32];
	if(!this.__video__backgroundVisibility) {
		var _color32 = _color << 24 | _color << 16 | _color << 8 | _color;
		for(var i=((nowY-1) << 6), max=i+64; i<max; ++i) screenBuffer32[i] = _color32;
		return;
	}
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var buffOffset = (this.__video__nowY-1) << 8;
	/**
	 * @type {number} uint16_t
	 */
	var nameTableAddr = 0x2000 | (this.__video__vramAddrRegister & 0xfff);
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var offY = (this.__video__vramAddrRegister >> 12);
	/**
	 * @type {number} uint8_t
	 */
	var offX = this.__video__horizontalScrollBits;

	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var bgTileAddrBase = this.__video__patternTableAddressBackground;
	
	var renderX=0;

	while(true){
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var tileNo = (((nameTableAddr & 0x3f00) !== 0x3f00) ? (nameTableAddr < 0x2000 ? __video__pattern[(nameTableAddr >> 9) & 0xf][nameTableAddr & 0x1ff] : __video__vramMirroring[(nameTableAddr >> 10) & 0x3][nameTableAddr & 0x3ff]) : ((nameTableAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[nameTableAddr & 31]) );
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var tileYofScreen = (nameTableAddr & 0x03e0) >> 5;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var palAddr = ((nameTableAddr & 0x2f00) | 0x3c0 | ((tileYofScreen & 0x1C) << 1) | ((nameTableAddr >> 2) & 7));
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var palNo =
				(
					(((palAddr & 0x3f00) !== 0x3f00) ? (palAddr < 0x2000 ? __video__pattern[(palAddr >> 9) & 0xf][palAddr & 0x1ff] : __video__vramMirroring[(palAddr >> 10) & 0x3][palAddr & 0x3ff]) : ((palAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[palAddr & 31]) )								>> (((tileYofScreen & 2) << 1) | (nameTableAddr & 2))
				) & 0x3;

		//タイルのサーフェイスデータを取得
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var off = bgTileAddrBase | (tileNo << 4) | offY;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var firstPlane = (((off & 0x3f00) !== 0x3f00) ? (off < 0x2000 ? __video__pattern[(off >> 9) & 0xf][off & 0x1ff] : __video__vramMirroring[(off >> 10) & 0x3][off & 0x3ff]) : ((off & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[off & 31]) );
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlaneAddr = off+8;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = (((secondPlaneAddr & 0x3f00) !== 0x3f00) ? (secondPlaneAddr < 0x2000 ? __video__pattern[(secondPlaneAddr >> 9) & 0xf][secondPlaneAddr & 0x1ff] : __video__vramMirroring[(secondPlaneAddr >> 10) & 0x3][secondPlaneAddr & 0x3ff]) : ((secondPlaneAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[secondPlaneAddr & 31]) );
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var paletteOffset = palNo << 2; /* *4 */
		//書く！
		for(var x=offX;x<8;x++){
			/**
			 * @type {number} uint8_t
			 * @const
			 */
			var color = ((firstPlane >> (7-x)) & 1) | (((secondPlane >> (7-x)) & 1)<<1);
			if(color !== 0){
				__video__screenBuffer8[buffOffset+renderX] = __video__palette[paletteOffset+color] | 128;
			}else{
				__video__screenBuffer8[buffOffset+renderX] = _color;
			}
			renderX++;
			if(renderX >= 256){
				return;
			}
		}
		if((nameTableAddr & 0x001f) === 0x001f){
			nameTableAddr &= 0xFFE0;
			nameTableAddr ^= 0x400;
		}else{
			nameTableAddr++;
		}
		offX = 0;//次からは最初のピクセルから書ける。
	}
};

cycloa.VirtualMachine.prototype.__video__buildSpriteLine = function(){
	if(!this.__video__spriteVisibility){
		return;
	}
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var y = this.__video__nowY-1;
	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var _spriteHeight = this.__video__spriteHeight;
	/**
	 * @type {boolean} bool
	 */
	var searchSprite0Hit = !this.__video__sprite0Hit;
	/**
	 * @type {number} uint16_t
	 * @const
	 */
	var _spriteHitCnt = this.__video__spriteHitCnt;
	/**
	 * @type {number} uint8_t
	 * @const
	 */
	var buffOffset = (this.__video__nowY-1) << 8;
	//readVram(this.__video__spriteTable[0].tileAddr); //FIXME: 読み込まないと、MMC4が動かない。
	for(var i=0;i<_spriteHitCnt;i++){
		/**
		 * @type {object} struct SpriteSlot&
		 * @const
		 */
		var slot = this.__video__spriteTable[i];
		searchSprite0Hit &= (slot.idx === 0);
		/**
		 * @type {number} uint16_t
		 */
		var offY = 0;

		if(slot.flipVertical){
			offY = _spriteHeight+slot.y-y-1;
		}else{
			offY = y-slot.y;
		}
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var off = slot.tileAddr | ((offY & 0x8) << 1) | (offY&7);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var firstPlane = (((off & 0x3f00) !== 0x3f00) ? (off < 0x2000 ? __video__pattern[(off >> 9) & 0xf][off & 0x1ff] : __video__vramMirroring[(off >> 10) & 0x3][off & 0x3ff]) : ((off & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[off & 31]) );
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlaneAddr = off+8;
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var secondPlane = (((secondPlaneAddr & 0x3f00) !== 0x3f00) ? (secondPlaneAddr < 0x2000 ? __video__pattern[(secondPlaneAddr >> 9) & 0xf][secondPlaneAddr & 0x1ff] : __video__vramMirroring[(secondPlaneAddr >> 10) & 0x3][secondPlaneAddr & 0x3ff]) : ((secondPlaneAddr & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[secondPlaneAddr & 31]) );
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var _tmp_endX = 256-slot.x;
		/**
		 * @type {number} uint16_t
		 * @const
		 */
		var endX = _tmp_endX < 8 ? _tmp_endX : 8;//std::min(screenWidth-slot.x, 8);
		/**
		 * @type {number} uint8_t
		 * @const
		 */
		var layerMask = slot.isForeground ? 192 : 64;
		if(slot.flipHorizontal){
			for(var x=0;x<endX;x++){
				/**
				 * @type {number} uint8_t
				 */
				var color = ((firstPlane >> x) & 1) | (((secondPlane >> x) & 1)<<1); //ここだけ違います
				/**
				 * @type {number} uint8_t
				 */
				var target = __video__screenBuffer8[buffOffset + slot.x + x];
				/**
				 * @type {boolean} bool
				 */
				var isEmpty = (target & 192) === 0;
				/**
				 * @type {boolean} bool
				 */
				var isBackgroundDrawn = (target & 192) === 128;
				/**
				 * @type {boolean} bool
				 */
				var isSpriteNotDrawn = (target & 64) === 0;
				if(searchSprite0Hit && (color !== 0 && isBackgroundDrawn)){
					this.__video__sprite0Hit = true;
					searchSprite0Hit = false;
				}
				if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
					__video__screenBuffer8[buffOffset + slot.x + x] = __video__palette[(slot.paletteNo<<2) + color] | layerMask;
				}
			}
		}else{
			for(var x=0;x<endX;x++){
				/**
				 * @type {number} uint8_t
				 * @const
				 */
				var color = ((firstPlane >> (7-x)) & 1) | (((secondPlane >> (7-x)) & 1)<<1); //ここだけ違います
				/**
				 * @type {number} uint8_t
				 * @const
				 */
				var target = __video__screenBuffer8[buffOffset + slot.x + x];
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isEmpty = (target & 192) === 0;
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isBackgroundDrawn = (target & 192) === 128;
				/**
				 * @type {boolean} bool
				 * @const
				 */
				var isSpriteNotDrawn = (target & 64) === 0;
				if(searchSprite0Hit && (color !== 0 && isBackgroundDrawn)){
					this.__video__sprite0Hit = true;
					searchSprite0Hit = false;
				}
				if(color != 0 && ((!slot.isForeground && isEmpty) || (slot.isForeground &&  isSpriteNotDrawn))){
					__video__screenBuffer8[buffOffset + slot.x + x] = __video__palette[(slot.paletteNo<<2) + color] | layerMask;
				}
			}
		}
	}
};

cycloa.VirtualMachine.prototype.__video__writeReg = function(/* uint16_t */ addr, /* uint8_t */ value) {
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;
	switch(addr & 0x07) {
		/* PPU Control and Status Registers */
		case 0x00: { //2000h - PPU Control Register 1 (W)
			this.__video__executeNMIonVBlank = ((value & 0x80) === 0x80) ? true : false;
			this.__video__spriteHeight = ((value & 0x20) === 0x20) ? 16 : 8;
			this.__video__patternTableAddressBackground = (value & 0x10) << 8;
			this.__video__patternTableAddress8x8Sprites = (value & 0x8) << 9;
			this.__video__vramIncrementSize = ((value & 0x4) === 0x4) ? 32 : 1;
			this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0x73ff) | ((value & 0x3) << 10);
			break;
		}
		case 0x01: { //2001h - PPU Control Register 2 (W)
			this.__video__colorEmphasis = value >> 5; //FIXME: この扱い、どーする？
			this.__video__spriteVisibility = ((value & 0x10) === 0x10) ? true : false;
			this.__video__backgroundVisibility = ((value & 0x08) == 0x08) ? true : false;
			this.__video__spriteClipping = ((value & 0x04) === 0x04) ? false : true;
			this.__video__backgroundClipping = ((value & 0x2) === 0x02) ? false : true;
			this.__video__paletteMask = ((value & 0x1) === 0x01) ? 0x30 : 0x3f;
			break;
		}
		//case 0x02: //2002h - PPU Status Register (R)
		/* PPU SPR-RAM Access Registers */
		case 0x03: { //2003h - SPR-RAM Address Register (W)
			this.__video__spriteAddr = value;
			break;
		}
		case 0x04: { //2004h - SPR-RAM Data Register (Read/Write)
			spRam[this.__video__spriteAddr] = value;
			this.__video__spriteAddr = (this.__video__spriteAddr+1) & 0xff;
			break;
		}
		/* PPU VRAM Access Registers */
		case 0x05: { //PPU Background Scrolling Offset (W2)
			if(this.__video__scrollRegisterWritten){ //Y
				this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0x8C1F) | ((value & 0xf8) << 2) | ((value & 7) << 12);
			}else{ //X
				this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0xFFE0) | value >> 3;
				this.__video__horizontalScrollBits = value & 7;
			}
			this.__video__scrollRegisterWritten = !this.__video__scrollRegisterWritten;
			break;
		}
		case 0x06: { //VRAM Address Register (W2)
			if(this.__video__vramAddrRegisterWritten){
				this.__video__vramAddrReloadRegister = (this.__video__vramAddrReloadRegister & 0x7f00) | value;
				this.__video__vramAddrRegister = this.__video__vramAddrReloadRegister & 0x3fff;
			} else {
				this.__video__vramAddrReloadRegister =(this.__video__vramAddrReloadRegister & 0x00ff) | ((value & 0x7f) << 8);
			}
			this.__video__vramAddrRegisterWritten = !this.__video__vramAddrRegisterWritten;
			break;
		}
		case 0x07: { //VRAM Read/Write Data Register (RW)
			this.__video__writeVram(this.__video__vramAddrRegister, value);
			this.__video__vramAddrRegister = (this.__video__vramAddrRegister + this.__video__vramIncrementSize) & 0x3fff;
			break;
		}
		default: {
			throw new cycloa.err.CoreException("Invalid addr: 0x"+addr.toString(16));
		}
	}
};

cycloa.VirtualMachine.prototype.__video__readReg = function(/* uint16_t */ addr)
{
	var __video__palette = this.__video__palette; var __video__vramMirroring = this.__video__vramMirroring; var __video__pattern = this.__video__pattern; var __video__screenBuffer8 = this.__video__screenBuffer8;var __video__screenBuffer32 = this.__video__screenBuffer32;	switch(addr & 0x07)
	{
		/* PPU Control and Status Registers */
		//case 0x00: //2000h - PPU Control Register 1 (W)
		//case 0x01: //2001h - PPU Control Register 2 (W)
		case 0x02: { //2002h - PPU Status Register (R)
			//from http://nocash.emubase.de/everynes.htm#pictureprocessingunitppu
			this.__video__vramAddrRegisterWritten = false;
			this.__video__scrollRegisterWritten = false;
			//Reading resets the 1st/2nd-write flipflop (used by Port 2005h and 2006h).
			/**
			 * @const
			 * @type {number} uint8_t
			 */
			var result =
					((this.__video__nowOnVBnank) ? 128 : 0)
				|   ((this.__video__sprite0Hit) ? 64 : 0)
				|   ((this.__video__lostSprites) ? 32 : 0);
			this.__video__nowOnVBnank = false;
			return result;
		}
		/* PPU SPR-RAM Access Registers */
		//case 0x03: //2003h - SPR-RAM Address Register (W)
		case 0x04: { //2004h - SPR-RAM Data Register (Read/Write)
			return this.__video__spRam[this.__video__spriteAddr];
		}
		/* PPU VRAM Access Registers */
		//case 0x05: //PPU Background Scrolling Offset (W2)
		//case 0x06: //VRAM Address Register (W2)
		case 0x07: { //VRAM Read/Write Data Register (RW)
			var vramAddrRegister = this.__video__vramAddrRegister;
			if((vramAddrRegister & 0x3f00) !== 0x3f00){
				/**
				 * @type {number} uint8_t */
				var ret = this.__video__vramBuffer;
				this.__video__vramBuffer = (vramAddrRegister < 0x2000 ? __video__pattern[(vramAddrRegister >> 9) & 0xf][vramAddrRegister & 0x1ff] : __video__vramMirroring[(vramAddrRegister >> 10) & 0x3][vramAddrRegister & 0x3ff]);
				this.__video__vramAddrRegister = (vramAddrRegister + this.__video__vramIncrementSize) & 0x3fff;
				return ret;
			} else {
				/**
				 * @type {number} uint8_t */
				var ret = ((vramAddrRegister & 0x3 === 0) ? __video__palette[32 | ((addr >> 2) & 3)] : __video__palette[vramAddrRegister & 31]);
				this.__video__vramBuffer = (vramAddrRegister < 0x2000 ? __video__pattern[(vramAddrRegister >> 9) & 0xf][vramAddrRegister & 0x1ff] : __video__vramMirroring[(vramAddrRegister >> 10) & 0x3][vramAddrRegister & 0x3ff]); //ミラーされてるVRAMにも同時にアクセスしなければならない。
				this.__video__vramAddrRegister = (vramAddrRegister + this.__video__vramIncrementSize) & 0x3fff;
				return ret;
			}
		}
		default: {
			return 0;
//			throw EmulatorException() << "Invalid addr: 0x" << std::hex << addr;
		}
	}
};


cycloa.VirtualMachine.prototype.__video__writeVramExternal = function(/* uint16_t */ addr, /* uint8_t */ value)
{
	if(addr < 0x2000) {
	} else {
		this.__video__vramMirroring[(addr >> 10) & 0x3][addr & 0x3ff] = value;
	}
};


cycloa.VirtualMachine.prototype.__video__writeVram = function(/* uint16_t */ addr, /* uint8_t */ value) {
	if((addr & 0x3f00) !== 0x3f00){
		this.__video__writeVramExternal(addr, value);
	}else{
		if((addr & 0x3) === 0){ /* writePalette */
			this.__video__palette[32 | ((addr >> 2) & 3)] = value & 0x3f;
		}else{
			this.__video__palette[addr & 31] = value & 0x3f;
		}
	}
};

/**
 * @type {number} mirrorType
 */
cycloa.VirtualMachine.prototype.__video__changeMirrorType = function(/* NesFile::MirrorType */ mirrorType) {
	this.__video__mirrorType = mirrorType;
	switch(mirrorType)
	{
	case 3: {
		this.__video__vramMirroring[0] = this.__video__internalVram[0];
		this.__video__vramMirroring[1] = this.__video__internalVram[0];
		this.__video__vramMirroring[2] = this.__video__internalVram[0];
		this.__video__vramMirroring[3] = this.__video__internalVram[0];
		break;
	}
	case 4: {
		this.__video__vramMirroring[0] = this.__video__internalVram[1];
		this.__video__vramMirroring[1] = this.__video__internalVram[1];
		this.__video__vramMirroring[2] = this.__video__internalVram[1];
		this.__video__vramMirroring[3] = this.__video__internalVram[1];
		break;
	}
	case 0: {
		this.__video__vramMirroring[0] = this.__video__internalVram[1];
		this.__video__vramMirroring[1] = this.__video__internalVram[2];
		this.__video__vramMirroring[2] = this.__video__internalVram[3];
		this.__video__vramMirroring[3] = this.__video__internalVram[4];
		break;
	}
	case 2: {
		this.__video__vramMirroring[0] = this.__video__internalVram[0];
		this.__video__vramMirroring[1] = this.__video__internalVram[0];
		this.__video__vramMirroring[2] = this.__video__internalVram[1];
		this.__video__vramMirroring[3] = this.__video__internalVram[1];
		break;
	}
	case 1: {
		this.__video__vramMirroring[0] = this.__video__internalVram[0];
		this.__video__vramMirroring[1] = this.__video__internalVram[1];
		this.__video__vramMirroring[2] = this.__video__internalVram[0];
		this.__video__vramMirroring[3] = this.__video__internalVram[1];
		break;
	}
	default: {
		throw new cycloa.err.CoreException("Invalid mirroring type!");
	}
	}
};



cycloa.VirtualMachine.prototype.__audio__onHardReset = function() {
	this.__audio__clockCnt = 0;
	this.__audio__leftClock = 0;

	this.__audio__frameIRQenabled = true;
	this.IRQ &= 254;
	this.__audio__isNTSCmode = true;
	this.__audio__frameIRQCnt = 0;
	this.__audio__frameCnt = 0;
};
cycloa.VirtualMachine.prototype.__audio__onReset = function() {
};

cycloa.VirtualMachine.LengthCounterConst = [
		0x0A,0xFE,0x14,0x02,0x28,0x04,0x50,0x06,
		0xA0,0x08,0x3C,0x0A,0x0E,0x0C,0x1A,0x0E,
		0x0C,0x10,0x18,0x12,0x30,0x14,0x60,0x16,
		0xC0,0x18,0x48,0x1A,0x10,0x1C,0x20,0x1E
];


cycloa.VirtualMachine.prototype.__rectangle1__onHardReset = function() {
	this.__rectangle1__volumeOrDecayRate = 0;
	this.__rectangle1__decayReloaded = false;
	this.__rectangle1__decayEnabled = false;
	this.__rectangle1__decayVolume = 0;
	this.__rectangle1__dutyRatio = 0;
	this.__rectangle1__freqCounter = 0;
	this.__rectangle1__dutyCounter = 0;
	this.__rectangle1__decayCounter = 0;
	this.__rectangle1__sweepEnabled = 0;
	this.__rectangle1__sweepShiftAmount = 0;
	this.__rectangle1__sweepIncreased = false;
	this.__rectangle1__sweepUpdateRatio = 0;
	this.__rectangle1__sweepCounter = 0;
	this.__rectangle1__frequency = 0;
	this.__rectangle1__loopEnabled = false;
	this.__rectangle1__lengthCounter = 0;
};
cycloa.VirtualMachine.prototype.__rectangle1__onReset = function(){
	this.__rectangle1__onHardReset();
};


cycloa.VirtualMachine.prototype.__rectangle0__onHardReset = function() {
	this.__rectangle0__volumeOrDecayRate = 0;
	this.__rectangle0__decayReloaded = false;
	this.__rectangle0__decayEnabled = false;
	this.__rectangle0__decayVolume = 0;
	this.__rectangle0__dutyRatio = 0;
	this.__rectangle0__freqCounter = 0;
	this.__rectangle0__dutyCounter = 0;
	this.__rectangle0__decayCounter = 0;
	this.__rectangle0__sweepEnabled = 0;
	this.__rectangle0__sweepShiftAmount = 0;
	this.__rectangle0__sweepIncreased = false;
	this.__rectangle0__sweepUpdateRatio = 0;
	this.__rectangle0__sweepCounter = 0;
	this.__rectangle0__frequency = 0;
	this.__rectangle0__loopEnabled = false;
	this.__rectangle0__lengthCounter = 0;
};
cycloa.VirtualMachine.prototype.__rectangle0__onReset = function(){
	this.__rectangle0__onHardReset();
};

cycloa.VirtualMachine.prototype.__triangle__onHardReset = function(){
	this.__triangle__haltFlag = false;
	this.__triangle__enableLinearCounter = false;
	this.__triangle__frequency = 0;
	this.__triangle__linearCounterBuffer = 0;
	this.__triangle__linearCounter = 0;
	this.__triangle__lengthCounter = 0;
	this.__triangle__freqCounter = 0;
	this.__triangle__streamCounter = 0;
}
cycloa.VirtualMachine.prototype.__triangle__onReset = function()
{
	this.__triangle__onHardReset();
}



cycloa.VirtualMachine.prototype.__noize__onHardReset = function() {
	//rand
	this.__noize__shiftRegister = 1<<14;
	this.__noize__modeFlag = false;

	//decay
	this.__noize__volumeOrDecayRate = false;
	this.__noize__decayReloaded = false;
	this.__noize__decayEnabled = false;

	this.__noize__decayCounter = 0;
	this.__noize__decayVolume = 0;
	//
	this.__noize__loopEnabled = false;
	this.__noize__frequency = 0;
	//
	this.__noize__lengthCounter = 0;
	//
	this.__noize__freqCounter = 0;
};
cycloa.VirtualMachine.prototype.__noize__onReset = function() {
	this.__noize__onHardReset();
};


cycloa.VirtualMachine.prototype.__digital__isIRQEnabled = function()
{
	return this.__digital__irqEnabled;
}
cycloa.VirtualMachine.prototype.__digital__onHardReset = function() {
	this.__digital__irqEnabled = false;
	this.IRQ &= 253;	this.__digital__loopEnabled = false;
	this.__digital__frequency = 0;
	this.__digital__deltaCounter = 0;
	this.__digital__sampleAddr = 0xc000;
	this.__digital__sampleLength = 0;
	this.__digital__sampleLengthBuffer = 0;
	this.__digital__sampleBuffer = 0;
	this.__digital__sampleBufferLeft = 0;

	this.__digital__freqCounter = 0;
};
cycloa.VirtualMachine.prototype.__digital__onReset = function() {
	this.__digital__onHardReset();
};


/**
 * マッパーごとの初期化関数
 */
cycloa.VirtualMachine.Mapper = [];
cycloa.VirtualMachine.Mapper[0] = function(self){
	self.__mapper__writeMapperCPU = function(/* uint8_t */ addr){
		/*do nothing!*/
	};
	var idx = 0;
	for(var i=0; i<32; ++i){
		self.__cpu__rom[i] = self.__mapper__prgRom.subarray(idx, idx+=1024);
		if(idx >= self.__mapper__prgRom.length){
			idx = 0;
		}
	}
	var cidx = 0;
	for(var i=0;i<0x10; ++i){
		self.__video__pattern[i] = self.__mapper__chrRom.subarray(cidx, cidx += 512);
	}
};

/**
 * __cpu__romを解析してマッパーの初期化などを行う
 * @param {ArrayBuffer} __cpu__rom
 */
cycloa.VirtualMachine.prototype.load = function(rom){
	this.__mapper__parseROM(rom);
	// マッパー関数のインジェクション
	var mapperInit = cycloa.VirtualMachine.Mapper[this.__mapper__mapperNo];
	if(!mapperInit){
		throw new cycloa.err.NotSupportedException("Not supported mapper: "+this.__mapper__mapperNo);
	}
	mapperInit(this);
	this.__video__changeMirrorType(this.__mapper__mirrorType);
};

/**
 * __cpu__romをパースしてセットする
 * @param {ArrayBuffer} data
 */
cycloa.VirtualMachine.prototype.__mapper__parseROM = function(data){
	var data8 = new Uint8Array(data);
	/* check NES data8 */
	if(!(data8[0] === 0x4e && data8[1]===0x45 && data8[2]===0x53 && data8[3] == 0x1a)){
		throw new cycloa.err.CoreException("[FIXME] Invalid header!!");
	}
	this.__mapper__prgSize = 16384 * data8[4];
	this.__mapper__chrSize = 8192 * data8[5];
	this.__mapper__prgPageCnt = data8[4];
	this.__mapper__chrPageCnt = data8[5];
	this.__mapper__mapperNo = ((data8[6] & 0xf0)>>4) | (data8[7] & 0xf0);
	this.__mapper__trainerFlag = (data8[6] & 0x4) === 0x4;
	this.__mapper__sramFlag = (data8[6] & 0x2) === 0x2;
	if((data8[6] & 0x8) == 0x8){
		this.__mapper__mirrorType = 0;
	}else{
		this.__mapper__mirrorType = (data8[6] & 0x1) == 0x1 ? 1 : 2;
	}
	/**
	 * @type {number} uint32_t
	 */
	var fptr = 0x10;
	if(this.__mapper__trainerFlag){
		if(fptr + 512 > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
		this.__mapper__trainer = new Uint8Array(data, fptr, 512);
		fptr += 512;
	}
	/* read PRG __cpu__rom */
	if(fptr + this.__mapper__prgSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	this.__mapper__prgRom = new Uint8Array(data, fptr, this.__mapper__prgSize);
	fptr += this.__mapper__prgSize;

	if(fptr + this.__mapper__chrSize > data.byteLength) throw new cycloa.err.CoreException("[FIXME] Invalid file size; too short!");
	else if(fptr + this.__mapper__chrSize < data.byteLength) throw cycloa.err.CoreException("[FIXME] Invalid file size; too long!");

	this.__mapper__chrRom = new Uint8Array(data, fptr, this.__mapper__chrSize);
};



// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function () {
	return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

/**
 * @constructor
 * */
function VideoFairy() {
	this.screen_ = document.getElementById('nes_screen');
	this.zoomed_ = false;
	this.ctx_ = this.screen_.getContext('2d');
	this.image_ = this.ctx_.createImageData(256, 240);
	this.palette_ = cycloa.NesPalette;
	this.prevBuffer_ = new Uint8Array(256*240);
	for (var i = 0; i < 256 * 240; ++i) {
		this.image_.data[(i << 2) + 3] = 0xff;
	}
}
VideoFairy.prototype.__proto__ = cycloa.AbstractVideoFairy.prototype;
VideoFairy.prototype.dispatchRendering = function (/* const uint8_t*/ nesBuffer, /* const uint8_t */ paletteMask) {
	var dat = this.image_.data;
	var palette = this.palette_;
	var prevBuffer = this.prevBuffer_;
	var pixel;
	for (var i = 0; i < 61440 /* = 256*240 */; ++i) {
		//TODO: 最適化
		pixel = nesBuffer[i] & paletteMask;
		if(pixel != prevBuffer[i]){
			var idx = i << 2, color = palette[pixel];
			dat[idx    ] = (color >> 16) & 0xff;
			dat[idx + 1] = (color >> 8) & 0xff;
			dat[idx + 2] = color & 0xff;
			prevBuffer[i] = pixel;
		}
	}
	this.ctx_.putImageData(this.image_, 0, 0);
};
VideoFairy.prototype.recycle = function(){
	this.ctx_.fillStyle="#000000";
	this.ctx_.fillRect(0, 0, 256, 240);
	var prevBuffer = this.prevBuffer_;
	for(var i=0;i < 240*256; ++i){
		prevBuffer[i] = 0xff;
	}
};
VideoFairy.prototype.zoom = function(){
	if(this.zoomed_){
		$("#nes_screen").animate({width: 256, height: 240});
	}else{
		$("#nes_screen").animate({width: 512, height: 480});
	}
	this.zoomed_ = !this.zoomed_;
};
/**
 * @constructor
 * */
function AudioFairy() {
	this.SAMPLE_RATE_ = 22050;
	this.dataLength = (this.SAMPLE_RATE_ / 4) | 0;
	this.enabled = false;
	var audioContext = window.AudioContext;
	if (audioContext) {
		this.enabled = true;
		this.context_ = new audioContext();
		this.dataIndex = 0;
		this.initBuffer = function () {
			this.buffer_ = this.context_.createBuffer(1, this.dataLength, this.SAMPLE_RATE_);
			this.data = this.buffer_.getChannelData(0);
		};
		this.onDataFilled = function () {
			var src = this.context_.createBufferSource();
			src.loop = false;
			src.connect(this.context_.destination);
			src.buffer = this.buffer_;
			src.start(0);
			this.initBuffer();
			this.dataIndex = 0;
		};
		this.initBuffer();
	}else{
		log.info("Audio is not available");
	}
}

AudioFairy.prototype.__proto__ = cycloa.AbstractAudioFairy.prototype;
AudioFairy.prototype.recycle = function(){
	this.dataIndex = 0;
};
/**
 * @constructor
 * */
function PadFairy($dom) {
	this.state = 0;
	var self = this;
	$dom.bind("keydown", function(e){
		switch (e.keyCode) {
			case 38:
				self.state |= self.MASK_UP;
				e.preventDefault();
				break;
			case 40:
				self.state |= self.MASK_DOWN;
				e.preventDefault();
				break;
			case 37:
				self.state |= self.MASK_LEFT;
				e.preventDefault();
				break;
			case 39:
				self.state |= self.MASK_RIGHT;
				e.preventDefault();
				break;
			case 90:
				self.state |= self.MASK_A;
				e.preventDefault();
				break;
			case 88:
				self.state |= self.MASK_B;
				e.preventDefault();
				break;
			case 32:
				self.state |= self.MASK_SELECT;
				e.preventDefault();
				break;
			case 13:
				self.state |= self.MASK_START;
				e.preventDefault();
				break;
		}
	});
	$dom.bind("keyup", function(e){
		switch (e.keyCode) {
			case 38:
				self.state &= ~self.MASK_UP;
				e.preventDefault();
				break;
			case 40:
				self.state &= ~self.MASK_DOWN;
				e.preventDefault();
				break;
			case 37:
				self.state &= ~self.MASK_LEFT;
				e.preventDefault();
				break;
			case 39:
				self.state &= ~self.MASK_RIGHT;
				e.preventDefault();
				break;
			case 90:
				self.state &= ~self.MASK_A;
				e.preventDefault();
				break;
			case 88:
				self.state &= ~self.MASK_B;
				e.preventDefault();
				break;
			case 32:
				self.state &= ~self.MASK_SELECT;
				e.preventDefault();
				break;
			case 13:
				self.state &= ~self.MASK_START;
				e.preventDefault();
				break;
		}
	});
}
PadFairy.prototype.__proto__ = cycloa.AbstractPadFairy.prototype;
/**
 * @constructor
 * */
PadFairy.prototype.recycle = function(){
	this.state = 0;
};
cycloa.calc_fps_mode = false;

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function () {
	if(cycloa.calc_fps_mode){
		return function(callback){
			window.setTimeout(callback, 0);
		};
	}
	return  window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();

/**
 * @constructor
 * */
function NesController(){
	this.videoFairy_ = new VideoFairy();
	this.audioFairy_ = new AudioFairy();
	this.padFairy_ = new PadFairy($(document));
	this.machine_ = new cycloa.VirtualMachine(this.videoFairy_, this.audioFairy_, this.padFairy_);
	this.running_ = false;
	this.loaded_ = false;
	this.total_frame_ = 0;
}
NesController.prototype.load = function(dat){
	this.machine_.load(dat);
	if(!this.loaded_){
		this.machine_.onHardReset();
	}else{
		this.machine_.onReset();
	}
	this.loaded_ = true;
	if(!this.running_){
		this.start();
	}
	return true;
};
NesController.prototype.start = function(){
	if(this.running_){
		$("#state").text("VM already running! Please stop the machine before loading another game.");
		return false;
	}
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.running_ = true;
	var self = this;
	var cnt = 0;
	var state = $("#state");
	var loop = function () {
		if(self.running_) window.requestAnimFrame(loop);
		self.machine_.run();
		cnt++;
		if (cnt >= 30) {
			var now = new Date();
			self.total_frame_ += cnt;
			var str = "fps: " + (cnt * 1000 / (now - beg)).toFixed(2);
			if(cycloa.calc_fps_mode){
				str += " / avg: "+(self.total_frame_ * 1000/(now-startTime)).toFixed(2);
			}
			state.text(str);
			beg = now;
			cnt = 0;
		}
	};
	var beg = new Date();
	var startTime = beg
	loop();
	return true;
};
NesController.prototype.stop = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.running_ = false;
	return true;
};
NesController.prototype.hardReset = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine_.onHardReset();
	return true;
};
NesController.prototype.reset = function(){
	if(!this.loaded_){
		$("#state").text("VM has not loaded any games. Please load a game.");
		return false;
	}
	this.machine_.onReset();
	return true;
};
NesController.prototype.zoom = function(){
	this.videoFairy_.zoom();
};

var nesController;

(function(){
	$(document).ready(function(){
		jQuery.event.props.push('dataTransfer');
		 $("html").bind("drop", function(e){
			e.stopPropagation();
			e.preventDefault();
			var file = e.dataTransfer.files[0];

			$("#state").text("Now loading...");
			var reader = new FileReader();
			reader.onload = function (dat) {
				nesController.load(dat.target.result);
				$("#state").text("done.");
			};
			reader.readAsArrayBuffer(file);
		});
		$("html").bind("dragenter dragover", false);

		$("#rom_sel").bind("change", function(e){
			var val = e.currentTarget.value;
			if(val){
				$("#state").text("Now loading...");
				var xhr = jQuery.ajaxSettings.xhr();
				xhr.open('GET', val, true);
				xhr.responseType = 'arraybuffer';
				xhr.onreadystatechange = function() {
					if (this.readyState === this.DONE) {
						if(this.status === 200){
							nesController.load(this.response);
						}else{
							$("#state").text("oops. Failed to load game... Status: "+this.status);
						}
					}
				};
				xhr.send();
			}
		});

		$("#nes_hardreset").bind("click", function(){nesController.hardReset();});
		$("#nes_reset").bind("click", function(){nesController.reset();});
		$("#nes_stop").bind("click", function(){
			if(nesController.stop()){
				$("#nes_start").removeClass("disable");
				$("#nes_stop").addClass("disable");
			}
		});
		$("#nes_start").bind("click", function(){
			if(nesController.start()){
				$("#nes_stop").removeClass("disable");
				$("#nes_start").addClass("disable");
			}
		});

		$("#screen_zoom").bind("click", function(){
			nesController.zoom();
		});

		$("#rom_sel")[0].selectedIndex  = 0;
		$("#nes_stop").removeClass("disable");
		$("#nes_start").addClass("disable");

		nesController = new NesController();
		$("#state").text("Initialized");
		
		// ---here
		
		//alert(1);
		//var temp1 = [78,69,83,26,1,1,0,0,0,0,0,0,0,0,0,0,67,79,80,89,82,73,71,72,84,32,49,57,56,49,32,49,57,56,53,32,78,65,77,67,79,32,76,84,68,46,13,10,65,76,76,32,82,73,71,72,84,83,32,82,69,83,69,82,86,69,68,32,32,32,32,32,32,32,32,32,32,32,13,10,82,89,79,85,73,84,73,32,79,79,75,85,66,79,32,32,84,65,75,69,70,85,77,73,32,72,89,79,85,68,79,85,74,85,78,75,79,32,79,90,65,87,65,32,32,32,32,32,120,169,16,141,0,32,216,162,2,173,2,32,16,251,169,6,141,1,32,202,208,243,162,127,154,32,145,212,169,0,133,79,133,80,32,103,212,32,127,209,169,0,133,75,32,106,209,32,171,199,32,192,201,32,181,195,32,29,196,76,156,192,165,75,208,12,32,112,212,32,176,201,32,180,215,32,103,212,32,19,228,169,16,133,144,169,24,133,152,169,132,133,160,169,0,133,168,133,110,133,176,133,129,133,123,133,92,133,79,133,80,133,111,133,112,165,75,208,3,32,245,202,32,246,216,32,210,198,32,208,200,165,11,41,16,240,3,32,166,222,165,6,41,240,208,60,165,8,41,1,240,24,165,129,208,5,230,129,76,68,193,230,92,165,92,201,14,208,43,169,0,133,92,76,68,193,165,8,41,2,240,24,165,129,208,5,230,129,76,68,193,198,92,165,92,201,255,208,13,169,13,133,92,76,68,193,165,6,41,3,240,3,32,198,198,165,8,41,8,208,3,76,234,192,169,32,133,110,230,75,76,162,192,32,246,216,32,81,234,169,28,133,5,169,0,133,79,133,80,133,109,169,4,133,77,32,144,204,32,145,202,165,76,208,76,165,8,41,8,208,70,165,8,41,1,208,12,165,6,41,1,240,25,165,11,41,7,208,19,169,0,133,11,230,133,165,133,201,36,208,213,169,35,133,133,76,114,193,165,8,41,2,208,12,165,6,41,2,240,194,165,11,41,7,208,188,169,0,133,11,198,133,208,180,169,1,133,133,76,114,193,169,1,141,1,3,141,2,3,141,3,3,165,75,208,14,32,176,201,165,133,32,0,240,32,245,202,76,229,193,32,93,203,169,0,133,12,32,39,204,32,178,204,169,0,133,77,32,246,216,32,49,195,32,246,216,165,109,208,3,32,230,194,32,59,226,32,216,224,32,166,222,165,8,41,8,240,9,169,1,69,109,133,109,141,0,3,32,249,200,32,40,199,240,214,169,0,133,10,133,11,141,17,3,141,18,3,173,8,1,240,4,169,254,133,10,32,246,216,32,162,194,32,230,194,32,59,226,32,166,222,32,216,224,32,29,195,165,10,201,2,208,229,32,81,234,32,212,204,230,133,165,133,201,71,208,8,169,1,133,133,169,0,133,70,165,133,201,36,208,4,169,1,133,70,165,81,24,101,82,240,9,165,104,201,128,208,3,76,89,193,32,217,197,32,125,217,152,240,6,32,75,196,32,149,194,76,149,192,32,112,212,32,126,212,32,180,215,32,103,212,96,165,104,201,128,240,10,169,0,133,6,133,7,133,8,133,9,96,162,21,32,254,217,162,29,32,254,217,169,0,141,1,1,141,2,1,169,0,133,102,133,103,133,76,169,3,133,81,133,82,133,106,165,131,208,4,169,0,133,82,169,1,133,133,169,0,133,70,96,32,129,225,32,117,219,32,241,219,32,250,225,32,46,224,32,169,226,32,124,226,32,34,225,32,98,225,32,72,219,32,4,230,32,16,233,32,12,231,32,114,233,32,114,201,32,11,219,32,200,199,32,29,195,96,165,11,41,63,240,9,201,32,208,9,169,1,133,77,96,169,2,133,77,96,32,9,228,32,19,228,169,240,141,6,1,169,0,141,8,1,165,81,240,5,162,0,32,99,227,165,82,240,5,162,1,32,99,227,169,20,133,127,133,128,169,0,133,143,133,10,133,75,133,69,133,111,133,112,133,137,133,138,133,130,133,134,141,0,1,133,106,32,30,199,32,192,200,32,246,216,32,48,200,32,89,200,32,43,228,169,128,133,104,169,1,141,18,3,133,76,165,70,201,1,208,5,169,35,76,158,195,165,133,10,10,133,0,169,190,56,229,0,133,132,165,131,240,7,165,132,56,233,20,133,132,96,169,1,133,109,169,0,133,77,32,189,194,169,3,133,82,169,0,133,79,133,80,133,10,133,11,32,176,201,169,255,133,133,32,0,240,169,30,133,133,169,2,133,70,32,112,212,162,26,134,86,160,70,132,87,169,210,133,20,169,153,133,19,32,210,216,162,60,134,86,160,120,132,87,169,210,133,20,169,160,133,19,32,210,216,32,180,215,32,103,212,32,49,195,32,245,202,32,246,216,169,5,133,108,96,32,246,216,165,8,41,12,208,25,32,66,198,32,230,194,32,59,226,32,166,222,32,216,224,32,40,199,240,227,169,0,133,12,96,104,104,169,0,133,12,32,106,209,76,162,192,32,112,212,169,28,133,5,169,0,133,79,133,80,32,126,212,162,16,134,86,160,50,132,87,169,210,133,20,169,181,133,19,32,210,216,32,81,217,32,180,215,32,103,212,169,0,133,10,169,1,141,21,3,141,22,3,141,23,3,32,246,216,165,11,41,3,24,105,5,133,77,173,21,3,208,239,169,0,133,77,96,32,112,212,169,28,133,5,169,0,133,79,133,80,32,126,212,32,180,215,32,103,212,32,103,197,32,103,197,169,211,133,18,169,15,133,17,162,8,160,8,32,179,214,32,103,197,169,210,133,18,169,132,133,17,162,8,160,10,32,179,214,32,103,197,169,211,133,18,169,52,133,17,162,8,160,12,32,179,214,32,103,197,169,211,133,18,169,77,133,17,162,8,160,14,32,179,214,32,103,197,169,211,133,18,169,63,133,17,162,8,160,16,32,179,214,32,103,197,169,211,133,18,169,63,133,17,162,9,160,16,32,179,214,32,103,197,169,211,133,18,169,63,133,17,162,10,160,16,32,179,214,32,103,197,169,211,133,18,169,63,133,17,162,11,160,16,32,179,214,32,103,197,169,211,133,18,169,63,133,17,162,12,160,16,32,179,214,32,117,197,32,112,212,32,176,201,32,180,215,32,103,212,96,169,0,133,11,32,246,216,165,11,41,63,208,247,96,169,120,133,86,169,30,133,87,169,0,133,90,32,176,197,32,176,197,32,176,197,32,176,197,230,90,165,90,201,7,208,236,32,246,216,230,87,169,157,133,83,169,1,133,4,166,86,164,87,32,123,218,165,87,201,248,208,230,96,32,246,216,169,3,133,4,169,3,56,229,90,16,5,73,255,24,105,1,133,0,169,3,56,229,0,10,10,24,105,161,133,83,166,86,164,87,32,123,218,96,32,112,212,169,28,133,5,169,0,133,79,133,80,32,126,212,162,60,134,86,160,70,132,87,169,211,133,20,169,67,133,19,32,210,216,162,60,134,86,160,120,132,87,169,211,133,20,169,72,133,19,32,210,216,32,180,215,32,103,212,169,0,133,10,169,1,141,24,3,141,25,3,141,26,3,32,246,216,165,8,41,12,208,5,173,24,3,208,242,32,112,212,32,126,212,32,180,215,32,103,212,32,81,234,96,169,1,133,90,166,90,165,134,240,18,165,98,208,14,165,134,133,113,165,135,133,114,32,162,221,76,165,198,181,162,16,18,201,224,176,14,181,146,133,113,181,154,133,114,32,162,221,76,165,198,181,164,16,18,201,224,176,14,181,148,133,113,181,156,133,114,32,162,221,76,165,198,181,163,16,18,201,224,176,14,181,147,133,113,181,155,133,114,32,162,221,76,165,198,169,0,76,171,198,41,3,168,185,194,198,166,90,149,6,149,8,181,152,201,200,144,6,181,8,41,240,149,8,198,90,16,133,96,19,67,35,131,165,92,41,15,166,144,164,152,32,11,216,96,165,6,41,240,240,9,230,123,169,0,133,129,76,229,198,169,0,133,123,165,123,201,20,240,16,165,8,41,240,240,44,165,8,32,81,228,48,37,76,4,199,169,15,133,123,165,6,32,81,228,168,185,213,211,10,10,10,10,24,101,144,133,144,185,217,211,10,10,10,10,24,101,152,133,152,96,162,7,169,0,149,115,202,16,251,96,165,104,240,11,165,128,240,31,165,81,24,101,82,208,27,169,112,141,5,1,169,240,141,6,1,169,0,141,7,1,169,17,141,8,1,169,0,133,11,169,1,96,169,0,96,173,9,1,32,225,217,169,48,133,96,169,0,133,18,169,57,133,17,162,9,160,2,32,221,214,174,9,1,181,0,32,225,217,169,0,133,18,169,57,133,17,162,13,160,2,32,221,214,169,0,133,96,165,8,41,4,240,3,238,9,1,165,8,41,2,240,3,206,9,1,165,8,41,1,240,9,173,9,1,24,105,16,141,9,1,96,169,0,133,79,133,80,32,246,216,230,79,165,8,41,12,208,7,165,79,201,240,208,239,96,104,104,76,162,192,169,1,133,90,133,107,169,110,133,96,169,211,133,18,169,65,133,17,162,29,160,18,32,179,214,165,70,201,2,240,11,165,131,208,7,169,0,133,90,76,1,200,169,211,133,18,169,65,133,17,162,29,160,21,32,179,214,166,90,181,81,56,233,1,16,2,169,0,32,19,218,160,54,162,25,32,52,217,165,90,133,0,10,24,101,0,24,105,18,168,32,221,214,198,90,16,216,169,0,133,96,133,107,96,169,210,133,18,169,171,133,17,162,29,160,17,32,179,214,165,70,201,2,240,4,165,131,240,15,169,210,133,18,169,174,133,17,162,29,160,20,32,179,214,96,32,246,216,169,211,133,18,169,101,133,17,162,29,160,23,32,179,214,169,211,133,18,169,104,133,17,162,29,160,24,32,179,214,169,110,133,96,165,133,32,19,218,160,54,162,25,32,52,217,160,25,32,221,214,169,0,133,96,96,72,41,1,24,105,29,170,104,74,24,105,3,168,96,32,148,200,169,211,133,18,169,98,133,17,32,179,214,96,32,148,200,169,211,133,18,169,107,133,17,32,179,214,96,169,18,133,90,165,90,32,162,200,198,90,198,90,16,245,96,165,144,201,216,144,4,169,216,133,144,165,144,201,24,176,4,169,24,133,144,165,152,201,216,144,4,169,216,133,152,165,152,201,24,176,4,169,24,133,152,96,165,109,240,73,165,11,41,16,240,67,169,3,133,4,169,0,133,110,162,100,160,128,169,23,133,83,32,43,218,162,108,160,128,169,25,133,83,32,43,218,162,116,160,128,169,27,133,83,32,43,218,162,124,160,128,169,29,133,83,32,43,218,162,132,160,128,169,31,133,83,32,43,218,169,32,133,110,96,169,3,133,4,169,0,133,110,174,5,1,172,6,1,169,121,133,83,32,123,218,173,5,1,24,105,16,170,172,6,1,169,125,133,83,32,123,218,169,32,133,110,96,173,8,1,240,56,165,70,201,2,240,50,165,11,41,15,208,10,206,8,1,208,5,169,240,141,6,1,173,8,1,201,10,144,24,173,7,1,168,185,213,211,24,109,5,1,141,5,1,185,217,211,24,109,6,1,141,6,1,32,71,201,96,169,2,133,86,133,87,169,26,133,90,133,91,32,204,215,96,169,3,133,77,32,19,228,169,72,133,144,32,133,202,169,131,133,160,169,0,133,10,133,168,133,176,133,111,133,112,133,79,133,74,169,2,133,80,32,246,216,165,11,41,3,208,6,165,176,73,4,133,176,32,166,222,165,8,41,4,240,6,230,131,169,0,133,10,165,6,41,32,240,13,165,9,41,1,240,7,169,16,24,101,74,133,74,165,6,41,128,240,8,165,9,41,2,240,2,198,74,165,131,201,3,144,4,169,0,133,131,32,133,202,165,10,201,10,208,5,165,75,208,1,96,165,8,41,8,240,163,165,75,201,7,208,9,165,74,201,116,208,3,32,156,196,169,0,133,77,104,104,165,131,10,168,185,105,202,133,17,185,106,202,133,18,108,17,0,111,202,116,202,126,202,169,5,76,118,202,169,7,133,108,32,179,194,76,89,193,169,7,133,108,76,174,192,165,131,10,10,10,10,24,105,139,133,152,96,32,246,216,162,12,160,14,32,251,213,166,12,24,105,28,157,128,1,232,152,157,128,1,232,169,35,157,128,1,232,169,36,157,128,1,232,169,37,157,128,1,232,169,38,157,128,1,232,169,39,157,128,1,232,169,17,157,128,1,232,169,17,157,128,1,232,169,255,157,128,1,232,134,12,169,110,133,96,165,133,32,19,218,160,54,162,14,32,52,217,160,14,32,221,214,169,0,133,96,96,169,211,133,18,169,109,133,17,162,12,160,24,32,179,214,169,211,133,18,169,116,133,17,162,12,160,25,32,179,214,169,211,133,18,169,123,133,17,162,12,160,26,32,179,214,169,211,133,18,169,130,133,17,162,12,160,27,32,179,214,166,12,169,35,157,128,1,232,169,243,157,128,1,232,169,0,141,243,7,157,128,1,232,173,244,7,41,204,141,244,7,157,128,1,232,169,255,157,128,1,232,134,12,96,169,211,133,18,169,165,133,17,162,14,160,26,32,179,214,169,211,133,18,169,168,133,17,162,14,160,27,32,179,214,166,12,169,35,157,128,1,232,169,243,157,128,1,232,173,243,7,41,63,141,243,7,157,128,1,232,169,255,157,128,1,232,134,12,96,169,211,133,18,169,137,133,17,162,12,160,24,32,179,214,169,211,133,18,169,144,133,17,162,12,160,25,32,179,214,169,211,133,18,169,151,133,17,162,12,160,26,32,179,214,169,211,133,18,169,158,133,17,162,12,160,27,32,179,214,166,12,169,35,157,128,1,232,169,243,157,128,1,232,169,63,141,243,7,157,128,1,232,173,244,7,41,204,9,51,141,244,7,157,128,1,232,169,255,157,128,1,232,134,12,96,169,211,133,18,169,171,133,17,162,14,160,26,32,179,214,169,211,133,18,169,174,133,17,162,14,160,27,32,179,214,96,160,0,169,35,133,18,169,192,133,17,32,246,216,166,12,165,18,157,128,1,232,165,17,157,128,1,232,185,192,7,200,157,128,1,232,169,255,157,128,1,232,134,12,169,1,32,170,215,192,64,208,214,96,162,0,32,251,213,133,18,132,17,166,12,165,18,24,105,28,157,128,1,232,165,17,157,128,1,232,160,0,165,99,208,2,177,17,157,128,1,232,200,192,32,208,241,169,255,157,128,1,232,134,12,96,169,17,133,99,169,0,133,87,32,246,216,164,87,32,92,204,169,29,56,229,87,168,32,92,204,230,87,165,87,201,16,208,231,96,169,0,133,99,169,15,133,87,32,246,216,164,87,32,92,204,169,29,56,229,87,168,32,92,204,198,87,165,87,201,255,208,231,96,32,247,206,162,30,32,118,210,165,115,24,101,116,24,101,117,24,101,118,133,125,165,119,24,101,120,24,101,121,24,101,122,133,126,169,0,133,90,32,246,216,32,184,208,162,37,32,254,217,162,45,32,254,217,169,0,133,93,133,94,32,246,216,32,184,208,169,0,133,124,166,90,189,209,211,32,225,217,166,90,181,115,240,24,169,1,141,19,3,141,20,3,214,115,230,93,162,2,32,190,217,169,1,133,124,32,56,209,166,90,181,119,240,24,169,1,141,19,3,141,20,3,214,119,230,94,162,3,32,190,217,169,1,133,124,32,56,209,160,22,162,5,32,52,217,160,9,32,221,214,162,1,160,38,32,52,217,165,90,10,24,101,90,24,105,12,168,32,221,214,166,90,165,93,32,19,218,162,8,160,54,32,52,217,165,90,10,24,101,90,24,105,12,168,32,221,214,165,131,240,59,160,30,162,23,32,52,217,160,9,32,221,214,162,19,160,46,32,52,217,165,90,10,24,101,90,24,105,12,168,32,221,214,166,90,165,94,32,19,218,162,14,160,54,32,52,217,165,90,10,24,101,90,24,105,12,168,32,221,214,162,8,32,118,210,165,124,240,3,76,16,205,230,90,165,90,201,4,240,8,162,20,32,118,210,76,250,204,162,30,32,118,210,165,125,32,19,218,160,54,162,8,32,52,217,160,23,32,221,214,165,131,240,17,165,126,32,19,218,160,54,162,14,32,52,217,160,23,32,221,214,162,15,32,118,210,165,131,208,3,76,229,206,165,104,208,3,76,229,206,165,126,197,125,176,85,165,81,240,81,169,0,32,225,217,162,0,32,190,217,160,22,162,5,32,52,217,160,9,32,221,214,160,54,162,1,32,52,217,160,26,32,221,214,169,211,133,18,169,196,133,17,162,3,160,25,32,179,214,169,211,133,18,169,94,133,17,162,8,160,26,32,179,214,169,1,141,27,3,141,28,3,141,29,3,32,56,209,76,229,206,165,125,197,126,176,82,165,82,240,78,169,0,32,225,217,162,1,32,190,217,160,30,162,23,32,52,217,160,9,32,221,214,160,54,162,20,32,52,217,160,26,32,221,214,169,211,133,18,169,196,133,17,162,22,160,25,32,179,214,169,211,133,18,169,94,133,17,162,27,160,26,32,179,214,169,1,141,27,3,141,28,3,141,29,3,32,56,209,162,120,32,118,210,169,0,133,80,133,96,133,107,169,0,133,77,96,32,246,216,169,1,133,107,169,36,133,5,169,0,133,79,169,2,133,80,169,48,133,96,169,3,133,77,32,112,212,32,126,212,32,217,208,32,180,215,32,103,212,169,210,133,18,169,189,133,17,162,8,160,3,32,179,214,160,62,162,18,32,52,217,160,3,32,221,214,169,211,133,18,169,203,133,17,162,12,160,5,32,179,214,165,133,32,19,218,160,54,162,14,32,52,217,160,5,32,221,214,32,246,216,169,210,133,18,169,217,133,17,162,3,160,7,32,179,214,160,22,162,5,32,52,217,160,9,32,221,214,169,211,133,18,169,177,133,17,162,14,160,12,32,179,214,169,211,133,18,169,177,133,17,162,14,160,15,32,179,214,169,211,133,18,169,177,133,17,162,14,160,18,32,179,214,169,211,133,18,169,177,133,17,162,14,160,21,32,179,214,165,131,240,90,32,246,216,169,210,133,18,169,226,133,17,162,21,160,7,32,179,214,160,30,162,23,32,52,217,160,9,32,221,214,169,211,133,18,169,179,133,17,162,17,160,12,32,179,214,169,211,133,18,169,179,133,17,162,17,160,15,32,179,214,169,211,133,18,169,179,133,17,162,17,160,18,32,179,214,169,211,133,18,169,179,133,17,162,17,160,21,32,179,214,32,246,216,169,211,133,18,169,94,133,17,162,8,160,12,32,179,214,169,211,133,18,169,94,133,17,162,8,160,15,32,179,214,169,211,133,18,169,94,133,17,162,8,160,18,32,179,214,169,211,133,18,169,94,133,17,162,8,160,21,32,179,214,165,131,240,63,32,246,216,169,211,133,18,169,94,133,17,162,26,160,12,32,179,214,169,211,133,18,169,94,133,17,162,26,160,15,32,179,214,169,211,133,18,169,94,133,17,162,26,160,18,32,179,214,169,211,133,18,169,94,133,17,162,26,160,21,32,179,214,32,246,216,169,211,133,18,169,187,133,17,162,12,160,22,32,179,214,169,211,133,18,169,181,133,17,162,6,160,23,32,179,214,96,169,2,133,4,160,100,169,128,32,48,209,160,124,169,160,32,48,209,160,148,169,192,32,48,209,160,172,169,224,32,48,209,96,169,80,141,192,7,141,193,7,141,194,7,141,195,7,141,200,7,141,201,7,141,202,7,141,205,7,141,206,7,141,207,7,169,160,141,196,7,141,197,7,141,198,7,141,199,7,169,10,141,208,7,141,209,7,141,210,7,141,213,7,141,214,7,141,215,7,169,5,141,240,7,141,241,7,141,242,7,141,245,7,141,246,7,141,247,7,96,133,83,162,129,32,123,218,96,165,104,201,128,208,43,165,102,208,13,165,23,201,2,144,7,230,81,230,102,76,97,209,165,131,240,22,165,103,208,18,165,31,201,2,144,12,230,82,230,103,169,1,141,4,3,141,5,3,96,32,112,212,169,3,133,77,169,28,133,5,32,126,212,32,180,215,32,103,212,96,32,112,212,169,36,133,5,32,126,212,162,26,134,86,160,46,132,87,169,210,133,20,169,153,133,19,32,210,216,162,60,134,86,160,86,132,87,169,210,133,20,169,160,133,19,32,210,216,32,180,215,32,103,212,169,48,133,96,169,210,133,18,169,165,133,17,162,2,160,3,32,179,214,160,22,162,4,32,52,217,160,3,32,221,214,169,210,133,18,169,177,133,17,162,11,160,3,32,179,214,160,62,162,14,32,52,217,160,3,32,221,214,165,131,240,27,169,210,133,18,169,168,133,17,162,21,160,3,32,179,214,160,30,162,23,32,52,217,160,3,32,221,214,169,0,133,96,32,246,216,169,210,133,18,169,198,133,17,162,11,160,17,32,179,214,169,210,133,18,169,207,133,17,162,11,160,19,32,179,214,169,210,133,18,169,235,133,17,162,11,160,21,32,179,214,32,246,216,169,210,133,18,169,143,133,17,162,11,160,23,32,179,214,169,210,133,18,169,248,133,17,162,4,160,25,32,179,214,32,246,216,169,211,133,18,169,32,133,17,162,6,160,27,32,179,214,96,32,246,216,138,72,32,184,208,104,170,202,208,243,96,87,82,73,84,84,69,78,32,66,89,255,96,97,98,99,100,101,102,103,104,255,66,65,84,84,76,69,255,67,73,84,89,255,94,107,255,95,107,255,88,19,255,90,19,255,72,73,107,255,72,73,83,67,79,82,69,255,72,73,107,83,67,79,82,69,255,49,32,80,76,65,89,69,82,255,50,32,80,76,65,89,69,82,83,255,94,107,80,76,65,89,69,82,255,95,107,80,76,65,89,69,82,255,67,79,78,83,84,82,85,67,84,73,79,78,255,64,32,49,57,56,48,32,49,57,56,53,32,78,65,77,67,79,32,76,84,68,105,255,84,72,73,83,32,80,82,79,71,82,65,77,32,87,65,83,255,65,76,76,32,82,73,71,72,84,83,32,82,69,83,69,82,86,69,68,255,79,80,69,78,107,82,69,65,67,72,255,105,255,20,255,71,65,77,69,255,79,86,69,82,255,87,72,79,32,76,79,86,69,83,32,78,79,82,73,75,79,255,80,84,83,255,106,106,255,108,252,255,109,253,255,17,255,0,0,0,0,0,0,255,0,15,15,15,15,0,255,0,15,200,202,15,0,255,0,15,201,203,15,0,255,0,0,0,0,0,0,255,0,16,16,16,16,0,255,0,16,200,202,16,0,255,0,16,201,203,16,0,255,200,202,255,201,203,255,204,206,255,205,207,255,91,255,93,255,84,79,84,65,76,255,92,92,92,92,92,92,92,92,255,66,79,78,85,83,21,255,83,84,65,71,69,255,16,32,48,64,0,255,0,1,255,0,1,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,72,138,72,152,72,8,169,0,141,3,32,169,2,141,20,64,173,2,32,32,253,216,165,77,48,3,32,14,213,165,80,9,176,141,0,32,169,0,141,5,32,165,79,141,5,32,169,30,141,1,32,32,137,214,32,147,218,32,126,234,230,11,165,11,41,63,208,2,230,10,40,104,168,104,170,104,64,138,72,165,15,10,10,10,56,229,15,24,101,10,230,16,166,16,117,0,133,15,104,170,165,15,96,32,245,213,169,176,141,0,32,96,32,246,216,169,16,141,0,32,169,6,141,1,32,96,169,0,170,157,0,4,157,0,5,157,0,6,157,0,7,232,208,241,96,169,0,133,96,133,107,133,12,133,13,133,109,169,255,133,77,32,2,213,169,4,133,14,169,32,133,110,32,126,212,32,147,218,162,21,32,254,217,162,29,32,254,217,32,239,212,208,13,162,61,32,254,217,169,2,133,63,169,0,133,131,169,28,133,5,32,180,215,169,36,133,5,32,180,215,32,227,212,32,81,234,96,162,15,189,64,192,157,16,1,202,16,247,96,162,15,189,16,1,221,64,192,208,6,202,16,245,169,1,96,169,0,96,32,245,213,32,62,213,169,0,32,14,213,96,10,10,10,10,170,160,16,169,63,141,6,32,169,0,141,6,32,189,101,213,141,7,32,232,136,208,246,169,255,133,77,169,63,141,6,32,169,0,141,6,32,141,6,32,141,6,32,96,162,0,160,16,169,63,141,6,32,140,6,32,189,85,213,141,7,32,232,136,208,246,96,15,24,39,56,15,10,27,59,15,12,16,32,15,4,22,32,15,23,6,0,15,60,16,18,15,41,9,11,15,0,16,32,15,23,6,0,15,60,18,18,15,41,9,11,15,0,16,32,15,23,6,0,15,18,60,18,15,41,9,11,15,0,16,32,15,22,22,48,15,60,16,22,15,41,9,39,15,0,16,32,15,23,6,0,15,60,16,0,15,41,9,0,15,0,16,0,15,15,6,0,15,60,16,0,15,41,9,0,15,0,16,0,15,18,6,0,15,60,16,0,15,41,9,0,15,0,16,0,15,0,6,0,15,60,16,0,15,41,9,0,15,0,16,0,15,48,6,0,15,60,16,0,15,41,9,0,15,0,16,0,173,2,32,16,251,96,169,0,133,0,152,74,102,0,74,102,0,74,102,0,72,138,5,0,168,104,9,4,96,32,53,214,166,12,169,35,157,128,1,232,152,24,105,192,157,128,1,232,185,192,7,157,128,1,232,169,255,157,128,1,232,134,12,96,165,4,32,132,214,32,132,214,32,132,214,133,2,152,41,2,208,15,138,41,2,240,5,169,243,76,98,214,169,252,76,98,214,138,41,2,240,5,169,63,76,98,214,169,207,133,1,152,10,41,248,133,0,138,74,74,24,101,0,168,165,1,73,255,37,2,133,2,185,192,7,37,1,5,2,153,192,7,96,10,10,5,4,96,162,1,142,22,64,160,0,140,22,64,132,0,160,8,189,22,64,41,3,201,1,102,0,136,208,244,181,6,73,255,37,0,149,8,165,0,149,6,202,16,225,96,32,251,213,133,20,24,101,5,166,12,157,128,1,232,152,157,128,1,232,133,19,160,0,177,17,157,128,1,232,201,255,240,6,145,19,200,76,202,214,134,12,96,32,251,213,24,101,5,166,12,157,128,1,232,152,157,128,1,232,160,0,177,17,48,3,24,101,96,157,128,1,232,201,255,240,4,200,76,240,214,134,12,96,32,19,215,32,251,213,133,18,132,17,160,0,96,152,74,74,74,168,138,74,74,74,170,96,134,71,132,72,32,6,215,169,1,133,0,165,72,41,4,240,4,6,0,6,0,165,71,41,4,240,2,6,0,96,165,0,9,240,49,17,96,165,0,73,255,49,17,32,132,215,96,177,17,41,240,208,8,165,0,73,255,49,17,145,17,96,165,0,17,17,32,132,215,96,177,17,41,240,208,6,165,0,17,17,145,17,96,165,18,24,101,5,141,6,32,165,17,141,6,32,177,17,141,7,32,96,145,17,134,71,166,12,165,18,24,105,28,157,128,1,232,165,17,157,128,1,232,177,17,157,128,1,232,169,255,157,128,1,232,134,12,166,71,96,24,101,17,133,17,144,2,230,18,96,169,0,133,17,168,169,4,133,18,32,113,215,169,1,32,170,215,165,18,201,8,208,242,96,162,0,169,17,157,0,4,157,0,5,157,0,6,157,0,7,232,208,241,169,0,162,192,157,0,7,232,208,250,166,86,164,87,32,251,213,133,18,132,17,164,91,136,169,0,145,17,136,16,249,198,90,240,8,169,32,32,170,215,76,244,215,96,72,133,0,32,19,215,134,71,132,72,164,0,185,187,218,133,4,164,72,32,18,214,165,72,41,254,168,165,71,41,254,170,32,9,215,104,10,10,170,189,203,218,232,32,132,215,169,1,32,170,215,189,203,218,232,32,132,215,169,31,32,170,215,189,203,218,232,32,132,215,169,1,32,170,215,189,203,218,232,32,132,215,96,134,93,170,152,24,105,32,133,94,169,0,133,17,169,16,133,18,202,48,8,169,16,32,170,215,76,111,216,165,18,141,6,32,165,17,141,6,32,173,7,32,169,8,133,90,173,7,32,72,198,90,208,248,169,8,133,90,104,133,2,169,128,133,3,166,93,164,94,32,30,215,165,2,37,3,240,6,32,100,215,76,180,216,32,77,215,165,93,24,105,4,133,93,70,3,144,223,165,93,56,233,32,133,93,165,94,56,233,4,133,94,198,90,208,198,96,160,0,132,95,177,19,201,255,240,25,200,132,95,166,86,164,87,24,101,96,32,94,216,165,86,24,105,32,133,86,164,95,76,214,216,96,165,11,197,11,240,252,96,166,12,169,0,157,128,1,170,228,12,240,38,189,128,1,232,141,6,32,189,128,1,232,141,6,32,189,128,1,232,201,255,208,10,189,128,1,201,255,208,223,189,127,1,141,7,32,76,23,217,169,0,133,12,96,185,0,0,208,5,200,232,76,52,217,201,255,208,8,165,107,208,2,202,136,202,136,169,0,133,18,132,17,96,169,16,133,86,169,100,133,87,169,48,133,96,160,61,185,0,0,208,11,200,165,86,24,105,32,133,86,76,95,217,169,0,133,20,132,19,32,210,216,169,0,133,96,96,162,0,160,0,181,21,213,61,208,8,232,224,7,240,18,76,129,217,48,13,162,0,181,21,149,61,232,224,7,208,247,160,1,162,0,181,29,213,61,208,8,232,224,7,240,18,76,160,217,48,13,162,0,181,29,149,61,232,224,7,208,247,160,255,96,138,10,10,10,24,105,6,170,160,6,24,185,53,0,117,21,201,10,48,7,56,233,10,56,76,218,217,24,149,21,202,136,16,233,96,133,0,162,53,32,254,217,165,0,240,13,41,15,133,58,165,0,74,74,74,74,133,57,96,169,1,133,56,96,169,0,149,0,149,1,149,2,149,3,149,4,149,5,149,6,169,255,149,7,96,133,0,162,53,32,254,217,165,0,201,10,144,8,56,233,10,230,58,76,28,218,133,59,96,138,133,71,24,105,3,170,152,56,233,8,133,72,32,6,215,177,17,201,34,208,6,165,4,5,110,133,4,166,13,165,72,157,0,2,165,83,157,1,2,165,4,157,2,2,165,71,157,3,2,138,24,101,14,133,13,96,10,24,101,83,133,83,138,56,233,5,170,32,43,218,96,10,10,10,24,101,83,133,83,134,84,132,85,138,56,233,8,170,32,43,218,230,83,230,83,166,84,164,85,32,43,218,96,166,13,165,14,73,255,24,105,1,133,14,138,24,101,14,170,169,240,157,0,2,224,4,208,242,134,13,96,240,9,176,5,169,255,76,186,218,169,1,96,0,0,0,0,0,3,3,3,3,3,1,2,3,0,0,0,0,15,0,15,0,0,15,15,15,0,15,0,15,15,0,0,15,15,15,15,32,16,32,16,32,32,16,16,16,32,16,32,16,16,32,32,16,16,16,16,18,18,18,18,34,34,34,34,33,33,33,33,0,0,0,0,0,0,0,0,0,0,0,0,173,17,3,240,20,162,0,32,56,219,208,32,162,1,32,56,219,208,25,169,0,141,17,3,96,162,0,32,56,219,208,7,162,1,32,56,219,240,5,169,1,141,17,3,96,181,6,41,240,240,7,181,160,240,3,169,1,96,169,0,96,165,130,240,3,198,130,96,165,127,240,33,165,108,133,90,166,90,181,160,208,15,165,132,133,130,32,99,227,198,127,165,127,32,177,200,96,198,90,165,90,201,1,208,227,96,165,11,41,1,208,6,165,11,41,3,208,111,162,1,181,160,16,102,201,224,176,98,181,111,240,5,214,111,76,166,219,189,3,1,16,4,41,16,208,9,181,6,32,81,228,133,0,16,14,169,128,32,32,228,169,8,21,160,149,160,76,237,219,189,3,1,16,14,41,31,208,10,169,156,157,3,1,169,1,141,16,3,181,160,41,3,197,0,240,24,73,2,197,0,240,18,181,144,24,105,4,41,248,149,144,181,152,24,105,4,41,248,149,152,165,0,9,160,149,160,202,16,147,96,169,7,133,90,173,0,1,240,9,165,11,41,63,208,3,206,0,1,166,90,224,2,176,15,165,11,41,1,208,38,165,11,41,3,208,35,76,53,220,173,0,1,240,8,181,160,16,4,201,224,144,19,181,168,41,240,201,160,240,8,165,90,69,11,41,1,240,3,32,61,220,198,90,16,199,96,181,160,74,74,74,41,254,168,185,152,228,133,17,185,153,228,133,18,108,17,0,224,2,176,21,189,3,1,16,16,41,127,240,12,222,3,1,181,176,73,4,149,176,76,151,220,181,160,56,233,4,149,160,41,12,208,5,169,160,32,32,228,96,224,2,144,23,181,144,41,7,208,17,181,152,41,7,208,11,32,77,212,41,15,208,4,32,114,222,96,181,160,41,3,168,185,112,228,10,10,10,133,89,185,112,228,24,117,152,133,87,185,108,228,10,10,10,133,88,185,108,228,24,117,144,133,86,24,101,88,24,101,89,32,110,221,170,165,87,24,101,88,24,101,89,32,118,221,168,32,6,215,177,17,48,56,240,4,201,32,144,50,165,86,24,101,88,56,229,89,32,110,221,170,165,87,24,101,89,56,229,88,32,118,221,168,32,6,215,177,17,48,19,240,4,201,32,144,13,166,90,165,86,149,144,165,87,149,152,76,41,221,166,90,224,2,144,18,32,77,212,41,3,240,18,169,128,32,32,228,169,8,21,160,149,160,181,176,73,4,149,176,96,181,144,41,7,208,11,181,152,41,7,208,5,169,144,32,32,228,181,160,73,2,149,160,96,32,77,212,41,1,240,27,32,77,212,41,1,240,8,181,160,24,105,1,76,99,221,181,160,56,233,1,41,3,9,160,149,160,96,32,114,222,96,197,86,144,3,56,233,1,96,197,87,144,3,56,233,1,96,165,144,133,113,165,152,133,114,76,156,221,165,145,133,113,165,153,133,114,76,156,221,169,120,133,113,169,216,133,114,32,162,221,149,160,96,165,113,56,245,144,32,175,218,24,105,1,133,100,165,114,56,245,152,32,175,218,24,105,1,133,101,10,24,101,101,24,101,100,133,100,224,2,176,11,138,10,69,10,41,2,240,19,76,219,221,32,77,212,41,1,240,9,169,9,24,101,100,168,76,230,221,164,100,185,134,228,96,214,160,181,160,41,15,208,83,181,160,56,233,16,240,14,201,16,208,5,9,6,76,4,222,9,3,149,160,96,149,160,224,2,176,8,214,81,240,7,32,99,227,96,198,128,96,165,104,201,128,208,39,224,1,240,18,165,82,240,31,169,3,141,7,1,169,32,141,5,1,32,70,222,96,165,81,240,13,169,1,141,7,1,169,192,141,5,1,32,70,222,96,169,13,141,8,1,169,216,141,6,1,169,0,133,11,96,246,160,181,160,41,15,201,14,208,4,169,224,149,160,96,246,160,181,160,41,15,201,14,208,3,32,184,227,96,165,132,74,74,197,10,176,5,169,176,76,162,222,74,197,10,144,10,32,77,212,41,3,9,160,149,160,96,165,160,240,9,138,41,1,240,9,165,161,240,5,169,192,76,162,222,169,208,32,32,228,96,169,0,133,90,166,90,32,184,222,230,90,165,90,201,8,208,243,96,181,160,74,74,74,41,254,168,185,184,228,133,17,185,185,228,133,18,108,17,0,169,0,133,110,181,160,72,180,152,181,144,170,104,32,226,222,169,32,133,110,96,74,74,74,74,56,233,7,73,255,24,105,1,10,10,24,105,241,133,83,169,3,133,4,32,123,218,96,169,0,133,110,181,168,240,30,181,168,74,74,74,41,252,56,233,16,24,105,185,133,83,169,3,133,4,180,152,181,144,170,32,123,218,76,46,223,181,152,168,181,144,170,169,0,32,240,222,169,32,133,110,96,169,0,133,110,180,152,181,144,170,169,8,32,240,222,169,32,133,110,96,169,3,133,4,169,0,133,110,32,153,223,138,56,233,8,170,152,56,233,8,168,32,123,218,169,1,32,153,223,138,24,105,8,170,152,56,233,8,168,32,123,218,169,2,32,153,223,138,56,233,8,170,152,24,105,8,168,32,123,218,169,3,32,153,223,138,24,105,8,170,152,24,105,8,168,32,123,218,169,32,133,110,96,166,90,10,10,24,105,209,133,0,181,160,41,240,56,233,48,73,16,24,101,0,133,83,180,152,181,144,170,96,224,2,144,35,181,168,41,4,240,13,165,11,74,74,74,41,1,24,105,2,76,233,223,165,11,10,10,24,117,168,41,7,168,185,3,224,76,233,223,181,111,240,7,165,11,41,8,240,1,96,138,133,4,181,160,41,3,72,181,168,41,240,24,117,176,133,83,180,152,181,144,170,104,32,115,218,96,2,0,0,1,2,1,2,2,181,160,41,15,56,233,7,16,5,73,255,24,105,1,10,41,252,24,105,161,133,83,169,3,133,4,180,152,181,144,170,32,123,218,96,169,9,133,90,166,90,32,60,224,198,90,16,247,96,181,204,74,74,74,41,254,168,185,216,228,133,17,185,217,228,133,18,108,17,0,181,204,41,3,168,32,99,224,181,214,41,1,240,3,32,99,224,96,185,108,228,10,24,117,184,149,184,185,112,228,10,24,117,194,149,194,96,214,204,181,204,41,15,208,13,181,204,41,240,56,233,16,240,2,9,3,149,204,96,181,204,208,71,224,2,176,5,169,1,141,15,3,181,160,41,3,168,9,64,149,204,185,108,228,10,10,10,24,117,144,149,184,185,112,228,10,10,10,24,117,152,149,194,169,0,149,214,181,168,41,240,240,21,201,192,240,8,201,96,240,9,41,128,208,9,169,1,149,214,96,169,3,149,214,96,169,9,133,90,166,90,32,230,224,198,90,16,247,96,181,204,74,74,74,41,254,168,185,226,228,133,17,185,227,228,133,18,108,17,0,181,204,41,3,72,180,194,181,184,170,169,2,133,4,169,177,133,83,104,32,100,218,96,181,204,72,180,194,181,184,170,104,24,105,64,32,226,222,96,169,1,133,90,166,90,181,160,16,49,201,224,176,45,181,8,41,3,240,39,181,168,41,192,201,64,208,28,181,204,240,24,181,212,208,23,181,204,149,212,181,184,149,192,181,194,149,202,181,214,149,222,169,0,149,204,32,140,224,198,90,16,197,96,173,0,1,208,25,162,7,181,160,16,14,201,224,176,10,32,77,212,41,31,208,3,32,140,224,202,224,1,208,233,96,169,7,133,90,166,90,181,160,16,99,201,224,176,95,181,152,56,233,8,168,181,144,56,233,8,170,32,6,215,166,90,165,17,149,224,165,18,41,3,149,232,160,33,224,2,176,25,177,17,201,33,208,11,169,128,29,3,1,157,3,1,76,201,225,189,3,1,41,127,157,3,1,32,243,225,181,144,41,7,208,11,181,232,9,128,149,232,160,32,32,243,225,181,152,41,7,208,11,181,232,9,64,149,232,160,1,32,243,225,198,90,16,147,96,177,17,9,128,145,17,96,169,7,133,90,166,90,181,160,16,43,201,224,176,39,181,224,133,17,181,232,41,3,9,4,133,18,160,33,32,52,226,181,232,41,128,240,5,160,32,32,52,226,181,232,41,64,240,5,160,1,32,52,226,198,90,16,203,96,177,17,41,127,145,17,96,165,134,240,60,165,98,240,22,198,98,208,7,169,0,133,134,76,123,226,169,2,133,4,169,59,133,83,76,108,226,165,11,41,8,240,28,169,2,133,4,165,136,10,10,24,105,129,133,83,166,134,164,135,169,0,133,110,32,123,218,169,32,133,110,96,169,1,133,90,166,90,181,137,240,30,165,11,41,63,208,2,214,137,169,2,133,4,180,152,181,144,170,165,11,41,2,10,24,105,41,133,83,32,123,218,198,90,16,216,96,165,69,240,37,165,11,41,15,208,31,165,11,41,63,208,4,198,69,240,18,165,69,201,4,176,15,165,11,41,16,240,6,32,158,203,76,210,226,32,245,202,165,104,240,47,48,45,169,3,133,4,198,104,165,104,74,74,56,233,5,16,5,73,255,24,105,1,56,233,5,16,5,73,255,24,105,1,10,168,185,6,227,133,17,185,7,227,133,18,108,17,0,96,240,219,18,227,23,227,28,227,46,227,54,227,169,241,76,30,227,169,245,76,30,227,169,249,162,120,160,216,133,83,32,123,218,96,24,101,105,76,34,227,169,0,133,105,32,62,227,96,169,16,133,105,32,62,227,96,162,112,160,208,169,209,32,40,227,162,128,160,208,169,213,32,40,227,162,112,160,224,169,217,32,40,227,162,128,160,224,169,221,32,40,227,96,169,0,149,168,224,2,176,17,189,122,228,149,144,189,124,228,149,152,169,0,149,111,76,169,227,230,106,164,106,192,3,208,5,169,0,133,106,168,185,116,228,149,144,185,119,228,149,152,165,127,201,3,240,8,201,10,240,4,201,17,208,8,169,4,149,168,169,0,133,134,169,240,149,160,180,152,181,144,170,169,15,32,11,216,96,189,126,228,149,160,224,2,176,10,169,3,149,137,189,1,1,76,250,227,164,143,185,139,0,208,5,230,143,76,203,227,56,233,1,153,139,0,165,70,240,5,169,35,76,232,227,165,133,56,233,1,10,10,24,101,143,168,185,236,228,201,224,208,2,9,3,21,168,201,231,208,2,169,228,149,168,169,0,149,176,96,162,9,169,0,149,204,202,16,251,96,169,0,162,7,149,160,157,3,1,202,16,248,96,133,0,181,160,41,15,5,0,149,160,96,165,70,240,5,169,35,76,54,228,165,133,56,233,1,10,10,168,185,120,229,133,139,185,121,229,133,140,185,122,229,133,141,185,123,229,133,142,96,10,144,3,169,3,96,10,144,3,169,1,96,10,144,3,169,2,96,10,144,3,169,0,96,169,255,96,0,255,0,1,255,0,1,0,24,120,216,24,24,24,88,152,216,216,160,160,162,162,162,162,162,162,160,160,160,161,160,163,162,162,162,161,160,163,161,160,163,161,162,163,240,219,234,221,234,221,234,221,234,221,234,221,234,221,234,221,82,220,72,221,124,220,148,221,137,221,126,221,100,222,85,222,240,219,253,222,51,223,70,223,70,223,205,222,205,222,205,222,182,223,182,223,182,223,182,223,182,223,182,223,11,224,11,224,240,219,118,224,118,224,118,224,81,224,240,219,18,225,18,225,18,225,251,224,128,160,192,224,224,160,192,128,128,160,192,224,192,160,128,224,192,224,128,160,192,160,128,224,128,160,192,128,192,224,160,128,128,160,192,224,128,160,192,224,160,224,192,160,192,160,128,224,192,160,128,224,192,160,128,224,128,192,160,224,128,192,160,224,224,160,192,128,224,128,192,160,160,224,128,192,160,128,192,224,192,160,128,224,160,128,192,224,224,128,192,160,192,224,160,128,192,160,128,224,160,224,128,192,192,224,160,128,160,224,128,192,192,160,128,224,128,160,192,224,192,160,224,192,224,128,192,160,160,224,192,160,192,160,128,224,192,160,128,224,18,2,0,0,2,4,0,14,14,4,0,2,10,5,2,3,5,2,8,5,7,2,9,2,3,4,6,7,7,2,4,7,6,4,7,3,12,2,4,2,5,6,4,5,8,6,0,6,8,8,0,4,10,4,0,6,2,0,10,8,16,0,2,2,2,2,8,8,4,2,6,8,4,8,4,4,8,2,2,8,8,2,6,4,8,6,2,4,6,0,4,10,4,2,4,10,2,8,0,10,6,6,4,4,2,8,8,2,2,1,15,2,10,4,0,6,4,8,4,4,3,8,6,3,8,6,2,4,4,8,4,4,4,10,0,6,4,6,0,10,169,9,133,90,166,90,181,204,41,240,201,64,208,121,181,214,208,7,138,69,11,41,1,240,110,181,204,41,3,168,185,73,234,16,5,73,255,24,105,1,133,84,10,10,133,100,185,77,234,16,5,73,255,24,105,1,133,85,10,10,133,101,180,194,181,184,170,32,147,230,240,19,166,90,181,194,24,101,100,133,72,181,184,24,101,101,133,71,32,154,230,166,90,181,194,56,229,84,168,181,184,56,229,85,170,32,147,230,240,25,166,90,181,194,56,229,100,56,229,84,133,72,181,184,56,229,101,56,229,85,133,71,32,154,230,198,90,48,3,76,8,230,96,134,71,132,72,32,6,215,32,37,215,32,60,215,240,103,177,17,41,252,201,200,208,28,165,104,240,24,169,39,133,104,169,1,141,11,3,141,7,3,32,8,204,166,90,169,51,149,204,76,9,231,177,17,201,18,176,61,166,90,169,51,149,204,177,17,201,17,240,40,181,214,41,2,240,13,169,0,32,132,215,169,1,141,12,3,76,9,231,177,17,201,16,240,15,224,2,176,5,169,1,141,12,3,32,67,215,169,1,96,224,2,176,5,169,1,141,13,3,169,0,96,169,1,133,90,166,90,181,160,16,4,201,224,144,3,76,122,231,169,7,133,91,164,91,185,204,0,41,240,201,64,208,70,185,184,0,56,245,144,16,5,73,255,24,105,1,201,10,176,53,185,194,0,56,245,152,16,5,73,255,24,105,1,201,10,176,36,169,51,153,204,0,181,137,240,8,169,0,153,204,0,76,114,231,169,115,149,160,169,1,141,7,3,169,0,157,1,1,149,168,76,122,231,198,91,165,91,201,1,208,167,198,90,16,146,169,7,133,90,166,90,181,160,16,4,201,224,144,3,76,52,232,169,9,133,91,165,91,41,6,240,3,76,45,232,164,91,185,204,0,41,240,201,64,240,3,76,45,232,185,184,0,56,245,144,16,5,73,255,24,105,1,201,10,176,114,185,194,0,56,245,152,16,5,73,255,24,105,1,201,10,176,97,169,51,153,204,0,181,168,41,4,240,11,32,190,232,181,168,201,228,208,2,214,168,181,168,41,3,240,10,214,168,169,1,141,14,3,76,45,232,169,115,149,160,169,1,141,10,3,181,168,74,74,74,74,74,56,233,4,170,165,91,41,1,133,71,208,5,246,115,76,21,232,246,119,165,70,201,2,240,25,189,186,232,32,225,217,165,71,170,32,190,217,32,56,209,76,52,232,198,91,48,3,76,147,231,198,90,165,90,201,1,240,3,76,130,231,169,1,133,90,166,90,181,160,16,4,201,224,144,3,76,181,232,169,9,133,91,165,91,41,6,208,87,164,91,185,204,0,41,240,201,64,208,76,165,90,69,91,41,1,240,68,185,184,0,56,245,144,16,5,73,255,24,105,1,201,10,176,51,185,194,0,56,245,152,16,5,73,255,24,105,1,201,10,176,34,169,51,153,204,0,181,137,240,8,169,0,153,204,0,76,177,232,181,111,208,13,165,70,201,2,240,7,169,200,149,111,76,181,232,198,91,16,159,198,90,16,138,96,16,32,48,64,169,1,141,9,3,32,77,212,41,3,32,2,233,133,134,32,77,212,41,3,32,2,233,133,135,169,255,133,136,169,0,133,98,32,114,233,165,98,208,221,32,77,212,41,7,168,185,250,232,133,136,169,0,133,98,166,90,164,91,96,0,1,2,3,4,5,4,3,133,0,10,24,101,0,10,24,105,6,10,10,10,96,169,9,133,90,165,90,41,6,208,83,166,90,181,204,41,240,201,64,208,73,169,9,133,91,165,91,168,41,7,133,0,165,90,41,7,197,0,240,50,185,204,0,41,240,201,64,208,41,185,184,0,56,245,184,16,5,73,255,24,105,1,201,6,176,24,185,194,0,56,245,194,16,5,73,255,24,105,1,201,6,176,7,169,0,149,204,153,204,0,198,91,16,187,198,90,16,163,96,165,134,240,107,165,98,208,103,169,1,133,73,166,73,181,160,16,89,201,224,176,85,181,144,56,229,134,16,5,73,255,24,105,1,201,12,176,69,181,152,56,229,135,16,5,73,255,24,105,1,201,12,176,53,169,50,133,98,165,136,48,49,165,70,201,2,240,20,169,80,32,225,217,166,73,32,190,217,32,56,209,166,73,169,1,141,6,3,165,136,10,168,185,226,233,133,17,185,227,233,133,18,104,104,108,17,0,198,73,16,157,96,240,233,245,233,251,233,7,234,23,234,62,234,72,234,169,10,149,137,96,169,10,141,0,1,96,165,104,16,7,32,158,203,169,20,133,69,96,189,1,1,201,96,240,8,24,105,32,157,1,1,149,168,96,169,7,133,90,169,1,141,10,3,164,90,185,160,0,16,14,201,224,176,10,169,115,153,160,0,169,0,153,168,0,198,90,165,90,201,1,208,227,96,246,81,169,1,141,4,3,141,5,3,96,0,255,0,1,255,0,1,0,169,15,141,21,64,169,192,141,23,64,169,28,133,240,169,3,133,241,162,0,160,0,152,145,240,157,0,3,24,165,240,105,8,133,240,144,2,230,241,232,224,28,208,234,96,165,109,208,6,169,28,133,245,16,4,169,1,133,245,169,0,162,3,149,249,202,16,251,169,0,133,244,169,28,133,240,169,3,133,241,166,244,189,0,3,240,59,160,0,177,240,240,53,201,5,144,11,56,233,5,170,169,1,149,249,76,227,234,170,202,181,249,208,32,169,1,149,249,138,168,24,105,5,160,0,145,240,138,10,10,170,169,4,133,253,200,177,240,157,0,64,232,198,253,208,245,24,165,240,105,8,133,240,144,2,230,241,230,244,165,244,197,245,144,171,162,0,134,253,181,249,208,12,138,10,10,170,10,41,16,73,16,157,0,64,166,253,232,224,4,144,231,160,0,132,244,169,28,133,240,169,3,133,241,166,244,189,0,3,240,10,201,1,208,26,254,0,3,76,79,235,24,165,240,105,8,133,240,144,2,230,241,230,244,165,244,197,245,144,220,96,160,7,177,240,56,233,1,145,240,240,56,208,223,169,0,160,5,145,240,32,175,236,32,190,236,160,0,145,240,32,190,236,160,1,145,240,32,190,236,160,2,145,240,32,190,236,160,4,145,240,160,0,177,240,201,4,208,12,32,190,236,160,3,145,240,16,3,32,175,236,32,190,236,201,232,176,82,201,96,240,68,144,9,233,96,160,6,145,240,76,136,235,72,41,248,74,74,170,189,230,236,133,253,189,231,236,133,254,104,41,7,240,8,170,70,253,102,254,202,208,249,160,4,177,240,41,248,5,253,145,240,165,254,136,145,240,160,0,177,240,201,5,144,5,56,233,4,145,240,160,6,177,240,200,145,240,76,46,235,233,232,32,208,236,10,236,33,236,51,236,69,236,87,236,97,236,107,236,117,236,129,236,133,236,136,236,153,236,153,236,153,236,153,236,153,236,153,236,165,236,166,244,169,0,157,0,3,160,0,145,240,160,5,177,240,56,233,1,145,240,76,46,235,32,190,236,133,253,160,1,177,240,41,63,5,253,145,240,76,136,235,32,190,236,133,253,160,1,177,240,41,192,5,253,145,240,76,136,235,32,190,236,133,253,160,1,177,240,41,240,5,253,145,240,76,136,235,32,190,236,160,2,145,240,76,136,235,32,190,236,160,4,145,240,76,136,235,32,190,236,160,1,145,240,76,136,235,169,0,162,2,149,246,202,16,251,76,136,235,162,0,240,5,162,1,44,162,2,32,190,236,246,246,213,246,208,18,169,0,149,246,240,0,160,5,177,240,24,105,1,145,240,76,136,235,32,190,236,160,5,145,240,76,136,235,165,244,10,170,189,254,236,133,242,189,255,236,133,243,96,165,244,160,5,177,240,168,177,242,72,200,152,160,5,145,240,104,96,10,168,200,104,133,253,104,133,254,177,253,170,200,177,253,133,254,134,253,108,253,0,7,242,7,128,7,20,6,174,6,67,5,244,5,158,5,78,5,2,4,186,4,118,4,54,44,238,54,237,93,237,136,237,159,238,174,238,25,238,179,237,213,237,72,238,3,238,244,237,94,238,86,238,103,238,18,238,149,238,140,238,130,238,115,238,122,238,193,238,223,238,10,239,60,239,79,239,98,239,58,238,1,129,127,64,239,104,27,43,51,240,2,6,51,67,83,240,2,12,67,83,4,240,2,18,91,12,28,240,2,24,120,28,104,28,28,28,120,28,232,3,16,127,8,120,26,104,26,241,3,7,120,50,104,50,241,3,14,120,66,104,66,241,3,21,90,241,3,25,11,241,3,29,120,82,104,82,241,3,36,120,82,232,2,129,127,64,120,81,104,81,242,3,7,120,10,104,10,242,3,14,120,26,104,26,242,3,21,50,242,3,25,66,242,3,29,120,58,104,58,242,3,36,120,58,232,4,31,127,48,10,98,73,73,234,30,73,73,234,29,73,73,234,28,73,73,234,27,73,73,234,26,73,234,25,73,234,24,73,232,2,31,127,48,98,0,1,0,234,30,1,0,234,29,1,0,1,0,234,28,1,234,27,0,234,26,1,234,25,0,232,2,32,127,48,99,26,18,81,49,25,17,80,48,24,232,4,31,127,64,10,98,81,234,30,81,234,8,106,81,232,1,143,130,16,111,44,232,2,128,127,64,99,82,27,59,83,74,19,51,75,27,59,83,28,60,232,2,130,127,64,100,27,43,59,28,44,60,108,83,232,2,130,127,64,99,83,27,28,59,60,83,106,84,232,2,96,127,64,100,82,58,82,3,82,3,19,27,232,2,213,127,0,98,28,29,232,3,7,127,8,97,58,19,34,232,2,64,127,0,97,61,98,69,234,16,40,232,2,128,127,24,97,57,232,4,0,127,40,10,97,40,232,2,140,148,64,97,16,100,24,249,5,2,128,148,72,98,64,72,249,5,1,31,127,40,97,34,66,90,27,232,1,160,127,64,102,28,60,28,83,28,60,5,114,84,232,2,144,127,64,98,56,102,234,32,59,83,59,27,59,83,28,106,20,232,1,184,127,64,239,101,12,83,240,12,5,12,83,240,12,11,52,36,240,8,16,234,48,176,80,234,32,156,84,232,2,184,127,64,101,67,51,241,12,4,67,51,241,12,10,20,75,241,8,15,234,58,48,80,9,41,49,81,10,42,50,82,11,43,51,83,12,44,156,234,32,44,232,3,0,127,8,161,1,1,238,21,106,11,11,11,238,34,111,51,101,67,126,238,51,83,106,238,21,67,51,83,111,238,34,19,101,35,126,238,51,51,106,238,21,35,19,74,156,238,255,50,232,1,66,127,64,102,27,11,120,27,104,82,66,50,26,26,26,120,26,232,2,130,127,64,102,82,82,120,82,104,50,42,18,26,26,26,120,26,232,3,16,127,8,102,59,51,120,59,104,27,11,82,82,82,82,120,82,232,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,201,255,208,5,169,36,76,16,240,201,36,144,3,56,233,35,133,0,169,240,133,18,169,122,133,17,198,0,240,8,169,91,32,170,215,76,26,240,169,0,133,90,165,17,133,19,165,18,133,20,169,16,133,87,32,246,216,169,16,133,86,165,90,74,168,165,90,41,1,240,7,177,19,41,15,76,84,240,177,19,74,74,74,74,166,86,164,87,32,11,216,169,0,133,12,230,90,165,86,24,105,16,133,86,201,224,208,209,230,90,165,87,24,105,16,133,87,201,224,208,189,96,221,221,221,221,221,221,221,212,212,212,212,212,212,221,212,212,212,212,212,212,221,212,212,212,148,212,212,221,212,212,211,211,212,212,221,211,211,209,209,211,211,221,29,17,211,211,209,29,29,141,51,209,209,211,61,141,209,209,212,68,209,209,221,212,212,212,212,212,212,221,212,212,211,211,212,212,221,212,212,221,221,212,212,221,221,221,221,221,221,221,221,221,217,221,217,221,221,221,212,217,221,212,212,212,221,212,221,221,68,212,148,221,221,212,221,221,217,221,221,189,212,221,157,212,180,157,187,221,212,221,157,189,221,212,68,187,185,221,180,221,221,217,180,212,212,212,221,148,217,212,212,221,212,221,212,212,212,68,212,148,221,212,212,212,68,221,221,221,212,221,221,221,212,212,221,212,212,221,221,212,68,221,221,221,77,221,77,221,221,219,187,77,221,221,102,109,75,187,221,221,221,221,221,187,187,221,212,212,68,45,187,187,68,67,212,208,221,187,187,221,77,221,208,221,219,221,221,153,157,219,221,209,209,221,221,219,187,189,66,4,32,51,59,187,189,221,221,212,209,27,187,189,77,215,221,211,59,187,221,68,215,221,221,219,187,221,148,77,221,221,212,221,221,219,189,221,221,221,219,221,187,221,20,65,29,221,189,189,208,68,68,68,29,141,141,212,68,68,68,66,221,221,3,221,211,68,210,221,173,13,125,125,66,221,221,221,77,17,221,66,218,173,221,68,68,68,68,221,221,208,68,68,68,68,45,221,211,52,68,68,67,61,221,212,65,52,67,20,77,189,189,51,221,221,51,219,189,155,221,221,221,221,187,157,221,221,68,77,221,221,221,109,29,77,221,136,157,221,157,77,221,77,221,221,221,77,68,77,68,218,173,173,61,221,61,221,218,221,221,221,29,170,218,170,212,77,68,221,164,212,45,221,221,221,221,173,221,221,87,221,170,173,173,157,77,93,221,221,209,29,221,221,84,77,221,221,67,51,65,221,221,68,61,221,221,211,77,221,61,221,221,221,221,221,221,221,221,208,210,187,221,221,210,93,45,221,11,32,189,210,93,45,77,11,32,189,212,221,77,157,75,212,189,221,208,141,77,55,219,189,68,45,219,75,221,4,77,221,221,11,187,45,221,221,148,77,59,187,48,68,157,136,141,29,189,29,136,141,212,221,77,221,77,221,221,212,45,211,211,221,4,189,221,61,221,221,221,187,189,221,29,221,221,221,27,189,221,221,221,216,141,221,221,221,152,136,221,221,157,221,221,157,221,189,137,157,221,217,221,219,157,221,157,221,221,221,185,157,221,137,221,217,219,153,157,157,221,221,213,217,157,221,153,221,221,125,221,157,153,157,213,221,213,157,221,153,189,217,221,217,221,221,155,221,153,221,216,137,221,189,217,221,221,221,221,221,221,216,214,157,102,221,221,221,221,221,221,221,77,212,209,212,221,221,180,68,212,214,212,45,221,187,189,211,212,211,208,45,186,170,170,170,170,173,173,212,221,221,17,221,221,221,221,77,208,68,52,56,141,68,212,208,68,180,102,77,221,217,214,219,187,189,221,170,218,170,170,218,170,173,187,208,221,17,221,221,221,187,77,45,208,214,20,221,182,77,45,221,211,212,221,221,221,221,221,209,211,221,221,212,221,221,214,189,221,77,221,221,107,89,125,77,221,214,181,151,216,189,221,221,89,125,139,221,221,221,221,216,189,221,221,221,221,221,219,107,219,107,221,221,148,213,151,213,151,212,157,221,219,139,219,139,221,221,221,221,109,221,109,221,221,77,213,151,213,151,221,77,77,219,139,219,139,221,77,221,29,221,221,221,29,221,221,68,221,221,212,77,221,221,221,221,221,221,221,221,208,52,221,221,221,67,45,3,221,77,187,212,221,13,77,221,75,187,180,221,13,77,208,75,153,180,45,77,1,20,170,170,170,68,77,212,68,153,73,148,68,45,221,68,157,77,148,66,221,221,68,68,68,68,66,221,75,51,57,147,51,59,77,75,187,187,187,187,187,77,221,187,177,17,187,187,221,221,210,212,212,221,45,221,221,221,217,212,212,77,221,208,68,68,212,221,221,221,221,210,212,212,77,187,189,208,221,221,217,219,187,189,208,212,68,148,75,179,157,211,51,157,212,219,189,13,4,68,217,187,187,189,221,221,217,221,187,187,180,221,148,219,187,185,187,180,221,4,187,187,189,221,212,45,212,187,221,221,132,68,221,221,187,221,221,212,208,221,209,187,221,221,221,221,221,221,221,221,68,68,221,221,212,68,29,29,212,221,221,221,221,77,61,221,212,77,218,170,170,212,45,212,141,221,102,106,212,217,116,221,77,68,74,170,218,68,221,221,221,154,221,218,141,221,170,173,170,68,218,221,221,221,221,212,136,218,170,221,68,77,221,221,221,221,221,221,77,136,221,212,77,13,77,221,221,221,212,221,77,221,221,221,221,221,221,221,221,221,29,221,29,221,221,212,68,77,221,68,68,221,212,221,221,77,221,217,221,217,212,61,221,52,212,77,212,210,182,150,176,217,77,211,221,187,187,189,216,77,70,221,187,187,189,209,77,73,210,184,152,176,212,221,68,212,29,221,20,217,221,73,221,221,77,221,212,221,68,68,77,221,68,73,157,68,221,61,221,61,212,221,68,221,221,221,221,221,221,221,221,221,221,221,221,221,187,221,20,68,29,219,189,189,208,68,68,66,221,189,221,212,75,75,68,221,221,221,212,187,75,180,221,221,189,212,68,68,68,221,189,187,221,75,75,77,219,189,170,173,68,68,77,170,173,221,221,0,0,13,221,221,221,221,34,34,45,221,221,85,93,221,221,221,119,125,34,45,221,221,221,0,13,119,117,221,221,215,85,93,221,221,68,221,77,221,221,219,180,77,221,77,221,221,187,187,187,187,68,221,221,184,75,68,75,187,180,157,187,75,187,139,180,116,221,219,180,107,187,180,212,221,212,68,68,187,68,43,189,88,68,221,212,61,221,189,212,212,214,19,187,66,189,212,221,4,59,180,221,189,212,66,3,187,27,75,189,221,77,189,221,75,59,221,221,61,189,221,219,187,221,221,221,221,221,221,221,221,221,155,157,221,221,221,221,221,219,219,109,221,221,221,219,221,221,177,221,221,221,219,189,219,219,109,221,221,219,219,219,221,177,221,221,219,221,189,221,187,109,221,221,189,221,219,187,177,221,221,219,221,189,187,187,221,77,221,221,189,219,187,157,68,221,221,219,219,187,189,148,77,221,221,189,187,189,153,68,221,221,189,219,189,221,221,29,221,221,29,221,212,212,77,220,204,68,221,212,221,77,156,204,204,221,204,199,77,212,204,204,221,204,204,204,68,2,221,221,221,92,204,196,2,216,141,68,68,204,204,204,196,77,221,212,76,204,199,221,221,212,68,220,204,68,212,221,204,196,205,221,212,212,221,204,204,200,216,221,20,221,76,204,205,221,212,221,221,68,125,221,221,212,212,221,221,221,221,221,153,155,221,212,221,221,221,157,217,221,75,77,221,68,68,217,221,212,180,221,77,180,153,221,221,77,185,75,212,221,221,221,221,157,73,68,221,221,221,68,148,217,221,221,221,221,77,180,155,221,221,221,153,155,212,221,68,221,221,157,68,68,221,73,157,221,157,217,221,221,217,68,221,185,153,221,221,221,73,157,221,221,221,221,221,217,157,212,212,212,212,212,212,221,212,212,212,212,212,212,221,216,216,216,216,216,216,221,29,29,77,221,77,29,29,77,67,77,77,67,77,77,141,141,157,141,157,141,141,187,221,77,189,77,219,189,187,187,67,179,75,187,189,187,187,187,187,187,187,189,29,29,75,187,77,29,29,212,212,221,189,212,212,221,212,212,221,221,212,212,221,211,211,221,221,211,211,221,221,218,212,221,77,77,221,221,221,221,221,77,157,221,221,218,209,157,77,77,221,141,74,217,209,61,77,221,221,74,221,212,221,221,221,77,74,173,170,170,221,77,221,209,221,219,218,216,141,68,4,217,187,186,209,29,61,13,212,187,186,212,221,214,221,212,219,218,219,221,212,214,211,51,221,187,189,212,212,221,221,218,187,189,221,221,221,221,218,219,221,221,209,17,221,29,221,221,209,68,68,68,68,221,221,219,187,187,187,180,77,221,187,221,221,221,187,68,221,189,157,217,221,219,187,221,189,157,217,221,219,187,221,189,219,221,221,187,68,45,187,187,187,187,180,68,45,75,180,75,187,68,68,221,212,68,68,68,68,77,157,157,73,68,68,68,45,157,217,67,148,68,68,153,157,221,221,221,221,221,221,221,221,221,219,221,221,221,221,221,221,185,189,221,221,221,221,189,219,221,187,221,221,219,75,221,219,68,189,221,221,180,189,221,187,221,189,189,219,221,189,221,219,157,75,221,219,155,221,189,189,148,189,221,189,219,155,221,75,221,189,221,189,189,221,189,219,75,219,75,221,221,221,219,75,221,189,219,221,219,221,189,221,221,185,189,185,189,221,221,219,75,221,221,221,221,221,221,221,221,221,221,217,157,221,221,221,221,221,221,157,221,221,221,217,155,180,148,187,153,221,221,217,187,155,185,221,221,189,221,155,187,157,221,189,155,221,219,187,221,219,157,189,221,104,184,109,221,189,221,221,157,109,157,221,221,221,217,221,157,217,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,157,221,221,221,157,221,221,157,72,221,221,13,221,221,77,75,211,68,77,221,219,189,75,2,221,217,157,187,187,187,68,77,4,221,221,187,17,132,208,67,13,72,209,51,221,212,61,13,13,20,204,204,204,204,205,13,61,204,204,204,204,205,221,157,204,204,204,204,205,77,77,204,204,204,204,205,13,77,204,204,204,204,205,13,77,221,221,204,204,205,221,61,221,221,220,204,205,221,217,212,212,212,217,221,212,212,221,221,217,221,221,212,212,221,157,217,217,157,212,221,212,217,77,221,157,221,221,68,212,77,157,221,221,157,77,212,77,68,221,157,157,212,217,221,148,221,221,68,212,221,212,157,221,217,68,212,77,68,221,77,212,221,212,157,221,212,77,221,212,212,73,217,221,77,77,68,221,221,212,157,221,77,77,221,221,212,68,221,221,170,221,221,221,221,221,109,218,189,45,221,221,221,182,221,221,125,45,170,221,187,216,16,221,123,173,221,187,189,217,16,221,221,109,187,134,208,217,29,214,189,184,221,57,208,216,219,189,221,221,210,57,221,187,189,221,171,93,210,54,139,189,218,173,13,93,221,221,189,221,221,221,13,186,221,141,157,221,221,221,218,173,221,153,221,221,221,221,221,157,221,221,157,221,221,221,221,153,221,157,217,157,221,221,217,221,157,221,157,153,189,217,221,153,157,189,157,221,212,221,221,157,153,157,221,185,157,148,148,77,221,221,221,155,155,221,77,217,157,221,157,219,221,157,217,221,221,77,217,221,153,73,221,185,153,187,73,157,73,221,221,212,221,221,187,212,221,221,217,221,221,219,212,221,221,217,221,221,217,212,221,221,221,221,221,221,87,221,221,221,221,109,221,157,221,221,221,209,177,212,45,221,221,221,107,187,100,45,221,221,209,187,203,180,45,221,221,107,188,204,187,45,221,209,187,204,204,203,177,221,107,188,204,204,204,187,109,187,204,204,204,204,203,189,219,204,204,204,204,203,221,219,204,204,204,204,203,221,219,204,205,221,204,203,221,219,204,221,221,220,203,221,221,221,221,221,221,77,221,212,170,217,212,221,221,221,221,170,75,187,170,217,221,221,221,219,187,170,77,221,217,221,170,219,221,221,221,187,77,170,157,221,212,221,187,189,221,221,217,221,157,212,170,212,221,221,221,221,157,170,187,170,187,212,221,221,221,189,170,187,170,221,221,217,189,221,187,170,221,221,77,77,221,221,221,221,77,221,221,221,212,157,221,221,221,221,221,221,221,221,221,221,209,29,221,109,221,214,109,27,182,209,177,221,27,177,187,187,27,187,29,187,187,187,187,187,187,189,155,171,187,187,171,187,189,187,170,171,187,170,171,157,187,187,171,155,187,171,189,187,187,187,187,187,187,189,187,187,179,59,187,187,141,139,187,61,211,187,184,221,216,51,221,221,51,61,221,221,221,221,221,221,221,221,221,218,221,221,173,221,221,170,218,218,170,173,170,173,187,77,212,221,173,171,173,186,170,173,157,212,187,189,187,218,221,173,170,170,189,170,218,218,173,218,221,221,221,75,77,75,218,221,173,218,171,170,170,219,77,173,77,212,221,173,187,173,173,170,218,173,164,170,173,221,221,77,187,221,186,221,173,218,170,189,221,218,218,173,218,221,221,221,221,221,221,204,204,204,204,204,204,205,204,204,204,204,204,204,205,204,196,204,204,196,204,205,196,212,212,196,212,212,205,195,52,221,221,212,51,205,204,196,20,148,20,204,205,156,204,216,216,220,204,157,204,204,209,209,220,204,205,204,204,212,212,220,204,205,204,196,221,29,212,204,205,196,196,216,136,212,196,205,212,20,221,221,212,20,221,211,221,221,221,221,211,221,221,221,157,221,217,221,221,217,221,217,221,155,189,221,221,157,221,217,182,125,221,221,217,219,187,187,213,221,215,221,155,185,189,217,221,216,123,217,187,157,213,221,221,187,187,189,217,221,221,214,123,217,189,221,157,221,219,187,157,157,109,217,221,187,185,221,221,93,221,221,221,157,221,221,221,213,157,221,221,221,221,214,125,221,125,109,221,221,221,221,221,221,221,32,221,221,221,221,34,32,210,221,34,221,221,34,36,77,221,36,45,221,0,212,45,208,36,77,221,210,212,2,210,68,77,221,210,13,212,36,0,77,221,210,221,4,66,210,77,221,208,221,36,66,210,77,221,208,51,212,68,210,35,77,208,221,2,64,34,32,13,221,45,64,36,77,208,221,221,32,45,221,66,210,221,221,32,221,221,212,77,221,221,221,221,221,221,221,221,221,221,77,77,221,221,221,189,219,75,75,221,189,221,75,180,68,68,187,75,221,68,68,148,148,68,75,221,170,164,68,68,170,171,221,164,68,68,68,68,170,189,68,74,68,74,68,75,189,68,170,164,170,164,74,173,186,171,187,187,170,186,189,219,189,221,221,187,219,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,109,221,221,109,221,221,109,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,221,189,221,221,221,221,221,189,187,221,221,221,221,219,189,155,189,221,221,221,187,157,153,187,221,221,219,185,157,255,255,255,255,255,255,255,255,255,255,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,64,46,46,46,46,46,46,46,64,64,64,64,46,64,64,64,64,64,64,64,46,46,46,64,46,46,64,46,46,46,46,46,64,46,46,46,46,46,64,46,46,64,46,46,46,46,46,64,46,64,46,46,46,46,46,46,64,46,64,46,46,64,64,46,46,46,64,64,46,46,64,64,46,46,46,64,64,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,64,46,64,64,64,64,64,64,64,46,46,46,46,46,46,64,46,46,64,46,46,46,46,46,64,46,46,46,46,46,64,46,46,46,64,64,64,64,64,64,64,46,46,46,46,64,46,64,46,46,46,46,46,64,46,46,46,46,46,46,64,46,46,64,46,64,64,64,64,64,64,64,64,64,46,46,46,46,46,64,46,46,46,64,46,64,46,64,46,46,46,46,46,46,46,64,46,46,64,46,46,64,46,46,64,46,46,46,46,46,46,64,46,64,46,46,46,64,46,46,46,64,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,64,46,46,46,46,46,46,46,46,46,46,46,64,64,64,64,64,64,64,64,46,64,64,64,64,64,64,64,64,46,46,46,46,46,46,64,46,64,46,46,64,46,46,64,46,64,64,64,64,64,64,46,46,64,46,46,64,46,46,64,46,46,46,46,64,46,46,46,46,64,64,64,64,64,64,64,46,64,64,64,64,64,64,46,46,64,46,46,64,46,46,64,46,46,46,46,64,46,46,46,46,64,46,46,64,46,46,64,46,46,64,64,64,46,46,46,46,64,64,64,64,64,64,64,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,46,64,46,46,46,46,46,46,46,46,46,64,46,46,46,46,46,64,46,46,46,46,64,46,46,46,46,64,46,46,46,46,46,64,46,46,46,46,64,46,46,46,46,64,46,46,46,46,46,64,46,46,46,46,64,46,46,46,46,64,46,46,46,46,46,64,46,46,46,46,64,46,46,46,46,64,46,46,46,46,64,46,46,46,46,46,64,46,46,46,46,64,46,46,46,64,46,46,46,46,46,46,46,46,46,64,64,64,46,46,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,212,112,192,112,192,0,0,1,1,65,113,85,124,0,0,1,1,113,17,119,31,91,122,90,125,94,119,64,0,127,31,127,30,119,16,112,0,0,0,0,0,16,28,208,60,0,0,0,0,28,0,12,192,16,156,144,156,48,220,16,0,236,96,108,96,204,0,12,0,0,0,1,1,113,81,117,92,0,0,1,1,65,113,23,127,123,90,122,93,126,87,48,0,31,127,31,126,23,112,64,0,0,0,0,0,28,16,220,48,0,0,0,0,16,12,0,204,28,144,156,144,60,208,28,0,224,108,96,108,192,12,0,0,0,15,5,7,1,3,0,62,0,10,10,15,1,3,3,63,2,2,1,15,5,5,0,0,1,1,0,8,10,10,0,0,0,254,84,254,248,28,236,148,0,170,170,252,240,248,248,232,116,12,248,254,84,84,0,0,136,240,0,0,170,170,0,0,0,15,10,15,1,3,0,62,0,13,5,7,1,3,3,63,2,2,1,15,10,10,0,0,1,1,0,8,5,5,0,0,0,252,170,254,248,28,236,148,0,86,84,252,240,248,248,232,116,12,248,254,170,170,0,0,136,240,0,0,84,84,0,0,0,64,119,84,123,90,122,89,0,112,23,127,31,127,31,126,124,87,113,65,1,1,0,0,31,113,17,113,1,1,0,0,0,16,220,48,28,144,156,144,0,28,192,204,224,108,96,108,60,208,28,16,0,0,0,0,192,12,0,12,0,0,0,0,0,112,87,116,91,122,90,121,0,64,119,31,127,31,127,30,92,119,81,49,1,1,0,0,127,17,113,65,1,1,0,0,0,28,208,60,16,156,144,156,0,16,204,192,236,96,108,96,48,220,16,28,0,0,0,0,204,0,12,0,0,0,0,0,0,127,42,63,15,48,46,9,0,85,85,127,31,63,63,62,7,16,31,127,42,42,0,0,56,47,0,64,85,85,0,0,0,240,160,224,128,192,64,124,0,80,80,240,128,128,128,252,64,64,128,240,160,160,0,0,128,128,0,0,80,80,0,0,0,127,85,127,15,48,46,9,0,106,42,63,31,63,63,62,7,16,31,127,85,85,0,0,56,47,0,64,42,42,0,0,0,224,80,240,128,192,64,124,0,176,160,224,128,128,128,252,64,64,128,240,80,80,0,0,128,128,0,0,160,160,0,0,1,1,1,1,67,127,77,108,1,1,1,1,113,29,127,31,75,106,74,106,73,108,95,112,127,31,127,31,126,31,112,0,0,0,0,0,144,252,112,124,0,0,0,0,28,0,140,128,48,188,176,188,176,124,240,28,204,64,76,64,76,128,12,0,1,1,1,1,51,95,109,76,1,1,1,1,65,125,31,127,107,74,106,74,105,76,127,64,31,127,31,127,30,127,16,112,0,0,0,0,156,240,124,112,0,0,0,0,16,12,128,140,60,176,188,176,188,112,252,0,192,76,64,76,64,140,0,28,0,15,5,4,7,6,0,254,0,10,10,15,7,7,15,255,12,6,7,15,5,5,0,0,3,1,0,8,10,10,0,0,0,255,85,7,250,6,242,138,0,170,170,254,252,248,252,244,122,6,254,255,85,85,0,0,132,248,0,0,170,170,0,0,0,15,10,12,7,6,0,254,0,13,5,7,7,7,15,255,12,6,7,15,10,10,0,0,3,1,0,8,5,5,0,0,0,255,170,4,250,6,242,138,0,85,85,255,252,248,252,244,122,6,254,255,170,170,0,0,132,248,0,0,85,85,0,0,112,95,108,75,106,74,106,73,0,127,31,127,31,127,31,126,108,77,127,67,1,1,1,1,31,127,25,113,1,1,1,1,28,240,60,48,188,176,188,176,16,236,192,204,64,76,64,76,60,112,252,128,0,0,0,0,192,140,0,28,0,0,0,0,64,127,76,107,74,106,74,105,112,31,127,31,127,31,127,30,76,109,95,51,1,1,1,1,127,31,121,65,1,1,1,1,16,252,48,60,176,188,176,188,28,224,204,192,76,64,76,64,48,124,240,140,0,0,0,0,204,128,12,16,0,0,0,0,0,127,170,192,127,64,30,17,0,213,85,127,127,127,127,126,15,64,127,127,170,170,0,0,112,63,0,128,85,85,0,0,0,240,160,32,224,192,16,127,0,80,80,240,224,224,224,255,48,224,224,240,160,160,0,0,192,0,0,0,80,80,0,0,0,255,85,64,127,64,30,17,0,170,170,255,127,127,127,126,15,64,127,255,85,85,0,0,112,63,0,128,170,170,0,0,0,224,80,48,224,192,16,127,0,176,160,224,224,224,224,255,48,224,224,224,80,80,0,0,192,0,0,16,160,160,0,0,3,2,1,55,79,88,83,82,3,3,1,69,117,63,127,63,82,82,82,89,76,79,64,0,127,63,127,62,127,48,112,0,0,0,0,220,248,60,24,156,128,128,0,16,4,192,228,96,152,156,152,188,120,252,24,0,100,96,100,64,132,0,4,0,3,2,1,119,79,88,83,82,3,3,1,117,53,127,63,127,82,82,82,89,76,79,64,0,63,127,63,126,63,112,48,0,0,0,0,208,252,56,28,152,128,128,0,28,0,196,224,100,156,152,156,184,124,248,28,0,96,100,96,68,128,4,0,0,0,15,16,23,12,24,195,186,0,26,15,15,7,31,223,255,25,24,12,31,31,21,0,0,198,7,3,16,0,10,0,0,0,254,0,240,28,12,228,20,0,170,254,254,248,248,248,232,244,12,28,254,254,84,0,0,8,240,224,0,0,170,0,0,0,31,16,23,12,24,195,186,0,21,31,31,7,31,223,255,25,24,12,31,15,10,0,0,198,7,3,16,16,21,0,0,0,254,0,240,28,12,228,20,0,84,254,254,248,248,248,232,244,12,28,254,254,170,0,0,8,240,224,0,0,84,0,0,0,64,79,76,91,82,82,82,0,112,63,127,63,127,63,127,82,81,88,79,55,1,3,0,63,126,63,113,65,1,3,3,0,8,220,56,28,152,156,152,0,20,224,196,224,100,96,100,156,152,60,248,220,0,0,0,96,100,192,4,0,0,128,128,0,64,79,76,91,82,82,82,0,48,127,63,127,63,127,63,82,81,88,71,7,1,3,0,127,62,127,57,113,1,3,3,0,12,216,60,24,156,152,156,0,16,228,192,228,96,100,96,152,156,56,252,220,0,0,0,100,96,196,0,0,0,128,128,0,127,0,15,56,32,15,8,0,85,127,127,63,63,63,63,7,32,48,63,127,42,0,0,56,31,15,64,0,85,0,0,0,240,8,232,48,0,131,94,0,88,240,240,224,248,251,191,216,24,48,248,248,168,0,0,35,224,192,0,0,80,0,0,0,127,0,15,56,32,15,8,0,42,127,127,63,63,63,63,7,32,48,63,127,85,0,0,56,31,15,64,0,42,0,0,0,248,8,232,48,0,131,94,0,168,248,248,224,248,251,191,216,24,48,240,240,64,0,0,35,224,192,8,8,184,0,0,1,65,93,77,77,79,72,75,1,113,63,127,63,127,63,127,74,74,73,72,79,95,112,0,63,127,62,127,48,96,0,0,0,8,70,72,74,24,26,152,128,142,184,182,180,230,228,230,90,88,218,24,234,244,14,0,164,166,36,230,20,10,0,0,1,49,93,77,77,79,72,75,1,65,127,63,127,63,127,63,74,74,73,72,79,95,64,0,127,63,126,63,112,32,112,0,0,14,68,74,72,26,24,154,128,136,186,180,182,228,230,228,88,90,216,26,232,246,8,0,166,164,38,228,22,8,6,0,0,127,0,32,63,60,5,253,0,85,127,127,63,63,63,255,1,56,0,7,95,32,42,0,255,7,63,56,96,95,85,0,0,254,2,6,252,12,204,44,0,84,252,248,240,240,240,208,44,236,12,244,250,6,170,0,208,16,240,8,4,248,84,0,0,63,64,96,63,60,5,253,0,106,63,63,63,63,63,255,1,56,0,7,95,96,85,0,255,7,63,56,96,31,42,0,0,254,0,4,252,12,204,44,0,170,254,250,240,240,240,208,44,236,12,244,250,4,84,0,208,16,240,8,4,250,170,0,112,79,71,72,75,74,74,73,0,127,63,127,63,127,63,126,72,79,79,79,79,65,1,0,63,127,61,121,49,113,1,0,14,240,234,24,154,88,90,216,0,254,244,230,228,166,164,38,26,24,90,104,114,0,0,0,228,230,164,150,140,142,128,0,64,79,71,72,75,74,74,73,112,63,127,63,127,63,127,62,72,79,79,79,79,113,1,0,127,63,125,57,113,1,1,0,0,242,232,26,152,90,88,218,14,252,246,228,230,164,166,36,24,26,88,106,112,14,0,0,230,228,166,148,142,128,128,0,0,63,64,64,47,48,55,52,0,106,63,63,63,63,63,63,52,51,48,47,31,64,85,0,63,60,63,48,96,63,42,0,0,254,0,0,248,48,32,191,0,170,254,254,252,252,252,127,128,156,12,244,248,4,84,0,127,96,240,8,6,250,170,0,0,127,0,32,63,48,55,52,0,85,127,127,63,63,63,63,52,51,48,47,31,32,42,0,63,60,63,48,96,95,85,0,0,252,2,6,248,48,32,191,0,86,252,252,252,252,252,127,128,156,12,244,248,2,170,0,127,96,240,8,6,252,84,0,1,1,1,65,101,77,108,73,1,1,1,115,23,127,31,126,107,75,104,76,100,67,0,0,28,125,31,127,23,112,1,0,0,0,0,144,204,224,108,32,0,0,0,28,16,28,144,220,172,160,44,96,204,128,0,0,208,220,208,156,16,28,0,0,1,1,1,49,69,109,76,105,1,1,1,67,119,31,127,30,75,107,72,108,68,99,1,0,124,29,127,31,119,16,1,0,0,0,0,156,192,236,96,44,0,0,0,16,28,16,156,208,160,172,32,108,192,140,0,0,220,208,220,144,28,16,0,0,0,0,31,10,0,7,14,0,0,0,21,21,31,7,15,31,253,28,14,7,16,10,10,0,254,3,1,0,31,21,21,0,0,0,252,168,0,240,24,196,0,0,84,84,252,240,248,56,196,204,24,240,0,168,168,0,122,240,224,0,252,84,84,0,0,0,15,21,16,7,14,0,0,0,26,10,15,7,15,31,253,28,14,7,16,21,21,0,254,3,1,0,31,10,10,0,0,0,252,84,0,240,24,196,0,0,168,168,252,240,248,56,198,204,24,240,0,84,84,0,122,240,224,0,252,168,168,0,0,67,103,76,104,75,107,73,1,115,23,127,31,124,29,127,108,73,99,67,1,1,1,0,31,127,21,113,1,1,1,0,0,144,12,32,44,160,172,32,0,156,208,220,208,220,208,220,108,224,204,128,0,0,0,0,144,28,16,28,0,0,0,0,1,99,71,108,72,107,75,105,1,19,119,31,127,28,125,31,76,105,67,51,1,1,1,0,127,31,117,65,1,1,1,0,0,140,0,44,32,172,160,44,0,144,220,208,220,208,220,208,96,236,192,140,0,0,0,0,156,16,28,16,0,0,0,0,0,63,21,0,15,24,51,51,0,42,42,63,15,31,60,125,51,8,7,32,21,21,0,0,63,31,8,63,42,42,0,0,0,248,80,0,192,64,0,191,0,168,168,248,224,240,248,255,56,112,224,0,80,80,0,0,192,128,0,248,168,168,0,0,0,63,42,0,15,24,51,115,0,21,21,63,15,31,60,125,51,8,7,32,42,42,0,0,63,31,8,63,21,21,0,0,0,240,168,8,192,64,0,191,0,88,80,240,224,240,248,255,56,112,224,0,168,168,0,0,192,128,0,248,80,80,0,0,1,1,47,127,111,5,8,41,1,1,77,29,29,31,31,94,107,107,8,12,35,111,111,0,28,29,31,31,95,16,1,0,0,0,132,140,236,96,32,36,0,0,104,112,16,144,208,216,172,172,32,96,228,236,236,0,208,208,208,208,152,16,0,0,1,1,111,63,111,5,8,105,1,1,13,93,29,31,31,30,43,107,8,12,99,47,110,0,92,29,31,31,31,80,1,0,0,0,140,132,236,96,32,44,0,0,96,120,16,144,208,208,164,172,32,96,236,228,236,0,216,208,208,208,144,24,0,0,0,0,24,57,16,59,60,0,0,0,33,0,31,63,63,63,253,56,28,15,0,24,57,0,254,7,35,48,31,33,0,0,0,0,198,206,0,246,22,206,0,0,8,0,252,248,248,56,206,206,30,254,0,198,206,0,122,248,240,0,252,8,0,0,0,0,41,57,16,59,60,0,0,0,16,0,31,63,63,63,253,56,28,15,0,41,57,0,254,7,35,48,31,16,0,0,0,0,74,206,0,246,22,206,0,0,132,0,252,248,248,56,204,206,30,254,0,74,206,0,122,248,240,0,252,132,0,0,0,47,120,115,12,8,43,107,0,78,31,31,31,31,92,29,105,8,5,39,103,99,1,1,31,31,31,89,25,13,1,1,0,228,12,204,96,32,164,172,0,232,240,176,208,208,216,208,44,32,96,228,204,140,0,0,208,208,144,24,48,96,0,0,0,110,56,115,12,8,107,43,0,15,95,31,31,31,28,93,105,8,5,103,39,99,1,1,31,31,31,25,89,13,1,1,0,236,4,204,96,32,172,164,0,224,248,176,208,208,208,216,44,32,96,236,196,140,0,0,208,208,144,16,56,96,0,0,0,49,115,0,79,104,115,115,0,66,0,63,127,127,124,61,99,88,15,0,49,115,0,0,127,111,112,63,66,0,0,0,0,140,156,0,192,36,20,191,0,16,0,248,252,248,232,255,28,60,244,0,140,156,0,0,224,192,8,248,16,0,0,0,0,82,115,0,79,104,115,51,0,33,0,63,127,127,124,125,99,88,15,0,82,115,0,0,127,111,112,63,33,0,0,0,0,148,156,0,192,36,20,191,0,8,0,248,252,248,232,255,28,60,244,0,148,156,0,0,224,192,8,248,8,0,0,0,3,1,1,65,101,77,108,73,3,1,1,115,23,127,31,126,107,75,104,76,102,71,97,0,28,125,31,127,23,118,19,0,0,0,0,144,204,224,108,32,128,0,0,28,16,28,144,220,172,160,44,96,204,192,140,0,208,220,208,156,16,28,16,0,3,1,1,49,69,109,76,105,3,1,1,67,119,31,127,30,75,107,72,108,70,103,64,0,124,29,127,31,119,22,115,0,0,0,0,156,192,236,96,44,128,0,0,16,28,16,156,208,160,172,32,108,192,204,128,0,220,208,220,144,28,16,28,0,0,0,31,10,0,7,14,128,0,0,21,21,31,7,15,159,253,28,14,7,16,10,10,0,254,131,1,0,31,21,21,0,0,0,254,170,0,240,28,204,0,0,84,84,254,240,252,62,198,206,28,240,0,170,170,0,122,240,224,0,254,84,84,0,0,0,15,21,16,7,14,128,0,0,26,10,15,7,15,159,253,28,14,7,16,21,21,0,254,131,1,0,31,10,10,0,0,0,254,84,0,240,28,204,0,0,170,170,254,240,252,62,196,206,28,240,0,84,84,0,122,240,224,0,254,170,170,0,194,140,204,152,208,151,215,146,39,239,47,255,63,249,59,255,216,155,199,135,2,2,6,0,63,254,42,226,2,2,7,0,24,0,152,192,88,64,88,64,32,184,32,56,160,184,160,184,216,192,152,0,0,0,0,0,32,56,32,56,0,0,0,0,128,204,140,216,144,215,151,210,231,47,239,63,255,57,251,63,152,219,135,103,2,2,6,0,255,62,234,130,2,2,7,0,32,24,128,216,64,88,64,88,56,160,56,32,184,160,184,160,192,216,128,24,0,0,0,0,56,32,56,32,0,0,0,0,0,127,85,0,15,56,51,99,0,42,42,127,15,63,124,125,99,48,15,0,85,85,0,0,63,15,0,127,42,42,0,0,0,248,80,0,224,112,1,191,0,168,168,248,224,240,249,255,56,112,224,0,80,80,0,0,193,128,0,248,168,168,0,0,0,127,42,0,15,56,51,35,0,85,85,127,15,63,124,125,99,48,15,0,42,42,0,0,63,15,0,127,85,85,0,0,0,240,168,8,224,112,1,191,0,88,80,240,224,240,249,255,56,112,224,0,168,168,0,0,193,128,0,248,80,80,0,0,67,103,65,105,73,109,79,105,115,27,127,31,127,31,127,30,75,107,72,104,71,111,64,0,124,29,127,31,120,16,113,0,16,76,128,156,208,252,240,60,156,176,124,96,108,64,204,192,176,188,48,60,208,236,16,0,204,192,204,192,44,16,12,0,35,71,97,73,105,77,111,73,83,123,31,127,31,127,31,126,107,75,104,72,103,79,97,0,28,125,31,127,24,112,17,0,28,64,140,144,220,240,252,48,144,188,112,108,96,76,192,204,188,176,60,48,220,224,28,0,192,204,192,204,32,28,0,0,0,255,85,0,31,70,194,255,0,170,170,255,127,63,255,254,62,70,7,159,85,85,0,0,195,63,120,224,170,170,0,0,0,254,84,0,244,12,204,204,0,170,170,254,248,240,48,114,204,12,244,250,84,84,0,0,240,240,8,4,170,170,0,0,0,127,170,0,31,70,194,255,0,213,85,255,127,63,255,254,62,70,7,159,170,170,0,0,195,63,120,224,85,85,0,0,0,254,170,0,244,12,204,206,0,84,84,254,248,240,48,114,204,12,244,250,170,170,0,0,240,240,8,4,84,84,0,0,64,111,71,104,72,107,75,105,113,31,127,31,127,28,125,30,79,111,79,111,79,111,66,0,127,29,121,25,113,19,115,0,16,236,208,60,48,188,176,60,28,240,236,192,204,192,204,192,240,252,208,220,224,236,0,0,204,64,44,32,28,144,156,0,97,79,103,72,104,75,107,73,17,127,31,127,31,124,29,126,111,79,111,79,111,79,98,0,31,125,25,121,17,115,19,0,28,224,220,48,60,176,188,48,0,252,224,204,192,204,192,204,252,240,220,208,236,224,28,0,192,76,32,44,16,156,128,0,0,255,85,0,95,96,102,103,0,170,170,255,127,127,121,251,102,96,95,63,85,85,0,0,127,127,96,192,170,170,0,0,0,254,84,4,240,192,254,124,0,170,170,250,252,252,134,254,248,124,204,244,84,84,0,0,134,192,48,10,170,170,0,0,0,255,170,128,95,96,102,231,0,85,85,127,127,127,121,251,102,96,95,191,170,170,0,0,127,127,96,64,85,85,0,0,0,254,170,6,240,192,254,124,0,84,84,248,252,252,134,254,248,124,204,246,170,170,0,0,134,192,48,8,84,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,240,240,0,0,0,0,240,0,0,240,0,0,0,0,8,11,11,15,0,0,0,0,15,12,12,15,0,0,0,0,8,251,251,255,0,0,0,0,255,12,12,255,0,0,0,0,0,0,0,0,128,176,176,240,0,0,0,0,240,192,192,240,0,240,240,240,128,176,176,240,240,0,0,240,240,192,192,240,8,11,11,15,128,176,176,240,15,12,12,15,240,192,192,240,8,251,251,255,128,176,176,240,255,12,12,255,240,192,192,240,0,0,0,0,0,15,15,15,0,0,0,0,15,0,0,15,0,240,240,240,0,15,15,15,240,0,0,240,15,0,0,15,8,11,11,15,0,15,15,15,15,12,12,15,15,0,0,15,8,251,251,255,0,15,15,15,255,12,12,255,15,0,0,15,0,0,0,0,128,191,191,255,0,0,0,0,255,192,192,255,0,240,240,240,128,191,191,255,240,0,0,240,255,192,192,255,8,11,11,15,128,191,191,255,15,12,12,15,255,192,192,255,8,251,251,255,128,191,191,255,255,12,12,255,255,192,192,255,0,1,63,63,63,63,63,127,255,254,252,252,252,252,192,128,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,254,191,223,237,254,239,215,127,251,255,127,183,235,255,191,221,129,156,156,156,129,159,159,255,129,156,156,156,129,159,159,255,255,255,255,255,255,255,255,255,227,182,162,136,156,136,162,182,28,28,28,28,8,0,28,28,28,28,28,28,8,0,28,28,0,0,0,0,0,0,0,0,126,99,99,99,126,96,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,54,99,99,127,99,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,99,99,99,99,99,99,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,102,96,62,3,99,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,63,48,48,62,48,48,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,153,3,6,140,153,51,102,204,119,254,253,251,119,238,221,187,118,223,255,123,238,191,251,110,124,234,248,230,209,224,4,16,195,153,159,193,252,156,193,255,195,153,159,193,252,156,193,255,192,243,243,243,243,243,243,255,192,243,243,243,243,243,243,255,227,201,156,156,128,156,156,255,227,201,156,156,128,156,156,255,224,207,159,152,156,204,224,255,224,207,159,152,156,204,224,255,192,207,207,193,207,207,192,255,192,207,207,193,207,207,192,255,3,4,8,8,48,64,128,128,3,4,8,8,48,64,128,128,128,128,64,48,8,8,4,3,128,128,64,48,8,8,4,3,192,32,16,16,12,2,1,1,192,32,16,16,12,2,1,1,1,1,2,12,16,16,32,192,1,1,2,12,16,16,32,192,48,72,134,129,64,32,32,16,48,72,134,129,64,32,32,16,16,32,32,64,129,134,72,48,16,32,32,64,129,134,72,48,12,18,97,129,2,4,4,8,12,18,97,129,2,4,4,8,8,4,4,2,129,97,18,12,8,4,4,2,129,97,18,12,28,38,99,99,99,50,28,0,28,38,99,99,99,50,28,0,12,28,12,12,12,12,63,0,12,28,12,12,12,12,63,0,62,99,7,30,60,112,127,0,62,99,7,30,60,112,127,0,63,6,12,30,3,99,62,0,63,6,12,30,3,99,62,0,14,30,54,102,127,6,6,0,14,30,54,102,127,6,6,0,126,96,126,3,3,99,62,0,126,96,126,3,3,99,62,0,28,48,96,126,99,99,62,0,28,48,96,126,99,99,62,0,127,99,6,12,24,24,24,0,127,99,6,12,24,24,24,0,60,98,114,60,79,67,62,0,60,98,114,60,79,67,62,0,62,99,99,63,3,6,60,0,62,99,99,63,3,6,60,0,0,0,0,0,121,66,114,10,0,0,0,0,121,66,114,10,10,74,49,0,0,0,0,0,10,74,49,0,0,0,0,0,0,0,0,0,140,82,82,82,0,0,0,0,140,82,82,82,82,82,140,0,0,0,0,0,82,82,140,0,0,0,0,0,0,0,60,102,126,96,60,0,0,0,60,102,126,96,60,0,14,27,24,126,24,24,24,0,14,27,24,126,24,24,24,0,60,66,157,161,161,157,66,60,60,66,157,161,161,157,66,60,28,54,99,99,127,99,99,0,28,54,99,99,127,99,99,0,126,99,99,126,99,99,126,0,126,99,99,126,99,99,126,0,30,51,96,96,96,51,30,0,30,51,96,96,96,51,30,0,124,102,99,99,99,102,124,0,124,102,99,99,99,102,124,0,63,48,48,62,48,48,63,0,63,48,48,62,48,48,63,0,127,96,96,126,96,96,96,0,127,96,96,126,96,96,96,0,31,48,96,103,99,51,31,0,31,48,96,103,99,51,31,0,99,99,99,127,99,99,99,0,99,99,99,127,99,99,99,0,63,12,12,12,12,12,63,0,63,12,12,12,12,12,63,0,3,3,3,3,3,99,62,0,3,3,3,3,3,99,62,0,99,102,108,120,124,110,103,0,99,102,108,120,124,110,103,0,48,48,48,48,48,48,63,0,48,48,48,48,48,48,63,0,99,119,127,127,107,99,99,0,99,119,127,127,107,99,99,0,99,115,123,127,111,103,99,0,99,115,123,127,111,103,99,0,62,99,99,99,99,99,62,0,62,99,99,99,99,99,62,0,126,99,99,99,126,96,96,0,126,99,99,99,126,96,96,0,62,99,99,99,111,102,61,0,62,99,99,99,111,102,61,0,126,99,99,103,124,110,103,0,126,99,99,103,124,110,103,0,60,102,96,62,3,99,62,0,60,102,96,62,3,99,62,0,63,12,12,12,12,12,12,0,63,12,12,12,12,12,12,0,99,99,99,99,99,99,62,0,99,99,99,99,99,99,62,0,99,99,99,119,62,28,8,0,99,99,99,119,62,28,8,0,99,99,107,127,127,119,99,0,99,99,107,127,127,119,99,0,195,231,231,231,231,231,195,255,195,231,231,231,231,231,195,255,51,51,51,30,12,12,12,0,51,51,51,30,12,12,12,0,193,235,235,235,235,235,193,255,193,235,235,235,235,235,193,255,8,24,63,127,63,24,8,0,8,24,63,127,63,24,8,0,0,0,0,0,0,255,255,0,0,0,0,0,0,255,255,0,8,12,126,127,126,12,8,0,8,12,126,127,126,12,8,0,60,24,24,24,24,24,60,0,60,24,24,24,24,24,60,0,62,20,20,20,20,20,62,0,62,20,20,20,20,20,62,0,255,255,225,225,225,225,225,225,0,0,0,0,0,0,0,0,135,199,192,199,207,206,207,199,0,0,0,0,0,0,0,0,248,252,28,252,252,28,252,252,0,0,0,0,0,0,0,0,255,255,231,231,231,231,231,231,0,0,0,0,0,0,0,0,240,249,57,57,57,57,57,56,0,0,0,0,0,0,0,0,255,255,192,192,192,192,255,255,0,0,0,0,0,0,0,0,31,63,56,56,56,56,63,31,0,0,0,0,0,0,0,0,227,243,112,112,112,112,240,224,0,0,0,0,0,0,0,0,254,254,112,112,112,112,112,112,0,0,0,0,0,0,0,0,0,0,0,0,0,48,48,0,0,0,0,0,0,48,48,0,255,182,162,128,128,162,182,227,255,182,162,136,136,162,182,227,0,0,0,126,126,0,0,0,0,0,0,126,126,0,0,0,63,63,63,63,63,63,63,63,63,15,3,0,0,0,0,0,63,63,63,63,63,63,63,255,0,63,63,63,63,63,63,255,227,217,156,156,156,205,227,255,227,217,156,156,156,205,227,255,243,227,243,243,243,243,192,255,243,227,243,243,243,243,192,255,193,156,248,225,195,143,128,255,193,156,248,225,195,143,128,255,192,249,243,225,252,156,193,255,192,249,243,225,252,156,193,255,241,225,201,153,128,249,249,255,241,225,201,153,128,249,249,255,129,159,129,252,252,156,193,255,129,159,129,252,252,156,193,255,227,207,159,129,156,156,193,255,227,207,159,129,156,156,193,255,128,156,249,243,231,231,231,255,128,156,249,243,231,231,231,255,195,157,141,195,176,188,193,255,195,157,141,195,176,188,193,255,193,156,156,192,252,249,195,255,193,156,156,192,252,249,195,255,0,0,0,0,0,0,0,0,31,48,96,103,99,51,31,0,0,0,0,0,0,0,0,0,62,99,99,99,99,99,62,0,0,0,0,0,0,0,0,0,28,54,99,99,127,99,99,0,0,0,0,0,0,0,0,0,99,99,99,119,62,28,8,0,0,0,0,0,0,0,0,0,99,119,127,127,107,99,99,0,0,0,0,0,0,0,0,0,63,48,48,62,48,48,63,0,0,0,0,0,0,0,0,0,63,48,48,62,48,48,63,0,0,0,0,0,0,0,0,0,126,99,99,103,124,110,103,0,127,128,191,191,191,188,184,176,127,128,128,128,135,143,143,143,160,160,191,191,191,127,127,0,159,128,128,128,128,255,0,0,252,3,255,255,31,15,15,15,254,2,2,2,194,226,226,226,15,7,7,255,255,253,254,0,226,242,2,2,2,254,0,0,127,128,190,188,184,183,175,175,127,128,131,130,135,143,157,157,175,167,176,184,191,127,127,0,158,143,135,128,128,255,0,0,252,3,159,39,7,159,207,207,254,2,194,50,130,194,226,226,207,159,63,127,255,253,254,0,226,194,130,2,2,254,0,0,127,128,191,191,191,191,191,189,127,128,128,128,128,128,132,143,186,180,160,160,161,127,127,0,157,155,159,158,128,255,0,0,252,3,255,239,199,199,191,127,254,2,34,50,58,66,130,2,127,63,127,255,255,253,254,0,2,130,2,2,2,254,0,0,127,128,191,191,191,190,162,183,127,128,129,131,131,191,159,143,188,168,176,161,167,127,127,0,143,158,156,144,128,255,0,0,252,3,127,63,63,123,131,135,254,2,2,130,130,250,242,226,207,39,23,135,231,253,254,0,226,242,114,18,2,254,0,0,127,128,191,189,184,182,160,182,127,128,135,134,143,155,148,155,160,182,180,188,184,127,127,0,148,155,136,135,128,255,0,0,252,3,31,15,135,135,7,135,254,2,194,34,18,82,146,82,7,143,63,127,255,253,254,0,146,66,130,2,2,254,0,0,127,128,191,191,190,160,188,184,127,128,128,129,159,129,135,143,167,168,170,176,184,127,127,0,159,156,138,135,128,255,0,0,252,3,255,31,47,47,215,55,254,2,2,194,194,194,34,194,139,3,179,7,15,253,254,0,242,10,170,242,2,254,0,0,127,128,191,191,159,160,135,161,127,128,128,144,191,191,152,134,184,188,190,191,191,127,127,0,130,129,128,128,128,255,0,0,252,3,255,255,207,7,231,3,254,2,2,2,226,242,18,250,51,51,51,131,135,253,254,0,106,234,74,122,2,254,0,0,0,0,0,0,0,0,0,6,0,0,0,1,1,3,7,15,12,0,12,12,0,0,0,1,15,31,31,31,31,31,15,6,0,0,0,0,0,0,0,0,128,128,128,128,128,192,224,240,0,8,8,8,8,24,48,224,240,240,240,240,240,224,192,0,0,0,0,1,1,1,3,31,0,0,0,1,1,1,3,31,3,1,1,1,0,0,0,0,3,1,1,1,0,0,0,0,0,0,0,0,0,0,128,240,0,0,0,0,0,0,128,240,128,0,0,0,0,0,0,0,128,0,0,0,0,0,0,0,0,0,1,1,1,3,7,63,0,0,1,1,1,3,7,63,7,3,1,1,1,0,0,0,7,3,1,1,1,0,0,0,0,0,0,0,0,128,192,248,0,0,0,0,0,128,192,248,192,128,0,0,0,0,0,0,192,128,0,0,0,0,0,0,0,1,1,1,3,3,15,127,0,1,1,1,3,3,15,127,15,3,3,1,1,1,0,0,15,3,3,1,1,1,0,0,0,0,0,0,128,128,224,252,0,0,0,0,128,128,224,252,224,128,128,0,0,0,0,0,224,128,128,0,0,0,0,0,1,1,1,3,3,7,31,255,1,1,1,3,3,7,31,255,31,7,3,3,1,1,1,0,31,7,3,3,1,1,1,0,0,0,0,128,128,192,240,254,0,0,0,128,128,192,240,254,240,192,128,128,0,0,0,0,240,192,128,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,28,0,0,0,0,0,0,0,0,28,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,60,0,0,0,0,0,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,28,0,0,0,0,0,0,0,0,28,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,60,0,0,0,0,0,0,0,0,56,0,0,0,0,0,0,0,0,0,0,0,17,50,18,18,0,0,0,0,17,50,18,18,18,18,57,0,0,0,0,0,18,18,57,0,0,0,0,0,0,0,0,0,140,82,82,82,0,0,0,0,140,82,82,82,82,82,140,0,0,0,0,0,82,82,140,0,0,0,0,0,0,0,0,0,49,74,10,18,0,0,0,0,49,74,10,18,34,66,121,0,0,0,0,0,34,66,121,0,0,0,0,0,0,0,0,0,140,82,82,82,0,0,0,0,140,82,82,82,82,82,140,0,0,0,0,0,82,82,140,0,0,0,0,0,0,0,0,0,49,74,10,50,0,0,0,0,49,74,10,50,10,74,49,0,0,0,0,0,10,74,49,0,0,0,0,0,0,0,0,0,140,82,82,82,0,0,0,0,140,82,82,82,82,82,140,0,0,0,0,0,82,82,140,0,0,0,0,0,0,0,0,0,17,50,82,82,0,0,0,0,17,50,82,82,122,18,17,0,0,0,0,0,122,18,17,0,0,0,0,0,0,0,0,0,140,82,82,82,0,0,0,0,140,82,82,82,82,82,140,0,0,0,0,0,82,82,140,0,0,0,0,0,0,192,99,241,113,253,47,119,0,192,99,241,113,253,63,127,61,63,29,1,3,15,13,0,63,63,29,1,3,15,13,0,0,3,134,79,142,191,244,238,0,3,134,207,142,191,252,254,188,252,184,128,192,240,176,0,252,252,184,128,192,240,176,0,0,0,4,13,11,23,55,47,0,0,0,1,3,7,7,15,111,79,95,71,65,64,64,64,15,15,31,7,1,0,0,0,0,0,0,0,128,192,248,252,0,0,0,0,128,192,248,252,252,246,150,4,4,0,0,0,252,246,150,4,4,0,0,0,0,0,32,18,9,5,2,12,0,0,32,18,1,4,2,12,1,3,134,109,45,70,47,13,0,2,6,69,45,70,43,0,0,0,32,71,31,62,61,127,0,0,32,64,28,46,53,127,231,255,251,207,229,232,245,243,39,62,191,255,255,191,63,190,0,4,4,114,250,158,239,255,0,4,4,98,98,146,15,223,253,219,127,127,103,23,175,94,108,219,247,186,251,255,247,126,0,4,4,8,144,176,64,160,0,4,4,8,128,176,64,160,134,196,240,184,120,176,216,184,130,68,112,168,72,176,216,160,3,7,6,13,15,39,16,0,3,7,6,5,2,32,16,0,3,5,8,16,32,32,0,0,2,1,8,16,0,32,0,0,197,242,244,238,254,255,223,221,125,255,255,191,61,121,83,221,107,127,30,64,16,0,0,0,104,124,0,64,16,0,0,0,203,143,182,191,127,127,219,231,89,120,126,223,251,253,217,225,255,58,0,36,28,20,0,0,243,2,0,36,8,20,0,0,216,242,241,240,168,176,96,224,192,226,193,0,136,176,64,128,64,176,144,24,12,4,0,0,0,176,128,16,8,4,0,0,128,196,98,48,25,19,3,15,128,68,32,0,1,3,2,3,15,6,29,63,61,27,27,93,7,6,29,31,45,9,1,92,0,0,15,222,247,223,255,255,0,0,8,220,127,47,247,254,191,125,220,197,195,236,225,131,167,127,255,255,238,254,255,255,0,30,127,243,109,254,254,255,0,6,60,114,105,252,230,123,255,239,203,23,47,93,139,175,191,255,254,255,255,255,127,191,0,2,12,152,200,192,216,252,0,2,8,16,0,128,152,152,254,238,246,247,239,222,248,252,48,104,244,181,168,82,240,204,127,239,255,251,255,111,7,13,127,247,247,111,12,15,7,13,14,15,15,39,19,40,72,128,14,15,7,34,16,0,64,128,229,173,96,201,156,253,255,191,249,254,254,255,231,255,247,191,127,254,222,159,3,49,8,16,29,206,158,3,3,33,8,16,135,200,47,15,103,251,255,183,255,239,255,255,254,255,239,135,207,255,255,117,143,255,255,116,206,246,227,7,142,252,200,0,254,254,239,247,250,247,251,255,184,252,237,182,122,181,250,245,103,158,252,240,132,148,10,1,99,18,4,144,4,128,2,0,0,0,1,17,29,15,6,31,0,0,1,17,12,3,3,29,6,6,13,27,2,0,0,0,2,7,9,17,2,0,0,0,0,0,4,40,184,240,188,24,0,0,4,40,176,32,236,160,48,216,252,100,32,0,0,0,224,176,104,36,0,0,0,0,0,2,75,115,63,27,76,30,0,0,66,49,9,15,6,31,220,62,11,45,31,31,50,0,213,13,14,7,10,18,34,0,0,32,98,110,252,218,120,30,0,32,66,76,208,184,224,206,60,58,104,220,238,98,176,0,176,224,56,236,98,32,0,0,10,68,121,63,23,93,58,244,0,68,25,9,15,79,29,246,126,29,127,59,127,101,200,0,13,1,77,62,37,64,128,0,18,166,140,220,253,104,28,63,0,132,136,24,176,112,168,127,60,60,94,240,250,220,134,162,96,140,114,176,152,132,130,128,255,255,255,255,255,255,255,255,255,255,255,255,63,15,3,0,255,255,255,255,255,255,255,255,0,255,255,255,255,255,255,255,67,79,80,89,82,73,71,72,84,32,49,57,56,49,32,49,57,56,53,32,78,65,77,67,79,32,76,84,68,46,13,10];

		var temp2 = [78,69,83,26,2,1,0,0,0,0,0,0,0,0,0,0,120,162,255,154,232,142,1,32,142,16,64,142,0,32,44,2,32,44,2,32,16,251,44,2,32,16,251,169,63,141,6,32,142,6,32,169,15,162,32,141,7,32,202,208,250,138,160,32,140,6,32,141,6,32,160,16,141,7,32,232,208,250,136,208,247,138,149,0,157,0,1,157,0,2,157,0,3,157,0,4,157,0,5,157,0,6,157,0,7,232,208,230,169,4,32,94,130,32,79,130,32,171,130,32,142,140,32,136,178,169,0,133,210,169,8,133,211,32,130,140,169,128,133,19,141,0,32,169,6,133,20,165,0,197,0,240,252,162,52,160,24,202,208,253,136,208,250,173,2,32,41,128,133,2,32,108,130,162,143,160,180,165,2,32,110,134,162,229,160,190,32,110,138,169,253,133,26,133,27,169,0,141,5,32,141,5,32,76,211,176,72,138,72,152,72,165,20,41,24,240,7,165,3,208,6,76,230,129,76,251,129,162,0,142,3,32,169,2,141,20,64,165,28,208,3,76,203,129,134,28,169,63,141,6,32,142,6,32,172,192,1,177,24,141,7,32,172,193,1,177,24,141,7,32,172,194,1,177,24,141,7,32,172,195,1,177,24,141,7,32,173,7,32,172,197,1,177,24,141,7,32,172,198,1,177,24,141,7,32,172,199,1,177,24,141,7,32,173,7,32,172,201,1,177,24,141,7,32,172,202,1,177,24,141,7,32,172,203,1,177,24,141,7,32,173,7,32,172,205,1,177,24,141,7,32,172,206,1,177,24,141,7,32,172,207,1,177,24,141,7,32,173,7,32,172,209,1,177,24,141,7,32,172,210,1,177,24,141,7,32,172,211,1,177,24,141,7,32,173,7,32,172,213,1,177,24,141,7,32,172,214,1,177,24,141,7,32,172,215,1,177,24,141,7,32,173,7,32,172,217,1,177,24,141,7,32,172,218,1,177,24,141,7,32,172,219,1,177,24,141,7,32,173,7,32,172,221,1,177,24,141,7,32,172,222,1,177,24,141,7,32,172,223,1,177,24,141,7,32,166,23,240,23,160,0,177,21,200,141,6,32,177,21,200,141,6,32,177,21,200,141,7,32,202,208,235,142,6,32,142,6,32,165,17,141,5,32,165,18,141,5,32,165,19,141,0,32,230,0,230,1,165,1,201,6,208,4,169,0,133,1,32,149,135,104,168,104,170,104,64,133,29,134,30,162,0,169,32,133,31,160,0,177,29,157,192,1,232,200,198,31,208,245,230,28,96,133,29,134,30,162,0,169,16,208,228,133,29,134,30,162,16,138,208,219,133,29,32,86,179,41,31,170,165,29,157,192,1,230,28,96,169,15,162,0,157,192,1,232,224,32,208,248,134,28,96,170,189,156,133,133,24,189,165,133,133,25,133,28,96,165,20,41,24,240,3,32,74,131,165,20,41,231,133,20,141,1,32,96,165,20,9,24,133,20,141,1,32,32,74,131,169,0,141,6,32,141,6,32,165,19,141,0,32,96,165,20,9,8,208,228,165,20,9,16,208,222,133,20,141,1,32,96,162,0,169,255,157,0,2,232,232,232,232,208,247,96,10,10,10,10,10,41,32,133,29,165,19,41,223,5,29,133,19,96,170,160,0,177,210,200,157,2,2,177,210,200,157,1,2,177,210,200,157,0,2,177,210,157,3,2,165,210,24,105,4,133,210,144,2,230,211,138,24,105,4,96,133,29,134,30,160,2,177,210,136,133,34,177,210,136,133,35,177,210,170,177,29,201,128,240,35,200,24,101,34,157,3,2,177,29,200,24,101,35,157,0,2,177,29,200,157,1,2,177,29,200,157,2,2,232,232,232,232,76,8,131,165,210,105,2,133,210,144,2,230,211,138,96,170,169,240,157,0,2,232,232,232,232,208,247,96,169,1,133,3,165,0,197,0,240,252,165,2,240,6,165,1,201,5,240,250,169,0,133,3,96,142,6,32,141,6,32,32,10,179,168,134,30,169,0,133,29,177,29,133,31,200,208,2,230,30,177,29,200,208,2,230,30,197,31,240,7,141,7,32,133,32,208,238,177,29,240,16,200,208,2,230,30,170,165,32,141,7,32,202,208,250,240,218,96,133,29,138,208,14,165,29,201,240,176,8,133,18,169,0,133,29,240,11,56,165,29,233,240,133,18,169,2,133,29,32,10,179,133,17,138,41,1,5,29,133,29,165,19,41,252,5,29,133,19,96,41,1,10,10,10,133,29,165,19,41,247,5,29,133,19,96,41,1,10,10,10,10,133,29,165,19,41,239,5,29,133,19,96,133,29,134,30,32,10,179,142,6,32,141,6,32,173,7,32,32,10,179,133,31,134,32,160,0,173,7,32,145,31,230,31,208,2,230,32,165,29,208,2,198,30,198,29,165,29,5,30,208,231,96,133,29,134,30,32,10,179,142,6,32,141,6,32,32,10,179,133,31,134,32,160,0,177,31,141,7,32,230,31,208,2,230,32,165,29,208,2,198,30,198,29,165,29,5,30,208,231,96,41,3,170,189,103,132,170,32,86,179,76,175,138,0,15,30,45,168,162,0,169,1,141,22,64,169,0,141,22,64,169,8,133,29,185,22,64,74,118,30,198,29,208,246,232,224,3,208,227,165,30,197,31,240,6,197,32,240,2,165,31,153,4,0,170,89,6,0,57,4,0,153,8,0,138,153,6,0,96,72,32,107,132,104,170,181,8,96,170,181,4,96,165,26,10,144,2,73,207,133,26,96,165,27,10,144,2,73,215,133,27,96,32,182,132,32,192,132,101,26,96,32,182,132,170,32,192,132,96,133,26,134,27,96,133,21,134,22,32,86,179,133,23,96,142,6,32,141,6,32,96,141,7,32,96,133,31,134,32,32,86,179,166,32,240,12,162,0,141,7,32,202,208,250,198,32,208,246,166,31,240,6,141,7,32,202,208,250,96,240,2,169,4,133,29,165,19,41,251,5,29,133,19,141,0,32,96,133,31,134,32,32,10,179,133,36,134,37,32,10,179,133,38,134,39,162,0,165,32,240,12,32,81,133,198,32,230,37,230,39,76,61,133,166,31,240,10,160,0,177,36,145,38,200,202,208,248,96,133,31,134,32,32,86,179,133,29,32,10,179,133,38,134,39,162,0,165,32,240,10,32,128,133,198,32,230,39,76,110,133,166,31,240,10,160,0,165,29,145,38,200,202,208,250,96,170,32,74,131,202,208,250,96,170,157,152,133,96,0,1,2,3,174,190,206,222,238,254,14,30,46,133,133,133,133,133,133,134,134,134,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,1,2,3,4,5,6,7,8,9,10,11,12,15,15,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,0,0,16,33,34,35,36,37,38,39,40,41,42,43,44,45,16,16,48,49,50,51,52,53,54,55,56,57,58,59,60,61,32,32,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,48,142,101,1,140,102,1,134,10,132,11,170,240,2,169,64,141,100,1,32,198,134,160,1,177,10,141,103,1,200,177,10,141,104,1,200,177,10,141,109,1,200,177,10,141,110,1,169,255,141,97,1,141,99,1,169,15,141,21,64,169,128,141,8,64,169,0,141,15,64,169,48,141,0,64,141,4,64,141,12,64,169,8,141,1,64,141,5,64,169,0,141,74,1,141,111,1,162,55,169,0,157,20,1,157,15,1,157,10,1,157,35,1,169,48,157,40,1,232,224,60,208,232,162,0,169,127,157,22,1,169,139,157,33,1,169,0,157,11,1,157,0,1,232,224,11,208,233,76,104,138,174,101,1,134,10,174,102,1,134,11,160,0,209,10,176,92,10,133,10,10,170,10,101,10,134,10,101,10,105,5,168,173,101,1,133,10,32,198,134,162,55,177,10,157,0,1,200,177,10,157,5,1,200,169,0,157,20,1,157,15,1,157,10,1,157,35,1,169,48,157,40,1,232,224,60,208,220,173,100,1,240,2,200,200,177,10,141,105,1,200,177,10,141,106,1,169,0,141,107,1,169,6,141,108,1,141,74,1,96,170,240,24,32,104,138,169,0,141,0,1,141,3,1,141,6,1,141,9,1,173,74,1,9,128,208,5,173,74,1,41,127,141,74,1,96,165,10,72,165,11,72,173,74,1,48,2,208,3,76,72,136,24,173,107,1,109,105,1,141,107,1,173,108,1,109,106,1,205,74,1,176,6,141,108,1,76,12,136,56,237,74,1,141,108,1,162,55,32,186,137,144,11,162,0,173,70,1,32,103,137,141,95,1,162,56,32,186,137,144,11,162,3,173,71,1,32,103,137,141,96,1,162,57,32,186,137,144,8,162,6,173,72,1,32,103,137,162,58,32,186,137,144,11,162,9,173,73,1,32,103,137,141,98,1,162,0,189,11,1,240,5,222,11,1,208,43,189,22,1,133,10,189,33,1,133,11,188,44,1,177,10,16,9,24,105,64,157,0,1,200,208,13,208,7,200,177,10,168,76,37,136,200,157,11,1,152,157,44,1,232,224,11,208,198,173,65,1,240,34,24,109,1,1,13,100,1,170,173,2,1,168,125,130,139,141,113,1,152,9,127,48,2,169,0,125,2,140,141,114,1,173,0,1,13,95,1,141,112,1,173,66,1,240,34,24,109,4,1,13,100,1,170,173,5,1,168,125,130,139,141,116,1,152,9,127,48,2,169,0,125,2,140,141,117,1,173,3,1,13,96,1,141,115,1,173,67,1,240,34,24,109,7,1,13,100,1,170,173,8,1,168,125,130,139,141,119,1,152,9,127,48,2,169,0,125,2,140,141,120,1,173,6,1,9,128,141,118,1,173,68,1,240,24,24,109,10,1,41,15,73,15,133,12,173,98,1,10,41,128,5,12,141,122,1,173,9,1,9,240,141,121,1,173,191,1,208,20,162,0,32,202,138,162,15,32,202,138,162,30,32,202,138,162,45,32,202,138,169,0,141,191,1,173,112,1,141,0,64,173,113,1,141,2,64,173,114,1,205,97,1,240,6,141,97,1,141,3,64,173,115,1,141,4,64,173,116,1,141,6,64,173,117,1,205,99,1,240,6,141,99,1,141,7,64,173,118,1,141,8,64,173,119,1,141,10,64,173,120,1,141,11,64,173,121,1,141,12,64,173,122,1,141,14,64,104,133,11,104,133,10,96,10,168,173,104,1,105,0,133,11,173,103,1,133,10,177,10,133,12,200,177,10,157,22,1,200,177,10,200,157,33,1,232,177,10,157,22,1,200,177,10,157,33,1,169,0,157,10,1,157,43,1,157,11,1,157,44,1,224,9,176,19,232,200,157,11,1,157,44,1,177,10,157,22,1,200,177,10,157,33,1,165,12,96,189,20,1,240,5,222,20,1,24,96,189,0,1,133,10,189,5,1,133,11,160,0,177,10,230,10,208,2,230,11,9,0,48,12,74,144,3,254,20,1,157,10,1,56,176,94,41,127,74,176,7,10,10,157,15,1,144,220,201,61,144,75,240,43,201,62,240,52,24,165,10,105,3,157,25,1,165,11,105,0,157,30,1,177,10,157,35,1,200,177,10,133,12,200,177,10,133,11,165,12,133,10,160,0,76,208,137,177,10,141,74,1,230,10,208,162,230,11,208,158,177,10,133,12,200,177,10,133,11,165,12,133,10,136,76,208,137,157,20,1,189,35,1,240,18,222,35,1,208,13,189,25,1,157,0,1,189,30,1,157,5,1,96,165,10,157,0,1,165,11,157,5,1,96,169,15,141,21,64,96,134,10,132,11,160,0,173,100,1,208,2,200,200,177,10,141,123,1,200,177,10,141,124,1,162,0,32,149,138,138,24,105,15,170,224,60,208,244,96,169,0,157,127,1,157,125,1,157,128,1,157,135,1,169,48,157,129,1,157,132,1,157,138,1,96,10,168,32,149,138,173,123,1,133,10,173,124,1,133,11,177,10,157,126,1,200,177,10,157,127,1,96,189,125,1,240,5,222,125,1,208,54,189,127,1,208,1,96,133,11,189,126,1,133,10,188,128,1,24,177,10,48,13,240,28,200,157,125,1,152,157,128,1,76,10,139,200,134,12,101,12,170,177,10,200,157,1,1,166,12,76,229,138,157,127,1,173,112,1,41,15,133,12,189,129,1,41,15,197,12,144,18,189,129,1,141,112,1,189,130,1,141,113,1,189,131,1,141,114,1,173,115,1,41,15,133,12,189,132,1,41,15,197,12,144,18,189,132,1,141,115,1,189,133,1,141,116,1,189,134,1,141,117,1,189,135,1,240,15,141,118,1,189,136,1,141,119,1,189,137,1,141,120,1,173,121,1,41,15,133,12,189,138,1,41,15,197,12,144,12,189,138,1,141,121,1,189,139,1,141,122,1,96,192,0,0,0,51,218,134,54,235,165,98,35,231,175,122,72,25,236,194,154,117,82,48,17,243,215,188,163,140,117,96,76,58,40,23,8,249,235,221,209,197,186,175,165,156,147,139,131,124,117,110,104,98,92,87,82,77,73,69,65,61,58,54,51,48,45,43,0,173,77,242,157,76,0,184,116,52,247,190,136,86,38,248,206,165,127,91,57,25,251,222,195,170,146,123,102,82,63,45,28,12,253,238,225,212,200,189,178,168,159,150,141,133,126,118,112,105,99,94,88,83,79,74,70,66,62,58,55,52,49,46,0,6,5,5,5,4,4,4,4,3,3,3,3,3,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,6,5,5,5,5,4,4,4,3,3,3,3,3,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,0,240,7,169,178,162,140,76,0,3,96,169,37,133,218,169,3,133,219,169,0,168,162,4,240,10,145,218,200,208,251,230,219,202,208,246,192,4,240,5,145,218,200,208,247,96,0,165,80,201,13,176,6,165,81,201,13,144,7,169,0,133,77,133,76,96,165,80,240,13,162,0,165,80,56,233,1,176,5,202,76,215,140,170,32,36,178,5,78,133,218,138,24,105,3,133,219,160,152,177,218,133,76,165,81,240,13,162,0,165,81,56,233,1,176,5,202,76,252,140,170,32,36,178,5,79,133,218,138,24,105,3,133,219,160,152,177,218,133,77,96,160,7,177,210,170,136,177,210,32,140,179,160,5,177,210,170,136,177,210,32,222,178,48,88,160,7,177,210,170,136,177,210,32,140,179,160,5,177,210,170,136,177,210,24,105,15,144,1,232,32,222,178,240,2,16,56,160,5,177,210,170,136,177,210,32,140,179,160,3,177,210,170,136,177,210,32,222,178,48,32,160,5,177,210,170,136,177,210,32,140,179,160,3,177,210,170,136,177,210,24,105,15,144,1,232,32,222,178,48,8,240,6,162,0,138,76,37,179,162,0,169,1,76,37,179,162,0,165,146,24,105,3,144,1,232,197,102,138,233,0,144,68,165,146,32,138,179,165,102,24,105,11,144,2,162,1,32,222,178,240,2,176,47,162,0,165,147,24,105,13,144,1,232,197,103,138,233,0,144,30,165,147,32,138,179,165,103,24,105,13,144,3,162,1,24,105,252,72,138,105,255,170,104,32,222,178,144,6,240,4,162,0,138,96,162,0,169,1,96,160,3,177,210,170,136,177,210,224,0,208,7,201,0,208,3,76,32,179,200,177,210,170,224,128,144,14,160,1,177,210,170,136,177,210,32,54,179,76,32,179,160,1,177,210,170,136,177,210,76,32,179,160,3,177,210,48,29,177,210,170,136,177,210,32,140,179,160,3,177,210,170,136,177,210,32,222,178,48,46,240,44,160,1,76,107,142,177,210,170,136,177,210,32,140,179,160,3,177,210,170,136,177,210,32,54,179,32,222,178,16,14,160,1,177,210,170,136,177,210,32,54,179,76,32,179,160,3,177,210,170,136,177,210,76,32,179,165,44,133,45,169,0,32,107,132,133,44,69,45,133,218,165,44,37,218,133,45,96,169,8,32,118,179,169,0,32,90,132,169,1,133,154,169,0,133,155,162,255,169,160,133,144,134,145,96,169,4,141,40,5,170,48,21,173,40,5,32,94,130,173,41,5,32,139,133,173,40,5,56,233,1,76,167,142,96,169,0,141,40,5,56,233,5,80,2,73,128,16,21,173,40,5,32,94,130,173,41,5,32,139,133,173,40,5,24,105,1,76,197,142,96,32,181,178,169,56,160,1,145,210,200,169,3,145,210,169,0,168,145,210,170,169,96,32,92,133,169,0,141,55,3,96,162,32,169,0,32,234,132,169,0,32,118,179,162,4,76,245,132,173,55,3,72,24,105,1,141,55,3,104,24,105,56,133,218,169,0,105,3,133,219,165,63,160,0,145,218,173,55,3,72,24,105,1,141,55,3,104,24,105,56,168,169,0,105,3,170,152,32,140,179,165,62,166,63,133,214,24,105,1,144,1,232,133,62,134,63,165,214,160,0,32,236,179,173,55,3,72,24,105,1,141,55,3,104,24,105,56,133,218,169,0,105,3,133,219,165,42,160,0,145,218,96,165,42,133,68,162,0,165,41,32,36,178,134,226,10,38,226,166,226,24,101,40,144,1,232,133,62,138,24,105,32,133,63,165,68,32,138,179,169,10,32,47,180,24,105,16,133,42,32,23,143,165,68,32,138,179,169,10,32,126,180,24,105,16,133,42,76,23,143,162,0,165,40,32,63,178,133,218,134,219,162,0,165,41,32,63,178,32,22,178,24,101,218,133,70,138,101,219,162,0,165,40,32,53,178,41,1,133,218,162,0,165,41,32,53,178,41,1,10,144,1,24,101,218,133,69,164,70,185,233,6,133,68,164,69,185,150,232,37,68,32,138,179,165,189,166,190,164,43,133,218,134,219,177,218,32,138,179,165,69,10,32,162,179,32,70,179,133,68,164,70,165,68,153,233,6,96,32,195,143,162,0,165,43,32,11,178,24,101,191,133,54,138,101,192,133,55,162,0,165,41,32,36,178,134,226,10,38,226,166,226,24,101,40,144,1,232,72,138,24,105,32,170,104,133,62,134,63,133,214,134,215,24,105,1,144,1,232,133,62,134,63,165,214,166,215,32,234,132,165,54,166,55,133,214,134,215,24,105,1,144,1,232,133,54,134,55,160,0,177,214,32,241,132,165,54,166,55,133,214,134,215,24,105,1,144,1,232,133,54,134,55,160,0,177,214,32,241,132,169,31,24,101,62,133,62,144,2,230,63,165,62,166,63,133,214,134,215,24,105,1,144,1,232,133,62,134,63,165,214,166,215,32,234,132,165,54,166,55,133,214,134,215,24,105,1,144,1,232,133,54,134,55,160,0,177,214,32,241,132,165,54,133,218,165,55,133,219,160,0,177,218,76,241,132,32,195,143,165,70,24,105,192,133,62,169,0,105,35,133,63,165,68,133,42,32,23,143,162,0,165,43,32,11,178,24,101,191,133,54,138,101,192,133,55,162,0,165,41,32,36,178,134,226,10,38,226,166,226,24,101,40,144,1,232,133,62,138,24,105,32,133,63,165,54,166,55,133,214,134,215,24,105,1,144,1,232,133,54,134,55,160,0,177,214,133,42,32,23,143,165,54,166,55,133,214,134,215,24,105,1,144,1,232,133,54,134,55,160,0,177,214,133,42,32,23,143,169,30,24,101,62,133,62,144,2,230,63,165,54,166,55,133,214,134,215,24,105,1,144,1,232,133,54,134,55,160,0,177,214,133,42,32,23,143,165,54,133,218,165,55,133,219,160,0,177,218,133,42,76,23,143,162,0,165,41,32,36,178,5,40,24,105,88,133,218,138,105,4,133,219,165,43,160,0,145,218,162,0,165,41,32,36,178,5,40,24,105,152,168,138,105,3,170,152,32,140,179,165,193,166,194,164,43,133,218,134,219,177,218,160,0,32,236,179,165,40,10,133,40,165,41,10,144,1,24,105,6,133,41,76,245,144,165,67,56,233,1,133,67,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,162,0,161,214,96,164,72,165,68,153,88,4,165,72,24,105,1,133,72,165,64,24,105,1,41,15,133,64,165,64,208,7,165,65,24,105,1,133,65,96,169,0,133,72,133,65,133,64,170,173,40,3,10,144,2,232,24,101,201,133,218,138,101,202,133,219,160,1,177,218,133,53,136,177,218,133,52,165,72,201,192,176,53,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,160,0,177,214,133,66,41,31,133,68,165,66,133,74,201,32,144,11,32,21,146,165,74,56,233,32,76,129,146,32,21,146,76,93,146,169,192,133,46,165,46,72,56,233,1,133,46,104,170,240,35,164,46,185,88,4,133,68,201,5,176,14,32,202,132,41,1,240,7,169,16,24,101,68,133,68,164,46,165,68,153,88,4,76,156,146,173,40,3,208,11,165,173,201,20,208,5,169,29,141,192,4,165,203,133,52,165,204,133,53,134,68,165,209,133,46,165,46,72,56,233,1,133,46,104,170,240,66,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,160,0,177,214,133,69,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,177,214,133,72,165,69,205,40,3,208,191,164,46,185,72,5,208,184,32,21,146,76,233,146,133,64,133,65,169,88,133,58,169,4,133,59,138,133,72,201,192,176,104,165,58,166,59,133,214,134,215,24,105,1,144,1,232,133,58,134,59,160,0,177,214,133,66,169,152,162,3,24,101,72,144,1,232,32,140,179,165,193,166,194,164,66,133,218,134,219,177,218,160,0,32,236,179,165,64,10,133,40,165,65,10,144,1,24,105,6,133,41,165,66,133,43,32,47,144,165,64,24,105,1,41,15,133,64,165,64,208,7,165,65,24,105,1,133,65,165,72,24,105,1,76,68,147,32,194,178,169,233,160,2,145,210,200,169,6,145,210,169,192,160,0,145,210,200,169,35,145,210,162,0,169,64,76,42,132,162,0,165,41,32,36,178,134,226,10,38,226,133,218,165,40,5,218,72,165,226,24,105,32,170,104,32,234,132,160,1,177,210,170,136,177,210,133,214,134,215,24,105,1,144,1,232,32,2,180,160,0,177,214,133,46,170,208,3,76,18,179,165,46,201,37,208,10,165,41,24,105,1,133,41,76,210,147,165,46,56,233,32,32,241,132,76,239,147,165,207,133,52,165,208,133,53,169,0,133,46,201,30,176,15,164,46,169,1,153,42,5,165,46,24,105,1,76,53,148,96,165,185,133,68,32,181,178,165,183,160,2,145,210,165,184,24,105,48,56,233,12,176,1,56,233,16,176,1,56,233,1,136,145,210,165,83,136,145,210,162,0,165,68,10,144,2,232,24,105,192,133,218,138,105,225,133,219,200,177,218,170,136,177,218,32,245,130,133,83,96,162,0,173,40,3,10,144,2,232,24,101,207,72,138,101,208,170,104,133,52,134,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,160,0,177,214,133,185,165,52,133,218,165,53,133,219,177,218,133,68,165,185,240,23,172,40,3,185,42,5,240,15,165,68,41,240,133,184,165,68,10,10,10,10,133,183,96,169,0,133,185,96,169,0,133,144,133,145,133,142,133,143,96,32,231,148,169,0,133,148,133,150,133,149,133,155,133,154,133,151,133,173,133,179,133,157,133,181,133,170,141,37,5,141,37,5,133,160,96,165,160,240,6,173,38,3,208,1,96,32,181,178,165,146,160,2,145,210,165,147,24,105,48,56,233,12,176,1,56,233,16,176,1,56,233,1,136,145,210,165,83,136,145,210,162,0,165,151,10,144,2,232,24,105,96,133,218,138,105,225,133,219,200,177,218,170,136,177,218,32,245,130,133,83,96,165,138,166,139,32,78,178,32,63,178,133,146,165,140,166,141,32,78,178,32,63,178,133,147,96,169,0,133,162,133,176,169,4,32,118,179,169,0,32,90,132,165,174,240,10,165,174,56,233,1,133,174,76,158,149,169,1,141,51,3,169,2,133,160,169,100,133,161,96,160,5,177,210,136,17,210,240,16,200,177,210,170,136,177,210,56,233,1,176,1,202,32,4,180,160,3,177,210,170,136,177,210,32,2,180,160,9,177,210,170,136,177,210,224,0,240,3,76,127,150,201,10,240,3,76,127,150,165,179,208,3,76,127,150,160,6,177,210,133,40,160,4,177,210,133,41,134,43,32,166,145,165,203,133,52,165,204,133,53,165,209,133,46,165,46,72,56,233,1,133,46,104,170,240,92,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,160,0,177,214,133,68,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,177,214,133,69,165,68,205,40,3,208,191,160,5,177,210,170,136,177,210,32,36,178,160,6,17,210,72,138,200,17,210,170,104,224,0,208,165,197,69,208,161,164,46,138,153,72,5,76,5,150,165,179,56,233,1,133,179,169,1,32,118,179,32,90,132,76,132,150,169,100,141,49,3,160,10,76,254,177,173,26,5,208,1,96,173,26,5,56,233,1,141,26,5,172,26,5,185,24,5,133,182,164,182,173,37,5,153,27,5,169,16,141,39,5,165,148,240,34,201,8,208,90,169,29,162,5,24,101,182,144,1,232,133,218,134,219,165,146,56,233,4,160,0,145,218,164,182,169,252,76,238,150,169,29,162,5,24,101,182,144,1,232,133,218,134,219,165,146,24,105,12,160,0,145,218,164,182,169,4,153,33,5,169,31,162,5,24,101,182,144,1,232,133,218,134,219,165,147,24,105,6,160,0,145,218,164,182,169,0,153,35,5,169,9,32,118,179,169,2,76,90,132,164,182,169,0,153,27,5,172,26,5,165,182,153,24,5,173,26,5,24,105,1,141,26,5,169,5,32,118,179,169,2,76,90,132,169,0,133,182,201,2,144,1,96,164,182,185,27,5,208,3,76,115,152,169,29,162,5,24,101,182,144,1,232,32,140,179,133,218,134,219,162,0,161,218,32,138,179,169,33,162,5,24,101,182,144,1,232,160,0,32,42,179,32,229,177,160,0,32,236,179,169,31,162,5,24,101,182,144,1,232,32,140,179,133,218,134,219,162,0,161,218,32,138,179,169,35,162,5,24,101,182,144,1,232,160,0,32,42,179,32,229,177,160,0,32,236,179,164,182,185,27,5,201,9,176,5,173,38,3,240,41,32,194,178,164,182,185,29,5,160,3,145,210,164,182,185,31,5,24,105,19,160,2,145,210,169,63,136,145,210,169,3,136,145,210,165,83,32,203,130,133,83,164,182,162,0,185,29,5,24,105,4,144,1,232,32,219,179,133,78,164,182,162,0,185,31,5,24,105,4,144,1,232,56,233,16,176,1,202,32,219,179,133,80,162,0,165,80,32,36,178,5,78,133,218,138,24,105,3,133,219,160,152,177,218,133,72,169,27,162,5,24,101,182,144,1,232,133,212,134,213,133,218,134,219,160,0,177,218,56,233,1,145,212,164,182,185,27,5,240,42,164,182,185,29,5,201,4,144,33,164,182,185,29,5,201,252,176,24,164,182,185,31,5,201,4,144,15,164,182,185,31,5,201,204,176,6,165,72,41,8,240,3,32,25,151,165,182,24,105,1,76,61,151,169,0,133,169,133,168,133,178,133,158,165,154,208,33,169,16,24,101,144,133,144,144,2,230,145,165,144,201,1,165,145,233,1,112,2,73,128,16,8,162,1,169,0,133,144,134,145,165,157,240,6,169,0,133,144,133,145,170,165,146,32,78,178,133,78,162,0,165,146,24,105,7,144,1,232,32,219,179,133,79,165,144,24,101,140,133,140,165,145,101,141,133,141,166,141,224,128,144,6,169,0,133,140,133,141,32,98,149,165,144,24,101,165,133,50,165,145,101,166,170,134,51,224,128,144,88,165,147,56,233,252,72,169,0,233,255,170,104,32,219,179,133,81,133,80,32,178,140,165,76,41,8,208,9,165,77,41,8,208,3,76,215,153,162,0,165,80,24,105,1,144,1,232,32,36,178,24,105,252,133,147,138,105,255,162,0,138,133,144,133,145,165,147,32,36,178,32,11,178,133,140,134,141,169,0,133,157,169,1,133,181,76,231,153,165,50,201,1,165,51,233,0,112,2,73,128,48,3,76,231,153,162,0,165,147,24,105,16,144,1,232,32,219,179,133,81,133,80,32,178,140,165,147,32,138,179,165,80,56,233,1,176,2,162,255,32,36,178,24,105,4,144,1,232,32,222,178,176,69,165,76,41,12,208,6,165,77,41,12,240,57,162,0,138,133,144,133,145,165,80,56,233,1,10,10,10,10,133,147,32,36,178,32,11,178,133,140,134,141,169,0,133,157,169,1,133,181,133,158,165,76,41,1,208,6,165,77,41,1,240,23,169,1,133,178,76,231,153,165,76,41,1,208,6,165,77,41,1,240,4,169,1,133,168,165,154,208,15,165,157,208,8,165,158,208,4,165,168,240,3,32,138,142,165,154,240,61,165,155,201,16,176,18,169,16,56,229,155,73,255,56,101,144,133,144,169,255,101,145,133,145,165,144,201,0,165,145,233,255,80,2,73,128,16,8,162,255,169,0,133,144,134,145,165,155,24,105,1,133,155,201,16,208,4,169,0,133,154,165,44,41,32,240,17,166,145,224,128,144,11,169,8,24,101,144,133,144,144,2,230,145,165,44,41,64,208,6,165,44,41,128,240,2,169,1,32,107,178,240,71,165,142,201,1,165,143,233,0,112,2,73,128,16,20,165,142,56,233,16,133,142,176,2,198,143,166,143,224,128,144,40,76,166,154,166,143,224,128,144,31,169,16,24,101,142,133,142,144,2,230,143,165,142,201,1,165,143,233,0,112,2,73,128,16,6,169,0,133,142,133,143,165,44,41,64,240,29,169,8,133,148,165,142,201,129,165,143,233,255,112,2,73,128,16,11,165,142,56,233,16,133,142,176,2,198,143,165,44,41,128,240,29,169,0,133,148,165,142,201,128,165,143,233,0,80,2,73,128,16,11,169,16,24,101,142,133,142,144,2,230,143,165,142,24,101,138,133,138,165,143,101,139,133,139,165,157,240,13,165,163,24,101,138,133,138,165,164,101,139,133,139,165,138,201,0,165,139,233,1,80,2,73,128,16,7,169,4,133,146,76,61,155,165,138,201,1,165,139,233,61,112,2,73,128,16,7,169,244,133,146,76,61,155,32,98,149,165,147,56,233,252,72,169,0,233,255,170,104,32,219,179,133,80,162,0,165,147,24,105,15,144,1,232,32,219,179,133,81,165,142,24,101,163,133,50,165,143,101,164,133,51,165,50,5,51,208,3,76,153,156,166,51,224,128,144,30,162,0,165,146,32,78,178,133,79,133,78,24,105,1,10,10,10,10,133,68,165,78,56,233,1,176,43,76,191,155,162,0,165,146,24,105,8,144,1,232,32,219,179,133,79,133,78,162,0,165,78,56,233,1,176,1,202,32,36,178,24,105,8,133,68,165,78,24,105,1,133,72,32,178,140,165,76,41,8,208,9,165,77,41,8,208,3,76,137,156,162,0,138,133,142,133,143,165,68,133,146,32,36,178,32,11,178,133,138,134,139,169,1,133,181,165,76,162,0,41,2,240,63,160,10,32,34,180,165,76,160,8,145,210,200,169,0,145,210,165,78,160,6,145,210,200,169,0,145,210,165,80,160,4,145,210,200,169,0,145,210,165,72,160,2,145,210,200,169,0,145,210,165,80,160,0,145,210,200,169,0,145,210,32,167,149,165,80,32,138,179,165,81,32,220,178,240,90,165,77,162,0,41,2,240,82,160,10,32,34,180,165,77,160,8,145,210,200,169,0,145,210,165,78,160,6,145,210,200,169,0,145,210,165,81,160,4,145,210,200,169,0,145,210,165,72,160,2,145,210,200,169,0,145,210,165,81,160,0,145,210,200,169,0,145,210,32,167,149,76,153,156,165,76,41,1,208,6,165,77,41,1,240,2,169,1,133,169,169,0,133,162,165,168,240,54,169,1,133,162,165,144,166,145,32,54,179,134,226,5,226,240,32,165,144,166,145,32,54,179,201,1,138,233,0,112,2,73,128,16,7,162,0,169,224,76,211,156,162,255,169,32,76,211,156,170,133,144,134,145,165,169,240,4,169,1,133,162,165,160,201,2,240,11,165,162,240,7,32,98,149,169,1,133,176,173,39,5,240,13,173,39,5,72,56,233,1,141,39,5,76,29,157,165,153,208,24,165,44,41,2,240,18,173,37,5,201,47,176,11,173,37,5,72,24,105,1,141,37,5,104,32,136,179,165,44,41,2,32,220,178,208,15,173,37,5,201,8,144,3,32,137,150,169,0,141,37,5,165,160,201,8,208,5,169,6,76,177,157,173,37,5,240,5,169,6,76,177,157,173,39,5,240,5,169,7,76,177,157,165,44,41,32,240,5,169,5,76,177,157,165,144,201,128,165,145,233,255,80,2,73,128,16,5,169,2,76,177,157,165,144,201,192,165,145,233,255,80,2,73,128,16,5,169,1,76,177,157,165,144,201,64,165,145,233,0,80,2,73,128,16,5,169,0,76,177,157,165,144,201,128,165,145,233,0,80,2,73,128,16,5,169,3,76,177,157,169,4,133,151,165,148,24,101,151,133,151,165,146,133,171,165,147,133,172,96,165,205,133,52,165,206,133,53,169,0,133,47,201,90,144,1,96,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,160,0,177,214,133,66,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,177,214,133,68,169,216,162,5,24,101,47,144,1,232,133,218,134,219,165,68,41,240,145,218,169,126,162,5,24,101,47,144,1,232,133,218,134,219,165,68,10,10,10,10,145,218,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,177,214,133,68,41,240,133,70,165,68,10,10,10,10,133,69,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,177,214,41,15,133,68,201,2,144,5,165,68,74,133,68,169,50,162,6,24,101,47,144,1,232,32,140,179,164,47,185,126,5,197,69,208,5,169,0,76,167,158,165,69,32,138,179,164,47,185,126,5,32,220,178,144,7,240,5,165,68,76,167,158,162,0,165,68,32,54,179,160,0,32,236,179,169,140,162,6,24,101,47,144,1,232,32,140,179,164,47,185,216,5,197,70,208,5,169,0,76,228,158,165,70,32,138,179,164,47,185,216,5,32,220,178,144,7,240,5,165,68,76,228,158,162,0,165,68,32,54,179,160,0,32,236,179,165,47,24,105,1,76,205,157,173,41,3,201,99,240,66,173,41,3,24,109,41,3,144,1,24,109,41,3,133,47,169,0,133,46,201,3,176,43,166,46,164,47,189,90,5,153,126,5,189,93,5,153,216,5,189,108,5,153,50,6,189,111,5,153,140,6,165,47,24,105,1,133,47,165,46,24,105,1,76,9,159,96,164,46,165,100,153,114,5,165,101,153,117,5,165,102,153,90,5,165,103,153,93,5,165,104,153,96,5,165,106,153,102,5,165,105,153,99,5,165,107,153,105,5,165,108,153,108,5,165,109,153,111,5,165,110,153,132,0,165,111,153,120,5,96,165,68,10,10,133,111,96,162,0,173,40,3,32,11,178,24,101,205,133,218,138,101,206,133,219,162,0,173,40,3,32,22,178,24,101,218,133,52,138,101,219,133,53,173,40,3,10,144,1,24,109,40,3,133,70,133,86,169,0,133,46,201,3,144,1,96,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,160,0,177,214,133,100,164,46,169,0,153,123,0,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,160,0,177,214,133,68,41,240,133,105,165,68,10,10,10,10,133,104,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,177,214,133,68,41,240,133,107,165,68,10,10,10,10,133,106,165,52,166,53,133,214,134,215,24,105,1,144,1,232,133,52,134,53,177,214,133,68,41,240,133,71,165,68,41,15,133,72,164,70,185,126,5,133,102,164,70,185,216,5,133,103,165,100,41,63,201,1,240,15,201,2,240,11,201,3,240,7,201,4,240,3,76,208,160,169,0,133,110,165,100,56,233,1,10,10,10,133,101,169,50,162,6,24,101,70,144,1,232,160,0,32,42,179,133,108,169,140,162,6,24,101,70,144,1,232,32,42,179,133,109,165,72,201,1,208,5,164,46,76,163,160,164,46,169,0,153,126,0,165,104,56,229,106,144,14,240,12,165,104,133,68,165,106,133,104,165,68,133,106,165,105,56,229,107,144,14,240,12,165,105,133,68,165,107,133,105,165,68,133,107,164,46,169,0,153,92,0,164,46,153,95,0,165,70,24,105,1,133,70,32,59,159,165,46,24,105,1,76,181,159,169,95,162,0,24,101,46,144,1,232,133,218,134,219,160,0,177,218,9,1,145,218,165,170,24,105,1,133,170,96,165,102,197,146,176,5,169,0,76,25,161,169,4,133,111,164,46,169,8,153,92,0,76,238,160,169,0,133,165,133,166,133,163,133,164,133,157,133,91,165,85,24,105,1,133,85,201,3,144,4,169,0,133,85,165,85,133,46,169,3,133,47,165,47,72,56,233,1,133,47,104,170,208,1,96,169,2,24,101,46,133,46,201,3,144,7,165,46,56,233,3,133,46,164,46,185,114,5,133,100,185,117,5,133,101,185,90,5,133,102,185,93,5,133,103,185,96,5,133,104,185,102,5,133,106,185,99,5,133,105,185,105,5,133,107,185,108,5,133,108,185,111,5,133,109,185,132,0,133,110,185,120,5,133,111,165,100,240,159,164,46,185,95,0,41,1,32,107,178,133,98,169,255,133,90,164,46,185,92,0,208,3,76,111,162,169,92,162,0,24,101,46,144,1,232,133,212,134,213,133,218,134,219,160,0,177,218,56,233,1,145,212,173,38,3,208,7,164,46,185,95,0,208,7,164,46,185,123,5,133,90,165,102,133,64,169,135,162,0,24,101,46,144,1,232,160,0,32,42,179,24,101,102,133,102,162,0,165,103,32,78,178,133,80,162,0,165,103,24,105,15,144,1,232,32,219,179,133,81,169,135,162,0,24,101,46,144,1,232,32,42,179,10,144,10,162,0,165,102,32,78,178,76,74,162,162,0,165,102,24,105,15,144,1,232,32,219,179,133,79,133,78,32,178,140,165,77,5,76,133,88,165,102,240,13,165,102,201,240,176,7,165,88,208,3,76,134,167,165,64,133,102,76,134,167,165,98,208,3,76,134,167,162,0,165,146,24,105,7,144,1,232,197,102,138,233,0,144,21,165,146,32,138,179,165,102,24,105,15,144,2,162,1,32,222,178,144,7,240,5,169,0,76,163,162,169,1,133,99,165,108,240,5,165,102,76,176,162,165,103,162,0,24,105,4,144,1,232,32,205,179,41,1,133,87,165,100,41,63,201,1,240,15,201,2,240,11,201,3,240,7,201,4,240,3,76,207,163,164,46,185,126,0,240,8,173,38,3,208,3,76,173,163,165,108,24,101,102,133,102,162,0,165,103,32,78,178,133,80,162,0,165,103,24,105,15,144,1,232,32,219,179,133,81,165,108,10,144,10,162,0,165,102,32,78,178,76,32,163,162,0,165,102,24,105,15,144,1,232,32,219,179,133,79,133,78,32,178,140,162,0,165,77,5,76,133,88,165,109,24,101,103,133,103,165,102,32,78,178,133,78,162,0,165,102,24,105,15,144,1,232,32,219,179,133,79,165,109,10,144,10,162,0,165,103,32,78,178,76,104,163,162,0,165,103,24,105,15,144,1,232,32,219,179,133,81,133,80,32,178,140,162,0,165,77,5,76,133,89,165,104,197,102,240,10,165,106,197,102,240,4,165,88,240,10,165,108,16,1,202,32,54,179,133,108,165,105,197,103,240,10,165,107,197,103,240,4,165,89,240,12,162,0,165,109,16,1,202,32,54,179,133,109,165,108,10,176,10,165,109,10,176,5,169,0,76,190,163,169,1,133,68,32,122,159,165,101,24,101,87,144,1,24,101,111,133,90,164,46,165,90,153,123,5,165,100,201,4,240,3,76,28,165,165,99,208,3,76,28,165,165,157,240,3,76,28,165,165,154,240,3,76,28,165,165,108,240,103,162,0,165,147,24,105,16,144,1,232,197,103,138,233,0,144,86,162,0,165,147,24,105,12,144,1,232,56,229,103,133,226,138,233,0,5,226,144,2,208,62,169,1,133,157,162,0,165,108,16,1,202,32,140,179,169,6,32,138,179,164,46,185,126,0,32,13,180,32,162,179,133,163,134,164,162,0,165,103,56,233,16,176,1,202,32,36,178,32,11,178,133,140,134,141,32,78,178,32,63,178,133,147,165,109,10,144,41,162,0,165,147,24,105,17,144,1,232,197,103,138,233,0,144,24,162,0,165,147,24,105,12,144,1,232,56,229,103,133,226,138,233,0,5,226,144,77,240,75,165,109,56,233,1,112,2,73,128,48,3,76,28,165,162,0,165,147,24,105,16,144,1,232,133,218,134,219,162,0,165,109,16,1,202,24,101,218,72,138,101,219,170,104,197,103,138,233,0,144,92,162,0,165,147,24,105,12,144,1,232,56,229,103,133,226,138,233,0,5,226,144,2,208,68,169,1,133,157,162,0,165,109,16,1,202,32,140,179,169,6,32,138,179,164,46,185,126,0,32,13,180,32,162,179,133,165,134,166,162,0,165,103,56,233,16,176,1,202,32,36,178,32,11,178,133,140,134,141,32,78,178,32,63,178,133,147,169,0,133,144,133,145,165,98,208,3,76,134,167,165,100,201,4,208,3,76,134,167,165,99,240,107,162,0,165,147,197,103,176,99,165,147,24,105,15,144,1,232,197,103,138,233,0,144,84,165,157,208,80,165,158,208,76,165,100,201,255,144,3,32,12,161,165,109,10,144,12,162,0,165,109,16,1,202,32,54,179,133,109,32,138,142,165,147,32,138,179,165,103,56,233,12,176,2,162,255,32,222,178,144,23,240,21,165,103,56,233,12,133,147,162,0,165,147,32,36,178,32,11,178,133,140,134,141,169,1,76,176,166,165,91,240,3,76,178,166,165,160,240,3,76,178,166,32,141,141,170,208,3,76,178,166,165,108,240,25,165,108,56,233,1,112,2,73,128,16,7,162,0,169,224,76,208,165,162,255,169,32,76,208,165,170,133,142,134,143,165,102,56,229,146,72,169,0,133,226,104,5,226,240,75,165,102,56,229,146,72,104,240,31,165,108,10,144,17,162,0,165,108,16,1,202,32,54,179,201,128,144,47,76,46,166,165,108,201,128,144,243,76,46,166,165,108,10,144,19,162,0,165,108,16,1,202,32,54,179,162,0,201,128,144,11,76,41,166,165,108,201,128,144,241,162,255,32,54,179,133,108,165,109,240,25,165,109,56,233,1,112,2,73,128,16,7,162,0,169,224,76,78,166,162,255,169,32,76,78,166,170,133,144,134,145,165,108,208,86,165,103,56,229,147,5,226,240,75,165,103,56,229,147,72,104,240,31,165,109,10,144,17,162,0,165,109,16,1,202,32,54,179,201,128,144,47,76,170,166,165,109,201,128,144,243,76,170,166,165,109,10,144,19,162,0,165,109,16,1,202,32,54,179,162,0,201,128,144,11,76,165,166,165,109,201,128,144,241,162,255,32,54,179,133,109,169,1,133,176,133,91,165,91,240,3,76,134,167,169,2,133,182,165,182,72,56,233,1,133,182,104,170,208,3,76,134,167,164,182,185,27,5,240,234,32,207,178,164,182,162,0,185,29,5,24,105,3,144,1,232,160,6,145,210,200,138,145,210,164,182,162,0,185,31,5,24,105,3,144,1,232,160,4,145,210,200,138,145,210,165,102,160,2,145,210,200,169,0,145,210,165,103,160,0,145,210,200,169,0,145,210,32,16,141,170,240,161,169,6,32,118,179,169,1,32,90,132,164,46,169,8,153,92,0,165,100,201,5,240,80,165,100,201,9,240,74,165,100,201,11,240,68,169,135,162,0,24,101,46,144,1,232,133,218,134,219,165,100,201,5,240,12,165,100,201,9,240,6,165,100,201,11,208,5,169,0,76,127,167,165,146,197,102,208,5,169,0,76,127,167,165,102,56,229,146,144,7,240,5,169,2,76,127,167,169,254,160,0,145,218,32,25,151,165,90,201,255,240,65,32,181,178,165,102,160,2,145,210,165,103,24,105,48,56,233,12,176,1,56,233,16,176,1,56,233,1,136,145,210,165,83,136,145,210,162,0,165,90,10,144,2,232,24,101,195,133,218,138,101,196,133,219,200,177,218,170,136,177,218,32,245,130,133,83,32,59,159,76,74,161,169,27,162,230,32,140,179,162,32,169,0,76,99,131,165,173,205,44,3,240,27,165,173,141,44,3,169,28,133,40,169,4,133,41,172,50,3,185,211,229,56,229,173,133,42,32,127,143,165,179,205,43,3,240,20,165,179,141,43,3,169,16,133,40,169,4,133,41,165,179,133,42,32,127,143,165,174,205,42,3,240,18,165,174,141,42,3,169,4,133,40,133,41,165,174,133,42,32,127,143,162,0,173,38,5,205,37,5,176,26,173,37,5,32,53,178,24,105,164,133,62,138,105,32,133,63,169,9,133,42,32,23,143,76,136,168,173,38,5,56,237,37,5,144,36,240,34,162,32,169,164,133,62,134,63,169,8,133,42,169,24,133,46,165,46,72,56,233,1,133,46,104,170,240,6,32,23,143,76,118,168,173,37,5,141,38,5,96,169,0,32,94,130,32,127,130,169,0,32,107,132,170,208,248,169,4,141,41,5,76,195,142,32,198,134,32,165,142,32,171,130,76,108,130,32,6,143,160,3,177,210,170,136,177,210,32,44,130,160,1,177,210,170,136,177,210,32,117,178,32,143,168,32,116,142,165,45,41,11,240,247,32,167,168,169,0,32,230,131,76,32,179,32,6,143,169,114,162,193,32,44,130,169,130,162,193,32,54,130,169,79,162,230,32,140,179,162,32,169,0,32,99,131,169,10,133,40,169,21,133,41,169,158,162,232,32,140,179,32,210,147,169,5,133,40,169,26,133,41,169,171,162,232,32,140,179,32,210,147,32,143,168,32,74,131,32,116,142,165,45,41,11,240,244,169,0,32,118,179,32,90,132,169,20,32,139,133,76,167,168,169,11,133,40,169,15,133,41,169,194,162,232,32,140,179,76,210,147,169,12,133,40,169,16,133,41,169,205,162,232,32,140,179,32,210,147,32,181,178,169,112,160,2,145,210,169,88,136,145,210,169,0,136,145,210,169,73,162,232,32,245,130,76,61,131,169,12,133,40,169,15,133,41,169,214,162,232,32,140,179,32,210,147,173,50,3,24,105,17,176,3,76,241,132,76,241,132,165,68,201,3,169,0,170,42,10,144,2,232,24,105,154,133,218,138,105,232,133,219,160,1,177,218,170,136,177,218,32,140,179,162,32,169,0,32,99,131,169,2,133,40,169,16,133,41,162,0,165,68,10,144,2,232,24,105,187,133,218,138,105,229,133,219,160,1,177,218,170,136,177,218,32,140,179,32,210,147,169,12,133,40,169,4,133,41,169,222,162,232,32,140,179,32,210,147,173,50,3,24,105,17,32,241,132,169,1,76,4,135,169,4,133,40,169,6,133,41,169,230,162,232,32,140,179,32,210,147,32,181,178,169,12,160,2,145,210,169,68,136,145,210,169,0,136,145,210,169,175,162,221,32,245,130,133,83,32,181,178,169,12,160,2,145,210,169,108,136,145,210,165,83,136,145,210,169,169,162,222,32,245,130,133,83,32,181,178,169,12,160,2,145,210,169,148,136,145,210,165,83,136,145,210,169,219,162,222,32,245,130,133,83,96,169,1,32,147,133,169,114,162,193,32,44,130,169,130,162,193,32,54,130,32,6,143,32,171,130,32,136,179,32,163,131,169,0,133,50,133,51,169,240,133,65,169,0,133,40,169,22,133,41,169,165,162,233,32,140,179,32,210,147,169,0,32,94,130,32,127,130,169,4,141,41,5,32,195,142,169,0,32,107,132,41,8,208,73,165,50,201,44,165,51,233,1,80,2,73,128,16,59,32,181,178,169,102,160,2,145,210,165,65,136,145,210,169,0,136,145,210,169,24,162,232,32,245,130,165,65,201,113,144,7,165,65,56,233,1,133,65,32,74,131,165,50,166,51,24,105,1,144,1,232,133,50,134,51,76,200,170,32,165,142,32,108,130,32,171,130,169,0,76,147,133,169,0,141,51,3,141,52,3,170,173,50,3,10,144,2,232,24,105,217,133,218,138,105,229,133,219,160,1,177,218,133,198,136,177,218,133,197,162,0,173,50,3,10,144,2,232,24,105,223,133,218,138,105,229,133,219,200,177,218,133,200,136,177,218,133,199,162,0,173,50,3,10,144,2,232,24,105,229,133,218,138,105,229,133,219,200,177,218,133,192,136,177,218,133,191,162,0,173,50,3,10,144,2,232,24,105,235,133,218,138,105,229,133,219,200,177,218,133,190,136,177,218,133,189,162,0,173,50,3,10,144,2,232,24,105,241,133,218,138,105,229,133,219,200,177,218,133,194,136,177,218,133,193,162,0,173,50,3,10,144,2,232,24,105,247,133,218,138,105,229,133,219,200,177,218,133,196,136,177,218,133,195,162,0,173,50,3,10,144,2,232,24,105,253,133,218,138,105,229,133,219,200,177,218,133,202,136,177,218,133,201,162,0,173,50,3,10,144,2,232,24,105,3,133,218,138,105,230,133,219,200,177,218,133,204,136,177,218,133,203,172,50,3,185,9,230,133,209,162,0,173,50,3,10,144,2,232,24,105,12,133,218,138,105,230,133,219,160,1,177,218,133,206,136,177,218,133,205,162,0,173,50,3,10,144,2,232,24,105,18,133,218,138,105,230,133,219,200,177,218,133,208,136,177,218,133,207,172,50,3,185,214,229,141,54,3,172,50,3,185,208,229,133,188,165,197,166,198,32,44,130,165,199,166,200,32,54,130,32,6,143,32,211,167,172,50,3,185,199,229,141,40,3,32,43,148,32,181,178,169,72,160,1,145,210,200,169,5,145,210,169,1,160,0,145,210,165,209,162,0,32,92,133,172,50,3,162,0,185,202,229,32,36,178,24,105,4,144,1,232,32,36,178,32,11,178,133,138,134,139,172,50,3,162,0,185,205,229,32,36,178,32,36,178,32,11,178,133,140,134,141,32,242,148,32,195,157,169,0,133,173,141,47,3,133,179,141,49,3,141,38,3,141,39,3,169,255,141,43,3,141,44,3,141,45,3,141,42,3,141,46,3,169,15,141,231,6,141,230,6,169,0,141,232,6,96,165,187,208,6,32,165,142,76,28,173,169,0,133,187,32,108,130,32,241,158,32,129,159,32,145,148,32,56,146,169,0,133,46,201,2,176,22,164,46,165,46,153,24,5,164,46,169,0,153,27,5,165,46,24,105,1,76,45,173,169,2,141,26,5,32,127,130,169,3,133,46,165,46,72,56,233,1,133,46,104,170,240,26,169,123,162,5,24,101,46,144,1,232,133,218,134,219,164,46,185,117,5,160,0,145,218,76,85,173,169,4,133,83,165,138,166,139,32,78,178,32,63,178,133,146,165,140,166,141,32,78,178,32,63,178,133,147,32,123,152,32,22,149,32,37,161,165,185,240,3,32,75,148,165,83,32,61,131,32,225,167,32,74,131,32,231,142,169,4,133,83,76,195,142,172,50,3,185,24,230,32,4,135,32,231,142,169,32,32,118,179,169,56,162,3,32,224,132,169,99,141,41,3,169,1,133,187,141,41,5,169,0,32,94,130,32,127,130,169,0,133,83,169,50,133,75,173,40,3,205,41,3,240,9,32,14,173,173,40,3,141,41,3,32,225,167,165,83,32,61,131,32,74,131,32,231,142,169,4,133,83,32,116,142,165,45,41,1,133,152,165,45,41,2,133,153,173,53,3,240,3,76,150,176,165,75,240,8,165,75,56,233,1,76,56,174,169,50,133,75,173,38,3,73,1,141,38,3,173,39,3,24,105,1,141,39,3,165,146,201,4,208,26,166,143,224,128,144,20,173,40,3,56,233,1,141,40,3,162,61,169,0,133,138,134,139,76,243,174,165,146,201,244,208,34,165,142,201,1,165,143,233,0,112,2,73,128,16,20,173,40,3,24,105,1,141,40,3,162,1,169,0,133,138,134,139,76,243,174,165,147,208,57,166,145,224,128,144,51,173,40,3,197,188,144,44,165,188,73,255,56,109,40,3,141,40,3,162,48,169,0,133,140,134,141,165,144,201,1,165,145,233,255,112,2,73,128,16,46,162,255,169,0,133,144,134,145,76,243,174,165,147,201,192,144,29,165,144,201,1,165,145,233,0,112,2,73,128,16,15,165,188,24,109,40,3,141,40,3,169,0,133,140,133,141,165,176,240,3,32,123,149,173,51,3,240,3,76,185,176,173,40,3,205,41,3,240,9,32,14,173,173,40,3,141,41,3,173,47,3,141,52,3,173,40,3,208,34,165,173,201,20,176,28,32,181,178,169,120,160,2,145,210,169,119,136,145,210,165,83,136,145,210,169,148,162,223,32,245,130,133,83,173,39,3,41,3,208,55,173,232,6,133,68,173,231,6,141,232,6,173,230,6,141,231,6,165,68,141,230,6,169,13,32,118,179,173,230,6,32,63,130,169,14,32,118,179,173,231,6,32,63,130,169,15,32,118,179,173,232,6,32,63,130,173,52,3,240,11,32,198,134,169,50,32,139,133,76,185,176,165,160,240,13,165,161,56,233,1,133,161,165,161,208,2,133,160,165,185,208,3,76,64,176,32,207,178,162,0,165,146,24,105,4,144,1,232,160,6,145,210,200,138,145,210,162,0,165,147,24,105,8,144,1,232,160,4,145,210,200,138,145,210,165,183,160,2,145,210,200,169,0,145,210,165,184,160,0,145,210,200,169,0,145,210,32,16,141,170,240,87,169,0,133,68,165,185,201,1,240,15,201,2,240,21,201,3,240,27,201,4,240,28,76,40,176,165,173,24,105,1,133,173,76,36,176,165,179,24,105,1,133,179,76,36,176,230,174,76,38,176,173,47,3,24,105,1,141,47,3,169,2,133,68,165,68,240,20,165,68,32,118,179,169,1,32,90,132,169,0,133,185,172,40,3,153,42,5,32,123,152,32,22,149,32,59,151,32,37,161,165,185,240,3,32,75,148,173,49,3,240,62,173,49,3,56,233,1,141,49,3,32,181,178,165,146,160,2,145,210,165,147,24,105,232,72,169,0,105,255,104,24,105,48,56,233,12,176,1,56,233,16,176,1,56,233,1,136,145,210,165,83,136,145,210,169,131,162,223,32,245,130,133,83,165,45,41,8,208,3,76,240,173,173,53,3,73,1,141,53,3,169,4,56,237,53,3,32,94,130,173,53,3,32,113,135,76,240,173,169,4,141,41,5,32,198,134,32,165,142,169,0,32,118,179,170,32,224,132,32,108,130,76,171,130,169,1,32,214,131,169,0,32,230,131,32,108,130,169,1,141,37,3,32,125,170,32,136,179,169,12,32,163,131,32,227,168,173,37,3,240,37,169,0,133,68,32,194,178,169,210,160,2,145,210,200,169,193,145,210,169,22,160,0,145,210,200,169,170,145,210,32,179,168,169,0,141,37,3,141,50,3,169,5,133,174,32,194,178,169,114,160,2,145,210,200,169,193,145,210,169,134,160,0,145,210,200,169,169,145,210,32,179,168,173,50,3,133,68,32,194,178,169,210,160,2,145,210,200,169,193,145,210,169,166,160,0,145,210,200,169,169,145,210,32,179,168,32,40,171,32,188,173,173,51,3,240,31,32,194,178,169,114,160,2,145,210,200,169,193,145,210,169,69,160,0,145,210,200,169,169,145,210,32,179,168,76,232,176,169,1,32,230,131,173,50,3,24,105,3,133,68,32,194,178,169,210,160,2,145,210,200,169,193,145,210,169,166,160,0,145,210,200,169,169,145,210,32,179,168,173,50,3,24,105,1,141,50,3,201,3,240,3,76,36,177,32,194,178,169,114,160,2,145,210,200,169,193,145,210,169,87,160,0,145,210,200,169,169,145,210,32,179,168,76,232,176,162,0,24,160,0,113,210,200,72,138,113,210,170,24,165,210,105,2,133,210,144,2,230,211,104,96,200,72,24,152,101,210,133,210,144,2,230,211,104,96,134,226,10,38,226,10,38,226,166,226,96,134,226,10,38,226,10,38,226,10,38,226,166,226,96,134,226,10,38,226,10,38,226,10,38,226,10,38,226,166,226,96,134,226,224,128,102,226,106,166,226,96,134,226,224,128,102,226,106,224,128,102,226,106,166,226,96,134,226,224,128,102,226,106,224,128,102,226,106,224,128,102,226,106,224,128,102,226,106,166,226,96,224,0,208,6,170,208,3,169,1,96,162,0,138,96,133,218,134,219,108,218,0,160,0,240,7,169,63,162,234,76,0,3,96,169,63,133,218,169,234,133,219,169,0,133,220,169,3,133,221,162,218,169,255,133,226,160,0,232,240,13,177,218,145,220,200,208,246,230,219,230,221,208,240,230,226,208,239,96,165,210,56,233,3,133,210,144,1,96,198,211,96,165,210,56,233,4,133,210,144,1,96,198,211,96,165,210,56,233,8,133,210,144,1,96,198,211,96,162,0,133,212,134,213,160,0,177,210,170,230,210,208,2,230,211,177,210,230,210,208,2,230,211,56,229,213,208,9,228,212,240,4,105,255,9,1,96,80,253,73,255,9,1,96,160,1,177,210,170,136,177,210,230,210,240,5,230,210,240,3,96,230,210,230,211,96,160,4,76,254,177,160,8,76,254,177,133,218,134,219,162,0,177,218,16,1,202,96,24,73,255,105,1,72,138,73,255,105,0,170,104,96,162,0,160,0,17,210,133,226,200,138,17,210,170,165,226,76,253,177,160,0,177,210,230,210,240,1,96,230,211,96,72,160,1,177,210,133,213,136,177,210,133,212,104,76,18,179,160,0,177,210,164,210,240,7,198,210,160,0,145,210,96,198,211,198,210,145,210,96,169,0,162,0,72,165,210,56,233,2,133,210,176,2,198,211,160,1,138,145,210,104,136,145,210,96,41,15,133,226,32,10,179,164,226,240,31,192,8,144,17,170,152,233,8,168,138,76,187,179,10,136,16,252,170,169,0,96,134,226,10,38,226,136,208,250,166,226,96,134,226,70,226,106,70,226,106,70,226,106,166,226,96,134,226,70,226,106,70,226,106,70,226,106,70,226,106,166,226,96,72,132,226,160,1,177,210,133,219,136,177,210,133,218,164,226,104,145,218,76,18,179,160,0,145,210,200,72,138,145,210,104,96,162,0,56,73,255,160,0,113,210,200,72,138,73,255,113,210,170,104,76,253,177,152,73,255,56,101,210,133,210,176,2,198,211,96,162,0,133,224,134,225,32,98,179,32,64,180,165,212,166,213,96,169,0,133,219,160,16,166,213,240,31,6,212,38,213,42,38,219,72,197,224,165,219,229,225,144,8,133,219,104,229,224,72,230,212,104,136,208,228,133,218,96,6,212,38,213,42,176,4,197,224,144,4,229,224,230,212,136,208,238,133,218,96,162,0,133,224,134,225,32,98,179,32,64,180,165,218,166,219,96,2,176,180,229,180,48,181,163,182,22,184,165,185,17,187,51,1,0,1,66,187,38,188,223,188,200,189,202,190,51,1,0,1,48,241,180,232,180,232,180,0,48,235,180,232,180,36,181,0,48,244,180,232,180,232,180,0,48,253,180,26,181,232,180,0,48,0,181,30,181,232,180,0,48,15,181,232,180,232,180,0,48,10,181,232,180,232,180,0,192,0,0,193,195,199,201,0,3,206,0,0,202,7,199,5,202,7,202,0,6,200,0,0,205,203,201,200,197,195,193,192,0,7,199,194,192,0,2,204,202,200,198,196,195,194,193,192,0,8,204,192,0,1,199,195,192,189,0,2,192,14,191,190,189,188,189,190,191,192,0,2,251,4,132,52,133,52,133,53,53,56,133,56,133,57,56,129,58,133,58,133,59,59,56,133,56,133,49,48,129,52,133,52,133,53,53,56,133,56,133,57,56,129,62,133,62,133,63,63,58,133,58,133,53,52,129,130,58,133,62,149,62,157,58,133,62,141,68,141,62,141,59,66,129,62,149,58,149,56,141,134,52,133,48,133,56,133,52,165,130,52,149,48,165,191,132,56,149,58,149,62,141,66,141,62,133,67,71,66,133,62,133,66,133,70,133,130,76,149,66,141,66,133,82,141,80,173,76,133,80,133,82,149,80,149,76,141,72,133,76,141,76,165,76,149,66,141,66,133,82,141,255,6,172,181,80,189,82,141,80,141,76,141,80,141,255,8,190,181,255,6,172,181,255,6,178,181,255,6,184,181,255,8,190,181,255,6,172,181,80,189,134,68,133,66,133,62,133,58,133,62,133,66,133,68,133,66,133,130,66,149,66,133,70,141,72,141,143,66,141,70,141,72,141,70,149,70,133,72,141,76,141,143,70,141,72,141,76,141,66,149,66,133,70,141,72,141,255,7,8,182,255,8,15,182,255,7,23,182,52,149,66,149,58,141,135,56,149,58,141,62,141,134,76,133,76,133,76,133,80,133,80,133,80,133,82,133,82,133,82,133,86,133,86,133,86,133,82,133,82,133,80,133,80,133,130,52,149,66,149,58,141,255,7,56,182,132,66,133,66,133,66,133,70,133,70,133,70,133,72,133,72,133,72,133,76,133,76,133,76,133,70,133,70,133,72,133,72,133,66,133,66,133,66,133,70,133,70,133,70,133,72,133,72,133,255,16,124,182,253,50,181,134,62,133,62,133,63,63,66,133,66,133,67,66,129,68,133,68,133,69,69,66,133,66,133,59,58,129,62,133,62,133,63,63,66,133,66,133,67,66,129,72,133,72,133,73,73,68,133,68,133,63,62,129,132,62,149,66,133,68,149,72,133,135,68,141,66,141,68,141,59,66,129,255,6,121,181,52,133,48,141,52,141,56,141,53,56,129,52,149,48,157,134,62,133,66,133,66,133,68,133,68,133,72,133,72,133,68,133,72,133,80,133,80,133,0,133,82,133,82,133,0,133,86,133,86,133,90,133,90,133,86,133,91,95,90,133,86,133,90,133,94,133,132,76,149,66,141,66,133,82,141,255,6,172,181,255,6,178,181,255,6,184,181,255,8,190,181,255,6,172,181,80,189,255,8,204,181,255,8,190,181,255,6,172,181,255,6,178,181,255,6,184,181,255,8,190,181,255,6,172,181,80,189,82,133,80,133,76,133,72,133,76,133,80,133,82,133,80,133,76,133,66,133,80,133,82,133,80,133,76,133,72,133,76,133,255,16,126,183,80,133,70,133,84,133,86,133,84,133,80,133,76,133,80,133,255,16,146,183,255,16,126,183,255,16,126,183,255,16,146,183,255,16,146,183,76,149,90,133,86,133,82,133,76,133,82,133,135,76,141,82,141,134,83,87,82,141,130,76,149,72,149,80,141,135,82,149,90,141,82,141,132,52,149,66,133,62,133,58,133,52,133,58,133,255,7,56,182,255,16,63,182,82,133,86,133,86,133,86,133,80,133,80,133,82,133,82,133,76,133,76,133,76,133,80,133,80,133,80,133,82,133,82,133,255,16,239,183,253,163,182,128,39,39,39,39,39,39,39,39,39,39,63,52,129,45,45,45,45,45,45,45,45,45,45,69,58,129,43,43,43,43,43,43,43,43,43,43,67,56,129,35,35,35,35,35,35,35,35,35,35,59,48,129,38,133,38,133,40,133,38,133,38,133,38,133,38,133,40,133,34,133,34,133,34,133,38,133,40,133,34,133,34,133,34,133,255,16,75,184,34,133,34,133,34,133,44,133,40,133,38,133,34,133,38,133,255,16,75,184,255,16,91,184,255,16,75,184,255,16,111,184,52,133,52,133,76,133,52,133,52,133,76,133,52,133,77,52,129,66,133,66,133,90,133,66,133,66,133,90,133,66,133,91,66,129,62,133,62,133,86,133,62,133,62,133,86,133,62,133,87,62,129,58,133,58,133,82,133,58,133,58,133,82,133,58,133,83,58,129,255,17,143,184,255,17,160,184,255,17,177,184,255,17,194,184,255,17,143,184,255,17,160,184,255,17,177,184,255,17,194,184,255,17,143,184,255,17,160,184,255,17,177,184,255,17,194,184,42,149,46,149,48,141,135,42,149,46,141,48,141,46,149,48,149,52,141,135,46,149,48,141,52,141,255,6,3,185,255,7,9,185,255,6,16,185,255,7,22,185,38,133,38,133,38,133,38,133,38,133,38,133,38,133,63,52,129,44,133,44,133,44,133,44,133,44,133,44,133,44,133,69,58,129,42,133,42,133,42,133,42,133,42,133,42,133,67,57,34,133,34,133,34,133,34,133,34,133,34,133,34,133,34,133,59,48,129,255,17,45,185,255,17,62,185,255,16,79,185,255,17,95,185,57,59,63,67,71,73,67,71,57,59,63,67,71,73,67,70,129,81,83,87,91,95,97,91,95,105,107,111,115,119,121,115,118,129,253,22,184,175,175,175,136,33,33,33,33,138,33,33,136,33,33,138,33,33,136,33,32,129,138,33,140,27,138,33,140,27,136,33,140,27,138,33,140,27,138,33,140,27,31,27,136,33,140,27,138,33,140,26,129,138,33,140,27,31,27,136,33,140,27,138,33,140,27,31,27,138,33,140,27,136,33,140,27,138,33,140,26,129,255,17,186,185,255,17,217,185,255,17,186,185,255,17,217,185,255,17,186,185,136,33,33,33,33,138,33,33,136,33,33,138,33,33,136,33,33,33,33,138,33,32,129,33,140,27,138,33,140,27,136,33,140,27,138,33,140,27,138,33,140,27,31,27,136,33,140,27,138,33,140,26,129,255,17,217,185,255,17,186,185,255,17,217,185,255,17,186,185,255,17,217,185,255,17,186,185,255,17,10,186,255,17,33,186,255,17,217,185,255,17,186,185,255,17,217,185,255,17,186,185,255,17,217,185,255,17,186,185,255,17,10,186,32,133,140,26,133,138,32,133,140,26,133,136,32,133,140,26,133,138,32,133,140,26,133,138,32,133,140,26,133,30,133,26,133,136,32,133,138,32,133,32,133,140,26,133,138,32,133,140,26,133,138,32,133,140,26,133,136,32,133,140,26,133,138,32,133,140,26,133,255,16,146,186,255,16,167,186,255,16,146,186,255,16,167,186,138,32,133,140,26,133,138,32,133,32,133,136,33,33,33,33,138,33,33,136,33,32,129,255,17,186,185,255,17,217,185,255,17,186,185,255,17,217,185,255,17,186,185,255,17,217,185,255,17,186,185,255,17,10,186,255,17,10,186,255,17,10,186,253,165,185,175,175,175,175,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,253,17,187,251,3,132,26,133,50,133,50,133,26,133,60,133,58,133,50,133,54,133,30,133,50,133,30,133,46,133,56,133,50,133,46,133,50,133,46,133,0,133,46,133,0,133,46,133,46,133,0,133,46,133,50,133,0,133,50,133,50,133,52,133,50,133,22,133,40,133,26,133,50,133,50,133,26,133,60,133,58,133,50,133,54,133,255,16,85,187,255,16,101,187,255,16,117,187,130,74,157,70,141,70,133,70,133,74,141,74,133,70,149,70,133,70,133,132,80,149,74,149,70,141,135,74,149,74,141,80,141,255,8,161,187,255,10,170,187,255,6,180,187,255,7,187,187,134,50,133,56,133,60,133,64,133,50,133,56,133,60,133,64,133,46,133,56,133,60,133,64,133,46,133,56,133,60,133,64,133,42,133,56,133,60,133,64,133,42,133,56,133,60,133,64,133,255,16,227,187,50,133,56,133,60,133,64,133,50,133,56,133,60,133,64,133,255,16,227,187,255,16,243,187,255,16,227,187,253,68,187,134,50,133,74,133,74,133,50,133,84,133,82,133,74,133,78,133,78,133,74,133,78,133,70,133,80,133,74,133,70,133,74,133,80,141,74,133,74,133,70,133,74,141,74,133,80,133,84,141,88,141,80,133,80,133,74,133,50,133,74,133,74,133,50,133,84,133,82,133,74,133,78,133,255,16,55,188,255,12,71,188,255,12,83,188,132,74,173,70,141,74,149,70,149,70,141,130,56,149,50,149,46,141,135,50,149,50,141,56,141,255,4,123,188,255,6,128,188,255,6,134,188,255,7,141,188,132,88,173,74,133,80,133,135,74,165,74,133,80,133,143,84,173,94,141,84,141,80,133,84,149,88,173,74,133,80,133,255,7,171,188,143,84,133,80,165,88,133,84,133,80,133,88,133,84,133,80,133,88,133,84,133,253,38,188,128,50,133,50,133,50,133,46,133,50,133,46,133,0,133,50,133,0,133,50,133,50,133,46,133,56,133,50,133,46,133,50,133,56,133,0,133,56,133,0,133,56,133,56,133,56,133,57,56,129,60,133,60,133,60,133,60,133,62,133,60,133,56,133,50,133,50,133,50,133,50,133,46,133,50,133,46,133,0,133,50,133,255,16,240,188,255,17,0,189,255,16,17,189,50,133,50,133,74,133,50,133,50,133,74,133,50,133,75,74,129,56,133,56,133,80,133,56,133,56,133,80,133,56,133,81,80,129,60,133,60,133,84,133,60,133,60,133,84,133,60,133,85,84,129,66,133,66,133,90,133,66,133,66,133,90,133,66,133,91,90,129,255,17,61,189,255,17,78,189,255,17,95,189,255,17,112,189,255,17,61,189,255,17,78,189,255,17,95,189,255,17,112,189,255,17,61,189,255,17,78,189,255,17,95,189,66,133,66,133,90,133,66,133,118,116,114,112,110,108,106,104,102,100,98,96,94,92,90,88,253,223,188,255,17,186,185,138,33,140,27,31,27,136,33,140,27,138,33,140,27,31,27,138,33,140,27,136,33,138,33,33,26,129,255,17,33,186,138,33,140,27,31,27,136,33,140,27,138,33,140,27,136,33,33,3,3,31,31,33,32,129,255,17,186,185,255,17,204,189,255,17,33,186,255,17,235,189,138,33,140,27,138,33,33,136,33,140,27,138,33,140,27,31,138,33,33,140,27,136,33,140,27,31,136,32,129,138,33,140,27,138,33,33,136,33,140,27,138,33,140,27,31,138,33,33,140,27,136,33,140,27,136,33,32,129,255,17,19,190,138,33,140,27,138,33,33,136,33,140,27,138,33,140,27,136,33,33,3,3,31,31,33,32,129,255,17,19,190,255,17,48,190,255,17,19,190,255,17,81,190,255,17,19,190,255,17,48,190,255,17,19,190,255,17,81,190,255,17,19,190,255,17,48,190,138,33,140,27,138,33,33,136,33,140,27,138,33,140,27,136,33,33,33,33,138,33,33,136,33,140,26,129,138,33,140,27,136,33,140,27,138,33,33,136,33,140,27,136,33,33,3,3,31,31,33,32,129,253,200,189,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,191,253,202,190,233,190,233,190,13,191,32,191,75,191,97,191,200,191,228,191,250,191,3,192,54,192,100,192,136,192,172,192,197,192,234,192,4,193,41,193,82,193,99,193,128,63,129,213,130,0,3,129,106,3,128,50,129,213,3,129,106,3,0,137,63,138,134,1,138,138,1,138,134,1,138,138,1,137,52,138,134,1,138,138,1,138,134,1,138,138,1,137,50,138,134,1,138,128,1,138,134,1,138,128,1,0,128,63,129,63,130,0,2,129,31,2,128,48,4,128,50,129,63,2,129,31,2,0,128,125,129,243,130,0,131,122,132,253,133,0,1,128,121,1,129,233,2,129,223,2,129,213,131,48,2,129,203,2,129,193,2,128,117,129,243,131,116,1,128,115,1,129,233,2,129,223,2,129,213,131,48,2,129,203,2,129,193,2,128,113,129,243,131,114,2,129,233,2,129,223,2,129,213,131,48,2,129,203,2,129,193,2,129,243,2,129,233,2,129,223,2,129,213,2,129,203,2,129,193,2,0,134,129,135,142,136,0,1,135,58,136,2,2,134,0,3,134,129,135,142,136,0,1,135,58,136,2,1,0,137,52,138,0,1,137,48,1,137,58,138,1,1,137,48,1,137,52,138,3,1,0,137,56,138,6,1,138,3,1,0,128,61,129,161,130,1,1,128,57,1,129,151,2,129,141,2,128,61,129,203,130,0,1,128,57,1,129,193,2,129,183,2,129,173,2,129,163,2,129,153,2,129,143,2,129,133,2,129,123,2,0,128,191,129,106,130,0,1,129,100,1,129,94,1,129,89,1,128,186,129,84,1,129,79,1,129,75,1,129,70,1,128,184,129,66,1,129,63,1,128,182,129,59,1,129,56,0,128,63,129,106,130,0,1,129,70,1,129,35,1,128,58,129,52,1,129,106,1,128,56,129,70,1,128,54,129,35,1,128,52,129,52,0,128,63,129,213,130,0,1,129,142,1,129,70,1,128,58,129,106,1,129,213,1,128,56,129,142,1,128,54,129,70,1,128,52,129,106,0,128,191,129,249,130,2,3,128,190,129,86,130,3,3,128,186,129,248,3,128,180,129,86,3,0,128,63,129,126,130,0,4,128,127,129,123,1,129,120,2,129,122,1,128,48,4,128,58,129,126,4,128,116,129,123,1,129,120,2,129,122,0,137,58,138,11,3,138,9,3,137,48,3,137,63,138,12,3,137,56,4,137,52,4,137,50,2,0,137,58,138,14,1,138,1,2,138,15,1,138,11,1,138,9,1,137,63,138,6,1,138,5,1,138,6,1,138,9,1,138,12,1,138,15,0,137,60,138,13,1,138,14,1,138,15,1,138,0,1,138,1,1,138,2,5,138,1,1,138,0,1,138,15,1,138,14,1,138,12,2,138,11,1,138,10,0,137,63,138,4,6,138,6,6,137,53,138,4,6,138,6,6,0,137,63,138,12,6,137,56,8,137,52,8,137,50,8,0,15,18,40,61,15,2,19,52,15,5,26,41,15,15,15,0,15,12,21,55,15,12,34,57,15,12,39,52,15,12,27,58,15,19,39,61,15,8,24,41,15,7,10,25,15,15,15,0,15,22,39,61,15,7,23,39,15,8,10,27,15,15,15,0,61,61,45,15,61,61,45,15,61,61,45,15,61,61,45,15,61,45,15,15,61,45,15,15,61,45,15,15,61,45,15,15,15,12,39,56,15,21,39,56,15,12,21,28,15,1,39,57,0,8,8,8,0,8,4,1,8,8,8,4,4,8,4,10,0,8,8,8,0,8,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,162,21,224,0,194,21,224,226,21,192,226,2,21,160,1,221,1,192,1,253,1,160,1,221,8,28,160,1,221,225,1,12,253,157,33,3,253,157,33,35,93,39,221,33,5,226,2,21,61,33,224,224,224,224,224,32,1,224,224,32,1,160,4,1,192,1,160,6,1,199,1,64,4,64,225,1,32,1,6,224,160,1,224,192,1,224,192,1,4,3,68,3,68,3,4,96,1,237,77,64,13,64,9,4,64,4,41,4,192,10,13,68,13,9,10,13,224,10,5,98,21,10,224,5,162,21,192,5,226,21,128,5,226,34,21,64,5,226,98,21,32,225,161,32,28,157,33,157,28,64,28,157,33,61,60,128,189,1,29,28,100,65,157,33,173,224,224,224,224,224,4,128,4,224,0,6,128,6,224,224,160,4,128,4,224,0,6,128,6,224,224,160,4,224,192,6,224,128,4,224,192,13,224,192,224,10,9,10,0,10,9,224,0,35,10,68,10,36,128,5,226,34,96,5,226,66,64,5,226,98,0,4,0,1,5,226,66,0,6,0,1,5,226,66,64,225,129,192,28,29,28,3,157,224,28,35,157,32,6,96,99,157,64,225,93,33,224,192,1,68,224,96,1,34,21,68,224,0,1,130,21,36,192,1,194,21,192,1,162,21,1,160,4,1,162,21,1,128,4,13,225,1,128,13,10,1,157,60,160,10,0,1,29,28,61,28,224,32,1,28,0,60,192,36,32,225,1,64,45,32,1,0,5,226,2,21,61,33,0,13,253,157,1,0,9,253,157,1,4,9,253,157,1,13,9,29,24,25,26,157,24,25,26,29,1,41,29,22,0,23,61,28,61,22,0,23,29,1,41,29,22,0,23,61,0,28,29,22,0,23,29,1,41,29,91,28,29,32,29,91,29,1,41,93,28,0,28,32,60,29,28,29,1,10,9,13,60,64,30,64,28,0,29,1,4,41,13,100,13,132,3,1,13,5,226,98,21,1,1,233,73,64,9,225,97,64,9,1,29,28,32,1,157,1,64,9,1,28,64,1,157,1,64,9,1,96,1,189,64,10,1,96,1,157,28,96,33,32,33,157,1,96,1,0,1,32,1,157,1,96,1,32,1,0,189,1,7,32,13,1,96,60,93,3,1,13,39,10,1,96,1,0,28,29,35,1,9,13,10,0,1,5,226,21,1,9,10,32,65,157,225,1,253,189,33,61,24,25,26,125,24,25,26,61,33,61,22,0,23,125,22,0,23,61,33,61,22,0,23,125,22,0,23,61,1,0,61,91,125,91,61,5,0,253,189,1,0,221,1,189,1,2,21,253,157,33,253,189,33,135,1,93,1,103,225,93,161,9,224,192,9,224,192,9,224,192,9,96,4,224,32,10,96,6,224,32,2,21,224,32,4,64,1,32,12,64,12,96,6,64,1,32,13,0,12,0,13,224,1,32,10,0,13,0,9,224,1,96,9,0,10,160,4,0,1,96,10,224,6,0,1,224,192,64,225,93,33,0,4,0,1,253,125,0,6,0,1,253,125,64,1,253,125,64,1,253,5,66,32,4,1,253,125,32,6,1,29,12,253,61,64,65,253,61,64,65,253,61,0,4,0,1,253,125,0,6,0,1,253,61,33,64,1,93,33,93,97,225,64,10,9,32,1,221,1,96,10,32,1,157,35,1,192,1,61,3,29,3,12,11,1,39,128,1,226,2,21,128,1,221,1,192,1,221,1,160,7,1,221,1,128,7,13,1,221,1,96,7,13,9,1,221,1,96,13,9,10,33,189,1,32,39,9,10,0,33,61,33,61,1,32,45,9,32,1,225,225,1,253,221,1,253,221,1,253,221,1,189,1,157,28,61,1,253,125,0,28,29,1,253,29,1,29,28,32,28,1,253,93,96,1,253,61,28,64,33,93,33,157,96,33,93,33,61,28,29,28,96,33,189,28,0,28,128,1,225,97,10,64,253,93,1,96,253,93,129,253,221,1,253,29,33,93,28,1,253,29,33,29,28,29,0,1,28,93,33,93,28,29,28,0,28,0,1,0,60,29,33,29,60,0,28,96,33,32,28,93,224,33,64,28,29,28,224,33,7,12,231,103,225,225,1,193,93,193,253,189,33,253,5,2,21,93,33,253,189,33,93,24,25,26,61,24,25,26,93,33,93,22,0,23,61,22,0,23,93,33,93,22,0,23,61,22,0,23,93,33,5,21,29,91,61,91,93,33,253,189,33,253,157,3,33,93,12,253,29,3,33,93,3,167,5,66,1,1,224,192,1,224,192,1,224,128,7,0,1,224,96,7,13,0,1,224,96,13,9,0,1,0,7,192,7,0,7,41,0,1,0,13,192,13,0,13,9,10,0,1,0,9,7,64,7,36,9,7,9,10,32,1,0,10,13,4,0,4,77,10,13,9,64,1,32,9,13,0,13,10,9,10,0,9,10,64,1,32,42,0,10,0,10,32,10,96,1,224,192,64,1,93,33,93,97,32,4,1,253,125,32,6,33,29,24,25,26,93,24,25,26,29,64,33,29,22,0,23,93,22,0,23,29,64,1,61,22,0,23,93,22,0,23,29,0,4,0,1,61,91,93,91,29,0,6,0,1,61,33,253,64,1,61,33,253,64,1,253,125,32,4,1,253,93,1,32,6,1,231,71,1,64,225,129,1,61,33,61,1,32,10,9,10,32,1,221,1,64,9,64,1,29,39,125,1,64,10,64,1,29,5,21,61,5,66,21,128,1,221,1,192,1,221,1,192,1,221,1,192,1,221,1,192,1,221,1,192,33,189,1,192,33,189,1,192,65,61,97,192,1,1,253,189,65,253,125,28,0,1,29,1,253,61,28,32,1,61,1,221,60,32,33,253,61,96,33,93,60,29,33,29,28,64,65,61,28,32,60,0,28,128,33,61,224,96,33,29,28,224,0,1,32,33,28,224,128,33,192,12,167,97,32,225,65,225,225,253,221,1,253,221,33,61,24,25,26,125,24,25,26,29,5,34,21,29,22,0,23,125,22,0,23,61,33,61,22,0,23,125,22,0,23,61,33,61,91,125,91,61,33,253,189,33,253,189,33,253,189,33,231,167,225,225,1,1,93,5,226,34,33,253,189,33,253,189,33,253,157,12,33,253,61,12,29,12,3,33,125,33,61,225,97,253,61,33,253,189,33,253,189,33,253,157,3,33,253,125,35,33,93,225,97,1,224,192,1,224,192,1,224,192,1,224,192,1,224,192,1,32,4,224,0,12,32,1,32,6,224,0,3,32,1,64,4,192,4,6,32,1,64,6,4,11,4,32,12,4,6,64,1,96,70,36,38,96,1,192,38,160,1,224,192,64,225,129,0,4,0,1,253,125,0,6,0,1,253,125,64,1,61,24,25,26,93,24,25,26,29,64,1,61,22,0,23,93,22,0,23,29,32,4,1,61,22,0,33,61,22,0,23,29,32,6,1,61,59,33,61,91,29,64,1,253,125,64,1,12,253,93,0,4,0,1,3,253,93,0,6,0,1,3,253,61,3,64,129,125,97,33,61,97,167,0,1,189,5,162,21,0,1,253,93,28,64,1,93,1,221,96,1,253,61,28,96,1,253,29,28,128,1,157,5,66,21,128,1,221,1,160,33,61,12,125,1,160,33,29,12,35,93,1,192,1,11,3,12,67,29,1,192,225,1,192,1,65,32,225,97,96,1,224,32,1,96,1,224,32,1,64,1,224,64,1,12,224,0,5,98,1,3,160,4,192,1,3,96,36,13,192,1,3,11,32,4,45,9,4,128,4,1,35,36,13,73,13,4,32,36,13,1,3,77,41,10,41,13,36,45,9,45,41,10,9,10,0,42,9,45,105,42,9,0,10,96,10,9,42,9,10,225,225,224,192,1,32,11,64,3,224,1,32,35,7,67,7,128,3,1,226,194,21,224,192,1,224,192,1,100,224,96,109,68,224,1,10,73,77,36,96,36,1,0,10,9,10,9,10,9,45,100,77,32,10,0,10,0,10,41,109,9,10,9,1,93,225,129,253,189,97,125,24,25,26,157,33,61,1,93,22,0,23,157,33,189,22,0,23,157,33,125,12,29,91,157,33,125,11,189,12,61,1,15,125,12,3,29,11,61,12,11,12,29,15,65,29,35,12,3,12,29,67,161,237,237,169,106,137,202,96,42,9,13,224,192,9,224,192,9,224,192,9,224,192,9,224,192,9,128,36,224,10,96,4,45,36,160,4,96,13,41,45,4,0,4,64,13,64,4,9,10,9,10,9,13,4,13,64,9,4,0,4,13,9,0,10,0,10,9,13,9,68,10,13,4,13,9,10,96,41,10,77,0,9,13,42,128,10,9,0,41,10,64,129,125,97,32,4,32,1,28,125,60,29,28,1,32,6,32,1,0,28,29,60,32,28,0,1,128,1,32,28,160,1,128,15,128,5,98,64,5,66,21,224,128,1,224,128,4,12,1,36,224,32,4,141,224,36,13,9,10,73,224,45,41,0,10,41,11,100,3,36,9,10,9,10,32,10,9,237,225,192,33,189,28,192,33,3,157,224,33,35,61,3,28,224,1,226,66,21,64,1,224,192,1,192,12,160,4,1,192,1,64,3,0,4,13,1,160,12,1,0,36,3,4,13,9,1,32,36,3,4,3,1,4,109,41,1,36,205,9,10,73,10,1,45,41,42,73,10,0,42,9,0,1,18,194,68,194,119,194,183,194,222,194,28,195,93,195,200,195,34,196,103,196,169,196,233,196,55,197,115,197,182,197,254,197,90,198,175,198,241,198,49,199,109,199,157,199,217,199,47,200,113,200,198,200,5,201,74,201,154,201,232,201,28,69,26,112,26,127,4,135,129,1,0,16,16,0,0,16,16,0,1,25,105,1,1,91,27,1,2,17,180,2,2,18,82,1,3,154,190,1,0,16,16,0,1,163,52,2,2,182,39,2,3,173,41,2,1,19,67,1,0,16,16,0,0,16,16,0,0,16,16,0,0,16,16,0,0,16,16,0,0,16,16,0,0,16,16,0,0,16,16,0,3,116,180,1,0,16,16,0,0,16,16,0,4,65,78,2,1,164,84,1,1,189,92,2,2,164,52,1,2,70,150,1,2,58,171,2,1,38,184,2,1,185,43,2,0,16,16,0,1,35,67,1,0,16,16,0,0,16,16,0,3,41,136,1,0,16,16,0,0,16,16,0,2,39,167,2,3,146,50,2,0,16,16,0,4,110,97,2,0,16,16,0,0,16,16,0,2,73,136,1,4,165,85,1,0,69,69,0,4,174,164,2,1,103,102,1,2,53,149,1,0,16,16,0,0,16,16,0,0,16,16,0,2,76,140,2,1,94,84,2,0,16,16,0,4,77,173,1,4,129,142,2,0,16,16,0,4,62,49,2,4,129,142,1,2,188,181,2,3,133,140,2,3,93,83,2,0,16,16,0,3,36,191,2,0,16,16,0,0,16,16,0,2,54,102,1,1,55,104,2,3,62,200,2,1,34,114,1,2,42,154,1,0,16,16,0,3,77,73,2,1,188,185,2,1,100,148,2,3,37,85,1,3,43,123,2,0,16,16,0,0,16,16,0,0,16,16,0,0,16,16,0,1,44,76,1,2,185,188,1,3,109,173,2,1,70,75,2,3,103,191,2,0,16,16,0,1,40,1,42,1,67,1,56,2,38,1,71,4,152,2,97,1,120,1,81,3,101,1,38,1,81,1,42,1,158,1,137,0,16,1,53,0,16,2,62,1,97,1,168,1,36,1,126,0,16,1,62,3,108,1,140,2,78,1,33,1,128,6,226,2,1,160,1,253,1,160,1,253,1,96,5,226,34,1,160,1,221,33,160,1,221,33,0,4,96,28,8,125,30,29,33,0,14,64,5,226,33,160,1,61,28,0,28,61,5,1,160,1,60,96,60,1,32,4,64,15,224,1,32,14,0,5,226,34,226,66,6,106,253,61,1,128,253,61,1,128,2,21,61,24,25,26,93,1,128,1,93,22,0,23,93,1,4,96,1,93,22,0,23,93,1,6,96,1,28,61,91,93,1,128,1,135,29,28,29,28,1,32,4,32,162,21,0,28,0,1,32,6,96,60,128,9,1,224,128,9,10,1,4,64,4,226,34,21,6,64,6,106,41,234,42,96,10,9,192,4,192,10,192,6,224,224,224,224,224,64,6,224,224,224,224,32,4,160,7,224,6,160,10,224,96,4,96,4,64,4,128,4,6,96,6,64,6,128,13,234,10,9,138,9,64,4,64,61,10,157,10,64,6,64,253,10,192,9,28,29,10,9,42,41,96,4,32,10,0,28,0,10,64,9,96,14,32,9,192,10,192,42,100,32,10,160,4,41,10,9,10,9,32,10,128,4,13,10,61,10,29,10,0,4,10,96,4,13,41,157,0,10,9,100,13,73,13,93,28,32,10,109,73,10,9,109,32,10,1,96,5,226,34,1,128,28,253,29,1,160,28,253,1,64,65,0,29,5,2,21,93,33,96,1,32,221,33,4,64,1,32,28,189,33,14,64,65,0,189,33,96,1,64,189,33,96,1,64,189,33,96,1,64,29,14,125,33,96,1,64,61,103,33,96,1,64,5,162,226,34,21,6,64,6,253,61,1,128,253,61,1,128,1,93,5,130,21,128,1,93,24,25,26,93,1,128,1,93,22,0,23,93,1,128,1,93,22,0,23,93,1,103,0,1,61,5,226,34,21,0,1,253,29,1,128,1,253,29,1,128,1,157,39,61,1,128,226,21,29,1,128,6,96,6,64,6,64,4,0,9,224,64,4,0,6,4,9,224,64,14,0,9,6,9,224,128,9,10,9,224,128,10,0,9,192,4,192,9,192,6,160,10,9,224,192,9,32,10,224,4,64,10,224,64,6,64,9,32,4,160,4,96,4,10,32,14,160,14,96,14,10,73,170,9,10,9,10,61,10,9,10,221,10,29,9,93,41,61,24,25,26,157,10,61,41,10,61,22,0,23,42,93,9,93,41,61,22,0,23,157,10,6,61,41,61,91,157,9,10,61,42,29,238,14,9,61,10,41,157,24,25,26,61,10,93,10,9,157,22,0,23,189,0,9,157,22,0,23,125,9,29,0,9,157,91,93,9,10,13,10,9,45,61,237,13,10,9,1,96,1,93,5,162,1,96,1,253,61,1,96,33,28,253,1,96,1,32,28,29,60,125,1,96,1,64,28,32,125,1,96,1,32,3,64,28,93,1,96,1,0,35,39,32,28,61,1,96,18,226,34,128,1,61,28,29,28,157,36,64,1,28,29,0,28,0,28,125,38,64,1,0,28,96,60,61,1,96,1,32,5,194,226,21,29,1,128,253,61,1,128,253,61,1,128,125,18,2,21,93,1,128,157,1,125,1,128,61,3,61,1,93,18,1,128,29,35,61,1,125,1,128,162,21,93,1,128,253,61,1,128,253,29,3,1,128,157,28,61,35,1,32,4,32,226,34,1,32,14,32,32,14,160,14,96,14,10,160,4,160,4,0,9,160,6,160,14,0,10,64,4,224,32,41,64,6,224,32,41,192,4,160,41,192,6,160,9,10,224,0,4,0,4,32,10,9,224,0,6,0,14,64,10,224,192,9,160,4,64,4,64,4,10,160,14,64,14,64,14,10,10,9,10,61,42,9,138,41,74,157,10,125,10,9,10,41,157,28,0,29,28,125,10,9,10,61,10,29,28,32,28,0,28,125,10,9,29,28,29,10,7,128,60,61,9,10,29,0,28,0,10,9,10,9,7,64,28,29,10,9,28,96,10,0,10,64,10,7,9,42,7,224,64,9,0,41,13,7,224,96,74,13,7,224,64,73,10,13,228,32,4,42,41,10,237,32,13,10,1,96,1,32,5,194,1,96,1,36,1,221,1,96,1,6,14,1,221,1,96,1,0,28,0,60,157,1,96,1,7,100,157,1,96,1,14,6,14,6,14,28,61,14,29,1,224,64,60,61,1,224,128,28,29,1,224,64,68,28,1,64,4,192,14,6,14,6,1,64,13,4,128,36,32,4,1,96,13,135,45,32,13,226,34,1,128,253,61,1,128,189,24,25,61,1,128,29,5,34,21,29,22,0,23,29,1,128,61,1,93,22,0,23,29,1,128,61,5,194,21,128,157,28,29,60,29,1,128,125,28,0,28,32,29,1,128,61,3,28,132,28,1,128,78,6,14,6,14,6,14,6,14,128,228,68,0,100,237,77,0,109,160,14,64,14,64,14,9,224,192,10,224,4,128,13,9,224,14,128,9,10,32,4,32,4,224,9,10,32,6,32,6,224,0,9,224,160,13,10,64,4,160,4,64,42,64,6,160,6,96,9,224,192,9,100,224,64,9,109,224,64,10,74,9,42,9,138,61,10,73,29,10,61,10,253,41,10,28,29,28,253,9,29,9,10,32,28,0,28,221,10,9,42,128,221,10,29,9,10,128,28,29,24,25,26,29,24,25,26,9,10,160,29,22,0,23,29,22,0,23,42,160,29,22,0,23,29,22,0,23,42,160,29,91,29,91,9,10,160,221,13,42,13,128,29,135,13,9,10,9,10,13,64,205,41,10,1,96,201,10,32,9,1,96,10,9,10,9,10,41,64,33,128,10,0,9,0,10,9,32,5,33,192,9,32,10,64,33,192,10,160,33,224,160,33,224,160,33,224,160,33,224,160,33,224,160,33,160,231,33,96,5,226,34,105,10,9,42,9,42,0,41,10,0,1,10,9,10,0,10,32,10,32,4,9,10,32,1,0,10,64,132,6,10,64,1,128,14,38,14,6,128,1,68,224,96,1,14,6,14,224,96,1,224,192,1,32,132,224,1,32,14,6,14,6,14,224,1,224,192,1,199,224,226,34,21,32,5,34,0,10,41,224,64,10,32,10,9,224,64,9,64,10,6,4,224,0,10,128,6,96,4,96,10,224,32,6,96,9,224,160,13,9,224,160,42,96,4,96,4,128,10,96,6,96,6,64,7,13,9,224,96,7,13,41,224,96,13,73,34,21,192,45,10,73,74,93,10,9,202,9,10,9,157,10,189,42,13,10,61,10,253,61,10,9,125,10,93,13,157,41,29,24,25,26,29,10,45,10,13,10,93,41,29,22,0,23,61,42,29,10,29,10,61,42,29,22,0,23,253,61,10,13,29,91,125,13,125,10,41,221,42,13,10,29,28,32,9,7,253,10,29,28,64,9,13,39,221,28,0,7,45,42,205,61,77,42,1,96,5,226,34,1,224,192,1,224,192,1,192,12,64,75,0,1,160,12,11,71,76,0,1,96,5,226,34,1,11,224,160,34,21,224,32,36,224,36,64,4,45,228,45,68,13,9,10,237,41,77,9,74,9,10,169,10,41,42,64,226,34,21,32,9,42,224,128,9,61,32,11,224,0,10,93,32,12,11,96,11,32,5,2,93,32,11,12,71,11,12,96,10,226,98,21,224,128,4,224,160,4,13,4,160,36,64,36,13,9,13,36,0,36,0,45,68,45,73,45,4,45,4,41,77,9,42,105,13,41,13,42,9,10,9,10,32,10,9,10,41,10,41,10,41,160,4,10,9,106,29,10,9,128,4,13,29,10,189,10,128,13,157,45,61,15,128,9,221,66,21,96,10,221,192,4,10,7,125,10,13,160,4,13,29,10,9,7,13,10,61,160,13,93,74,93,160,9,253,29,68,71,9,253,29,173,9,45,221,9,10,41,10,9,42,9,205,138,73,10,61,73,42,157,74,189,9,10,45,10,221,13,125,10,29,10,29,10,189,10,9,10,13,10,9,125,10,13,10,13,7,74,29,10,29,9,10,13,10,61,10,29,10,13,189,9,29,10,29,13,125,10,189,9,125,10,157,7,9,93,9,157,13,42,45,9,125,9,157,10,61,10,29,10,93,13,10,253,125,7,13,41,237,173,42,25,204,94,204,177,204,225,204,58,205,128,205,201,205,15,206,111,206,195,206,7,207,77,207,175,207,2,208,81,208,142,208,236,208,38,209,113,209,179,209,15,210,76,210,159,210,233,210,0,167,22,50,0,78,75,1,0,76,75,1,0,184,191,2,0,130,135,2,0,139,141,1,4,66,130,1,2,44,140,1,0,59,75,0,0,91,27,1,2,57,121,1,1,94,158,1,0,154,187,1,2,59,57,1,0,190,186,2,0,179,51,1,2,57,52,2,2,121,113,2,0,59,187,1,3,91,155,1,2,66,130,1,0,177,183,2,3,113,177,2,2,35,101,2,1,42,104,2,2,123,126,1,0,121,126,2,1,190,185,4,2,40,184,2,0,39,119,2,1,116,113,1,2,70,182,2,1,73,139,2,0,104,103,1,2,181,186,2,4,187,123,1,1,140,135,2,2,187,75,2,0,49,195,1,0,16,16,0,2,89,83,1,0,145,152,2,0,53,73,1,1,138,131,2,0,82,85,2,0,110,174,2,4,60,56,2,4,71,183,1,0,94,158,1,4,166,173,1,4,61,141,1,2,37,181,2,2,53,133,2,1,81,83,1,0,102,118,0,2,137,132,2,3,78,74,2,0,187,186,1,1,50,163,2,0,146,145,0,0,139,136,1,0,58,57,0,2,171,165,1,4,36,164,1,0,34,89,2,2,157,146,2,0,16,16,0,0,109,61,1,2,190,185,2,0,103,55,1,2,187,178,2,1,133,137,2,2,73,68,2,4,109,1,49,1,89,2,62,1,154,1,185,1,103,1,55,1,88,2,189,1,103,1,82,1,164,1,86,1,85,1,158,1,46,1,56,1,53,1,115,3,162,1,77,1,167,1,62,64,141,225,0,45,10,41,10,9,1,224,10,9,32,9,0,10,1,192,13,9,10,0,4,5,66,21,160,41,32,42,61,1,64,4,64,9,10,96,61,1,64,13,4,16,4,9,128,61,8,68,10,13,16,13,9,128,45,1,74,0,10,16,0,9,128,9,10,1,128,16,0,9,128,10,0,1,128,4,0,9,4,30,128,1,128,13,4,41,13,135,1,135,9,13,225,225,224,192,1,224,192,1,224,192,1,224,192,1,36,224,96,13,1,45,231,71,13,9,1,42,224,64,42,1,224,192,1,224,224,228,196,0,237,237,5,226,194,1,253,221,1,29,28,189,24,25,26,125,1,28,0,28,157,22,0,23,61,60,1,64,60,93,22,0,23,29,5,34,1,128,28,61,91,125,1,160,28,253,1,192,93,5,98,1,2,21,128,253,224,28,29,77,93,224,13,1,74,173,64,45,9,189,9,226,66,42,73,29,28,29,28,1,93,28,29,64,9,10,9,28,0,28,0,1,93,0,28,64,10,9,10,96,1,61,28,160,41,226,21,128,10,9,125,1,61,28,192,10,125,1,61,224,1,98,21,29,28,128,5,34,21,125,15,28,224,0,1,93,77,36,192,1,77,9,10,9,38,192,33,10,9,10,0,10,96,5,130,1,226,194,1,224,192,1,224,192,1,224,128,4,33,224,128,6,33,224,160,33,224,64,4,0,4,33,224,64,10,0,13,33,224,96,7,9,33,224,0,4,32,13,10,33,4,32,68,71,10,39,10,9,33,10,32,233,41,10,1,226,226,28,0,28,253,157,64,28,61,24,25,26,61,24,25,26,61,1,4,32,61,22,0,23,61,22,0,23,61,1,6,32,61,22,0,23,61,22,0,23,61,1,64,28,29,91,28,29,91,61,1,32,4,0,28,29,60,0,28,29,28,93,1,32,9,32,28,96,28,0,28,61,1,32,10,224,32,61,1,128,4,192,61,1,128,10,160,13,28,29,1,231,103,65,34,21,64,74,60,125,9,93,224,28,93,9,93,77,160,60,29,9,93,10,9,10,224,29,9,93,0,10,0,77,128,28,9,93,64,74,160,9,93,192,45,64,9,93,160,13,41,64,9,93,128,13,73,13,66,93,0,13,32,13,137,64,61,28,0,1,32,10,137,64,129,64,137,32,10,1,0,10,192,5,130,1,224,5,162,1,224,189,33,224,29,24,25,26,61,33,192,4,29,22,0,23,61,33,192,6,29,22,0,23,61,33,224,29,91,61,33,128,4,32,189,33,128,14,32,28,61,14,61,1,224,32,60,93,1,64,9,224,28,29,3,1,10,32,10,231,7,35,1,1,10,4,0,42,9,10,9,10,73,10,9,33,10,9,4,32,10,0,10,0,10,9,10,41,33,9,10,9,0,4,128,10,0,10,9,129,0,6,224,10,33,224,160,33,64,4,224,32,33,64,14,224,32,33,224,160,33,32,4,224,64,33,0,4,6,32,4,224,33,4,10,4,0,4,10,164,32,33,13,9,13,0,13,9,173,32,1,225,225,1,253,189,33,29,24,25,26,253,61,33,29,22,0,23,253,29,28,33,29,22,0,23,61,6,1,93,28,29,0,33,29,91,93,1,93,0,28,0,33,125,28,61,1,29,60,0,5,2,21,1,29,28,29,28,0,28,29,1,29,128,33,28,0,28,64,28,1,28,128,33,0,4,32,4,32,1,160,33,0,10,36,10,36,1,100,32,33,0,237,77,32,1,129,64,42,9,42,32,10,1,4,0,13,10,224,32,1,10,9,13,41,0,13,64,13,64,6,1,9,10,9,42,13,9,13,32,9,96,1,10,0,10,0,74,64,10,96,1,9,224,64,13,0,10,33,32,13,42,5,66,21,13,5,66,1,32,10,192,1,32,10,33,224,160,33,42,224,96,33,10,9,10,39,32,39,32,7,32,33,105,74,41,10,9,10,9,30,1,10,32,9,225,129,4,0,10,253,93,33,9,32,28,93,28,125,60,33,38,32,28,61,0,93,28,32,33,128,61,0,28,29,28,0,38,33,128,28,29,32,28,96,33,160,28,192,33,224,64,70,33,224,160,33,224,160,33,224,0,1,0,70,33,231,7,1,96,1,1,74,0,170,41,32,33,224,32,10,9,64,1,224,64,10,6,32,1,224,192,1,224,192,1,224,192,1,224,192,1,224,192,1,224,0,4,32,4,32,1,64,4,32,4,32,13,32,13,32,1,32,7,13,39,13,32,10,32,9,32,1,32,5,66,9,128,9,32,1,0,5,226,2,21,32,1,224,160,4,1,96,4,160,68,9,1,64,2,6,160,102,1,64,1,224,64,1,64,1,32,4,224,1,64,1,32,6,224,1,64,1,128,4,128,1,64,1,128,6,128,1,64,1,224,0,4,0,1,64,1,167,68,13,4,1,64,1,237,13,10,45,1,5,226,162,1,224,128,36,1,224,128,45,1,32,4,160,36,64,33,32,9,128,4,10,9,64,33,32,1,32,36,0,10,0,10,32,6,33,0,4,1,32,10,9,192,33,4,10,1,64,10,128,4,0,33,10,9,10,160,68,13,4,33,0,10,192,77,9,13,9,1,68,32,36,39,10,9,10,9,42,109,39,109,41,42,41,226,34,21,96,1,36,224,128,1,45,4,224,0,14,32,33,9,13,224,96,33,9,10,224,96,33,10,128,38,160,33,224,160,33,64,14,224,32,33,224,160,1,41,224,128,1,10,9,10,224,96,1,9,10,41,224,64,1,1,32,5,66,9,128,10,32,1,160,9,224,1,3,36,64,10,224,1,70,192,4,96,1,224,32,13,4,64,1,128,4,64,1,0,13,4,32,1,128,6,128,10,13,4,0,1,224,96,10,13,0,1,224,4,96,9,0,1,224,6,96,10,4,9,231,135,9,13,9,225,129,41,64,1,2,1,130,33,9,10,9,224,96,41,10,9,192,4,96,106,96,4,32,6,96,9,10,61,64,4,13,192,9,29,24,25,32,4,13,10,192,10,29,22,32,4,13,224,0,61,22,32,13,10,32,4,0,4,32,4,0,28,29,59,0,9,64,10,0,13,32,13,36,28,61,4,9,128,9,32,9,77,61,13,9,96,9,10,32,10,41,10,45,41,103,33,32,33,73,10,41,10,9,10,41,74,9,42,9,74,73,10,9,10,93,10,61,10,61,10,41,10,29,10,253,93,42,253,157,26,61,24,25,26,61,24,25,26,61,13,61,23,61,22,0,23,61,22,0,23,61,9,61,23,61,22,0,23,61,22,0,23,61,9,61,27,29,28,91,13,29,91,29,13,9,125,0,28,29,13,10,93,60,0,9,13,61,28,32,28,10,125,64,42,29,45,71,61,39,28,71,10,39,10,9,237,77,9,45,10,9,10,9,4,224,32,1,29,10,29,10,9,224,32,1,125,42,4,224,1,189,9,4,192,1,189,10,41,160,1,29,13,61,38,74,160,1,157,13,9,224,1,157,10,41,0,9,128,1,125,13,9,42,9,10,128,1,93,13,10,9,10,0,10,160,1,39,13,10,9,10,224,0,1,45,41,1,224,32,1,9,225,129,73,4,224,96,10,29,9,13,4,224,64,9,29,10,9,13,224,32,13,9,29,9,10,9,4,224,4,9,10,29,41,10,13,224,13,10,9,29,42,9,10,192,4,10,9,10,29,41,10,192,4,13,9,10,9,29,9,10,96,100,13,42,9,61,9,100,0,109,10,61,10,61,9,109,253,93,137,237,77,9,10,161,32,161,29,9,224,160,29,10,4,224,128,29,9,13,32,5,226,34,29,10,9,4,224,96,29,9,10,13,4,224,64,29,10,9,10,13,132,32,4,64,61,74,141,36,13,68,125,42,9,42,9,45,10,9,45,253,29,10,29,10,253,253,125,237,237,225,225,224,224,96,132,32,132,2,21,32,10,73,10,32,45,9,13,10,128,10,9,10,128,10,224,10,224,224,224,0,36,224,32,100,45,32,132,0,36,109,29,15,36,141,0,45,9,42,9,29,77,42,9,10,9,4,10,9,10,29,42,13,10,29,9,61,9,29,10,13,42,125,129,224,32,1,0,4,32,1,68,0,4,128,1,4,13,36,1,77,4,13,4,96,41,10,9,138,9,10,13,96,10,32,10,128,10,160,9,224,160,4,9,224,128,13,9,10,36,224,32,4,42,9,45,36,192,4,13,73,42,45,4,64,68,13,9,10,41,61,10,9,13,68,77,73,42,93,10,9,77,41,10,41,10,41,197,212,36,213,76,213,145,213,229,213,33,214,128,214,203,214,21,215,109,215,204,215,44,216,113,216,182,216,255,216,85,217,143,217,216,217,58,218,167,218,248,218,74,219,142,219,215,219,3,132,22,145,2,74,122,2,0,168,120,1,0,100,103,1,4,98,108,1,1,46,109,2,1,82,92,1,0,67,83,0,3,44,108,1,1,169,168,1,2,69,72,2,1,126,124,1,0,44,43,1,3,44,124,2,2,90,170,2,0,187,190,1,3,38,166,4,3,35,115,2,0,57,56,1,1,70,72,1,8,198,182,0,3,140,142,2,0,41,57,0,0,180,190,1,3,126,165,2,0,76,75,0,0,196,180,4,0,188,172,0,3,117,165,2,3,50,162,4,0,46,45,0,2,40,104,2,3,41,105,2,0,146,130,0,4,83,92,2,1,124,126,1,2,185,177,2,4,174,62,1,3,39,167,2,2,42,154,2,0,186,74,1,4,33,129,2,0,66,178,2,1,75,74,1,2,102,103,1,0,128,32,0,2,88,87,1,0,107,43,1,0,50,51,0,2,38,102,2,0,170,167,2,0,54,62,2,2,135,138,2,0,169,200,1,2,36,91,2,0,89,88,0,3,38,118,2,3,69,133,1,4,206,197,1,4,174,94,1,3,51,147,4,2,153,150,1,3,161,164,1,4,107,100,2,2,117,121,2,1,59,54,1,0,138,142,1,3,34,163,1,3,42,185,1,0,185,169,8,2,170,164,2,3,146,155,2,0,198,182,4,4,162,1,94,1,130,1,70,2,126,1,166,2,142,1,174,1,147,1,110,1,190,1,149,1,164,1,173,1,129,1,116,1,153,1,133,3,185,1,85,1,83,1,50,1,54,1,51,252,248,64,0,4,248,65,0,252,0,66,0,4,0,67,0,252,8,68,1,4,8,69,1,128,252,248,65,64,4,248,64,64,252,0,67,64,4,0,66,64,252,8,69,65,4,8,68,65,128,252,248,70,0,4,248,71,0,252,0,72,0,4,0,73,0,252,8,74,1,4,8,75,1,128,252,248,71,64,4,248,70,64,252,0,73,64,4,0,72,64,252,8,75,65,4,8,74,65,128,252,248,76,0,4,248,77,0,252,0,78,0,4,0,79,0,252,8,80,1,4,8,81,1,128,252,248,77,64,4,248,76,64,252,0,79,64,4,0,78,64,252,8,81,65,4,8,80,65,128,252,248,82,0,4,248,83,0,252,0,84,0,4,0,85,0,252,8,86,1,4,8,87,1,128,252,248,83,64,4,248,82,64,252,0,85,64,4,0,84,64,252,8,87,65,4,8,86,65,128,252,248,88,0,4,248,83,0,252,0,89,0,4,0,90,0,252,8,91,1,4,8,87,1,128,252,248,83,64,4,248,88,64,252,0,90,64,4,0,89,64,252,8,87,65,4,8,91,65,128,252,248,92,0,4,248,93,0,252,0,94,0,4,0,95,0,252,8,96,1,4,8,97,1,128,252,248,93,64,4,248,92,64,252,0,95,64,4,0,94,64,252,8,97,65,4,8,96,65,128,252,248,98,0,4,248,99,0,252,0,100,0,4,0,101,0,252,8,102,1,4,8,69,1,128,252,248,99,64,4,248,98,64,252,0,101,64,4,0,100,64,252,8,69,65,4,8,102,65,128,252,248,103,0,4,248,104,0,252,0,105,0,4,0,106,0,252,8,68,1,4,8,69,1,128,252,248,104,64,4,248,103,64,252,0,106,64,4,0,105,64,252,8,69,65,4,8,68,65,128,0,0,107,2,8,0,108,2,0,8,109,2,8,8,110,2,128,0,0,111,2,8,0,112,2,0,8,113,2,8,8,114,2,128,0,0,115,0,8,0,116,0,0,8,117,0,8,8,118,0,128,0,0,119,0,8,0,120,0,0,8,121,0,8,8,122,0,128,0,0,123,2,8,0,124,2,0,8,125,2,8,8,126,2,128,0,0,127,2,8,0,128,2,0,8,129,2,8,8,130,2,128,0,0,131,3,8,0,132,3,0,8,133,3,8,8,134,3,128,0,0,132,67,8,0,131,67,0,8,134,67,8,8,133,67,128,0,0,135,3,8,0,136,3,0,8,137,3,8,8,138,3,128,0,0,136,67,8,0,135,67,0,8,138,67,8,8,137,67,128,0,0,139,0,8,0,140,0,0,8,141,0,8,8,142,0,128,0,0,140,64,8,0,139,64,0,8,142,64,8,8,141,64,128,0,0,143,0,8,0,144,0,0,8,145,0,8,8,146,0,128,0,0,144,64,8,0,143,64,0,8,146,64,8,8,145,64,128,0,0,147,0,8,0,148,0,0,8,149,1,8,8,150,1,128,0,0,148,64,8,0,147,64,0,8,150,65,8,8,149,65,128,0,0,147,0,8,0,148,0,0,8,151,1,8,8,152,1,128,0,0,148,64,8,0,147,64,0,8,152,65,8,8,151,65,128,0,0,153,2,8,0,153,66,0,8,154,2,8,8,154,66,128,0,0,153,2,8,0,153,66,0,8,155,2,8,8,155,66,128,3,0,0,0,2,0,2,1,1,1,1,1,2,1,2,0,3,0,0,0,2,0,1,1,1,1,1,1,1,1,0,0,1,1,1,0,0,0,0,0,0,149,150,151,152,153,154,155,156,157,157,158,159,160,161,162,163,0,164,165,166,167,157,168,169,170,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,157,157,216,159,217,218,219,220,221,222,223,224,157,225,158,226,227,228,229,228,230,231,230,232,227,231,229,233,234,235,236,236,227,231,237,232,238,239,229,232,240,241,241,0,227,231,229,232,242,243,244,245,0,0,0,0,246,247,248,246,246,247,248,0,249,250,251,252,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,175,221,225,221,19,222,69,222,119,222,169,222,219,222,13,223,200,221,250,221,44,222,94,222,144,222,194,222,244,222,38,223,165,223,199,223,0,0,0,0,182,223,216,223,0,0,0,0,233,223,11,224,0,0,0,0,250,223,28,224,0,0,0,0,45,224,79,224,0,0,0,0,62,224,96,224,0,0,0,0,113,224,130,224,0,0,0,0,113,224,130,224,0,0,0,0,0,0,63,223,80,223,97,223,114,223,83,84,82,65,78,71,69,32,79,76,68,69,32,84,69,76,76,83,32,67,72,69,82,73,76,58,37,37,39,84,82,89,32,84,72,73,83,32,73,78,67,82,69,68,73,66,76,69,32,68,69,86,73,67,69,44,37,37,73,84,32,87,73,76,76,32,71,82,65,78,84,32,89,79,85,32,86,65,83,84,32,80,79,87,69,82,37,37,65,78,68,32,65,77,65,90,73,78,71,32,77,73,71,72,84,33,39,44,32,83,79,32,83,72,69,37,37,65,67,67,69,80,84,83,46,32,79,78,76,89,32,84,79,32,66,69,32,83,84,85,67,75,32,84,79,37,37,84,72,69,32,68,65,77,78,69,68,32,66,79,79,84,33,32,72,69,76,80,33,0,39,83,79,32,89,79,85,32,75,78,79,87,32,65,66,79,85,84,32,84,72,69,32,67,85,82,83,69,37,37,89,69,84,32,89,79,85,32,67,79,77,69,32,66,65,67,75,32,65,71,65,73,78,33,39,37,37,83,65,89,83,32,84,72,69,32,79,76,68,69,46,32,66,85,84,32,67,72,69,82,73,76,37,37,83,69,69,77,83,32,67,79,78,86,73,78,67,69,68,58,32,39,84,72,69,82,69,32,77,85,83,84,37,37,66,69,32,83,79,77,69,84,72,73,78,71,32,69,76,83,69,32,84,79,32,73,84,44,32,73,39,77,37,37,83,85,82,69,33,39,44,32,83,72,69,32,67,76,65,73,77,83,46,0,39,73,39,86,69,32,87,79,82,75,69,68,32,81,85,73,84,69,32,72,65,82,68,44,32,89,79,85,37,37,75,78,79,87,39,44,32,83,65,89,83,32,67,72,69,82,73,76,44,32,39,73,32,84,72,73,78,75,37,37,73,39,86,69,32,67,79,77,69,32,84,79,32,69,78,74,79,89,32,84,72,73,83,33,37,37,71,73,77,77,69,32,84,72,65,84,32,71,79,68,68,65,77,78,69,68,32,66,79,79,84,37,37,65,71,65,73,78,44,32,68,79,79,68,33,39,46,32,39,70,65,73,82,32,69,78,79,85,71,72,44,37,37,73,84,39,83,32,89,79,85,82,83,46,46,46,39,44,32,79,76,68,69,32,83,65,89,83,46,0,65,78,68,32,84,72,69,32,83,84,82,65,78,71,69,32,83,84,65,82,32,72,65,80,80,69,78,83,37,37,84,79,32,66,69,32,77,65,71,73,67,44,32,79,82,32,83,79,32,73,84,32,83,69,69,77,83,44,37,37,66,69,67,65,85,83,69,32,67,72,69,82,73,76,32,73,83,32,78,79,87,32,70,82,69,69,37,37,79,70,32,84,72,69,32,66,79,79,84,46,32,83,72,69,32,84,85,82,78,83,32,84,79,37,37,84,72,69,32,67,65,77,69,82,65,58,32,39,83,69,82,73,79,85,83,76,89,63,32,89,79,85,37,37,80,76,65,89,69,68,32,84,72,82,85,39,32,65,76,76,32,84,72,73,83,32,67,82,65,80,63,39,0,65,78,68,32,84,72,69,32,83,84,82,65,78,71,69,32,83,84,65,82,32,72,65,80,80,69,78,83,37,37,84,79,32,66,69,32,77,65,71,73,67,44,32,65,78,68,32,67,72,69,82,73,76,32,73,83,37,37,78,79,87,32,70,82,69,69,32,79,70,32,84,72,69,32,66,79,79,84,46,32,39,65,76,76,37,37,84,72,73,83,32,77,79,78,69,89,32,70,79,82,32,74,85,83,84,32,65,32,67,82,65,80,80,89,37,37,83,84,65,82,63,32,73,32,83,72,79,85,76,68,39,86,69,32,83,65,86,69,68,32,73,84,37,37,70,79,82,32,84,72,69,32,65,84,84,79,82,78,69,89,83,33,39,0,65,78,68,32,84,72,69,32,83,84,82,65,78,71,69,32,83,84,65,82,32,70,82,69,69,83,37,37,67,72,69,82,73,76,32,70,82,79,77,32,84,72,69,32,66,79,79,84,46,32,39,84,72,73,83,37,37,87,65,83,32,84,79,85,71,72,44,32,66,85,84,32,73,39,77,32,83,85,82,69,32,84,72,73,83,37,37,71,65,77,69,32,87,79,78,39,84,32,66,69,32,70,69,65,84,85,82,69,68,32,79,78,37,37,84,72,69,32,83,80,65,78,73,83,72,32,82,69,84,82,79,32,71,65,77,69,82,32,77,65,71,37,37,65,78,89,87,65,89,83,44,32,83,79,32,87,72,79,32,67,65,82,69,83,63,37,37,0,202,225,116,226,24,227,194,227,111,228,19,229,0,0,0,10,2,10,3,2,2,6,4,4,20,20,20,45,34,39,114,193,146,193,162,193,130,193,130,193,130,193,188,224,188,224,188,224,147,224,147,224,147,224,226,193,226,193,226,193,128,225,128,225,128,225,51,202,65,211,43,220,111,202,113,211,91,220,3,2,2,117,202,117,211,95,220,221,203,149,212,127,221,0,0,0,1,0,1,95,64,65,1,29,66,67,0,3,29,0,1,9,5,29,0,1,9,4,29,0,1,2,67,68,65,65,10,8,1,23,11,65,65,69,0,1,254,0,1,254,0,1,254,0,1,2,1,0,1,0,1,254,0,1,6,64,65,66,0,1,5,64,66,64,65,66,0,1,17,67,68,69,65,1,6,69,67,0,67,64,66,0,1,15,67,65,65,66,64,66,64,65,66,67,65,67,65,69,67,67,0,0,249,250,0,1,11,67,0,0,67,68,69,67,0,67,67,0,68,65,65,67,69,0,0,251,252,0,1,11,68,65,65,69,0,0,68,65,69,67,0,1,3,68,65,66,0,217,218,221,222,0,1,6,165,166,0,1,9,68,65,1,5,69,0,219,220,223,224,165,0,1,254,0,1,254,0,1,26,16,0,8,2,0,1,3,8,2,0,1,31,1,0,1,0,1,199,70,71,74,75,78,78,72,70,1,3,72,70,72,70,70,0,1,15,72,73,76,77,79,78,78,70,1,2,72,78,72,78,72,72,0,1,15,78,80,78,83,85,78,78,72,88,89,92,78,1,4,0,1,15,81,82,78,84,86,87,78,78,90,91,93,78,94,95,96,97,0,1,15,98,99,102,103,106,107,78,78,112,113,116,78,118,119,122,123,0,1,15,100,101,104,105,108,109,110,111,114,115,117,111,120,121,124,125,0,1,16,126,129,130,0,0,133,134,137,138,141,0,0,143,145,146,0,1,15,127,128,131,132,0,0,135,136,139,140,142,0,0,144,147,148,0,1,254,0,1,254,0,1,19,160,1,3,0,1,3,86,8,170,0,1,4,5,8,10,0,1,34,1,0,1,0,1,199,156,157,0,1,29,158,159,160,161,162,163,164,0,1,24,165,166,167,156,169,0,172,173,0,0,178,0,1,20,156,1,2,168,170,171,174,175,176,177,179,180,181,182,0,1,17,156,1,2,184,187,188,191,192,195,196,199,200,203,204,0,1,18,183,185,186,189,190,193,194,197,198,201,202,205,206,207,208,0,1,19,210,211,212,213,214,215,217,218,221,222,225,226,0,1,18,209,156,1,4,216,219,220,223,224,227,156,0,1,254,0,1,254,0,1,19,160,160,0,1,5,138,70,85,17,0,1,41,1,0,0,0,228,2,8,0,229,2,16,0,230,0,24,0,231,0,32,0,232,2,40,0,233,2,0,8,234,2,8,8,235,2,16,8,236,0,24,8,237,0,32,8,238,2,40,8,239,2,128,0,0,15,0,8,0,28,0,16,0,30,0,0,8,240,0,8,8,241,0,16,8,242,0,24,8,243,0,0,16,244,0,8,16,245,0,16,16,246,0,24,16,247,0,0,24,248,0,8,24,249,0,16,24,250,0,24,24,251,0,0,32,252,0,8,32,253,0,16,32,254,0,24,32,255,0,128,252,243,207,63,224,230,146,231,80,82,69,83,83,32,83,84,65,82,84,33,0,64,32,50,48,49,56,32,84,72,69,32,77,79,74,79,78,32,84,87,73,78,83,0,71,65,77,69,32,79,86,69,82,33,0,84,72,69,32,32,69,78,68,0,76,69,86,69,76,32,48,0,76,69,86,69,76,32,48,0,32,32,32,32,32,73,78,83,84,82,85,67,84,73,79,78,83,37,37,37,37,67,72,69,82,73,76,32,73,83,32,73,78,32,65,32,66,79,79,84,32,83,79,32,83,72,69,37,67,65,78,39,84,32,83,84,79,80,32,74,85,77,80,73,78,71,33,37,37,37,37,80,82,69,83,83,32,91,68,79,87,78,93,32,84,79,32,77,65,75,69,32,67,72,69,82,73,76,37,67,82,79,85,67,72,32,65,78,68,32,74,85,77,80,32,76,79,87,69,82,37,37,37,37,80,82,69,83,83,32,91,66,93,32,84,79,32,67,72,65,82,71,69,44,32,84,72,69,78,37,82,69,76,69,65,83,69,32,84,79,32,83,80,73,84,33,37,37,37,37,37,32,32,32,80,82,69,83,83,32,65,78,89,32,66,85,84,84,79,78,0,32,32,32,32,66,79,79,84,69,69,32,45,32,83,84,65,82,82,73,78,71,32,67,72,69,82,73,76,37,37,67,79,80,89,76,69,70,84,32,50,48,49,56,32,66,89,32,84,72,69,32,77,79,74,79,78,32,84,87,73,78,83,37,68,69,83,73,71,78,32,38,32,80,79,82,84,32,66,89,32,84,72,69,32,77,79,74,79,78,32,84,87,73,78,83,37,32,32,32,78,69,83,76,73,66,32,38,32,70,65,77,73,84,79,78,69,32,66,89,32,83,72,73,82,85,37,32,32,32,32,32,32,32,78,69,83,32,79,71,84,32,66,89,32,68,65,86,73,68,73,65,78,0,0,141,14,3,142,15,3,141,21,3,142,22,3,136,185,255,255,141,31,3,136,185,255,255,141,30,3,140,33,3,32,255,255,160,255,208,232,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,190,128,0,128,17,130,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,56,56,56,56,0,56,0,56,56,56,56,56,0,56,0,238,238,204,0,0,0,0,0,238,238,204,0,0,0,0,0,0,110,255,255,126,60,24,0,0,108,254,254,124,56,16,0,60,98,253,229,137,151,70,60,0,60,66,122,118,110,60,0,60,127,119,63,30,60,60,28,60,102,102,60,24,56,56,0,120,236,236,254,236,236,126,0,120,236,236,254,236,236,126,0,56,56,48,0,0,0,0,0,56,56,48,0,0,0,0,0,0,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,255,255,0,0,0,255,0,0,0,255,255,255,255,0,0,122,190,254,254,174,150,196,120,2,122,122,122,122,122,58,2,94,125,127,127,43,101,35,30,64,94,94,94,94,94,92,64,0,0,0,0,0,56,56,48,0,0,0,0,0,56,56,48,0,0,0,126,126,0,0,0,0,0,0,126,126,0,0,0,0,0,0,0,0,24,24,0,0,0,0,0,0,24,24,0,0,0,0,0,1,4,1,30,0,0,0,0,0,3,0,1,56,124,238,238,238,124,56,0,56,124,238,238,238,124,56,0,56,120,248,56,56,56,254,0,56,120,248,56,56,56,254,0,252,254,30,124,240,254,254,0,252,254,30,124,240,254,254,0,252,254,14,60,14,254,252,0,252,254,14,60,14,254,252,0,62,126,238,238,254,254,14,0,62,126,238,238,254,254,14,0,254,254,224,252,14,254,252,0,254,254,224,252,14,254,252,0,124,252,224,252,238,254,124,0,124,252,224,252,238,254,124,0,126,126,14,30,60,120,112,0,126,126,14,30,60,120,112,0,124,254,238,124,238,254,124,0,124,254,238,124,238,254,124,0,124,254,238,126,14,124,120,0,124,254,238,126,14,124,120,0,0,0,56,56,0,56,56,0,0,0,56,56,0,56,56,0,0,0,56,56,0,56,56,48,0,0,56,56,0,56,56,48,31,64,130,140,48,7,63,127,0,63,125,115,207,255,255,174,0,126,127,63,126,127,63,0,0,126,126,0,126,126,0,0,128,96,144,72,8,8,136,192,0,128,96,240,240,240,240,248,124,126,14,28,0,28,28,0,124,126,14,28,0,28,28,0,124,198,146,138,146,198,124,0,124,198,146,138,146,198,124,0,124,254,238,254,254,238,238,0,124,254,238,254,254,238,238,0,252,254,238,252,238,254,252,0,252,254,238,252,238,254,252,0,126,254,224,224,224,254,126,0,126,254,224,224,224,254,126,0,248,252,238,238,238,252,248,0,248,252,238,238,238,252,248,0,254,254,224,248,224,254,254,0,254,254,224,248,224,254,254,0,254,254,224,248,224,224,224,0,254,254,224,248,224,224,224,0,126,254,224,238,238,254,126,0,126,254,224,238,238,254,126,0,238,238,254,254,238,238,238,0,238,238,254,254,238,238,238,0,124,124,56,56,56,124,124,0,124,124,56,56,56,124,124,0,14,14,14,14,30,124,120,0,14,14,14,14,30,124,120,0,238,238,252,248,252,238,238,0,238,238,252,248,252,238,238,0,224,224,224,224,224,254,254,0,224,224,224,224,224,254,254,0,198,238,254,254,254,238,238,0,198,238,254,254,254,238,238,0,252,254,238,238,238,238,238,0,252,254,238,238,238,238,238,0,124,254,238,238,238,254,124,0,124,254,238,238,238,254,124,0,252,254,238,254,252,224,224,0,252,254,238,254,252,224,224,0,124,254,238,238,252,254,110,0,124,254,238,238,252,254,110,0,252,254,238,252,254,238,238,0,252,254,238,252,254,238,238,0,126,254,240,124,30,254,252,0,126,254,240,124,30,254,252,0,254,254,56,56,56,56,56,0,254,254,56,56,56,56,56,0,238,238,238,238,238,254,124,0,238,238,238,238,238,254,124,0,238,238,238,238,254,124,56,0,238,238,238,238,254,124,56,0,238,238,238,254,254,238,198,0,238,238,238,254,254,238,198,0,238,238,124,56,124,238,238,0,238,238,124,56,124,238,238,0,238,238,254,124,56,56,56,0,238,238,254,124,56,56,56,0,254,254,28,56,112,254,254,0,254,254,28,56,112,254,254,0,126,126,112,112,112,126,126,0,126,126,112,112,112,126,126,0,64,224,112,56,28,14,4,0,64,224,112,56,28,14,4,0,126,126,14,14,14,126,126,0,126,126,14,14,14,126,126,0,16,56,124,254,254,56,56,0,16,56,124,254,254,56,56,0,24,66,60,189,189,60,66,24,0,60,126,126,126,126,60,0,0,31,32,64,64,64,65,66,0,31,63,127,127,127,126,124,0,255,0,0,0,0,255,0,0,255,255,255,255,255,0,0,0,248,4,2,2,2,130,66,0,248,248,252,252,252,124,124,66,66,66,66,66,66,66,66,124,124,124,124,124,124,124,124,66,65,64,64,64,32,31,0,124,127,127,127,127,31,0,0,66,130,2,2,2,4,248,0,124,252,252,252,252,248,0,0,255,255,255,255,255,255,255,255,255,4,4,4,255,32,32,32,255,255,255,255,255,255,255,255,255,4,4,0,84,0,0,0,255,255,255,255,255,255,255,255,255,4,4,0,117,0,32,0,255,255,255,255,255,255,254,254,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,252,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,3,0,0,0,0,0,0,0,0,240,224,192,128,0,0,0,0,3,15,31,63,127,127,255,255,0,0,0,0,0,0,0,0,252,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,255,63,31,15,15,7,7,7,0,0,192,224,224,240,240,112,254,252,252,252,252,252,252,252,0,1,1,1,1,1,1,1,255,255,255,254,252,248,248,48,0,0,0,0,1,2,2,6,248,248,248,24,104,248,248,240,3,3,3,3,3,3,3,7,255,255,254,254,254,252,252,252,0,0,0,0,1,1,1,1,252,252,253,252,252,252,252,253,1,1,0,0,0,0,1,1,7,15,31,127,127,127,7,3,112,96,128,0,0,0,0,120,5,2,64,225,241,249,120,56,28,62,30,15,7,3,3,131,255,255,255,255,255,127,127,127,0,0,0,0,0,0,0,0,255,255,255,255,248,231,220,179,0,0,0,0,0,7,24,32,255,255,255,128,127,229,127,255,0,0,0,0,127,224,0,0,175,175,176,191,191,191,191,190,32,32,32,63,63,63,62,61,221,42,235,235,219,219,219,11,0,0,98,195,195,195,195,243,255,255,255,127,143,243,157,230,0,0,0,0,128,240,12,2,250,230,30,254,254,254,254,254,2,2,14,254,254,254,254,254,255,255,255,254,255,255,255,255,0,0,0,0,0,0,0,0,255,252,251,119,135,240,240,240,0,0,0,0,0,0,7,7,0,195,129,0,0,0,0,0,0,24,60,126,126,0,255,255,255,63,223,239,239,15,47,111,0,0,0,0,0,0,224,224,7,7,7,7,3,0,0,0,192,240,240,240,248,252,255,255,15,159,255,254,255,254,4,0,0,0,0,0,0,0,0,246,0,0,0,0,0,0,0,0,255,247,239,207,139,137,8,0,0,2,11,2,2,3,3,3,247,245,228,236,236,236,236,108,255,255,254,255,254,223,254,238,0,0,0,0,0,0,0,0,253,253,252,252,254,255,255,254,1,1,1,1,0,0,0,0,111,23,88,111,68,4,4,4,0,0,0,0,59,123,123,123,120,134,108,40,8,12,44,24,0,0,1,195,227,227,193,197,184,152,216,32,48,0,1,1,131,195,199,167,119,123,127,255,63,191,185,169,135,7,12,0,128,128,134,150,184,184,179,127,2,12,0,0,0,0,0,0,63,206,241,255,229,196,132,128,1,1,0,0,0,0,0,0,126,246,239,207,139,137,8,0,255,247,239,15,11,9,8,0,0,0,0,192,128,128,0,0,255,247,239,207,139,137,8,0,0,0,0,0,0,0,0,0,191,191,191,223,223,222,239,239,62,31,31,31,30,13,14,15,208,219,219,208,7,215,247,191,207,194,195,207,247,71,135,135,238,239,239,204,191,191,121,126,13,14,13,11,29,59,71,113,15,163,175,159,31,15,119,127,235,157,139,158,223,55,107,183,254,126,254,253,253,253,251,251,126,188,124,252,252,240,224,192,253,253,243,247,251,230,250,248,188,252,224,128,240,192,32,224,205,128,192,128,1,0,0,192,0,50,10,14,124,142,63,11,240,240,240,240,247,247,119,83,4,4,5,6,7,6,7,133,192,236,254,207,139,137,8,0,19,1,0,0,0,0,0,0,17,1,128,144,192,128,0,0,225,253,125,14,7,5,7,7,0,64,0,32,255,255,143,255,249,57,255,31,255,251,119,143,111,79,71,199,239,239,223,191,224,192,240,240,192,224,192,128,255,254,178,16,0,0,0,0,254,182,182,49,207,253,255,255,63,6,0,0,16,0,0,0,128,0,248,252,14,134,134,142,22,22,5,3,39,14,12,92,8,8,24,24,16,33,35,3,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,24,24,152,172,143,151,169,178,71,71,7,3,32,32,16,12,132,200,182,193,255,127,63,31,123,55,0,0,0,128,192,192,80,176,114,242,242,226,231,199,140,12,12,12,12,28,26,58,95,63,62,62,190,190,24,0,128,128,129,129,1,0,1,7,142,14,23,47,95,191,254,62,119,247,239,223,191,127,255,255,0,0,1,7,15,31,63,127,0,0,0,3,15,31,63,62,0,63,255,255,255,255,255,255,0,15,254,249,231,159,127,255,127,127,127,127,127,0,63,0,125,125,123,123,123,0,0,0,255,255,255,255,255,0,255,0,255,255,255,255,255,0,0,0,253,255,255,255,255,255,255,255,61,193,56,255,255,255,255,255,191,255,255,255,255,255,255,240,31,130,127,23,255,255,255,240,255,254,249,231,28,240,128,0,255,254,248,224,0,0,0,0,143,127,199,55,0,0,0,0,128,0,0,0,0,0,0,0,252,252,252,252,252,228,156,124,128,112,248,248,224,192,0,0,252,252,240,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,7,7,7,7,7,7,3,0,0,0,0,0,0,3,2,3,7,63,60,0,0,0,0,0,0,0,0,0,0,0,0,0,223,215,223,223,223,255,255,0,0,0,0,0,0,0,0,128,128,200,192,224,224,140,28,60,56,20,28,0,0,223,239,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,96,96,112,124,28,0,0,0,0,0,0,0,0,0,0,4,8,16,33,64,128,8,16,4,8,16,0,2,4,8,16,33,66,128,0,0,32,64,128,0,0,4,8,16,32,65,130,33,66,128,0,0,32,64,128,32,0,4,8,16,32,65,130,0,8,16,32,64,128,8,16,4,8,16,1,2,4,8,16,125,226,194,193,192,192,160,159,126,253,253,255,255,255,223,224,222,33,33,193,1,1,3,7,62,254,254,254,254,254,252,248,128,128,254,225,193,193,191,127,255,255,253,254,254,254,64,0,255,3,1,1,129,131,199,254,0,252,254,254,126,124,56,0,255,255,255,0,255,31,241,0,255,62,0,0,0,0,0,0,255,255,255,255,255,63,224,0,255,1,0,0,0,0,0,0,255,255,255,255,255,240,127,0,255,252,0,0,0,0,0,0,109,18,255,128,128,127,19,82,127,109,255,255,255,128,108,109,182,72,254,1,1,255,182,86,254,182,255,254,254,0,0,160,82,82,255,128,128,127,19,18,109,109,255,255,255,128,108,109,70,78,254,1,1,255,190,86,176,176,255,254,254,0,0,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,13,3,3,35,103,247,0,16,4,2,17,37,104,104,0,0,0,129,142,142,222,254,64,194,144,9,2,134,204,205,63,127,127,64,127,95,113,0,63,126,64,0,64,0,64,0,63,127,127,127,127,63,15,0,63,65,64,64,64,0,0,0,255,255,255,255,255,240,255,0,255,252,0,0,0,0,0,0,14,236,200,136,128,128,0,14,12,206,238,238,238,230,96,64,159,223,187,123,49,1,1,0,96,32,64,0,0,0,0,0,190,182,148,204,252,244,240,224,64,72,104,48,0,0,0,0,0,32,32,33,33,33,33,97,32,32,33,33,33,33,97,113,0,8,8,8,8,8,8,28,8,8,8,8,8,24,28,156,97,97,96,64,139,206,124,0,113,121,125,253,116,48,0,0,152,16,32,32,228,223,205,12,158,190,190,223,27,0,0,0,255,248,240,225,192,193,194,131,0,7,8,17,32,35,38,71,251,127,59,95,15,207,175,239,4,192,36,80,8,200,168,232,0,1,0,0,0,2,129,193,128,131,128,160,160,163,97,33,15,199,7,3,15,15,7,7,8,196,4,2,12,200,132,132,87,139,56,180,40,16,38,6,32,112,192,67,7,15,31,63,255,158,4,48,12,6,71,59,0,0,0,192,240,248,184,196,0,40,23,12,87,9,88,57,63,23,8,3,32,112,32,2,35,99,199,30,48,232,19,151,220,156,56,224,192,6,12,8,0,73,51,51,3,78,30,1,0,54,124,124,124,48,0,0,70,8,40,26,63,179,139,219,48,112,112,96,64,4,4,4,30,37,12,12,2,0,3,0,1,25,17,0,1,7,0,0,66,70,220,8,32,224,192,0,156,152,0,0,192,0,0,0,0,0,127,192,192,192,255,128,0,0,127,255,255,255,128,255,16,16,248,6,6,6,254,2,0,0,252,248,248,248,0,252,237,128,155,128,182,127,0,0,255,255,255,255,255,0,0,0,182,2,110,2,218,252,0,0,252,252,252,252,252,0,0,0,46,15,4,15,32,93,190,62,127,0,3,0,31,63,127,255,140,224,192,224,88,44,150,150,240,0,0,0,160,208,232,232,62,157,34,92,32,17,14,7,255,127,127,63,31,14,1,0,150,22,44,44,88,176,96,192,232,232,208,208,160,64,128,0,102,119,247,251,188,75,48,17,119,255,127,119,115,180,207,238,102,119,247,251,188,75,48,16,119,255,127,119,115,180,207,239,16,145,241,13,63,120,49,3,239,110,14,50,64,0,6,4,19,19,31,62,48,239,3,147,236,236,224,192,192,0,12,12,224,206,200,200,136,42,38,128,192,236,238,238,238,76,0,0,255,127,61,21,21,20,8,0,0,0,0,0,0,0,0,0,255,206,68,68,36,24,0,0,0,0,0,0,0,0,0,0,255,128,131,132,136,136,136,132,255,255,252,248,240,240,240,248,254,1,129,33,17,17,17,33,255,254,126,62,30,30,30,62,130,128,132,128,136,135,128,127,252,252,248,248,240,255,255,128,65,1,33,1,17,241,1,255,126,62,62,30,30,254,254,0,16,34,4,8,16,32,64,130,1,2,68,136,0,0,1,2,4,8,16,32,64,2,4,8,4,8,0,0,1,130,4,0,4,8,16,32,0,2,4,8,4,8,0,0,65,130,4,0,16,34,4,8,16,32,0,2,1,2,68,136,0,0,65,130,127,248,196,196,196,196,194,194,127,255,251,251,251,251,253,253,252,3,113,137,137,137,137,113,254,252,142,126,126,126,126,254,194,195,195,195,195,199,190,127,253,252,252,252,252,248,65,0,1,131,255,61,1,1,3,254,254,124,0,194,254,254,252,0,255,231,207,223,255,63,224,0,255,1,4,4,24,0,0,0,56,165,164,103,164,164,103,166,60,251,251,184,251,251,184,249,56,228,36,231,36,36,231,38,60,251,251,56,251,251,56,249,166,101,166,167,100,167,167,28,249,184,249,248,184,248,248,32,38,229,38,39,102,231,231,28,249,56,249,248,56,56,56,32,0,0,27,27,4,27,27,0,0,0,0,4,14,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,4,132,64,0,68,74,146,186,246,49,64,64,68,74,66,199,223,255,68,72,8,12,138,182,155,1,68,74,72,88,72,68,228,255,252,254,254,0,254,0,128,0,248,60,0,0,0,0,0,0,252,254,254,254,252,224,120,0,248,252,0,0,0,0,0,0,251,247,251,247,251,245,250,247,4,0,4,0,4,2,5,0,192,196,196,196,196,196,196,220,60,56,56,56,56,56,56,32,251,247,251,247,251,87,171,247,4,0,4,0,4,128,84,0,3,7,7,7,7,7,7,31,60,56,56,56,56,56,56,32,251,247,251,247,251,87,171,247,4,0,4,0,4,0,84,8,251,247,251,247,250,245,251,247,4,0,4,0,4,2,4,0,255,252,248,240,225,226,212,204,0,3,7,15,30,28,40,48,251,247,251,247,251,245,250,251,4,0,4,0,4,2,5,4,251,247,251,247,251,87,171,251,4,0,4,0,4,0,84,4,0,1,1,127,0,0,0,0,255,254,254,128,0,0,0,0,255,63,31,15,135,71,11,51,0,192,224,240,120,56,52,12,0,0,0,1,2,2,126,255,255,255,255,254,253,253,129,0,0,1,1,193,1,3,31,255,255,254,254,62,254,252,224,0,251,247,251,247,251,245,250,247,4,0,4,0,4,2,4,0,251,247,123,246,125,62,84,8,4,0,4,0,0,0,0,0,127,255,191,144,31,127,127,127,127,192,192,239,111,15,31,127,254,254,254,24,24,30,142,224,254,3,3,231,230,224,240,254,127,127,127,127,127,127,240,0,127,127,127,127,127,0,255,255,248,248,248,248,128,254,0,0,254,254,254,254,254,0,255,255,4,0,4,0,4,2,5,0,0,0,0,0,0,0,0,0,4,0,4,0,4,0,84,8,0,0,0,0,0,0,0,0,4,0,4,0,4,128,84,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,8,0,0,0,0,0,0,0,7,0,0,0,0,0,0,240,16,0,0,0,0,0,0,0,224,8,8,8,8,8,8,8,9,7,7,7,7,7,7,7,6,96,16,96,0,0,0,0,128,240,224,240,248,252,254,254,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,56,56,56,56,0,56,0,56,56,56,56,56,0,56,0,238,238,204,0,0,0,0,0,238,238,204,0,0,0,0,0,0,110,255,255,126,60,24,0,0,108,254,254,124,56,16,0,60,98,253,229,137,151,70,60,0,60,66,122,118,110,60,0,60,127,119,63,30,60,60,28,60,102,102,60,24,56,56,0,120,236,236,254,236,236,126,0,120,236,236,254,236,236,126,0,56,56,48,0,0,0,0,0,56,56,48,0,0,0,0,0,0,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,255,255,0,0,0,255,0,0,0,255,255,255,255,0,0,122,190,254,254,174,150,196,120,2,122,122,122,122,122,58,2,94,125,127,127,43,101,35,30,64,94,94,94,94,94,92,64,0,0,0,0,0,56,56,48,0,0,0,0,0,56,56,48,0,0,0,126,126,0,0,0,0,0,0,126,126,0,0,0,0,0,0,0,0,24,24,0,0,0,0,0,0,24,24,0,0,0,0,0,1,4,1,30,0,0,0,0,0,3,0,1,56,124,238,238,238,124,56,0,56,124,238,238,238,124,56,0,56,120,248,56,56,56,254,0,56,120,248,56,56,56,254,0,252,254,30,124,240,254,254,0,252,254,30,124,240,254,254,0,252,254,14,60,14,254,252,0,252,254,14,60,14,254,252,0,62,126,238,238,254,254,14,0,62,126,238,238,254,254,14,0,254,254,224,252,14,254,252,0,254,254,224,252,14,254,252,0,124,252,224,252,238,254,124,0,124,252,224,252,238,254,124,0,126,126,14,30,60,120,112,0,126,126,14,30,60,120,112,0,124,254,238,124,238,254,124,0,124,254,238,124,238,254,124,0,124,254,238,126,14,124,120,0,124,254,238,126,14,124,120,0,0,0,56,56,0,56,56,0,0,0,56,56,0,56,56,0,0,0,56,56,0,56,56,48,0,0,56,56,0,56,56,48,31,64,130,140,48,7,63,127,0,63,125,115,207,255,255,174,0,126,127,63,126,127,63,0,0,126,126,0,126,126,0,0,128,96,144,72,8,8,136,192,0,128,96,240,240,240,240,248,124,126,14,28,0,28,28,0,124,126,14,28,0,28,28,0,124,198,146,138,146,198,124,0,124,198,146,138,146,198,124,0,124,254,238,254,254,238,238,0,124,254,238,254,254,238,238,0,252,254,238,252,238,254,252,0,252,254,238,252,238,254,252,0,126,254,224,224,224,254,126,0,126,254,224,224,224,254,126,0,248,252,238,238,238,252,248,0,248,252,238,238,238,252,248,0,254,254,224,248,224,254,254,0,254,254,224,248,224,254,254,0,254,254,224,248,224,224,224,0,254,254,224,248,224,224,224,0,126,254,224,238,238,254,126,0,126,254,224,238,238,254,126,0,238,238,254,254,238,238,238,0,238,238,254,254,238,238,238,0,124,124,56,56,56,124,124,0,124,124,56,56,56,124,124,0,14,14,14,14,30,124,120,0,14,14,14,14,30,124,120,0,238,238,252,248,252,238,238,0,238,238,252,248,252,238,238,0,224,224,224,224,224,254,254,0,224,224,224,224,224,254,254,0,198,238,254,254,254,238,238,0,198,238,254,254,254,238,238,0,252,254,238,238,238,238,238,0,252,254,238,238,238,238,238,0,124,254,238,238,238,254,124,0,124,254,238,238,238,254,124,0,252,254,238,254,252,224,224,0,252,254,238,254,252,224,224,0,124,254,238,238,252,254,110,0,124,254,238,238,252,254,110,0,252,254,238,252,254,238,238,0,252,254,238,252,254,238,238,0,126,254,240,124,30,254,252,0,126,254,240,124,30,254,252,0,254,254,56,56,56,56,56,0,254,254,56,56,56,56,56,0,238,238,238,238,238,254,124,0,238,238,238,238,238,254,124,0,238,238,238,238,254,124,56,0,238,238,238,238,254,124,56,0,238,238,238,254,254,238,198,0,238,238,238,254,254,238,198,0,238,238,124,56,124,238,238,0,238,238,124,56,124,238,238,0,238,238,254,124,56,56,56,0,238,238,254,124,56,56,56,0,254,254,28,56,112,254,254,0,254,254,28,56,112,254,254,0,126,126,112,112,112,126,126,0,126,126,112,112,112,126,126,0,64,224,112,56,28,14,4,0,64,224,112,56,28,14,4,0,126,126,14,14,14,126,126,0,126,126,14,14,14,126,126,0,16,56,124,254,254,56,56,0,16,56,124,254,254,56,56,0,24,66,60,189,189,60,66,24,0,60,126,126,126,126,60,0,0,0,0,4,8,8,16,17,0,0,0,3,7,7,15,15,0,0,0,0,0,0,128,240,0,0,0,240,248,252,252,108,117,151,179,167,143,93,60,62,15,111,77,88,117,47,11,17,248,104,240,224,240,240,64,72,108,248,240,208,224,184,184,176,56,60,60,24,8,8,8,9,23,27,27,7,7,7,7,6,104,24,96,0,0,0,0,128,248,232,240,248,252,254,254,126,0,0,4,8,8,16,17,117,0,0,3,7,7,15,15,15,0,0,0,0,0,128,240,248,0,0,240,248,252,252,108,108,151,179,167,142,93,60,62,59,111,77,88,119,47,11,17,17,104,240,224,240,240,64,72,248,248,240,208,224,184,184,176,232,60,60,24,8,8,8,9,0,27,27,7,7,7,7,6,0,104,16,96,0,0,0,0,128,248,224,240,248,252,254,254,126,0,0,2,4,4,8,8,10,0,0,1,3,3,7,7,7,0,0,0,0,0,64,248,252,0,0,248,252,254,254,182,182,59,73,91,87,79,46,30,29,7,54,36,43,54,21,9,8,180,248,240,248,240,248,32,36,252,248,104,240,248,220,220,220,30,30,12,4,4,4,4,0,13,13,3,3,3,3,3,0,52,8,48,0,0,0,128,64,252,240,248,252,254,255,127,63,0,4,8,8,16,113,149,183,0,3,7,7,15,15,111,79,0,0,0,0,128,240,248,104,0,240,248,252,252,108,108,248,163,135,93,61,28,58,61,63,93,120,39,15,19,17,27,24,240,224,240,240,64,72,252,252,240,208,224,184,184,176,12,108,28,24,8,8,8,8,8,9,3,7,7,7,7,7,7,6,16,96,0,0,0,0,0,128,224,240,248,252,254,254,254,0,0,4,8,24,112,145,181,167,0,3,7,7,15,111,79,95,131,102,60,124,119,125,123,63,125,27,31,35,35,51,54,0,240,64,64,64,248,240,252,252,240,240,184,184,224,224,12,108,56,8,8,8,8,8,8,9,7,7,7,7,7,7,7,6,0,0,0,0,0,2,4,4,0,0,0,0,0,1,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,248,252,254,8,56,74,91,65,62,125,116,7,7,55,39,62,31,35,35,64,248,252,180,248,64,240,64,254,182,182,252,248,240,184,184,125,124,56,8,8,8,9,0,50,51,7,7,7,7,6,0,184,96,0,0,0,0,128,0,72,240,248,252,254,254,126,0,0,0,0,16,32,32,66,71,0,0,0,15,31,31,63,61,0,0,0,0,0,0,0,192,0,0,0,192,224,240,240,176,87,157,207,207,155,123,56,60,61,127,55,51,111,31,23,19,224,160,192,128,224,224,128,144,176,224,64,64,192,112,112,96,62,30,12,8,8,8,8,9,13,13,3,7,7,7,7,6,0,0,0,1,2,2,4,52,0,0,0,0,1,1,3,3,0,0,0,0,0,0,16,62,0,0,0,252,254,255,255,237,73,81,83,71,39,14,14,31,55,47,44,59,27,7,5,8,190,236,254,216,120,248,32,36,237,254,120,96,240,220,220,216,7,24,39,79,86,175,184,177,0,7,24,51,47,92,95,95,224,216,236,22,42,215,231,207,0,224,24,236,244,58,186,122,227,229,171,84,105,55,31,7,94,94,94,47,55,24,7,0,157,61,117,234,210,228,24,224,250,250,250,244,236,24,224,0,15,31,48,103,104,104,103,55,0,15,31,56,48,48,56,31,240,248,4,242,26,26,242,228,0,240,248,28,12,12,28,248,24,31,63,56,34,24,34,31,15,1,29,23,29,7,29,0,8,112,64,64,64,64,64,192,240,128,128,128,128,128,128,0,0,28,34,65,136,144,144,128,0,0,28,62,127,127,127,127,0,112,136,4,2,2,2,2,0,0,112,248,252,252,252,252,64,64,32,16,8,4,2,1,63,63,31,15,7,3,1,0,4,4,8,16,32,64,128,0,248,248,240,224,192,128,0,0,1,3,3,7,7,255,253,125,0,1,1,3,3,7,127,63,0,128,128,192,192,254,126,124,0,0,0,128,128,192,252,248,63,27,60,63,127,126,248,224,31,15,31,31,62,56,96,0,248,176,120,248,252,252,62,14,240,224,240,240,248,56,12,0,0,0,7,63,127,247,251,245,0,0,31,127,255,238,230,234,0,0,224,252,254,183,255,255,0,0,248,254,255,207,183,183,251,253,127,63,7,3,3,6,236,238,255,127,31,3,3,7,255,183,254,252,224,128,0,0,183,207,255,254,248,128,128,0,7,63,127,255,255,255,255,255,31,127,157,234,218,186,141,255,224,252,254,255,255,255,199,187,248,254,255,255,255,199,187,69,255,255,127,63,7,1,0,0,255,255,255,127,31,1,1,0,139,147,198,252,224,192,192,96,117,109,187,198,248,192,192,224,7,201,115,215,247,124,61,27,0,7,205,173,45,39,22,4,130,199,235,239,254,116,120,64,0,130,69,68,68,216,192,128,15,127,141,239,253,239,199,0,0,15,98,87,74,199,0,0,128,192,128,240,232,244,222,30,0,128,0,128,48,200,8,14,207,115,231,175,47,56,26,22,0,207,154,26,26,15,13,9,0,130,199,203,207,254,212,248,0,0,130,133,132,132,184,0,31,31,13,127,157,239,255,224,0,15,2,15,98,95,64,192,0,192,152,164,254,255,222,0,0,128,0,24,40,206,0,0,0,7,15,47,47,111,119,123,7,8,48,82,82,147,138,132,0,128,192,216,216,220,252,252,128,64,56,164,164,226,66,2,127,127,111,71,4,12,56,32,128,128,144,168,75,50,68,88,252,252,204,196,96,32,32,48,2,2,50,42,148,80,80,72,0,3,7,7,7,71,119,123,3,4,8,9,73,185,137,132,0,192,224,224,224,244,252,252,192,32,16,80,84,234,34,2,127,127,111,119,58,58,2,3,128,128,144,136,69,69,61,4,252,252,220,252,184,184,128,192,2,2,34,2,68,68,120,32,31,112,227,199,199,199,227,112,0,15,28,59,58,59,28,15,240,2,108,253,113,241,96,2,0,252,158,110,206,110,158,252,31,18,36,32,16,0,0,0,0,18,36,36,24,0,0,0,240,44,48,130,132,64,0,64,0,172,178,130,132,64,32,64,31,4,0,0,2,2,4,0,0,4,4,2,2,2,4,0,240,16,16,128,160,160,144,0,0,144,144,144,160,160,144,0,255,255,0,255,6,1,1,3,255,255,255,0,1,7,7,0,2,3,2,0,4,2,1,0,1,0,1,4,4,2,1,0,2,3,2,3,3,1,0,0,1,0,1,0,0,0,0,0,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,1,1,3,3,3,3,7,14,255,255,255,255,255,255,255,255,0,0,0,0,1,7,15,15,254,252,254,254,248,224,193,135,28,48,0,12,240,192,128,0,0,0,0,0,0,56,241,231,0,0,0,0,0,0,32,64,0,0,31,0,120,255,255,255,0,0,0,0,24,32,64,0,0,0,0,63,0,224,255,255,0,0,224,0,0,96,128,0,0,0,0,128,60,3,0,240,0,0,0,120,3,0,0,192,0,0,0,0,0,0,64,0,0,0,0,0,0,192,32,16,255,254,252,252,249,251,251,255,30,28,28,24,8,0,0,0,31,63,127,255,255,255,255,255,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,64,128,128,0,0,0,0,0,255,255,255,255,255,254,254,254,0,1,1,1,0,0,2,2,255,254,252,248,240,224,192,192,3,4,8,16,32,64,64,0,128,128,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,16,16,16,4,36,36,0,0,0,0,0,0,0,0,8,0,4,4,0,2,2,2,0,0,0,0,0,0,0,0,24,14,15,15,14,14,30,62,24,26,27,31,31,62,50,124,0,0,3,7,7,15,31,31,0,1,7,15,31,63,127,127,124,252,252,236,192,128,128,0,252,252,220,216,128,128,0,0,0,0,0,0,0,0,0,126,0,0,0,0,0,0,0,0,0,56,124,223,191,184,119,239,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,114,0,0,0,0,0,0,0,0,224,96,163,23,206,110,142,238,0,0,0,0,0,0,0,0,0,0,192,32,3,6,13,13,0,0,0,0,0,0,0,0,0,0,63,255,255,248,239,223,0,0,0,0,0,0,0,0,0,0,128,224,248,28,236,246,0,0,0,0,0,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,252,252,252,252,252,252,252,252,4,4,4,4,4,4,4,4,255,255,31,3,0,0,0,0,0,0,0,0,0,0,0,0,252,252,254,254,254,127,15,3,0,0,2,0,0,0,0,0,0,0,0,0,129,134,192,224,0,0,0,0,128,128,192,192,36,72,72,136,16,16,32,64,0,0,1,1,1,1,1,0,240,252,127,63,7,0,128,224,224,248,255,127,31,15,3,0,128,0,248,249,255,63,7,0,0,1,251,251,255,255,255,255,31,30,30,0,0,0,0,16,254,254,252,253,251,247,240,143,1,67,0,15,31,31,15,55,0,0,120,224,192,128,32,112,12,63,255,255,255,255,255,0,127,255,255,255,255,255,255,255,187,189,190,254,255,255,128,0,120,124,254,254,255,255,255,255,255,255,127,159,239,255,254,254,0,0,0,0,0,0,0,0,111,191,189,223,151,111,222,94,0,0,0,0,0,0,0,128,254,254,255,255,127,127,31,7,0,0,0,0,0,0,0,0,29,141,109,152,180,176,136,249,192,64,0,0,0,2,67,3,246,251,251,253,158,127,255,255,0,0,0,0,0,0,0,0,25,51,246,255,119,242,251,249,0,6,6,14,14,5,1,3,255,248,246,239,237,99,59,135,0,0,7,15,13,3,131,199,251,251,59,155,205,235,224,241,3,3,3,195,225,225,246,246,255,64,255,255,97,230,231,239,0,0,0,0,240,231,231,231,246,62,254,242,226,2,2,2,0,0,0,0,8,216,248,200,255,255,248,231,223,215,253,40,255,254,252,231,199,207,254,112,28,16,36,6,130,10,19,3,152,144,132,206,222,182,111,31,0,0,240,255,255,231,195,131,0,0,0,0,0,0,24,48,0,0,0,0,248,255,255,255,0,0,0,0,0,0,0,0,1,7,15,15,31,31,31,31,0,0,0,0,0,0,0,0,31,0,7,31,63,127,127,255,0,0,0,0,0,0,0,0,32,0,248,255,255,255,255,255,31,0,0,0,0,0,0,0,0,96,0,255,255,255,255,255,255,31,0,0,0,0,0,0,0,2,0,0,255,255,255,255,255,252,0,0,0,0,0,0,0,192,32,12,129,252,255,255,0,0,0,0,0,0,0,0,3,1,0,0,192,24,240,252,3,3,1,0,0,0,0,0,254,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,255,255,3,0,0,2,0,3,255,255,255,127,31,1,0,0,240,248,254,127,31,3,64,136,250,252,255,255,255,255,63,7,15,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,240,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,135,127,140,210,255,255,251,11,0,0,0,225,255,255,251,255,193,192,19,127,255,254,249,33,31,0,15,255,255,254,240,207,128,0,255,255,255,255,255,255,127,0,0,0,0,0,0,0,135,14,24,75,75,135,255,255,63,127,104,40,40,0,0,0,24,55,248,254,224,51,204,121,120,255,248,255,240,56,14,0,127,63,255,127,255,255,255,255,0,128,0,0,0,0,0,0,127,127,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,1,3,1,1,0,0,0,0,1,3,1,1,0,0,0,64,64,254,90,94,0,0,0,64,64,254,90,94,0,0,0,0,0,82,85,173,7,31,63,124,0,82,85,173,0,0,0,0,128,46,218,218,224,248,252,30,128,46,218,218,0,0,0,0,64,245,85,85,0,0,0,0,64,245,85,85,0,0,0,0,0,142,248,222,0,0,0,0,0,142,248,222,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,88,94,0,0,0,0,0,0,88,94,0,0,0,0,0,0,173,170,1,6,0,0,0,0,173,170,1,6,112,63,0,7,218,170,0,0,0,0,0,0,218,170,0,0,254,252,0,224,85,95,0,0,0,0,0,0,85,95,0,0,0,0,0,0,210,222,0,0,0,0,0,0,210,222,0,0,0,0,0,0,32,80,128,128,143,139,135,79,31,63,127,127,112,113,123,51,127,127,123,63,222,223,239,255,174,174,191,223,47,240,255,239,215,3,53,55,3,3,255,255,248,255,206,203,252,255,217,220,0,128,192,224,224,224,224,224,0,0,128,192,192,192,192,192,55,7,7,7,7,7,7,6,3,3,3,3,3,3,3,3,112,208,224,192,207,160,128,241,239,111,31,63,48,31,31,14,31,15,31,15,255,30,30,158,236,245,243,247,7,239,239,111,224,240,248,120,248,248,248,248,0,224,240,240,112,240,240,240,13,11,13,9,11,15,15,31,7,6,6,6,5,3,7,15,192,128,192,240,249,252,254,251,63,127,63,207,246,251,253,254,30,31,31,47,239,63,63,47,239,238,238,222,30,222,222,221,248,240,240,240,224,224,224,224,240,224,224,224,192,192,192,192,29,63,55,127,127,127,127,62,14,27,31,63,63,63,63,31,255,223,255,255,255,244,208,192,62,224,255,255,252,248,224,0,63,255,255,255,253,3,0,0,195,124,255,255,3,0,0,0,240,254,254,244,248,144,0,0,224,112,188,184,144,0,0,0];

		
		var raw1 = new Uint8Array(temp2);
		console.log(raw1);
		nesController.load(raw1.buffer);
	});
}());

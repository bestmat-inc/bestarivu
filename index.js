// ©2024 - BestArivu - BestMat, Inc. - All rights reserved.
//©2024 - BestLang - BestDeveloper - BestMat, Inc. - All rights reserved
import vm from "vm";

class SrcLoc {
    constructor(pos, line, call, file) {
        this.pos = pos;
        this.line = line;
        this.call = call;
        this.file = file;
    }

    static new(pos, line, call, file) {
        return new SrcLoc(pos, line, call, file);
    }
}

const TokenTypes = {
    Number: "Number",
    String: "String",
    Boolean: "Boolean",
    Keyword: "Keyword",
    Nil: "Nil",
    Symbol: "Symbol",
    LParen: "LParen",
    RParen: "RParen"
};

class Token {
    constructor(type, value, srcloc) {
        this.type = type;
        this.value = value;
        this.srcloc = srcloc;
      }
    
      static new(type, value, srcloc) {
        return new Token(type, value, srcloc);
      }
}

import file_system from "./stdlib/fs.cjs";

const isDot = (ch) => /\./.test(ch);
const isDigit = (ch) => /\d/.test(ch);
const isWhitespace = (ch) => /[\s,]/.test(ch);
const isSemicolon = (ch) => /;/.test(ch);
const isNewline = (ch) => /\n/.test(ch);
const isDash = (ch) => /\-/.test(ch);
const isDoubleQuote = (ch) => /"/.test(ch);
const isColon = (ch) => /:/.test(ch);
const isSymbolStart = (ch) => /[=<>%:|?\\/*\p{L}_$!+-]/u.test(ch);
const isSymbolChar = (ch) => /[:=@~<>%:&|?\\/^*&#'\p{L}\p{N}_$!+-]/u.test(ch);
const isLParen = (ch) => /\(/.test(ch);
const isRParen = (ch) => /\)/.test(ch);

const isNumber = (str) => /^[+-]?\d+(\.\d+)?$/.test(str);
const isBoolean = (str) => /true|false/.test(str);
const isNil = (str) => /nil/.test(str);

class InputStream {
    constructor(input, file) {
        this.input = input;
        this.file = file;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
    }

    static new(input, file) {
        return new InputStream(input, file);
    }

    get length() {
        return this.input.length;
    }

    eof() {
        return this.pos >= this.length;
    }

    lookahead(n = 1) {
        return this.input[this.pos + n];
    }

    next() {
        const ch = this.input[this.pos++];
    
        if (isNewline(ch)) {
          this.line++;
          this.col = 1;
        } else {
          this.col++;
        }
    
        return ch;
    }

    peek() {
        return this.input[this.pos];
    }

    readWhile(pred) {
        let str = "";
        while (pred(this.peek())) {
          str += this.next();
        }
    
        return str;
      }
}

class Exception extends Error {
    constructor(message) {
        super(message);
    }
} 

class SyntaxException extends Exception {
    constructor(value, srcloc) {
        super(
          `BestLang: Syntax Exception: invalid syntax ${value} found at ${srcloc.file} (${srcloc.line}:${srcloc.col}).`
        );
     }
}

class Lexer {
    constructor(input) {
        this.input = input;
    }

    static new(input) {
        return new Lexer(input);
    }

    readNumber() {
        let { pos, line, col, file } = this.input;
        const srcloc = SrcLoc.new(pos, line, col, file);
        let num = "";
    
        if (isDash(this.input.peek())) {
          num += this.input.next();
        }
    
        num += this.input.readWhile((ch) => isDigit(ch) || isDot(ch));
    
        if (!isNumber(num)) {
          throw new SyntaxException(num, srcloc);
        }
    
        return Token.new(TokenTypes.Number, num, srcloc);
    }

    tokenize() {
        let tokens = [];

        while (!this.input.eof()) {
          let ch = this.input.peek();

          if (isWhitespace(ch)) {
            this.input.readWhile(isWhitespace);
          } else if (isSemicolon(ch)) {
            this.input.readWhile((ch) => !isNewline(ch) && !this.input.eof());
          } else if (isDash(ch) && isDigit(this.input.lookahead(1))) {
            tokens.push(this.readNumber());
          } else if (isDigit(ch)) {
            tokens.push(this.readNumber());
          } else if (isDoubleQuote(ch)) {
            tokens.push(this.readString());
          } else if (isColon(ch)) {
            tokens.push(this.readKeyword());
          } else if (isSymbolStart(ch)) {
            tokens.push(this.readSymbol());
          } else if (isLParen(ch)) {
            const { pos, line, col, file } = this.input;
            
            this.input.next();

            tokens.push(
              Token.new(TokenTypes.LParen, ch, SrcLoc.new(pos, line, col, file))
            );
          } else if (isRParen(ch)) {
            const { pos, line, col, file } = this.input;
            
            this.input.next();

            tokens.push(
              Token.new(TokenTypes.RParen, ch, SrcLoc.new(pos, line, col, file))
            );
          } else {
            const { pos, line, col, file } = this.input;
            
            throw new SyntaxException(ch, SrcLoc.new(pos, line, col, file));
          }
        }
    
        return tokens;
    }

    readString() {
        let { pos, line, col, file } = this.input;
        const srcloc = SrcLoc.new(pos, line, col, file);
        let str = this.input.next();
    
        str += this.readEscaped();
        return Token.new(TokenTypes.String, str, srcloc);
    }

    readEscaped() {
        let str = "";
        let escaped = false;
        let ended = false;
    
        while (!this.input.eof()) {
          let ch = this.input.next();
    
          if (escaped) {
            str += this.readEscapeSequence(ch);
            escaped = false;
          } else if (ch === "\\") {
            escaped = true;
          } else if (isDoubleQuote(ch)) {
            ended = true;
            str += ch;
            break;
          } else if (ch === "\n") {
            throw new Exception(
              "Unexpected newline in nonterminated single-line string literal"
            );
          } else if (ch === "`") {
            str += "\\`";
          } else {
            str += ch;
          }
        }
    
        if (!ended && this.input.eof()) {
          throw new Exception(
            "Expected double quote to close string literal; got EOF"
          );
        }
    
        return str;
    }

    readEscapeSequence(c) {
        let str = "";
        let seq = "";
    
        if (c === "n") {
          str += "\n";
        } else if (c === "b") {
          str += "\b";
        } else if (c === "f") {
          str += "\f";
        } else if (c === "r") {
          str += "\r";
        } else if (c === "t") {
          str += "\t";
        } else if (c === "v") {
          str += "\v";
        } else if (c === "0") {
          str += "\0";
        } else if (c === "'") {
          str += "'";
        } else if (c === '"') {
          str += '"';
        } else if (c === "\\") {
          str += "\\";
        } else if (c === "u" || c === "U") {
          seq += this.input.readWhile(isHexDigit);
          str += String.fromCodePoint(parseInt(seq, 16));
        }
    
        return str;
    }

    readKeyword() {
        let { pos, line, col, file } = this.input;
        const srcloc = SrcLoc.new(pos, line, col, file);
        const kw = this.input.next() + this.input.readWhile(isSymbolChar);
    
        return Token.new(TokenTypes.Keyword, kw, srcloc);
    }

  readSymbol() {
    let { pos, line, col, file } = this.input;
    const srcloc = SrcLoc.new(pos, line, col, file);
    const sym = this.input.readWhile(isSymbolChar);

    if (isBoolean(sym)) {
      return Token.new(TokenTypes.Boolean, sym, srcloc);
    } else if (isNil(sym)) {
      return Token.new(TokenTypes.Nil, sym, srcloc);
    }

    return Token.new(TokenTypes.Symbol, sym, srcloc);
  }
}

function tokenize(input, file) {
    return Lexer.new(InputStream.new(input, file)).tokenize();
}

class Reader {
    constructor(tokens){ 
        this.tokens = tokens;
        this.pos = 0;
    }

    static new(tokens) {
        return new Reader(tokens);
    }
    
    get length() {
        return this.tokens.length;
    }

    eof() {
        return this.pos >= this.length;
    }
    
    next() {
        return this.tokens[this.pos++];
    }
    
    peek() {
        return this.tokens[this.pos];
    }
    
    skip() {
        this.pos++;
    }
}

const readAtom = (reader) => {
    const tok = reader.peek();
  
    switch (tok.type) {
      case TokenTypes.Number:
        reader.skip();
        return tok;
      case TokenTypes.String:
        reader.skip();
        return tok;
      case TokenTypes.Boolean:
        reader.skip();
        return tok;
      case TokenTypes.Keyword:
        reader.skip();
        return tok;
      case TokenTypes.Nil:
        reader.skip();
        return tok;
      default:
        throw new SyntaxException(tok.value, tok.srcloc);
    }
};

const readForm = (reader) => {
  const tok = reader.peek();

  switch (tok.type) {
    case TokenTypes.RParen:
      throw new SyntaxException(tok.value, tok.srcloc);
    case TokenTypes.LParen:
      return readList(reader);
    default:
      return readAtom(reader);
  }
};

const read = (tokens) => {
  const reader = Reader.new(tokens);

  const form =
    reader.length === 0
      ? Token.new(TokenTypes.Nil, "nil", SrcLoc.new(0, 1, 1, "reader"))
      : readExpr(reader);
  let parseTree = cons(form, null);

  while (!reader.eof()) {
    parseTree.append(readExpr(reader));
  }

  return parseTree;
};

const readExpr = (reader) => {
  return readForm(reader);
};

const readList = (reader) => {
  let tok = reader.next();
  let srcloc = tok.srcloc;

  if (tok.type !== TokenTypes.LParen) {
    throw new SyntaxException(tok.value, tok.srcloc);
  }

  tok = reader.peek();

  if (tok.type === TokenTypes.RParen) {
    reader.skip();
    return Token.new(TokenTypes.Nil, "nil", tok.srcloc);
  }

  let list = cons(readExpr(reader), null);
  list.srcloc = srcloc;

  let lastTok = tok;
  tok = reader.peek();

  while (tok?.type !== TokenTypes.RParen) {
    if (!tok) {
      throw new Exception(
        `Expected ); got EOF at ${lastTok.srcloc.line}:${lastTok.srcloc.col}`
      );
    }

    list.append(readExpr(reader));
    lastTok = tok;
    tok = reader.peek();
  }
  reader.skip();

  return list;
};

class ConsReader {
  constructor(forms) {
    this.forms = forms;
    this.pos = 0;
  }

  static new(forms) {
    return new ConsReader(forms);
  }

  get length() {
    return [...this.forms].length;
  }

  eof() {
    return this.pos >= this.length;
  }

  next() {
    return this.forms.get(this.pos++);
  }
}

const expand = parseTree => parseTree;

const ASTTypes = {
    Program: "Program",
    NumberLiteral: "NumberLiteral",
    StringLiteral: "StringLiteral",
    BooleanLiteral: "BooleanLiteral",
    KeywordLiteral: "KeywordLiteral",
    NilLiteral: "NilLiteral",  
    Symbol: "Symbol",
    CallExpression: "CallExpression"
}

const AST = {
    Program(exprs) {
        return {
            type: ASTTypes.Program,
            body: exprs,
            srcloc: exprs[0]?.srcloc ?? SrcLoc.new(0, 0, 0, "none"),
        };
    },

    NumberLiteral(token) {
        return {
            type: ASTTypes.NumberLiteral,
            value: token.value,
            srcloc: token.srcloc,
      };
    },

    StringLiteral(token) {
        return {
          type: ASTTypes.StringLiteral,
          value: token.value,
          srcloc: token.srcloc,
        };
    },

    BooleanLiteral(token) {
        return {
          type: ASTTypes.BooleanLiteral,
          value: token.value,
          srcloc: token.srcloc,
        };
    },

    KeywordLiteral(token) {
        return {
          type: ASTTypes.KeywordLiteral,
          value: token.value,
          srcloc: token.srcloc,
        };
    },

    NilLiteral(token) {
        return {
          type: ASTTypes.NilLiteral,
          value: token.value,
          srcloc: token.srcloc,
        };
    },

    Symbol(token) {
      return {
        type: ASTTypes.Symbol,
        name: token.value,
        srcloc: token.srcloc,
      };
    },
  
    CallExpression(func, args, srcloc) {
      return {
        type: ASTTypes.CallExpression,
        func,
        args,
        srcloc,
      };
    }
};

const parsePrimitive = (token) => {
  switch (token.type) {
    case TokenTypes.Number:
      return AST.NumberLiteral(token);
    case TokenTypes.String:
      return AST.StringLiteral(token);
    case TokenTypes.Boolean:
      return AST.BooleanLiteral(token);
    case TokenTypes.Keyword:
      return AST.KeywordLiteral(token);
    case TokenTypes.Nil:
      return AST.NilLiteral(token);
    case TokenTypes.Symbol:
      return AST.Symbol(token);
    default:
      throw new SyntaxException(token.value, token.srcloc);
  }
};

function parseExpr (form) {
    if (form instanceof Cons) {
      return parseList(form);
    }
  
    return parsePrimitive(form);
};
  
function parse (readTree) {
  let body = [];
  const reader = ConsReader.new(readTree);

  while (!reader.eof()) {
    body.push(parseExpr(reader.next()));
  }

  return AST.Program(body);
};

const parseList = (form) => {
  const [first] = form;

  switch (first.value) {
    default:
      return parseCall(form);
  }
};

const parseCall = (callExpression) => {
  const [func, ...args] = callExpression;
  const srcloc = callExpression.srcloc;
  const parsedFunc = parseExpr(func);
  const parsedArgs = args.map(parseExpr);

  return AST.CallExpression(parsedFunc, parsedArgs, srcloc);
};

const desugar = ast => ast;

class Emitter {
  constructor(program, ns) {
    this.program = program;
    this.ns = ns;
  }

  static new(program, ns = new Namespace()) {
    return new Emitter(program, ns);
  }

  emit(node = this.program, ns = this.ns) {
    switch (node.type) {
      case ASTTypes.Program:
        return this.emitProgram(node, ns);
      case ASTTypes.NumberLiteral:
        return this.emitNumber(node, ns);
      case ASTTypes.StringLiteral:
        return this.emitString(node, ns);
      case ASTTypes.BooleanLiteral:
        return this.emitBoolean(node, ns);
      case ASTTypes.KeywordLiteral:
        return this.emitKeyword(node, ns);
      case ASTTypes.NilLiteral:
        return this.emitNil(node, ns);
      case ASTTypes.Symbol:
        return this.emitSymbol(node, ns);
      case ASTTypes.CallExpression:
        return this.emitCallExpression(node, ns);
      default:
        throw new SyntaxException(node.type, node.srcloc);
    }
  }

  emitBoolean(node, ns) {
    return node.value;
  }

  emitCallExpression(node, ns) {
    return `(${this.emit(node.func, ns)})(${node.args
      .map((a) => this.emit(a, ns))
      .join(", ")})`;
  }

  emitKeyword(node, ns) {
    return `Symbol.for("${node.value}")`;
  }

  emitNil(node, ns) {
    return "null";
  }

  emitNumber(node, ns) {
    return node.value;
  }

  emitProgram(node, ns) {
    let code = "(() => {\n";

    let i = 0;
    for (let n of node.body) {
      if (i === node.body.length - 1) {
        code += `  return ${this.emit(n, ns)}`;
      } else {
        code += `  ${this.emit(n, ns)};`;
      }

      i++;
    }

    code += "\n})();";

    return code;
  }

  emitString(node, ns) {
    return "`" + node.value.slice(1, -1) + "`";
  }

  emitSymbol(node, ns) {
    const name = node.name;
    const emittedName = ns.get(name);

    if (!emittedName) {
      throw new Exception(
        `The name ${name} has not been defined in ${node.srcloc.file} at ${node.srcloc.line}:${node.srcloc.col}`
      );
    }

    return emittedName;
  }
}

const emit = (ast, ns = undefined) => Emitter.new(ast, ns).emit();
const compile = (input, file = "stdin", ns = undefined) =>
  emit(desugar(parse(expand(read(tokenize(input, file))))), ns);

function EVAL(input, file = "global", ns = undefined){
  vm.runInThisContext(compile(input, file, ns));
}

const compileAndBuild = (
  code,
  {
    fileName = "stdin",
    contextCreator = emitGlobalEnv,
    nsCreator = makeGlobalNameMap,
    outName = "main.js",
    moduleName = "main",
  } = {}
) => {
  const contextCode = contextCreator();
  const compiledCode = `${contextCode}
  ${moduleName}.result = ${compile(code, fileName, nsCreator())}`;

  return build(compiledCode, outName, moduleName);
};

const print = (str) => {
  process.stdout.write(printString(str, true));
};

const printString = (value, withQuotes) => {
  switch (typeof value) {
    case "number":
      return String(value);
    case "string":
      return withQuotes ? `"${value}"` : value;
    case "symbol":
      return value.description.startsWith(":")
        ? value.description
        : `'${value.description}`;
    case "boolean":
      return String(value);
    case "undefined":
      return "nil";
    case "object":
      if (value === null) {
        return "nil";
      } else if (value.constructor?.name === "Cons") {
        return printList(value);
      }
    default:
      throw new Exception(`Invalid print value ${value}`);
  }
};

const printList = (list) => {
  let prStr = "'(";

  let i = 0;
  let length = [...list].length;
  for (let item of list) {
    if (i === length - 1) {
      prStr += printString(item);
    } else {
      prStr += `${printString(item)}, `;
    }
    i++;
  }

  prStr += ")";
  return prStr;
};

const prIndent = (indent) => " ".repeat(indent);

class Module {
  constructor(name, module, requires, nativeRequires) {
    this.name = name;
    this.module = module;
    this.requires = requires;
    this.nativeRequires = nativeRequires;
  }

  toString() {
    return `Module ${this.name}`;
  }
}

export const makeModule = (name, module, requires = [], nativeRequires = []) =>
  new Module(name, module, requires, nativeRequires);

export const isNIL = (val) => val == null;
export const isFalsy = (val) => val === false || isNil(val);
export const isTruthy = (val) => !isFalsy(val);

export const makeRuntime = () => {
  return {
    isFalsy,
    isNil,
    isTruthy,
    makeFunction,
  };
};

class ASTPrinter {
  constructor(program) {
    this.program = program;
  }

  static new(program) {
    return new ASTPrinter(program);
  }

  print(node = this.program, indent = 0) {
    switch (node.type) {
      case ASTTypes.Program:
        return this.printProgram(node, indent);
      case ASTTypes.NumberLiteral:
      case ASTTypes.StringLiteral:
      case ASTTypes.BooleanLiteral:
      case ASTTypes.KeywordLiteral:
      case ASTTypes.NilLiteral:
        return this.printPrimitive(node, indent);
      case ASTTypes.Symbol:
        return this.printSymbol(node, indent);
      case ASTTypes.CallExpression:
        return this.printCallExpression(node, indent);
      default:
        throw new Exception(`Unknown AST type ${node.type} to print`);
    }
  }

  printCallExpression(node, indent) {
    let prStr = `${prIndent(indent)}CallExpression\n`;
    prStr += `${prIndent(indent + 2)}Func:\n${this.print(
      node.func,
      indent + 4
    )}\n`;
    prStr += `${prIndent(indent + 2)}Args:\n`;

    for (let arg of node.args) {
      prStr += this.print(arg, indent + 4) + "\n";
    }

    return prStr;
  }

  printPrimitive(node, indent) {
    return `${prIndent(indent)}${node.type}: ${
      node.type === "NilLiteral" ? "nil" : node.value
    }`;
  }

  printProgram(node, indent) {
    let pStr = "";

    for (let n of node.body) {
      pStr += this.print(n, indent);
      +"\n";
    }

    return pStr;
  }

  printSymbol(node, indent) {
    return `${prIndent(indent)}Symbol: ${node.name}`;
  }
}

export class Namespace {
  constructor(parent = null, { name = "global" } = {}) {
    this.parent = parent;
    this.vars = new Map();
    this.name = name;
  }

  static new(parent = null, { name = "global" } = {}) {
    return new Namespace(parent, { name });
  }

  exists(name) {
    return this.lookup(name) !== null;
  }

  extend(name) {
    return new Namespace(this, { name });
  }

  get(name) {
    const scope = this.lookup(name);

    if (scope) {
      return scope.vars.get(name);
    }

    return undefined;
  }

  has(name) {
    return this.vars.has(name);
  }

  lookup(name) {
    let scope = this;

    while (scope !== null) {
      if (scope.vars.has(name)) {
        return scope;
      }

      scope = scope.parent;
    }

    return null;
  }

  set(key, value) {
    this.vars.set(key, value);
  }

  *[Symbol.iterator]() {
    for (let [k, v] of this.vars) {
      yield [k, v];
    }
  }
}

class Cons extends Array {
  constructor(car, cdr) {
    super(car, cdr);
  }

  get car() {
    return this[0];
  }

  get cdr() {
    return this[1];
  }

  set cdr(value) {
    this[1] = value;
  }

  append(value) {
    let list = this;
    let cdr = this.cdr;

    while (cdr !== undefined) {
      if (cdr instanceof Cons) {
        if (cdr.cdr === null) {
          cdr.cdr = cons(value, null);
          return list;
        }

        cdr = cdr.cdr;
      } else if (cdr === null) {
        this.cdr = cons(value, null);
        return list;
      } else {
        throw new Exception(
          "Cannot append item to improper list or pair whose tail is not nil"
        );
      }
    }

    throw new Exception(
      `Error trying to append ${
        typeof value === "object" ? JSON.stringify(value, null, 2) : value
      } to list`
    );
  }

  static of(first, ...args) {
    let list = cons(first, null);

    for (let arg of args) {
      list.append(arg);
    }

    return list;
  }

  *[Symbol.iterator]() {
    let value = this.car;
    let tail = this.cdr;

    while (tail !== undefined) {
      if (tail instanceof Cons) {
        yield value;
        value = tail.car;
        tail = tail.cdr;
      } else if (tail === null) {
        yield value;
        tail = undefined;
      } else {
        yield value;
        yield tail;
        tail = undefined;
      }
    }
  }

  get(n) {
    let i = 0;

    for (let value of this) {
      if (i === n) {
        return value;
      }
      i++;
    }

    return undefined;
  }
}

const printAST = (ast) => ASTPrinter.new(ast).print();
const cons = (car, cdr) => new Cons(car, cdr);

import readlineSync from "readline-sync";
import objectHash from "object-hash";

const PREFIX = "$BEST_";
export const makeSymbol = (str) => PREFIX + objectHash(str);

const READ = (prompt) => readlineSync.question(prompt);
const pprintDesugaredAST = (input, file = "stdin") => printAST(desugar(parse(expand(read(tokenize(input, file))))));

const pprintAST = (input, file = "stdin") => printAST(parse(expand(read(tokenize(input, file)))));

const fail = (msg, exn = Exception) => {
    throw new exn(msg);
};

export const repl = (mode = "repl") => {
    const compileEnv = makeGlobalNameMap();

    const globalCode = build(emitGlobalEnv());
    vm.runInThisContext(globalCode);

    let prompt = "bestlang > ";

    while (true) {
      try {
        const input = read(prompt);
  
        switch (input) {
          case ":quit":
            process.exit(0);
          case ":print-ast":
            mode = "printAST";
            break;
          case ":print-desugared":
            mode = "printDesugared";
            break;
          default:
            let compiled = compile(input, "stdin", compileEnv);
            let result = vm.runInThisContext(compiled);
  
            if (mode === "printAST") {
              console.log(pprintAST(input));
            } else if (mode === "printDesugared") {
              console.log(pprintDesugaredAST(input));
            }
  
            console.log(result);
        }
      } catch (e) {
        console.error(e.message);
      }
    }
};

export const run = () => {
    let mode = "";
    switch (process.argv[2]) {
      case "print":
        if (process.argv[3] === "-d") {
          mode = "printDesugared";
          break;
        } else if (process.argv[3] === "-a") {
          mode = "printAST";
          break;
        }
      case undefined:
      case "-i":
      case "repl":
        mode = "repl";
        break;
      default:
        throw new Exception("Invalid command specified");
    }
    
    repl(mode);
};

// BestLang Standard Library (bestlang-stdlib)
import equal from "fast-deep-equal/es6/index.js";
export const makeFunction = (func) => func;

export const theModule = makeModule("Core", (rt, ns) => {
  
  const isList = (obj) => {
    if (!rt.isNil(obj) && !(obj instanceof Cons)) {
      return false;
    } else if (obj == null) {
      return true;
    }

    return isList(obj.cdr);
  };

  return {
    print: rt.makeFunction(print),
    println: rt.makeFunction(print),
    cons,
    car: rt.makeFunction((pair) => pair.car),
    cdr: rt.makeFunction((pair) => pair.cdr),
    string: rt.makeFunction(printString),
    number: rt.makeFunction(Number),
    boolean: rt.makeFunction((val) => isTruthy(val)),
    symbol: rt.makeFunction((str) => Symbol.for(str)),
    keyword: rt.makeFunction((str) => Symbol.for(":" + str)),
    "+": rt.makeFunction((a, b, ...nums) =>
      nums.reduce((sum, n) => sum + n, a + b)
    ),
    "-": rt.makeFunction((a, b, ...nums) =>
      nums.reduce((diff, n) => diff - n, a - b)
    ),
    "*": rt.makeFunction((a, b, ...nums) =>
      nums.reduce((prod, n) => prod * n, a * b)
    ),
    "/": rt.makeFunction((a, b, ...nums) =>
      nums.reduce((quot, n) => quot / n, a / b)
    ),
    "%": rt.makeFunction((a, b, ...nums) =>
      nums.reduce((quot, n) => quot % n, a % b)
    ),
    "=": rt.makeFunction((a, b) => a === b),
    ">": rt.makeFunction((a, b) => a > b),
    ">=": rt.makeFunction((a, b) => a >= b),
    "<": rt.makeFunction((a, b) => a < b),
    "<=": rt.makeFunction((a, b) => a <= b),
    not: rt.makeFunction((x) => !x),
    list: rt.makeFunction((...args) => Cons.of(...args)),
    length: rt.makeFunction((obj) => {
      if (obj instanceof Cons) {
        let i = 0;
        for (let _ of obj) {
          i++;
        }
        return i;
      }

      return obj.length;
    }),
    get: rt.makeFunction((n, lst) => lst.get(n)),
    "list?": rt.makeFunction(isList),
    "pair?": rt.makeFunction((obj) => obj instanceof Cons),
    "number?": rt.makeFunction((obj) => typeof obj === "number"),
    "string?": rt.makeFunction((obj) => typeof obj === "string"),
    "boolean?": rt.makeFunction((obj) => typeof obj === "boolean"),
    "nil?": rt.makeFunction((obj) => obj == null),
    "keyword?": rt.makeFunction(
      (obj) => typeof obj === "symbol" && obj.description.startsWith(":")
    ),
    "equal?": rt.makeFunction((a, b) => equal(a, b)),
    "is?": rt.makeFunction((a, b) => Object.is(a, b)),
    append: rt.makeFunction((obj1, obj2) => {
      if (typeof obj1 === "string" && typeof obj2 === "string") {
        return obj1 + obj2;
      }
      return obj1.append(obj2);
    }),
  };
});

export const makeGlobal = () => {
  const globalNS = Namespace.new();
  const mod = theModule.module(makeRuntime());

  for (let [k, v] of Object.entries(mod)) {
    globalNS.set(makeSymbol(k), v);
  }

  return globalNS;
};

export const makeGlobalNameMap = () => {
  const globalNS = Namespace.new();
  const mod = theModule.module(makeRuntime());

  for (let [k] of Object.entries(mod)) {
    globalNS.set(k, makeSymbol(k));
  }

  return globalNS;
};

import path from "path";
import { fileURLToPath } from "url";

export const ROOT_URL = import.meta.url;
export const ROOT_PATH = fileURLToPath(path.dirname(ROOT_URL));


export const emitGlobalEnv = () => {
  const globalEnv = makeGlobal();
  let code = `
import { makeGlobal } from "${path.join(     ROOT_PATH,     "./src/runtime/makeGlobals.js"   )}";
const globalEnv = makeGlobal();
`;

  for (let [k] of globalEnv) {
    code += `${k} = globalEnv.get("${k}");\n`;
  }

  return code;
};

import { join } from "path";
import * as esbuild from "esbuild";

const build = (code, outName = "main.js", moduleName = "main") => {
  const tmpPath = join(ROOT_PATH, "./tmp");
  const outPath = join(tmpPath, "./out");

  if (!file_system.existsSync(tmpPath)) {
    file_system.mkdirSync(tmpPath);
  }

  if (!file_system.existsSync(outPath)) {
    file_system.mkdirSync(outPath);
  }

  const transformed = esbuild.transformSync(code);
  const outFile = join(tmpPath, outName);

  file_system.writeFileSync(outFile, transformed.code);

  esbuild.buildSync({
    entryPoints: [outFile],
    outdir: outPath,
    bundle: true,
    footer: { js: `${moduleName}.result` },
    format: "iife",
    banner: { js: `var ${moduleName} = {};\n` },
    platform: "node"
  });

  const builtCode = file_system.readFileSync(join(outPath, outName), {
    encoding: "utf-8",
  });

  file_system.rmSync(join(outPath, outName));
  file_system.rmSync(join(tmpPath, outName));
  file_system.rmdirSync(outPath);
  file_system.rmdirSync(tmpPath);

  return builtCode;
};

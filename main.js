function Cell(x, y, opened=false, flagged=false, mined=false, NMC=0) {
    return {
        pos: y+"-"+x,
        x: x,
        y: y,
        opened: opened,
        flagged: flagged,
        mined: mined,
        NMC: NMC,
    }
}

function getRandomInteger(min,max) { return Math.floor(Math.random()*(max-min))+min }

const TCs = [null,"#00f","#080","#f00","#1D0082","#800","#008483","#000","#888"]

class Board {
    constructor(row, column, mines) {
        this.row = row
        this.column = column
        this.mines = Math.min(mines, row*column-1)
        this.board = {}
        this.mine_pos = []
        this.game_over = false
        this.game_won = false
        this.got_mine = ""
        this.start = false
        this.time = 0
    }

    isMined(x,y) {
        let id = y+"-"+x
        let cell = this.board[id]
        if (cell) return cell.mined
    }

    create(row, column, mines) {
        if (row) this.row = row
        if (column) this.column = column
        if (mines) this.mines = Math.min(mines, row*column-1)
        
        this.got_mine = ""
        this.game_over = false
        this.game_won = false
        this.start = false
        this.time = 0
        this.board = {}
        this.mine_pos = []
        for (let y = 0; y < this.row; y++) for (let x = 0; x < this.column; x++) this.board[y+"-"+x] = Cell(x,y)
        this.assignMines()
        this.calcNMC()
        this.setupHTML()
        this.setupClickHTML()
        this.updateHTML()
    }

    assignMines() {
        for (let i = 0; i < this.mines; i++) {
            let [rx, ry] = [getRandomInteger(0,this.column), getRandomInteger(0,this.row)]
            let cell = ry+"-"+rx
            while (this.mine_pos.includes(cell)) {
                [rx, ry] = [getRandomInteger(0,this.column), getRandomInteger(0,this.row)]
                cell = ry+"-"+rx
            }
            this.board[cell].mined = true
            this.mine_pos.push(cell)
        }
    }

    calcNMC() {
        for (let y = 0; y < this.row; y++) for (let x = 0; x < this.column; x++) {
            let id = y+"-"+x
            let cell = this.board[id]
            if (!cell.mined) {
                cell.NMC = this.getNMines(x,y)
            }
        }
    }

    getNMines(x,y) {
        let n = 0
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i!=0||j!=0) {
            let id = (y+i)+"-"+(x+j)
            if (this.board[id]?this.board[id].mined:false) n++
        }
        return n
    }

    setupHTML(board='board') {
        let html = ""
        for (let y = 0; y < this.row; y++) {
            let table = `<div class="table">`
            for (let x = 0; x < this.column; x++) {
                table += `<div id="cell${y}-${x}" class="cell"></div>`
            }
            html += table + "</div>"
        }
        document.getElementById(board).innerHTML = html
    }

    setupClickHTML() {
        for (let y = 0; y < this.row; y++) {
            for (let x = 0; x < this.column; x++) {
                document.getElementById("cell"+y+"-"+x).onclick = _=>{this.leftClick(x,y,true)}
                document.getElementById("cell"+y+"-"+x).oncontextmenu = _=>{this.rightClick(x,y)}
            }
        }
    }

    updateHTML() {
        let f = 0
        for (let y = 0; y < this.row; y++) {
            for (let x = 0; x < this.column; x++) {
                let id = y+"-"+x
                let cell = this.board[id]
                let elem = document.getElementById("cell"+id)

                elem.style.backgroundColor = (cell.opened?true:this.game_over&&cell.mined&&!cell.flagged) ? this.got_mine == id ? "#f00" :"#fff" : "#888"
                elem.innerHTML = ""
                if (cell.flagged) {
                    f++
                    elem.innerHTML = "🚩"
                    if (this.game_over && !this.mine_pos.includes(id)) elem.style.backgroundColor = "#f88"
                } else if (cell.opened) {
                    if (cell.mined) elem.innerHTML = "💣"
                    else if (cell.NMC>0) {
                        elem.style.color = TCs[cell.NMC]
                        elem.innerHTML = cell.NMC
                    }
                } else if (this.game_over) {
                    if (cell.mined) elem.innerHTML = "💣"
                }
            }
        }
        document.getElementById("mines").textContent = this.mines - f
        document.getElementById("result").textContent = this.game_over ? "You lost!" : this.game_won ? "You won!" : ""
    }

    leftClick(x,y,update=false) {
        this.start = true
        if (!this.game_over&&!this.game_won) {
            let id = y+"-"+x
            let cell = this.board[id]
            if (cell.opened && cell.NMC>0 && update) {
                let n = 0
                for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i!=0||j!=0) {
                    let n_id = (y+i)+"-"+(x+j)
                    let n_cell = this.board[n_id]
                    if (n_cell?(!n_cell.opened&&n_cell.flagged):false) {
                        n++
                    }
                }
                if (n==cell.NMC) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i!=0||j!=0) {
                    let n_id = (y+i)+"-"+(x+j)
                    let n_cell = this.board[n_id]
                    if (n_cell?(!n_cell.opened):false) {
                        this.leftClick(x+j,y+i)
                    }
                }
            }
            if (!cell.opened && !cell.flagged) {
                cell.opened = true
                if (cell.mined) {
                    this.game_over = true
                    this.start = false
                    this.got_mine = id
                } else {
                    if (cell.NMC == 0) {
                        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (i!=0||j!=0) {
                            let n_id = (y+i)+"-"+(x+j)
                            let n_cell = this.board[n_id]
                            if (n_cell?(!n_cell.opened):false) {
                                n_cell.flagged = false
                                this.leftClick(x+j,y+i)
                            }
                        }
                    }
                }
            }
            if (update) {
                if (!this.game_over) this.checkMines()
                this.updateHTML()
            }
        }
    }

    rightClick(x,y) {
        if (!this.game_over&&!this.game_won) {
            let id = y+"-"+x
            let cell = this.board[id]
            if (!cell.opened) cell.flagged = !cell.flagged
            this.updateHTML()
        }
    }

    checkMines() {
        let i = 0
        for (let y = 0; y < this.row; y++) {
            for (let x = 0; x < this.column; x++) {
                let id = y+"-"+x
                let cell = this.board[id]
                if (!cell.opened) i++
            }
        }
        if (i <= this.mines) {
            this.game_won = true
            this.start = false
            for (let x = 0; x < this.mine_pos.length; x++) this.board[this.mine_pos[x]].flagged = true
        }
    }
}

var diff = 0;
var date = Date.now();
var board = new Board(9,9,10)

function loadGame() {
    board.create(
        Math.max(parseInt(document.getElementById("height").value),2),
        Math.max(parseInt(document.getElementById("width").value),2),
        parseInt(document.getElementById("s_mines").value)
    )
}

setInterval(_=>{
    diff = Date.now()-date;
    if (board.start) board.time += diff/1000
    document.getElementById("time").textContent = board.time.toFixed(1)
    date = Date.now();
},50)
const board = document.getElementById('board');
const pop = document.getElementById('population');
const iter = document.getElementById('iteration');
const ctx = board.getContext('2d');

// const boardL = document.getElementById('boardLeft');
// const ctxL = boardL.getContext('2d');
// const boardR = document.getElementById('boardRight');
// const ctxR = boardR.getContext('2d');

let hist = [];

let run = false;
let population = 0;

let hide_controls = false;

let darkmode = document.getElementById('set_darkmode').checked;
let ctxfill = darkmode ? "rgb(218, 218, 218)" : "rgb(0, 0, 0)";
// let side_ctxfill = darkmode ? "rgb(175, 175, 175)" : "rgb(50, 50, 50)";

let wrap = document.getElementById('wrap').checked;
$('.dir_wrap').prop('disabled', !wrap);
$('.dir_wrap').prop('checked', true);
let wrap_north = document.getElementById('wrap_north').checked;
let wrap_north_east = document.getElementById('wrap_north_east').checked;
let wrap_east = document.getElementById('wrap_east').checked;
let wrap_south_east = document.getElementById('wrap_south_east').checked;
let wrap_south = document.getElementById('wrap_south').checked;
let wrap_south_west = document.getElementById('wrap_south_west').checked;
let wrap_west = document.getElementById('wrap_west').checked;
let wrap_north_west = document.getElementById('wrap_north_west').checked;

let SEED_REFERENCE = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRTUVWXYZ!@#$%^&*+-=?.,[]{}()|_/\\"; //87 chars long; go up to 64?

let current_seed = '';
let density = 2 ** (-1*4);

const spawn_freq = 0.001;
const neighbor_freq = 0.01;

let i,j;
let iteration = 0;
// let cols = 400;//1200
let cols = 160*5;
let rows = 90*5;//600
let grid = new Array(rows).fill([]);
grid = grid.map(ar => (new Array(cols).fill(false)));
let lastMousePos = null;

let blockWidth = (board.width / cols);
let blockHeight = (board.height / rows);

let ticker, loop;

let track_hist = false;
let show_hist_alert = true;

let t_o = 1000 - parseInt(document.getElementById('speed').value);

document.onkeydown = ({key}) => {
    switch (key) {
        case "h":
            hide_controls = !hide_controls;
            document.getElementById('controlsContainer').className = hide_controls ? "hidden" : "";
            break;
        case " ":
            toggle();
            break;
        // default:
        //  console.warn(`No bindings for: '${key}'`)
    }
}

let toggleWrap = (direction = false) => {
    if(!direction){
        wrap = document.getElementById('wrap').checked;
        $('.dir_wrap').prop('disabled', !wrap);
        // if(wrap){
        //  boardR.className=""
        //  boardL.className=""
        // } else {
        //  boardR.className="hidden"
        //  boardL.className="hidden"
        //  draw(false);
        // }
    } else {
        switch(direction){
        case 'wrap_north':
            wrap_north = document.getElementById(direction).checked;
            break;
        case 'wrap_east':
            wrap_east = document.getElementById(direction).checked;
            break;
        case 'wrap_south':
            wrap_south = document.getElementById(direction).checked;
            break;
        case 'wrap_west':
            wrap_west = document.getElementById(direction).checked;
            break;
        case 'wrap_north_east':
            wrap_north_east = document.getElementById(direction).checked;
            break;
        case 'wrap_south_east':
            wrap_south_east = document.getElementById(direction).checked;
            break;
        case 'wrap_south_west':
            wrap_south_west = document.getElementById(direction).checked;
            break;
        case 'wrap_north_west':
            wrap_north_west = document.getElementById(direction).checked;
            break;
        default:
            console.error('whoops.');
            console.info(direction);
            break;
        }
    }
}

let toggleDarkmode = () => {
    darkmode = document.getElementById('set_darkmode').checked;
    ctxfill = darkmode ? "rgb(218, 218, 218)" : "rgb(0, 0, 0)";
    draw(false);
    document.getElementsByTagName('body')[0].className = darkmode ? "darkmode" : "";
}

// let drawHoverBlock = (x, y) => {
//  if(lastMousePos)
//      ctx.clearRect(lastMousePos.x, lastMousePos.y, blockWidth, blockHeight);
    
//  draw(false);
    
//  if(!run)
//      ctx.restore();
    
//  ctx.fillStyle = '#888';
//  ctx.fillRect(x, y, blockWidth, blockHeight);
//  ctx.fillStyle = ctxfill;
// }

// board.addEventListener('mousein', () => {
//  ctx.save();
// })

// board.addEventListener('mouseout', () => {
//  drawHoverBlock();
//  lastMousePos = null;
// })

// board.addEventListener('click', () => {
//  let cRow = Math.round(lastMousePos.y / blockHeight);
//  let cCol = Math.round(lastMousePos.x / blockWidth);
    
//  grid[cRow][cCol] = !grid[cRow][cCol];
    
//  draw(false);
// })

// board.addEventListener('mousemove', (e) => {
//  let {clientX, clientY, screenX, screenY, pageX, pageY, layerX, layerY, } = e;
//  let x = (clientX - e.explicitOriginalTarget.offsetLeft) + (blockWidth * .75);
//  let y = (clientY - e.explicitOriginalTarget.offsetTop) + (blockHeight * .75);
//  let hoverX = ((x - (x % blockWidth)) - blockWidth);
//  let hoverY = ((y - (y % blockHeight)) - blockHeight);
    
//  console.log({clientX, clientX, hoverX, hoverY});

//  drawHoverBlock(hoverX, hoverY);
    
//  lastMousePos = {x: hoverX, y: hoverY};
// });

let updateSpeed = (e) => {
    t_o = 1000 - parseInt(e.value);
    clearInterval(ticker);
    ticker = setInterval(loop, t_o);
}

let updateDensity = (e) => {
    density = 2 ** (-1*e.value);
}

let draw = (iterate = true) => {
    population = 0;
    ctx.clearRect(0, 0, board.width, board.height);
    ctx.stroke();
    // if(wrap){
    //  ctxL.clearRect(0, 0, board.width, board.height);
    //  ctxL.stroke();
    //  ctxR.clearRect(0, 0, board.width, board.height);
    //  ctxR.stroke();
    // }
    if(darkmode){
        ctx.fillStyle = "rgb(37, 37, 37)";
        ctx.fillRect(0, 0, board.width, board.height);
        // if(wrap){
        //  ctxL.fillStyle = "rgb(57, 57, 57)";
        //  ctxL.fillRect(0, 0, board.width, board.height);
        //  ctxR.fillStyle = "rgb(57, 57, 57)";
        //  ctxR.fillRect(0, 0, board.width, board.height);
        // }
    }
    ctx.fillStyle = ctxfill;
    // if(wrap){
    //  ctxL.fillStyle = side_ctxfill
    //  ctxR.fillStyle = side_ctxfill
    // }
    let r,c;
    for(r = 0; r < rows; r++){
        for(c = 0; c < cols; c++){
            if(grid[r][c]){
                ctx.fillRect(c*blockWidth, r*blockHeight, blockWidth, blockHeight);
                // ctxL.fillRect(c*blockWidth, r*blockHeight, blockWidth, blockHeight);
                // ctxR.fillRect(c*blockWidth, r*blockHeight, blockWidth, blockHeight);
                population++;
            }
        }
    }
    
    if(iterate)
        iteration++;
    pop.innerHTML = `Population: ${population}`;
    iter.innerHTML = `Generation: ${iteration}`;
}

let clearBoard = () => {
    grid = new Array(rows).fill([]);
    grid = grid.map(ar => (new Array(cols).fill(false)));
    population = 0;
    iteration = 0;
    draw(false);
}

let makeGGG = () => {
    loadHash("<72>8<65>2w<63>3<1>M<1>c<62>h3<2>M<60>M22c<62>3<1>8Ia<64>ww8<63>14<65>3<12730>");

    /* Old code preserved for integrity */
    // clearBoard();
    
    // let ggr, ggc;
    
    // for(ggr = 0; ggr < ggg.length; ggr++){
    //  for(ggc = 0; ggc < ggg[ggr].length; ggc++){
    //      grid[ggr][ggc] = ggg[ggr][ggc];
    //  }
    // }
    // console.log(JSON.stringify(grid).replace(/true/g, 'x').replace(/false/g, '.').replace(/\],/g, '\n').replace(/"/g, '').replace(/\[/g, '').replace(/\]/g, '').replace(/,/g, ''));
    // hist = [];
    // draw(false);
}

let generateNeighbors = (y, x, dist = 1) => {
    if(ticker)
        updateSpeed(document.getElementById('speed'));
    
    if(y < rows && y > 0 && x < cols && x > 0 && dist > density) //0.0625)
    {
        let directions = [
            "North",
            "North-East",
            "East",
            "South-East",
            "South",
            "South-West",
            "West",
            "North-West"
        ];
        directions.sort(() => Math.random() - 0.5);
        directions.forEach((dir) => {
            switch(dir){
                case "North":
                    if(y > 0)
                        if(!grid[y-1][x] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y-1][x] = true
                            generateNeighbors(y-1, x, 0.5 * dist);
                    break;
                case "North-East":
                    if(y > 0 && x < cols-1)
                        if(!grid[y-1][x+1] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y-1][x+1] = true
                            generateNeighbors(y-1,x+1, 0.5 * dist);
                break;
                case "East":
                    if(x < cols-1)
                        if(!grid[y][x+1] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y][x+1] = true
                            generateNeighbors(y,x+1, 0.5 * dist);
                break;
                case "South-East":
                    if(y < rows-1 && x < cols-1)
                        if(!grid[y+1][x+1] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y+1][x+1] = true
                            generateNeighbors(y+1,x+1, 0.5 * dist);
                break;
                case "South":
                    if(y < rows-1)
                        if(!grid[y+1][x] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y+1][x] = true
                            generateNeighbors(y+1,x, 0.5 * dist);
                break;
                case "South-West":
                    if(y < rows-1 && x > 0)
                        if(!grid[y+1][x-1] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y+1][x-1] = true
                            generateNeighbors(y+1,x-1, 0.5 * dist);
                break;
                case "West":
                    if(x > 0)
                        if(!grid[y][x-1] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y][x-1] = true
                            generateNeighbors(y,x-1, 0.5 * dist);
                break;
                case "North-West":
                    if(y > 0 && x > 0)
                        if(!grid[y-1][x-1] && (Math.random() > (1.0-neighbor_freq*dist)))
                            grid[y-1][x-1] = true
                            generateNeighbors(y-1,x-1, 0.5 * dist);
                break;
            }
        })
    }
}

let generateHash = () => {
    let seed = '';
    let gridstr = JSON.stringify(grid).replace(/true/g, '1').replace(/false/g, '0').replace(/\],/g, '').replace(/"/g, '').replace(/\[/g, '').replace(/\]/g, '').replace(/,/g, '');
    
    //111111
    let v;
    while(gridstr.length){
        seed += SEED_REFERENCE[parseInt(gridstr.substr(0, 6), 2)];
        gridstr = gridstr.slice(6);
    }
    
    let strip = seed + "";
    let comp = '';
    //compressing zeroes
    let zeroRX = /(0+)/
    while(zeroRX.test(strip)){
        let mat = zeroRX.exec(strip)
        try {
            let start = strip.indexOf(mat[0]);
            let leng = mat[1].length;
            comp += `${strip.slice(0,start)}<${leng}>`;
            strip = strip.slice(start + leng);
        } catch (e) {
            console.info('something broke');
        }
    }
    return comp;
}

let generateStructures = () => {
    hist = [];
    show_hist_alert = true;
    iteration = 0;
    population = 0;

    for (i = 0; i < rows; i++){
        for(j = 0; j < cols; j++){
            grid[i][j] = false;
        }
    }
    
    ctx.clearRect(0, 0, board.width, board.height);
    ctx.stroke();
    
    let y,x;
    for(y = 0; y < rows; y++){
        for(x = 0; x < cols; x++){
            if(!grid[y][x]){
                if(Math.random() > (1.0-spawn_freq)){
                    grid[y][x] = true;
                    population++;
                    generateNeighbors(y,x);
                }
            }
        }
    }
    draw();
    current_seed = generateHash();
}

let toggle = () => {
    run = !run;
}

let show_alert = true;

let toggleStabilityCheck = () => {
    track_hist = document.getElementById('track_hist').checked;
    if(track_hist && show_alert){
        alert('WARNING! This feature requires a lot of resources, and will slow down the process. Uncheck this option to improve performance.');
        show_alert = false;
    }
}

generateStructures();

const convertNumberBetweenBases = ({ number, fromRadix, toRadix }) => {
  const decimal = parseInt(number, fromRadix);
  const toRadixNumber = decimal.toString(toRadix);
  return toRadixNumber;
  //return SEED_REFERENCE[decimal];
};

let loadHash = (hash) => {
    let gridStream = [];
    
    let strip = ""+hash;
    let decomp = "";
    
    let zeroGenRX = /<([0-9]+)>/
    
    while(zeroGenRX.test(strip)){
        let mat = zeroGenRX.exec(strip);
        let start = strip.indexOf(mat[0]);
        let fil = new Array(parseInt(mat[1])).fill('0').join(''); // replace this with a number of zeroes stripped from mat[1];
        decomp += `${strip.slice(0,start)}${fil}`;
        strip = strip.slice(start + mat[0].length);
    }
    
    hash = decomp;
    
    
    hash.split('').forEach(z => {
        let holder = SEED_REFERENCE.indexOf(z).toString(2);
        holder = holder.padStart(6, '0');
        holder.split('').forEach(x => {
            gridStream.push(x);
        });
    });
    let r, c;
    for(r = 0; r < rows; r++){
        for(c = 0; c < cols; c++){
            // (r * cols) + c
            grid[r][c] = gridStream[(r * cols) + c] == "1";
        }
    }
    iteration = 1;
    draw(false);
}

let showState = () => {
    let current_state = generateHash();
    alert(`Your current world state is:\n${current_state}`);
}

let showSeed = () => {
    alert(`Your seed is:\n${current_seed}`);
}

let loadSeed = () => {
    let seed = prompt("Please paste your seed here: ");
    
    try {
        loadHash(seed);
    } catch (e) {
        alert('There was an error with that seed.\nPlease try copying and pasting it again, or try a different seed.');
    }
}

loop = () => {
    if(run){        
        let next = new Array(rows).fill([]);
        next = next.map(ar => (new Array(cols).fill(false)));
        population = 0;
        let s,t;
        for(s = 0; s < rows; s++){
            for(t = 0; t < cols; t++){
                let neighbor_count = 0;
                
                if(s > 0){
                    //North
                    if(grid[s-1][t]){neighbor_count++}
                } else if (wrap && wrap_north) {
                    if(grid[rows-1][t]){neighbor_count++}
                }
                if(s > 0 && t < cols-1) {
                    //North-East
                    if(grid[s-1][t+1]){neighbor_count++}
                } else if(wrap && wrap_north_east){
                    if (!(s > 0) && !(t < cols-1)) {
                        if(grid[rows-1][0]){neighbor_count++}
                    } else if (!(s > 0)) {
                        if(grid[rows-1][t+1]){neighbor_count++}
                    } else if (!(t < cols-1)) {
                        if(grid[s-1][0]){neighbor_count++}
                    }
                }
                if(t < cols-1) {
                    //East
                    if(grid[s][t+1]){neighbor_count++}
                } else if (wrap && wrap_east) {
                    if(grid[s][0]){neighbor_count++}
                }
                if(s < rows-1 && t < cols-1) {
                    //South-East
                    if(grid[s+1][t+1]){neighbor_count++}
                } else if (wrap && wrap_south_east) {
                    if (!(s < rows-1) && !(t < cols-1)) {
                        if(grid[0][0]){neighbor_count++}
                    } else if (!(s < rows-1)) {
                        if(grid[0][t+1]){neighbor_count++}
                    } else if (!(t < cols-1)) {
                        if(grid[s+1][0]){neighbor_count++}
                    }
                }
                if(s < rows-1) {
                    //South
                    if(grid[s+1][t]){neighbor_count++}
                } else if (wrap && wrap_south) {
                    if(grid[0][t]){neighbor_count++}
                }
                if(s < rows-1 && t > 0) {
                    //South-West
                    if(grid[s+1][t-1]){neighbor_count++}
                } else if (wrap && wrap_south_west) {
                    if(!(s < rows-1) && !(t > 0)) {
                        if(grid[0][cols-1]){neighbor_count++}
                    } else if(!(s < rows-1)) {
                        if(grid[0][t-1]){neighbor_count++}
                    } else if(!(t > 0)) {
                        if(grid[s+1][cols-1]){neighbor_count++}
                    }
                }
                if(t > 0) {
                    //West
                    if(grid[s][t-1]){neighbor_count++}
                } else if (wrap && wrap_west) {
                    if(grid[s][cols-1]){neighbor_count++}
                }
                if(s > 0 && t > 0) {
                    //North-West
                    if(grid[s-1][t-1]){neighbor_count++}
                } else if (wrap && wrap_north_west) {
                    if (!(s > 0) && !(t > 0)) {
                        if(grid[rows-1][cols-1]){neighbor_count++}
                    } else if (!(s > 0)) {
                        if(grid[rows-1][t-1]){neighbor_count++}
                    } else if (!(t > 0)) {
                        if(grid[s-1][cols-1]){neighbor_count++}
                    }
                }
                
                if(grid[s][t]){
                    if(neighbor_count < 2){
                        //underpopulation
                        next[s][t] = false;
                    } else if (neighbor_count == 2 || neighbor_count == 3) {
                        next[s][t] = true;
                    } else if(neighbor_count >= 4){
                        //overpopulation
                        next[s][t] = false;
                    }
                } else if(neighbor_count == 3){
                    next[s][t] = true;
                }
            }
        }
        grid = [...next];
        draw();
        
        if(track_hist && show_hist_alert){
            /*disable this if the browser crashes lmao */
            let current_hash = generateHash();
            
            if ( hist.length > 50 ) {
                //add to end and pop beginning
                hist.shift();
            }
            //push hash to end of array
            
            if(hist.indexOf(current_hash) > 0 && show_hist_alert){
                run = false;
                show_hist_alert = false;
                alert("Game Over!\nStable pattern detected.");
            }
            
            hist.push(current_hash);
            /**/
        }   
    }
}

ticker = setInterval(loop, t_o);

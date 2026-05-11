const guide = document.getElementById("guide");
const svg = document.getElementById("mainSvg");
const view = document.getElementById("view");
const network = document.getElementById("network");
const nodeNetwork = document.getElementById("nodes");
const pathNetwork = document.getElementById("paths");
const stylePopup = document.getElementById("stylePopup"); // used in style settings
//Interfaces End
//Sounds Start
let ctx = null;
function getCtx() {
    if (!ctx)
        ctx = new AudioContext();
    return ctx;
}
ctx = getCtx();
//Sounds are human-thought, but the embed code is AI generated
function playLoadSound() {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const frequencies = [300, 433, 505, 670, 850, 1000];
    const randomFreq = frequencies[Math.floor(Math.random() * frequencies.length)];
    osc.frequency.value = randomFreq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
}
function playSound1(freq = 440, duration = 0.3, type = 'sine', volume = 0.3) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}
function playSound2() {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc1.type = 'sine';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(220, ctx.currentTime);
    osc2.frequency.setValueAtTime(223, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(443, ctx.currentTime + 0.15);
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.2);
    osc2.start();
    osc2.stop(ctx.currentTime + 0.2);
}
//Sounds End
//State Management Start
function getState() {
    const savedState = localStorage.getItem("global-state");
    const Funcstate = savedState ? JSON.parse(savedState) : { settings: [], nodes: [], paths: [] };
    return Funcstate;
}
let state = getState();
//State Management End
let userOnLayer = 1;
let scale = 1;
let transX = 0;
let transY = 0;
let nodeCount = 1;
let pathCount = 1;
let NodeCol = "#6692C1"; //Default Node color
let PathCol = "#FFFFFF"; //Default Path color
const RADIUS = 40;
//HTML Lines Start
const colorPresetDiv = `<svg viewBox="0 0 480 100">
                                <defs>
                                  <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" style="stop-color: hsl(0, 100%, 50%)" />
                                    <stop offset="17%" style="stop-color: hsl(60, 100%, 50%)" />
                                    <stop offset="33%" style="stop-color: hsl(120, 100%, 50%)" />
                                    <stop offset="50%" style="stop-color: hsl(180, 100%, 50%)" />
                                    <stop offset="67%" style="stop-color: hsl(240, 100%, 50%)" />
                                    <stop offset="83%" style="stop-color: hsl(300, 100%, 50%)" />
                                    <stop offset="100%" style="stop-color: hsl(360, 100%, 50%)" />
                                  </linearGradient>
                              </defs>

                              <circle id="col1" r="30" cx="80" cy="70" fill="#6692C1" />
                              <circle id="col2" r="30" cx="160" cy="70" fill="#A33855" />
                              <circle id="col3" r="30" cx="240" cy="70" fill="#7B6EAB" />
                              <circle id="col4" r="30" cx="320" cy="70" fill="#6EAB94" />
                              <circle id="colPick" r="30" cx="400" cy="70" fill="url(#rainbow)" />
                            </svg>`;
const colorPickerDiv = `<div id="pickr-container"></div>
                              <button id="backBtn">
                                <svg viewBox="-10 -10 20 20">
                                  <g>
                                    <path d="M -5 -2 L 5 -2" fill="none" stroke="black" stroke-width="1"/>
                                    <polyline points="-2 -5 -5 -2 -2 1" fill="none" stroke="black" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
                                  </g>
                                </svg>
                              </button>`;
const animFlowToggleDiv = `<button id="animToggle">
                                  <svg viewBox="-100 -100 200 200">
                                    <defs>
                                    <marker viewBox="-15 -15 30 30" id="arrow" markerWidth="15" markerHeight="15" refX="0" refY="0" orient="auto">
                                      <polyline points="-8 -6, 0 0, -8 6" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="scale(1.4)"/>
                                    </marker>
                                    </defs>
                                    <g>
                                      <polyline id="animateToggleLogo" points="-8 -6, 0 0, -8 6" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" transform="scale(4.8)"/>
                                      <animateMotion dur="0.9s" repeatCount="indefinite" rotate="auto">
                                        <mpath href="#animated"></mpath>
                                      </animateMotion>
                                    </g>
                                    <path id="animated" class="animated" d="M -90 10 L 90 10" fill="none" stroke="white" stroke-width="7" stroke-linecap="round">
                                  </svg>
                                </button>`;
//HTML Lines End
//Path Start
const Path = document.getElementById("pathBtn");
let NodeStart = null;
let NodeEnd = null;
let pathMode = false;
let pathOption = "8";
Path.addEventListener("click", () => {
    if (pathMode) {
        guide.style.display = "none";
        document.removeEventListener("click", clickOne);
        document.removeEventListener("click", clickTwo);
        document.removeEventListener("touchend", clickOne);
        document.removeEventListener("touchend", clickTwo);
        pathMode = false;
        return;
    }
    pathMode = true;
    guide.style.display = "block";
    guide.textContent = "Select Start Node";
    document.addEventListener("click", clickOne);
    document.addEventListener("touchend", clickOne);
});
const clickOne = (e) => {
    e.stopPropagation();
    const target = e.target;
    if (!target)
        return;
    if (target.tagName == "circle") {
        const startNode = target.parentElement;
        NodeStart = startNode;
        guide.textContent = "Select End Node";
        document.removeEventListener("click", clickOne);
        document.removeEventListener("touchend", clickOne);
        document.addEventListener("click", clickTwo);
        document.addEventListener("touchend", clickTwo);
    }
};
const clickTwo = (e) => {
    e.stopPropagation();
    const target = e.target;
    if (!target)
        return;
    if (target.tagName == "circle") {
        const endNode = target.parentElement;
        NodeEnd = endNode;
        drawPath(NodeStart, NodeEnd, false);
        guide.style.display = "none";
        document.removeEventListener("click", clickTwo);
        document.removeEventListener("touchend", clickTwo);
        pathMode = false;
    }
};
function drawPath(Start, End, isPathLoading = false) {
    if (Start == End)
        return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const pHitbox = document.createElementNS("http://www.w3.org/2000/svg", "path");
    //PG = Path Group
    const PG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    path.classList.add("pathV");
    path.setAttribute("id", `pathV${pathCount}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", PathCol);
    path.setAttribute("stroke-width", "3.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("data-start", NodeStart.id);
    path.setAttribute("data-end", NodeEnd.id);
    pHitbox.classList.add("pathHB");
    pHitbox.setAttribute("stroke", "transparent");
    pHitbox.setAttribute("stroke-width", "10");
    pHitbox.setAttribute("fill", "none");
    const arrowDot = document.createElementNS("http://www.w3.org/2000/svg", "g");
    arrowDot.classList.add("animation");
    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    chevron.setAttribute("points", "-8 -6, 0 0, -8 6");
    chevron.setAttribute("fill", "none");
    chevron.setAttribute("stroke", "white");
    chevron.setAttribute("stroke-width", "1.5");
    chevron.setAttribute("stroke-linecap", "round");
    chevron.setAttribute("stroke-linejoin", "round");
    chevron.setAttribute("transform", "scale(2.2)");
    arrowDot.appendChild(chevron);
    if (animatedFlow) {
        const animMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
        animMotion.setAttribute("dur", "1s");
        animMotion.setAttribute("repeatCount", "indefinite");
        animMotion.setAttribute("rotate", "auto");
        const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
        mpath.setAttribute("href", `#pathV${pathCount}`);
        animMotion.appendChild(mpath);
        arrowDot.appendChild(animMotion);
    }
    PG.setAttribute("id", "path" + pathCount);
    PG.classList.add("path");
    PG.setAttribute("data-on-layer", String(userOnLayer));
    PG.appendChild(arrowDot);
    PG.appendChild(path);
    PG.appendChild(pHitbox);
    pathNetwork.appendChild(PG);
    //const startNodePopup = infoPopupSection.querySelector(`#infopopup-${NodeStart.id}`)
    //const endNodePopup = infoPopupSection.querySelector(`#infopopup-${NodeEnd.id}`)
    updatePath(path, pHitbox);
    if (!animatedFlow)
        StaticiseFlow();
    if (!isPathLoading) {
        const data = {
            id: "path" + pathCount,
            x: NodeStart.id,
            y: NodeEnd.id,
            layer: userOnLayer,
            draw: ""
        };
        state.paths.push(data);
    }
    pathCount++;
    JSONSave();
}
function updatePath(p, hitbox) {
    const start = document.getElementById(p.getAttribute("data-start") || "");
    const end = document.getElementById(p.getAttribute("data-end") || "");
    if (!start || !end)
        return;
    const X1 = parseFloat(start.querySelector("circle").getAttribute("cx") || "0");
    const Y1 = parseFloat(start.querySelector("circle").getAttribute("cy") || "0");
    const X2 = parseFloat(end.querySelector("circle").getAttribute("cx") || "0");
    const Y2 = parseFloat(end.querySelector("circle").getAttribute("cy") || "0");
    const startNpoints = [
        { x: X1, y: Y1 + RADIUS },
        { x: X1, y: Y1 - RADIUS },
        { x: X1 - RADIUS, y: Y1 },
        { x: X1 + RADIUS, y: Y1 }
    ];
    const EndNpoints = [
        { x: X2, y: Y2 + RADIUS },
        { x: X2, y: Y2 - RADIUS },
        { x: X2 - RADIUS, y: Y2 },
        { x: X2 + RADIUS, y: Y2 }
    ];
    if (pathOption == "8") {
        startNpoints.push({ x: X1 + 28.284, y: Y1 + 28.284 });
        startNpoints.push({ x: X1 - 28.284, y: Y1 + 28.284 });
        startNpoints.push({ x: X1 + 28.284, y: Y1 - 28.284 });
        startNpoints.push({ x: X1 - 28.284, y: Y1 - 28.284 });
        EndNpoints.push({ x: X2 + 28.284, y: Y2 + 28.284 });
        EndNpoints.push({ x: X2 - 28.284, y: Y2 + 28.284 });
        EndNpoints.push({ x: X2 + 28.284, y: Y2 - 28.284 });
        EndNpoints.push({ x: X2 - 28.284, y: Y2 - 28.284 });
    }
    let minDistance = Infinity;
    let distance = null;
    let bestSx, bestEx, bestSy, bestEy;
    if (pathOption == "8" || pathOption == "4") {
        for (let comp1 of startNpoints) {
            for (let comp2 of EndNpoints) {
                const compareX = comp1.x - comp2.x;
                const compareY = comp1.y - comp2.y;
                distance = compareX ** 2 + compareY ** 2;
                if (distance < minDistance) {
                    minDistance = distance;
                    bestSx = comp1.x;
                    bestSy = comp1.y;
                    bestEx = comp2.x;
                    bestEy = comp2.y;
                }
            }
        }
        p.setAttribute("d", `M ${bestSx} ${bestSy} L ${bestEx} ${bestEy}`);
        hitbox.setAttribute("d", `M ${bestSx} ${bestSy} L ${bestEx} ${bestEy}`);
    }
    else {
        const angle = Math.atan2(Y2 - Y1, X2 - X1); //The angle at which 2 lies from 1 in rad
        bestSx = X1 + RADIUS * Math.cos(angle);
        bestSy = Y1 + RADIUS * Math.sin(angle); //Calculating the positions
        bestEx = X2 - RADIUS * Math.cos(angle); //of points
        bestEy = Y2 - RADIUS * Math.sin(angle);
        p.setAttribute("d", `M ${bestSx} ${bestSy} L ${bestEx} ${bestEy}`);
        hitbox.setAttribute("d", `M ${bestSx} ${bestSy} L ${bestEx} ${bestEy}`);
    }
    p.setAttribute("data-x1", `${bestSx}`);
    p.setAttribute("data-y1", `${bestSy}`);
    p.setAttribute("data-x2", `${bestEx}`);
    p.setAttribute("data-y2", `${bestEy}`);
    if (!animatedFlow)
        StaticiseFlow();
}
//Path End
//Drag Start
function makeDraggable(node) {
    let drag = false;
    let touchMoved = false;
    node.addEventListener("click", () => {
        if (pathMode || deleteMode)
            return;
        drag = !drag;
        const circle = node.querySelector("circle");
        if (drag && circle) {
            circle.setAttribute("r", "40");
            circle.setAttribute("stroke", "#EFFFFA");
            circle.setAttribute("stroke-width", "4");
            showPopup(node);
        }
        else if ((!drag) && circle) {
            circle.setAttribute("r", "40");
            circle.setAttribute("stroke-width", "0");
            removePopup(node);
        }
    });
    //Touch Start
    node.addEventListener("touchstart", () => {
        touchMoved = false;
    });
    node.addEventListener("touchmove", (e) => {
        touchMoved = true;
        if (!drag)
            return;
        const circle = node.querySelector("circle");
        const pt = svg.createSVGPoint();
        pt.x = e.touches[0].clientX;
        pt.y = e.touches[0].clientY;
        const finger = pt.matrixTransform(network.getScreenCTM().inverse());
        Sdrag(circle, finger.x, finger.y);
        pathNetwork.querySelectorAll(".pathV").forEach((p) => {
            if (p.getAttribute("data-start") === node.id || p.getAttribute("data-end") === node.id) {
                const hitboxPath = p.parentElement?.querySelector(".pathHB");
                updatePath(p, hitboxPath);
            }
        });
    });
    node.addEventListener("touchend", (e) => {
        if (!touchMoved) {
            e.preventDefault();
            drag = !drag;
            const circle = node.querySelector("circle");
            if (drag && circle) {
                circle.setAttribute("r", "40");
                circle.setAttribute("stroke", "#EFFFFA");
                circle.setAttribute("stroke-width", "4");
                showPopup(node);
            }
            else if (!drag && circle) {
                circle.setAttribute("r", "40");
                circle.setAttribute("stroke-width", "0");
                removePopup(node);
            }
            return;
        }
        const Ndata = state.nodes.find((n) => n.id === node.id);
        if (!Ndata)
            return;
        Ndata.x = parseFloat(node.children[0]?.getAttribute("cx") ?? "0");
        Ndata.y = parseFloat(node.children[0]?.getAttribute("cy") ?? "0");
        JSONSave();
    });
    //Touch End
    //Mouse Start     
    node.addEventListener("mousemove", (e) => {
        if (!drag)
            return;
        if (pathMode || deleteMode)
            return;
        e.stopPropagation();
        const circle = node.querySelector("circle");
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursor = pt.matrixTransform(network.getScreenCTM().inverse());
        Sdrag(circle, cursor.x, cursor.y);
    });
    node.addEventListener("mouseup", () => {
        const Ndata = state.nodes.find((n) => n.id === node.id);
        if (!Ndata)
            return;
        Ndata.x = parseFloat(node.children[0]?.getAttribute("cx") ?? "0");
        Ndata.y = parseFloat(node.children[0]?.getAttribute("cy") ?? "0");
        JSONSave();
    });
    //Mouse End
}
function Sdrag(ele, x, y) {
    if (ele && typeof ele.setAttribute === "function") {
        ele.setAttribute("cx", `${x}`);
        ele.setAttribute("cy", `${y}`);
        const corInPop = infoPopupSection.querySelector(`#popup-${ele.parentElement?.id}`);
        corInPop?.setAttribute("transform", `translate(${x - 95}, ${y + 60})`);
        resolveCollisions(ele);
        pathNetwork.querySelectorAll(".path").forEach(pat => {
            updatePath(pat.children[1], pat.children[2]);
        });
    }
}
//Drag End
//Collision Start
const PADDING = 2;
function resolveCollisions(movedNode) {
    const nodes = Array.from(nodeNetwork.querySelectorAll("circle"));
    const ax = parseFloat(movedNode.getAttribute("cx") || "0");
    const ay = parseFloat(movedNode.getAttribute("cy") || "0");
    for (const other of nodes) {
        if (other === movedNode)
            continue;
        const bx = parseFloat(other.getAttribute("cx") || "0");
        const by = parseFloat(other.getAttribute("cy") || "0");
        const dx = ax - bx;
        const dy = ay - by;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = RADIUS * 2 + PADDING;
        if (dist < minDist && dist > 0) {
            // Push the stationary node away along the collision axis
            const overlap = minDist - dist;
            const nx = dx / dist; // normalised direction (vector)
            const ny = dy / dist;
            const X = bx - nx * overlap;
            const Y = by - ny * overlap;
            other.setAttribute("cx", `${X}`);
            other.setAttribute("cy", `${Y}`);
            const otherGroup = other.parentElement;
            if (!otherGroup)
                return;
            const otherPopup = infoPopupSection.querySelector(`#popup-${otherGroup.getAttribute("id")}`);
            if (otherPopup) {
                otherPopup.setAttribute("transform", `translate(${X - 95}, ${Y + 60})`);
            }
            const otherD = state.nodes.find((n) => n.id === otherGroup.id);
            if (otherD) {
                otherD.x = X;
                otherD.y = Y;
            }
            pathNetwork.querySelectorAll(".pathV").forEach((p) => {
                if (p.getAttribute("data-start") === otherGroup.id || p.getAttribute("data-end") === otherGroup.id) {
                    const hitboxPath = p.parentElement?.querySelector(".pathHB") || "";
                    updatePath(p, hitboxPath);
                }
            });
        }
    }
    JSONSave();
}
//Collision End
//Add Start
const Add = document.getElementById("addBtn");
Add.addEventListener("click", () => {
    const NewNode = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    //NNG = New Node Group
    const NNG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    NewNode.setAttribute("r", "40");
    NewNode.setAttribute("fill", NodeCol);
    NewNode.setAttribute("data-on-layer", `${userOnLayer}`);
    NewNode.setAttribute("cx", `${-transX / scale}`);
    NewNode.setAttribute("cy", `${-transY / scale}`);
    NNG.setAttribute("id", "node" + nodeCount);
    NNG.classList.add("node");
    NewNode.classList.add("node");
    NNG.appendChild(NewNode);
    nodeNetwork.appendChild(NNG);
    makeDraggable(NNG);
    const data = {
        id: "node" + nodeCount,
        x: -transX / scale,
        y: -transY / scale,
        layer: userOnLayer,
    };
    state.nodes.push(data);
    nodeCount++;
    playSound1(440, 0.3, "sine", 1);
    JSONSave();
});
//Add End
//Delete Start
const Delete = document.getElementById("deleteBtn");
let deleteMode = false;
const DeleteClick = (e) => {
    const target = e.target;
    if (target?.matches(".node") && deleteMode) {
        playSound1(1000, 0.2, 'sine', 1);
        const nodeGroup = target.parentElement;
        if (!nodeGroup)
            return;
        const nodeId = nodeGroup.id;
        removePopup(nodeGroup); //here, to avoid seeing the popup while deletion is happening
        nodeGroup.classList.add("deletingelement");
        pathNetwork.querySelectorAll(".pathV").forEach((p) => {
            if (p.getAttribute("data-start") === nodeId ||
                p.getAttribute("data-end") === nodeId)
                p.parentElement?.classList.add("deletingelement");
        });
        setTimeout(() => {
            pathNetwork.querySelectorAll(".pathV").forEach((p) => {
                if (p.getAttribute("data-start") === nodeId ||
                    p.getAttribute("data-end") === nodeId)
                    p.parentElement?.remove();
            });
            state.nodes = state.nodes.filter((n) => !(n.id === nodeId && parseInt(n.layer) === userOnLayer));
            state.paths = state.paths.filter((p) => p.x !== nodeId && p.y !== nodeId);
            nodeGroup.remove();
            guide.style.display = "none";
            deleteMode = !deleteMode;
            JSONSave();
        }, 300);
    }
    if ((target?.matches(".pathV") || target?.matches(".pathHB")) && deleteMode) {
        playSound1(1000, 0.2, 'sine', 1);
        const pg = target.parentElement;
        if (!pg)
            return;
        pg.classList.add("deletingelement");
        setTimeout(() => {
            state.paths = state.paths.filter((p) => !(p.id == pg.id && parseInt(p.layer) == userOnLayer));
            pg.remove();
            guide.style.display = "none";
            deleteMode = !deleteMode;
            JSONSave();
        }, 300);
    }
};
Delete.addEventListener("click", () => {
    if (deleteMode) {
        guide.style.display = "none";
        document.removeEventListener("click", DeleteClick);
        document.removeEventListener("touchend", DeleteClick);
        deleteMode = false;
        return;
    }
    deleteMode = !deleteMode;
    guide.style.display = "block";
    guide.textContent = "Select Node/Path To Delete";
    document.addEventListener("click", DeleteClick);
    document.addEventListener("touchend", DeleteClick);
});
//Delete End
//Clear Start
const clearBtn = document.getElementById("clearBtn");
clearBtn.addEventListener("click", () => {
    if (confirm("Clear all nodes and paths?")) {
        nodeNetwork.innerHTML = "";
        pathNetwork.innerHTML = "";
        infoPopupSection.innerHTML = "";
        localStorage.clear();
        state = { settings: [], nodes: [], paths: [] };
        nodeCount = 1;
        pathCount = 1;
    }
});
//Clear End
//Info Popup Start
const infoPopupSection = document.getElementById("infoPopups");
function showPopup(node) {
    const nodeData = state.nodes.find((n) => n.id === node.id);
    //Find how many paths' have it as an end-node
    const displayInputs = [...pathNetwork.querySelectorAll(".pathV")].filter(path => path.getAttribute("data-end") === node.id).length;
    //Find how many paths' have it as a start-node
    const displayOutputs = [...pathNetwork.querySelectorAll(".pathV")].filter(path => path.getAttribute("data-start") === node.id).length;
    const SVGstructure = `<g class="infoPopup" id="popup-${node.id}" transform="translate(${nodeData.x - 95}, ${nodeData.y + 60})">
                <rect width="175" height="210" x="10" y="10" rx="8" ry="8" fill="white" stroke="#000000d5" stroke-width="1"/>
                <text x="34" y="60" font-size="30" text-anchor="start" fill="black">${(node.id).replace("n", "N")}</text>
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325" transform="translate(129.6, 40) scale(1.13)"/>
                <text x="40" y="90" font-size="14" text-anchor="start" fill="black">ID: ${node.id}</text>
                <text x="40" y="120" font-size="14" text-anchor="start" fill="black">Inputs: ${displayInputs}</text>
                <text x="40" y="150" font-size="14" text-anchor="start" fill="black">Outputs: ${displayOutputs}</text>
              </g>`;
    const SVG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    SVG.innerHTML = SVGstructure;
    infoPopupSection.appendChild(SVG);
}
function removePopup(node) {
    const removeInfo = infoPopupSection.querySelector(`#popup-${node.id}`);
    removeInfo?.remove();
}
//Info Popup End
//Layering Start
const layerMenu = document.querySelector(".layers");
const newLayerMenu = document.querySelector(".createdLayerBtns");
const layer1Btn = document.getElementById("layer1Btn");
const layer2Btn = document.getElementById("layer2Btn");
const layerAddBtn = document.getElementById("layerAddBtn");
const layerRemBtn = document.getElementById("layerRemBtn");
let layerBtnCount = 2;
let layerDeleteMode = false;
function syncLayerButtonColors() {
    if (layerBtnCount >= 8) {
        layerAddBtn.classList.remove("LABT");
        layerAddBtn.classList.add("limit-layerbtn-Add");
    }
    else {
        layerAddBtn.classList.add("LABT");
        layerAddBtn.classList.remove("limit-layerbtn-Add");
    }
    if (layerBtnCount <= 2) {
        layerRemBtn.classList.remove("LRBT");
        layerRemBtn.classList.add("limit-layerbtn-Delete");
    }
    else {
        layerRemBtn.classList.add("LRBT");
        layerRemBtn.classList.remove("limit-layerbtn-Delete");
    }
}
layer1Btn.onclick = () => {
    if (userOnLayer == 1)
        return;
    document.querySelectorAll(".SLBTN").forEach(b => {
        b.classList.remove("SLBTN");
    });
    layer1Btn.classList.add("SLBTN");
    view.dataset.currentLayer = "1";
    JSONSave();
    userOnLayer = 1;
    JSONLoad("loadlayer");
};
layer2Btn.onclick = () => {
    if (userOnLayer == 2)
        return;
    document.querySelectorAll(".SLBTN").forEach(b => {
        b.classList.remove("SLBTN");
    });
    layer2Btn.classList.add("SLBTN");
    view.dataset.currentLayer = "2";
    JSONSave();
    userOnLayer = 2;
    JSONLoad("loadlayer");
};
function Deletion(layerNum) {
    state.nodes = state.nodes.filter((n) => parseInt(n.layer) !== layerNum);
    state.nodes.forEach((n) => {
        if (parseInt(n.layer) > layerNum)
            n.layer = String(parseInt(n.layer) - 1);
    });
    state.paths = state.paths.filter((p) => parseInt(p.layer) !== layerNum);
    state.paths.forEach((p) => {
        if (parseInt(p.layer) > layerNum)
            p.layer = String(parseInt(p.layer) - 1);
    });
    const LayerToDie = document.querySelector(`[data-layer-prop="${layerNum}"]`);
    LayerToDie?.classList.add("deletingelement");
    setTimeout(() => {
        LayerToDie?.remove();
    }, 300);
    const currentBtns = [...newLayerMenu.querySelectorAll("button")].filter(btn => !btn.classList.contains("deletingelement"));
    currentBtns.forEach(btn => {
        const layerProperty = btn.dataset.layerProp;
        if (parseInt(layerProperty) > layerNum) {
            btn.dataset.layerProp = `${parseInt(layerProperty) - 1}`;
            btn.innerText = `${parseInt(layerProperty) - 1}`;
        }
    });
    layerBtnCount--;
    syncLayerButtonColors();
    JSONSave();
    if (userOnLayer === layerNum) {
        userOnLayer = layerNum - 1;
    }
    else if (userOnLayer > layerNum) {
        userOnLayer = userOnLayer - 1;
    }
    document.querySelector(`[data-layer-prop="${userOnLayer}"]`)?.classList.add("SLBTN");
    JSONLoad("loadlayer");
    layerDeleteMode = false;
}
function NewLayerBtnFuncAdd(ele) {
    ele.addEventListener("click", () => {
        const num = parseInt(ele.dataset.layerProp);
        if (layerDeleteMode) {
            Deletion(num);
            const removableLBTNs = newLayerMenu.querySelectorAll("button");
            removableLBTNs.forEach(btn => {
                btn.classList.remove("RemovableLBTN");
            });
            guide.textContent = "";
            guide.style.display = "none";
            return;
        }
        if (userOnLayer == num)
            return;
        document.querySelectorAll(".SLBTN").forEach(b => {
            b.classList.remove("SLBTN");
        });
        ele.classList.add("SLBTN");
        view.dataset.currentLayer = `${num}`;
        JSONSave();
        userOnLayer = num;
        JSONLoad("loadlayer");
    });
}
function newLayerBtn() {
    //Function to ignore Creator and Destroyer, Grouping, or a simple addition fix?
    const existingBtns = layerMenu.querySelectorAll("button");
    const newLayerNum = existingBtns.length + 1;
    const newButton = document.createElement("button");
    newButton.innerText = String(newLayerNum);
    newButton.dataset.layerProp = String(newLayerNum);
    NewLayerBtnFuncAdd(newButton);
    layerBtnCount = newLayerNum;
    newLayerMenu.appendChild(newButton);
}
layerAddBtn.onclick = () => {
    if (layerDeleteMode)
        return;
    if (layerBtnCount >= 8) {
        layerBtnCount = 8;
        return;
    }
    newLayerBtn();
    syncLayerButtonColors();
};
layerRemBtn.onclick = () => {
    layerDeleteMode = !layerDeleteMode;
    const removableLBTNs = newLayerMenu.querySelectorAll("button");
    if (layerDeleteMode) {
        removableLBTNs.forEach(btn => {
            btn.classList.add("RemovableLBTN");
        });
        guide.textContent = "Select Layer To Delete";
        guide.style.display = "block";
    }
    else {
        removableLBTNs.forEach(btn => {
            btn.classList.remove("RemovableLBTN");
        });
        guide.style.display = "none";
    }
    //red outline around removable layers code
};
//Layering End
//Zoom&Pan Start
let isPanning = false;
let previousDist; //touch devices
let prevMidX, prevMidY;
const StartHandler = (e) => {
    const touchE = e instanceof TouchEvent ? e : null;
    const mouseE = e instanceof MouseEvent ? e : null;
    if (touchE) {
        if (touchE.touches.length === 2) {
            const dx = touchE.touches[0].clientX - touchE.touches[1].clientX;
            const dy = touchE.touches[0].clientY - touchE.touches[1].clientY;
            previousDist = Math.sqrt(dx * dx + dy * dy);
            prevMidX = (touchE.touches[0].clientX + touchE.touches[1].clientX) / 2;
            prevMidY = (touchE.touches[0].clientY + touchE.touches[1].clientY) / 2;
        }
    }
    else if (mouseE) {
        prevMidX = mouseE.clientX;
        prevMidY = mouseE.clientY;
    }
};
let rafPending = false;
const DragPanHandler = (e) => {
    const touchE = e instanceof TouchEvent ? e : null;
    const mouseE = e instanceof MouseEvent && !(e instanceof WheelEvent) ? e : null;
    const wheelE = e instanceof WheelEvent ? e : null;
    if (mouseE && !isPanning)
        return;
    const MidX = touchE && touchE.touches.length > 1 ? (touchE.touches[0].clientX + touchE.touches[1].clientX) / 2 : (mouseE ?? wheelE)?.clientX;
    const MidY = touchE && touchE.touches.length > 1 ? (touchE.touches[0].clientY + touchE.touches[1].clientY) / 2 : (mouseE ?? wheelE)?.clientY;
    if (!isFinite(MidX) || !isFinite(MidY))
        return;
    const ctm = svg.getScreenCTM();
    if (!ctm)
        return;
    const point = svg.createSVGPoint();
    point.x = MidX;
    point.y = MidY;
    const center = point.matrixTransform(ctm.inverse());
    if (!center)
        return;
    const worldX = (center.x - transX) / scale; // world-space anchor
    const worldY = (center.y - transY) / scale;
    let scaleRatio = 1;
    let intendedScale;
    if (touchE && touchE.touches.length == 2) {
        const Mdx = touchE.touches[0].clientX - touchE.touches[1].clientX;
        const Mdy = touchE.touches[0].clientY - touchE.touches[1].clientY;
        const Mdist = Math.sqrt(Mdx * Mdx + Mdy * Mdy);
        scaleRatio = Mdist / previousDist;
        previousDist = Mdist;
    }
    if (wheelE?.deltaY !== undefined && wheelE.deltaY < 0)
        scaleRatio = 1.1;
    else if (wheelE?.deltaY !== undefined && wheelE.deltaY > 0)
        scaleRatio = 0.9;
    intendedScale = Math.max(0.131, Math.min(scale * scaleRatio, 9.4));
    transX = center.x - worldX * intendedScale;
    transY = center.y - worldY * intendedScale;
    transX += MidX - prevMidX;
    transY += MidY - prevMidY;
    scale = intendedScale;
    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
            view.setAttribute("transform", `translate(${transX}, ${transY}) scale(${scale})`);
            rafPending = false;
        });
    }
    prevMidX = MidX;
    prevMidY = MidY;
};
svg.addEventListener("touchstart", StartHandler, { passive: false });
svg.addEventListener("touchmove", DragPanHandler, { passive: false });
svg.addEventListener("mousedown", () => {
    isPanning = true;
    StartHandler;
});
svg.addEventListener("mousemove", DragPanHandler);
svg.addEventListener("mouseup", () => {
    isPanning = false;
});
svg.addEventListener("wheel", DragPanHandler, { passive: false });
//Zoom&Pan End
//Settings Start
const settingsBtn = document.getElementById("settingsBtn");
const popUp1 = document.getElementById("settingPop1");
const popUp2 = document.getElementById("settingPop2");
const SP11 = document.getElementById("SP11"); //4
const SP12 = document.getElementById("SP12"); //8
const SP13 = document.getElementById("SP13"); //Smooth
const SP21 = document.getElementById("SP21"); //Nodes Color
const SP22 = document.getElementById("SP22"); //Paths Color
const SP23 = document.getElementById("SP23"); //Animated or Static Flow
const optsArr1 = [SP11, SP12, SP13];
const optsArr2 = [SP21, SP22, SP23];
let popUpShow = false;
settingsBtn.addEventListener("click", () => {
    popUpShow = !popUpShow;
    if (popUpShow) {
        popUp1.style.display = "block";
        popUp2.style.display = "block";
    }
    if (!popUpShow) {
        popUp1.style.display = "none";
        popUp2.style.display = "none";
    }
});
//Pathing Settings Start
const pathSettings = {
    SP11: "4",
    SP12: "8",
    SP13: "Smooth"
};
function SettingPath(option) {
    if (pathSettings[option.id]) {
        pathOption = pathSettings[option.id] ?? "";
        pathNetwork.querySelectorAll(".path").forEach(pat => {
            const VPath = pat.children[1];
            const HitPath = pat.children[2];
            updatePath(VPath, HitPath);
        });
        JSONSave();
    }
}
for (const funcLoopA of optsArr1) {
    funcLoopA.onclick = () => {
        funcLoopA.classList.add("selected");
        SettingPath(funcLoopA);
        optsArr1.forEach(opt => {
            if (opt.id === funcLoopA.id)
                return;
            opt.classList.remove("selected");
        });
    };
}
//Pathing Settings End
//Style Settings Start
let stylePopShow = false;
let flowSettingsOpen = false;
let ApplyStyleTo = undefined;
let C1, C2, C3, C4;
function SettingStyle(option) {
    if (!styleAppliers[option.id])
        return; // SP23 (Flow) handled separately
    const targetSelector = styleAppliers[option.id]; // ".node" or ".path"
    const isSame = ApplyStyleTo === targetSelector;
    if (isSame) {
        stylePopShow = false;
        ApplyStyleTo = undefined;
        stylePopup.style.display = "none";
        return;
    }
    ApplyStyleTo = targetSelector;
    stylePopShow = true;
    stylePopup.style.display = "block";
    const nodeColors = ["#6692C1", "#A33855", "#7B6EAB", "#6EAB94"];
    const pathColors = ["#FFFFFF", "#FFDFEE", "#afc4ee", "#cbfdea"];
    const colors = targetSelector === ".path" ? pathColors : nodeColors;
    [C1, C2, C3, C4].forEach((circle, i) => {
        circle.setAttribute("fill", colors[i]);
        circle.classList.remove("colorSelected");
    });
}
function ApplyCol(colorIn) {
    let Color;
    if (colorIn instanceof SVGCircleElement) {
        Color = colorIn.getAttribute("fill");
    }
    else {
        Color = colorIn;
    }
    if (Color != "url(#rainbow)") {
        if (ApplyStyleTo == ".path")
            PathCol = Color;
        else if (ApplyStyleTo == ".node")
            NodeCol = Color;
    }
    if (!ApplyStyleTo)
        return;
    network.querySelectorAll(ApplyStyleTo).forEach((el) => {
        if (ApplyStyleTo == ".path")
            el.children[1]?.setAttribute("stroke", PathCol);
        else if (ApplyStyleTo == ".node")
            el.setAttribute("fill", NodeCol);
    });
    JSONSave();
}
const styleAppliers = {
    SP21: ".node",
    SP22: ".path",
};
function loadMainColorMenu() {
    stylePopup.innerHTML = colorPresetDiv;
    C1 = document.getElementById("col1");
    C2 = document.getElementById("col2");
    C3 = document.getElementById("col3");
    C4 = document.getElementById("col4");
    const C5 = document.getElementById("colPick"); //color picker
    const colorOptions = [C1, C2, C3, C4, C5];
    for (const funcLoopB of optsArr2) {
        if (funcLoopB == SP23) {
            funcLoopB.onclick = () => {
                flowSettingsOpen = !flowSettingsOpen;
                funcLoopB.classList.toggle("selected");
                optsArr2.forEach((opt) => {
                    if (opt.id === funcLoopB.id)
                        return;
                    opt.classList.remove("selected");
                });
                if (flowSettingsOpen) {
                    loadAnimFlowToggleDiv();
                }
                else {
                    loadMainColorMenu();
                    stylePopup.style.display = "none";
                }
            };
        }
        else {
            funcLoopB.onclick = () => {
                funcLoopB.classList.toggle("selected");
                if (flowSettingsOpen) {
                    flowSettingsOpen = false;
                    ApplyStyleTo = undefined;
                    stylePopup.innerHTML = "";
                    loadMainColorMenu();
                }
                SettingStyle(funcLoopB);
                optsArr2.forEach((opt) => {
                    if (opt.id === funcLoopB.id)
                        return;
                    opt.classList.remove("selected");
                });
            };
        }
    }
    const colPresEvents = (arg) => (e) => {
        e.stopPropagation();
        if (arg == C5) {
            loadColorPickerMenu();
        }
        else {
            arg.classList.add("colorSelected");
            ApplyCol(arg);
            colorOptions.forEach((coul) => {
                if (coul == arg)
                    return;
                coul.classList.remove("colorSelected");
            });
        }
    };
    for (let col of colorOptions) {
        col.addEventListener("click", colPresEvents(col));
    }
}
loadMainColorMenu();
function loadColorPickerMenu() {
    stylePopup.innerHTML = colorPickerDiv;
    const backBtn = document.getElementById("backBtn");
    let PickerColor = ApplyStyleTo === ".node" ? NodeCol : PathCol;
    if (typeof PickerColor !== "string" || !PickerColor.startsWith("#"))
        PickerColor = "#FFFFFF";
    const pickr = Pickr.create({
        el: '#pickr-container',
        theme: 'nano',
        default: PickerColor,
        components: {
            preview: true,
            opacity: false,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                clear: false,
                save: true
            }
        }
    });
    pickr.on('save', (color, instance) => {
        ApplyCol(color.toHEXA().toString());
    });
    backBtn.onclick = () => {
        loadMainColorMenu();
    };
}
//Animated Or Static Flow Settings Start
let animatedFlow = true;
function StaticiseFlow() {
    pathNetwork.querySelectorAll(".path").forEach(p => {
        const pathV = p.children[1];
        const x1 = parseFloat(pathV.getAttribute("data-x1"));
        const y1 = parseFloat(pathV.getAttribute("data-y1"));
        const x2 = parseFloat(pathV.getAttribute("data-x2"));
        const y2 = parseFloat(pathV.getAttribute("data-y2"));
        const at50X = (x1 + x2) / 2;
        const at50Y = (y1 + y2) / 2;
        const at75X = (at50X + x2) / 2;
        const at75Y = (at50Y + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        p.children[0].setAttribute("transform", `translate(${at75X}, ${at75Y}) rotate(${angle}) scale(1)`);
    });
}
function loadAnimFlowToggleDiv() {
    stylePopup.innerHTML = animFlowToggleDiv;
    stylePopup.style.display = "block";
    const flowStyleToggle = document.getElementById("animToggle");
    const flowStyleIndicLine = flowStyleToggle.querySelector(".animated");
    const movingArrow = document.getElementById("animateToggleLogo");
    flowStyleToggle.style.background = "linear-gradient(90deg, #6293dca6, #a8c7f8a6)";
    flowStyleToggle.style.marginBottom = "30px";
    function syncUIwithAnim() {
        if (!animatedFlow) {
            flowStyleIndicLine.setAttribute("marker-end", "url(#arrow)");
            movingArrow.setAttribute("stroke-width", "0");
        }
        else {
            flowStyleIndicLine.setAttribute("marker-end", "");
            movingArrow.setAttribute("stroke-width", "1.5");
        }
    }
    syncUIwithAnim();
    flowStyleToggle.onclick = () => {
        animatedFlow = !animatedFlow;
        syncUIwithAnim();
        JSONSave();
        pathNetwork.querySelectorAll(".path").forEach(p => {
            const arrowGroup = p.children[0];
            const pathEl = p.children[1];
            const pathId = pathEl.getAttribute("id");
            if (!animatedFlow) {
                arrowGroup.children[1].remove();
                StaticiseFlow();
            }
            else {
                p.children[0].setAttribute("transform", "");
                const animMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
                animMotion.setAttribute("dur", "1s");
                animMotion.setAttribute("repeatCount", "indefinite");
                animMotion.setAttribute("rotate", "auto");
                const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
                mpath.setAttribute("href", `#${pathId}`);
                animMotion.appendChild(mpath);
                arrowGroup.appendChild(animMotion);
            }
        });
    };
}
//Animated Or Static Flow Settings End
//Style Settings End
//Settings End
//State Storage & Boot Start
//state is defined at the top
let isLoading = false;
function JSONSave() {
    if (isLoading)
        return;
    let localState = state;
    localState.settings = { nodecolor: NodeCol, pathcolor: PathCol, nodecount: nodeCount, pathcount: pathCount, pathopt: pathOption, animated: animatedFlow };
    localStorage.setItem("global-state", JSON.stringify(localState));
}
function JSONLoad(type) {
    isLoading = true;
    state = getState();
    if (type == "loadfile") {
        console.log("Loading localStorage global-state");
        playLoadSound();
    }
    infoPopupSection.innerHTML = "";
    nodeNetwork.innerHTML = "";
    pathNetwork.innerHTML = "";
    const onLayerNodes = state.nodes.filter((n) => parseInt(n.layer) == userOnLayer);
    const onLayerPaths = state.paths.filter((p) => parseInt(p.layer) == userOnLayer);
    onLayerNodes.forEach((n) => {
        const circG = document.createElementNS("http://www.w3.org/2000/svg", "g");
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", n.x);
        circle.setAttribute("cy", n.y);
        circle.setAttribute("r", "40");
        circle.setAttribute("fill", NodeCol);
        circG.setAttribute("id", n.id);
        circG.classList.add("node");
        circle.setAttribute("data-on-layer", n.layer);
        circle.classList.add("node");
        circG.appendChild(circle);
        nodeNetwork.appendChild(circG);
        makeDraggable(circG);
    });
    onLayerPaths.forEach((p) => {
        const startN = document.getElementById(p.x);
        const endN = document.getElementById(p.y);
        if (startN && endN) {
            NodeStart = startN;
            NodeEnd = endN;
            drawPath(startN, endN, true);
        }
        // grouping and other SVG stuff is handled by drawPath
    });
    isLoading = false;
}
function boot() {
    const loadState = JSON.parse(localStorage.getItem("global-state") || "null");
    //Initializiation
    state = loadState ? loadState : {
        settings: {
            nodecolor: "#6692C1",
            pathcolor: "#FFFFFF",
            nodecount: 0,
            pathcount: 0,
            pathopt: "Smooth",
            animated: true
        },
        nodes: [],
        paths: []
    };
    //Assignment
    const nodeNums = state.nodes.map((n) => parseInt(n.id.replace("node", "")));
    nodeCount = nodeNums.length ? Math.max(...nodeNums) + 1 : 1;
    const pathNums = state.paths.map((p) => parseInt(p.id.replace("path", "")));
    pathCount = pathNums.length ? Math.max(...pathNums) + 1 : 1;
    NodeCol = (state.settings && state.settings.nodecolor) ? state.settings.nodecolor : "#6692C1";
    PathCol = (state.settings && state.settings.pathcolor) ? state.settings.pathcolor : "#FFFFFF";
    pathOption = (state.settings && state.settings.pathopt) ? state.settings.pathopt : "8";
    animatedFlow = state.settings.animated;
    //Visual Setup of Path Setting
    const activePO = Object.keys(pathSettings).find(k => pathSettings[k] === pathOption); //activePO is activePathOption
    Object.keys(pathSettings).forEach(k => {
        const el = document.getElementById(k);
        if (k === activePO) {
            el?.classList.add("selected");
        }
        else {
            el?.classList.remove("selected");
        }
    });
    //Layer Setup
    const LayerNums = state.nodes.map((n) => parseInt(n.layer));
    const LayersToBeAdded = LayerNums.length ? Math.max(...LayerNums) : 2;
    for (let loop = 2; loop < LayersToBeAdded; loop++) {
        newLayerBtn();
    }
    syncLayerButtonColors();
    userOnLayer = 1;
    //Loading
    JSONLoad("loadfile");
}
boot();
export {};
//State Storage & Boot End
//# sourceMappingURL=main.js.map
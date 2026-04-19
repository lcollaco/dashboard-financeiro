const HASH_CORRETO = "a3eaa1668c36ed8fe6ff0130b8338cfb52346d155fe184b57a9184f28b9b13bf"
const TEMPO_EXPIRACAO = 2 * 60 * 60 * 1000

document.documentElement.style.display = "none"

function sha256(str){
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))
    .then(buf=>{
        return Array.from(new Uint8Array(buf))
        .map(b=>b.toString(16).padStart(2,"0"))
        .join("")
    })
}

function checkSession(){
    const session = localStorage.getItem("auth")
    if(!session) return false
    const data = JSON.parse(session)
    if(Date.now() > data.expira){
        localStorage.removeItem("auth")
        return false
    }
    return true
}

function createLogin(){
    document.body.innerHTML = `
    <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:black;display:flex;justify-content:center;align-items:center;z-index:999999;">
        <div style="background:#050505;border:1px solid #002b15;padding:40px;border-radius:12px;text-align:center;width:320px;">
            <h2 style="color:#00ff88;margin-bottom:20px">Dashboard Financeiro</h2>
            <input type="password" id="senha" placeholder="Digite a senha" style="width:100%;padding:12px;background:black;border:1px solid #002b15;color:#00ff88;border-radius:8px;margin-bottom:15px;"/>
            <button onclick="login()" style="width:100%;padding:12px;background:#002b15;border:none;color:#00ff88;border-radius:8px;cursor:pointer;">Entrar</button>
            <div id="erro" style="color:red;margin-top:10px;font-size:12px;"></div>
        </div>
    </div>`
    document.documentElement.style.display = "block"
}

async function login(){
    const senha = document.getElementById("senha").value
    const hash = await sha256(senha)
    if(hash === HASH_CORRETO){
        localStorage.setItem("auth",JSON.stringify({expira: Date.now() + TEMPO_EXPIRACAO}))
        location.reload()
    }else{
        document.getElementById("erro").innerText="Senha incorreta"
    }
}

if(!checkSession()){
    createLogin()
    throw new Error("Login necessário")
}else{
    document.documentElement.style.display = "block"
}

const assets=[
    {categoria:"Índices",icone:"📊",nome:"S&P 500",symbol:"CAPITALCOM:US500"},
    {categoria:"Índices",icone:"📈",nome:"IBOV",symbol:"BMFBOVESPA:IBOV"},
    {categoria:"Índices",icone:"🇺🇸",nome:"Dow Jones",symbol:"CAPITALCOM:US30"},
    {categoria:"Índices",icone:"💻",nome:"Nasdaq 100",symbol:"CAPITALCOM:US100"},
    {categoria:"Ações",icone:"🏦",nome:"BBAS3",symbol:"BMFBOVESPA:BBAS3"},
    {categoria:"Ações",icone:"🛢",nome:"PETR4",symbol:"BMFBOVESPA:PETR4"},
    {categoria:"Ações",icone:"⛏",nome:"VALE3",symbol:"BMFBOVESPA:VALE3"},
    {categoria:"Ações",icone:"🏛",nome:"ITUB4",symbol:"BMFBOVESPA:ITUB4"},
    {categoria:"Ações",icone:"🏛",nome:"BBDC4",symbol:"BMFBOVESPA:BBDC4"},
    {categoria:"Moedas",icone:"💵",nome:"USD → BRL",symbol:"FX_IDC:USDBRL"},
    {categoria:"Moedas",icone:"💶",nome:"EUR → BRL",symbol:"FX_IDC:EURBRL"},
    {categoria:"Moedas",icone:"💵",nome:"USD → ARS",symbol:"FX_IDC:USDARS"},
    {categoria:"Moedas",icone:"💰",nome:"BRL → ARS",symbol:"FX_IDC:BRLARS"},
    {categoria:"Moedas",icone:"💰",nome:"BRL → CNY",symbol:"FX_IDC:BRLCNY"},
    {categoria:"Crypto",icone:"₿",nome:"Bitcoin → BRL",symbol:"BINANCE:BTCBRL"},
    {categoria:"Crypto",icone:"◆",nome:"Ethereum → BRL",symbol:"BINANCE:ETHBRL"},
    {categoria:"Crypto",icone:"💰",nome:"BNB → BRL",symbol:"BINANCE:BNBBRL"},
    {categoria:"Crypto",icone:"💰",nome:"XRP → BRL",symbol:"BINANCE:XRPBRL"}
]

function variacao(){
    return (Math.random()*4-2).toFixed(2)
}

function buildSummary(){
    const el=document.getElementById("summary")
    if(!el) return
}

function buildFilters(){
    const filters=document.getElementById("filters")
    if(!filters) return
    const cats=["Todos",...new Set(assets.map(a=>a.categoria))]
    filters.innerHTML=""
    cats.forEach(c=>{
        filters.innerHTML+=`<div class="filter" onclick="filter('${c}',this)">${c}</div>`
    })
    filters.firstChild.classList.add("active")
}

function filter(cat,el){
    document.querySelectorAll(".filter").forEach(f=>f.classList.remove("active"))
    el.classList.add("active")
    document.querySelectorAll(".card").forEach(card=>{
        if(cat==="Todos"){
            card.style.display="block"
        }else{
            card.style.display=card.dataset.cat===cat ? "block":"none"
        }
    })
}

function buildCards(){
    const grid = document.getElementById("grid")
    if(!grid) return
    let cardsHTML=""
    assets.forEach((a,i)=>{
        cardsHTML+=`
        <div class="card" data-cat="${a.categoria}" onclick="fullscreen(this)">
            <h3 class="tv-title" style="color:#00ff88;margin-top:0">${a.icone} ${a.nome}</h3>
            <div id="chart${i}" class="widget"></div>
        </div>`
    })
    grid.innerHTML=cardsHTML
}

function create(symbol,container){
    if(!window.TradingView) return
    new TradingView.widget({
        autosize:true,
        symbol:symbol,
        interval:"D",
        timezone:"America/Sao_Paulo",
        theme:"dark",
        style:"1",
        locale:"br",
        toolbar_bg:"#000",
        enable_publishing:false,
        hide_top_toolbar:true,
        container_id:container
    })
}

function loadCharts(){
    assets.forEach((a,i)=>{
        create(a.symbol,"chart"+i)
    })
    const updateEl=document.getElementById("update")
    if(updateEl) updateEl.innerText="Atualizado: "+new Date().toLocaleTimeString()
}

function fullscreen(el){
    // Se o card clicado já for o que está em fullscreen, nós o fechamos
    if(el.classList.contains("fullscreen")){
        el.classList.remove("fullscreen");
    } else {
        // Primeiro, removemos o fullscreen de qualquer outro card que esteja aberto
        document.querySelectorAll(".card").forEach(c => c.classList.remove("fullscreen"));
        // Abrimos o card atual
        el.classList.add("fullscreen");
    }
    
    // Pequeno truque para o TradingView se ajustar ao novo tamanho instantaneamente
    window.dispatchEvent(new Event('resize'));
}


function buildTop(){
    const top=document.getElementById("topbar")
    if(!top) return
    top.innerHTML=""
    assets.forEach(a=>{
        const v=variacao()
        const cor=v>=0?"#00ff88":"#ff4444"
        top.innerHTML+=`<span class="ticker" style="color:${cor}">${a.icone} ${a.nome} ${v}%</span>`
    })
}

function mercado(){
    const mkt=document.getElementById("market")
    if(!mkt) return
    let hora=new Date().getHours()
    if(hora>=10 && hora<=18){
        mkt.innerHTML="🟢 Mercado Aberto"
    }else{
        mkt.innerHTML="🔴 Mercado Fechado"
    }
}

function autoRefresh(){
    let hour=new Date().getHours()
    if(hour>=10 && hour<=18){
        setInterval(loadCharts,60000)
    }else{
        setInterval(loadCharts,300000)
    }
}

function checkAlerts(){
    document.querySelectorAll(".card").forEach(card=>{
        if(Math.random()>0.92){
            card.classList.add("alert")
            setTimeout(()=>{ card.classList.remove("alert") },4000)
        }
    })
}

window.addEventListener("load",()=>{
    buildCards()
    setTimeout(()=>{loadCharts()},500)
    buildTop()
    buildSummary()
    buildFilters()
    autoRefresh()
    mercado()
    setInterval(checkAlerts,15000)
})

/* MODO TV */
let tvMode=false
let tvInterval=null
let tvIndex=0

function getPriority(){
    return assets.map((asset,i)=>{
        let prioridade=Math.random()
        if(asset.categoria==="Crypto") prioridade+=0.3
        if(asset.categoria==="Ações") prioridade+=0.2
        if(document.querySelectorAll(".card")[i]?.classList.contains("alert")){
            prioridade+=1
        }
        return{ index:i, prioridade:prioridade }
    }).sort((a,b)=>b.prioridade-a.prioridade)
}

function getDynamicTime(index){
    let card=document.querySelectorAll(".card")[index]
    if(!card) return 4000
    if(card.classList.contains("alert")) return 15000
    return 4000 + Math.random()*4000
}

function toggleTVMode(){
    tvMode=!tvMode
    if(tvMode){
        document.body.classList.add("tv-mode")
        startSmartTV()
    }else{
        document.body.classList.remove("tv-mode")
        stopSmartTV()
    }
}

function startSmartTV(){
    const run=()=>{
        if(!tvMode) return
        const cards=document.querySelectorAll(".card")
        if(!cards.length) return
        const prioridade=getPriority()

        // Limpa classes de todos os cards
        cards.forEach(c => {
            c.classList.remove("fullscreen-tv-top", "fullscreen-tv-bottom");
        });

        const index1 = prioridade[tvIndex % prioridade.length].index
        const index2 = prioridade[(tvIndex+1) % prioridade.length].index

        cards[index1].classList.add("fullscreen-tv-top")
        cards[index2].classList.add("fullscreen-tv-bottom")

        const tempo=getDynamicTime(index1)
        tvIndex = (tvIndex + 2) % prioridade.length
        tvInterval=setTimeout(run,tempo)
    }
    run()
}

function stopSmartTV(){
    clearTimeout(tvInterval)
    document.querySelectorAll(".card").forEach(c=>{
        c.classList.remove("fullscreen-tv-top")
        c.classList.remove("fullscreen-tv-bottom")
    })
    tvIndex=0
}

document.addEventListener("keydown",(e)=>{
    if(document.activeElement.tagName === "INPUT") return
    if(e.key.toLowerCase() === "t"){
        toggleTVMode()
    }
})

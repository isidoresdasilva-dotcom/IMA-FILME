document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* =========================================================
       I.M.A FILMES - APP.JS COMPLETO
       Biblioteca + IndexedDB + Publicação + Capas automáticas
       + Detalhes profissionais + Player + Séries + Favoritos
       + Pesquisa + Filtros + Progresso

       IMPORTANTE:
       - Não apaga o banco IMA_FILMES_DB.
       - Preserva os conteúdos já existentes no IndexedDB.
       - O modal de detalhes é criado automaticamente pelo JS.
       ========================================================= */

    const DB_NAME = "IMA_FILMES_DB";
    const STORE_NAME = "conteudos";

    let db = null;
    let filtroAtual = "todos";
    let videoAtual = null;
    let objectUrls = [];
    let detalhesAtual = null;
    let arquivosSerieSelecionados = [];
    let comissaoImaAtual = 0.10;

    /* =========================================================
       ELEMENTOS DO HTML
       ========================================================= */

    const botaoEnviar = document.getElementById("botaoEnviar");
    const botaoEnviarMenu = document.getElementById("botaoEnviarMenu");

    const modalPublicacao = document.getElementById("modalPublicacao");
    const fecharModal = document.getElementById("fecharModal");
    const cancelarPublicacao = document.getElementById("cancelarPublicacao");
    const salvarPublicacao = document.getElementById("salvarPublicacao");

    const tipoConteudo = document.getElementById("tipoConteudo");
    const arquivoCapa = document.getElementById("arquivoCapa");
    const previewCapa = document.getElementById("previewCapa");
    const nomeConteudo = document.getElementById("nomeConteudo");
    const descricaoConteudo = document.getElementById("descricaoConteudo");
    const anoConteudo = document.getElementById("anoConteudo");

    const areaSerie = document.getElementById("areaSerie");
    const quantidadeTemporadas = document.getElementById("quantidadeTemporadas");
    const quantidadeEpisodios = document.getElementById("quantidadeEpisodios");
    const listaTemporadas = document.getElementById("listaTemporadas");

    const areaVideo = document.getElementById("areaVideo");
    const arquivoVideo = document.getElementById("arquivoVideo");

    const tipoAcesso = document.getElementById("tipoAcesso");
    const areaPreco = document.getElementById("areaPreco");
    const precoConteudo = document.getElementById("precoConteudo");
    const aceitarRegras = document.getElementById("aceitarRegras");

    const listaFilmes = document.getElementById("listaFilmes");
    const campoPesquisa = document.getElementById("campoPesquisa");

    const modalPlayer = document.getElementById("modalPlayer");
    const fecharPlayer = document.getElementById("fecharPlayer");
    const videoPlayer = document.getElementById("videoPlayer");
    const tituloPlayer = document.getElementById("tituloPlayer");
    const descricaoPlayer = document.getElementById("descricaoPlayer");

    /* =========================================================
       INDEXEDDB - PRESERVAR BANCO EXISTENTE
       ========================================================= */

    function abrirBanco() {
        return new Promise(function (resolve, reject) {
            const pedido = indexedDB.open(DB_NAME);

            pedido.onupgradeneeded = function (evento) {
                const banco = evento.target.result;
                let store;

                if (!banco.objectStoreNames.contains(STORE_NAME)) {
                    store = banco.createObjectStore(STORE_NAME, {
                        keyPath: "id"
                    });
                } else {
                    store = evento.target.transaction.objectStore(STORE_NAME);
                }

                try {
                    if (!store.indexNames.contains("tipo")) {
                        store.createIndex("tipo", "tipo", { unique: false });
                    }
                    if (!store.indexNames.contains("dataPublicacao")) {
                        store.createIndex("dataPublicacao", "dataPublicacao", { unique: false });
                    }
                } catch (erro) {
                    console.warn("Índices: ", erro);
                }
            };

            pedido.onsuccess = function (evento) {
                db = evento.target.result;

                db.onversionchange = function () {
                    db.close();
                };

                resolve(db);
            };

            pedido.onerror = function () {
                reject(pedido.error || new Error("Não foi possível abrir o IndexedDB."));
            };

            pedido.onblocked = function () {
                console.warn("IndexedDB bloqueado por outra aba.");
            };
        });
    }

    function guardarConteudo(conteudo) {
        return new Promise(function (resolve, reject) {
            if (!db) {
                reject(new Error("Banco de dados não está aberto."));
                return;
            }

            try {
                const transacao = db.transaction(STORE_NAME, "readwrite");
                const store = transacao.objectStore(STORE_NAME);
                const pedido = store.put(conteudo);

                pedido.onsuccess = function () {
                    resolve();
                };

                pedido.onerror = function () {
                    reject(pedido.error);
                };
            } catch (erro) {
                reject(erro);
            }
        });
    }

    function obterConteudos() {
        return new Promise(function (resolve, reject) {
            try {
                const transacao = db.transaction(STORE_NAME, "readonly");
                const store = transacao.objectStore(STORE_NAME);
                const pedido = store.getAll();

                pedido.onsuccess = function () {
                    resolve(Array.isArray(pedido.result) ? pedido.result : []);
                };

                pedido.onerror = function () {
                    reject(pedido.error);
                };
            } catch (erro) {
                reject(erro);
            }
        });
    }

    function obterConteudo(id) {
        return new Promise(function (resolve, reject) {
            try {
                const transacao = db.transaction(STORE_NAME, "readonly");
                const pedido = transacao.objectStore(STORE_NAME).get(id);

                pedido.onsuccess = function () {
                    resolve(pedido.result);
                };

                pedido.onerror = function () {
                    reject(pedido.error);
                };
            } catch (erro) {
                reject(erro);
            }
        });
    }

    function atualizarConteudo(conteudo) {
        return guardarConteudo(conteudo);
    }

    function apagarConteudo(id) {
        return new Promise(function (resolve, reject) {
            try {
                const transacao = db.transaction(STORE_NAME, "readwrite");
                const pedido = transacao.objectStore(STORE_NAME).delete(id);

                pedido.onsuccess = function () {
                    resolve();
                };

                pedido.onerror = function () {
                    reject(pedido.error);
                };
            } catch (erro) {
                reject(erro);
            }
        });
    }

    /* =========================================================
       AUXILIARES
       ========================================================= */

    function gerarId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }

    function escaparTexto(texto) {
        return String(texto == null ? "" : texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatarData(data) {
        if (!data) return "";
        try {
            const d = new Date(data);
            if (Number.isNaN(d.getTime())) return "";
            return d.toLocaleDateString("pt-AO");
        } catch (erro) {
            return "";
        }
    }

    function formatarTempo(segundos) {
        segundos = Math.max(0, Number(segundos) || 0);
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const seg = Math.floor(segundos % 60);

        if (horas > 0) {
            return horas + ":" +
                String(minutos).padStart(2, "0") + ":" +
                String(seg).padStart(2, "0");
        }

        return minutos + ":" + String(seg).padStart(2, "0");
    }

    function converterParaBlob(valor, mimePadrao) {
        if (!valor) return null;

        if (valor instanceof Blob) return valor;

        if (valor instanceof ArrayBuffer) {
            return new Blob([valor], { type: mimePadrao || "application/octet-stream" });
        }

        if (ArrayBuffer.isView(valor)) {
            return new Blob([valor.buffer], { type: mimePadrao || "application/octet-stream" });
        }

        if (typeof valor === "object") {
            if (valor.data) {
                const b = converterParaBlob(valor.data, valor.type || mimePadrao);
                if (b) return b;
            }

            if (valor.buffer) {
                const b = converterParaBlob(valor.buffer, valor.type || mimePadrao);
                if (b) return b;
            }
        }

        return null;
    }

    function dataUrlParaBlob(dataUrl) {
        try {
            const partes = String(dataUrl).split(",");
            if (partes.length < 2) return null;

            const cabecalho = partes[0];
            const dados = partes.slice(1).join(",");
            const mime = (cabecalho.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
            const binario = atob(dados);
            const bytes = new Uint8Array(binario.length);

            for (let i = 0; i < binario.length; i++) {
                bytes[i] = binario.charCodeAt(i);
            }

            return new Blob([bytes], { type: mime });
        } catch (erro) {
            return null;
        }
    }

    function criarURL(valor, mimePadrao) {
        try {
            if (!valor) return "";

            if (typeof valor === "string") {
                if (
                    valor.startsWith("blob:") ||
                    valor.startsWith("data:") ||
                    valor.startsWith("http://") ||
                    valor.startsWith("https://")
                ) {
                    return valor;
                }

                return "";
            }

            const blob = converterParaBlob(valor, mimePadrao);

            if (!blob) return "";

            const url = URL.createObjectURL(blob);
            if (url) objectUrls.push(url);
            return url;
        } catch (erro) {
            console.warn("URL inválida ignorada:", erro);
            return "";
        }
    }

    function limparURLs() {
        objectUrls.forEach(function (url) {
            try {
                if (String(url).startsWith("blob:")) {
                    URL.revokeObjectURL(url);
                }
            } catch (erro) {}
        });

        objectUrls = [];
    }

    function normalizarConteudo(c) {
        if (!c || typeof c !== "object") return null;

        return {
            ...c,
            id: c.id || gerarId(),
            tipo: c.tipo === "serie" ? "serie" : "filme",
            nome: c.nome || c.titulo || "Sem título",
            descricao: c.descricao || "",
            ano: c.ano || "",
            acesso: c.acesso || c.tipoAcesso || "gratis",
            preco: Number(c.preco || 0),
            favorito: c.favorito === true,
            visualizacoes: Number(c.visualizacoes || c.views || 0),
            progresso: Number(c.progresso || 0),
            duracao: Number(c.duracao || 0),
            temporadas: Array.isArray(c.temporadas) ? c.temporadas : []
        };
    }

    function textoAcesso(conteudo) {
        if (conteudo.acesso === "venda") {
            return "💰 Venda • " + Number(conteudo.preco || 0).toLocaleString("pt-AO") + " Kz";
        }

        if (conteudo.acesso === "aluguel") {
            return "🎟️ Aluguel • " + Number(conteudo.preco || 0).toLocaleString("pt-AO") + " Kz";
        }

        return "🆓 Gratuito";
    }

    function totalEpisodios(serie) {
        return (serie.temporadas || []).reduce(function (total, temporada) {
            return total + ((temporada && Array.isArray(temporada.episodios)) ? temporada.episodios.length : 0);
        }, 0);
    }

    function totalVisualizacoes(serie) {
        let total = Number(serie.visualizacoes || 0);

        (serie.temporadas || []).forEach(function (temporada) {
            (temporada.episodios || []).forEach(function (ep) {
                total += Number(ep.visualizacoes || 0);
            });
        });

        return total;
    }

    /* =========================================================
       ESTILO DO MODAL PROFISSIONAL - INJETADO AUTOMATICAMENTE
       ========================================================= */

    function instalarEstiloDetalhes() {
        if (document.getElementById("ima-detalhes-style")) return;

        const style = document.createElement("style");
        style.id = "ima-detalhes-style";

        style.textContent = `
            #imaModalDetalhes {
                position: fixed;
                inset: 0;
                z-index: 99990;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: rgba(0,0,0,.82);
                backdrop-filter: blur(8px);
            }

            #imaModalDetalhes.ativo {
                display: flex;
            }

            .ima-detalhes-caixa {
                position: relative;
                width: min(1050px, 96vw);
                max-height: 94vh;
                overflow-y: auto;
                border-radius: 20px;
                background: #101318;
                color: #fff;
                box-shadow: 0 25px 80px rgba(0,0,0,.6);
                border: 1px solid rgba(255,255,255,.10);
            }

            .ima-detalhes-fechar {
                position: absolute;
                right: 16px;
                top: 16px;
                z-index: 5;
                width: 42px;
                height: 42px;
                border: 0;
                border-radius: 50%;
                background: rgba(0,0,0,.65);
                color: #fff;
                font-size: 22px;
                cursor: pointer;
            }

            .ima-detalhes-hero {
                min-height: 390px;
                display: grid;
                grid-template-columns: 270px 1fr;
                gap: 28px;
                padding: 38px;
                align-items: center;
                background:
                    radial-gradient(circle at 75% 30%, rgba(255,255,255,.12), transparent 35%),
                    linear-gradient(135deg, #171b23, #090b0f);
            }

            .ima-detalhes-capa {
                width: 100%;
                aspect-ratio: 2/3;
                overflow: hidden;
                border-radius: 14px;
                background: #222;
                box-shadow: 0 15px 40px rgba(0,0,0,.45);
            }

            .ima-detalhes-capa img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .ima-detalhes-info h1 {
                margin: 0 55px 10px 0;
                font-size: clamp(28px, 5vw, 48px);
                line-height: 1.05;
            }

            .ima-detalhes-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin: 12px 0 18px;
            }

            .ima-detalhes-badge {
                padding: 7px 11px;
                border-radius: 999px;
                background: rgba(255,255,255,.10);
                font-size: 13px;
            }

            .ima-detalhes-descricao {
                max-width: 720px;
                color: rgba(255,255,255,.82);
                line-height: 1.65;
                white-space: pre-wrap;
            }

            .ima-detalhes-acoes {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 22px;
            }

            .ima-detalhes-btn {
                border: 0;
                border-radius: 10px;
                padding: 12px 17px;
                color: #fff;
                background: #242a34;
                cursor: pointer;
                font-weight: 700;
            }

            .ima-detalhes-btn.principal {
                background: #e50914;
            }

            .ima-detalhes-btn:hover {
                transform: translateY(-1px);
                filter: brightness(1.08);
            }

            .ima-detalhes-progresso {
                margin-top: 22px;
                max-width: 650px;
            }

            .ima-detalhes-barra {
                height: 7px;
                margin-top: 8px;
                overflow: hidden;
                border-radius: 99px;
                background: rgba(255,255,255,.13);
            }

            .ima-detalhes-barra > span {
                display: block;
                height: 100%;
                background: #e50914;
                border-radius: inherit;
            }

            .ima-detalhes-corpo {
                padding: 0 38px 38px;
            }

            .ima-detalhes-secao {
                margin-top: 28px;
            }

            .ima-detalhes-secao h2 {
                margin-bottom: 14px;
            }

            .ima-temporada {
                margin-top: 12px;
                border: 1px solid rgba(255,255,255,.09);
                border-radius: 13px;
                overflow: hidden;
                background: rgba(255,255,255,.035);
            }

            .ima-temporada-titulo {
                padding: 15px 17px;
                font-weight: 800;
                background: rgba(255,255,255,.045);
            }

            .ima-episodio {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 12px;
                align-items: center;
                padding: 13px 17px;
                border-top: 1px solid rgba(255,255,255,.07);
            }

            .ima-episodio-nome {
                font-weight: 700;
            }

            .ima-episodio-sub {
                display: block;
                margin-top: 4px;
                font-size: 12px;
                opacity: .65;
            }

            .ima-episodio button {
                border: 0;
                border-radius: 9px;
                padding: 9px 12px;
                cursor: pointer;
                background: #e50914;
                color: #fff;
                font-weight: 700;
            }

            @media (max-width: 700px) {
                #imaModalDetalhes {
                    padding: 8px;
                }

                .ima-detalhes-hero {
                    grid-template-columns: 125px 1fr;
                    gap: 16px;
                    padding: 24px 18px;
                    min-height: 0;
                }

                .ima-detalhes-info h1 {
                    font-size: 26px;
                    margin-right: 35px;
                }

                .ima-detalhes-corpo {
                    padding: 0 18px 25px;
                }

                .ima-detalhes-acoes {
                    gap: 7px;
                }

                .ima-detalhes-btn {
                    padding: 10px 12px;
                    font-size: 13px;
                }

                .ima-episodio {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function criarModalDetalhes() {
        if (document.getElementById("imaModalDetalhes")) return;

        const modal = document.createElement("div");
        modal.id = "imaModalDetalhes";

        modal.innerHTML = `
            <div class="ima-detalhes-caixa" role="dialog" aria-modal="true">
                <button class="ima-detalhes-fechar" id="imaFecharDetalhes" title="Fechar">✕</button>
                <div id="imaDetalhesConteudo"></div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", function (evento) {
            if (evento.target === modal) fecharDetalhes();
        });

        document.getElementById("imaFecharDetalhes").addEventListener("click", fecharDetalhes);
    }

    function fecharDetalhes() {
        const modal = document.getElementById("imaModalDetalhes");
        if (modal) modal.classList.remove("ativo");
        detalhesAtual = null;
    }

    /* =========================================================
       MODAL DE DETALHES
       ========================================================= */

    async function abrirDetalhes(conteudo) {
        conteudo = normalizarConteudo(conteudo);
        if (!conteudo) return;

        detalhesAtual = conteudo;
        criarModalDetalhes();

        const modal = document.getElementById("imaModalDetalhes");
        const area = document.getElementById("imaDetalhesConteudo");

        const capaURL = criarURL(conteudo.capa, "image/jpeg");
        const tipoTexto = conteudo.tipo === "serie" ? "📺 Série" : "🎬 Filme";
        const visualizacoes = totalVisualizacoes(conteudo);

        let html = `
            <div class="ima-detalhes-hero">
                <div class="ima-detalhes-capa">
                    ${
                        capaURL
                        ? `<img src="${capaURL}" alt="${escaparTexto(conteudo.nome)}">`
                        : `<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:70px;">🎬</div>`
                    }
                </div>

                <div class="ima-detalhes-info">
                    <h1>${escaparTexto(conteudo.nome)}</h1>

                    <div class="ima-detalhes-meta">
                        <span class="ima-detalhes-badge">${tipoTexto}</span>
                        ${conteudo.ano ? `<span class="ima-detalhes-badge">📅 ${escaparTexto(conteudo.ano)}</span>` : ""}
                        <span class="ima-detalhes-badge">👁️ ${visualizacoes} visualizações</span>
                        <span class="ima-detalhes-badge">${escaparTexto(textoAcesso(conteudo))}</span>
                    </div>

                    <div class="ima-detalhes-descricao">
                        ${escaparTexto(conteudo.descricao || "Sem descrição.")}
                    </div>

                    <div class="ima-detalhes-acoes">
                        <button class="ima-detalhes-btn principal" id="imaDetalhesAssistir">
                            ▶️ ${conteudo.tipo === "serie" ? "Escolher episódio" : "Assistir agora"}
                        </button>

                        <button class="ima-detalhes-btn" id="imaDetalhesFavorito">
                            ${conteudo.favorito ? "❤️ Favorito" : "🤍 Favoritar"}
                        </button>

                        <button class="ima-detalhes-btn" id="imaDetalhesCompartilhar">
                            🔗 Partilhar
                        </button>

                        ${
                            conteudo.tipo === "filme"
                            ? `<button class="ima-detalhes-btn" id="imaDetalhesBaixar">⬇️ Baixar</button>`
                            : ""
                        }
                    </div>

                    ${
                        Number(conteudo.progresso || 0) > 0
                        ? `
                            <div class="ima-detalhes-progresso">
                                <div>▶️ Continuar assistindo — ${Math.round(conteudo.progresso)}%</div>
                                <div class="ima-detalhes-barra">
                                    <span style="width:${Math.min(100, Math.max(0, conteudo.progresso))}%"></span>
                                </div>
                            </div>
                        `
                        : ""
                    }
                </div>
            </div>

            <div class="ima-detalhes-corpo">
        `;

        if (conteudo.tipo === "filme") {
            html += `
                <div class="ima-detalhes-secao">
                    <h2>🎬 Sobre este filme</h2>
                    <p style="opacity:.72;">
                        Publicado em ${escaparTexto(formatarData(conteudo.dataPublicacao) || "data não disponível")}.
                        ${conteudo.duracao ? " Duração: " + escaparTexto(formatarTempo(conteudo.duracao)) + "." : ""}
                    </p>
                </div>
            `;
        } else {
            html += `
                <div class="ima-detalhes-secao">
                    <h2>📺 Temporadas e episódios</h2>
                    <p style="opacity:.72;">
                        ${(conteudo.temporadas || []).length} temporada(s) • ${totalEpisodios(conteudo)} episódio(s)
                    </p>
            `;

            if (!conteudo.temporadas || conteudo.temporadas.length === 0) {
                html += `<p>Esta série ainda não possui episódios.</p>`;
            } else {
                conteudo.temporadas.forEach(function (temporada) {
                    html += `
                        <div class="ima-temporada">
                            <div class="ima-temporada-titulo">
                                📚 Temporada ${escaparTexto(temporada.numero || "")}
                            </div>
                    `;

                    (temporada.episodios || []).forEach(function (episodio) {
                        const progresso = Number(episodio.progresso || 0);

                        html += `
                            <div class="ima-episodio">
                                <div>
                                    <span class="ima-episodio-nome">
                                        Episódio ${escaparTexto(episodio.numero || "")} — ${escaparTexto(episodio.nome || "Episódio")}
                                    </span>
                                    <span class="ima-episodio-sub">
                                        👁️ ${Number(episodio.visualizacoes || 0)} visualizações
                                        ${progresso > 0 ? " • " + Math.round(progresso) + "% assistido" : ""}
                                    </span>
                                </div>
                                <button
                                    class="ima-episodio-play"
                                    data-temporada="${escaparTexto(temporada.numero)}"
                                    data-episodio="${escaparTexto(episodio.numero)}"
                                >
                                    ▶️ Assistir
                                </button>
                            </div>
                        `;
                    });

                    html += `</div>`;
                });
            }

            html += `</div>`;
        }

        html += `</div>`;
        area.innerHTML = html;
        modal.classList.add("ativo");

        const btnAssistir = document.getElementById("imaDetalhesAssistir");
        const btnFavorito = document.getElementById("imaDetalhesFavorito");
        const btnCompartilhar = document.getElementById("imaDetalhesCompartilhar");
        const btnBaixar = document.getElementById("imaDetalhesBaixar");

        if (btnAssistir) {
            btnAssistir.addEventListener("click", function () {
                if (conteudo.tipo === "filme") {
                    fecharDetalhes();
                    reproduzirFilme(conteudo);
                } else {
                    const primeiro = encontrarPrimeiroEpisodio(conteudo);
                    if (primeiro) {
                        fecharDetalhes();
                        reproduzirEpisodio(conteudo, primeiro.temporada, primeiro.episodio);
                    } else {
                        alert("Esta série não possui episódios com vídeo.");
                    }
                }
            });
        }

        if (btnFavorito) {
            btnFavorito.addEventListener("click", async function () {
                conteudo.favorito = !conteudo.favorito;
                await atualizarConteudo(conteudo);
                await abrirDetalhes(conteudo);
                await carregarConteudos();
            });
        }

        if (btnCompartilhar) {
            btnCompartilhar.addEventListener("click", function () {
                partilhar(conteudo);
            });
        }

        if (btnBaixar) {
            btnBaixar.addEventListener("click", function () {
                baixarVideo(conteudo.video, conteudo.nome);
            });
        }

        area.querySelectorAll(".ima-episodio-play").forEach(function (botao) {
            botao.addEventListener("click", function () {
                const temporadaNumero = Number(botao.dataset.temporada);
                const episodioNumero = Number(botao.dataset.episodio);

                const temporada = (conteudo.temporadas || []).find(function (t) {
                    return Number(t.numero) === temporadaNumero;
                });

                const episodio = temporada && (temporada.episodios || []).find(function (e) {
                    return Number(e.numero) === episodioNumero;
                });

                if (!temporada || !episodio) {
                    alert("Episódio não encontrado.");
                    return;
                }

                fecharDetalhes();
                reproduzirEpisodio(conteudo, temporada, episodio);
            });
        });
    }

    function encontrarPrimeiroEpisodio(serie) {
        for (const temporada of (serie.temporadas || [])) {
            for (const episodio of (temporada.episodios || [])) {
                if (episodio && episodio.video) {
                    return { temporada: temporada, episodio: episodio };
                }
            }
        }
        return null;
    }

    /* =========================================================
       PUBLICAÇÃO
       ========================================================= */

    function abrirPublicacao() {
        if (!modalPublicacao) return;
        modalPublicacao.style.display = "flex";
        modalPublicacao.classList.add("ativo");
    }

    function fecharPublicacao() {
        if (!modalPublicacao) return;
        modalPublicacao.style.display = "none";
        modalPublicacao.classList.remove("ativo");
    }

    if (botaoEnviar) botaoEnviar.addEventListener("click", abrirPublicacao);
    if (botaoEnviarMenu) botaoEnviarMenu.addEventListener("click", abrirPublicacao);
    if (fecharModal) fecharModal.addEventListener("click", fecharPublicacao);
    if (cancelarPublicacao) cancelarPublicacao.addEventListener("click", fecharPublicacao);

    function atualizarTipoConteudo() {
        const tipo = tipoConteudo ? tipoConteudo.value : "filme";

        if (areaSerie) {
            areaSerie.style.display = tipo === "serie" ? "block" : "none";
        }

        if (areaVideo) {
            areaVideo.style.display = tipo === "filme" ? "block" : "none";
        }
    }

    if (tipoConteudo) {
        tipoConteudo.addEventListener("change", atualizarTipoConteudo);
    }

    function atualizarPreco() {
        if (!tipoAcesso || !areaPreco) return;

        const pago = tipoAcesso.value === "venda" || tipoAcesso.value === "aluguel";
        areaPreco.style.display = pago ? "block" : "none";

        if (!pago && precoConteudo) precoConteudo.value = "";
    }

    if (tipoAcesso) {
        tipoAcesso.addEventListener("change", atualizarPreco);
    }

    /* =========================================================
       CAPA MANUAL
       ========================================================= */

    if (arquivoCapa) {
        arquivoCapa.addEventListener("change", function () {
            const arquivo = arquivoCapa.files && arquivoCapa.files[0];
            if (!arquivo) return;

            if (!arquivo.type.startsWith("image/")) {
                alert("Escolha uma imagem válida.");
                arquivoCapa.value = "";
                return;
            }

            arquivoCapa._capaAutomatica = null;

            const url = URL.createObjectURL(arquivo);

            if (previewCapa) {
                previewCapa.innerHTML =
                    `<img src="${url}" alt="Capa" style="width:100%;height:100%;object-fit:cover;">`;
            }
        });
    }

    /* =========================================================
       CAPA AUTOMÁTICA
       ========================================================= */

    function gerarCapaDoVideo(arquivo, porcentagem) {
        return new Promise(function (resolve, reject) {
            if (!(arquivo instanceof Blob)) {
                reject(new Error("Vídeo inválido."));
                return;
            }

            const video = document.createElement("video");
            const url = URL.createObjectURL(arquivo);

            video.preload = "metadata";
            video.muted = true;
            video.playsInline = true;
            video.src = url;

            let finalizado = false;

            function limpar() {
                try { URL.revokeObjectURL(url); } catch (erro) {}
            }

            function erro(mensagem) {
                if (finalizado) return;
                finalizado = true;
                limpar();
                reject(new Error(mensagem));
            }

            video.onloadedmetadata = function () {
                let tempo = Number(video.duration) * Number(porcentagem || 0.2);

                if (!Number.isFinite(tempo)) tempo = 0;

                tempo = Math.max(0, Math.min(tempo, Math.max(0, video.duration - 0.1)));

                try {
                    video.currentTime = tempo;
                } catch (e) {
                    erro("Não foi possível posicionar o vídeo.");
                }
            };

            video.onseeked = function () {
                if (finalizado) return;

                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 360;

                    const contexto = canvas.getContext("2d");

                    if (!contexto) {
                        erro("Canvas indisponível.");
                        return;
                    }

                    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob(function (blob) {
                        if (finalizado) return;

                        if (!blob) {
                            erro("Não foi possível gerar a capa.");
                            return;
                        }

                        finalizado = true;
                        limpar();
                        resolve(blob);
                    }, "image/jpeg", 0.88);
                } catch (e) {
                    erro("Erro ao gerar a imagem da capa.");
                }
            };

            video.onerror = function () {
                erro("Erro ao ler o vídeo.");
            };
        });
    }

    async function gerarCapasAutomaticas(arquivo) {
        if (!arquivo) return [];

        const porcentagens = [0.05, 0.20, 0.40, 0.60, 0.80];
        const capas = [];

        for (const porcentagem of porcentagens) {
            try {
                const blob = await gerarCapaDoVideo(arquivo, porcentagem);
                capas.push({ blob: blob, tempo: porcentagem });
            } catch (erro) {
                console.warn("Capa automática:", erro);
            }
        }

        return capas;
    }

    function mostrarCapasAutomaticas(capas) {
        if (!previewCapa || !capas.length) return;

        let html = `
            <div style="width:100%;">
                <strong>🤖 Escolha uma capa automática</strong>
                <div style="display:flex;gap:8px;overflow-x:auto;margin-top:10px;">
        `;

        capas.forEach(function (capa, indice) {
            const url = URL.createObjectURL(capa.blob);
            objectUrls.push(url);

            html += `
                <button type="button"
                    class="capa-automatica"
                    data-indice="${indice}"
                    style="padding:2px;border:2px solid transparent;background:none;cursor:pointer;flex:0 0 auto;">
                    <img src="${url}"
                        style="width:95px;height:135px;object-fit:cover;border-radius:6px;"
                        alt="Capa ${indice + 1}">
                </button>
            `;
        });

        html += `</div></div>`;
        previewCapa.innerHTML = html;

        const botoes = previewCapa.querySelectorAll(".capa-automatica");

        botoes.forEach(function (botao) {
            botao.addEventListener("click", function () {
                botoes.forEach(function (b) {
                    b.style.border = "2px solid transparent";
                });

                botao.style.border = "2px solid #00ff88";

                const indice = Number(botao.dataset.indice);
                arquivoCapa._capaAutomatica = capas[indice].blob;
            });
        });

        if (botoes[0]) botoes[0].click();
    }

    if (arquivoVideo) {
        arquivoVideo.addEventListener("change", async function () {
            const arquivo = arquivoVideo.files && arquivoVideo.files[0];
            if (!arquivo) return;

            if (!arquivo.type.startsWith("video/")) {
                alert("Escolha um vídeo válido.");
                arquivoVideo.value = "";
                return;
            }

            if (previewCapa) {
                previewCapa.innerHTML = "🤖 Gerando capas automaticamente...";
            }

            const capas = await gerarCapasAutomaticas(arquivo);

            if (capas.length) {
                mostrarCapasAutomaticas(capas);
            } else if (previewCapa) {
                previewCapa.innerHTML = "Não foi possível gerar a capa automática.";
            }
        });
    }

    /* =========================================================
       V2 - PUBLICAÇÃO AVANÇADA
       ========================================================= */

    function prepararPublicacaoAvancada() {
        const areaSerieLocal = document.getElementById("areaSerie");
        if (areaSerieLocal && !document.getElementById("arquivoEpisodiosTodos")) {
            const caixa = document.createElement("div");
            caixa.style.marginTop = "15px";
            caixa.style.padding = "14px";
            caixa.style.border = "1px solid rgba(255,255,255,.14)";
            caixa.style.borderRadius = "12px";
            caixa.innerHTML = `
                <label>🎞️ Selecionar todos os episódios de uma vez</label>
                <input type="file" id="arquivoEpisodiosTodos" accept="video/*" multiple>
                <small style="display:block;margin-top:7px;opacity:.8;">
                    Selecione todos os episódios de todas as temporadas. A ordem escolhida será usada para preencher os episódios.
                </small>
                <div id="resumoEpisodiosTodos" style="margin-top:8px;font-size:13px;"></div>
            `;
            areaSerieLocal.insertBefore(caixa, areaSerieLocal.querySelector("#listaTemporadas") || null);
            const input = caixa.querySelector("#arquivoEpisodiosTodos");
            input.addEventListener("change", function () {
                arquivosSerieSelecionados = Array.from(input.files || []).filter(f => f.type.startsWith("video/"));
                const resumo = document.getElementById("resumoEpisodiosTodos");
                if (resumo) resumo.textContent = arquivosSerieSelecionados.length
                    ? `✅ ${arquivosSerieSelecionados.length} episódio(s) selecionado(s).`
                    : "";
                preencherEpisodiosSelecionados();
                if (arquivosSerieSelecionados.length && typeof gerarCapasAutomaticas === "function") {
                    const primeira = arquivosSerieSelecionados[0];
                    gerarCapasAutomaticas(primeira).then(capas => {
                        if (capas.length) mostrarCapasAutomaticas(capas);
                    });
                }
            });
        }

        if (tipoAcesso && !document.getElementById("formaPagamento")) {
            const rotulo = document.createElement("div");
            rotulo.id = "blocoPagamentoIma";
            rotulo.style.marginTop = "12px";
            rotulo.innerHTML = `
                <label>💳 Forma de pagamento</label>
                <select id="formaPagamento">
                    <option value="multicaixa_express">📲 Multicaixa Express</option>
                    <option value="transferencia">🏦 Transferência bancária</option>
                    <option value="carteira_ima">💼 Carteira I.M.A (futura)</option>
                </select>
                <small style="display:block;margin-top:6px;opacity:.75;">Nesta versão o checkout é apenas demonstração. Nenhum dinheiro é cobrado.</small>
            `;
            tipoAcesso.parentNode.insertBefore(rotulo, areaPreco || null);
        }
    }

    function preencherEpisodiosSelecionados() {
        if (!listaTemporadas || !arquivosSerieSelecionados.length) return;
        const campos = Array.from(listaTemporadas.querySelectorAll(".arquivo-episodio"));
        campos.forEach((campo, i) => {
            try {
                const dt = new DataTransfer();
                if (arquivosSerieSelecionados[i]) dt.items.add(arquivosSerieSelecionados[i]);
                campo.files = dt.files;
            } catch (e) {}
        });
    }

    /* =========================================================
       TEMPORADAS E EPISÓDIOS
       ========================================================= */

    function criarCamposTemporadas() {
        if (!listaTemporadas || !quantidadeTemporadas) return;

        const quantidade = Number(quantidadeTemporadas.value);
        const quantidadeEp = Math.max(1, Number(quantidadeEpisodios ? quantidadeEpisodios.value : 1) || 1);

        listaTemporadas.innerHTML = "";

        if (!quantidade || quantidade < 1) return;

        for (let temporada = 1; temporada <= quantidade; temporada++) {
            const bloco = document.createElement("div");
            bloco.className = "temporada-bloco";
            bloco.style.marginTop = "15px";
            bloco.style.padding = "12px";
            bloco.style.border = "1px solid rgba(255,255,255,.15)";
            bloco.style.borderRadius = "10px";

            bloco.innerHTML =
                `<h4>📺 Temporada ${temporada}</h4>
                 <div class="episodios-temporada"></div>`;

            const area = bloco.querySelector(".episodios-temporada");

            for (let episodio = 1; episodio <= quantidadeEp; episodio++) {
                const grupo = document.createElement("div");
                grupo.style.marginTop = "10px";

                grupo.innerHTML =
                    `<label>🎞️ Episódio ${episodio}</label>
                     <input type="text" class="nome-episodio" placeholder="Nome do episódio">
                     <input type="file" class="arquivo-episodio" accept="video/*">`;

                area.appendChild(grupo);
            }

            listaTemporadas.appendChild(bloco);
        }

        preencherEpisodiosSelecionados();
    }

    if (quantidadeTemporadas) quantidadeTemporadas.addEventListener("input", criarCamposTemporadas);
    if (quantidadeEpisodios) quantidadeEpisodios.addEventListener("input", criarCamposTemporadas);

    /* =========================================================
       PUBLICAR
       ========================================================= */

    if (salvarPublicacao) {
        salvarPublicacao.addEventListener("click", async function () {
            try {
                const nome = nomeConteudo ? nomeConteudo.value.trim() : "";
                const descricao = descricaoConteudo ? descricaoConteudo.value.trim() : "";
                const ano = anoConteudo ? anoConteudo.value : "";
                const tipo = tipoConteudo ? tipoConteudo.value : "filme";
                const acesso = tipoAcesso ? tipoAcesso.value : "gratis";
                const preco = precoConteudo ? precoConteudo.value : "";

                const capaArquivo = arquivoCapa && arquivoCapa.files[0]
                    ? arquivoCapa.files[0]
                    : null;

                const videoArquivo = arquivoVideo && arquivoVideo.files[0]
                    ? arquivoVideo.files[0]
                    : null;

                if (!nome) {
                    alert("Digite o nome do conteúdo.");
                    if (nomeConteudo) nomeConteudo.focus();
                    return;
                }

                if (!descricao) {
                    alert("Digite uma descrição.");
                    if (descricaoConteudo) descricaoConteudo.focus();
                    return;
                }

                if (!ano) {
                    alert("Digite o ano.");
                    if (anoConteudo) anoConteudo.focus();
                    return;
                }

                if (tipo === "filme" && !videoArquivo) {
                    alert("Escolha o vídeo do filme.");
                    return;
                }

                if (!aceitarRegras || !aceitarRegras.checked) {
                    alert("Você precisa aceitar as regras do I.M.A Filmes.");
                    return;
                }

                if (
                    (acesso === "venda" || acesso === "aluguel") &&
                    (!preco || Number(preco) <= 0)
                ) {
                    alert("Digite um preço válido.");
                    return;
                }

                let capaBlob = null;

                if (capaArquivo) {
                    capaBlob = capaArquivo;
                } else if (arquivoCapa && arquivoCapa._capaAutomatica) {
                    capaBlob = arquivoCapa._capaAutomatica;
                } else if (tipo === "filme" && videoArquivo) {
                    try { capaBlob = await gerarCapaDoVideo(videoArquivo, 0.20); } catch (erro) { console.warn("Capa automática falhou:", erro); }
                } else if (tipo === "serie" && arquivosSerieSelecionados.length) {
                    try { capaBlob = await gerarCapaDoVideo(arquivosSerieSelecionados[0], 0.20); } catch (erro) { console.warn("Capa automática da série falhou:", erro); }
                }

                if (!capaBlob) {
                    alert("Escolha uma capa ou selecione uma capa automática.");
                    return;
                }

                if (tipo === "filme") {
                    const conteudo = {
                        id: gerarId(),
                        tipo: "filme",
                        nome: nome,
                        descricao: descricao,
                        ano: Number(ano),
                        acesso: acesso,
                        preco: Number(preco) || 0,
                        capa: capaBlob,
                        video: videoArquivo,
                        favorito: false,
                        visualizacoes: 0,
                        progresso: 0,
                        duracao: 0,
                        ultimoAcesso: null,
                        dataPublicacao: Date.now(),
                        formaPagamento: (document.getElementById("formaPagamento") || {}).value || "multicaixa_express",
                        comissaoIma: comissaoImaAtual,
                        vendedor: "Criador local",
                        vendas: 0,
                        ultimaVenda: null
                    };

                    await guardarConteudo(conteudo);
                    alert("🎉 Filme publicado com sucesso!");
                } else {
                    if (!arquivosSerieSelecionados.length) {
                        const inputTodos = document.getElementById("arquivoEpisodiosTodos");
                        if (inputTodos && inputTodos.files.length) arquivosSerieSelecionados = Array.from(inputTodos.files);
                    }
                    if (arquivosSerieSelecionados.length) preencherEpisodiosSelecionados();
                    const temporadas = [];
                    const blocos = listaTemporadas
                        ? listaTemporadas.querySelectorAll(".temporada-bloco")
                        : [];

                    for (let i = 0; i < blocos.length; i++) {
                        const arquivos = blocos[i].querySelectorAll(".arquivo-episodio");
                        const nomes = blocos[i].querySelectorAll(".nome-episodio");
                        const episodios = [];

                        for (let j = 0; j < arquivos.length; j++) {
                            const arquivo = arquivos[j].files[0];

                            if (!arquivo) continue;

                            episodios.push({
                                numero: j + 1,
                                nome: nomes[j]
                                    ? nomes[j].value.trim() || "Episódio " + (j + 1)
                                    : "Episódio " + (j + 1),
                                video: arquivo,
                                progresso: 0,
                                visualizacoes: 0,
                                ultimoAcesso: null
                            });
                        }

                        if (episodios.length) {
                            temporadas.push({
                                numero: i + 1,
                                episodios: episodios
                            });
                        }
                    }

                    const totalSelecionados = arquivosSerieSelecionados.length;
                    const totalMontados = temporadas.reduce((s, t) => s + t.episodios.length, 0);
                    if (!temporadas.length || totalMontados === 0) {
                        alert("Selecione os episódios da série.");
                        return;
                    }
                    if (totalSelecionados && totalMontados !== totalSelecionados) {
                        alert(`Foram selecionados ${totalSelecionados} episódio(s), mas só ${totalMontados} foram distribuídos. Aumente as temporadas/episódios.`);
                        return;
                    }

                    const conteudo = {
                        id: gerarId(),
                        tipo: "serie",
                        nome: nome,
                        descricao: descricao,
                        ano: Number(ano),
                        acesso: acesso,
                        preco: Number(preco) || 0,
                        capa: capaBlob,
                        temporadas: temporadas,
                        favorito: false,
                        visualizacoes: 0,
                        progresso: 0,
                        ultimoAcesso: null,
                        dataPublicacao: Date.now(),
                        formaPagamento: (document.getElementById("formaPagamento") || {}).value || "multicaixa_express",
                        comissaoIma: comissaoImaAtual,
                        vendedor: "Criador local",
                        vendas: 0,
                        ultimaVenda: null
                    };

                    await guardarConteudo(conteudo);
                    alert("🎉 Série publicada com sucesso!");
                }

                limparFormulario();
                fecharPublicacao();
                await carregarConteudos();

            } catch (erro) {
                console.error("Erro ao publicar:", erro);
                alert(
                    "❌ Não foi possível publicar o conteúdo.\n\n" +
                    "Verifique os arquivos e tente novamente."
                );
            }
        });
    }

    function limparFormulario() {
        if (nomeConteudo) nomeConteudo.value = "";
        if (descricaoConteudo) descricaoConteudo.value = "";
        if (anoConteudo) anoConteudo.value = "";
        if (arquivoCapa) {
            arquivoCapa.value = "";
            arquivoCapa._capaAutomatica = null;
        }
        if (arquivoVideo) arquivoVideo.value = "";
        const inputTodos = document.getElementById("arquivoEpisodiosTodos");
        if (inputTodos) inputTodos.value = "";
        arquivosSerieSelecionados = [];
        if (precoConteudo) precoConteudo.value = "";
        if (aceitarRegras) aceitarRegras.checked = false;
        if (listaTemporadas) listaTemporadas.innerHTML = "";
        if (previewCapa) previewCapa.innerHTML = "Pré-visualização da capa";

        atualizarTipoConteudo();
        atualizarPreco();
    }

    /* =========================================================
       FILTROS E BIBLIOTECA
       ========================================================= */

    function correspondeAoFiltro(conteudo) {
        if (filtroAtual === "filmes") return conteudo.tipo === "filme";
        if (filtroAtual === "series") return conteudo.tipo === "serie";
        if (filtroAtual === "favoritos") return conteudo.favorito === true;
        if (filtroAtual === "compras") return conteudo.comprado === true || conteudo.acessosComprados > 0;
        if (filtroAtual === "vendas") return conteudo.acesso === "venda" || conteudo.acesso === "aluguel";
        return true;
    }

    function mostrarPainelCompras(conteudos) {
        const comprados = conteudos.filter(c => c.comprado === true || Number(c.acessosComprados || 0) > 0);
        listaFilmes.innerHTML = `
            <div style="width:100%;padding:20px;grid-column:1/-1;">
                <div style="padding:22px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);">
                    <h2>🛒 Minhas compras</h2>
                    <p style="opacity:.8;">Conteúdos desbloqueados neste navegador.</p>
                    <h3 style="margin-top:14px;">${comprados.length} conteúdo(s)</h3>
                </div>
            </div>`;
        if (!comprados.length) return;
        comprados.forEach(c => listaFilmes.appendChild(criarCard(c)));
    }

    function mostrarPainelVendas(conteudos) {
        const pagos = conteudos.filter(c => c.acesso === "venda" || c.acesso === "aluguel");
        const bruto = pagos.reduce((s,c) => s + (Number(c.preco)||0) * (Number(c.vendas)||0), 0);
        const comissao = bruto * comissaoImaAtual;
        const liquido = bruto - comissao;
        listaFilmes.innerHTML = `
            <div style="grid-column:1/-1;padding:10px;">
              <div style="padding:24px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);">
                <h2>💰 Minhas vendas</h2><p style="opacity:.8;">Painel local de demonstração.</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:18px;">
                  <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Conteúdos pagos</b><br>${pagos.length}</div>
                  <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Vendas</b><br>${pagos.reduce((s,c)=>s+Number(c.vendas||0),0)}</div>
                  <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Total bruto</b><br>${bruto.toFixed(2)} Kz</div>
                  <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Comissão I.M.A</b><br>${comissao.toFixed(2)} Kz</div>
                  <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Saldo do criador</b><br>${liquido.toFixed(2)} Kz</div>
                </div>
                <p style="margin-top:18px;font-size:13px;opacity:.7;">Comissão atual: ${(comissaoImaAtual*100).toFixed(0)}%. O recebimento real e o levantamento serão ligados ao servidor e ao provedor de pagamento na fase de produção.</p>
              </div>
            </div>`;
    }

    function mostrarPainelAdministrador(conteudos) {
        const total = conteudos.length;
        const filmes = conteudos.filter(c=>c.tipo==='filme').length;
        const series = conteudos.filter(c=>c.tipo==='serie').length;
        listaFilmes.innerHTML = `
          <div style="grid-column:1/-1;padding:10px;"><div style="padding:24px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);">
            <h2>🔐 Administrador</h2><p style="opacity:.8;">Painel de controlo local do protótipo.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:18px;">
              <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Conteúdos</b><br>${total}</div>
              <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Filmes</b><br>${filmes}</div>
              <div style="padding:16px;border-radius:12px;background:rgba(255,255,255,.05);"><b>Séries</b><br>${series}</div>
            </div>
            <label style="display:block;margin-top:20px;">⚙️ Comissão I.M.A (%)</label>
            <input id="comissaoAdmin" type="number" min="0" max="100" step="1" value="${Math.round(comissaoImaAtual*100)}" style="max-width:220px;">
            <button id="salvarComissaoAdmin" class="botao-principal" style="margin-top:10px;">💾 Guardar comissão</button>
            <p style="font-size:13px;opacity:.7;margin-top:12px;">No protótipo a configuração fica apenas nesta sessão. Em produção, o administrador e as permissões ficarão protegidos no servidor.</p>
          </div></div>`;
        const btn=document.getElementById("salvarComissaoAdmin");
        if(btn) btn.onclick=function(){ const n=Number(document.getElementById("comissaoAdmin").value); if(n>=0&&n<=100){comissaoImaAtual=n/100; alert("✅ Comissão atualizada para "+n+"%."); mostrarPainelAdministrador(conteudos);} };
    }

    async function carregarConteudos() {
        if (!listaFilmes || !db) return;
        limparURLs();
        let brutos=[];
        try { brutos=await obterConteudos(); } catch(e){ console.error("Erro ao ler conteúdos:",e); return; }
        const conteudos=brutos.map(normalizarConteudo).filter(Boolean);
        conteudos.sort((a,b)=>Number(b.dataPublicacao||0)-Number(a.dataPublicacao||0));
        if (filtroAtual === "vendas") { mostrarPainelVendas(conteudos); return; }
        if (filtroAtual === "compras") { mostrarPainelCompras(conteudos); return; }
        if (filtroAtual === "admin") { mostrarPainelAdministrador(conteudos); return; }
        const pesquisa=campoPesquisa?campoPesquisa.value.toLowerCase().trim():"";
        const filtrados=conteudos.filter(c=>{
            if(!correspondeAoFiltro(c)) return false;
            if(!pesquisa) return true;
            return (c.nome+" "+c.descricao+" "+c.ano).toLowerCase().includes(pesquisa);
        });
        listaFilmes.innerHTML="";
        if(!filtrados.length){listaFilmes.innerHTML='<div style="width:100%;padding:40px;text-align:center;"><h2>📭 Nenhum conteúdo encontrado</h2><p>Publique um filme ou série para começar.</p></div>';return;}
        filtrados.forEach(c=>{try{listaFilmes.appendChild(criarCard(c));}catch(e){console.warn("Conteúdo não exibido:",e);}});
    }

    function criarCard(conteudo) {
        const card = document.createElement("article");
        card.className = "card";

        const capaURL = criarURL(conteudo.capa, "image/jpeg");
        const tipoTexto = conteudo.tipo === "serie" ? "📺 Série" : "🎬 Filme";
        const visualizacoes = totalVisualizacoes(conteudo);

        card.innerHTML = `
            <div class="capa ima-capa-clicavel"
                 title="Ver detalhes"
                 style="position:relative;cursor:pointer;">
                ${
                    capaURL
                    ? `<img src="${capaURL}" alt="${escaparTexto(conteudo.nome)}"
                            style="width:100%;height:100%;object-fit:cover;">`
                    : `<div style="font-size:50px;text-align:center;padding:30px;">🎬</div>`
                }

                ${
                    conteudo.favorito
                    ? `<span style="position:absolute;top:8px;right:8px;font-size:22px;">❤️</span>`
                    : ""
                }
            </div>

            <h3 class="ima-titulo-clicavel" style="cursor:pointer;">
                ${escaparTexto(conteudo.nome)}
            </h3>

            <p>${tipoTexto} • ${escaparTexto(conteudo.ano)}</p>

            <p style="font-size:12px;opacity:.8;">
                ${escaparTexto(textoAcesso(conteudo))}
            </p>

            <p style="font-size:12px;">
                👁️ ${visualizacoes} visualizações
            </p>

            ${
                Number(conteudo.progresso || 0) > 0
                ? `<div style="margin-top:8px;font-size:12px;">
                       ▶️ ${Math.round(conteudo.progresso)}% assistido
                   </div>`
                : ""
            }

            <div class="botoes">
                ${((conteudo.acesso === "venda" || conteudo.acesso === "aluguel") && !conteudo.comprado)
                    ? `<button class="botao-comprar" title="${conteudo.acesso === "venda" ? "Comprar" : "Alugar"}">🛒</button>` : ""}
                <button class="botao-play" title="Assistir">▶️</button>
                <button class="botao-detalhes" title="Detalhes">ℹ️</button>
                <button class="botao-favorito" title="Favorito">
                    ${conteudo.favorito ? "❤️" : "🤍"}
                </button>
                <button class="botao-share" title="Partilhar">🔗</button>
                <button class="botao-download" title="Baixar">⬇️</button>
                <button class="botao-apagar" title="Apagar">🗑️</button>
            </div>
        `;

        const capa = card.querySelector(".ima-capa-clicavel");
        const titulo = card.querySelector(".ima-titulo-clicavel");
        const detalhes = card.querySelector(".botao-detalhes");

        if (capa) capa.addEventListener("click", function () { abrirDetalhes(conteudo); });
        if (titulo) titulo.addEventListener("click", function () { abrirDetalhes(conteudo); });
        if (detalhes) detalhes.addEventListener("click", function () { abrirDetalhes(conteudo); });

        const botaoPlay = card.querySelector(".botao-play");

        if (botaoPlay) {
            botaoPlay.addEventListener("click", function () {
                if ((conteudo.acesso === "venda" || conteudo.acesso === "aluguel") && !conteudo.comprado) { alert("🔒 Este conteúdo é pago. Clique em 🛒 para comprar/alugar."); return; }
                if (conteudo.tipo === "filme") {
                    reproduzirFilme(conteudo);
                } else {
                    abrirDetalhes(conteudo);
                }
            });
        }

        const botaoComprar = card.querySelector(".botao-comprar");
        if (botaoComprar) {
            botaoComprar.addEventListener("click", async function () {
                const valor = Number(conteudo.preco || 0);
                const tipo = conteudo.acesso === "venda" ? "compra" : "aluguel";
                const metodo = conteudo.formaPagamento === "transferencia" ? "Transferência bancária" : conteudo.formaPagamento === "carteira_ima" ? "Carteira I.M.A" : "Multicaixa Express";
                const ok = confirm(`🛒 ${tipo.toUpperCase()}\n\n${conteudo.nome}\nPreço: ${valor.toFixed(2)} Kz\nPagamento: ${metodo}\n\nMODO DE DEMONSTRAÇÃO: nenhum dinheiro será cobrado nesta versão.\n\nContinuar?`);
                if (!ok) return;
                conteudo.comprado = true;
                conteudo.acessosComprados = Number(conteudo.acessosComprados || 0) + 1;
                conteudo.vendas = Number(conteudo.vendas || 0) + 1;
                conteudo.ultimaVenda = { valor: valor, data: Date.now(), metodo: metodo };
                await atualizarConteudo(conteudo);
                alert("✅ Conteúdo desbloqueado no modo demonstração.");
                await carregarConteudos();
            });
        }

        const botaoFavorito = card.querySelector(".botao-favorito");

        if (botaoFavorito) {
            botaoFavorito.addEventListener("click", async function () {
                conteudo.favorito = !conteudo.favorito;
                await atualizarConteudo(conteudo);
                await carregarConteudos();
            });
        }

        const botaoShare = card.querySelector(".botao-share");

        if (botaoShare) {
            botaoShare.addEventListener("click", function () {
                partilhar(conteudo);
            });
        }

        const botaoDownload = card.querySelector(".botao-download");

        if (botaoDownload) {
            botaoDownload.addEventListener("click", function () {
                if ((conteudo.acesso === "venda" || conteudo.acesso === "aluguel") && !conteudo.comprado) { alert("🔒 Compre/alugue este conteúdo para baixar."); return; }
                if (conteudo.tipo === "filme") {
                    baixarVideo(conteudo.video, conteudo.nome);
                } else {
                    abrirDetalhes(conteudo);
                }
            });
        }

        const botaoApagar = card.querySelector(".botao-apagar");

        if (botaoApagar) {
            botaoApagar.addEventListener("click", async function () {
                const confirmar = confirm(
                    '⚠️ Tem certeza que deseja apagar "' + conteudo.nome + '"?'
                );

                if (!confirmar) return;

                await apagarConteudo(conteudo.id);

                if (
                    detalhesAtual &&
                    detalhesAtual.id === conteudo.id
                ) {
                    fecharDetalhes();
                }

                alert("🗑️ Conteúdo apagado.");
                await carregarConteudos();
            });
        }

        return card;
    }

    /* =========================================================
       PLAYER
       ========================================================= */

    async function reproduzirFilme(conteudo) {
        if (!videoPlayer) return;

        const url = criarURL(conteudo.video, "video/mp4");

        if (!url) {
            alert("Este filme não possui um vídeo válido.");
            return;
        }

        videoAtual = {
            conteudo: conteudo,
            episodio: null,
            temporada: null
        };

        videoPlayer.pause();
        videoPlayer.removeAttribute("src");
        videoPlayer.load();
        videoPlayer.src = url;

        if (tituloPlayer) tituloPlayer.textContent = conteudo.nome;
        if (descricaoPlayer) descricaoPlayer.textContent = conteudo.descricao;

        if (modalPlayer) {
            modalPlayer.style.display = "flex";
            modalPlayer.classList.add("ativo");
        }

        videoPlayer.onloadedmetadata = async function () {
            if (
                Number(conteudo.progresso || 0) > 0 &&
                Number(conteudo.progresso || 0) < 99 &&
                Number.isFinite(videoPlayer.duration)
            ) {
                videoPlayer.currentTime =
                    videoPlayer.duration * (Number(conteudo.progresso) / 100);
            }

            if (Number.isFinite(videoPlayer.duration)) {
                conteudo.duracao = videoPlayer.duration;
                await atualizarConteudo(conteudo);
            }
        };

        conteudo.visualizacoes = Number(conteudo.visualizacoes || 0) + 1;
        conteudo.ultimoAcesso = Date.now();

        await atualizarConteudo(conteudo);
        atualizarDetalhesSeAberto(conteudo);
    }

    async function reproduzirEpisodio(serie, temporada, episodio) {
        if (!videoPlayer) return;

        const url = criarURL(episodio.video, "video/mp4");

        if (!url) {
            alert("Este episódio não possui um vídeo válido.");
            return;
        }

        videoAtual = {
            conteudo: serie,
            episodio: episodio,
            temporada: temporada
        };

        videoPlayer.pause();
        videoPlayer.removeAttribute("src");
        videoPlayer.load();
        videoPlayer.src = url;

        if (tituloPlayer) {
            tituloPlayer.textContent =
                serie.nome +
                " — T" +
                temporada.numero +
                " E" +
                episodio.numero;
        }

        if (descricaoPlayer) {
            descricaoPlayer.textContent = episodio.nome || "";
        }

        if (modalPlayer) {
            modalPlayer.style.display = "flex";
            modalPlayer.classList.add("ativo");
        }

        videoPlayer.onloadedmetadata = function () {
            if (
                Number(episodio.progresso || 0) > 0 &&
                Number(episodio.progresso || 0) < 99 &&
                Number.isFinite(videoPlayer.duration)
            ) {
                videoPlayer.currentTime =
                    videoPlayer.duration * (Number(episodio.progresso) / 100);
            }
        };

        episodio.visualizacoes = Number(episodio.visualizacoes || 0) + 1;
        episodio.ultimoAcesso = Date.now();

        await atualizarConteudo(serie);
    }

    if (videoPlayer) {
        videoPlayer.addEventListener("timeupdate", async function () {
            if (!videoAtual) return;
            if (!videoPlayer.duration || !Number.isFinite(videoPlayer.duration)) return;

            const progresso =
                (videoPlayer.currentTime / videoPlayer.duration) * 100;

            if (videoAtual.episodio) {
                videoAtual.episodio.progresso = progresso;
            } else {
                videoAtual.conteudo.progresso = progresso;
            }

            if (Math.floor(progresso) % 5 === 0) {
                try {
                    await atualizarConteudo(videoAtual.conteudo);
                } catch (erro) {
                    console.warn("Progresso:", erro);
                }
            }
        });

        videoPlayer.addEventListener("ended", async function () {
            if (!videoAtual) return;

            if (videoAtual.episodio) {
                videoAtual.episodio.progresso = 100;
            } else {
                videoAtual.conteudo.progresso = 100;
            }

            try {
                await atualizarConteudo(videoAtual.conteudo);
                await carregarConteudos();
            } catch (erro) {
                console.warn("Finalização:", erro);
            }
        });
    }

    function fecharVideo() {
        if (videoPlayer) {
            try {
                videoPlayer.pause();
                videoPlayer.removeAttribute("src");
                videoPlayer.load();
            } catch (erro) {}
        }

        if (modalPlayer) {
            modalPlayer.style.display = "none";
            modalPlayer.classList.remove("ativo");
        }

        videoAtual = null;
    }

    if (fecharPlayer) fecharPlayer.addEventListener("click", fecharVideo);

    if (modalPlayer) {
        modalPlayer.addEventListener("click", function (evento) {
            if (evento.target === modalPlayer) {
                fecharVideo();
            }
        });
    }

    /* =========================================================
       ATUALIZAR DETALHES SE ESTIVER ABERTO
       ========================================================= */

    function atualizarDetalhesSeAberto(conteudo) {
        const modal = document.getElementById("imaModalDetalhes");

        if (
            modal &&
            modal.classList.contains("ativo") &&
            detalhesAtual &&
            detalhesAtual.id === conteudo.id
        ) {
            abrirDetalhes(conteudo);
        }
    }

    /* =========================================================
       DOWNLOAD
       ========================================================= */

    function baixarVideo(valor, nome) {
        const blob = converterParaBlob(valor, "video/mp4");

        if (!blob) {
            alert("Este conteúdo não possui vídeo disponível para baixar.");
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = String(nome || "video").replace(/[\\/:*?"<>|]/g, "_") + ".mp4";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(function () {
            try { URL.revokeObjectURL(url); } catch (erro) {}
        }, 1000);
    }

    /* =========================================================
       PARTILHAR
       ========================================================= */

    function partilhar(conteudo) {
        const texto =
            "🎬 " + conteudo.nome +
            "\n\n" +
            (conteudo.descricao || "") +
            "\n\n" +
            "📺 I.M.A FILMES";

        if (navigator.share) {
            navigator.share({
                title: conteudo.nome,
                text: texto
            }).catch(function () {});
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto)
                .then(function () {
                    alert("🔗 Informação copiada!");
                })
                .catch(function () {
                    alert(texto);
                });
            return;
        }

        alert(texto);
    }

    /* =========================================================
       PESQUISA
       ========================================================= */

    if (campoPesquisa) {
        campoPesquisa.addEventListener("input", function () {
            carregarConteudos();
        });
    }

    /* =========================================================
       MENU LATERAL
       ========================================================= */

    function configurarMenu() {
        const botoes = document.querySelectorAll(".menu > button");
        botoes.forEach(function (botao) {
            botao.addEventListener("click", async function () {
                const texto = botao.textContent.toLowerCase();
                if (texto.includes("início")) filtroAtual="todos";
                else if (texto.includes("filmes")) filtroAtual="filmes";
                else if (texto.includes("séries")) filtroAtual="series";
                else if (texto.includes("favoritos")) filtroAtual="favoritos";
                else if (texto.includes("biblioteca")) filtroAtual="todos";
                else if (texto.includes("compras")) filtroAtual="compras";
                else if (texto.includes("vendas")) filtroAtual="vendas";
                else if (texto.includes("administrador")) filtroAtual="admin";
                else return;
                botoes.forEach(b=>b.classList.remove("menu-ativo"));
                botao.classList.add("menu-ativo");
                await carregarConteudos();
            });
        });
    }

    /* =========================================================
       FECHAR MODAIS / ESC
       ========================================================= */

    document.addEventListener("keydown", function (evento) {
        if (evento.key !== "Escape") return;

        fecharPublicacao();
        fecharVideo();
        fecharDetalhes();
    });

    if (modalPublicacao) {
        modalPublicacao.addEventListener("click", function (evento) {
            if (evento.target === modalPublicacao) {
                fecharPublicacao();
            }
        });
    }

    /* =========================================================
       INICIALIZAÇÃO
       ========================================================= */

    async function iniciarAplicacao() {
        try {
            instalarEstiloDetalhes();
            criarModalDetalhes();
            prepararPublicacaoAvancada();

            await abrirBanco();

            atualizarTipoConteudo();
            atualizarPreco();
            configurarMenu();

            await carregarConteudos();

            console.log("====================================");
            console.log("✅ I.M.A FILMES carregado.");
            console.log("🗄️ Banco preservado:", DB_NAME);
            console.log("🎬 Modal profissional de detalhes ativo.");
            console.log("====================================");

        } catch (erro) {
            console.error("Erro ao iniciar I.M.A FILMES:", erro);

            if (listaFilmes) {
                listaFilmes.innerHTML =
                    `<div style="padding:30px;text-align:center;">
                        <h2>⚠️ Erro ao carregar a biblioteca</h2>
                        <p>Abra o Console (F12) para ver o erro.</p>
                    </div>`;
            }
        }
    }

    prepararPublicacaoAvancada();
    iniciarAplicacao();
});

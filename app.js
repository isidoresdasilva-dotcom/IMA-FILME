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
                reject(
                    pedido.error ||
                    new Error("Não foi possível abrir o IndexedDB.")
                );
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
                    resolve(
                        Array.isArray(pedido.result)
                            ? pedido.result
                            : []
                    );
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
        return (
            Date.now().toString(36) +
            Math.random().toString(36).slice(2, 10)
        );
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

            if (Number.isNaN(d.getTime())) {
                return "";
            }

            return d.toLocaleDateString("pt-AO");
        } catch (erro) {
            return "";
        }
    }

    function formatarTempo(segundos) {
        segundos = Math.max(
            0,
            Number(segundos) || 0
        );

        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const seg = Math.floor(segundos % 60);

        if (horas > 0) {
            return (
                horas +
                ":" +
                String(minutos).padStart(2, "0") +
                ":" +
                String(seg).padStart(2, "0")
            );
        }

        return (
            minutos +
            ":" +
            String(seg).padStart(2, "0")
        );
    }

    function converterParaBlob(valor, mimePadrao) {
        if (!valor) return null;

        if (valor instanceof Blob) {
            return valor;
        }

        if (valor instanceof ArrayBuffer) {
            return new Blob(
                [valor],
                {
                    type:
                        mimePadrao ||
                        "application/octet-stream"
                }
            );
        }

        if (ArrayBuffer.isView(valor)) {
            return new Blob(
                [valor.buffer],
                {
                    type:
                        mimePadrao ||
                        "application/octet-stream"
                }
            );
        }

        if (typeof valor === "object") {
            if (valor.data) {
                const b = converterParaBlob(
                    valor.data,
                    valor.type || mimePadrao
                );

                if (b) return b;
            }

            if (valor.buffer) {
                const b = converterParaBlob(
                    valor.buffer,
                    valor.type || mimePadrao
                );

                if (b) return b;
            }
        }

        return null;
    }

    function dataUrlParaBlob(dataUrl) {
        try {
            const partes = String(dataUrl).split(",");

            if (partes.length < 2) {
                return null;
            }

            const cabecalho = partes[0];
            const dados = partes.slice(1).join(",");

            const mime =
                (cabecalho.match(/data:([^;]+)/) || [])[1] ||
                "application/octet-stream";

            const binario = atob(dados);

            const bytes =
                new Uint8Array(binario.length);

            for (
                let i = 0;
                i < binario.length;
                i++
            ) {
                bytes[i] =
                    binario.charCodeAt(i);
            }

            return new Blob(
                [bytes],
                {
                    type: mime
                }
            );
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

            const blob =
                converterParaBlob(
                    valor,
                    mimePadrao
                );

            if (!blob) return "";

            const url =
                URL.createObjectURL(blob);

            if (url) {
                objectUrls.push(url);
            }

            return url;
        } catch (erro) {
            console.warn(
                "URL inválida ignorada:",
                erro
            );

            return "";
        }
    }

    function limparURLs() {
        objectUrls.forEach(function (url) {
            try {
                if (
                    String(url).startsWith("blob:")
                ) {
                    URL.revokeObjectURL(url);
                }
            } catch (erro) {}
        });

        objectUrls = [];
    }

    function normalizarConteudo(c) {
        if (
            !c ||
            typeof c !== "object"
        ) {
            return null;
        }

        return {
            ...c,

            id:
                c.id ||
                gerarId(),

            tipo:
                c.tipo === "serie"
                    ? "serie"
                    : "filme",

            nome:
                c.nome ||
                c.titulo ||
                "Sem título",

            descricao:
                c.descricao ||
                "",

            ano:
                c.ano ||
                "",

            acesso:
                c.acesso ||
                c.tipoAcesso ||
                "gratis",

            preco:
                Number(c.preco || 0),

            favorito:
                c.favorito === true,

            visualizacoes:
                Number(
                    c.visualizacoes ||
                    c.views ||
                    0
                ),

            progresso:
                Number(
                    c.progresso ||
                    0
                ),

            duracao:
                Number(
                    c.duracao ||
                    0
                ),

            temporadas:
                Array.isArray(c.temporadas)
                    ? c.temporadas
                    : []
        };
    }

    function textoAcesso(conteudo) {
        if (
            conteudo.acesso === "venda"
        ) {
            return (
                "💰 Venda • " +
                Number(
                    conteudo.preco || 0
                ).toLocaleString("pt-AO") +
                " Kz"
            );
        }

        if (
            conteudo.acesso === "aluguel"
        ) {
            return (
                "🎟️ Aluguel • " +
                Number(
                    conteudo.preco || 0
                ).toLocaleString("pt-AO") +
                " Kz"
            );
        }

        return "🆓 Gratuito";
    }

    function totalEpisodios(serie) {
        return (
            serie.temporadas || []
        ).reduce(
            function (
                total,
                temporada
            ) {
                return (
                    total +
                    (
                        temporada &&
                        Array.isArray(
                            temporada.episodios
                        )
                            ? temporada.episodios.length
                            : 0
                    )
                );
            },
            0
        );
    }

    function totalVisualizacoes(serie) {
        let total =
            Number(
                serie.visualizacoes ||
                0
            );

        (
            serie.temporadas || []
        ).forEach(
            function (temporada) {
                (
                    temporada.episodios ||
                    []
                ).forEach(
                    function (ep) {
                        total +=
                            Number(
                                ep.visualizacoes ||
                                0
                            );
                    }
                );
            }
        );

        return total;
    }

    /* =========================================================
       ESTILO DO MODAL PROFISSIONAL - INJETADO AUTOMATICAMENTE
       ========================================================= */

    function instalarEstiloDetalhes() {
        if (
            document.getElementById(
                "ima-detalhes-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "ima-detalhes-style";

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
        if (
            document.getElementById(
                "imaModalDetalhes"
            )
        ) {
            return;
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "imaModalDetalhes";

        modal.innerHTML = `
            <div class="ima-detalhes-caixa" role="dialog" aria-modal="true">
                <button class="ima-detalhes-fechar" id="imaFecharDetalhes" title="Fechar">✕</button>
                <div id="imaDetalhesConteudo"></div>
            </div>
        `;

        document.body.appendChild(
            modal
        );

        modal.addEventListener(
            "click",
            function (evento) {
                if (
                    evento.target === modal
                ) {
                    fecharDetalhes();
                }
            }
        );

        document
            .getElementById(
                "imaFecharDetalhes"
            )
            .addEventListener(
                "click",
                fecharDetalhes
            );
    }

    function fecharDetalhes() {
        const modal =
            document.getElementById(
                "imaModalDetalhes"
            );

        if (modal) {
            modal.classList.remove(
                "ativo"
            );
        }

        detalhesAtual = null;
    }

    /* =========================================================
       MODAL DE DETALHES
       ========================================================= */

    async function abrirDetalhes(
        conteudo
    ) {
        conteudo =
            normalizarConteudo(
                conteudo
            );

        if (!conteudo) return;

        detalhesAtual =
            conteudo;

        criarModalDetalhes();

        const modal =
            document.getElementById(
                "imaModalDetalhes"
            );

        const area =
            document.getElementById(
                "imaDetalhesConteudo"
            );

        const capaURL =
            criarURL(
                conteudo.capa,
                "image/jpeg"
            );

        const tipoTexto =
            conteudo.tipo === "serie"
                ? "📺 Série"
                : "🎬 Filme";

        const visualizacoes =
            totalVisualizacoes(
                conteudo
            );

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
                        ${
                            conteudo.ano
                                ? `<span class="ima-detalhes-badge">📅 ${escaparTexto(conteudo.ano)}</span>`
                                : ""
                        }
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

        if (
            conteudo.tipo === "filme"
        ) {
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

            if (
                !conteudo.temporadas ||
                conteudo.temporadas.length === 0
            ) {
                html +=
                    `<p>Esta série ainda não possui episódios.</p>`;
            } else {
                conteudo.temporadas.forEach(
                    function (temporada) {
                        html += `
                            <div class="ima-temporada">
                                <div class="ima-temporada-titulo">
                                    📚 Temporada ${escaparTexto(temporada.numero || "")}
                                </div>
                        `;

                        (
                            temporada.episodios ||
                            []
                        ).forEach(
                            function (episodio) {
                                const progresso =
                                    Number(
                                        episodio.progresso ||
                                        0
                                    );

                                html += `
                                    <div class="ima-episodio">
                                        <div>
                                            <span class="ima-episodio-nome">
                                                Episódio ${escaparTexto(episodio.numero || "")} — ${escaparTexto(episodio.nome || "Episódio")}
                                            </span>
                                            <span class="ima-episodio-sub">
                                                👁️ ${Number(episodio.visualizacoes || 0)} visualizações
                                                ${
                                                    progresso > 0
                                                        ? " • " + Math.round(progresso) + "% assistido"
                                                        : ""
                                                }
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
                            }
                        );

                        html += `</div>`;
                    }
                );
            }

            html += `</div>`;
        }

        html += `</div>`;

        area.innerHTML = html;

        modal.classList.add("ativo");

        const btnAssistir =
            document.getElementById(
                "imaDetalhesAssistir"
            );

        const btnFavorito =
            document.getElementById(
                "imaDetalhesFavorito"
            );

        const btnCompartilhar =
            document.getElementById(
                "imaDetalhesCompartilhar"
            );

        const btnBaixar =
            document.getElementById(
                "imaDetalhesBaixar"
            );

        if (btnAssistir) {
            btnAssistir.addEventListener(
                "click",
                function () {
                    if (
                        conteudo.tipo === "filme"
                    ) {
                        fecharDetalhes();
                        reproduzirFilme(
                            conteudo
                        );
                    } else {
                        const primeiro =
                            encontrarPrimeiroEpisodio(
                                conteudo
                            );

                        if (primeiro) {
                            fecharDetalhes();

                            reproduzirEpisodio(
                                conteudo,
                                primeiro.temporada,
                                primeiro.episodio
                            );
                        } else {
                            alert(
                                "Esta série não possui episódios com vídeo."
                            );
                        }
                    }
                }
            );
        }

        if (btnFavorito) {
            btnFavorito.addEventListener(
                "click",
                async function () {
                    conteudo.favorito =
                        !conteudo.favorito;

                    await atualizarConteudo(
                        conteudo
                    );

                    await abrirDetalhes(
                        conteudo
                    );

                    await carregarConteudos();
                }
            );
        }

        if (btnCompartilhar) {
            btnCompartilhar.addEventListener(
                "click",
                function () {
                    partilhar(
                        conteudo
                    );
                }
            );
        }

        if (btnBaixar) {
            btnBaixar.addEventListener(
                "click",
                function () {
                    baixarVideo(
                        conteudo.video,
                        conteudo.nome
                    );
                }
            );
        }

        area
            .querySelectorAll(
                ".ima-episodio-play"
            )
            .forEach(
                function (botao) {
                    botao.addEventListener(
                        "click",
                        function () {
                            const temporadaNumero =
                                Number(
                                    botao.dataset.temporada
                                );

                            const episodioNumero =
                                Number(
                                    botao.dataset.episodio
                                );

                            const temporada =
                                (
                                    conteudo.temporadas ||
                                    []
                                ).find(
                                    function (t) {
                                        return (
                                            Number(
                                                t.numero
                                            ) ===
                                            temporadaNumero
                                        );
                                    }
                                );

                            const episodio =
                                temporada &&
                                (
                                    temporada.episodios ||
                                    []
                                ).find(
                                    function (e) {
                                        return (
                                            Number(
                                                e.numero
                                            ) ===
                                            episodioNumero
                                        );
                                    }
                                );

                            if (
                                !temporada ||
                                !episodio
                            ) {
                                alert(
                                    "Episódio não encontrado."
                                );
                                return;
                            }

                            fecharDetalhes();

                            reproduzirEpisodio(
                                conteudo,
                                temporada,
                                episodio
                            );
                        }
                    );
                }
            );
    }

    function encontrarPrimeiroEpisodio(
        serie
    ) {
        for (
            const temporada of (
                serie.temporadas ||
                []
            )
        ) {
            for (
                const episodio of (
                    temporada.episodios ||
                    []
                )
            ) {
                if (
                    episodio &&
                    episodio.video
                ) {
                    return {
                        temporada:
                            temporada,
                        episodio:
                            episodio
                    };
                }
            }
        }

        return null;
    }

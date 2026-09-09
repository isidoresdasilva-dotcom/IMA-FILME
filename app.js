document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /*
     * ============================================================
     * I.M.A FILMES
     * APP.JS COMPLETO
     * ARMAZENAMENTO PERSISTENTE + COMPATIBILIDADE COM DADOS ANTIGOS
     * ============================================================
     */

    const DB_NAME = "IMA_FILMES_DB";
    const STORE_NAME = "conteudos";

    let db = null;
    let filtroAtual = "todos";
    let videoAtual = null;
    let objectUrls = [];

    /* ============================================================
       ELEMENTOS
       ============================================================ */

    const modalPublicacao = document.getElementById("modalPublicacao");
    const fecharModal = document.getElementById("fecharModal");
    const cancelarPublicacao = document.getElementById("cancelarPublicacao");
    const salvarPublicacao = document.getElementById("salvarPublicacao");

    const botaoEnviar = document.getElementById("botaoEnviar");
    const botaoEnviarMenu = document.getElementById("botaoEnviarMenu");

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

    const modalPlayer = document.getElementById("modalPlayer");
    const fecharPlayer = document.getElementById("fecharPlayer");
    const videoPlayer = document.getElementById("videoPlayer");
    const tituloPlayer = document.getElementById("tituloPlayer");
    const descricaoPlayer = document.getElementById("descricaoPlayer");

    const campoPesquisa = document.getElementById("campoPesquisa");

    /* ============================================================
       UTILITÁRIOS
       ============================================================ */

    function gerarId() {
        return (
            "ima_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).substring(2, 10)
        );
    }

    function escaparHTML(valor) {
        if (valor === null || valor === undefined) {
            return "";
        }

        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function numeroSeguro(valor, padrao) {
        const numero = Number(valor);

        if (Number.isFinite(numero)) {
            return numero;
        }

        return padrao || 0;
    }

    function formatarTamanho(bytes) {
        const tamanho = numeroSeguro(bytes, 0);

        if (tamanho <= 0) {
            return "0 B";
        }

        const unidades = ["B", "KB", "MB", "GB", "TB"];
        const indice = Math.min(
            Math.floor(Math.log(tamanho) / Math.log(1024)),
            unidades.length - 1
        );

        return (
            (tamanho / Math.pow(1024, indice)).toFixed(
                indice === 0 ? 0 : 2
            ) +
            " " +
            unidades[indice]
        );
    }

    function mostrarMensagem(texto, tipo) {
        console.log("[I.M.A FILMES]", texto);

        const antiga = document.querySelector(".ima-mensagem");

        if (antiga) {
            antiga.remove();
        }

        const mensagem = document.createElement("div");

        mensagem.className = "ima-mensagem";
        mensagem.textContent = texto;

        mensagem.style.position = "fixed";
        mensagem.style.left = "50%";
        mensagem.style.bottom = "25px";
        mensagem.style.transform = "translateX(-50%)";
        mensagem.style.zIndex = "99999";
        mensagem.style.padding = "14px 20px";
        mensagem.style.borderRadius = "12px";
        mensagem.style.background =
            tipo === "erro" ? "#b91c1c" : "#111827";
        mensagem.style.color = "#fff";
        mensagem.style.fontWeight = "600";
        mensagem.style.boxShadow = "0 10px 30px rgba(0,0,0,.35)";
        mensagem.style.maxWidth = "90%";

        document.body.appendChild(mensagem);

        setTimeout(function () {
            if (mensagem.parentNode) {
                mensagem.remove();
            }
        }, 4000);
    }

    /* ============================================================
       CONVERSÃO SEGURA PARA BLOB
       ============================================================ */

    function ehBlob(valor) {
        return valor instanceof Blob;
    }

    function ehArrayBuffer(valor) {
        return valor instanceof ArrayBuffer;
    }

    function ehTypedArray(valor) {
        return (
            valor &&
            typeof valor === "object" &&
            ArrayBuffer.isView(valor)
        );
    }

    function dataURLParaBlob(dataURL) {
        try {
            if (
                typeof dataURL !== "string" ||
                !dataURL.startsWith("data:")
            ) {
                return null;
            }

            const partes = dataURL.split(",");

            if (partes.length < 2) {
                return null;
            }

            const cabecalho = partes[0];
            const dados = partes.slice(1).join(",");

            const mimeMatch = cabecalho.match(
                /^data:([^;]+)/
            );

            const mime = mimeMatch
                ? mimeMatch[1]
                : "application/octet-stream";

            if (cabecalho.includes(";base64")) {
                const binario = atob(dados);
                const bytes = new Uint8Array(binario.length);

                for (let i = 0; i < binario.length; i++) {
                    bytes[i] = binario.charCodeAt(i);
                }

                return new Blob([bytes], {
                    type: mime
                });
            }

            return new Blob(
                [decodeURIComponent(dados)],
                {
                    type: mime
                }
            );
        } catch (erro) {
            console.warn(
                "Não foi possível converter data URL:",
                erro
            );

            return null;
        }
    }

    function converterParaBlob(valor, mimePadrao) {
        if (valor === null || valor === undefined) {
            return null;
        }

        if (ehBlob(valor)) {
            return valor;
        }

        if (ehArrayBuffer(valor)) {
            return new Blob([valor], {
                type: mimePadrao || "application/octet-stream"
            });
        }

        if (ehTypedArray(valor)) {
            try {
                return new Blob([valor.buffer], {
                    type: mimePadrao || "application/octet-stream"
                });
            } catch (erro) {
                console.warn(
                    "Erro ao converter TypedArray:",
                    erro
                );

                return null;
            }
        }

        if (typeof valor === "string") {
            if (valor.startsWith("data:")) {
                return dataURLParaBlob(valor);
            }

            return null;
        }

        /*
         * Alguns navegadores / dados antigos podem trazer
         * objetos estruturados.
         */

        if (
            typeof valor === "object" &&
            valor.data &&
            typeof valor.data === "string"
        ) {
            return converterParaBlob(
                valor.data,
                mimePadrao
            );
        }

        if (
            typeof valor === "object" &&
            valor.buffer instanceof ArrayBuffer
        ) {
            try {
                return new Blob([valor.buffer], {
                    type:
                        valor.type ||
                        mimePadrao ||
                        "application/octet-stream"
                });
            } catch (erro) {
                return null;
            }
        }

        return null;
    }

    /* ============================================================
       CRIAÇÃO SEGURA DE URL
       ============================================================ */

    function criarURL(valor, mimePadrao) {
        /*
         * Esta é a correção principal do erro:
         *
         * TypeError:
         * Failed to execute 'createObjectURL' on 'URL'
         */

        try {
            if (!valor) {
                return "";
            }

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

            const blob = converterParaBlob(
                valor,
                mimePadrao
            );

            if (!blob) {
                console.warn(
                    "createURL: valor inválido ignorado.",
                    valor
                );

                return "";
            }

            const url = URL.createObjectURL(blob);

            if (url) {
                objectUrls.push(url);
            }

            return url;
        } catch (erro) {
            console.warn(
                "Erro ao criar URL:",
                erro
            );

            return "";
        }
    }

    function liberarURLs() {
        objectUrls.forEach(function (url) {
            try {
                URL.revokeObjectURL(url);
            } catch (erro) {
                console.warn(
                    "Erro ao liberar URL:",
                    erro
                );
            }
        });

        objectUrls = [];
    }

    /* ============================================================
       INDEXEDDB
       ============================================================ */

    function abrirBanco() {
        return new Promise(function (resolve, reject) {
            if (!window.indexedDB) {
                reject(
                    new Error(
                        "Este navegador não suporta IndexedDB."
                    )
                );

                return;
            }

            let pedido;

            try {
                /*
                 * Abrimos sem forçar uma versão específica.
                 * Isso é importante para preservar bancos antigos.
                 */
                pedido = indexedDB.open(DB_NAME);
            } catch (erro) {
                reject(erro);
                return;
            }

            pedido.onupgradeneeded = function (evento) {
                try {
                    const banco = evento.target.result;

                    let store;

                    if (
                        !banco.objectStoreNames.contains(
                            STORE_NAME
                        )
                    ) {
                        store = banco.createObjectStore(
                            STORE_NAME,
                            {
                                keyPath: "id"
                            }
                        );
                    } else {
                        store =
                            evento.target.transaction.objectStore(
                                STORE_NAME
                            );
                    }

                    if (
                        !store.indexNames.contains("tipo")
                    ) {
                        store.createIndex(
                            "tipo",
                            "tipo",
                            {
                                unique: false
                            }
                        );
                    }

                    if (
                        !store.indexNames.contains(
                            "dataPublicacao"
                        )
                    ) {
                        store.createIndex(
                            "dataPublicacao",
                            "dataPublicacao",
                            {
                                unique: false
                            }
                        );
                    }
                } catch (erro) {
                    console.error(
                        "Erro durante atualização do IndexedDB:",
                        erro
                    );
                }
            };

            pedido.onblocked = function () {
                reject(
                    new Error(
                        "O banco está bloqueado por outra aba do I.M.A FILMES. Feche outras abas do site e tente novamente."
                    )
                );
            };

            pedido.onsuccess = function (evento) {
                db = evento.target.result;

                db.onversionchange = function () {
                    db.close();
                };

                db.onerror = function (eventoErro) {
                    console.warn(
                        "Erro interno IndexedDB:",
                        eventoErro
                    );
                };

                /*
                 * Segurança extra:
                 * se por algum motivo a store não existir,
                 * fazemos uma nova abertura com uma versão superior.
                 */

                if (
                    !db.objectStoreNames.contains(
                        STORE_NAME
                    )
                ) {
                    const versaoAtual = db.version;

                    db.close();

                    let upgrade;

                    try {
                        upgrade = indexedDB.open(
                            DB_NAME,
                            versaoAtual + 1
                        );
                    } catch (erro) {
                        reject(erro);
                        return;
                    }

                    upgrade.onupgradeneeded =
                        function (eventoUpgrade) {
                            const banco =
                                eventoUpgrade.target.result;

                            if (
                                !banco.objectStoreNames.contains(
                                    STORE_NAME
                                )
                            ) {
                                banco.createObjectStore(
                                    STORE_NAME,
                                    {
                                        keyPath: "id"
                                    }
                                );
                            }

                            const store =
                                eventoUpgrade.target
                                    .transaction
                                    .objectStore(
                                        STORE_NAME
                                    );

                            if (
                                !store.indexNames.contains(
                                    "tipo"
                                )
                            ) {
                                store.createIndex(
                                    "tipo",
                                    "tipo",
                                    {
                                        unique: false
                                    }
                                );
                            }

                            if (
                                !store.indexNames.contains(
                                    "dataPublicacao"
                                )
                            ) {
                                store.createIndex(
                                    "dataPublicacao",
                                    "dataPublicacao",
                                    {
                                        unique: false
                                    }
                                );
                            }
                        };

                    upgrade.onsuccess =
                        function (eventoUpgrade) {
                            db =
                                eventoUpgrade.target
                                    .result;

                            db.onversionchange =
                                function () {
                                    db.close();
                                };

                            resolve(db);
                        };

                    upgrade.onerror =
                        function () {
                            reject(
                                upgrade.error ||
                                    new Error(
                                        "Não foi possível criar a estrutura do banco."
                                    )
                            );
                        };

                    upgrade.onblocked = function () {
                        reject(
                            new Error(
                                "O banco está bloqueado por outra aba."
                            )
                        );
                    };

                    return;
                }

                resolve(db);
            };

            pedido.onerror = function () {
                reject(
                    pedido.error ||
                        new Error(
                            "Não foi possível abrir o IndexedDB."
                        )
                );
            };
        });
    }

    /* ============================================================
       OPERAÇÕES DO BANCO
       ============================================================ */

    function guardarConteudo(conteudo) {
        return new Promise(function (resolve, reject) {
            if (!db) {
                reject(
                    new Error(
                        "Banco de dados não está aberto."
                    )
                );

                return;
            }

            try {
                const transacao = db.transaction(
                    STORE_NAME,
                    "readwrite"
                );

                const store =
                    transacao.objectStore(
                        STORE_NAME
                    );

                const pedido = store.put(conteudo);

                pedido.onsuccess = function () {
                    resolve(conteudo);
                };

                pedido.onerror = function () {
                    reject(
                        pedido.error ||
                            new Error(
                                "Erro ao guardar conteúdo."
                            )
                    );
                };

                transacao.onerror = function () {
                    reject(
                        transacao.error ||
                            new Error(
                                "Erro na transação do banco."
                            )
                    );
                };
            } catch (erro) {
                reject(erro);
            }
        });
    }

    function obterConteudos() {
        return new Promise(function (resolve, reject) {
            if (!db) {
                reject(
                    new Error(
                        "Banco de dados não está aberto."
                    )
                );

                return;
            }

            try {
                const transacao = db.transaction(
                    STORE_NAME,
                    "readonly"
                );

                const store =
                    transacao.objectStore(
                        STORE_NAME
                    );

                const pedido = store.getAll();

                pedido.onsuccess = function () {
                    const dados =
                        Array.isArray(
                            pedido.result
                        )
                            ? pedido.result
                            : [];

                    resolve(dados);
                };

                pedido.onerror = function () {
                    reject(
                        pedido.error ||
                            new Error(
                                "Erro ao carregar conteúdos."
                            )
                    );
                };
            } catch (erro) {
                reject(erro);
            }
        });
    }

    function obterConteudo(id) {
        return new Promise(function (resolve, reject) {
            if (!db) {
                reject(
                    new Error(
                        "Banco de dados não está aberto."
                    )
                );

                return;
            }

            try {
                const transacao = db.transaction(
                    STORE_NAME,
                    "readonly"
                );

                const store =
                    transacao.objectStore(
                        STORE_NAME
                    );

                const pedido = store.get(id);

                pedido.onsuccess = function () {
                    resolve(
                        pedido.result || null
                    );
                };

                pedido.onerror = function () {
                    reject(
                        pedido.error ||
                            new Error(
                                "Erro ao buscar conteúdo."
                            )
                    );
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
            if (!db) {
                reject(
                    new Error(
                        "Banco de dados não está aberto."
                    )
                );

                return;
            }

            try {
                const transacao = db.transaction(
                    STORE_NAME,
                    "readwrite"
                );

                const store =
                    transacao.objectStore(
                        STORE_NAME
                    );

                const pedido = store.delete(id);

                pedido.onsuccess = function () {
                    resolve(true);
                };

                pedido.onerror = function () {
                    reject(
                        pedido.error ||
                            new Error(
                                "Erro ao apagar conteúdo."
                            )
                    );
                };
            } catch (erro) {
                reject(erro);
            }
        });
    }

    /* ============================================================
       MODAL DE PUBLICAÇÃO
       ============================================================ */

    function abrirPublicacao() {
        if (!modalPublicacao) {
            return;
        }

        modalPublicacao.classList.add("ativo");
        modalPublicacao.style.display = "flex";

        if (nomeConteudo) {
            setTimeout(function () {
                nomeConteudo.focus();
            }, 100);
        }
    }

    function fecharPublicacao() {
        if (!modalPublicacao) {
            return;
        }

        modalPublicacao.classList.remove("ativo");
        modalPublicacao.style.display = "none";
    }

    if (botaoEnviar) {
        botaoEnviar.addEventListener(
            "click",
            abrirPublicacao
        );
    }

    if (botaoEnviarMenu) {
        botaoEnviarMenu.addEventListener(
            "click",
            abrirPublicacao
        );
    }

    if (fecharModal) {
        fecharModal.addEventListener(
            "click",
            fecharPublicacao
        );
    }

    if (cancelarPublicacao) {
        cancelarPublicacao.addEventListener(
            "click",
            fecharPublicacao
        );
    }

    /* ============================================================
       TIPO FILME / SÉRIE
       ============================================================ */

    function atualizarTipoConteudo() {
        if (!tipoConteudo) {
            return;
        }

        const serie =
            tipoConteudo.value === "serie";

        if (areaSerie) {
            areaSerie.style.display =
                serie ? "block" : "none";
        }

        if (areaVideo) {
            areaVideo.style.display =
                serie ? "none" : "block";
        }

        if (!serie && listaTemporadas) {
            listaTemporadas.innerHTML = "";
        }
    }

    if (tipoConteudo) {
        tipoConteudo.addEventListener(
            "change",
            atualizarTipoConteudo
        );
    }

    /* ============================================================
       TIPO DE ACESSO
       ============================================================ */

    function atualizarAcesso() {
        if (!tipoAcesso || !areaPreco) {
            return;
        }

        const precisaPreco =
            tipoAcesso.value === "venda" ||
            tipoAcesso.value === "aluguel";

        areaPreco.style.display =
            precisaPreco ? "block" : "none";

        if (!precisaPreco && precoConteudo) {
            precoConteudo.value = "";
        }
    }

    if (tipoAcesso) {
        tipoAcesso.addEventListener(
            "change",
            atualizarAcesso
        );
    }

    /* ============================================================
       CAPA MANUAL
       ============================================================ */

    let capaManual = null;

    if (arquivoCapa) {
        arquivoCapa.addEventListener(
            "change",
            function () {
                const arquivo =
                    arquivoCapa.files &&
                    arquivoCapa.files[0];

                if (!arquivo) {
                    capaManual = null;

                    if (previewCapa) {
                        previewCapa.innerHTML =
                            "Pré-visualização da capa";
                    }

                    return;
                }

                if (!arquivo.type.startsWith("image/")) {
                    mostrarMensagem(
                        "Selecione uma imagem válida para a capa.",
                        "erro"
                    );

                    arquivoCapa.value = "";
                    capaManual = null;

                    return;
                }

                capaManual = arquivo;

                const url = criarURL(
                    arquivo,
                    arquivo.type
                );

                if (previewCapa) {
                    if (url) {
                        previewCapa.innerHTML =
                            '<img src="' +
                            url +
                            '" alt="Capa">';
                    } else {
                        previewCapa.textContent =
                            "Não foi possível visualizar a capa.";
                    }
                }
            }
        );
    }

    /* ============================================================
       GERAR CAPA AUTOMÁTICA
       ============================================================ */

    function capturarFrame(video, percentual) {
        return new Promise(function (resolve) {
            try {
                if (!video || !video.duration) {
                    resolve(null);
                    return;
                }

                const canvas =
                    document.createElement(
                        "canvas"
                    );

                const largura =
                    video.videoWidth || 640;

                const altura =
                    video.videoHeight || 360;

                canvas.width = largura;
                canvas.height = altura;

                const tempo =
                    video.duration * percentual;

                function capturar() {
                    try {
                        const ctx =
                            canvas.getContext(
                                "2d"
                            );

                        ctx.drawImage(
                            video,
                            0,
                            0,
                            largura,
                            altura
                        );

                        resolve(
                            canvas.toDataURL(
                                "image/jpeg",
                                0.86
                            )
                        );
                    } catch (erro) {
                        console.warn(
                            "Erro ao capturar frame:",
                            erro
                        );

                        resolve(null);
                    }
                }

                video.currentTime = Math.max(
                    0.05,
                    Math.min(
                        tempo,
                        Math.max(
                            0.05,
                            video.duration - 0.05
                        )
                    )
                );

                video.addEventListener(
                    "seeked",
                    capturar,
                    {
                        once: true
                    }
                );

                setTimeout(function () {
                    capturar();
                }, 2000);
            } catch (erro) {
                console.warn(
                    "Erro na captura:",
                    erro
                );

                resolve(null);
            }
        });
    }

    async function gerarCapasAutomaticas(
        arquivo
    ) {
        if (!arquivo) {
            return [];
        }

        const video =
            document.createElement("video");

        video.muted = true;
        video.preload = "metadata";
        video.playsInline = true;

        const url = criarURL(
            arquivo,
            arquivo.type || "video/mp4"
        );

        if (!url) {
            return [];
        }

        video.src = url;

        await new Promise(function (resolve) {
            const finalizar = function () {
                resolve();
            };

            video.addEventListener(
                "loadedmetadata",
                finalizar,
                {
                    once: true
                }
            );

            setTimeout(
                finalizar,
                5000
            );
        });

        if (!video.duration) {
            return [];
        }

        const percentuais = [
            0.05,
            0.2,
            0.4,
            0.6,
            0.8
        ];

        const capas = [];

        for (
            let i = 0;
            i < percentuais.length;
            i++
        ) {
            const capa =
                await capturarFrame(
                    video,
                    percentuais[i]
                );

            if (capa) {
                capas.push(capa);
            }
        }

        return capas;
    }

    function mostrarCapas(capas) {
        if (!previewCapa) {
            return;
        }

        if (!capas || !capas.length) {
            return;
        }

        let html =
            '<div style="width:100%;">' +
            '<strong>🤖 Escolha uma capa automática</strong>' +
            '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:10px;">';

        capas.forEach(function (capa, indice) {
            html +=
                '<button type="button" class="ima-capa-opcao" data-capa-index="' +
                indice +
                '" style="padding:2px;border:2px solid transparent;background:none;cursor:pointer;border-radius:8px;">' +
                '<img src="' +
                capa +
                '" alt="Capa ' +
                (indice + 1) +
                '" style="width:100%;height:90px;object-fit:cover;border-radius:6px;">' +
                "</button>";
        });

        html +=
            "</div>" +
            '<small style="display:block;margin-top:8px;">A capa automática pode ser alterada enviando uma imagem acima.</small>' +
            "</div>";

        previewCapa.innerHTML = html;

        const botoes =
            previewCapa.querySelectorAll(
                ".ima-capa-opcao"
            );

        botoes.forEach(function (botao) {
            botao.addEventListener(
                "click",
                function () {
                    const indice =
                        Number(
                            botao.dataset
                                .capaIndex
                        );

                    const selecionada =
                        capas[indice];

                    if (!selecionada) {
                        return;
                    }

                    capaManual = null;

                    previewCapa.innerHTML =
                        '<img src="' +
                        selecionada +
                        '" alt="Capa selecionada" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">' +
                        '<p style="margin-top:8px;">✅ Capa automática selecionada</p>';

                    previewCapa.dataset.capaSelecionada =
                        selecionada;
                }
            );
        });

        /*
         * Selecionar automaticamente a primeira.
         */
        if (capas[0]) {
            previewCapa.dataset.capaSelecionada =
                capas[0];
        }
    }

    if (arquivoVideo) {
        arquivoVideo.addEventListener(
            "change",
            async function () {
                const arquivo =
                    arquivoVideo.files &&
                    arquivoVideo.files[0];

                if (!arquivo) {
                    return;
                }

                if (
                    !arquivo.type.startsWith(
                        "video/"
                    )
                ) {
                    mostrarMensagem(
                        "Selecione um arquivo de vídeo válido.",
                        "erro"
                    );

                    arquivoVideo.value = "";

                    return;
                }

                mostrarMensagem(
                    "🤖 Criando opções de capa...",
                    "normal"
                );

                const capas =
                    await gerarCapasAutomaticas(
                        arquivo
                    );

                if (capas.length) {
                    mostrarCapas(capas);

                    mostrarMensagem(
                        "✅ Foram criadas " +
                            capas.length +
                            " opções de capa.",
                        "normal"
                    );
                } else {
                    mostrarMensagem(
                        "Não foi possível gerar a capa automaticamente. Você pode enviar uma capa manual.",
                        "normal"
                    );
                }
            }
        );
    }

    /* ============================================================
       TEMPORADAS E EPISÓDIOS
       ============================================================ */

    function gerarCamposTemporadas() {
        if (!listaTemporadas) {
            return;
        }

        const temporadas = Math.max(
            0,
            parseInt(
                quantidadeTemporadas
                    ? quantidadeTemporadas.value
                    : 0,
                10
            ) || 0
        );

        const episodios = Math.max(
            0,
            parseInt(
                quantidadeEpisodios
                    ? quantidadeEpisodios.value
                    : 0,
                10
            ) || 0
        );

        listaTemporadas.innerHTML = "";

        if (
            temporadas <= 0 ||
            episodios <= 0
        ) {
            return;
        }

        for (
            let temporada = 1;
            temporada <= temporadas;
            temporada++
        ) {
            const bloco =
                document.createElement(
                    "div"
                );

            bloco.className =
                "temporada-bloco";

            let html =
                "<h4>📺 Temporada " +
                temporada +
                "</h4>";

            for (
                let episodio = 1;
                episodio <= episodios;
                episodio++
            ) {
                html +=
                    '<div class="episodio-form">' +
                    "<label>" +
                    "Episódio " +
                    episodio +
                    "</label>" +
                    '<input type="text" class="titulo-episodio" data-temporada="' +
                    temporada +
                    '" data-episodio="' +
                    episodio +
                    '" placeholder="Título do episódio">' +
                    '<input type="file" class="arquivo-episodio" data-temporada="' +
                    temporada +
                    '" data-episodio="' +
                    episodio +
                    '" accept="video/*">' +
                    "</div>";
            }

            bloco.innerHTML = html;

            listaTemporadas.appendChild(
                bloco
            );
        }
    }

    if (quantidadeTemporadas) {
        quantidadeTemporadas.addEventListener(
            "input",
            gerarCamposTemporadas
        );
    }

    if (quantidadeEpisodios) {
        quantidadeEpisodios.addEventListener(
            "input",
            gerarCamposTemporadas
        );
    }

    /* ============================================================
       RECOLHER EPISÓDIOS
       ============================================================ */

    function recolherEpisodios() {
        const resultado = [];

        if (!listaTemporadas) {
            return resultado;
        }

        const arquivos =
            listaTemporadas.querySelectorAll(
                ".arquivo-episodio"
            );

        arquivos.forEach(function (input) {
            const arquivo =
                input.files &&
                input.files[0];

            const temporada =
                Number(
                    input.dataset.temporada
                );

            const episodio =
                Number(
                    input.dataset.episodio
                );

            const tituloInput =
                listaTemporadas.querySelector(
                    '.titulo-episodio[data-temporada="' +
                        temporada +
                        '"][data-episodio="' +
                        episodio +
                        '"]'
                );

            const titulo =
                tituloInput
                    ? tituloInput.value.trim()
                    : "";

            if (arquivo) {
                resultado.push({
                    id: gerarId(),
                    temporada: temporada,
                    episodio: episodio,
                    titulo:
                        titulo ||
                        "Episódio " +
                            episodio,
                    video: arquivo,
                    videoNome:
                        arquivo.name,
                    tipo:
                        arquivo.type ||
                        "video/mp4",
                    progresso: 0,
                    concluido: false
                });
            }
        });

        return resultado;
    }

    /* ============================================================
       CAPA SELECIONADA
       ============================================================ */

    function obterCapaSelecionada() {
        if (capaManual) {
            return capaManual;
        }

        if (
            previewCapa &&
            previewCapa.dataset
                .capaSelecionada
        ) {
            return previewCapa.dataset
                .capaSelecionada;
        }

        return null;
    }

    /* ============================================================
       PUBLICAR CONTEÚDO
       ============================================================ */

    async function publicarConteudo() {
        try {
            if (!db) {
                mostrarMensagem(
                    "O armazenamento ainda não está pronto.",
                    "erro"
                );

                return;
            }

            const tipo =
                tipoConteudo &&
                tipoConteudo.value
                    ? tipoConteudo.value
                    : "filme";

            const nome =
                nomeConteudo
                    ? nomeConteudo.value.trim()
                    : "";

            const descricao =
                descricaoConteudo
                    ? descricaoConteudo.value.trim()
                    : "";

            const ano =
                anoConteudo
                    ? Number(
                          anoConteudo.value
                      )
                    : 0;

            const acesso =
                tipoAcesso
                    ? tipoAcesso.value
                    : "gratis";

            const preco =
                precoConteudo &&
                precoConteudo.value
                    ? Number(
                          precoConteudo.value
                      )
                    : 0;

            if (!nome) {
                mostrarMensagem(
                    "Digite o nome do filme ou série.",
                    "erro"
                );

                if (nomeConteudo) {
                    nomeConteudo.focus();
                }

                return;
            }

            if (
                !ano ||
                ano < 1900 ||
                ano > 2100
            ) {
                mostrarMensagem(
                    "Digite um ano válido.",
                    "erro"
                );

                return;
            }

            if (
                (acesso === "venda" ||
                    acesso === "aluguel") &&
                (!Number.isFinite(preco) ||
                    preco <= 0)
            ) {
                mostrarMensagem(
                    "Digite um preço válido.",
                    "erro"
                );

                return;
            }

            if (
                aceitarRegras &&
                !aceitarRegras.checked
            ) {
                mostrarMensagem(
                    "Você precisa aceitar as regras da plataforma.",
                    "erro"
                );

                return;
            }

            let video = null;
            let episodios = [];
            let capa = obterCapaSelecionada();

            if (tipo === "filme") {
                if (
                    !arquivoVideo ||
                    !arquivoVideo.files ||
                    !arquivoVideo.files[0]
                ) {
                    mostrarMensagem(
                        "Selecione o vídeo do filme.",
                        "erro"
                    );

                    return;
                }

                video =
                    arquivoVideo.files[0];
            } else {
                episodios =
                    recolherEpisodios();

                if (!episodios.length) {
                    mostrarMensagem(
                        "Adicione pelo menos um episódio.",
                        "erro"
                    );

                    return;
                }

                /*
                 * Se não existe capa manual nem automática,
                 * tentamos gerar uma capa usando o primeiro episódio.
                 */
                if (!capa && episodios[0]) {
                    const capas =
                        await gerarCapasAutomaticas(
                            episodios[0].video
                        );

                    if (
                        capas &&
                        capas.length
                    ) {
                        capa = capas[0];
                    }
                }
            }

            /*
             * Se for filme e não houver capa,
             * gerar automaticamente.
             */
            if (
                tipo === "filme" &&
                !capa &&
                video
            ) {
                const capas =
                    await gerarCapasAutomaticas(
                        video
                    );

                if (
                    capas &&
                    capas.length
                ) {
                    capa = capas[0];
                }
            }

            const agora =
                new Date();

            const conteudo = {
                id: gerarId(),

                tipo: tipo,

                nome: nome,

                titulo: nome,

                descricao: descricao,

                ano: ano,

                acesso: acesso,

                tipoAcesso: acesso,

                preco:
                    Number.isFinite(preco)
                        ? preco
                        : 0,

                dataPublicacao:
                    agora.toISOString(),

                data: agora.toISOString(),

                atualizadoEm:
                    agora.toISOString(),

                visualizacoes: 0,

                views: 0,

                favoritos: false,

                favorite: false,

                progresso: 0,

                duracao: 0,

                capa: capa || null,

                cover: capa || null,

                video: video || null,

                videoNome:
                    video
                        ? video.name
                        : "",

                videoTipo:
                    video
                        ? video.type
                        : "",

                tamanho:
                    video
                        ? video.size
                        : 0,

                temporadas:
                    tipo === "serie"
                        ? Number(
                              quantidadeTemporadas
                                  ? quantidadeTemporadas.value
                                  : 0
                          ) || 0
                        : 0,

                quantidadeTemporadas:
                    tipo === "serie"
                        ? Number(
                              quantidadeTemporadas
                                  ? quantidadeTemporadas.value
                                  : 0
                          ) || 0
                        : 0,

                quantidadeEpisodios:
                    tipo === "serie"
                        ? Number(
                              quantidadeEpisodios
                                  ? quantidadeEpisodios.value
                                  : 0
                          ) || 0
                        : 0,

                episodios:
                    tipo === "serie"
                        ? episodios
                        : []
            };

            /*
             * Compatibilidade:
             * alguns conteúdos antigos podem usar nomes
             * diferentes de propriedades.
             */
            conteudo.createdAt =
                conteudo.dataPublicacao;

            conteudo.updatedAt =
                conteudo.atualizadoEm;

            await guardarConteudo(
                conteudo
            );

            mostrarMensagem(
                "✅ Conteúdo publicado e guardado no navegador.",
                "normal"
            );

            limparFormulario();

            fecharPublicacao();

            await carregarConteudos();
        } catch (erro) {
            console.error(
                "Erro ao publicar:",
                erro
            );

            mostrarMensagem(
                "❌ Não foi possível publicar: " +
                    (
                        erro.message ||
                        erro
                    ),
                "erro"
            );
        }
    }

    if (salvarPublicacao) {
        salvarPublicacao.addEventListener(
            "click",
            publicarConteudo
        );
    }

    /* ============================================================
       LIMPAR FORMULÁRIO
       ============================================================ */

    function limparFormulario() {
        if (nomeConteudo) {
            nomeConteudo.value = "";
        }

        if (descricaoConteudo) {
            descricaoConteudo.value = "";
        }

        if (anoConteudo) {
            anoConteudo.value =
                new Date().getFullYear();
        }

        if (arquivoCapa) {
            arquivoCapa.value = "";
        }

        if (arquivoVideo) {
            arquivoVideo.value = "";
        }

        if (quantidadeTemporadas) {
            quantidadeTemporadas.value = "";
        }

        if (quantidadeEpisodios) {
            quantidadeEpisodios.value = "";
        }

        if (listaTemporadas) {
            listaTemporadas.innerHTML = "";
        }

        if (tipoAcesso) {
            tipoAcesso.value =
                "gratis";
        }

        if (precoConteudo) {
            precoConteudo.value = "";
        }

        if (aceitarRegras) {
            aceitarRegras.checked =
                false;
        }

        capaManual = null;

        if (previewCapa) {
            previewCapa.innerHTML =
                "Pré-visualização da capa";

            delete previewCapa.dataset
                .capaSelecionada;
        }

        atualizarTipoConteudo();
        atualizarAcesso();
    }

    /* ============================================================
       NORMALIZAÇÃO DOS CONTEÚDOS ANTIGOS
       ============================================================ */

    function normalizarConteudo(item) {
        if (!item || typeof item !== "object") {
            return null;
        }

        const resultado = Object.assign(
            {},
            item
        );

        if (!resultado.id) {
            resultado.id = gerarId();
        }

        resultado.nome =
            resultado.nome ||
            resultado.titulo ||
            resultado.name ||
            "Sem título";

        resultado.titulo =
            resultado.titulo ||
            resultado.nome;

        resultado.tipo =
            resultado.tipo ||
            resultado.type ||
            "filme";

        resultado.descricao =
            resultado.descricao ||
            resultado.description ||
            "";

        resultado.ano =
            resultado.ano ||
            resultado.year ||
            "";

        resultado.acesso =
            resultado.acesso ||
            resultado.tipoAcesso ||
            resultado.accessType ||
            "gratis";

        resultado.tipoAcesso =
            resultado.tipoAcesso ||
            resultado.acesso;

        resultado.preco =
            numeroSeguro(
                resultado.preco,
                0
            );

        resultado.favoritos =
            Boolean(
                resultado.favoritos ??
                    resultado.favorite ??
                    false
            );

        resultado.favorite =
            resultado.favoritos;

        resultado.visualizacoes =
            numeroSeguro(
                resultado.visualizacoes ??
                    resultado.views,
                0
            );

        resultado.views =
            resultado.visualizacoes;

        resultado.progresso =
            numeroSeguro(
                resultado.progresso,
                0
            );

        resultado.episodios =
            Array.isArray(
                resultado.episodios
            )
                ? resultado.episodios
                : [];

        /*
         * Algumas versões antigas podem ter chamado
         * a capa de cover.
         */
        if (
            !resultado.capa &&
            resultado.cover
        ) {
            resultado.capa =
                resultado.cover;
        }

        if (
            !resultado.cover &&
            resultado.capa
        ) {
            resultado.cover =
                resultado.capa;
        }

        return resultado;
    }

    /* ============================================================
       CAPA DO CARD
       ============================================================ */

    function obterURLCapa(conteudo) {
        if (!conteudo) {
            return "";
        }

        const possiveis = [
            conteudo.capa,
            conteudo.cover,
            conteudo.imagem,
            conteudo.poster,
            conteudo.thumbnail
        ];

        for (
            let i = 0;
            i < possiveis.length;
            i++
        ) {
            const valor =
                possiveis[i];

            if (!valor) {
                continue;
            }

            const url = criarURL(
                valor,
                "image/jpeg"
            );

            if (url) {
                return url;
            }
        }

        return "";
    }

    /* ============================================================
       CARD
       ============================================================ */

    function criarCard(conteudo) {
        const item =
            normalizarConteudo(
                conteudo
            );

        if (!item) {
            return null;
        }

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "card";

        card.dataset.id =
            item.id;

        const capaURL =
            obterURLCapa(item);

        const favorito =
            Boolean(
                item.favoritos ||
                    item.favorite
            );

        const progresso =
            Math.max(
                0,
                Math.min(
                    100,
                    numeroSeguro(
                        item.progresso,
                        0
                    )
                )
            );

        const tipoTexto =
            item.tipo === "serie"
                ? "Série"
                : "Filme";

        let capaHTML = "";

        if (capaURL) {
            capaHTML =
                '<div class="capa">' +
                '<img src="' +
                capaURL +
                '" alt="' +
                escaparHTML(
                    item.nome
                ) +
                '">' +
                "</div>";
        } else {
            capaHTML =
                '<div class="capa capa1">' +
                (
                    item.tipo ===
                    "serie"
                        ? "📺"
                        : "🎬"
                ) +
                "</div>";
        }

        let acessoTexto =
            "🆓 Grátis";

        if (item.acesso === "venda") {
            acessoTexto =
                "💰 " +
                (
                    item.preco > 0
                        ? item.preco +
                          " Kz"
                        : "Venda"
                );
        }

        if (
            item.acesso ===
            "aluguel"
        ) {
            acessoTexto =
                "🎟️ " +
                (
                    item.preco > 0
                        ? item.preco +
                          " Kz"
                        : "Aluguel"
                );
        }

        const favoritoTexto =
            favorito
                ? "💛"
                : "⭐";

        card.innerHTML =
            capaHTML +
            '<div class="card-info">' +
            "<h3>" +
            escaparHTML(
                item.nome
            ) +
            "</h3>" +
            "<p>" +
            escaparHTML(
                tipoTexto
            ) +
            " • " +
            escaparHTML(
                item.ano
            ) +
            "</p>" +
            '<p class="ima-acesso">' +
            escaparHTML(
                acessoTexto
            ) +
            "</p>" +
            (
                progresso > 0
                    ? '<div style="height:5px;background:#ddd;border-radius:10px;overflow:hidden;margin:8px 0;">' +
                      '<div style="height:100%;width:' +
                      progresso +
                      '%;background:#2563eb;"></div>' +
                      "</div>" +
                      "<small>Assistido " +
                      progresso +
                      "%</small>"
                    : ""
            ) +
            '<div class="botoes">' +
            '<button type="button" data-acao="play" title="Assistir">▶️</button>' +
            '<button type="button" data-acao="download" title="Baixar">⬇️</button>' +
            '<button type="button" data-acao="share" title="Compartilhar">🔗</button>' +
            '<button type="button" data-acao="favorito" title="Favorito">' +
            favoritoTexto +
            "</button>" +
            '<button type="button" data-acao="excluir" title="Excluir">🗑️</button>' +
            "</div>" +
            "</div>";

        const botoes =
            card.querySelectorAll(
                "[data-acao]"
            );

        botoes.forEach(function (botao) {
            botao.addEventListener(
                "click",
                async function (evento) {
                    evento.stopPropagation();

                    const acao =
                        botao.dataset.acao;

                    if (
                        acao === "play"
                    ) {
                        await reproduzirConteudo(
                            item
                        );
                    }

                    if (
                        acao ===
                        "download"
                    ) {
                        baixarConteudo(
                            item
                        );
                    }

                    if (
                        acao === "share"
                    ) {
                        compartilharConteudo(
                            item
                        );
                    }

                    if (
                        acao ===
                        "favorito"
                    ) {
                        await alternarFavorito(
                            item
                        );
                    }

                    if (
                        acao ===
                        "excluir"
                    ) {
                        await excluirConteudo(
                            item
                        );
                    }
                }
            );
        });

        return card;
    }

    /* ============================================================
       FILTROS
       ============================================================ */

    function aplicarFiltro(
        conteudos
    ) {
        let resultado =
            conteudos.slice();

        if (
            filtroAtual ===
            "filmes"
        ) {
            resultado =
                resultado.filter(
                    function (item) {
                        return (
                            item.tipo !==
                            "serie"
                        );
                    }
                );
        }

        if (
            filtroAtual ===
            "series"
        ) {
            resultado =
                resultado.filter(
                    function (item) {
                        return (
                            item.tipo ===
                            "serie"
                        );
                    }
                );
        }

        if (
            filtroAtual ===
            "favoritos"
        ) {
            resultado =
                resultado.filter(
                    function (item) {
                        return Boolean(
                            item.favoritos ||
                                item.favorite
                        );
                    }
                );
        }

        if (
            filtroAtual ===
            "vendas"
        ) {
            resultado =
                resultado.filter(
                    function (item) {
                        return (
                            item.acesso ===
                                "venda" ||
                            item.tipoAcesso ===
                                "venda" ||
                            item.acesso ===
                                "aluguel" ||
                            item.tipoAcesso ===
                                "aluguel"
                        );
                    }
                );
        }

        return resultado;
    }

    /* ============================================================
       CARREGAR CONTEÚDOS
       ============================================================ */

    async function carregarConteudos() {
        if (!listaFilmes) {
            return;
        }

        liberarURLs();

        listaFilmes.innerHTML =
            "";

        try {
            let conteudos =
                await obterConteudos();

            conteudos =
                conteudos
                    .map(
                        normalizarConteudo
                    )
                    .filter(
                        Boolean
                    );

            conteudos.sort(
                function (a, b) {
                    const dataA =
                        new Date(
                            a.dataPublicacao ||
                                a.createdAt ||
                                0
                        ).getTime();

                    const dataB =
                        new Date(
                            b.dataPublicacao ||
                                b.createdAt ||
                                0
                        ).getTime();

                    return dataB - dataA;
                }
            );

            conteudos =
                aplicarFiltro(
                    conteudos
                );

            const pesquisa =
                campoPesquisa
                    ? campoPesquisa.value
                          .trim()
                          .toLowerCase()
                    : "";

            if (pesquisa) {
                conteudos =
                    conteudos.filter(
                        function (item) {
                            const texto =
                                (
                                    item.nome +
                                    " " +
                                    item.descricao +
                                    " " +
                                    item.ano
                                ).toLowerCase();

                            return texto.includes(
                                pesquisa
                            );
                        }
                    );
            }

            if (!conteudos.length) {
                listaFilmes.innerHTML =
                    '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;">' +
                    "<h3>🎬 Nenhum conteúdo encontrado</h3>" +
                    "<p>Publique seu primeiro filme ou série.</p>" +
                    "</div>";

                return;
            }

            conteudos.forEach(
                function (item) {
                    try {
                        const card =
                            criarCard(
                                item
                            );

                        if (card) {
                            listaFilmes.appendChild(
                                card
                            );
                        }
                    } catch (erro) {
                        /*
                         * UM conteúdo defeituoso não pode
                         * impedir que os outros apareçam.
                         */
                        console.warn(
                            "Conteúdo ignorado ao criar card:",
                            item,
                            erro
                        );
                    }
                }
            );
        } catch (erro) {
            console.error(
                "Erro ao carregar conteúdos:",
                erro
            );

            listaFilmes.innerHTML =
                '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;">' +
                "<h3>⚠️ Erro ao carregar a biblioteca</h3>" +
                "<p>" +
                escaparHTML(
                    erro.message ||
                        "Erro desconhecido"
                ) +
                "</p>" +
                "</div>";
        }
    }

    /* ============================================================
       REPRODUÇÃO
       ============================================================ */

    async function reproduzirConteudo(
        conteudo
    ) {
        try {
            if (
                conteudo.tipo ===
                "serie"
            ) {
                abrirSerie(
                    conteudo
                );

                return;
            }

            const url =
                criarURL(
                    conteudo.video,
                    conteudo.videoTipo ||
                        "video/mp4"
                );

            if (!url) {
                mostrarMensagem(
                    "⚠️ O vídeo deste conteúdo não está disponível neste registro.",
                    "erro"
                );

                return;
            }

            videoAtual =
                conteudo;

            if (videoPlayer) {
                videoPlayer.src =
                    url;

                videoPlayer.currentTime =
                    0;

                /*
                 * Recuperar progresso.
                 */
                if (
                    conteudo.progresso &&
                    conteudo.duracao
                ) {
                    const percentual =
                        conteudo.progresso /
                        100;

                    videoPlayer.addEventListener(
                        "loadedmetadata",
                        function recuperar() {
                            try {
                                videoPlayer.currentTime =
                                    videoPlayer.duration *
                                    percentual;
                            } catch (
                                erro
                            ) {}

                            videoPlayer.removeEventListener(
                                "loadedmetadata",
                                recuperar
                            );
                        }
                    );
                }

                if (
                    tituloPlayer
                ) {
                    tituloPlayer.textContent =
                        conteudo.nome ||
                        "Filme";
                }

                if (
                    descricaoPlayer
                ) {
                    descricaoPlayer.textContent =
                        conteudo.descricao ||
                        "";
                }

                if (modalPlayer) {
                    modalPlayer.classList.add(
                        "ativo"
                    );

                    modalPlayer.style.display =
                        "flex";
                }

                try {
                    await videoPlayer.play();
                } catch (erro) {
                    console.log(
                        "Reprodução automática bloqueada pelo navegador."
                    );
                }
            }

            conteudo.visualizacoes =
                numeroSeguro(
                    conteudo.visualizacoes,
                    0
                ) + 1;

            conteudo.views =
                conteudo.visualizacoes;

            await atualizarConteudo(
                conteudo
            );
        } catch (erro) {
            console.error(
                "Erro ao reproduzir:",
                erro
            );

            mostrarMensagem(
                "Erro ao abrir o vídeo.",
                "erro"
            );
        }
    }

    /* ============================================================
       SÉRIE
       ============================================================ */

    function abrirSerie(
        conteudo
    ) {
        if (
            !conteudo.episodios ||
            !conteudo.episodios.length
        ) {
            mostrarMensagem(
                "Esta série não possui episódios disponíveis.",
                "erro"
            );

            return;
        }

        let mensagem =
            "📺 " +
            conteudo.nome +
            "\n\n";

        conteudo.episodios.forEach(
            function (episodio) {
                mensagem +=
                    "T" +
                    episodio.temporada +
                    " • E" +
                    episodio.episodio +
                    " - " +
                    (
                        episodio.titulo ||
                        "Episódio " +
                            episodio.episodio
                    ) +
                    "\n";
            }
        );

        const escolha =
            window.prompt(
                mensagem +
                    "\nDigite o número do episódio que deseja assistir:"
            );

        if (
            escolha === null
        ) {
            return;
        }

        const numero =
            Number(escolha);

        /*
         * Para séries antigas, escolhemos pelo índice
         * se o número não corresponder exatamente.
         */
        let episodio =
            conteudo.episodios.find(
                function (item) {
                    return (
                        Number(
                            item.episodio
                        ) === numero
                    );
                }
            );

        if (!episodio) {
            episodio =
                conteudo.episodios[
                    numero - 1
                ];
        }

        if (!episodio) {
            mostrarMensagem(
                "Episódio não encontrado.",
                "erro"
            );

            return;
        }

        const url =
            criarURL(
                episodio.video,
                episodio.tipo ||
                    "video/mp4"
            );

        if (!url) {
            mostrarMensagem(
                "O vídeo deste episódio não está disponível.",
                "erro"
            );

            return;
        }

        videoAtual =
            conteudo;

        if (videoPlayer) {
            videoPlayer.src =
                url;

            if (tituloPlayer) {
                tituloPlayer.textContent =
                    conteudo.nome +
                    " — " +
                    (
                        episodio.titulo ||
                        "Episódio " +
                            episodio.episodio
                    );
            }

            if (descricaoPlayer) {
                descricaoPlayer.textContent =
                    conteudo.descricao ||
                    "";
            }

            if (modalPlayer) {
                modalPlayer.classList.add(
                    "ativo"
                );

                modalPlayer.style.display =
                    "flex";
            }

            videoPlayer.play().catch(
                function () {}
            );
        }

        conteudo.visualizacoes =
            numeroSeguro(
                conteudo.visualizacoes,
                0
            ) + 1;

        conteudo.views =
            conteudo.visualizacoes;

        atualizarConteudo(
            conteudo
        ).catch(
            console.warn
        );
    }

    /* ============================================================
       PROGRESSO DO VÍDEO
       ============================================================ */

    if (videoPlayer) {
        videoPlayer.addEventListener(
            "loadedmetadata",
            function () {
                if (
                    videoAtual
                ) {
                    videoAtual.duracao =
                        videoPlayer.duration;

                    atualizarConteudo(
                        videoAtual
                    ).catch(
                        console.warn
                    );
                }
            }
        );

        videoPlayer.addEventListener(
            "timeupdate",
            function () {
                if (
                    !videoAtual ||
                    !videoPlayer.duration
                ) {
                    return;
                }

                const progresso =
                    (
                        videoPlayer
                            .currentTime /
                        videoPlayer.duration
                    ) *
                    100;

                videoAtual.progresso =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            progresso
                        )
                    );

                /*
                 * Não gravar no banco a cada milissegundo.
                 */
                if (
                    Math.floor(
                        videoPlayer.currentTime
                    ) %
                        5 ===
                    0
                ) {
                    atualizarConteudo(
                        videoAtual
                    ).catch(
                        function () {}
                    );
                }
            }
        );

        videoPlayer.addEventListener(
            "ended",
            function () {
                if (!videoAtual) {
                    return;
                }

                videoAtual.progresso =
                    100;

                atualizarConteudo(
                    videoAtual
                ).catch(
                    function () {}
                );
            }
        );
    }

    /* ============================================================
       FECHAR PLAYER
       ============================================================ */

    function fecharModalPlayer() {
        if (videoPlayer) {
            try {
                videoPlayer.pause();
            } catch (erro) {}

            videoPlayer.removeAttribute(
                "src"
            );

            try {
                videoPlayer.load();
            } catch (erro) {}
        }

        if (modalPlayer) {
            modalPlayer.classList.remove(
                "ativo"
            );

            modalPlayer.style.display =
                "none";
        }

        videoAtual = null;
    }

    if (fecharPlayer) {
        fecharPlayer.addEventListener(
            "click",
            fecharModalPlayer
        );
    }

    /* ============================================================
       DOWNLOAD
       ============================================================ */

    function baixarConteudo(
        conteudo
    ) {
        try {
            if (
                conteudo.tipo ===
                "serie"
            ) {
                mostrarMensagem(
                    "Para séries, abra o episódio que deseja assistir.",
                    "normal"
                );

                return;
            }

            const url =
                criarURL(
                    conteudo.video,
                    conteudo.videoTipo ||
                        "video/mp4"
                );

            if (!url) {
                mostrarMensagem(
                    "O vídeo não está disponível para download.",
                    "erro"
                );

                return;
            }

            const link =
                document.createElement(
                    "a"
                );

            link.href = url;

            link.download =
                (
                    conteudo.nome ||
                    "video"
                ).replace(
                    /[\\/:*?"<>|]/g,
                    "_"
                ) +
                ".mp4";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            mostrarMensagem(
                "⬇️ Download iniciado.",
                "normal"
            );
        } catch (erro) {
            console.error(
                "Erro no download:",
                erro
            );

            mostrarMensagem(
                "Não foi possível baixar este vídeo.",
                "erro"
            );
        }
    }

    /* ============================================================
       COMPARTILHAR
       ============================================================ */

    async function compartilharConteudo(
        conteudo
    ) {
        const texto =
            "🎬 " +
            conteudo.nome +
            "\n\n" +
            (
                conteudo.descricao ||
                "Confira este conteúdo no I.M.A FILMES."
            );

        try {
            if (
                navigator.share
            ) {
                await navigator.share(
                    {
                        title:
                            conteudo.nome,
                        text: texto
                    }
                );

                return;
            }

            if (
                navigator.clipboard
            ) {
                await navigator.clipboard.writeText(
                    texto
                );

                mostrarMensagem(
                    "🔗 Informações copiadas.",
                    "normal"
                );

                return;
            }

            window.prompt(
                "Copie o texto:",
                texto
            );
        } catch (erro) {
            if (
                erro &&
                erro.name ===
                    "AbortError"
            ) {
                return;
            }

            console.warn(
                "Compartilhamento:",
                erro
            );
        }
    }

    /* ============================================================
       FAVORITO
       ============================================================ */

    async function alternarFavorito(
        conteudo
    ) {
        try {
            const atual =
                await obterConteudo(
                    conteudo.id
                );

            if (!atual) {
                return;
            }

            const novoValor =
                !Boolean(
                    atual.favoritos ||
                        atual.favorite
                );

            atual.favoritos =
                novoValor;

            atual.favorite =
                novoValor;

            await atualizarConteudo(
                atual
            );

            mostrarMensagem(
                novoValor
                    ? "⭐ Adicionado aos favoritos."
                    : "Favorito removido.",
                "normal"
            );

            await carregarConteudos();
        } catch (erro) {
            console.error(
                "Erro no favorito:",
                erro
            );

            mostrarMensagem(
                "Não foi possível atualizar o favorito.",
                "erro"
            );
        }
    }

    /* ============================================================
       EXCLUIR
       ============================================================ */

    async function excluirConteudo(
        conteudo
    ) {
        const confirmar =
            window.confirm(
                "Tem certeza que deseja excluir:\n\n" +
                    conteudo.nome +
                    "\n\nEsta ação remove o conteúdo deste navegador."
            );

        if (!confirmar) {
            return;
        }

        try {
            await apagarConteudo(
                conteudo.id
            );

            mostrarMensagem(
                "🗑️ Conteúdo excluído.",
                "normal"
            );

            await carregarConteudos();
        } catch (erro) {
            console.error(
                "Erro ao excluir:",
                erro
            );

            mostrarMensagem(
                "Não foi possível excluir o conteúdo.",
                "erro"
            );
        }
    }

    /* ============================================================
       PESQUISA
       ============================================================ */

    if (campoPesquisa) {
        campoPesquisa.addEventListener(
            "input",
            function () {
                carregarConteudos();
            }
        );
    }

    /* ============================================================
       MENU LATERAL
       ============================================================ */

    function configurarMenu() {
        const menu =
            document.querySelector(
                ".menu"
            );

        if (!menu) {
            return;
        }

        const botoes =
            menu.querySelectorAll(
                "button"
            );

        botoes.forEach(
            function (botao) {
                const texto =
                    botao.textContent
                        .toLowerCase()
                        .trim();

                if (
                    botao.id ===
                    "botaoEnviarMenu"
                ) {
                    return;
                }

                if (
                    texto.includes(
                        "publicar"
                    )
                ) {
                    return;
                }

                botao.addEventListener(
                    "click",
                    function () {
                        botoes.forEach(
                            function (
                                outro
                            ) {
                                outro.classList.remove(
                                    "menu-ativo"
                                );
                            }
                        );

                        botao.classList.add(
                            "menu-ativo"
                        );

                        if (
                            texto.includes(
                                "início"
                            )
                        ) {
                            filtroAtual =
                                "todos";
                        } else if (
                            texto.includes(
                                "filmes"
                            )
                        ) {
                            filtroAtual =
                                "filmes";
                        } else if (
                            texto.includes(
                                "séries"
                            )
                        ) {
                            filtroAtual =
                                "series";
                        } else if (
                            texto.includes(
                                "favoritos"
                            )
                        ) {
                            filtroAtual =
                                "favoritos";
                        } else if (
                            texto.includes(
                                "biblioteca"
                            )
                        ) {
                            filtroAtual =
                                "todos";
                        } else if (
                            texto.includes(
                                "vendas"
                            )
                        ) {
                            filtroAtual =
                                "vendas";
                        } else {
                            /*
                             * Configuração e administrador
                             * ainda não alteram a biblioteca.
                             */
                            return;
                        }

                        carregarConteudos();
                    }
                );
            }
        );
    }

    /* ============================================================
       BOTÃO "VER TODOS"
       ============================================================ */

    const botoesVerTodos =
        document.querySelectorAll(
            ".titulo-secao button"
        );

    botoesVerTodos.forEach(
        function (botao) {
            botao.addEventListener(
                "click",
                function () {
                    filtroAtual =
                        "todos";

                    carregarConteudos();
                }
            );
        }
    );

    /* ============================================================
       FECHAR MODAIS CLICANDO FORA
       ============================================================ */

    if (modalPublicacao) {
        modalPublicacao.addEventListener(
            "click",
            function (evento) {
                if (
                    evento.target ===
                    modalPublicacao
                ) {
                    fecharPublicacao();
                }
            }
        );
    }

    if (modalPlayer) {
        modalPlayer.addEventListener(
            "click",
            function (evento) {
                if (
                    evento.target ===
                    modalPlayer
                ) {
                    fecharModalPlayer();
                }
            }
        );
    }

    /* ============================================================
       ESC
       ============================================================ */

    document.addEventListener(
        "keydown",
        function (evento) {
            if (
                evento.key ===
                "Escape"
            ) {
                fecharPublicacao();
                fecharModalPlayer();
            }
        }
    );

    /* ============================================================
       CORREÇÃO DE CLIQUE EM CARDS
       ============================================================ */

    if (listaFilmes) {
        listaFilmes.addEventListener(
            "click",
            function (evento) {
                const card =
                    evento.target.closest(
                        ".card"
                    );

                if (!card) {
                    return;
                }

                if (
                    evento.target.closest(
                        "button"
                    )
                ) {
                    return;
                }

                const id =
                    card.dataset.id;

                if (!id) {
                    return;
                }

                obterConteudo(id)
                    .then(
                        function (
                            conteudo
                        ) {
                            if (
                                conteudo
                            ) {
                                reproduzirConteudo(
                                    conteudo
                                );
                            }
                        }
                    )
                    .catch(
                        console.error
                    );
            }
        );
    }

    /* ============================================================
       LIMPEZA AUTOMÁTICA DE URLS
       ============================================================ */

    window.addEventListener(
        "beforeunload",
        function () {
            liberarURLs();

            if (db) {
                try {
                    db.close();
                } catch (erro) {}
            }
        }
    );

    /* ============================================================
       INICIALIZAÇÃO
       ============================================================ */

    async function iniciarAplicacao() {
        try {
            console.log(
                "🎬 Iniciando I.M.A FILMES..."
            );

            db =
                await abrirBanco();

            console.log(
                "✅ IndexedDB aberto:",
                DB_NAME,
                "versão:",
                db.version
            );

            /*
             * Garante que o formulário começa correto.
             */
            atualizarTipoConteudo();
            atualizarAcesso();

            configurarMenu();

            if (anoConteudo) {
                if (!anoConteudo.value) {
                    anoConteudo.value =
                        new Date().getFullYear();
                }
            }

            await carregarConteudos();

            console.log(
                "✅ I.M.A FILMES iniciado corretamente."
            );
        } catch (erro) {
            console.error(
                "❌ Erro ao iniciar I.M.A FILMES:",
                erro
            );

            const detalhe =
                erro &&
                erro.message
                    ? erro.message
                    : String(erro);

            if (listaFilmes) {
                listaFilmes.innerHTML =
                    '<div style="grid-column:1/-1;text-align:center;padding:40px 20px;">' +
                    "<h3>⚠️ Erro ao iniciar o armazenamento</h3>" +
                    "<p>" +
                    escaparHTML(
                        detalhe
                    ) +
                    "</p>" +
                    "<p>Seus dados não foram apagados.</p>" +
                    "</div>";
            }

            mostrarMensagem(
                "❌ Erro no armazenamento: " +
                    detalhe,
                "erro"
            );
        }
    }

    iniciarAplicacao();
});
    /* =========================================================
       ESTILO DO MODAL PROFISSIONAL
       ========================================================= */

    function instalarEstiloDetalhes() {
        if (document.getElementById("imaEstiloDetalhes")) return;

        const style = document.createElement("style");
        style.id = "imaEstiloDetalhes";

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

        document.getElementById("imaFecharDetalhes")
            .addEventListener("click", fecharDetalhes);
    }

    function fecharDetalhes() {
        const modal = document.getElementById("imaModalDetalhes");

        if (modal) {
            modal.classList.remove("ativo");
        }

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
        const tipoTexto =
            conteudo.tipo === "serie"
                ? "📺 Série"
                : "🎬 Filme";

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

                        <span class="ima-detalhes-badge">
                            ${tipoTexto}
                        </span>

                        ${
                            conteudo.ano
                                ? `<span class="ima-detalhes-badge">
                                    📅 ${escaparTexto(conteudo.ano)}
                                   </span>`
                                : ""
                        }

                        <span class="ima-detalhes-badge">
                            👁️ ${visualizacoes} visualizações
                        </span>

                        <span class="ima-detalhes-badge">
                            ${escaparTexto(textoAcesso(conteudo))}
                        </span>

                    </div>

                    <div class="ima-detalhes-descricao">
                        ${escaparTexto(
                            conteudo.descricao || "Sem descrição."
                        )}
                    </div>

                    <div class="ima-detalhes-acoes">

                        <button
                            class="ima-detalhes-btn principal"
                            id="imaDetalhesAssistir"
                        >
                            ▶️ ${
                                conteudo.tipo === "serie"
                                    ? "Escolher episódio"
                                    : "Assistir agora"
                            }
                        </button>

                        <button
                            class="ima-detalhes-btn"
                            id="imaDetalhesFavorito"
                        >
                            ${
                                conteudo.favorito
                                    ? "❤️ Favorito"
                                    : "🤍 Favoritar"
                            }
                        </button>

                        <button
                            class="ima-detalhes-btn"
                            id="imaDetalhesCompartilhar"
                        >
                            🔗 Partilhar
                        </button>

                        ${
                            conteudo.tipo === "filme"
                                ? `
                                    <button
                                        class="ima-detalhes-btn"
                                        id="imaDetalhesBaixar"
                                    >
                                        ⬇️ Baixar
                                    </button>
                                  `
                                : ""
                        }

                    </div>

                    ${
                        Number(conteudo.progresso || 0) > 0
                            ? `
                                <div class="ima-detalhes-progresso">

                                    <div>
                                        ▶️ Continuar assistindo —
                                        ${Math.round(conteudo.progresso)}%
                                    </div>

                                    <div class="ima-detalhes-barra">
                                        <span
                                            style="
                                                width:${Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        conteudo.progresso
                                                    )
                                                )}%
                                            "
                                        ></span>
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
                        Publicado em
                        ${escaparTexto(
                            formatarData(conteudo.dataPublicacao)
                            || "data não disponível"
                        )}.

                        ${
                            conteudo.duracao
                                ? " Duração: " +
                                  escaparTexto(
                                      formatarTempo(
                                          conteudo.duracao
                                      )
                                  ) +
                                  "."
                                : ""
                        }
                    </p>

                </div>
            `;

        } else {

            html += `
                <div class="ima-detalhes-secao">

                    <h2>📺 Temporadas e episódios</h2>

                    <p style="opacity:.72;">
                        ${(conteudo.temporadas || []).length}
                        temporada(s) •
                        ${totalEpisodios(conteudo)}
                        episódio(s)
                    </p>
            `;

            if (
                !conteudo.temporadas ||
                conteudo.temporadas.length === 0
            ) {

                html += `
                    <p>
                        Esta série ainda não possui episódios.
                    </p>
                `;

            } else {

                conteudo.temporadas.forEach(function (temporada) {

                    html += `
                        <div class="ima-temporada">

                            <div class="ima-temporada-titulo">
                                📚 Temporada
                                ${escaparTexto(
                                    temporada.numero || ""
                                )}
                            </div>
                    `;

                    (temporada.episodios || []).forEach(
                        function (episodio) {

                            const progresso =
                                Number(
                                    episodio.progresso || 0
                                );

                            html += `
                                <div class="ima-episodio">

                                    <div>

                                        <span class="ima-episodio-nome">
                                            Episódio
                                            ${escaparTexto(
                                                episodio.numero || ""
                                            )}
                                            —
                                            ${escaparTexto(
                                                episodio.nome ||
                                                "Episódio"
                                            )}
                                        </span>

                                        <span class="ima-episodio-sub">
                                            👁️
                                            ${Number(
                                                episodio.visualizacoes || 0
                                            )}
                                            visualizações

                                            ${
                                                progresso > 0
                                                    ? " • " +
                                                      Math.round(
                                                          progresso
                                                      ) +
                                                      "% assistido"
                                                    : ""
                                            }
                                        </span>

                                    </div>

                                    <button
                                        class="ima-episodio-play"
                                        data-temporada="${escaparTexto(
                                            temporada.numero
                                        )}"
                                        data-episodio="${escaparTexto(
                                            episodio.numero
                                        )}"
                                    >
                                        ▶️ Assistir
                                    </button>

                                </div>
                            `;
                        }
                    );

                    html += `</div>`;
                });
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

                    if (conteudo.tipo === "filme") {

                        fecharDetalhes();

                        reproduzirFilme(conteudo);

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
                    partilhar(conteudo);
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
            .forEach(function (botao) {

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
                            (conteudo.temporadas || [])
                                .find(function (t) {

                                    return Number(
                                        t.numero
                                    ) === temporadaNumero;
                                });

                        const episodio =
                            temporada &&
                            (temporada.episodios || [])
                                .find(function (e) {

                                    return Number(
                                        e.numero
                                    ) === episodioNumero;
                                });

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
            });
    }

    function encontrarPrimeiroEpisodio(serie) {

        for (
            const temporada of
            (serie.temporadas || [])
        ) {

            for (
                const episodio of
                (temporada.episodios || [])
            ) {

                if (
                    episodio &&
                    episodio.video
                ) {

                    return {
                        temporada: temporada,
                        episodio: episodio
                    };
                }
            }
        }

        return null;
    }

    /* =========================================================
       PUBLICAÇÃO
       ========================================================= */
    function limparFormulario() {
        if (nomeConteudo) nomeConteudo.value = "";
        if (descricaoConteudo) descricaoConteudo.value = "";
        if (anoConteudo) anoConteudo.value = "";

        if (arquivoCapa) {
            arquivoCapa.value = "";
            arquivoCapa._capaAutomatica = null;
        }

        if (arquivoVideo) {
            arquivoVideo.value = "";
        }

        if (precoConteudo) {
            precoConteudo.value = "";
        }

        if (aceitarRegras) {
            aceitarRegras.checked = false;
        }

        if (listaTemporadas) {
            listaTemporadas.innerHTML = "";
        }

        if (previewCapa) {
            previewCapa.innerHTML = "Pré-visualização da capa";
        }

        atualizarTipoConteudo();
        atualizarPreco();
    }

    /* =========================================================
       FILTROS E BIBLIOTECA
       ========================================================= */

    function correspondeAoFiltro(conteudo) {
        if (filtroAtual === "filmes") {
            return conteudo.tipo === "filme";
        }

        if (filtroAtual === "series") {
            return conteudo.tipo === "serie";
        }

        if (filtroAtual === "favoritos") {
            return conteudo.favorito === true;
        }

        if (filtroAtual === "vendas") {
            return (
                conteudo.acesso === "venda" ||
                conteudo.acesso === "aluguel"
            );
        }

        return true;
    }

    async function carregarConteudos() {
        if (!listaFilmes || !db) return;

        try {
            const conteudos = await obterTodosConteudos();

            listaFilmes.innerHTML = "";

            const filtrados = conteudos.filter(correspondeAoFiltro);

            if (!filtrados.length) {
                listaFilmes.innerHTML = `
                    <div style="
                        width:100%;
                        padding:40px;
                        text-align:center;
                        opacity:.75;
                    ">
                        <div style="font-size:50px;">🎬</div>
                        <h3>Nenhum conteúdo encontrado</h3>
                        <p>Publique seu primeiro filme ou série.</p>
                    </div>
                `;
                return;
            }

            filtrados.forEach(function (conteudo) {
                try {
                    const card = criarCard(conteudo);

                    if (card) {
                        listaFilmes.appendChild(card);
                    }
                } catch (erro) {
                    console.error(
                        "Erro ao criar card:",
                        conteudo,
                        erro
                    );
                }
            });

        } catch (erro) {
            console.error(
                "Erro ao carregar conteúdos:",
                erro
            );
        }
    }

    function criarCard(conteudo) {
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.id = conteudo.id;

        const capaURL = criarURL(
            conteudo.capa,
            "image/jpeg"
        );

        const tipoTexto =
            conteudo.tipo === "serie"
                ? "📺 Série"
                : "🎬 Filme";

        const acessoTexto =
            conteudo.acesso === "venda"
                ? "💰 Venda"
                : conteudo.acesso === "aluguel"
                    ? "🎟️ Aluguel"
                    : "🆓 Gratuito";

        const visualizacoes =
            totalVisualizacoes(conteudo);

        const favorito =
            conteudo.favorito === true;

        let progresso = Number(
            conteudo.progresso || 0
        );

        if (!Number.isFinite(progresso)) {
            progresso = 0;
        }

        progresso = Math.max(
            0,
            Math.min(100, progresso)
        );

        const capaHTML = capaURL
            ? `
                <img
                    src="${capaURL}"
                    alt="${escaparHTML(conteudo.nome || "Capa")}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                    "
                >
            `
            : `
                <div style="
                    width:100%;
                    height:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:50px;
                    background:linear-gradient(
                        135deg,
                        #111,
                        #292929
                    );
                ">
                    ${conteudo.tipo === "serie" ? "📺" : "🎬"}
                </div>
            `;

        card.innerHTML = `
            <div
                class="capa"
                data-acao="detalhes"
                style="
                    position:relative;
                    cursor:pointer;
                    overflow:hidden;
                "
            >
                ${capaHTML}

                ${
                    progresso > 0
                        ? `
                            <div style="
                                position:absolute;
                                bottom:0;
                                left:0;
                                width:100%;
                                height:5px;
                                background:rgba(255,255,255,.2);
                            ">
                                <div style="
                                    width:${progresso}%;
                                    height:100%;
                                    background:#00ff88;
                                "></div>
                            </div>
                        `
                        : ""
                }
            </div>

            <h3>
                ${escaparHTML(
                    conteudo.nome || "Sem título"
                )}
            </h3>

            <p>
                ${tipoTexto}
                •
                ${conteudo.ano || ""}
            </p>

            <p style="
                font-size:12px;
                opacity:.7;
                margin-top:4px;
            ">
                ${acessoTexto}
                •
                👁️ ${visualizacoes}
            </p>

            <div class="botoes">
                <button
                    type="button"
                    data-acao="assistir"
                    title="Assistir"
                >
                    ▶️
                </button>

                <button
                    type="button"
                    data-acao="baixar"
                    title="Baixar"
                >
                    ⬇️
                </button>

                <button
                    type="button"
                    data-acao="favorito"
                    title="Favorito"
                >
                    ${favorito ? "❤️" : "🤍"}
                </button>

                <button
                    type="button"
                    data-acao="compartilhar"
                    title="Compartilhar"
                >
                    🔗
                </button>
            </div>
        `;

        card.querySelectorAll("[data-acao]").forEach(
            function (elemento) {
                elemento.addEventListener(
                    "click",
                    function (evento) {
                        evento.stopPropagation();

                        const acao =
                            elemento.dataset.acao;

                        executarAcaoCard(
                            acao,
                            conteudo
                        );
                    }
                );
            }
        );

        const capa = card.querySelector(
            '[data-acao="detalhes"]'
        );

        if (capa) {
            capa.addEventListener(
                "click",
                function () {
                    abrirDetalhes(conteudo.id);
                }
            );
        }

        return card;
    }

    async function executarAcaoCard(
        acao,
        conteudo
    ) {
        if (!conteudo) return;

        if (acao === "detalhes") {
            abrirDetalhes(conteudo.id);
            return;
        }

        if (acao === "assistir") {
            if (conteudo.tipo === "filme") {
                abrirPlayer(conteudo);
            } else {
                abrirDetalhes(conteudo.id);
            }

            return;
        }

        if (acao === "baixar") {
            baixarConteudo(conteudo);
            return;
        }

        if (acao === "favorito") {
            await alternarFavorito(conteudo);
            return;
        }

        if (acao === "compartilhar") {
            compartilharConteudo(conteudo);
        }
    }

    /* =========================================================
       PLAYER
       ========================================================= */

    function abrirPlayer(conteudo, episodio) {
        if (!videoPlayer || !modalPlayer) {
            alert(
                "O player não está disponível."
            );
            return;
        }

        let arquivoVideo = null;
        let titulo = conteudo.nome || "Filme";
        let descricao =
            conteudo.descricao || "";

        if (episodio) {
            arquivoVideo = episodio.video;

            titulo =
                conteudo.nome +
                " - " +
                (
                    episodio.nome ||
                    "Episódio " +
                    episodio.numero
                );
        } else {
            arquivoVideo = conteudo.video;
        }

        const url = criarURL(
            arquivoVideo,
            "video/mp4"
        );

        if (!url) {
            alert(
                "❌ O vídeo deste conteúdo não está disponível."
            );
            return;
        }

        videoAtual = {
            conteudoId: conteudo.id,
            episodio: episodio || null
        };

        videoPlayer.src = url;

        if (tituloPlayer) {
            tituloPlayer.textContent = titulo;
        }

        if (descricaoPlayer) {
            descricaoPlayer.textContent =
                descricao;
        }

        modalPlayer.style.display = "flex";
        modalPlayer.classList.add("ativo");

        try {
            videoPlayer.currentTime =
                episodio
                    ? Number(
                        episodio.progresso || 0
                    )
                    : Number(
                        conteudo.progresso || 0
                    );
        } catch (erro) {
            console.warn(
                "Não foi possível restaurar o progresso:",
                erro
            );
        }

        videoPlayer.play().catch(function () {});

        registrarVisualizacao(
            conteudo,
            episodio
        );
    }

    function fecharPlayer() {
        if (!modalPlayer) return;

        try {
            if (videoPlayer) {
                videoPlayer.pause();
                videoPlayer.removeAttribute("src");
                videoPlayer.load();
            }
        } catch (erro) {}

        modalPlayer.style.display = "none";
        modalPlayer.classList.remove("ativo");

        videoAtual = null;
    }

    if (fecharPlayer) {
        fecharPlayer.addEventListener(
            "click",
            fecharPlayer
        );
    }

    if (modalPlayer) {
        modalPlayer.addEventListener(
            "click",
            function (evento) {
                if (
                    evento.target ===
                    modalPlayer
                ) {
                    fecharPlayer();
                }
            }
        );
    }

    if (videoPlayer) {
        videoPlayer.addEventListener(
            "timeupdate",
            function () {
                salvarProgressoAtual();
            }
        );

        videoPlayer.addEventListener(
            "ended",
            function () {
                salvarProgressoAtual(true);
            }
        );
    }

    async function registrarVisualizacao(
        conteudo,
        episodio
    ) {
        try {
            if (episodio) {
                episodio.visualizacoes =
                    Number(
                        episodio.visualizacoes || 0
                    ) + 1;

                conteudo.ultimoAcesso =
                    Date.now();

                await atualizarConteudo(
                    conteudo
                );
            } else {
                conteudo.visualizacoes =
                    Number(
                        conteudo.visualizacoes || 0
                    ) + 1;

                conteudo.ultimoAcesso =
                    Date.now();

                await atualizarConteudo(
                    conteudo
                );
            }

        } catch (erro) {
            console.warn(
                "Erro ao registrar visualização:",
                erro
            );
        }
    }

    async function salvarProgressoAtual(
        finalizado
    ) {
        if (
            !videoAtual ||
            !videoPlayer ||
            !videoAtual.conteudoId
        ) {
            return;
        }

        try {
            const conteudo =
                await obterConteudo(
                    videoAtual.conteudoId
                );

            if (!conteudo) return;

            const duracao =
                Number(
                    videoPlayer.duration
                );

            const tempo =
                Number(
                    videoPlayer.currentTime
                );

            let progresso = 0;

            if (
                Number.isFinite(duracao) &&
                duracao > 0 &&
                Number.isFinite(tempo)
            ) {
                progresso =
                    (tempo / duracao) * 100;
            }

            if (finalizado) {
                progresso = 100;
            }

            progresso = Math.max(
                0,
                Math.min(
                    100,
                    progresso
                )
            );

            if (videoAtual.episodio) {
                const temporada = (
                    conteudo.temporadas || []
                ).find(function (temp) {
                    return (
                        temp.episodios || []
                    ).some(function (ep) {
                        return (
                            ep ===
                            videoAtual.episodio
                        );
                    });
                });

                if (temporada) {
                    const episodio =
                        (
                            temporada.episodios ||
                            []
                        ).find(function (ep) {
                            return (
                                ep ===
                                videoAtual.episodio
                            );
                        });

                    if (episodio) {
                        episodio.progresso =
                            progresso;
                    }
                }
            } else {
                conteudo.progresso =
                    progresso;

                if (
                    Number.isFinite(duracao) &&
                    duracao > 0
                ) {
                    conteudo.duracao =
                        duracao;
                }
            }

            conteudo.ultimoAcesso =
                Date.now();

            await atualizarConteudo(
                conteudo
            );

        } catch (erro) {
            console.warn(
                "Erro ao salvar progresso:",
                erro
            );
        }
    }

    /* =========================================================
       FAVORITOS
       ========================================================= */

    async function alternarFavorito(
        conteudo
    ) {
        try {
            conteudo.favorito =
                !conteudo.favorito;

            await atualizarConteudo(
                conteudo
            );

            await carregarConteudos();

            if (
                detalhesAtual &&
                detalhesAtual.id ===
                    conteudo.id
            ) {
                detalhesAtual =
                    await obterConteudo(
                        conteudo.id
                    );

                if (detalhesAtual) {
                    abrirDetalhes(
                        detalhesAtual.id
                    );
                }
            }

        } catch (erro) {
            console.error(
                "Erro ao alterar favorito:",
                erro
            );
        }
    }

    /* =========================================================
       DOWNLOAD
       ========================================================= */

    function baixarConteudo(conteudo) {
        if (!conteudo) return;

        let arquivo = null;
        let nomeArquivo =
            conteudo.nome ||
            "conteudo";

        if (conteudo.tipo === "filme") {
            arquivo = conteudo.video;
            nomeArquivo += ".mp4";
        } else {
            const primeiro =
                encontrarPrimeiroEpisodio(
                    conteudo
                );

            if (primeiro) {
                arquivo =
                    primeiro.episodio.video;

                nomeArquivo +=
                    "_T" +
                    primeiro.temporada.numero +
                    "_E" +
                    primeiro.episodio.numero +
                    ".mp4";
            }
        }

        if (!arquivo) {
            alert(
                "❌ Não existe vídeo disponível para baixar."
            );
            return;
        }

        const url = criarURL(
            arquivo,
            "video/mp4"
        );

        if (!url) {
            alert(
                "❌ Não foi possível preparar o download."
            );
            return;
        }

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            nomeArquivo
                .replace(/[\\/:*?"<>|]/g, "_");

        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    /* =========================================================
       COMPARTILHAR
       ========================================================= */

    async function compartilharConteudo(
        conteudo
    ) {
        if (!conteudo) return;

        const texto =
            "🎬 " +
            (conteudo.nome || "I.M.A FILMES") +
            "\n\n" +
            (
                conteudo.descricao ||
                "Confira este conteúdo no I.M.A FILMES."
            );

        try {
            if (
                navigator.share
            ) {
                await navigator.share({
                    title:
                        conteudo.nome ||
                        "I.M.A FILMES",
                    text: texto
                });

                return;
            }
        } catch (erro) {
            if (
                erro &&
                erro.name ===
                    "AbortError"
            ) {
                return;
            }
        }

        try {
            await navigator.clipboard.writeText(
                texto
            );

            alert(
                "🔗 Informações copiadas para a área de transferência."
            );

        } catch (erro) {
            prompt(
                "Copie o texto abaixo:",
                texto
            );
        }
    }

    /* =========================================================
       PESQUISA
       ========================================================= */

    if (campoPesquisa) {
        campoPesquisa.addEventListener(
            "input",
            async function () {
                const termo =
                    campoPesquisa.value
                        .trim()
                        .toLowerCase();

                if (!db || !listaFilmes) {
                    return;
                }

                try {
                    const conteudos =
                        await obterTodosConteudos();

                    listaFilmes.innerHTML =
                        "";

                    const resultados =
                        conteudos.filter(
                            function (conteudo) {
                                if (
                                    !correspondeAoFiltro(
                                        conteudo
                                    )
                                ) {
                                    return false;
                                }

                                const nome =
                                    String(
                                        conteudo.nome ||
                                        ""
                                    ).toLowerCase();

                                const descricao =
                                    String(
                                        conteudo.descricao ||
                                        ""
                                    ).toLowerCase();

                                return (
                                    !termo ||
                                    nome.includes(
                                        termo
                                    ) ||
                                    descricao.includes(
                                        termo
                                    )
                                );
                            }
                        );

                    if (!resultados.length) {
                        listaFilmes.innerHTML = `
                            <div style="
                                width:100%;
                                padding:40px;
                                text-align:center;
                                opacity:.7;
                            ">
                                🔎
                                <h3>
                                    Nenhum resultado encontrado
                                </h3>
                                <p>
                                    Tente pesquisar outro nome.
                                </p>
                            </div>
                        `;

                        return;
                    }

                    resultados.forEach(
                        function (conteudo) {
                            try {
                                const card =
                                    criarCard(
                                        conteudo
                                    );

                                if (card) {
                                    listaFilmes.appendChild(
                                        card
                                    );
                                }

                            } catch (erro) {
                                console.error(
                                    "Erro no resultado:",
                                    erro
                                );
                            }
                        }
                    );

                } catch (erro) {
                    console.error(
                        "Erro na pesquisa:",
                        erro
                    );
                }
            }
        );
    }

    /* =========================================================
       MENU LATERAL
       ========================================================= */

    function configurarMenu() {
        if (!menu) return;

        const botoes =
            menu.querySelectorAll(
                "button"
            );

        botoes.forEach(
            function (botao) {
                botao.addEventListener(
                    "click",
                    function () {
                        const texto =
                            botao.textContent
                                .trim()
                                .toLowerCase();

                        if (
                            texto.includes(
                                "publicar"
                            )
                        ) {
                            abrirPublicacao();
                            return;
                        }

                        if (
                            texto.includes(
                                "filmes"
                            )
                        ) {
                            filtroAtual =
                                "filmes";

                            atualizarBotaoMenu(
                                botao
                            );

                            carregarConteudos();
                            return;
                        }

                        if (
                            texto.includes(
                                "séries"
                            ) ||
                            texto.includes(
                                "series"
                            )
                        ) {
                            filtroAtual =
                                "series";

                            atualizarBotaoMenu(
                                botao
                            );

                            carregarConteudos();
                            return;
                        }

                        if (
                            texto.includes(
                                "favoritos"
                            )
                        ) {
                            filtroAtual =
                                "favoritos";

                            atualizarBotaoMenu(
                                botao
                            );

                            carregarConteudos();
                            return;
                        }

                        if (
                            texto.includes(
                                "minha biblioteca"
                            )
                        ) {
                            filtroAtual =
                                "todos";

                            atualizarBotaoMenu(
                                botao
                            );

                            carregarConteudos();
                            return;
                        }

                        if (
                            texto.includes(
                                "minhas vendas"
                            )
                        ) {
                            filtroAtual =
                                "vendas";

                            atualizarBotaoMenu(
                                botao
                            );

                            carregarConteudos();
                            return;
                        }

                        if (
                            texto.includes(
                                "início"
                            ) ||
                            texto.includes(
                                "inicio"
                            )
                        ) {
                            filtroAtual =
                                "todos";

                            atualizarBotaoMenu(
                                botao
                            );

                            carregarConteudos();
                        }
                    }
                );
            }
        );
    }

    function atualizarBotaoMenu(
        botaoAtivo
    ) {
        if (!menu) return;

        menu.querySelectorAll(
            "button"
        ).forEach(
            function (botao) {
                botao.classList.remove(
                    "menu-ativo"
                );
            }
        );

        if (botaoAtivo) {
            botaoAtivo.classList.add(
                "menu-ativo"
            );
        }
    }

    /* =========================================================
       FECHAR MODAIS COM ESC
       ========================================================= */

    document.addEventListener(
        "keydown",
        function (evento) {
            if (
                evento.key ===
                "Escape"
            ) {
                fecharDetalhes();
                fecharPublicacao();
                fecharPlayer();
            }
        }
    );

    /* =========================================================
       CLIQUE FORA DOS MODAIS
       ========================================================= */

    if (modalPublicacao) {
        modalPublicacao.addEventListener(
            "click",
            function (evento) {
                if (
                    evento.target ===
                    modalPublicacao
                ) {
                    fecharPublicacao();
                }
            }
        );
    }

    /* =========================================================
       BOTÃO VER TODOS
       ========================================================= */

    const botaoVerTodos =
        document.querySelector(
            ".titulo-secao button"
        );

    if (botaoVerTodos) {
        botaoVerTodos.addEventListener(
            "click",
            function () {
                filtroAtual = "todos";

                carregarConteudos();

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            }
        );
    }

    /* =========================================================
       INICIALIZAÇÃO
       ========================================================= */

    async function iniciarAplicacao() {
        try {
            console.log(
                "🎬 Iniciando I.M.A FILMES..."
            );

            instalarEstiloDetalhes();

            criarModalDetalhes();

            atualizarTipoConteudo();

            atualizarPreco();

            configurarMenu();

            db = await abrirBanco();

            console.log(
                "✅ IndexedDB conectado."
            );

            console.log(
                "📦 Banco:",
                DB_NAME
            );

            console.log(
                "💾 Conteúdos existentes serão preservados."
            );

            await carregarConteudos();

            console.log(
                "🎬 I.M.A FILMES carregado com sucesso."
            );

            console.log(
                "💎 Modal profissional de detalhes ativo."
            );

        } catch (erro) {
            console.error(
                "Erro ao iniciar I.M.A FILMES:",
                erro
            );

            if (listaFilmes) {
                listaFilmes.innerHTML = `
                    <div style="
                        padding:30px;
                        text-align:center;
                        color:#ff5555;
                    ">
                        ❌ Erro ao iniciar o armazenamento
                        do I.M.A FILMES.
                        <br><br>
                        <small>
                            Abra o console do navegador
                            para ver os detalhes do erro.
                        </small>
                    </div>
                `;
            }
        }
    }

    iniciarAplicacao();
});
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

        if (filtroAtual === "vendas") {
            return conteudo.acesso === "venda" || conteudo.acesso === "aluguel";
        }

        return true;
    }

    async function carregarConteudos() {
        if (!listaFilmes || !db) return;

        limparURLs();

        let brutos = [];

        try {
            brutos = await obterConteudos();
        } catch (erro) {
            console.error("Erro ao ler conteúdos:", erro);
            return;
        }

        const conteudos = brutos
            .map(normalizarConteudo)
            .filter(Boolean);

        conteudos.sort(function (a, b) {
            return Number(b.dataPublicacao || 0) - Number(a.dataPublicacao || 0);
        });

        const pesquisa = campoPesquisa
            ? campoPesquisa.value.toLowerCase().trim()
            : "";

        const filtrados = conteudos.filter(function (conteudo) {
            if (!correspondeAoFiltro(conteudo)) return false;

            if (!pesquisa) return true;

            const texto = (
                conteudo.nome + " " +
                conteudo.descricao + " " +
                conteudo.ano
            ).toLowerCase();

            return texto.includes(pesquisa);
        });

        listaFilmes.innerHTML = "";

        if (!filtrados.length) {
            listaFilmes.innerHTML =
                `<div style="width:100%;padding:40px;text-align:center;">
                    <h2>📭 Nenhum conteúdo encontrado</h2>
                    <p>Publique um filme ou série para começar sua biblioteca.</p>
                </div>`;
            return;
        }

        filtrados.forEach(function (conteudo) {
            try {
                listaFilmes.appendChild(criarCard(conteudo));
            } catch (erro) {
                console.warn("Um conteúdo não pôde ser exibido:", erro);
            }
        });
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
                if (conteudo.tipo === "filme") {
                    reproduzirFilme(conteudo);
                } else {
                    abrirDetalhes(conteudo);
                }
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

                if (texto.includes("início")) {
                    filtroAtual = "todos";
                } else if (texto.includes("filmes")) {
                    filtroAtual = "filmes";
                } else if (texto.includes("séries")) {
                    filtroAtual = "series";
                } else if (texto.includes("favoritos")) {
                    filtroAtual = "favoritos";
                } else if (texto.includes("biblioteca")) {
                    filtroAtual = "todos";
                } else if (texto.includes("vendas")) {
                    filtroAtual = "vendas";
                } else {
                    return;
                }

                botoes.forEach(function (b) {
                    b.classList.remove("menu-ativo");
                });

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

    iniciarAplicacao();
});

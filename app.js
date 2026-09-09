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

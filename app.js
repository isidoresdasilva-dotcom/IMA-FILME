document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* =========================================================
       I.M.A FILMES
       Biblioteca + IndexedDB + Favoritos + Histórico
       + Continuar assistindo + Pesquisa + Filtros
       ========================================================= */

    const DB_NAME = "IMA_FILMES_DB";
    const DB_VERSION = 2;
    const STORE_NAME = "conteudos";

    let db = null;
    let filtroAtual = "todos";
    let videoAtual = null;
    let objectUrls = [];

    /* =========================================================
       ELEMENTOS
       ========================================================= */

    const botaoEnviar = document.getElementById("botaoEnviar");
    const botaoEnviarMenu = document.getElementById("botaoEnviarMenu");

    const modalPublicacao =
        document.getElementById("modalPublicacao");

    const fecharModal =
        document.getElementById("fecharModal");

    const cancelarPublicacao =
        document.getElementById("cancelarPublicacao");

    const salvarPublicacao =
        document.getElementById("salvarPublicacao");

    const tipoConteudo =
        document.getElementById("tipoConteudo");

    const arquivoCapa =
        document.getElementById("arquivoCapa");

    const previewCapa =
        document.getElementById("previewCapa");

    const nomeConteudo =
        document.getElementById("nomeConteudo");

    const descricaoConteudo =
        document.getElementById("descricaoConteudo");

    const anoConteudo =
        document.getElementById("anoConteudo");

    const areaSerie =
        document.getElementById("areaSerie");

    const quantidadeTemporadas =
        document.getElementById("quantidadeTemporadas");

    const quantidadeEpisodios =
        document.getElementById("quantidadeEpisodios");

    const listaTemporadas =
        document.getElementById("listaTemporadas");

    const areaVideo =
        document.getElementById("areaVideo");

    const arquivoVideo =
        document.getElementById("arquivoVideo");

    const tipoAcesso =
        document.getElementById("tipoAcesso");

    const areaPreco =
        document.getElementById("areaPreco");

    const precoConteudo =
        document.getElementById("precoConteudo");

    const aceitarRegras =
        document.getElementById("aceitarRegras");

    const listaFilmes =
        document.getElementById("listaFilmes");

    const campoPesquisa =
        document.getElementById("campoPesquisa");

    const modalPlayer =
        document.getElementById("modalPlayer");

    const fecharPlayer =
        document.getElementById("fecharPlayer");

    const videoPlayer =
        document.getElementById("videoPlayer");

    const tituloPlayer =
        document.getElementById("tituloPlayer");

    const descricaoPlayer =
        document.getElementById("descricaoPlayer");


    /* =========================================================
       INDEXEDDB
       ========================================================= */

    function abrirBanco() {
        return new Promise(function (resolve, reject) {

            const pedido = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            pedido.onupgradeneeded = function (evento) {

                const banco = evento.target.result;

                let store;

                if (!banco.objectStoreNames.contains(STORE_NAME)) {

                    store = banco.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "id"
                        }
                    );

                } else {

                    store = evento.target.transaction.objectStore(
                        STORE_NAME
                    );

                }

                if (!store.indexNames.contains("tipo")) {
                    store.createIndex(
                        "tipo",
                        "tipo",
                        { unique: false }
                    );
                }

                if (!store.indexNames.contains("dataPublicacao")) {
                    store.createIndex(
                        "dataPublicacao",
                        "dataPublicacao",
                        { unique: false }
                    );
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
                reject(pedido.error);
            };
        });
    }


    function guardarConteudo(conteudo) {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.put(conteudo);

            pedido.onsuccess =
                function () {
                    resolve();
                };

            pedido.onerror =
                function () {
                    reject(pedido.error);
                };
        });
    }


    function obterConteudos() {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.getAll();

            pedido.onsuccess =
                function () {
                    resolve(pedido.result || []);
                };

            pedido.onerror =
                function () {
                    reject(pedido.error);
                };
        });
    }


    function obterConteudo(id) {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    STORE_NAME,
                    "readonly"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.get(id);

            pedido.onsuccess =
                function () {
                    resolve(pedido.result);
                };

            pedido.onerror =
                function () {
                    reject(pedido.error);
                };
        });
    }


    function atualizarConteudo(conteudo) {

        return guardarConteudo(conteudo);
    }


    function apagarConteudo(id) {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    STORE_NAME,
                    "readwrite"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.delete(id);

            pedido.onsuccess =
                function () {
                    resolve();
                };

            pedido.onerror =
                function () {
                    reject(pedido.error);
                };
        });
    }


    /* =========================================================
       FUNÇÕES AUXILIARES
       ========================================================= */

    function gerarId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }


    function escaparTexto(texto) {

        return String(texto || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatarData(data) {

        if (!data) {
            return "";
        }

        try {

            return new Date(data).toLocaleDateString(
                "pt-AO"
            );

        } catch (erro) {

            return "";
        }
    }


    function formatarTempo(segundos) {

        segundos =
            Math.max(
                0,
                Number(segundos) || 0
            );

        const horas =
            Math.floor(
                segundos / 3600
            );

        const minutos =
            Math.floor(
                (segundos % 3600) / 60
            );

        const seg =
            Math.floor(
                segundos % 60
            );

        if (horas > 0) {

            return (
                horas +
                ":" +
                String(minutos)
                    .padStart(2, "0") +
                ":" +
                String(seg)
                    .padStart(2, "0")
            );
        }

        return (
            minutos +
            ":" +
            String(seg)
                .padStart(2, "0")
        );
    }


    function criarURL(blob) {

        if (!blob) {
            return "";
        }

        const url =
            URL.createObjectURL(blob);

        objectUrls.push(url);

        return url;
    }


    function limparURLs() {

        objectUrls.forEach(
            function (url) {

                try {
                    URL.revokeObjectURL(url);
                } catch (erro) {}
            }
        );

        objectUrls = [];
    }


    /* =========================================================
       MODAL DE PUBLICAÇÃO
       ========================================================= */

    function abrirPublicacao() {

        if (!modalPublicacao) {
            return;
        }

        modalPublicacao.style.display = "flex";
        modalPublicacao.classList.add("ativo");
    }


    function fecharPublicacao() {

        if (!modalPublicacao) {
            return;
        }

        modalPublicacao.style.display = "none";
        modalPublicacao.classList.remove("ativo");
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


    /* =========================================================
       TIPO DE CONTEÚDO
       ========================================================= */

    function atualizarTipoConteudo() {

        if (!tipoConteudo) {
            return;
        }

        const tipo =
            tipoConteudo.value;

        if (areaSerie) {

            if (tipo === "serie") {
                areaSerie.style.display = "block";
            } else {
                areaSerie.style.display = "none";
            }
        }

        if (areaVideo) {

            if (tipo === "filme") {
                areaVideo.style.display = "block";
            } else {
                areaVideo.style.display = "none";
            }
        }
    }


    if (tipoConteudo) {

        tipoConteudo.addEventListener(
            "change",
            atualizarTipoConteudo
        );
    }


    /* =========================================================
       TIPO DE ACESSO
       ========================================================= */

    function atualizarPreco() {

        if (!tipoAcesso || !areaPreco) {
            return;
        }

        if (
            tipoAcesso.value === "venda" ||
            tipoAcesso.value === "aluguel"
        ) {

            areaPreco.style.display = "block";

        } else {

            areaPreco.style.display = "none";
        }
    }


    if (tipoAcesso) {

        tipoAcesso.addEventListener(
            "change",
            atualizarPreco
        );
    }


    /* =========================================================
       CAPA MANUAL
       ========================================================= */

    if (arquivoCapa) {

        arquivoCapa.addEventListener(
            "change",
            function () {

                const arquivo =
                    arquivoCapa.files[0];

                if (!arquivo) {
                    return;
                }

                if (
                    !arquivo.type.startsWith(
                        "image/"
                    )
                ) {

                    alert(
                        "Escolha uma imagem válida."
                    );

                    arquivoCapa.value = "";
                    return;
                }

                const url =
                    URL.createObjectURL(
                        arquivo
                    );

                if (previewCapa) {

                    previewCapa.innerHTML =
                        '<img src="' +
                        url +
                        '" alt="Capa">';
                }
            }
        );
    }


    /* =========================================================
       GERAÇÃO AUTOMÁTICA DA CAPA
       ========================================================= */

    async function gerarCapaDoVideo(
        arquivo,
        porcentagem
    ) {

        return new Promise(
            function (resolve, reject) {

                const video =
                    document.createElement(
                        "video"
                    );

                video.preload = "metadata";
                video.muted = true;
                video.playsInline = true;

                const url =
                    URL.createObjectURL(
                        arquivo
                    );

                video.src = url;

                video.onloadedmetadata =
                    function () {

                        let tempo =
                            video.duration *
                            porcentagem;

                        if (
                            !isFinite(
                                tempo
                            )
                        ) {
                            tempo = 0;
                        }

                        video.currentTime =
                            tempo;
                    };

                video.onseeked =
                    function () {

                        try {

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                video.videoWidth ||
                                640;

                            canvas.height =
                                video.videoHeight ||
                                360;

                            const contexto =
                                canvas.getContext(
                                    "2d"
                                );

                            contexto.drawImage(
                                video,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );

                            canvas.toBlob(
                                function (blob) {

                                    URL.revokeObjectURL(
                                        url
                                    );

                                    if (!blob) {

                                        reject(
                                            new Error(
                                                "Não foi possível gerar a capa."
                                            )
                                        );

                                        return;
                                    }

                                    resolve(blob);
                                },
                                "image/jpeg",
                                0.88
                            );

                        } catch (erro) {

                            URL.revokeObjectURL(
                                url
                            );

                            reject(erro);
                        }
                    };

                video.onerror =
                    function () {

                        URL.revokeObjectURL(
                            url
                        );

                        reject(
                            new Error(
                                "Erro ao ler o vídeo."
                            )
                        );
                    };
            }
        );
    }


    async function gerarCapasAutomaticas(
        arquivo
    ) {

        if (!arquivo) {
            return [];
        }

        const porcentagens = [
            0.05,
            0.20,
            0.40,
            0.60,
            0.80
        ];

        const capas = [];

        for (
            let i = 0;
            i < porcentagens.length;
            i++
        ) {

            try {

                const blob =
                    await gerarCapaDoVideo(
                        arquivo,
                        porcentagens[i]
                    );

                capas.push({
                    blob: blob,
                    tempo: porcentagens[i]
                });

            } catch (erro) {

                console.warn(
                    "Erro ao gerar capa:",
                    erro
                );
            }
        }

        return capas;
    }


    function mostrarCapasAutomaticas(
        capas
    ) {

        if (!previewCapa || !capas.length) {
            return;
        }

        let html =
            '<div style="width:100%;">' +
            '<strong>🤖 Escolha uma capa automática</strong>' +
            '<div style="display:flex;gap:8px;overflow-x:auto;margin-top:10px;">';

        capas.forEach(
            function (capa, indice) {

                const url =
                    URL.createObjectURL(
                        capa.blob
                    );

                objectUrls.push(url);

                html +=
                    '<button type="button" ' +
                    'class="capa-automatica" ' +
                    'data-indice="' +
                    indice +
                    '" ' +
                    'style="padding:2px;border:2px solid transparent;background:none;cursor:pointer;">' +
                    '<img src="' +
                    url +
                    '" ' +
                    'style="width:95px;height:135px;object-fit:cover;border-radius:6px;" ' +
                    'alt="Capa ' +
                    (indice + 1) +
                    '">' +
                    '</button>';
            }
        );

        html +=
            "</div>" +
            "</div>";

        previewCapa.innerHTML = html;

        const botoes =
            previewCapa.querySelectorAll(
                ".capa-automatica"
            );

        botoes.forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    function () {

                        botoes.forEach(
                            function (b) {
                                b.style.border =
                                    "2px solid transparent";
                            }
                        );

                        botao.style.border =
                            "2px solid #00ff88";

                        const indice =
                            Number(
                                botao.dataset.indice
                            );

                        arquivoCapa._capaAutomatica =
                            capas[indice].blob;
                    }
                );
            }
        );

        if (botoes[0]) {
            botoes[0].click();
        }
    }


    if (arquivoVideo) {

        arquivoVideo.addEventListener(
            "change",
            async function () {

                const arquivo =
                    arquivoVideo.files[0];

                if (!arquivo) {
                    return;
                }

                if (
                    !arquivo.type.startsWith(
                        "video/"
                    )
                ) {

                    alert(
                        "Escolha um vídeo válido."
                    );

                    arquivoVideo.value = "";
                    return;
                }

                if (previewCapa) {

                    previewCapa.innerHTML =
                        "🤖 Gerando capas automaticamente...";
                }

                try {

                    const capas =
                        await gerarCapasAutomaticas(
                            arquivo
                        );

                    mostrarCapasAutomaticas(
                        capas
                    );

                } catch (erro) {

                    console.error(erro);

                    if (previewCapa) {
                        previewCapa.innerHTML =
                            "Não foi possível gerar a capa automática.";
                    }
                }
            }
        );
    }


    /* =========================================================
       TEMPORADAS E EPISÓDIOS
       ========================================================= */

    function criarCamposTemporadas() {

        if (
            !listaTemporadas ||
            !quantidadeTemporadas
        ) {
            return;
        }

        const quantidade =
            Number(
                quantidadeTemporadas.value
            );

        listaTemporadas.innerHTML = "";

        if (
            !quantidade ||
            quantidade < 1
        ) {
            return;
        }

        for (
            let temporada = 1;
            temporada <= quantidade;
            temporada++
        ) {

            const bloco =
                document.createElement(
                    "div"
                );

            bloco.className =
                "temporada-bloco";

            bloco.style.marginTop = "15px";
            bloco.style.padding = "12px";
            bloco.style.border =
                "1px solid rgba(255,255,255,.15)";
            bloco.style.borderRadius = "10px";

            bloco.innerHTML =
                "<h4>📺 Temporada " +
                temporada +
                "</h4>" +
                '<div class="episodios-temporada"></div>';

            const area =
                bloco.querySelector(
                    ".episodios-temporada"
                );

            let quantidadeEp =
                Number(
                    quantidadeEpisodios.value
                );

            if (
                !quantidadeEp ||
                quantidadeEp < 1
            ) {
                quantidadeEp = 1;
            }

            for (
                let episodio = 1;
                episodio <= quantidadeEp;
                episodio++
            ) {

                const grupo =
                    document.createElement(
                        "div"
                    );

                grupo.style.marginTop =
                    "10px";

                grupo.innerHTML =
                    "<label>🎞️ Episódio " +
                    episodio +
                    "</label>" +
                    '<input type="text" class="nome-episodio" ' +
                    'placeholder="Nome do episódio">' +
                    '<input type="file" class="arquivo-episodio" accept="video/*">';

                area.appendChild(
                    grupo
                );
            }

            listaTemporadas.appendChild(
                bloco
            );
        }
    }


    if (quantidadeTemporadas) {

        quantidadeTemporadas.addEventListener(
            "input",
            criarCamposTemporadas
        );
    }


    if (quantidadeEpisodios) {

        quantidadeEpisodios.addEventListener(
            "input",
            criarCamposTemporadas
        );
    }


    /* =========================================================
       PUBLICAR
       ========================================================= */

    if (salvarPublicacao) {

        salvarPublicacao.addEventListener(
            "click",
            async function () {

                try {

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
                            ? anoConteudo.value
                            : "";

                    const tipo =
                        tipoConteudo
                            ? tipoConteudo.value
                            : "filme";

                    const acesso =
                        tipoAcesso
                            ? tipoAcesso.value
                            : "gratis";

                    const preco =
                        precoConteudo
                            ? precoConteudo.value
                            : "";

                    const capaArquivo =
                        arquivoCapa &&
                        arquivoCapa.files[0]
                            ? arquivoCapa.files[0]
                            : null;

                    const videoArquivo =
                        arquivoVideo &&
                        arquivoVideo.files[0]
                            ? arquivoVideo.files[0]
                            : null;


                    /* VALIDAÇÕES */

                    if (!nome) {

                        alert(
                            "Digite o nome do conteúdo."
                        );

                        nomeConteudo.focus();
                        return;
                    }


                    if (!descricao) {

                        alert(
                            "Digite uma descrição."
                        );

                        descricaoConteudo.focus();
                        return;
                    }


                    if (!ano) {

                        alert(
                            "Digite o ano."
                        );

                        anoConteudo.focus();
                        return;
                    }


                    if (
                        tipo === "filme" &&
                        !videoArquivo
                    ) {

                        alert(
                            "Escolha o vídeo do filme."
                        );

                        return;
                    }


                    if (
                        !aceitarRegras ||
                        !aceitarRegras.checked
                    ) {

                        alert(
                            "Você precisa aceitar as regras do I.M.A Filmes."
                        );

                        return;
                    }


                    if (
                        (
                            acesso === "venda" ||
                            acesso === "aluguel"
                        ) &&
                        (
                            !preco ||
                            Number(preco) <= 0
                        )
                    ) {

                        alert(
                            "Digite um preço válido."
                        );

                        return;
                    }


                    /* CAPA */

                    let capaBlob = null;

                    if (
                        arquivoCapa &&
                        arquivoCapa.files[0]
                    ) {

                        capaBlob =
                            arquivoCapa.files[0];

                    } else if (
                        arquivoCapa &&
                        arquivoCapa._capaAutomatica
                    ) {

                        capaBlob =
                            arquivoCapa._capaAutomatica;

                    } else if (
                        tipo === "filme" &&
                        videoArquivo
                    ) {

                        try {

                            capaBlob =
                                await gerarCapaDoVideo(
                                    videoArquivo,
                                    0.20
                                );

                        } catch (erro) {

                            console.warn(
                                "Capa automática falhou."
                            );
                        }
                    }


                    if (!capaBlob) {

                        alert(
                            "Escolha uma capa ou selecione uma capa automática."
                        );

                        return;
                    }


                    /* FILME */

                    if (tipo === "filme") {

                        const conteudo = {

                            id: gerarId(),

                            tipo: "filme",

                            nome: nome,

                            descricao: descricao,

                            ano: Number(ano),

                            acesso: acesso,

                            preco:
                                Number(preco) || 0,

                            capa: capaBlob,

                            video: videoArquivo,

                            favorito: false,

                            visualizacoes: 0,

                            progresso: 0,

                            duracao: 0,

                            ultimoAcesso: null,

                            dataPublicacao:
                                Date.now()
                        };


                        await guardarConteudo(
                            conteudo
                        );


                        alert(
                            "🎉 Filme publicado com sucesso!"
                        );
                    }


                    /* SÉRIE */

                    else {

                        const temporadas = [];

                        const blocos =
                            listaTemporadas
                                ? listaTemporadas.querySelectorAll(
                                    ".temporada-bloco"
                                )
                                : [];


                        for (
                            let i = 0;
                            i < blocos.length;
                            i++
                        ) {

                            const numeroTemporada =
                                i + 1;

                            const arquivos =
                                blocos[i].querySelectorAll(
                                    ".arquivo-episodio"
                                );

                            const nomes =
                                blocos[i].querySelectorAll(
                                    ".nome-episodio"
                                );

                            const episodios = [];


                            for (
                                let j = 0;
                                j < arquivos.length;
                                j++
                            ) {

                                const arquivo =
                                    arquivos[j].files[0];

                                if (!arquivo) {
                                    continue;
                                }

                                episodios.push({

                                    numero:
                                        j + 1,

                                    nome:
                                        nomes[j]
                                            ? nomes[j].value.trim() ||
                                              "Episódio " +
                                              (j + 1)
                                            : "Episódio " +
                                              (j + 1),

                                    video:
                                        arquivo,

                                    progresso: 0,

                                    visualizacoes: 0,

                                    ultimoAcesso: null
                                });
                            }


                            temporadas.push({

                                numero:
                                    numeroTemporada,

                                episodios:
                                    episodios
                            });
                        }


                        if (
                            temporadas.length === 0
                        ) {

                            alert(
                                "Adicione pelo menos uma temporada com um episódio."
                            );

                            return;
                        }


                        const conteudo = {

                            id: gerarId(),

                            tipo: "serie",

                            nome: nome,

                            descricao: descricao,

                            ano: Number(ano),

                            acesso: acesso,

                            preco:
                                Number(preco) || 0,

                            capa: capaBlob,

                            temporadas:
                                temporadas,

                            favorito: false,

                            visualizacoes: 0,

                            progresso: 0,

                            ultimoAcesso: null,

                            dataPublicacao:
                                Date.now()
                        };


                        await guardarConteudo(
                            conteudo
                        );


                        alert(
                            "🎉 Série publicada com sucesso!"
                        );
                    }


                    limparFormulario();

                    fecharPublicacao();

                    await carregarConteudos();

                } catch (erro) {

                    console.error(
                        "Erro ao publicar:",
                        erro
                    );

                    alert(
                        "❌ Não foi possível publicar o conteúdo.\n\n" +
                        "Verifique o vídeo, a capa e tente novamente."
                    );
                }
            }
        );
    }


    /* =========================================================
       LIMPAR FORMULÁRIO
       ========================================================= */

    function limparFormulario() {

        if (nomeConteudo)
            nomeConteudo.value = "";

        if (descricaoConteudo)
            descricaoConteudo.value = "";

        if (anoConteudo)
            anoConteudo.value = "";

        if (arquivoCapa)
            arquivoCapa.value = "";

        if (arquivoVideo)
            arquivoVideo.value = "";

        if (precoConteudo)
            precoConteudo.value = "";

        if (aceitarRegras)
            aceitarRegras.checked = false;

        if (listaTemporadas)
            listaTemporadas.innerHTML = "";

        if (previewCapa)
            previewCapa.innerHTML =
                "Pré-visualização da capa";

        if (arquivoCapa)
            arquivoCapa._capaAutomatica = null;

        atualizarTipoConteudo();
        atualizarPreco();
    }


    /* =========================================================
       TEXTO DE ACESSO
       ========================================================= */

    function textoAcesso(conteudo) {

        if (conteudo.acesso === "venda") {

            return (
                "💰 Venda • " +
                conteudo.preco +
                " Kz"
            );
        }

        if (conteudo.acesso === "aluguel") {

            return (
                "🎟️ Aluguel • " +
                conteudo.preco +
                " Kz"
            );
        }

        return "🆓 Gratuito";
    }


    /* =========================================================
       FILTROS
       ========================================================= */

    function correspondeAoFiltro(
        conteudo
    ) {

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


    /* =========================================================
       CARREGAR BIBLIOTECA
       ========================================================= */

    async function carregarConteudos() {

        if (!listaFilmes) {
            return;
        }

        limparURLs();

        const conteudos =
            await obterConteudos();


        conteudos.sort(
            function (a, b) {

                return (
                    (b.dataPublicacao || 0) -
                    (a.dataPublicacao || 0)
                );
            }
        );


        listaFilmes.innerHTML = "";


        const pesquisa =
            campoPesquisa
                ? campoPesquisa.value
                    .toLowerCase()
                    .trim()
                : "";


        const filtrados =
            conteudos.filter(
                function (conteudo) {

                    if (
                        !correspondeAoFiltro(
                            conteudo
                        )
                    ) {
                        return false;
                    }


                    if (!pesquisa) {
                        return true;
                    }


                    const texto =
                        (
                            conteudo.nome +
                            " " +
                            conteudo.descricao +
                            " " +
                            conteudo.ano
                        )
                            .toLowerCase();


                    return texto.includes(
                        pesquisa
                    );
                }
            );


        if (filtrados.length === 0) {

            listaFilmes.innerHTML =
                '<div style="width:100%;padding:40px;text-align:center;">' +
                "<h2>📭 Nenhum conteúdo encontrado</h2>" +
                "<p>Publique um filme ou série para começar sua biblioteca.</p>" +
                "</div>";

            return;
        }


        filtrados.forEach(
            function (conteudo) {

                const card =
                    criarCard(conteudo);

                listaFilmes.appendChild(
                    card
                );
            }
        );
    }


    /* =========================================================
       CRIAR CARD
       ========================================================= */

    function criarCard(conteudo) {

        const card =
            document.createElement(
                "article"
            );

        card.className = "card";

        const capaURL =
            criarURL(
                conteudo.capa
            );


        const tipoTexto =
            conteudo.tipo === "serie"
                ? "📺 Série"
                : "🎬 Filme";


        let progressoHTML = "";


        if (
            conteudo.progresso &&
            conteudo.progresso > 0
        ) {

            progressoHTML =
                '<div style="margin-top:8px;font-size:12px;">' +
                "▶️ " +
                Math.round(
                    conteudo.progresso
                ) +
                "% assistido" +
                "</div>";
        }


        card.innerHTML =

            '<div class="capa" style="position:relative;">' +

            (
                capaURL
                    ? '<img src="' +
                      capaURL +
                      '" alt="' +
                      escaparTexto(
                          conteudo.nome
                      ) +
                      '" style="width:100%;height:100%;object-fit:cover;">'
                    : '<div style="font-size:50px;text-align:center;padding:30px;">🎬</div>'
            ) +

            (
                conteudo.favorito
                    ? '<span style="position:absolute;top:8px;right:8px;font-size:22px;">❤️</span>'
                    : ""
            ) +

            "</div>" +

            "<h3>" +
            escaparTexto(
                conteudo.nome
            ) +
            "</h3>" +

            "<p>" +
            tipoTexto +
            " • " +
            escaparTexto(
                conteudo.ano
            ) +
            "</p>" +

            "<p style=\"font-size:12px;opacity:.8;\">" +
            textoAcesso(
                conteudo
            ) +
            "</p>" +

            (
                conteudo.visualizacoes
                    ? '<p style="font-size:12px;">👁️ ' +
                      conteudo.visualizacoes +
                      " visualizações</p>"
                    : ""
            ) +

            progressoHTML +

            '<div class="botoes">' +

            '<button class="botao-play" title="Assistir">▶️</button>' +

            '<button class="botao-favorito" title="Favorito">' +
            (
                conteudo.favorito
                    ? "❤️"
                    : "🤍"
            ) +
            "</button>" +

            '<button class="botao-share" title="Partilhar">🔗</button>' +

            '<button class="botao-download" title="Baixar">⬇️</button>' +

            '<button class="botao-apagar" title="Apagar">🗑️</button>' +

            "</div>";


        /* PLAY */

        const botaoPlay =
            card.querySelector(
                ".botao-play"
            );

        if (botaoPlay) {

            botaoPlay.addEventListener(
                "click",
                function () {

                    if (
                        conteudo.tipo ===
                        "filme"
                    ) {

                        reproduzirFilme(
                            conteudo
                        );

                    } else {

                        escolherEpisodio(
                            conteudo
                        );
                    }
                }
            );
        }


        /* FAVORITO */

        const botaoFavorito =
            card.querySelector(
                ".botao-favorito"
            );

        if (botaoFavorito) {

            botaoFavorito.addEventListener(
                "click",
                async function () {

                    conteudo.favorito =
                        !conteudo.favorito;

                    await atualizarConteudo(
                        conteudo
                    );

                    await carregarConteudos();
                }
            );
        }


        /* DOWNLOAD */

        const botaoDownload =
            card.querySelector(
                ".botao-download"
            );

        if (botaoDownload) {

            botaoDownload.addEventListener(
                "click",
                function () {

                    if (
                        conteudo.tipo ===
                        "filme"
                    ) {

                        baixarVideo(
                            conteudo.video,
                            conteudo.nome
                        );

                    } else {

                        alert(
                            "Para baixar uma série, escolha primeiro o episódio."
                        );
                    }
                }
            );
        }


        /* PARTILHAR */

        const botaoShare =
            card.querySelector(
                ".botao-share"
            );

        if (botaoShare) {

            botaoShare.addEventListener(
                "click",
                function () {

                    partilhar(
                        conteudo
                    );
                }
            );
        }


        /* APAGAR */

        const botaoApagar =
            card.querySelector(
                ".botao-apagar"
            );

        if (botaoApagar) {

            botaoApagar.addEventListener(
                "click",
                async function () {

                    const confirmar =
                        confirm(
                            "⚠️ Tem certeza que deseja apagar \"" +
                            conteudo.nome +
                            "\"?"
                        );

                    if (!confirmar) {
                        return;
                    }

                    await apagarConteudo(
                        conteudo.id
                    );

                    alert(
                        "🗑️ Conteúdo apagado."
                    );

                    await carregarConteudos();
                }
            );
        }


        return card;
    }


    /* =========================================================
       ESCOLHER EPISÓDIO
       ========================================================= */

    function escolherEpisodio(
        serie
    ) {

        if (
            !serie.temporadas ||
            !serie.temporadas.length
        ) {

            alert(
                "Esta série não possui episódios."
            );

            return;
        }


        let mensagem =
            "📺 " +
            serie.nome +
            "\n\n";


        serie.temporadas.forEach(
            function (temporada) {

                mensagem +=
                    "Temporada " +
                    temporada.numero +
                    ":\n";

                temporada.episodios.forEach(
                    function (episodio) {

                        mensagem +=
                            episodio.numero +
                            " - " +
                            episodio.nome +
                            "\n";
                    }
                );

                mensagem += "\n";
            }
        );


        const escolha =
            prompt(
                mensagem +
                "\nDigite o número do episódio:"
            );


        if (!escolha) {
            return;
        }


        const numero =
            Number(escolha);


        for (
            let i = 0;
            i < serie.temporadas.length;
            i++
        ) {

            const temporada =
                serie.temporadas[i];


            for (
                let j = 0;
                j < temporada.episodios.length;
                j++
            ) {

                const episodio =
                    temporada.episodios[j];


                if (
                    episodio.numero ===
                    numero
                ) {

                    reproduzirEpisodio(
                        serie,
                        temporada,
                        episodio
                    );

                    return;
                }
            }
        }


        alert(
            "Episódio não encontrado."
        );
    }


    /* =========================================================
       REPRODUZIR FILME
       ========================================================= */

    async function reproduzirFilme(
        conteudo
    ) {

        if (!conteudo.video) {

            alert(
                "Este filme não possui vídeo."
            );

            return;
        }


        videoAtual = {
            conteudo: conteudo,
            episodio: null,
            temporada: null
        };


        const url =
            criarURL(
                conteudo.video
            );


        videoPlayer.src = url;

        tituloPlayer.textContent =
            conteudo.nome;

        descricaoPlayer.textContent =
            conteudo.descricao;


        modalPlayer.style.display =
            "flex";

        modalPlayer.classList.add(
            "ativo"
        );


        videoPlayer.onloadedmetadata =
            async function () {

                if (
                    conteudo.progresso &&
                    conteudo.progresso > 0 &&
                    conteudo.progresso < 99
                ) {

                    videoPlayer.currentTime =
                        videoPlayer.duration *
                        (
                            conteudo.progresso /
                            100
                        );
                }

                conteudo.duracao =
                    videoPlayer.duration;

                await atualizarConteudo(
                    conteudo
                );
            };


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


    /* =========================================================
       REPRODUZIR EPISÓDIO
       ========================================================= */

    async function reproduzirEpisodio(
        serie,
        temporada,
        episodio
    ) {

        if (!episodio.video) {

            alert(
                "Este episódio não possui vídeo."
            );

            return;
        }


        videoAtual = {
            conteudo: serie,
            episodio: episodio,
            temporada: temporada
        };


        const url =
            criarURL(
                episodio.video
            );


        videoPlayer.src = url;


        tituloPlayer.textContent =
            serie.nome +
            " — T" +
            temporada.numero +
            " E" +
            episodio.numero;


        descricaoPlayer.textContent =
            episodio.nome;


        modalPlayer.style.display =
            "flex";

        modalPlayer.classList.add(
            "ativo"
        );


        videoPlayer.onloadedmetadata =
            function () {

                if (
                    episodio.progresso &&
                    episodio.progresso > 0 &&
                    episodio.progresso < 99
                ) {

                    videoPlayer.currentTime =
                        videoPlayer.duration *
                        (
                            episodio.progresso /
                            100
                        );
                }
            };


        episodio.visualizacoes =
            Number(
                episodio.visualizacoes || 0
            ) + 1;


        episodio.ultimoAcesso =
            Date.now();


        await atualizarConteudo(
            serie
        );
    }


    /* =========================================================
       GUARDAR PROGRESSO DO VÍDEO
       ========================================================= */

    if (videoPlayer) {

        videoPlayer.addEventListener(
            "timeupdate",
            async function () {

                if (!videoAtual) {
                    return;
                }

                if (
                    !videoPlayer.duration ||
                    !isFinite(
                        videoPlayer.duration
                    )
                ) {
                    return;
                }


                const progresso =
                    (
                        videoPlayer.currentTime /
                        videoPlayer.duration
                    ) * 100;


                if (
                    videoAtual.episodio
                ) {

                    videoAtual.episodio.progresso =
                        progresso;

                } else {

                    videoAtual.conteudo.progresso =
                        progresso;
                }


                /* Guarda somente aproximadamente a cada 5% */

                const arredondado =
                    Math.floor(
                        progresso / 5
                    ) * 5;


                if (
                    arredondado %
                    5 === 0
                ) {

                    try {

                        await atualizarConteudo(
                            videoAtual.conteudo
                        );

                    } catch (erro) {
                        console.warn(erro);
                    }
                }
            }
        );


        videoPlayer.addEventListener(
            "ended",
            async function () {

                if (!videoAtual) {
                    return;
                }


                if (
                    videoAtual.episodio
                ) {

                    videoAtual.episodio.progresso =
                        100;

                } else {

                    videoAtual.conteudo.progresso =
                        100;
                }


                await atualizarConteudo(
                    videoAtual.conteudo
                );

                await carregarConteudos();
            }
        );
    }


    /* =========================================================
       FECHAR PLAYER
       ========================================================= */

    function fecharVideo() {

        if (videoPlayer) {

            videoPlayer.pause();
            videoPlayer.src = "";
        }


        if (modalPlayer) {

            modalPlayer.style.display =
                "none";

            modalPlayer.classList.remove(
                "ativo"
            );
        }


        videoAtual = null;
    }


    if (fecharPlayer) {

        fecharPlayer.addEventListener(
            "click",
            fecharVideo
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

                    fecharVideo();
                }
            }
        );
    }


    /* =========================================================
       DOWNLOAD
       ========================================================= */

    function baixarVideo(
        blob,
        nome
    ) {

        if (!blob) {

            alert(
                "Este conteúdo não possui vídeo."
            );

            return;
        }


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;

        link.download =
            nome +
            ".mp4";


        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );


        setTimeout(
            function () {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );
    }


    /* =========================================================
       PARTILHAR
       ========================================================= */

    function partilhar(
        conteudo
    ) {

        const texto =
            "🎬 " +
            conteudo.nome +
            "\n\n" +
            conteudo.descricao +
            "\n\n" +
            "📺 I.M.A FILMES";


        if (
            navigator.share
        ) {

            navigator.share({

                title:
                    conteudo.nome,

                text:
                    texto
            }).catch(
                function () {}
            );

            return;
        }


        if (
            navigator.clipboard
        ) {

            navigator.clipboard
                .writeText(texto)
                .then(
                    function () {

                        alert(
                            "🔗 Informação copiada!"
                        );
                    }
                );

            return;
        }


        alert(
            texto
        );
    }


    /* =========================================================
       PESQUISA
       ========================================================= */

    if (campoPesquisa) {

        campoPesquisa.addEventListener(
            "input",
            function () {

                carregarConteudos();
            }
        );
    }


    /* =========================================================
       MENU LATERAL
       ========================================================= */

    function configurarMenu() {

        const botoes =
            document.querySelectorAll(
                ".menu > button"
            );


        botoes.forEach(
            function (botao) {

                botao.addEventListener(
                    "click",
                    async function () {

                        const texto =
                            botao.textContent
                                .toLowerCase();


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

                            return;
                        }


                        botoes.forEach(
                            function (b) {

                                b.classList.remove(
                                    "menu-ativo"
                                );
                            }
                        );


                        botao.classList.add(
                            "menu-ativo"
                        );


                        await carregarConteudos();
                    }
                );
            }
        );
    }


    /* =========================================================
       FECHAR COM ESC
       ========================================================= */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key ===
                "Escape"
            ) {

                fecharPublicacao();
                fecharVideo();
            }
        }
    );


    /* =========================================================
       CLIQUE FORA DO MODAL
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
       INICIALIZAÇÃO
       ========================================================= */

    async function iniciarAplicacao() {

        try {

            await abrirBanco();

            atualizarTipoConteudo();

            atualizarPreco();

            configurarMenu();

            await carregarConteudos();

            console.log(
                "✅ I.M.A FILMES carregado corretamente."
            );

        } catch (erro) {

            console.error(
                "Erro ao iniciar I.M.A FILMES:",
                erro
            );

            alert(
                "❌ Erro ao iniciar o armazenamento do I.M.A FILMES."
            );
        }
    }


    iniciarAplicacao();

});

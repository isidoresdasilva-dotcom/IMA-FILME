document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    console.log("I.M.A FILMES iniciado");

    /* =========================================================
       CONFIGURAÇÃO
    ========================================================= */

    const DB_NAME = "IMA_FILMES_DB";
    const DB_VERSION = 1;
    const STORE_NAME = "conteudos";

    let db = null;
    let capaAutomatica = "";
    let capasAutomaticas = [];
    let videoAtualParaCapa = null;

    /* =========================================================
       ELEMENTOS DO HTML
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
       BANCO DE DADOS INDEXEDDB
    ========================================================= */

    function abrirBanco() {
        return new Promise(function (resolve, reject) {

            const pedido =
                indexedDB.open(DB_NAME, DB_VERSION);

            pedido.onupgradeneeded = function (evento) {

                const banco = evento.target.result;

                if (!banco.objectStoreNames.contains(STORE_NAME)) {

                    const store =
                        banco.createObjectStore(
                            STORE_NAME,
                            {
                                keyPath: "id"
                            }
                        );

                    store.createIndex(
                        "nome",
                        "nome",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "tipo",
                        "tipo",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "data",
                        "data",
                        {
                            unique: false
                        }
                    );
                }
            };

            pedido.onsuccess = function (evento) {

                db = evento.target.result;

                console.log(
                    "Banco de dados I.M.A FILMES aberto."
                );

                resolve(db);
            };

            pedido.onerror = function () {

                console.error(
                    "Erro ao abrir banco:",
                    pedido.error
                );

                reject(pedido.error);
            };
        });
    }


    /* =========================================================
       SALVAR CONTEÚDO
    ========================================================= */

    function salvarConteudoBanco(conteudo) {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    [STORE_NAME],
                    "readwrite"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.put(conteudo);

            pedido.onsuccess = function () {
                resolve(conteudo);
            };

            pedido.onerror = function () {
                reject(pedido.error);
            };
        });
    }


    /* =========================================================
       PEGAR TODOS OS CONTEÚDOS
    ========================================================= */

    function obterTodosConteudos() {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    [STORE_NAME],
                    "readonly"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.getAll();

            pedido.onsuccess = function () {

                resolve(
                    pedido.result || []
                );
            };

            pedido.onerror = function () {

                reject(pedido.error);
            };
        });
    }


    /* =========================================================
       PEGAR UM CONTEÚDO PELO ID
    ========================================================= */

    function obterConteudo(id) {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    [STORE_NAME],
                    "readonly"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.get(id);

            pedido.onsuccess = function () {

                resolve(pedido.result);
            };

            pedido.onerror = function () {

                reject(pedido.error);
            };
        });
    }


    /* =========================================================
       ATUALIZAR CONTEÚDO
    ========================================================= */

    function atualizarConteudo(conteudo) {

        return salvarConteudoBanco(conteudo);
    }


    /* =========================================================
       APAGAR CONTEÚDO
    ========================================================= */

    function apagarConteudo(id) {

        return new Promise(function (resolve, reject) {

            const transacao =
                db.transaction(
                    [STORE_NAME],
                    "readwrite"
                );

            const store =
                transacao.objectStore(STORE_NAME);

            const pedido =
                store.delete(id);

            pedido.onsuccess = function () {

                resolve(true);
            };

            pedido.onerror = function () {

                reject(pedido.error);
            };
        });
    }


    /* =========================================================
       GERAR ID
    ========================================================= */

    function gerarId() {

        return (
            Date.now().toString(36) +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 12)
        );
    }


    /* =========================================================
       ESCAPAR HTML
    ========================================================= */

    function escaparHTML(texto) {

        if (texto === null ||
            texto === undefined) {

            return "";
        }

        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =========================================================
       FORMATA TAMANHO DO ARQUIVO
    ========================================================= */

    function formatarTamanho(bytes) {

        if (!bytes) {
            return "0 KB";
        }

        const mb =
            bytes / (1024 * 1024);

        if (mb < 1) {

            return (
                Math.round(
                    bytes / 1024
                ) +
                " KB"
            );
        }

        return (
            mb.toFixed(1) +
            " MB"
        );
    }


    /* =========================================================
       ABRIR MODAL
    ========================================================= */

    function abrirModalPublicacao() {

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


    /* =========================================================
       FECHAR MODAL
    ========================================================= */

    function fecharModalPublicacao() {

        if (!modalPublicacao) {
            return;
        }

        modalPublicacao.classList.remove("ativo");

        modalPublicacao.style.display = "none";
    }


    /* =========================================================
       BOTÕES PUBLICAR
    ========================================================= */

    if (botaoEnviar) {

        botaoEnviar.addEventListener(
            "click",
            abrirModalPublicacao
        );
    }

    if (botaoEnviarMenu) {

        botaoEnviarMenu.addEventListener(
            "click",
            abrirModalPublicacao
        );
    }

    if (fecharModal) {

        fecharModal.addEventListener(
            "click",
            fecharModalPublicacao
        );
    }

    if (cancelarPublicacao) {

        cancelarPublicacao.addEventListener(
            "click",
            function () {

                fecharModalPublicacao();
            }
        );
    }


    /* =========================================================
       TIPO DE CONTEÚDO
    ========================================================= */

    function atualizarTipoConteudo() {

        if (!tipoConteudo) {
            return;
        }

        if (tipoConteudo.value === "serie") {

            if (areaSerie) {
                areaSerie.style.display = "block";
            }

            if (areaVideo) {
                areaVideo.style.display = "none";
            }

        } else {

            if (areaSerie) {
                areaSerie.style.display = "none";
            }

            if (areaVideo) {
                areaVideo.style.display = "block";
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

        if (!tipoAcesso) {
            return;
        }

        if (
            tipoAcesso.value === "venda" ||
            tipoAcesso.value === "aluguel"
        ) {

            if (areaPreco) {
                areaPreco.style.display = "block";
            }

        } else {

            if (areaPreco) {
                areaPreco.style.display = "none";
            }
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

                if (!arquivo.type.startsWith("image/")) {

                    alert(
                        "Escolha uma imagem válida."
                    );

                    arquivoCapa.value = "";

                    return;
                }

                const leitor =
                    new FileReader();

                leitor.onload =
                    function (evento) {

                        capaAutomatica =
                            evento.target.result;

                        if (previewCapa) {

                            previewCapa.innerHTML =
                                '<img src="' +
                                capaAutomatica +
                                '" alt="Capa">';
                        }

                        const area =
                            document.getElementById(
                                "areaCapasAutomaticas"
                            );

                        if (area) {
                            area.remove();
                        }
                    };

                leitor.readAsDataURL(arquivo);
            }
        );
    }


    /* =========================================================
       CRIAR ELEMENTO DE CAPAS AUTOMÁTICAS
    ========================================================= */

    function criarAreaCapasAutomaticas() {

        const antiga =
            document.getElementById(
                "areaCapasAutomaticas"
            );

        if (antiga) {
            antiga.remove();
        }

        if (!previewCapa) {
            return;
        }

        const area =
            document.createElement("div");

        area.id =
            "areaCapasAutomaticas";

        area.style.marginTop = "15px";

        area.innerHTML =
            '<div style="' +
            'padding:12px;' +
            'border-radius:12px;' +
            'background:#f4f4f4;' +
            'margin-bottom:10px;' +
            '">' +

            '<strong>' +
            '🤖 Escolha a melhor capa' +
            '</strong>' +

            '<div id="listaCapasAutomaticas" ' +
            'style="' +
            'display:grid;' +
            'grid-template-columns:' +
            'repeat(5,1fr);' +
            'gap:8px;' +
            'margin-top:10px;' +
            '"></div>' +

            '<div style="' +
            'margin-top:12px;' +
            '">' +

            '<input ' +
            'type="range" ' +
            'id="controleMomentoCapa" ' +
            'min="0" ' +
            'max="100" ' +
            'value="50" ' +
            'style="width:100%;"' +
            '>' +

            '<button ' +
            'type="button" ' +
            'id="botaoNovaCapa" ' +
            'style="margin-top:8px;"' +
            '>' +
            '🔄 Gerar outra capa' +
            '</button>' +

            '</div>' +

            '</div>';

        previewCapa.parentNode.insertBefore(
            area,
            previewCapa.nextSibling
        );

        const botaoNovaCapa =
            document.getElementById(
                "botaoNovaCapa"
            );

        const controleMomento =
            document.getElementById(
                "controleMomentoCapa"
            );

        if (botaoNovaCapa) {

            botaoNovaCapa.addEventListener(
                "click",
                function () {

                    if (!videoAtualParaCapa) {

                        alert(
                            "Primeiro selecione um vídeo."
                        );

                        return;
                    }

                    const porcentagem =
                        Number(
                            controleMomento
                                ? controleMomento.value
                                : 50
                        );

                    gerarCapaNoMomento(
                        videoAtualParaCapa,
                        porcentagem
                    );
                }
            );
        }
    }


    /* =========================================================
       GERAR CAPA DE UM MOMENTO
    ========================================================= */

    function gerarCapaNoMomento(
        arquivo,
        porcentagem
    ) {

        const video =
            document.createElement("video");

        video.preload = "metadata";

        video.muted = true;

        video.playsInline = true;

        const url =
            URL.createObjectURL(arquivo);

        video.src = url;

        video.addEventListener(
            "loadedmetadata",
            function () {

                let tempo =
                    video.duration *
                    (porcentagem / 100);

                if (!isFinite(tempo)) {
                    tempo = 0;
                }

                if (tempo < 0) {
                    tempo = 0;
                }

                if (
                    isFinite(video.duration) &&
                    video.duration > 0
                ) {

                    tempo =
                        Math.min(
                            tempo,
                            video.duration - 0.1
                        );
                }

                video.currentTime = tempo;
            }
        );

        video.addEventListener(
            "seeked",
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
                        canvas.getContext("2d");

                    contexto.drawImage(
                        video,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    const imagem =
                        canvas.toDataURL(
                            "image/jpeg",
                            0.82
                        );

                    capaAutomatica = imagem;

                    if (previewCapa) {

                        previewCapa.innerHTML =
                            '<img src="' +
                            imagem +
                            '" alt="Capa automática">';
                    }

                    URL.revokeObjectURL(url);

                } catch (erro) {

                    console.error(
                        "Erro ao gerar capa:",
                        erro
                    );

                    URL.revokeObjectURL(url);
                }
            }
        );

        video.addEventListener(
            "error",
            function () {

                URL.revokeObjectURL(url);

                console.error(
                    "Não foi possível carregar o vídeo."
                );
            }
        );
    }


    /* =========================================================
       GERAR 5 CAPAS
    ========================================================= */

    function gerarCincoCapas(arquivo) {

        if (!arquivo) {
            return;
        }

        videoAtualParaCapa = arquivo;

        criarAreaCapasAutomaticas();

        capasAutomaticas = [];

        const video =
            document.createElement("video");

        video.preload = "metadata";

        video.muted = true;

        video.playsInline = true;

        const url =
            URL.createObjectURL(arquivo);

        video.src = url;

        video.addEventListener(
            "loadedmetadata",
            function () {

                const duracao =
                    video.duration;

                if (
                    !isFinite(duracao) ||
                    duracao <= 0
                ) {

                    URL.revokeObjectURL(url);

                    return;
                }

                const percentuais = [
                    5,
                    20,
                    40,
                    60,
                    80
                ];

                let indice = 0;

                function gerarProxima() {

                    if (
                        indice >=
                        percentuais.length
                    ) {

                        URL.revokeObjectURL(url);

                        mostrarCapasAutomaticas();

                        return;
                    }

                    const porcentagem =
                        percentuais[indice];

                    const tempo =
                        duracao *
                        porcentagem /
                        100;

                    video.currentTime =
                        Math.min(
                            tempo,
                            duracao - 0.1
                        );
                }

                video.addEventListener(
                    "seeked",
                    function processar() {

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

                            const imagem =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.82
                                );

                            capasAutomaticas.push(
                                imagem
                            );

                            indice++;

                            gerarProxima();

                        } catch (erro) {

                            console.error(
                                "Erro na capa:",
                                erro
                            );

                            indice++;

                            gerarProxima();
                        }
                    }
                );

                gerarProxima();
            }
        );
    }


    /* =========================================================
       MOSTRAR CAPAS
    ========================================================= */

    function mostrarCapasAutomaticas() {

        const lista =
            document.getElementById(
                "listaCapasAutomaticas"
            );

        if (!lista) {
            return;
        }

        lista.innerHTML = "";

        capasAutomaticas.forEach(
            function (imagem, indice) {

                const item =
                    document.createElement("button");

                item.type = "button";

                item.style.padding = "3px";

                item.style.border =
                    indice === 0
                        ? "3px solid #00aaff"
                        : "2px solid transparent";

                item.style.background =
                    "white";

                item.style.borderRadius =
                    "8px";

                item.style.cursor =
                    "pointer";

                item.innerHTML =
                    '<img src="' +
                    imagem +
                    '" style="' +
                    'width:100%;' +
                    'height:100px;' +
                    'object-fit:cover;' +
                    'border-radius:6px;' +
                    'display:block;' +
                    '">';

                item.addEventListener(
                    "click",
                    function () {

                        document
                            .querySelectorAll(
                                "#listaCapasAutomaticas button"
                            )
                            .forEach(
                                function (botao) {

                                    botao.style.border =
                                        "2px solid transparent";
                                }
                            );

                        item.style.border =
                            "3px solid #00aaff";

                        capaAutomatica =
                            imagem;

                        if (previewCapa) {

                            previewCapa.innerHTML =
                                '<img src="' +
                                imagem +
                                '" alt="Capa selecionada">';
                        }
                    }
                );

                lista.appendChild(item);
            }
        );

        if (
            capasAutomaticas.length > 0 &&
            !capaAutomatica
        ) {

            capaAutomatica =
                capasAutomaticas[0];

            if (previewCapa) {

                previewCapa.innerHTML =
                    '<img src="' +
                    capaAutomatica +
                    '" alt="Capa automática">';
            }
        }
    }


    /* =========================================================
       VÍDEO SELECIONADO
    ========================================================= */

    if (arquivoVideo) {

        arquivoVideo.addEventListener(
            "change",
            function () {

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
                        "Selecione um arquivo de vídeo válido."
                    );

                    arquivoVideo.value = "";

                    return;
                }

                console.log(
                    "Vídeo selecionado:",
                    arquivo.name,
                    formatarTamanho(
                        arquivo.size
                    )
                );

                capaAutomatica = "";

                gerarCincoCapas(arquivo);
            }
        );
    }


    /* =========================================================
       SÉRIES - GERAR TEMPORADAS
    ========================================================= */

    function gerarTemporadas() {

        if (!listaTemporadas) {
            return;
        }

        listaTemporadas.innerHTML = "";

        const temporadas =
            Number(
                quantidadeTemporadas
                    ? quantidadeTemporadas.value
                    : 0
            );

        const episodios =
            Number(
                quantidadeEpisodios
                    ? quantidadeEpisodios.value
                    : 0
            );

        if (
            temporadas < 1 ||
            episodios < 1
        ) {

            return;
        }

        for (
            let t = 1;
            t <= temporadas;
            t++
        ) {

            const bloco =
                document.createElement(
                    "div"
                );

            bloco.className =
                "temporada-bloco";

            bloco.style.marginBottom =
                "20px";

            bloco.style.padding =
                "15px";

            bloco.style.borderRadius =
                "12px";

            bloco.style.background =
                "#f5f5f5";

            let html =
                "<h4>📺 Temporada " +
                t +
                "</h4>";

            for (
                let e = 1;
                e <= episodios;
                e++
            ) {

                html +=
                    '<div style="' +
                    'margin-bottom:10px;' +
                    '">' +

                    "<label>" +
                    "Episódio " +
                    e +
                    "</label>" +

                    '<input ' +
                    'type="text" ' +
                    'class="titulo-episodio" ' +
                    'data-temporada="' +
                    t +
                    '" ' +
                    'data-episodio="' +
                    e +
                    '" ' +
                    'placeholder="Título do episódio">' +

                    '<input ' +
                    'type="file" ' +
                    'class="arquivo-episodio" ' +
                    'data-temporada="' +
                    t +
                    '" ' +
                    'data-episodio="' +
                    e +
                    '" ' +
                    'accept="video/*">' +

                    "</div>";
            }

            bloco.innerHTML =
                html;

            listaTemporadas.appendChild(
                bloco
            );
        }
    }

    if (quantidadeTemporadas) {

        quantidadeTemporadas.addEventListener(
            "input",
            gerarTemporadas
        );
    }

    if (quantidadeEpisodios) {

        quantidadeEpisodios.addEventListener(
            "input",
            gerarTemporadas
        );
    }


    /* =========================================================
       CAPA AUTOMÁTICA DA SÉRIE
    ========================================================= */

    if (listaTemporadas) {

        listaTemporadas.addEventListener(
            "change",
            function (evento) {

                const elemento =
                    evento.target;

                if (
                    elemento.classList.contains(
                        "arquivo-episodio"
                    )
                ) {

                    const arquivo =
                        elemento.files[0];

                    if (!arquivo) {
                        return;
                    }

                    if (
                        !arquivo.type.startsWith(
                            "video/"
                        )
                    ) {

                        alert(
                            "Selecione um vídeo válido."
                        );

                        elemento.value = "";

                        return;
                    }

                    if (!capaAutomatica) {

                        gerarCincoCapas(
                            arquivo
                        );
                    }
                }
            }
        );
    }


    /* =========================================================
       COLETAR EPISÓDIOS DA SÉRIE
    ========================================================= */

    function coletarEpisodios() {

        const episodios = [];

        if (!listaTemporadas) {
            return episodios;
        }

        const arquivos =
            listaTemporadas.querySelectorAll(
                ".arquivo-episodio"
            );

        arquivos.forEach(
            function (input) {

                const arquivo =
                    input.files[0];

                if (!arquivo) {
                    return;
                }

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

                episodios.push({

                    id: gerarId(),

                    temporada:
                        temporada,

                    episodio:
                        episodio,

                    titulo:
                        titulo ||
                        "Episódio " +
                        episodio,

                    nomeArquivo:
                        arquivo.name,

                    video:
                        arquivo,

                    tamanho:
                        arquivo.size,

                    tipo:
                        arquivo.type
                });
            }
        );

        return episodios;
    }


    /* =========================================================
       VALIDAR FORMULÁRIO
    ========================================================= */

    function validarFormulario() {

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

        if (!nome) {

            alert(
                "Digite o nome do filme ou série."
            );

            if (nomeConteudo) {
                nomeConteudo.focus();
            }

            return false;
        }

        if (!ano) {

            alert(
                "Digite o ano do conteúdo."
            );

            if (anoConteudo) {
                anoConteudo.focus();
            }

            return false;
        }

        if (
            Number(ano) < 1900 ||
            Number(ano) > 2100
        ) {

            alert(
                "Digite um ano válido."
            );

            return false;
        }

        if (!descricao) {

            alert(
                "Digite uma descrição."
            );

            if (descricaoConteudo) {
                descricaoConteudo.focus();
            }

            return false;
        }

        if (!capaAutomatica) {

            alert(
                "Escolha uma capa ou selecione um vídeo para gerar uma capa automaticamente."
            );

            return false;
        }

        if (
            tipoConteudo &&
            tipoConteudo.value === "filme"
        ) {

            if (
                !arquivoVideo ||
                !arquivoVideo.files[0]
            ) {

                alert(
                    "Selecione o vídeo do filme."
                );

                return false;
            }
        }

        if (
            tipoConteudo &&
            tipoConteudo.value === "serie"
        ) {

            const episodios =
                coletarEpisodios();

            if (
                episodios.length === 0
            ) {

                alert(
                    "Adicione pelo menos um episódio da série."
                );

                return false;
            }
        }

        if (
            tipoAcesso &&
            (
                tipoAcesso.value === "venda" ||
                tipoAcesso.value === "aluguel"
            )
        ) {

            const preco =
                Number(
                    precoConteudo
                        ? precoConteudo.value
                        : 0
                );

            if (
                !preco ||
                preco <= 0
            ) {

                alert(
                    "Digite um preço válido."
                );

                return false;
            }
        }

        if (
            !aceitarRegras ||
            !aceitarRegras.checked
        ) {

            alert(
                "Você precisa aceitar as regras da plataforma."
            );

            return false;
        }

        return true;
    }


    /* =========================================================
       PUBLICAR
    ========================================================= */

    if (salvarPublicacao) {

        salvarPublicacao.addEventListener(
            "click",
            async function () {

                if (
                    salvarPublicacao.dataset.salvando ===
                    "true"
                ) {
                    return;
                }

                if (!validarFormulario()) {
                    return;
                }

                salvarPublicacao.dataset.salvando =
                    "true";

                salvarPublicacao.disabled =
                    true;

                salvarPublicacao.textContent =
                    "⏳ A guardar...";

                try {

                    const tipo =
                        tipoConteudo.value;

                    const nome =
                        nomeConteudo.value.trim();

                    const descricao =
                        descricaoConteudo.value.trim();

                    const ano =
                        Number(
                            anoConteudo.value
                        );

                    const acesso =
                        tipoAcesso.value;

                    const preco =
                        (
                            acesso === "venda" ||
                            acesso === "aluguel"
                        )
                            ? Number(
                                precoConteudo.value
                            )
                            : 0;

                    const agora =
                        new Date();

                    const conteudo = {

                        id:
                            gerarId(),

                        tipo:
                            tipo,

                        nome:
                            nome,

                        descricao:
                            descricao,

                        ano:
                            ano,

                        acesso:
                            acesso,

                        preco:
                            preco,

                        capa:
                            capaAutomatica,

                        data:
                            agora.toISOString(),

                        visualizacoes:
                            0,

                        favoritos:
                            false,

                        publicado:
                            true
                    };


                    /* =====================================
                       FILME
                    ===================================== */

                    if (tipo === "filme") {

                        const arquivo =
                            arquivoVideo.files[0];

                        conteudo.video =
                            arquivo;

                        conteudo.nomeArquivo =
                            arquivo.name;

                        conteudo.tamanho =
                            arquivo.size;

                        conteudo.tipoArquivo =
                            arquivo.type;
                    }


                    /* =====================================
                       SÉRIE
                    ===================================== */

                    if (tipo === "serie") {

                        conteudo.temporadas =
                            Number(
                                quantidadeTemporadas.value
                            );

                        conteudo.episodiosTotais =
                            Number(
                                quantidadeEpisodios.value
                            );

                        conteudo.episodios =
                            coletarEpisodios();
                    }


                    /* =====================================
                       SALVAR NO INDEXEDDB
                    ===================================== */

                    await salvarConteudoBanco(
                        conteudo
                    );

                    console.log(
                        "Conteúdo guardado:",
                        conteudo
                    );

                    alert(
                        "✅ Conteúdo publicado e guardado no navegador!"
                    );

                    fecharModalPublicacao();

                    limparFormulario();

                    await carregarConteudos();

                } catch (erro) {

                    console.error(
                        "Erro ao publicar:",
                        erro
                    );

                    alert(
                        "❌ Não foi possível guardar o conteúdo.\n\n" +
                        "Erro: " +
                        erro.message
                    );

                } finally {

                    salvarPublicacao.dataset.salvando =
                        "false";

                    salvarPublicacao.disabled =
                        false;

                    salvarPublicacao.textContent =
                        "🚀 Publicar";
                }
            }
        );
    }


    /* =========================================================
       LIMPAR FORMULÁRIO
    ========================================================= */

    function limparFormulario() {

        if (nomeConteudo) {
            nomeConteudo.value = "";
        }

        if (descricaoConteudo) {
            descricaoConteudo.value = "";
        }

        if (anoConteudo) {
            anoConteudo.value = "";
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

        if (precoConteudo) {
            precoConteudo.value = "";
        }

        if (aceitarRegras) {
            aceitarRegras.checked = false;
        }

        if (tipoConteudo) {
            tipoConteudo.value = "filme";
        }

        if (tipoAcesso) {
            tipoAcesso.value = "gratis";
        }

        if (listaTemporadas) {
            listaTemporadas.innerHTML = "";
        }

        if (previewCapa) {

            previewCapa.innerHTML =
                "Pré-visualização da capa";
        }

        const area =
            document.getElementById(
                "areaCapasAutomaticas"
            );

        if (area) {
            area.remove();
        }

        capaAutomatica = "";

        capasAutomaticas = [];

        videoAtualParaCapa = null;

        atualizarTipoConteudo();

        atualizarPreco();
    }


    /* =========================================================
       CRIAR URL TEMPORÁRIA DO VÍDEO
    ========================================================= */

    function criarURLVideo(blob) {

        if (!blob) {
            return "";
        }

        try {

            return URL.createObjectURL(blob);

        } catch (erro) {

            console.error(
                "Erro ao criar URL:",
                erro
            );

            return "";
        }
    }


    /* =========================================================
       CRIAR CARD DE FILME
    ========================================================= */

    function criarCardFilme(conteudo) {

        const card =
            document.createElement("article");

        card.className =
            "card";

        card.dataset.id =
            conteudo.id;

        let capaHTML = "";

        if (conteudo.capa) {

            capaHTML =
                '<img src="' +
                conteudo.capa +
                '" alt="' +
                escaparHTML(
                    conteudo.nome
                ) +
                '">';
        } else {

            capaHTML =
                '<div class="capa-generica">🎬</div>';
        }

        let acessoTexto =
            "🆓 Gratuito";

        if (conteudo.acesso === "venda") {

            acessoTexto =
                "💰 " +
                Number(
                    conteudo.preco || 0
                ).toFixed(2) +
                " Kz";

        } else if (
            conteudo.acesso === "aluguel"
        ) {

            acessoTexto =
                "🎟️ " +
                Number(
                    conteudo.preco || 0
                ).toFixed(2) +
                " Kz";
        }

        card.innerHTML =

            '<div class="capa">' +
            capaHTML +
            "</div>" +

            "<h3>" +
            escaparHTML(
                conteudo.nome
            ) +
            "</h3>" +

            "<p>" +
            "Filme • " +
            escaparHTML(
                String(
                    conteudo.ano
                )
            ) +
            " • " +
            escaparHTML(
                acessoTexto
            ) +
            "</p>" +

            '<div class="botoes">' +

            '<button class="btn-play" ' +
            'title="Assistir">▶️</button>' +

            '<button class="btn-download" ' +
            'title="Baixar">⬇️</button>' +

            '<button class="btn-share" ' +
            'title="Compartilhar">🔗</button>' +

            '<button class="btn-favorito" ' +
            'title="Favorito">' +
            (
                conteudo.favoritos
                    ? "❤️"
                    : "🤍"
            ) +
            "</button>" +

            '<button class="btn-apagar" ' +
            'title="Apagar">🗑️</button>' +

            "</div>";

        /* PLAY */

        const botaoPlay =
            card.querySelector(
                ".btn-play"
            );

        if (botaoPlay) {

            botaoPlay.addEventListener(
                "click",
                function () {

                    reproduzirFilme(
                        conteudo.id
                    );
                }
            );
        }

        /* DOWNLOAD */

        const botaoDownload =
            card.querySelector(
                ".btn-download"
            );

        if (botaoDownload) {

            botaoDownload.addEventListener(
                "click",
                function () {

                    baixarFilme(
                        conteudo.id
                    );
                }
            );
        }

        /* SHARE */

        const botaoShare =
            card.querySelector(
                ".btn-share"
            );

        if (botaoShare) {

            botaoShare.addEventListener(
                "click",
                function () {

                    compartilharConteudo(
                        conteudo
                    );
                }
            );
        }

        /* FAVORITO */

        const botaoFavorito =
            card.querySelector(
                ".btn-favorito"
            );

        if (botaoFavorito) {

            botaoFavorito.addEventListener(
                "click",
                async function () {

                    conteudo.favoritos =
                        !conteudo.favoritos;

                    await atualizarConteudo(
                        conteudo
                    );

                    botaoFavorito.textContent =
                        conteudo.favoritos
                            ? "❤️"
                            : "🤍";
                }
            );
        }

        /* APAGAR */

        const botaoApagar =
            card.querySelector(
                ".btn-apagar"
            );

        if (botaoApagar) {

            botaoApagar.addEventListener(
                "click",
                async function () {

                    const confirmar =
                        confirm(
                            "Tem certeza que deseja apagar \"" +
                            conteudo.nome +
                            "\"?"
                        );

                    if (!confirmar) {
                        return;
                    }

                    await apagarConteudo(
                        conteudo.id
                    );

                    card.remove();

                    alert(
                        "Conteúdo apagado."
                    );
                }
            );
        }

        return card;
    }


    /* =========================================================
       CRIAR CARD DE SÉRIE
    ========================================================= */

    function criarCardSerie(conteudo) {

        const card =
            document.createElement("article");

        card.className =
            "card";

        card.dataset.id =
            conteudo.id;

        let capaHTML = "";

        if (conteudo.capa) {

            capaHTML =
                '<img src="' +
                conteudo.capa +
                '" alt="' +
                escaparHTML(
                    conteudo.nome
                ) +
                '">';
        } else {

            capaHTML =
                '<div class="capa-generica">📺</div>';
        }

        let acessoTexto =
            "🆓 Gratuito";

        if (conteudo.acesso === "venda") {

            acessoTexto =
                "💰 " +
                Number(
                    conteudo.preco || 0
                ).toFixed(2) +
                " Kz";

        } else if (
            conteudo.acesso === "aluguel"
        ) {

            acessoTexto =
                "🎟️ " +
                Number(
                    conteudo.preco || 0
                ).toFixed(2) +
                " Kz";
        }

        const totalEpisodios =
            Array.isArray(
                conteudo.episodios
            )
                ? conteudo.episodios.length
                : 0;

        card.innerHTML =

            '<div class="capa">' +
            capaHTML +
            "</div>" +

            "<h3>" +
            escaparHTML(
                conteudo.nome
            ) +
            "</h3>" +

            "<p>" +
            "Série • " +
            escaparHTML(
                String(
                    conteudo.temporadas || 0
                )
            ) +
            " temporada(s) • " +
            escaparHTML(
                String(
                    totalEpisodios
                )
            ) +
            " episódio(s)" +
            "</p>" +

            "<p>" +
            escaparHTML(
                acessoTexto
            ) +
            "</p>" +

            '<div class="botoes">' +

            '<button class="btn-play" ' +
            'title="Assistir série">▶️</button>' +

            '<button class="btn-share" ' +
            'title="Compartilhar">🔗</button>' +

            '<button class="btn-favorito" ' +
            'title="Favorito">' +
            (
                conteudo.favoritos
                    ? "❤️"
                    : "🤍"
            ) +
            "</button>" +

            '<button class="btn-apagar" ' +
            'title="Apagar">🗑️</button>' +

            "</div>";

        const botaoPlay =
            card.querySelector(
                ".btn-play"
            );

        if (botaoPlay) {

            botaoPlay.addEventListener(
                "click",
                function () {

                    abrirSerie(
                        conteudo.id
                    );
                }
            );
        }

        const botaoShare =
            card.querySelector(
                ".btn-share"
            );

        if (botaoShare) {

            botaoShare.addEventListener(
                "click",
                function () {

                    compartilharConteudo(
                        conteudo
                    );
                }
            );
        }

        const botaoFavorito =
            card.querySelector(
                ".btn-favorito"
            );

        if (botaoFavorito) {

            botaoFavorito.addEventListener(
                "click",
                async function () {

                    conteudo.favoritos =
                        !conteudo.favoritos;

                    await atualizarConteudo(
                        conteudo
                    );

                    botaoFavorito.textContent =
                        conteudo.favoritos
                            ? "❤️"
                            : "🤍";
                }
            );
        }

        const botaoApagar =
            card.querySelector(
                ".btn-apagar"
            );

        if (botaoApagar) {

            botaoApagar.addEventListener(
                "click",
                async function () {

                    const confirmar =
                        confirm(
                            "Tem certeza que deseja apagar \"" +
                            conteudo.nome +
                            "\"?"
                        );

                    if (!confirmar) {
                        return;
                    }

                    await apagarConteudo(
                        conteudo.id
                    );

                    card.remove();

                    alert(
                        "Série apagada."
                    );
                }
            );
        }

        return card;
    }


    /* =========================================================
       CARREGAR CONTEÚDOS
    ========================================================= */

    async function carregarConteudos() {

        if (!listaFilmes) {
            return;
        }

        try {

            const conteudos =
                await obterTodosConteudos();

            conteudos.sort(
                function (a, b) {

                    return (
                        new Date(b.data) -
                        new Date(a.data)
                    );
                }
            );

            listaFilmes.innerHTML = "";

            if (
                conteudos.length === 0
            ) {

                listaFilmes.innerHTML =
                    '<div style="' +
                    'padding:30px;' +
                    'text-align:center;' +
                    'width:100%;' +
                    '">' +

                    "<h3>" +
                    "🎬 Ainda não há conteúdos publicados" +
                    "</h3>" +

                    "<p>" +
                    "Clique em \"Publicar conteúdo\" para adicionar o primeiro filme ou série." +
                    "</p>" +

                    "</div>";

                return;
            }

            conteudos.forEach(
                function (conteudo) {

                    let card;

                    if (
                        conteudo.tipo === "serie"
                    ) {

                        card =
                            criarCardSerie(
                                conteudo
                            );

                    } else {

                        card =
                            criarCardFilme(
                                conteudo
                            );
                    }

                    listaFilmes.appendChild(
                        card
                    );
                }
            );

        } catch (erro) {

            console.error(
                "Erro ao carregar conteúdos:",
                erro
            );

            alert(
                "Não foi possível carregar os conteúdos guardados."
            );
        }
    }


    /* =========================================================
       REPRODUZIR FILME
    ========================================================= */

    async function reproduzirFilme(id) {

        try {

            const conteudo =
                await obterConteudo(id);

            if (!conteudo) {

                alert(
                    "Filme não encontrado."
                );

                return;
            }

            if (!conteudo.video) {

                alert(
                    "O vídeo deste filme não está disponível."
                );

                return;
            }

            const url =
                criarURLVideo(
                    conteudo.video
                );

            if (!url) {
                return;
            }

            if (videoPlayer) {

                videoPlayer.src =
                    url;

                videoPlayer.load();

                if (modalPlayer) {

                    modalPlayer.classList.add(
                        "ativo"
                    );

                    modalPlayer.style.display =
                        "flex";
                }

                if (tituloPlayer) {

                    tituloPlayer.textContent =
                        conteudo.nome;
                }

                if (descricaoPlayer) {

                    descricaoPlayer.textContent =
                        conteudo.descricao;
                }

                conteudo.visualizacoes =
                    Number(
                        conteudo.visualizacoes || 0
                    ) + 1;

                await atualizarConteudo(
                    conteudo
                );

                videoPlayer.play()
                    .catch(
                        function () {
                            console.log(
                                "Clique no play para iniciar."
                            );
                        }
                    );
            }

        } catch (erro) {

            console.error(
                "Erro ao reproduzir:",
                erro
            );

            alert(
                "Não foi possível reproduzir o vídeo."
            );
        }
    }


    /* =========================================================
       FECHAR PLAYER
    ========================================================= */

    function fecharModalPlayer() {

        if (videoPlayer) {

            videoPlayer.pause();

            videoPlayer.removeAttribute(
                "src"
            );

            videoPlayer.load();
        }

        if (modalPlayer) {

            modalPlayer.classList.remove(
                "ativo"
            );

            modalPlayer.style.display =
                "none";
        }
    }

    if (fecharPlayer) {

        fecharPlayer.addEventListener(
            "click",
            fecharModalPlayer
        );
    }


    /* =========================================================
       ABRIR SÉRIE
    ========================================================= */

    async function abrirSerie(id) {

        try {

            const serie =
                await obterConteudo(id);

            if (!serie) {
                return;
            }

            if (
                !serie.episodios ||
                serie.episodios.length === 0
            ) {

                alert(
                    "Esta série não possui episódios."
                );

                return;
            }

            let mensagem =
                "Escolha o episódio:\n\n";

            serie.episodios.forEach(
                function (ep, index) {

                    mensagem +=
                        (index + 1) +
                        ". T" +
                        ep.temporada +
                        " E" +
                        ep.episodio +
                        " - " +
                        ep.titulo +
                        "\n";
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

            const indice =
                Number(escolha) - 1;

            if (
                indice < 0 ||
                indice >=
                serie.episodios.length
            ) {

                alert(
                    "Episódio inválido."
                );

                return;
            }

            const episodio =
                serie.episodios[indice];

            if (!episodio.video) {

                alert(
                    "O vídeo deste episódio não está disponível."
                );

                return;
            }

            const url =
                criarURLVideo(
                    episodio.video
                );

            if (!url) {
                return;
            }

            if (videoPlayer) {

                videoPlayer.src =
                    url;

                videoPlayer.load();

                if (modalPlayer) {

                    modalPlayer.classList.add(
                        "ativo"
                    );

                    modalPlayer.style.display =
                        "flex";
                }

                if (tituloPlayer) {

                    tituloPlayer.textContent =
                        serie.nome +
                        " - T" +
                        episodio.temporada +
                        " E" +
                        episodio.episodio +
                        " - " +
                        episodio.titulo;
                }

                if (descricaoPlayer) {

                    descricaoPlayer.textContent =
                        serie.descricao;
                }

                serie.visualizacoes =
                    Number(
                        serie.visualizacoes || 0
                    ) + 1;

                await atualizarConteudo(
                    serie
                );

                videoPlayer.play()
                    .catch(
                        function () {}
                    );
            }

        } catch (erro) {

            console.error(
                "Erro ao abrir série:",
                erro
            );

            alert(
                "Não foi possível abrir a série."
            );
        }
    }


    /* =========================================================
       BAIXAR FILME
    ========================================================= */

    async function baixarFilme(id) {

        try {

            const conteudo =
                await obterConteudo(id);

            if (
                !conteudo ||
                !conteudo.video
            ) {

                alert(
                    "Vídeo não encontrado."
                );

                return;
            }

            const url =
                URL.createObjectURL(
                    conteudo.video
                );

            const link =
                document.createElement("a");

            link.href =
                url;

            link.download =
                conteudo.nomeArquivo ||
                conteudo.nome +
                ".mp4";

            document.body.appendChild(
                link
            );

            link.click();

            link.remove();

            setTimeout(
                function () {

                    URL.revokeObjectURL(
                        url
                    );

                },
                1000
            );

        } catch (erro) {

            console.error(
                "Erro no download:",
                erro
            );

            alert(
                "Não foi possível baixar o vídeo."
            );
        }
    }


    /* =========================================================
       COMPARTILHAR
    ========================================================= */

    async function compartilharConteudo(
        conteudo
    ) {

        const texto =
            "🎬 " +
            conteudo.nome +
            "\n\n" +
            conteudo.descricao +
            "\n\n" +
            "I.M.A FILMES";

        try {

            if (
                navigator.share
            ) {

                await navigator.share({

                    title:
                        conteudo.nome,

                    text:
                        texto
                });

            } else if (
                navigator.clipboard
            ) {

                await navigator.clipboard.writeText(
                    texto
                );

                alert(
                    "📋 Informações copiadas!"
                );

            } else {

                alert(
                    texto
                );
            }

        } catch (erro) {

            console.log(
                "Compartilhamento cancelado."
            );
        }
    }


    /* =========================================================
       PESQUISA
    ========================================================= */

    if (campoPesquisa) {

        campoPesquisa.addEventListener(
            "input",
            function () {

                const termo =
                    campoPesquisa.value
                        .toLowerCase()
                        .trim();

                const cards =
                    listaFilmes
                        ? listaFilmes.querySelectorAll(
                            ".card"
                        )
                        : [];

                cards.forEach(
                    function (card) {

                        const texto =
                            card.textContent
                                .toLowerCase();

                        if (
                            texto.includes(
                                termo
                            )
                        ) {

                            card.style.display =
                                "";

                        } else {

                            card.style.display =
                                "none";
                        }
                    }
                );
            }
        );
    }


    /* =========================================================
       FECHAR MODAIS AO CLICAR FORA
    ========================================================= */

    if (modalPublicacao) {

        modalPublicacao.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target ===
                    modalPublicacao
                ) {

                    fecharModalPublicacao();
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


    /* =========================================================
       TECLA ESC
    ========================================================= */

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key ===
                "Escape"
            ) {

                fecharModalPublicacao();

                fecharModalPlayer();
            }
        }
    );


    /* =========================================================
       LIMPEZA DA URL DO PLAYER
    ========================================================= */

    if (videoPlayer) {

        videoPlayer.addEventListener(
            "ended",
            function () {

                console.log(
                    "Vídeo terminou."
                );
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

            await carregarConteudos();

            console.log(
                "I.M.A FILMES carregado corretamente"
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

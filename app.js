document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    console.log("I.M.A FILMES iniciado");

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
    const areaSerie = document.getElementById("areaSerie");
    const areaVideo = document.getElementById("areaVideo");

    const arquivoCapa = document.getElementById("arquivoCapa");
    const previewCapa = document.getElementById("previewCapa");

    const nomeConteudo = document.getElementById("nomeConteudo");
    const descricaoConteudo = document.getElementById("descricaoConteudo");
    const anoConteudo = document.getElementById("anoConteudo");

    const quantidadeTemporadas =
        document.getElementById("quantidadeTemporadas");

    const quantidadeEpisodios =
        document.getElementById("quantidadeEpisodios");

    const listaTemporadas =
        document.getElementById("listaTemporadas");

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
       VARIÁVEIS
    ========================================================= */

    let capaSelecionada = "";

    let videoPrincipalURL = "";

    let numeroPublicacao = 0;


    /* =========================================================
       FUNÇÕES AUXILIARES
    ========================================================= */

    function abrirModal() {
        if (modalPublicacao) {
            modalPublicacao.classList.add("ativo");
            modalPublicacao.style.display = "flex";
        }
    }

    function fecharModalPublicacao() {
        if (modalPublicacao) {
            modalPublicacao.classList.remove("ativo");
            modalPublicacao.style.display = "none";
        }
    }

    function fecharModalDoPlayer() {
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.removeAttribute("src");
            videoPlayer.load();
        }

        if (modalPlayer) {
            modalPlayer.classList.remove("ativo");
            modalPlayer.style.display = "none";
        }
    }

    function escaparHTML(texto) {
        if (texto === null || texto === undefined) {
            return "";
        }

        return String(texto)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function mostrarMensagem(mensagem) {
        alert(mensagem);
    }


    /* =========================================================
       ABRIR PUBLICAÇÃO
    ========================================================= */

    if (botaoEnviar) {
        botaoEnviar.addEventListener("click", function () {
            abrirModal();
        });
    }

    if (botaoEnviarMenu) {
        botaoEnviarMenu.addEventListener("click", function () {
            abrirModal();
        });
    }


    /* =========================================================
       FECHAR MODAL
    ========================================================= */

    if (fecharModal) {
        fecharModal.addEventListener("click", function () {
            fecharModalPublicacao();
        });
    }

    if (cancelarPublicacao) {
        cancelarPublicacao.addEventListener("click", function () {
            fecharModalPublicacao();
        });
    }

    if (fecharPlayer) {
        fecharPlayer.addEventListener("click", function () {
            fecharModalDoPlayer();
        });
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
                areaVideo.style.display = "block";
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
       TIPO DE ACESSO / PREÇO
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

            if (precoConteudo) {
                precoConteudo.value = "";
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

                const arquivo = arquivoCapa.files[0];

                if (!arquivo) {
                    return;
                }

                if (!arquivo.type.startsWith("image/")) {
                    mostrarMensagem(
                        "Escolha uma imagem válida para a capa."
                    );

                    arquivoCapa.value = "";
                    return;
                }

                const leitor = new FileReader();

                leitor.onload = function (evento) {

                    capaSelecionada =
                        evento.target.result;

                    if (previewCapa) {
                        previewCapa.innerHTML =
                            '<img src="' +
                            capaSelecionada +
                            '" alt="Capa">';
                    }
                };

                leitor.readAsDataURL(arquivo);
            }
        );
    }


    /* =========================================================
       ÁREA DAS 5 CAPAS AUTOMÁTICAS
    ========================================================= */

    function criarAreaCapasAutomaticas() {

        if (!previewCapa) {
            return;
        }

        let areaExistente =
            document.getElementById(
                "areaCapasAutomaticas"
            );

        if (areaExistente) {
            return areaExistente;
        }

        const area =
            document.createElement("div");

        area.id = "areaCapasAutomaticas";

        area.style.marginTop = "15px";
        area.style.padding = "15px";
        area.style.borderRadius = "12px";
        area.style.background = "rgba(255,255,255,0.05)";

        area.innerHTML =

            "<h3>🤖 Escolha a melhor capa</h3>" +

            "<p>" +
            "O sistema vai criar automaticamente " +
            "5 opções a partir do vídeo." +
            "</p>" +

            '<div id="capasAutomaticas" ' +
            'style="display:grid;' +
            'grid-template-columns:repeat(5,1fr);' +
            'gap:10px;"></div>' +

            '<div style="margin-top:15px;">' +

            "<label>" +
            "🎯 Escolher outro momento do vídeo" +
            "</label>" +

            '<input type="range" ' +
            'id="controleMomentoCapa" ' +
            'min="0" max="100" value="50" ' +
            'style="width:100%;">' +

            '<button type="button" ' +
            'id="gerarOutraCapa" ' +
            'style="margin-top:10px;">' +
            "🔄 Gerar outra capa" +
            "</button>" +

            "</div>";

        previewCapa.parentNode.insertBefore(
            area,
            previewCapa.nextSibling
        );

        return area;
    }


    /* =========================================================
       CRIAR CAPA A PARTIR DE UM FRAME DO VÍDEO
    ========================================================= */

    function criarCapaDoVideo(
        arquivo,
        porcentagem,
        callback
    ) {

        const url =
            URL.createObjectURL(arquivo);

        const video =
            document.createElement("video");

        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";

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

                if (tempo > video.duration) {
                    tempo = video.duration;
                }

                video.currentTime = tempo;
            }
        );

        video.addEventListener(
            "seeked",
            function () {

                try {

                    const canvas =
                        document.createElement("canvas");

                    canvas.width =
                        video.videoWidth || 640;

                    canvas.height =
                        video.videoHeight || 360;

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
                            0.85
                        );

                    callback(imagem);

                } catch (erro) {

                    console.error(
                        "Erro ao criar capa:",
                        erro
                    );

                    callback(null);

                } finally {

                    URL.revokeObjectURL(url);
                }
            }
        );

        video.addEventListener(
            "error",
            function () {

                URL.revokeObjectURL(url);

                callback(null);
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

        if (!arquivo.type.startsWith("video/")) {
            return;
        }

        const area =
            criarAreaCapasAutomaticas();

        const container =
            document.getElementById(
                "capasAutomaticas"
            );

        if (!container) {
            return;
        }

        container.innerHTML =
            "<p>⏳ Criando capas automaticamente...</p>";

        const porcentagens = [
            5,
            20,
            40,
            60,
            80
        ];

        const capas = [];

        let concluido = 0;

        porcentagens.forEach(
            function (porcentagem, indice) {

                criarCapaDoVideo(
                    arquivo,
                    porcentagem,
                    function (imagem) {

                        concluido++;

                        capas[indice] =
                            imagem;

                        if (
                            concluido ===
                            porcentagens.length
                        ) {

                            container.innerHTML =
                                "";

                            capas.forEach(
                                function (
                                    capa,
                                    numero
                                ) {

                                    if (!capa) {
                                        return;
                                    }

                                    const div =
                                        document.createElement(
                                            "div"
                                        );

                                    div.style.cursor =
                                        "pointer";

                                    div.style.border =
                                        "3px solid transparent";

                                    div.style.borderRadius =
                                        "10px";

                                    div.style.overflow =
                                        "hidden";

                                    const img =
                                        document.createElement(
                                            "img"
                                        );

                                    img.src =
                                        capa;

                                    img.alt =
                                        "Capa " +
                                        (numero + 1);

                                    img.style.width =
                                        "100%";

                                    img.style.height =
                                        "120px";

                                    img.style.objectFit =
                                        "cover";

                                    div.appendChild(
                                        img
                                    );

                                    div.addEventListener(
                                        "click",
                                        function () {

                                            capaSelecionada =
                                                capa;

                                            if (
                                                previewCapa
                                            ) {

                                                previewCapa.innerHTML =
                                                    '<img src="' +
                                                    capa +
                                                    '" alt="Capa escolhida">';
                                            }

                                            document
                                                .querySelectorAll(
                                                    "#capasAutomaticas > div"
                                                )
                                                .forEach(
                                                    function (
                                                        item
                                                    ) {
                                                        item.style.border =
                                                            "3px solid transparent";
                                                    }
                                                );

                                            div.style.border =
                                                "3px solid #00ff88";
                                        }
                                    );

                                    container.appendChild(
                                        div
                                    );

                                    if (numero === 0) {

                                        setTimeout(
                                            function () {

                                                div.click();

                                            },
                                            50
                                        );
                                    }
                                }
                            );

                            const botaoOutra =
                                document.getElementById(
                                    "gerarOutraCapa"
                                );

                            const controle =
                                document.getElementById(
                                    "controleMomentoCapa"
                                );

                            if (
                                botaoOutra &&
                                controle
                            ) {

                                botaoOutra.onclick =
                                    function () {

                                        const valor =
                                            Number(
                                                controle.value
                                            );

                                        botaoOutra.disabled =
                                            true;

                                        botaoOutra.textContent =
                                            "⏳ Gerando...";

                                        criarCapaDoVideo(
                                            arquivo,
                                            valor,
                                            function (
                                                novaCapa
                                            ) {

                                                botaoOutra.disabled =
                                                    false;

                                                botaoOutra.textContent =
                                                    "🔄 Gerar outra capa";

                                                if (
                                                    novaCapa
                                                ) {

                                                    capaSelecionada =
                                                        novaCapa;

                                                    if (
                                                        previewCapa
                                                    ) {

                                                        previewCapa.innerHTML =
                                                            '<img src="' +
                                                            novaCapa +
                                                            '" alt="Nova capa">';
                                                    }
                                                }
                                            }
                                        );
                                    };
                            }

                            if (area) {
                                area.style.display =
                                    "block";
                            }
                        }
                    }
                );
            }
        );
    }


    /* =========================================================
       SELEÇÃO DO VÍDEO
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

                if (!arquivo.type.startsWith("video/")) {

                    mostrarMensagem(
                        "Por favor, selecione um vídeo válido."
                    );

                    arquivoVideo.value = "";
                    return;
                }

                videoPrincipalURL =
                    URL.createObjectURL(
                        arquivo
                    );

                gerarCincoCapas(arquivo);
            }
        );
    }


    /* =========================================================
       GERAR EPISÓDIOS DAS SÉRIES
    ========================================================= */

    function gerarCamposTemporadas() {

        if (!listaTemporadas) {
            return;
        }

        listaTemporadas.innerHTML =
            "";

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
            let temporada = 1;
            temporada <= temporadas;
            temporada++
        ) {

            const bloco =
                document.createElement("div");

            bloco.className =
                "temporada";

            bloco.style.marginBottom =
                "20px";

            bloco.innerHTML =
                "<h4>" +
                "📺 Temporada " +
                temporada +
                "</h4>";

            for (
                let episodio = 1;
                episodio <= episodios;
                episodio++
            ) {

                const grupo =
                    document.createElement(
                        "div"
                    );

                grupo.style.marginBottom =
                    "8px";

                grupo.innerHTML =

                    "<label>" +
                    "Episódio " +
                    episodio +
                    "</label>" +

                    '<input type="text" ' +
                    'class="titulo-episodio" ' +
                    'data-temporada="' +
                    temporada +
                    '" ' +
                    'data-episodio="' +
                    episodio +
                    '" ' +
                    'placeholder="Nome do episódio">';

                bloco.appendChild(
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
            gerarCamposTemporadas
        );
    }

    if (quantidadeEpisodios) {

        quantidadeEpisodios.addEventListener(
            "input",
            gerarCamposTemporadas
        );
    }


    /* =========================================================
       CRIAR CARD DO FILME/SÉRIE
    ========================================================= */

    function criarCard(dados) {

        if (!listaFilmes) {
            return;
        }

        numeroPublicacao++;

        const card =
            document.createElement("article");

        card.className =
            "card";

        card.setAttribute(
            "data-nome",
            dados.nome.toLowerCase()
        );

        let imagemCapa =
            dados.capa;

        if (!imagemCapa) {

            if (dados.tipo === "serie") {
                imagemCapa =
                    "📺";
            } else {
                imagemCapa =
                    "🎬";
            }
        }

        let capaHTML = "";

        if (
            typeof imagemCapa === "string" &&
            imagemCapa.startsWith("data:image")
        ) {

            capaHTML =
                '<img src="' +
                imagemCapa +
                '" alt="' +
                escaparHTML(
                    dados.nome
                ) +
                '">';

        } else {

            capaHTML =
                '<div class="capa-gerada">' +
                imagemCapa +
                "</div>";
        }

        let tipoTexto =
            dados.tipo === "serie"
                ? "Série"
                : "Filme";

        let acessoTexto =
            "Gratuito";

        if (dados.acesso === "venda") {
            acessoTexto =
                "Venda • " +
                dados.preco +
                " Kz";
        }

        if (dados.acesso === "aluguel") {
            acessoTexto =
                "Aluguel • " +
                dados.preco +
                " Kz";
        }

        card.innerHTML =

            '<div class="capa">' +
            capaHTML +
            "</div>" +

            "<h3>" +
            escaparHTML(
                dados.nome
            ) +
            "</h3>" +

            "<p>" +
            tipoTexto +
            " • " +
            escaparHTML(
                dados.ano
            ) +
            "</p>" +

            "<p>" +
            escaparHTML(
                acessoTexto
            ) +
            "</p>" +

            '<div class="botoes">' +

            '<button type="button" ' +
            'class="botao-play">' +
            "▶️" +
            "</button>" +

            '<button type="button" ' +
            'class="botao-download">' +
            "⬇️" +
            "</button>" +

            '<button type="button" ' +
            'class="botao-share">' +
            "🔗" +
            "</button>" +

            "</div>";

        listaFilmes.prepend(
            card
        );


        /* =====================================================
           BOTÃO PLAY
        ===================================================== */

        const botaoPlay =
            card.querySelector(
                ".botao-play"
            );

        if (botaoPlay) {

            botaoPlay.addEventListener(
                "click",
                function () {

                    if (!dados.video) {

                        mostrarMensagem(
                            "Este conteúdo não possui vídeo disponível."
                        );

                        return;
                    }

                    if (!modalPlayer ||
                        !videoPlayer) {
                        return;
                    }

                    tituloPlayer.textContent =
                        dados.nome;

                    if (descricaoPlayer) {

                        descricaoPlayer.textContent =
                            dados.descricao || "";
                    }

                    videoPlayer.src =
                        dados.video;

                    modalPlayer.classList.add(
                        "ativo"
                    );

                    modalPlayer.style.display =
                        "flex";

                    videoPlayer.play().catch(
                        function () {
                            console.log(
                                "Clique no play para iniciar o vídeo."
                            );
                        }
                    );
                }
            );
        }


        /* =====================================================
           BOTÃO DOWNLOAD
        ===================================================== */

        const botaoDownload =
            card.querySelector(
                ".botao-download"
            );

        if (botaoDownload) {

            botaoDownload.addEventListener(
                "click",
                function () {

                    if (!dados.video) {

                        mostrarMensagem(
                            "Não existe vídeo para baixar."
                        );

                        return;
                    }

                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href =
                        dados.video;

                    link.download =
                        dados.nome +
                        ".mp4";

                    document.body.appendChild(
                        link
                    );

                    link.click();

                    document.body.removeChild(
                        link
                    );
                }
            );
        }


        /* =====================================================
           BOTÃO PARTILHAR
        ===================================================== */

        const botaoShare =
            card.querySelector(
                ".botao-share"
            );

        if (botaoShare) {

            botaoShare.addEventListener(
                "click",
                function () {

                    const texto =
                        "🎬 Confira este conteúdo no I.M.A FILMES: " +
                        dados.nome;

                    if (
                        navigator.share
                    ) {

                        navigator.share({
                            title:
                                dados.nome,

                            text:
                                texto
                        }).catch(
                            function () {}
                        );

                    } else {

                        if (
                            navigator.clipboard
                        ) {

                            navigator.clipboard
                                .writeText(
                                    texto
                                )
                                .then(
                                    function () {

                                        mostrarMensagem(
                                            "Texto copiado para partilhar!"
                                        );
                                    }
                                )
                                .catch(
                                    function () {

                                        mostrarMensagem(
                                            texto
                                        );
                                    }
                                );

                        } else {

                            mostrarMensagem(
                                texto
                            );
                        }
                    }
                }
            );
        }
    }


    /* =========================================================
       PUBLICAR CONTEÚDO
    ========================================================= */

    if (salvarPublicacao) {

        salvarPublicacao.addEventListener(
            "click",
            function () {

                /* ---------------------------------------------
                   VALIDAR NOME
                --------------------------------------------- */

                const nome =
                    nomeConteudo
                        ? nomeConteudo.value.trim()
                        : "";

                if (nome === "") {

                    mostrarMensagem(
                        "Digite o nome do filme ou série."
                    );

                    if (nomeConteudo) {
                        nomeConteudo.focus();
                    }

                    return;
                }


                /* ---------------------------------------------
                   VALIDAR DESCRIÇÃO
                --------------------------------------------- */

                const descricao =
                    descricaoConteudo
                        ? descricaoConteudo.value.trim()
                        : "";


                /* ---------------------------------------------
                   VALIDAR ANO
                --------------------------------------------- */

                const ano =
                    anoConteudo
                        ? anoConteudo.value
                        : "";

                if (ano === "") {

                    mostrarMensagem(
                        "Digite o ano do conteúdo."
                    );

                    if (anoConteudo) {
                        anoConteudo.focus();
                    }

                    return;
                }


                /* ---------------------------------------------
                   VALIDAR VÍDEO
                --------------------------------------------- */

                if (
                    !arquivoVideo ||
                    !arquivoVideo.files ||
                    arquivoVideo.files.length === 0
                ) {

                    mostrarMensagem(
                        "Selecione o vídeo que deseja publicar."
                    );

                    if (arquivoVideo) {
                        arquivoVideo.click();
                    }

                    return;
                }

                const arquivo =
                    arquivoVideo.files[0];

                if (!arquivo.type.startsWith("video/")) {

                    mostrarMensagem(
                        "O arquivo selecionado não é um vídeo válido."
                    );

                    return;
                }


                /* ---------------------------------------------
                   VALIDAR CAPA
                --------------------------------------------- */

                if (!capaSelecionada) {

                    mostrarMensagem(
                        "Aguarde a criação da capa automática ou escolha uma capa."
                    );

                    gerarCincoCapas(
                        arquivo
                    );

                    return;
                }


                /* ---------------------------------------------
                   VALIDAR REGRAS
                --------------------------------------------- */

                if (
                    aceitarRegras &&
                    !aceitarRegras.checked
                ) {

                    mostrarMensagem(
                        "Você precisa confirmar que possui direito de publicar este conteúdo."
                    );

                    return;
                }


                /* ---------------------------------------------
                   PREÇO
                --------------------------------------------- */

                let preco =
                    "";

                if (
                    tipoAcesso &&
                    (
                        tipoAcesso.value === "venda" ||
                        tipoAcesso.value === "aluguel"
                    )
                ) {

                    preco =
                        precoConteudo
                            ? precoConteudo.value
                            : "";

                    if (
                        preco === "" ||
                        Number(preco) <= 0
                    ) {

                        mostrarMensagem(
                            "Digite um preço válido."
                        );

                        if (precoConteudo) {
                            precoConteudo.focus();
                        }

                        return;
                    }
                }


                /* ---------------------------------------------
                   DADOS DO CONTEÚDO
                --------------------------------------------- */

                const dados = {

                    id:
                        Date.now() +
                        "_" +
                        numeroPublicacao,

                    tipo:
                        tipoConteudo
                            ? tipoConteudo.value
                            : "filme",

                    nome:
                        nome,

                    descricao:
                        descricao,

                    ano:
                        ano,

                    capa:
                        capaSelecionada,

                    video:
                        videoPrincipalURL,

                    acesso:
                        tipoAcesso
                            ? tipoAcesso.value
                            : "gratis",

                    preco:
                        preco
                };


                /* ---------------------------------------------
                   SÉRIE
                --------------------------------------------- */

                if (
                    dados.tipo === "serie"
                ) {

                    dados.temporadas =
                        quantidadeTemporadas
                            ? Number(
                                quantidadeTemporadas.value
                            )
                            : 0;

                    dados.episodios =
                        quantidadeEpisodios
                            ? Number(
                                quantidadeEpisodios.value
                            )
                            : 0;
                }


                /* ---------------------------------------------
                   CRIAR CARD
                --------------------------------------------- */

                criarCard(
                    dados
                );


                /* ---------------------------------------------
                   FECHAR MODAL
                --------------------------------------------- */

                fecharModalPublicacao();


                /* ---------------------------------------------
                   LIMPAR FORMULÁRIO
                --------------------------------------------- */

                limparFormulario();


                /* ---------------------------------------------
                   MENSAGEM
                --------------------------------------------- */

                mostrarMensagem(
                    "✅ Conteúdo publicado com sucesso no I.M.A FILMES!"
                );
            }
        );
    }


    /* =========================================================
       LIMPAR FORMULÁRIO
    ========================================================= */

    function limparFormulario() {

        capaSelecionada =
            "";

        videoPrincipalURL =
            "";

        if (arquivoCapa) {
            arquivoCapa.value =
                "";
        }

        if (arquivoVideo) {
            arquivoVideo.value =
                "";
        }

        if (nomeConteudo) {
            nomeConteudo.value =
                "";
        }

        if (descricaoConteudo) {
            descricaoConteudo.value =
                "";
        }

        if (anoConteudo) {
            anoConteudo.value =
                "";
        }

        if (quantidadeTemporadas) {
            quantidadeTemporadas.value =
                "";
        }

        if (quantidadeEpisodios) {
            quantidadeEpisodios.value =
                "";
        }

        if (precoConteudo) {
            precoConteudo.value =
                "";
        }

        if (aceitarRegras) {
            aceitarRegras.checked =
                false;
        }

        if (previewCapa) {

            previewCapa.innerHTML =
                "Pré-visualização da capa";
        }

        if (listaTemporadas) {
            listaTemporadas.innerHTML =
                "";
        }

        const area =
            document.getElementById(
                "areaCapasAutomaticas"
            );

        if (area) {
            area.remove();
        }

        if (tipoConteudo) {
            tipoConteudo.value =
                "filme";
        }

        if (tipoAcesso) {
            tipoAcesso.value =
                "gratis";
        }

        atualizarTipoConteudo();
        atualizarPreco();
    }


    /* =========================================================
       PESQUISA
    ========================================================= */

    if (campoPesquisa) {

        campoPesquisa.addEventListener(
            "input",
            function () {

                const pesquisa =
                    campoPesquisa.value
                        .trim()
                        .toLowerCase();

                if (!listaFilmes) {
                    return;
                }

                const cards =
                    listaFilmes.querySelectorAll(
                        ".card"
                    );

                cards.forEach(
                    function (card) {

                        const nome =
                            (
                                card.getAttribute(
                                    "data-nome"
                                ) || ""
                            ).toLowerCase();

                        if (
                            nome.includes(
                                pesquisa
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
       FECHAR MODAIS CLICANDO FORA
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

                    fecharModalDoPlayer();
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

                fecharModalDoPlayer();
            }
        }
    );


    /* =========================================================
       INICIALIZAÇÃO
    ========================================================= */

    atualizarTipoConteudo();
    atualizarPreco();

    console.log(
        "I.M.A FILMES carregado corretamente"
    );
});

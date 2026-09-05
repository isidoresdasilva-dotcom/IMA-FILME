javascript
document.addEventListener("DOMContentLoaded", function () {

    "use strict";

     =========================================================
     ELEMENTOS DO HTML
     =========================================================

    const botaoEnviar = document.getElementById("botaoEnviar");
    const botaoEnviarMenu = document.getElementById("botaoEnviarMenu");

    const modalPublicacao = document.getElementById("modalPublicacao");
    const fecharModal = document.getElementById("fecharModal");
    const cancelarPublicacao = document.getElementById("cancelarPublicacao");
    const salvarPublicacao = document.getElementById("salvarPublicacao");

    const tipoConteudo = document.getElementById("tipoConteudo");
    const tipoAcesso = document.getElementById("tipoAcesso");

    const areaSerie = document.getElementById("areaSerie");
    const areaVideo = document.getElementById("areaVideo");
    const areaPreco = document.getElementById("areaPreco");

    const arquivoCapa = document.getElementById("arquivoCapa");
    const arquivoVideo = document.getElementById("arquivoVideo");

    const previewCapa = document.getElementById("previewCapa");

    const nomeConteudo = document.getElementById("nomeConteudo");
    const descricaoConteudo = document.getElementById("descricaoConteudo");
    const anoConteudo = document.getElementById("anoConteudo");

    const precoConteudo = document.getElementById("precoConteudo");
    const aceitarRegras = document.getElementById("aceitarRegras");

    const quantidadeTemporadas =
        document.getElementById("quantidadeTemporadas");

    const quantidadeEpisodios =
        document.getElementById("quantidadeEpisodios");

    const listaTemporadas =
        document.getElementById("listaTemporadas");

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


     =========================================================
     VARIÁVEIS
     =========================================================

    let capaManual = false;
    let capaSelecionada = "";
    let videoSelecionado = null;

    let capasAutomaticas = [];

    let conteudos = [];


     =========================================================
     ABRIR PUBLICAÇÃO
     =========================================================

    function abrirPublicacao() {

        if (!modalPublicacao) return;

        modalPublicacao.classList.add("ativo");

        modalPublicacao.style.display = "flex";

    }


     =========================================================
     FECHAR PUBLICAÇÃO
     =========================================================

    function fecharPublicacao() {

        if (!modalPublicacao) return;

        modalPublicacao.classList.remove("ativo");

        modalPublicacao.style.display = "none";

    }


     =========================================================
     BOTÕES DE PUBLICAÇÃO
     =========================================================

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
            function () {

                fecharPublicacao();

            }
        );

    }


     =========================================================
     FECHAR CLICANDO FORA
     =========================================================

    if (modalPublicacao) {

        modalPublicacao.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target === modalPublicacao
                ) {

                    fecharPublicacao();

                }

            }
        );

    }


     =========================================================
     TIPO FILME / SÉRIE
     =========================================================

    function atualizarTipoConteudo() {

        if (!tipoConteudo) return;

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


     =========================================================
     TIPO DE ACESSO
     =========================================================

    function atualizarPreco() {

        if (!tipoAcesso || !areaPreco) return;

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


     =========================================================
     PREVIEW DA CAPA MANUAL
     =========================================================

    if (arquivoCapa) {

        arquivoCapa.addEventListener(
            "change",
            function () {

                const arquivo = arquivoCapa.files[0];

                if (!arquivo) return;

                if (
                    !arquivo.type.startsWith("image/")
                ) {

                    alert(
                        "Escolha uma imagem válida para a capa."
                    );

                    arquivoCapa.value = "";

                    return;

                }

                capaManual = true;

                const leitor =
                    new FileReader();

                leitor.onload = function (evento) {

                    capaSelecionada =
                        evento.target.result;

                    mostrarCapa(
                        capaSelecionada
                    );

                };

                leitor.readAsDataURL(arquivo);

            }
        );

    }


     =========================================================
     MOSTRAR CAPA
     =========================================================

    function mostrarCapa(src) {

        if (!previewCapa) return;

        previewCapa.innerHTML = "";

        const imagem =
            document.createElement("img");

        imagem.src = src;

        imagem.style.width = "100%";
        imagem.style.height = "100%";
        imagem.style.objectFit = "cover";
        imagem.style.borderRadius = "12px";

        previewCapa.appendChild(imagem);

    }


     =========================================================
     ÁREA DAS 5 CAPAS AUTOMÁTICAS
     =========================================================

    function criarAreaCapasAutomaticas() {

        let area =
            document.getElementById(
                "areaCapasAutomaticas"
            );

        if (area) return area;

        area =
            document.createElement("div");

        area.id =
            "areaCapasAutomaticas";

        area.style.marginTop = "15px";

        area.innerHTML =

            '<h3>🤖 Escolha uma capa automática</h3>' +

            '<p style="font-size:13px;">' +
            'Escolha uma das 5 imagens geradas pelo vídeo.' +
            '</p>' +

            '<div id="listaCapasAutomaticas" ' +
            'style="display:grid;' +
            'grid-template-columns:repeat(5,1fr);' +
            'gap:8px;">' +
            '</div>' +

            '<div style="margin-top:12px;">' +

            '<label>🎯 Escolher outro momento do vídeo</label>' +

            '<input ' +
            'type="range" ' +
            'id="sliderCapa" ' +
            'min="0" ' +
            'max="100" ' +
            'value="50" ' +
            'style="width:100%;">' +

            '<button ' +
            'type="button" ' +
            'id="gerarOutraCapa" ' +
            'style="margin-top:8px;">' +

            '🔄 Gerar outra capa' +

            '</button>' +

            '</div>';

        if (previewCapa) {

            previewCapa.parentNode.insertBefore(
                area,
                previewCapa.nextSibling
            );

        }

        return area;

    }


     =========================================================
     GERAR CAPAS DO VÍDEO
     =========================================================

    function gerarCapasDoVideo(arquivo) {

        if (!arquivo) return;

        if (
            !arquivo.type.startsWith("video/")
        ) {

            alert(
                "O arquivo selecionado não é um vídeo."
            );

            return;

        }

        videoSelecionado = arquivo;

        capaManual = false;

        const url =
            URL.createObjectURL(arquivo);

        const video =
            document.createElement("video");

        video.preload = "metadata";

        video.muted = true;

        video.playsInline = true;

        video.src = url;

        video.addEventListener(
            "loadedmetadata",
            function () {

                if (
                    !video.duration ||
                    !isFinite(video.duration)
                ) {

                    alert(
                        "Não foi possível ler a duração do vídeo."
                    );

                    URL.revokeObjectURL(url);

                    return;

                }

                criarAreaCapasAutomaticas();

                gerarCincoCapas(
                    video,
                    video.duration,
                    url
                );

            }
        );

    }


     =========================================================
     GERAR 5 CAPAS
     =========================================================

    function gerarCincoCapas(
        video,
        duracao,
        url
    ) {

        capasAutomaticas = [];

        const porcentagens = [
            0.05,
            0.20,
            0.40,
            0.60,
            0.80
        ];

        let indice = 0;

        function proxima() {

            if (
                indice >=
                porcentagens.length
            ) {

                mostrarCapasAutomaticas();

                URL.revokeObjectURL(url);

                return;

            }

            const tempo =
                Math.max(
                    0,
                    Math.min(
                        duracao - 0.1,
                        duracao *
                        porcentagens[indice]
                    )
                );

            video.currentTime = tempo;

        }


        video.addEventListener(
            "seeked",
            function capturar() {

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
                        0.85
                    );

                capasAutomaticas.push(
                    imagem
                );

                indice++;

                proxima();

            },
            {
                once: false
            }
        );

        proxima();

    }


     =========================================================
     MOSTRAR AS 5 CAPAS
     =========================================================

    function mostrarCapasAutomaticas() {

        const lista =
            document.getElementById(
                "listaCapasAutomaticas"
            );

        if (!lista) return;

        lista.innerHTML = "";

        capasAutomaticas.forEach(
            function (capa, indice) {

                const imagem =
                    document.createElement(
                        "img"
                    );

                imagem.src = capa;

                imagem.title =
                    "Capa " +
                    (indice + 1);

                imagem.style.width =
                    "100%";

                imagem.style.aspectRatio =
                    "16 / 9";

                imagem.style.objectFit =
                    "cover";

                imagem.style.borderRadius =
                    "8px";

                imagem.style.cursor =
                    "pointer";

                imagem.style.border =
                    "3px solid transparent";


                imagem.addEventListener(
                    "click",
                    function () {

                        capaSelecionada =
                            capa;

                        capaManual = false;

                        mostrarCapa(
                            capa
                        );

                        document
                            .querySelectorAll(
                                "#listaCapasAutomaticas img"
                            )
                            .forEach(
                                function (img) {

                                    img.style.border =
                                        "3px solid transparent";

                                }
                            );

                        imagem.style.border =
                            "3px solid #00c853";

                    }
                );


                lista.appendChild(
                    imagem
                );

            }
        );


        if (
            capasAutomaticas.length > 0
        ) {

            capaSelecionada =
                capasAutomaticas[0];

            mostrarCapa(
                capaSelecionada
            );

            const primeira =
                lista.querySelector(
                    "img"
                );

            if (primeira) {

                primeira.style.border =
                    "3px solid #00c853";

            }

        }

    }


     =========================================================
     ESCOLHER OUTRA CAPA PELO SLIDER
     =========================================================

    function gerarOutraCapa() {

        if (!videoSelecionado) {

            alert(
                "Primeiro selecione um vídeo."
            );

            return;

        }

        const slider =
            document.getElementById(
                "sliderCapa"
            );

        if (!slider) return;

        const porcentagem =
            Number(slider.value) / 100;

        const url =
            URL.createObjectURL(
                videoSelecionado
            );

        const video =
            document.createElement(
                "video"
            );

        video.preload = "metadata";

        video.muted = true;

        video.playsInline = true;

        video.src = url;


        video.addEventListener(
            "loadedmetadata",
            function () {

                const tempo =
                    Math.max(
                        0,
                        Math.min(
                            video.duration - 0.1,
                            video.duration *
                            porcentagem
                        )
                    );

                video.currentTime =
                    tempo;

            }
        );


        video.addEventListener(
            "seeked",
            function () {

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

                capaSelecionada =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.85
                    );

                mostrarCapa(
                    capaSelecionada
                );

                capaManual = false;

                URL.revokeObjectURL(
                    url
                );

            },
            {
                once: true
            }
        );

    }


    document.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target.id ===
                "gerarOutraCapa"
            ) {

                gerarOutraCapa();

            }

        }
    );


     =========================================================
     SELECIONAR VÍDEO
     =========================================================

    if (arquivoVideo) {

        arquivoVideo.addEventListener(
            "change",
            function () {

                const arquivo =
                    arquivoVideo.files[0];

                if (!arquivo) return;

                gerarCapasDoVideo(
                    arquivo
                );

            }
        );

    }


     =========================================================
     CRIAR TEMPORADAS
     =========================================================

    function criarTemporadas() {

        if (!listaTemporadas) return;

        listaTemporadas.innerHTML = "";

        const quantidade =
            Number(
                quantidadeTemporadas
                    ? quantidadeTemporadas.value
                    : 0
            );

        if (
            !quantidade ||
            quantidade < 1
        ) {

            return;

        }

        for (
            let i = 1;
            i <= quantidade;
            i++
        ) {

            const bloco =
                document.createElement(
                    "div"
                );

            bloco.style.marginTop =
                "15px";

            bloco.style.padding =
                "12px";

            bloco.style.border =
                "1px solid #ddd";

            bloco.style.borderRadius =
                "10px";


            bloco.innerHTML =

                "<h4>📺 Temporada " +
                i +
                "</h4>" +

                '<label>Episódios</label>' +

                '<input ' +
                'type="number" ' +
                'class="episodios-temporada" ' +
                'data-temporada="' +
                i +
                '" ' +
                'min="1" ' +
                'placeholder="Quantidade de episódios">';


            listaTemporadas.appendChild(
                bloco
            );

        }

    }


    if (quantidadeTemporadas) {

        quantidadeTemporadas.addEventListener(
            "input",
            criarTemporadas
        );

    }


    if (quantidadeEpisodios) {

        quantidadeEpisodios.addEventListener(
            "input",
            function () {

                if (
                    quantidadeTemporadas &&
                    Number(
                        quantidadeTemporadas.value
                    ) === 1
                ) {

                    criarTemporadas();

                }

            }
        );

    }


     =========================================================
     ESCAPAR HTML
     =========================================================

    function escaparHTML(texto) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            texto || "";

        return div.innerHTML;

    }


     =========================================================
     CRIAR CARD
     =========================================================

    function criarCard(conteudo) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "card";

        card.dataset.nome =
            conteudo.nome.toLowerCase();


        const capa =
            document.createElement(
                "div"
            );

        capa.className =
            "capa";


        if (conteudo.capa) {

            capa.style.backgroundImage =
                "url('" +
                conteudo.capa +
                "')";

            capa.style.backgroundSize =
                "cover";

            capa.style.backgroundPosition =
                "center";

            capa.textContent = "";

        } else {

            capa.textContent =
                conteudo.tipo === "serie"
                    ? "📺"
                    : "🎬";

        }


        const titulo =
            document.createElement(
                "h3"
            );

        titulo.textContent =
            conteudo.nome;


        const informacao =
            document.createElement(
                "p"
            );

        if (
            conteudo.tipo === "serie"
        ) {

            informacao.textContent =
                "Série • " +
                conteudo.temporadas +
                " temporada(s)";

        } else {

            informacao.textContent =
                "Filme • " +
                conteudo.ano;

        }


        const botoes =
            document.createElement(
                "div"
            );

        botoes.className =
            "botoes";


        const botaoPlay =
            document.createElement(
                "button"
            );

        botaoPlay.textContent =
            "▶️";

        botaoPlay.title =
            "Reproduzir";


        const botaoDownload =
            document.createElement(
                "button"
            );

        botaoDownload.textContent =
            "⬇️";

        botaoDownload.title =
            "Baixar";


        const botaoCompartilhar =
            document.createElement(
                "button"
            );

        botaoCompartilhar.textContent =
            "🔗";

        botaoCompartilhar.title =
            "Compartilhar";


        botaoPlay.addEventListener(
            "click",
            function () {

                reproduzirConteudo(
                    conteudo
                );

            }
        );


        botaoDownload.addEventListener(
            "click",
            function () {

                baixarConteudo(
                    conteudo
                );

            }
        );


        botaoCompartilhar.addEventListener(
            "click",
            function () {

                compartilharConteudo(
                    conteudo
                );

            }
        );


        botoes.appendChild(
            botaoPlay
        );

        botoes.appendChild(
            botaoDownload
        );

        botoes.appendChild(
            botaoCompartilhar
        );


        card.appendChild(
            capa
        );

        card.appendChild(
            titulo
        );

        card.appendChild(
            informacao
        );

        card.appendChild(
            botoes
        );


        listaFilmes.appendChild(
            card
        );

    }


     =========================================================
    REPRODUZIR
    =========================================================

    function reproduzirConteudo(
        conteudo
    ) {

        if (!conteudo.video) {

            alert(
                "Este conteúdo não possui vídeo disponível."
            );

            return;

        }

        if (!modalPlayer) return;

        videoPlayer.src =
            conteudo.video;

        tituloPlayer.textContent =
            conteudo.nome;

        descricaoPlayer.textContent =
            conteudo.descricao || "";

        modalPlayer.classList.add(
            "ativo"
        );

        modalPlayer.style.display =
            "flex";

        videoPlayer.play().catch(
            function () {}
        );

    }


    =========================================================
     FECHAR PLAYER
     =========================================================

    if (fecharPlayer) {

        fecharPlayer.addEventListener(
            "click",
            function () {

                videoPlayer.pause();

                videoPlayer.removeAttribute(
                    "src"
                );

                videoPlayer.load();

                modalPlayer.classList.remove(
                    "ativo"
                );

                modalPlayer.style.display =
                    "none";

            }
        );

    }


     =========================================================
     BAIXAR
     =========================================================

    function baixarConteudo(
        conteudo
    ) {

        if (!conteudo.video) {

            alert(
                "Não existe vídeo disponível para baixar."
            );

            return;

        }

        const link =
            document.createElement(
                "a"
            );

        link.href =
            conteudo.video;

        link.download =
            conteudo.nome +
            ".mp4";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

    }


     =========================================================
     COMPARTILHAR
     =========================================================

    function compartilharConteudo(
        conteudo
    ) {

        const texto =
            "🎬 " +
            conteudo.nome +
            " - I.M.A FILMES";

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

        } else {

            navigator.clipboard
                .writeText(
                    texto
                )
                .then(
                    function () {

                        alert(
                            "Informação copiada para compartilhar."
                        );

                    }
                )
                .catch(
                    function () {

                        alert(
                            texto
                        );

                    }
                );

        }

    }


    =========================================================
     PUBLICAR
    =========================================================

    if (salvarPublicacao) {

        salvarPublicacao.addEventListener(
            "click",
            function () {

                publicarConteudo();

            }
        );

    }


    function publicarConteudo() {

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


         -------------------------
         VALIDAÇÕES
        -------------------------

        if (!nome) {

            alert(
                "Digite o nome do filme ou série."
            );

            if (nomeConteudo) {
                nomeConteudo.focus();
            }

            return;

        }


        if (!ano) {

            alert(
                "Digite o ano do conteúdo."
            );

            if (anoConteudo) {
                anoConteudo.focus();
            }

            return;

        }


        if (!capaSelecionada) {

            alert(
                "Escolha uma capa ou gere uma capa automática."
            );

            return;

        }


        if (
            tipo === "filme" &&
            !arquivoVideo.files[0]
        ) {

            alert(
                "Selecione o vídeo do filme."
            );

            if (arquivoVideo) {
                arquivoVideo.click();
            }

            return;

        }


        if (
            tipo === "serie" &&
            !videoSelecionado
        ) {

            alert(
                "Selecione pelo menos um vídeo da série."
            );

            return;

        }


        if (
            (acesso === "venda" ||
             acesso === "aluguel") &&
            (
                !preco ||
                Number(preco) <= 0
            )
        ) {

            alert(
                "Digite um preço válido."
            );

            if (precoConteudo) {
                precoConteudo.focus();
            }

            return;

        }


        if (
            aceitarRegras &&
            !aceitarRegras.checked
        ) {

            alert(
                "Você precisa aceitar as regras da plataforma."
            );

            return;

        }


         -------------------------
         VÍDEO
         -------------------------

        let videoURL = "";

        if (
            arquivoVideo &&
            arquivoVideo.files[0]
        ) {

            videoURL =
                URL.createObjectURL(
                    arquivoVideo.files[0]
                );

        } else if (
            videoSelecionado
        ) {

            videoURL =
                URL.createObjectURL(
                    videoSelecionado
                );

        }


         -------------------------
         TEMPORADAS
         -------------------------

        let temporadas = 0;

        if (
            tipo === "serie" &&
            quantidadeTemporadas
        ) {

            temporadas =
                Number(
                    quantidadeTemporadas.value
                ) || 1;

        }


         -------------------------
         OBJETO
         -------------------------

        const conteudo = {

            id:
                Date.now(),

            nome:
                nome,

            descricao:
                descricao,

            ano:
                ano,

            tipo:
                tipo,

            acesso:
                acesso,

            preco:
                preco,

            capa:
                capaSelecionada,

            video:
                videoURL,

            temporadas:
                temporadas

        };


       -------------------------
         GUARDAR
         -------------------------

        conteudos.push(
            conteudo
        );


         -------------------------
         CRIAR CARD
         -------------------------

        criarCard(
            conteudo
        );


         -------------------------
         FECHAR
         -------------------------

        alert(
            "🎉 Conteúdo publicado com sucesso!"
        );

        fecharPublicacao();

        limparFormulario();

    }


     =========================================================
     LIMPAR FORMULÁRIO
     =========================================================

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

        if (precoConteudo) {
            precoConteudo.value = "";
        }

        if (arquivoCapa) {
            arquivoCapa.value = "";
        }

        if (arquivoVideo) {
            arquivoVideo.value = "";
        }

        if (aceitarRegras) {
            aceitarRegras.checked = false;
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

        capaManual = false;

        capaSelecionada = "";

        videoSelecionado = null;

        capasAutomaticas = [];

    }


     =========================================================
     PESQUISA
     =========================================================

    if (campoPesquisa) {

        campoPesquisa.addEventListener(
            "input",
            function () {

                const pesquisa =
                    campoPesquisa.value
                        .toLowerCase()
                        .trim();

                const cards =
                    document.querySelectorAll(
                        "#listaFilmes .card"
                    );

                cards.forEach(
                    function (card) {

                        const nome =
                            card.dataset.nome ||
                            "";

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


     =========================================================
     ESC PARA FECHAR
     =========================================================

    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape"
            ) {

                if (
                    modalPublicacao
                ) {

                    fecharPublicacao();

                }

                if (
                    modalPlayer
                ) {

                    modalPlayer.style.display =
                        "none";

                    if (videoPlayer) {

                        videoPlayer.pause();

                    }

                }

            }

        }
    );


     =========================================================
     INICIALIZAÇÃO
     =========================================================

    atualizarTipoConteudo();

    atualizarPreco();


    console.log(
        "✅ I.M.A FILMES carregado corretamente."
    );

});
```

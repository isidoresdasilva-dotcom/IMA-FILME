/* =========================================================
   I.M.A FILMES
   APP.JS - SISTEMA DE PUBLICAÇÃO E REPRODUÇÃO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS DO HTML
       ===================================================== */

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
    const quantidadeTemporadas =
        document.getElementById("quantidadeTemporadas");

    const quantidadeEpisodios =
        document.getElementById("quantidadeEpisodios");

    const listaTemporadas =
        document.getElementById("listaTemporadas");

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


    /* =====================================================
       VARIÁVEIS
       ===================================================== */

    let capaSelecionada = null;
    let capaURL = null;

    let videoSelecionado = null;
    let videoURL = null;

    let temporadaDados = [];


    /* =====================================================
       ABRIR MODAL DE PUBLICAÇÃO
       ===================================================== */

    function abrirModalPublicacao() {
        modalPublicacao.classList.add("ativo");
        document.body.classList.add("modal-aberto");
    }

    if (botaoEnviar) {
        botaoEnviar.addEventListener("click", abrirModalPublicacao);
    }

    if (botaoEnviarMenu) {
        botaoEnviarMenu.addEventListener("click", abrirModalPublicacao);
    }


    /* =====================================================
       FECHAR MODAL DE PUBLICAÇÃO
       ===================================================== */

    function fecharModalPublicacao() {
        modalPublicacao.classList.remove("ativo");
        document.body.classList.remove("modal-aberto");
    }

    if (fecharModal) {
        fecharModal.addEventListener("click", fecharModalPublicacao);
    }

    if (cancelarPublicacao) {
        cancelarPublicacao.addEventListener(
            "click",
            fecharModalPublicacao
        );
    }


    /* =====================================================
       TIPO DE CONTEÚDO
       FILME / SÉRIE
       ===================================================== */

    function atualizarTipoConteudo() {

        if (tipoConteudo.value === "serie") {

            areaSerie.style.display = "block";

            // Para série usamos os episódios
            if (areaVideo) {
                areaVideo.style.display = "none";
            }

        } else {

            areaSerie.style.display = "none";

            if (areaVideo) {
                areaVideo.style.display = "block";
            }

            listaTemporadas.innerHTML = "";
            temporadaDados = [];
        }
    }

    if (tipoConteudo) {
        tipoConteudo.addEventListener(
            "change",
            atualizarTipoConteudo
        );
    }


    /* =====================================================
       TIPO DE ACESSO
       GRATUITO / VENDA / ALUGUEL
       ===================================================== */

    function atualizarPreco() {

        if (
            tipoAcesso.value === "venda" ||
            tipoAcesso.value === "aluguel"
        ) {

            areaPreco.style.display = "block";

        } else {

            areaPreco.style.display = "none";
            precoConteudo.value = "";
        }
    }

    if (tipoAcesso) {
        tipoAcesso.addEventListener(
            "change",
            atualizarPreco
        );
    }


    /* =====================================================
       PRÉ-VISUALIZAÇÃO DA CAPA
       ===================================================== */

    if (arquivoCapa) {

        arquivoCapa.addEventListener("change", () => {

            const arquivo = arquivoCapa.files[0];

            if (!arquivo) {
                return;
            }

            if (!arquivo.type.startsWith("image/")) {

                alert("Por favor, escolha uma imagem válida.");
                arquivoCapa.value = "";
                return;
            }

            capaSelecionada = arquivo;

            if (capaURL) {
                URL.revokeObjectURL(capaURL);
            }

            capaURL = URL.createObjectURL(arquivo);

            previewCapa.innerHTML = `
                <img
                    src="${capaURL}"
                    alt="Pré-visualização da capa"
                >
            `;
        });
    }


    /* =====================================================
       GERAR TEMPORADAS E EPISÓDIOS
       ===================================================== */

    function gerarTemporadas() {

        const totalTemporadas =
            parseInt(quantidadeTemporadas.value);

        const totalEpisodios =
            parseInt(quantidadeEpisodios.value);

        listaTemporadas.innerHTML = "";
        temporadaDados = [];

        if (!totalTemporadas || totalTemporadas < 1) {
            return;
        }

        if (!totalEpisodios || totalEpisodios < 1) {
            return;
        }

        for (let t = 1; t <= totalTemporadas; t++) {

            const temporada = {
                numero: t,
                episodios: []
            };

            const bloco = document.createElement("div");

            bloco.className = "temporada";

            bloco.innerHTML = `
                <h4>📚 Temporada ${t}</h4>
                <div class="episodios"></div>
            `;

            const episodiosDiv =
                bloco.querySelector(".episodios");

            for (let e = 1; e <= totalEpisodios; e++) {

                temporada.episodios.push({
                    numero: e,
                    titulo: `Episódio ${e}`,
                    arquivo: null,
                    url: null
                });

                const episodio = document.createElement("div");

                episodio.className = "episodio";

                episodio.innerHTML = `
                    <strong>🎞️ Episódio ${e}</strong>

                    <input
                        type="text"
                        class="titulo-episodio"
                        placeholder="Nome do episódio"
                        value="Episódio ${e}"
                        data-temporada="${t}"
                        data-episodio="${e}"
                    >

                    <input
                        type="file"
                        class="arquivo-episodio"
                        accept="video/*"
                        data-temporada="${t}"
                        data-episodio="${e}"
                    >
                `;

                episodiosDiv.appendChild(episodio);
            }

            listaTemporadas.appendChild(bloco);

            temporadaDados.push(temporada);
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


    /* =====================================================
       VALIDAR VÍDEO
       ===================================================== */

    if (arquivoVideo) {

        arquivoVideo.addEventListener("change", () => {

            const arquivo = arquivoVideo.files[0];

            if (!arquivo) {
                videoSelecionado = null;
                videoURL = null;
                return;
            }

            if (!arquivo.type.startsWith("video/")) {

                alert("Selecione um arquivo de vídeo válido.");

                arquivoVideo.value = "";

                videoSelecionado = null;
                videoURL = null;

                return;
            }

            videoSelecionado = arquivo;

            if (videoURL) {
                URL.revokeObjectURL(videoURL);
            }

            videoURL = URL.createObjectURL(arquivo);
        });
    }


    /* =====================================================
       PUBLICAR CONTEÚDO
       ===================================================== */

    if (salvarPublicacao) {

        salvarPublicacao.addEventListener(
            "click",
            publicarConteudo
        );
    }


    function publicarConteudo() {

        const tipo = tipoConteudo.value;

        const nome = nomeConteudo.value.trim();

        const descricao =
            descricaoConteudo.value.trim();

        const ano =
            anoConteudo.value.trim();

        const acesso =
            tipoAcesso.value;

        /* ---------------------------------------------
           VALIDAÇÕES
           --------------------------------------------- */

        if (!nome) {

            alert("⚠️ Digite o nome do filme ou série.");
            nomeConteudo.focus();
            return;
        }

        if (!ano) {

            alert("⚠️ Digite o ano do conteúdo.");
            anoConteudo.focus();
            return;
        }

        if (!capaSelecionada) {

            alert("⚠️ Escolha uma capa para o conteúdo.");
            arquivoCapa.focus();
            return;
        }

        if (!aceitarRegras.checked) {

            alert(
                "⚠️ Você precisa confirmar que possui os direitos de publicação."
            );

            aceitarRegras.focus();
            return;
        }

        /* ---------------------------------------------
           PREÇO
           --------------------------------------------- */

        let preco = "";

        if (
            acesso === "venda" ||
            acesso === "aluguel"
        ) {

            preco = precoConteudo.value;

            if (!preco || Number(preco) <= 0) {

                alert(
                    "⚠️ Digite um preço válido."
                );

                precoConteudo.focus();
                return;
            }
        }


        /* ---------------------------------------------
           FILME
           --------------------------------------------- */

        if (tipo === "filme") {

            if (!videoSelecionado) {

                alert(
                    "⚠️ Escolha o vídeo do filme."
                );

                arquivoVideo.focus();
                return;
            }

            criarCardFilme({
                nome,
                descricao,
                ano,
                capa: capaURL,
                video: videoURL,
                acesso,
                preco
            });
        }


        /* ---------------------------------------------
           SÉRIE
           --------------------------------------------- */

        if (tipo === "serie") {

            const episodiosArquivos =
                document.querySelectorAll(
                    ".arquivo-episodio"
                );

            let quantidadeArquivos = 0;

            episodiosArquivos.forEach(input => {

                if (
                    input.files &&
                    input.files.length > 0
                ) {
                    quantidadeArquivos++;
                }
            });

            if (quantidadeArquivos === 0) {

                alert(
                    "⚠️ Escolha pelo menos um vídeo de episódio."
                );

                return;
            }

            const serie =
                montarDadosSerie();

            criarCardSerie({
                nome,
                descricao,
                ano,
                capa: capaURL,
                acesso,
                preco,
                temporadas: serie
            });
        }


        /* ---------------------------------------------
           SUCESSO
           --------------------------------------------- */

        alert(
            "🎉 Conteúdo publicado com sucesso no I.M.A Filmes!"
        );

        fecharModalPublicacao();

        limparFormulario();
    }


    /* =====================================================
       MONTAR DADOS DA SÉRIE
       ===================================================== */

    function montarDadosSerie() {

        const temporadas = [];

        const blocos =
            document.querySelectorAll(".temporada");

        blocos.forEach((bloco, indiceTemporada) => {

            const temporada = {
                numero: indiceTemporada + 1,
                episodios: []
            };

            const episodios =
                bloco.querySelectorAll(".episodio");

            episodios.forEach(
                (episodio, indiceEpisodio) => {

                    const tituloInput =
                        episodio.querySelector(
                            ".titulo-episodio"
                        );

                    const arquivoInput =
                        episodio.querySelector(
                            ".arquivo-episodio"
                        );

                    const arquivo =
                        arquivoInput.files[0];

                    let url = null;

                    if (arquivo) {
                        url = URL.createObjectURL(
                            arquivo
                        );
                    }

                    temporada.episodios.push({
                        numero: indiceEpisodio + 1,

                        titulo:
                            tituloInput.value.trim() ||
                            `Episódio ${indiceEpisodio + 1}`,

                        arquivo,
                        url
                    });
                }
            );

            temporadas.push(temporada);
        });

        return temporadas;
    }


    /* =====================================================
       CRIAR CARD DE FILME
       ===================================================== */

    function criarCardFilme(dados) {

        const artigo =
            document.createElement("article");

        artigo.className = "card";

        artigo.dataset.nome =
            dados.nome.toLowerCase();

        const capaHTML = dados.capa
            ? `
                <img
                    src="${dados.capa}"
                    alt="${escaparHTML(dados.nome)}"
                >
              `
            : "🎬";

        artigo.innerHTML = `
            <div class="capa">
                ${capaHTML}
            </div>

            <h3>${escaparHTML(dados.nome)}</h3>

            <p>
                🎬 Filme • ${escaparHTML(dados.ano)}
            </p>

            <p class="tipo-acesso">
                ${mostrarAcesso(
                    dados.acesso,
                    dados.preco
                )}
            </p>

            <div class="botoes">

                <button
                    class="assistir"
                    title="Assistir"
                >
                    ▶️
                </button>

                <button
                    class="baixar"
                    title="Baixar"
                >
                    ⬇️
                </button>

                <button
                    class="partilhar"
                    title="Partilhar"
                >
                    🔗
                </button>

            </div>
        `;

        listaFilmes.prepend(artigo);


        /* ---------------------------------------------
           ASSISTIR
           --------------------------------------------- */

        artigo
            .querySelector(".assistir")
            .addEventListener("click", () => {

                abrirPlayer(
                    dados.nome,
                    dados.descricao,
                    dados.video
                );
            });


        /* ---------------------------------------------
           BAIXAR
           --------------------------------------------- */

        artigo
            .querySelector(".baixar")
            .addEventListener("click", () => {

                baixarArquivo(
                    dados.video,
                    dados.nome
                );
            });


        /* ---------------------------------------------
           PARTILHAR
           --------------------------------------------- */

        artigo
            .querySelector(".partilhar")
            .addEventListener("click", () => {

                partilharConteudo(
                    dados.nome
                );
            });
    }


    /* =====================================================
       CRIAR CARD DE SÉRIE
       ===================================================== */

    function criarCardSerie(dados) {

        const artigo =
            document.createElement("article");

        artigo.className = "card";

        artigo.dataset.nome =
            dados.nome.toLowerCase();

        const capaHTML = dados.capa
            ? `
                <img
                    src="${dados.capa}"
                    alt="${escaparHTML(dados.nome)}"
                >
              `
            : "📺";

        artigo.innerHTML = `
            <div class="capa">
                ${capaHTML}
            </div>

            <h3>${escaparHTML(dados.nome)}</h3>

            <p>
                📺 Série • ${escaparHTML(dados.ano)}
            </p>

            <p>
                📚 ${dados.temporadas.length}
                temporada(s)
            </p>

            <p class="tipo-acesso">
                ${mostrarAcesso(
                    dados.acesso,
                    dados.preco
                )}
            </p>

            <div class="botoes">

                <button
                    class="assistir"
                    title="Ver episódios"
                >
                    ▶️
                </button>

                <button
                    class="partilhar"
                    title="Partilhar"
                >
                    🔗
                </button>

            </div>
        `;

        listaFilmes.prepend(artigo);


        artigo
            .querySelector(".assistir")
            .addEventListener("click", () => {

                abrirListaEpisodios(dados);
            });


        artigo
            .querySelector(".partilhar")
            .addEventListener("click", () => {

                partilharConteudo(
                    dados.nome
                );
            });
    }


    /* =====================================================
       MOSTRAR TIPO DE ACESSO
       ===================================================== */

    function mostrarAcesso(acesso, preco) {

        if (acesso === "gratis") {
            return "🆓 Gratuito";
        }

        if (acesso === "venda") {
            return `💰 Venda: ${preco} Kz`;
        }

        if (acesso === "aluguel") {
            return `🎟️ Aluguel: ${preco} Kz`;
        }

        return "";
    }


    /* =====================================================
       PLAYER
       ===================================================== */

    function abrirPlayer(nome, descricao, url) {

        if (!url) {

            alert(
                "⚠️ O vídeo não está disponível."
            );

            return;
        }

        tituloPlayer.textContent = nome;

        descricaoPlayer.textContent =
            descricao || "Sem descrição.";

        videoPlayer.src = url;

        modalPlayer.classList.add("ativo");

        document.body.classList.add("modal-aberto");

        videoPlayer.play().catch(() => {});
    }


    /* =====================================================
       FECHAR PLAYER
       ===================================================== */

    function fecharVideo() {

        videoPlayer.pause();

        videoPlayer.removeAttribute("src");

        videoPlayer.load();

        modalPlayer.classList.remove("ativo");

        document.body.classList.remove("modal-aberto");
    }

    if (fecharPlayer) {
        fecharPlayer.addEventListener(
            "click",
            fecharVideo
        );
    }


    /* =====================================================
       LISTA DE EPISÓDIOS DA SÉRIE
       ===================================================== */

    function abrirListaEpisodios(serie) {

        let mensagem =
            `📺 ${serie.nome}\n\n`;

        serie.temporadas.forEach(temporada => {

            mensagem +=
                `📚 Temporada ${temporada.numero}\n`;

            temporada.episodios.forEach(episodio => {

                mensagem +=
                    `▶️ ${episodio.numero}. ${episodio.titulo}\n`;
            });

            mensagem += "\n";
        });

        const escolha =
            prompt(
                mensagem +
                "Digite o número do episódio que deseja assistir:"
            );

        if (!escolha) {
            return;
        }

        const numero =
            parseInt(escolha);

        let encontrado = null;

        serie.temporadas.forEach(temporada => {

            temporada.episodios.forEach(episodio => {

                if (
                    episodio.numero === numero
                ) {
                    encontrado = episodio;
                }
            });
        });

        if (!encontrado) {

            alert(
                "⚠️ Episódio não encontrado."
            );

            return;
        }

        if (!encontrado.url) {

            alert(
                "⚠️ O vídeo deste episódio não está disponível."
            );

            return;
        }

        abrirPlayer(
            encontrado.titulo,
            `Série: ${serie.nome}`,
            encontrado.url
        );
    }


    /* =====================================================
       DOWNLOAD
       ===================================================== */

    function baixarArquivo(url, nome) {

        if (!url) {

            alert(
                "⚠️ Arquivo não disponível."
            );

            return;
        }

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `${nome}.mp4`;

        document.body.appendChild(link);

        link.click();

        link.remove();
    }


    /* =====================================================
       PARTILHAR
       ===================================================== */

    async function partilharConteudo(nome) {

        const texto =
            `🎬 Confira "${nome}" no I.M.A Filmes!`;

        try {

            if (
                navigator.share
            ) {

                await navigator.share({
                    title: "I.M.A Filmes",
                    text: texto
                });

            } else {

                await navigator.clipboard.writeText(
                    texto
                );

                alert(
                    "🔗 Texto copiado para partilhar!"
                );
            }

        } catch (erro) {

            console.log(
                "Partilha cancelada."
            );
        }
    }


    /* =====================================================
       PESQUISA
       ===================================================== */

    if (campoPesquisa) {

        campoPesquisa.addEventListener(
            "input",
            () => {

                const pesquisa =
                    campoPesquisa.value
                        .toLowerCase()
                        .trim();

                const cards =
                    document.querySelectorAll(
                        ".card"
                    );

                cards.forEach(card => {

                    const texto =
                        card.textContent
                            .toLowerCase();

                    if (
                        texto.includes(pesquisa)
                    ) {

                        card.style.display = "";

                    } else {

                        card.style.display =
                            "none";
                    }
                });
            }
        );
    }


    /* =====================================================
       LIMPAR FORMULÁRIO
       ===================================================== */

    function limparFormulario() {

        nomeConteudo.value = "";
        descricaoConteudo.value = "";
        anoConteudo.value = "";

        tipoConteudo.value = "filme";
        tipoAcesso.value = "gratis";

        arquivoCapa.value = "";
        arquivoVideo.value = "";

        quantidadeTemporadas.value = "";
        quantidadeEpisodios.value = "";

        precoConteudo.value = "";

        aceitarRegras.checked = false;

        previewCapa.innerHTML =
            "Pré-visualização da capa";

        listaTemporadas.innerHTML = "";

        areaSerie.style.display = "none";
        areaPreco.style.display = "none";
        areaVideo.style.display = "block";

        capaSelecionada = null;
        videoSelecionado = null;

        if (capaURL) {
            URL.revokeObjectURL(capaURL);
            capaURL = null;
        }

        if (videoURL) {
            URL.revokeObjectURL(videoURL);
            videoURL = null;
        }

        temporadaDados = [];
    }


    /* =====================================================
       ESCAPAR HTML
       PROTEÇÃO CONTRA HTML INJETADO
       ===================================================== */

    function escaparHTML(texto) {

        const div =
            document.createElement("div");

        div.textContent =
            texto;

        return div.innerHTML;
    }


    /* =====================================================
       FECHAR MODAIS AO CLICAR FORA
       ===================================================== */

    if (modalPublicacao) {

        modalPublicacao.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
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
            event => {

                if (
                    event.target ===
                    modalPlayer
                ) {

                    fecharVideo();
                }
            }
        );
    }


    /* =====================================================
       TECLA ESC
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                if (
                    modalPublicacao.classList.contains(
                        "ativo"
                    )
                ) {

                    fecharModalPublicacao();
                }

                if (
                    modalPlayer.classList.contains(
                        "ativo"
                    )
                ) {

                    fecharVideo();
                }
            }
        }
    );


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    atualizarTipoConteudo();
    atualizarPreco();

    console.log(
        "🎬 I.M.A Filmes iniciado com sucesso!"
    );

});

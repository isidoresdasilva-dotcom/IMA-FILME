// =====================================================
// I.M.A FILMES - APP.JS
// Sistema de publicação de filmes e séries
// =====================================================

// ------------------------------
// ELEMENTOS DO HTML
// ------------------------------

const botaoEnviar = document.getElementById("botaoEnviar");
const botaoEnviarMenu = document.getElementById("botaoEnviarMenu");

const modalPublicacao = document.getElementById("modalPublicacao");
const fecharModal = document.getElementById("fecharModal");
const cancelarPublicacao = document.getElementById("cancelarPublicacao");

const tipoConteudo = document.getElementById("tipoConteudo");
const areaSerie = document.getElementById("areaSerie");

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

const salvarPublicacao =
    document.getElementById("salvarPublicacao");

const listaFilmes =
    document.getElementById("listaFilmes");

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


// =====================================================
// ABRIR JANELA DE PUBLICAÇÃO
// =====================================================

function abrirPublicacao() {

    modalPublicacao.style.display = "flex";

}

botaoEnviar.addEventListener("click", abrirPublicacao);

botaoEnviarMenu.addEventListener("click", abrirPublicacao);


// =====================================================
// FECHAR JANELA DE PUBLICAÇÃO
// =====================================================

function fecharPublicacao() {

    modalPublicacao.style.display = "none";

}

fecharModal.addEventListener("click", fecharPublicacao);

cancelarPublicacao.addEventListener("click", fecharPublicacao);


// =====================================================
// MOSTRAR / ESCONDER ÁREA DE SÉRIE
// =====================================================

function verificarTipoConteudo() {

    if (tipoConteudo.value === "serie") {

        areaSerie.style.display = "block";

    } else {

        areaSerie.style.display = "none";

        listaTemporadas.innerHTML = "";

    }

}

tipoConteudo.addEventListener(
    "change",
    verificarTipoConteudo
);


// =====================================================
// MOSTRAR / ESCONDER PREÇO
// =====================================================

function verificarTipoAcesso() {

    if (tipoAcesso.value === "gratis") {

        areaPreco.style.display = "none";

        precoConteudo.value = "";

    } else {

        areaPreco.style.display = "block";

    }

}

tipoAcesso.addEventListener(
    "change",
    verificarTipoAcesso
);


// =====================================================
// PRÉ-VISUALIZAÇÃO DA CAPA
// =====================================================

arquivoCapa.addEventListener("change", function () {

    const arquivo = this.files[0];

    if (!arquivo) {

        previewCapa.innerHTML =
            "Pré-visualização da capa";

        return;

    }

    if (!arquivo.type.startsWith("image/")) {

        alert("Selecione uma imagem para a capa.");

        this.value = "";

        return;

    }

    const url = URL.createObjectURL(arquivo);

    previewCapa.innerHTML = `
        <img
            src="${url}"
            alt="Capa do conteúdo"
        >
    `;

});


// =====================================================
// CRIAR CAMPOS DAS TEMPORADAS
// =====================================================

quantidadeTemporadas.addEventListener(
    "input",
    gerarTemporadas
);

quantidadeEpisodios.addEventListener(
    "input",
    gerarTemporadas
);


function gerarTemporadas() {

    if (tipoConteudo.value !== "serie") {

        return;

    }

    const totalTemporadas =
        parseInt(quantidadeTemporadas.value);

    const totalEpisodios =
        parseInt(quantidadeEpisodios.value);

    listaTemporadas.innerHTML = "";

    if (
        !totalTemporadas ||
        totalTemporadas < 1
    ) {

        return;

    }

    for (
        let i = 1;
        i <= totalTemporadas;
        i++
    ) {

        const temporada =
            document.createElement("div");

        temporada.className =
            "temporada-bloco";

        temporada.innerHTML = `
            <h4>
                📺 Temporada ${i}
            </h4>

            <label>
                Número de episódios
            </label>

            <input
                type="number"
                class="episodios-temporada"
                min="1"
                value="${totalEpisodios || 1}"
                data-temporada="${i}"
            >

            <div
                class="lista-episodios"
                data-lista="${i}"
            ></div>
        `;

        listaTemporadas.appendChild(
            temporada
        );

        criarEpisodios(
            temporada,
            i,
            totalEpisodios || 1
        );

    }

    adicionarEventosEpisodios();

}


// =====================================================
// CRIAR EPISÓDIOS
// =====================================================

function criarEpisodios(
    temporadaElemento,
    numeroTemporada,
    totalEpisodios
) {

    const lista =
        temporadaElemento.querySelector(
            ".lista-episodios"
        );

    lista.innerHTML = "";

    for (
        let ep = 1;
        ep <= totalEpisodios;
        ep++
    ) {

        const episodio =
            document.createElement("div");

        episodio.className =
            "episodio-bloco";

        episodio.innerHTML = `
            <label>
                🎞️ Episódio ${ep}
            </label>

            <input
                type="text"
                class="nome-episodio"
                placeholder="Nome do episódio"
                value="Episódio ${ep}"
            >

            <input
                type="file"
                class="arquivo-episodio"
                accept="video/*"
            >
        `;

        lista.appendChild(
            episodio
        );

    }

}


// =====================================================
// EVENTOS DOS CAMPOS DE EPISÓDIOS
// =====================================================

function adicionarEventosEpisodios() {

    const campos =
        document.querySelectorAll(
            ".episodios-temporada"
        );

    campos.forEach(campo => {

        campo.addEventListener(
            "input",
            function () {

                const quantidade =
                    parseInt(this.value);

                const temporada =
                    this.dataset.temporada;

                const bloco =
                    this.closest(
                        ".temporada-bloco"
                    );

                if (
                    !quantidade ||
                    quantidade < 1
                ) {

                    return;

                }

                criarEpisodios(
                    bloco,
                    temporada,
                    quantidade
                );

            }
        );

    });

}


// =====================================================
// PUBLICAR CONTEÚDO
// =====================================================

salvarPublicacao.addEventListener(
    "click",
    publicarConteudo
);


function publicarConteudo() {

    const tipo =
        tipoConteudo.value;

    const nome =
        nomeConteudo.value.trim();

    const descricao =
        descricaoConteudo.value.trim();

    const ano =
        anoConteudo.value;

    const capa =
        arquivoCapa.files[0];

    const video =
        arquivoVideo.files[0];


    // ------------------------------
    // VALIDAÇÕES
    // ------------------------------

    if (!nome) {

        alert(
            "Digite o nome do filme ou série."
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
            "Digite o ano do conteúdo."
        );

        anoConteudo.focus();

        return;

    }


    if (!capa) {

        alert(
            "Escolha uma capa para o conteúdo."
        );

        return;

    }


    if (!aceitarRegras.checked) {

        alert(
            "Você precisa aceitar as regras do I.M.A Filmes."
        );

        return;

    }


    // ------------------------------
    // PREÇO
    // ------------------------------

    if (
        tipoAcesso.value !== "gratis" &&
        (
            !precoConteudo.value ||
            Number(precoConteudo.value) <= 0
        )
    ) {

        alert(
            "Digite um preço válido."
        );

        precoConteudo.focus();

        return;

    }


    // ------------------------------
    // FILME
    // ------------------------------

    if (tipo === "filme") {

        if (!video) {

            alert(
                "Escolha o vídeo do filme."
            );

            return;

        }

        criarCardFilme({
            nome: nome,
            descricao: descricao,
            ano: ano,
            capa: capa,
            video: video,
            acesso: tipoAcesso.value,
            preco: precoConteudo.value
        });

    }


    // ------------------------------
    // SÉRIE
    // ------------------------------

    if (tipo === "serie") {

        const temporadas =
            document.querySelectorAll(
                ".temporada-bloco"
            );

        if (temporadas.length === 0) {

            alert(
                "Informe pelo menos uma temporada."
            );

            return;

        }


        let episodiosEncontrados = 0;

        temporadas.forEach(
            temporada => {

                const arquivos =
                    temporada.querySelectorAll(
                        ".arquivo-episodio"
                    );

                arquivos.forEach(
                    arquivo => {

                        if (arquivo.files[0]) {

                            episodiosEncontrados++;

                        }

                    }
                );

            }
        );


        if (episodiosEncontrados === 0) {

            alert(
                "Escolha pelo menos um vídeo de episódio."
            );

            return;

        }


        criarCardSerie({
            nome: nome,
            descricao: descricao,
            ano: ano,
            capa: capa,
            temporadas: temporadas,
            acesso: tipoAcesso.value,
            preco: precoConteudo.value
        });

    }


    alert(
        "✅ Conteúdo publicado com sucesso!"
    );

    fecharPublicacao();

    limparFormulario();

}


// =====================================================
// CRIAR CARD DE FILME
// =====================================================

function criarCardFilme(dados) {

    const artigo =
        document.createElement("article");

    artigo.className = "card";


    const capaUrl =
        URL.createObjectURL(
            dados.capa
        );

    const videoUrl =
        URL.createObjectURL(
            dados.video
        );


    let acessoTexto =
        "🆓 Gratuito";


    if (dados.acesso === "venda") {

        acessoTexto =
            `💰 Venda • ${dados.preco} Kz`;

    }


    if (dados.acesso === "aluguel") {

        acessoTexto =
            `🎟️ Aluguel • ${dados.preco} Kz`;

    }


    artigo.innerHTML = `
        <div class="capa">

            <img
                src="${capaUrl}"
                alt="${dados.nome}"
            >

        </div>

        <h3>
            ${escaparHTML(dados.nome)}
        </h3>

        <p>
            🎬 Filme • ${dados.ano}
        </p>

        <p>
            ${acessoTexto}
        </p>

        <div class="botoes">

            <button class="assistir">
                ▶️
            </button>

            <button class="baixar">
                ⬇️
            </button>

            <button class="partilhar">
                🔗
            </button>

        </div>
    `;


    listaFilmes.prepend(
        artigo
    );


    artigo
        .querySelector(".assistir")
        .addEventListener(
            "click",
            function () {

                abrirPlayer(
                    videoUrl,
                    dados.nome,
                    dados.descricao
                );

            }
        );


    artigo
        .querySelector(".baixar")
        .addEventListener(
            "click",
            function () {

                baixarVideo(
                    videoUrl,
                    dados.nome
                );

            }
        );


    artigo
        .querySelector(".partilhar")
        .addEventListener(
            "click",
            function () {

                partilharConteudo(
                    videoUrl,
                    dados.nome
                );

            }
        );

}


// =====================================================
// CRIAR CARD DE SÉRIE
// =====================================================

function criarCardSerie(dados) {

    const artigo =
        document.createElement("article");

    artigo.className =
        "card";


    const capaUrl =
        URL.createObjectURL(
            dados.capa
        );


    const episodios = [];


    dados.temporadas.forEach(
        temporada => {

            const numeroTemporada =
                temporada
                    .querySelector(
                        ".episodios-temporada"
                    )
                    .value;


            const arquivos =
                temporada.querySelectorAll(
                    ".arquivo-episodio"
                );


            const nomes =
                temporada.querySelectorAll(
                    ".nome-episodio"
                );


            arquivos.forEach(
                (campo, indice) => {

                    const arquivo =
                        campo.files[0];

                    if (!arquivo) {

                        return;

                    }


                    const url =
                        URL.createObjectURL(
                            arquivo
                        );


                    episodios.push({

                        temporada:
                            numeroTemporada,

                        episodio:
                            indice + 1,

                        nome:
                            nomes[indice]
                                ? nomes[indice].value
                                : `Episódio ${indice + 1}`,

                        url: url

                    });

                }
            );

        }
    );


    artigo.innerHTML = `
        <div class="capa">

            <img
                src="${capaUrl}"
                alt="${dados.nome}"
            >

        </div>

        <h3>
            ${escaparHTML(dados.nome)}
        </h3>

        <p>
            📺 Série • ${dados.ano}
        </p>

        <p>
            ${episodios.length}
            episódio(s) publicado(s)
        </p>

        <div class="botoes">

            <button class="assistir-serie">
                ▶️
            </button>

            <button class="partilhar">
                🔗
            </button>

        </div>
    `;


    listaFilmes.prepend(
        artigo
    );


    artigo
        .querySelector(".assistir-serie")
        .addEventListener(
            "click",
            function () {

                abrirSerie(
                    dados.nome,
                    dados.descricao,
                    episodios
                );

            }
        );


    artigo
        .querySelector(".partilhar")
        .addEventListener(
            "click",
            function () {

                if (
                    navigator.clipboard
                ) {

                    navigator.clipboard
                        .writeText(
                            dados.nome
                        )
                        .then(
                            () => {

                                alert(
                                    "Nome da série copiado. O link permanente será criado quando ligarmos o sistema ao servidor."
                                );

                            }
                        );

                }

            }
        );

}


// =====================================================
// ABRIR PLAYER
// =====================================================

function abrirPlayer(
    url,
    titulo,
    descricao
) {

    videoPlayer.src = url;

    tituloPlayer.textContent =
        titulo;

    descricaoPlayer.textContent =
        descricao;

    modalPlayer.style.display =
        "flex";

}


function abrirSerie(
    titulo,
    descricao,
    episodios
) {

    if (!episodios.length) {

        alert(
            "Esta série ainda não possui episódios."
        );

        return;

    }


    const primeiro =
        episodios[0];


    abrirPlayer(
        primeiro.url,
        `${titulo} - T${primeiro.temporada} EP${primeiro.episodio}`,
        descricao
    );

}


// =====================================================
// FECHAR PLAYER
// =====================================================

fecharPlayer.addEventListener(
    "click",
    fecharVideo
);


function fecharVideo() {

    videoPlayer.pause();

    videoPlayer.src = "";

    modalPlayer.style.display =
        "none";

}


// =====================================================
// DOWNLOAD
// =====================================================

function baixarVideo(
    url,
    nome
) {

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `${nome}.mp4`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

}


// =====================================================
// PARTILHAR
// =====================================================

async function partilharConteudo(
    url,
    nome
) {

    try {

        if (
            navigator.share
        ) {

            await navigator.share({

                title:
                    `I.M.A Filmes - ${nome}`,

                text:
                    `Confira ${nome} no I.M.A Filmes.`,

                url: url

            });

            return;

        }


        await navigator.clipboard.writeText(
            url
        );


        alert(
            "Link temporário copiado!"
        );


    } catch (erro) {

        alert(
            "Não foi possível partilhar."
        );

    }

}


// =====================================================
// LIMPAR FORMULÁRIO
// =====================================================

function limparFormulario() {

    nomeConteudo.value = "";

    descricaoConteudo.value = "";

    anoConteudo.value = "";

    arquivoCapa.value = "";

    arquivoVideo.value = "";

    quantidadeTemporadas.value = "";

    quantidadeEpisodios.value = "";

    precoConteudo.value = "";

    aceitarRegras.checked = false;

    previewCapa.innerHTML =
        "Pré-visualização da capa";

    listaTemporadas.innerHTML = "";

    tipoConteudo.value =
        "filme";

    tipoAcesso.value =
        "gratis";

    areaPreco.style.display =
        "none";

    verificarTipoConteudo();

}


// =====================================================
// PROTEÇÃO CONTRA HTML MALICIOSO
// =====================================================

function escaparHTML(texto) {

    const div =
        document.createElement("div");

    div.textContent =
        texto;

    return div.innerHTML;

}


// =====================================================
// PESQUISA
// =====================================================

const campoPesquisa =
    document.getElementById(
        "campoPesquisa"
    );


campoPesquisa.addEventListener(
    "input",
    function () {

        const pesquisa =
            this.value
                .toLowerCase()
                .trim();


        const cards =
            listaFilmes.querySelectorAll(
                ".card"
            );


        cards.forEach(
            card => {

                const texto =
                    card.textContent
                        .toLowerCase();


                if (
                    texto.includes(
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


// =====================================================
// FECHAR MODAIS CLICANDO FORA
// =====================================================

window.addEventListener(
    "click",
    function (evento) {

        if (
            evento.target ===
            modalPublicacao
        ) {

            fecharPublicacao();

        }


        if (
            evento.target ===
            modalPlayer
        ) {

            fecharVideo();

        }

    }
);


// =====================================================
// CONFIGURAÇÃO INICIAL
// =====================================================

verificarTipoConteudo();

verificarTipoAcesso();

console.log(
    "🎬 I.M.A Filmes carregado com sucesso!"
);

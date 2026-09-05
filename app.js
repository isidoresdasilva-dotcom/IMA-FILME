```javascript
/* =========================================================
   I.M.A FILMES
   APP.JS COMPLETO
   Sistema de publicação + 5 capas automáticas
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS
       ===================================================== */

    const botaoEnviar =
        document.getElementById("botaoEnviar");

    const botaoEnviarMenu =
        document.getElementById("botaoEnviarMenu");

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


    /* =====================================================
       ESTADO
       ===================================================== */

    let capaURL = null;

    let capaManual = false;

    let videoSelecionado = null;

    let videoURL = null;

    let videoTemporarioCapa = null;

    let temporadaDados = [];

    let duracaoVideo = 0;

    let tempoCapa = 3;

    let gerandoCapas = false;


    /* =====================================================
       CRIAR ÁREA DAS 5 CAPAS
       ===================================================== */

    function criarSistemaCapas() {

        let sistema =
            document.getElementById(
                "sistemaCapasAutomaticas"
            );

        if (sistema) {
            return sistema;
        }

        sistema =
            document.createElement("div");

        sistema.id =
            "sistemaCapasAutomaticas";

        sistema.style.display = "none";

        sistema.style.marginTop = "15px";

        sistema.style.padding = "15px";

        sistema.style.borderRadius = "14px";

        sistema.style.background =
            "#f4f5f7";

        sistema.innerHTML = `

            <div style="
                font-size:17px;
                font-weight:700;
                margin-bottom:6px;
            ">
                🤖 Escolha a melhor capa
            </div>

            <div
                id="statusCapas"
                style="
                    font-size:14px;
                    margin-bottom:12px;
                "
            >
                Escolha um vídeo para gerar capas automaticamente.
            </div>

            <div
                id="opcoesCapas"
                style="
                    display:grid;
                    grid-template-columns:
                    repeat(auto-fit,minmax(120px,1fr));
                    gap:10px;
                "
            ></div>

            <div style="
                margin-top:15px;
                border-top:1px solid #ddd;
                padding-top:12px;
            ">

                <label style="
                    display:block;
                    font-weight:600;
                    margin-bottom:6px;
                ">
                    ⏱️ Escolher outro momento
                </label>

                <input
                    type="range"
                    id="sliderCapa"
                    min="0"
                    max="10"
                    value="3"
                    step="0.1"
                    style="width:100%;"
                >

                <div
                    id="tempoCapaTexto"
                    style="
                        font-size:13px;
                        margin-top:5px;
                    "
                >
                    3 segundos
                </div>

                <button
                    type="button"
                    id="gerarOutraCapa"
                    style="
                        margin-top:10px;
                        padding:9px 14px;
                        border:0;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:600;
                    "
                >
                    🔄 Gerar outra capa
                </button>

            </div>
        `;

        previewCapa.parentNode.insertBefore(
            sistema,
            previewCapa.nextSibling
        );

        const slider =
            sistema.querySelector(
                "#sliderCapa"
            );

        const textoTempo =
            sistema.querySelector(
                "#tempoCapaTexto"
            );

        const botaoOutra =
            sistema.querySelector(
                "#gerarOutraCapa"
            );

        slider.addEventListener(
            "input",
            () => {

                tempoCapa =
                    Number(slider.value);

                textoTempo.textContent =
                    `${tempoCapa.toFixed(1)} segundos`;
            }
        );

        botaoOutra.addEventListener(
            "click",
            async () => {

                if (!videoTemporarioCapa) {

                    alert(
                        "⚠️ Primeiro escolha um vídeo."
                    );

                    return;
                }

                await gerarUmaCapa(
                    videoTemporarioCapa,
                    tempoCapa,
                    true
                );
            }
        );

        return sistema;
    }


    /* =====================================================
       MOSTRAR SISTEMA DE CAPAS
       ===================================================== */

    function mostrarSistemaCapas() {

        const sistema =
            criarSistemaCapas();

        sistema.style.display =
            "block";
    }


    /* =====================================================
       ESCONDER SISTEMA DE CAPAS
       ===================================================== */

    function esconderSistemaCapas() {

        const sistema =
            document.getElementById(
                "sistemaCapasAutomaticas"
            );

        if (sistema) {

            sistema.style.display =
                "none";
        }
    }


    /* =====================================================
       STATUS
       ===================================================== */

    function statusCapas(texto) {

        const elemento =
            document.getElementById(
                "statusCapas"
            );

        if (elemento) {

            elemento.textContent =
                texto;
        }
    }


    /* =====================================================
       ABRIR PUBLICAÇÃO
       ===================================================== */

    function abrirModalPublicacao() {

        modalPublicacao.classList.add(
            "ativo"
        );

        document.body.classList.add(
            "modal-aberto"
        );

        limparFormulario();
    }

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


    /* =====================================================
       FECHAR PUBLICAÇÃO
       ===================================================== */

    function fecharModalPublicacao() {

        modalPublicacao.classList.remove(
            "ativo"
        );

        document.body.classList.remove(
            "modal-aberto"
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
            fecharModalPublicacao
        );
    }


    /* =====================================================
       FILME / SÉRIE
       ===================================================== */

    function atualizarTipoConteudo() {

        if (
            tipoConteudo.value ===
            "serie"
        ) {

            areaSerie.style.display =
                "block";

            if (areaVideo) {

                areaVideo.style.display =
                    "none";
            }

        } else {

            areaSerie.style.display =
                "none";

            if (areaVideo) {

                areaVideo.style.display =
                    "block";
            }

            listaTemporadas.innerHTML =
                "";

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
       GRATUITO / VENDA / ALUGUEL
       ===================================================== */

    function atualizarPreco() {

        if (
            tipoAcesso.value ===
                "venda" ||
            tipoAcesso.value ===
                "aluguel"
        ) {

            areaPreco.style.display =
                "block";

        } else {

            areaPreco.style.display =
                "none";

            precoConteudo.value =
                "";
        }
    }

    if (tipoAcesso) {

        tipoAcesso.addEventListener(
            "change",
            atualizarPreco
        );
    }


    /* =====================================================
       CAPA MANUAL
       ===================================================== */

    if (arquivoCapa) {

        arquivoCapa.addEventListener(
            "change",
            () => {

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
                        "⚠️ Escolha uma imagem válida."
                    );

                    arquivoCapa.value =
                        "";

                    return;
                }

                capaManual = true;

                if (
                    capaURL &&
                    capaURL.startsWith(
                        "blob:"
                    )
                ) {

                    URL.revokeObjectURL(
                        capaURL
                    );
                }

                capaURL =
                    URL.createObjectURL(
                        arquivo
                    );

                previewCapa.innerHTML = `

                    <div style="
                        position:relative;
                    ">

                        <img
                            src="${capaURL}"
                            alt="Capa manual"
                        >

                        <div style="
                            position:absolute;
                            bottom:8px;
                            left:8px;
                            padding:5px 9px;
                            background:rgba(0,0,0,.75);
                            color:white;
                            border-radius:6px;
                            font-size:12px;
                            font-weight:bold;
                        ">
                            📁 CAPA MANUAL
                        </div>

                    </div>
                `;

                statusCapas(
                    "📁 Capa manual selecionada. Ela será usada no lugar das capas automáticas."
                );
            }
        );
    }


    /* =====================================================
       VÍDEO DO FILME
       ===================================================== */

    if (arquivoVideo) {

        arquivoVideo.addEventListener(
            "change",
            async () => {

                const arquivo =
                    arquivoVideo.files[0];

                if (!arquivo) {

                    videoSelecionado =
                        null;

                    videoURL =
                        null;

                    return;
                }

                if (
                    !arquivo.type.startsWith(
                        "video/"
                    )
                ) {

                    alert(
                        "⚠️ Selecione um vídeo válido."
                    );

                    arquivoVideo.value =
                        "";

                    return;
                }

                videoSelecionado =
                    arquivo;

                if (videoURL) {

                    URL.revokeObjectURL(
                        videoURL
                    );
                }

                videoURL =
                    URL.createObjectURL(
                        arquivo
                    );

                await prepararVideoParaCapas(
                    arquivo
                );
            }
        );
    }


    /* =====================================================
       PREPARAR VÍDEO
       ===================================================== */

    async function prepararVideoParaCapas(
        arquivo
    ) {

        destruirVideoTemporario();

        const url =
            URL.createObjectURL(
                arquivo
            );

        const video =
            document.createElement(
                "video"
            );

        video.preload =
            "metadata";

        video.muted =
            true;

        video.playsInline =
            true;

        video.src =
            url;

        video.style.position =
            "fixed";

        video.style.left =
            "-99999px";

        video.style.top =
            "-99999px";

        video.style.width =
            "1px";

        video.style.height =
            "1px";

        video.style.opacity =
            "0";

        document.body.appendChild(
            video
        );

        videoTemporarioCapa =
            video;

        try {

            await esperarEvento(
                video,
                "loadedmetadata"
            );

            duracaoVideo =
                video.duration;

            if (
                !duracaoVideo ||
                !Number.isFinite(
                    duracaoVideo
                )
            ) {

                throw new Error(
                    "Duração inválida."
                );
            }

            /*
               Definir o máximo do slider.
            */

            const sistema =
                criarSistemaCapas();

            const slider =
                sistema.querySelector(
                    "#sliderCapa"
                );

            if (slider) {

                slider.max =
                    duracaoVideo;

                tempoCapa =
                    Math.min(
                        3,
                        Math.max(
                            0,
                            duracaoVideo - 0.1
                        )
                    );

                slider.value =
                    tempoCapa;
            }

            mostrarSistemaCapas();

            capaManual =
                false;

            await gerarCincoCapas(
                video
            );

        } catch (erro) {

            console.error(
                "Erro ao preparar vídeo:",
                erro
            );

            statusCapas(
                "⚠️ Não foi possível gerar as capas automaticamente. Você pode escolher uma capa manual."
            );
        }
    }


    /* =====================================================
       GERAR 5 CAPAS
       ===================================================== */

    async function gerarCincoCapas(
        video
    ) {

        if (gerandoCapas) {
            return;
        }

        gerandoCapas =
            true;

        const opcoes =
            document.getElementById(
                "opcoesCapas"
            );

        if (!opcoes) {
            return;
        }

        opcoes.innerHTML = "";

        statusCapas(
            "⏳ Analisando o vídeo e criando 5 opções de capa..."
        );

        try {

            const duracao =
                video.duration;

            /*
               Momentos escolhidos:

               5%
               20%
               40%
               60%
               80%

               Evitamos os primeiros e últimos
               frames porque normalmente são
               menos interessantes.
            */

            const porcentagens = [
                0.05,
                0.20,
                0.40,
                0.60,
                0.80
            ];

            const momentos =
                porcentagens.map(
                    porcentagem => {

                        return Math.min(
                            Math.max(
                                0,
                                duracao *
                                porcentagem
                            ),
                            Math.max(
                                0,
                                duracao - 0.1
                            )
                        );
                    }
                );

            for (
                let i = 0;
                i < momentos.length;
                i++
            ) {

                const tempo =
                    momentos[i];

                const imagem =
                    await capturarFrame(
                        video,
                        tempo
                    );

                criarOpcaoCapa(
                    imagem,
                    tempo,
                    i + 1
                );
            }

            /*
               Selecionar automaticamente
               a primeira capa.
            */

            const primeira =
                opcoes.querySelector(
                    ".opcao-capa"
                );

            if (primeira) {

                selecionarCapa(
                    primeira
                );
            }

            statusCapas(
                "✅ Escolha uma das 5 capas geradas automaticamente."
            );

        } catch (erro) {

            console.error(
                "Erro ao gerar capas:",
                erro
            );

            statusCapas(
                "⚠️ Não foi possível gerar as 5 capas."
            );

        } finally {

            gerandoCapas =
                false;
        }
    }


    /* =====================================================
       CAPTURAR FRAME
       ===================================================== */

    async function capturarFrame(
        video,
        tempo
    ) {

        await moverVideoParaTempo(
            video,
            tempo
        );

        const largura =
            video.videoWidth ||
            1280;

        const altura =
            video.videoHeight ||
            720;

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            largura;

        canvas.height =
            altura;

        const contexto =
            canvas.getContext(
                "2d"
            );

        contexto.drawImage(
            video,
            0,
            0,
            largura,
            altura
        );

        /*
           JPEG reduz o tamanho da capa.
        */

        return canvas.toDataURL(
            "image/jpeg",
            0.88
        );
    }


    /* =====================================================
       CRIAR OPÇÃO DE CAPA
       ===================================================== */

    function criarOpcaoCapa(
        imagem,
        tempo,
        numero
    ) {

        const opcoes =
            document.getElementById(
                "opcoesCapas"
            );

        if (!opcoes) {
            return;
        }

        const botao =
            document.createElement(
                "button"
            );

        botao.type =
            "button";

        botao.className =
            "opcao-capa";

        botao.dataset.tempo =
            tempo;

        botao.style.position =
            "relative";

        botao.style.padding =
            "4px";

        botao.style.border =
            "3px solid transparent";

        botao.style.borderRadius =
            "10px";

        botao.style.background =
            "#fff";

        botao.style.cursor =
            "pointer";

        botao.style.overflow =
            "hidden";

        botao.innerHTML = `

            <img
                src="${imagem}"
                alt="Opção de capa ${numero}"
                style="
                    width:100%;
                    aspect-ratio:16/9;
                    object-fit:cover;
                    display:block;
                    border-radius:7px;
                "
            >

            <span style="
                display:block;
                padding:5px 2px;
                font-size:12px;
                font-weight:600;
            ">
                Capa ${numero}
                <br>
                ${formatarTempo(tempo)}
            </span>
        `;

        botao.addEventListener(
            "click",
            () => {

                selecionarCapa(
                    botao
                );
            }
        );

        /*
           Guardamos a imagem no próprio
           elemento para poder utilizá-la
           depois.
        */

        botao.dataset.imagem =
            imagem;

        opcoes.appendChild(
            botao
        );
    }


    /* =====================================================
       SELECIONAR CAPA
       ===================================================== */

    function selecionarCapa(
        elemento
    ) {

        const opcoes =
            document.querySelectorAll(
                ".opcao-capa"
            );

        opcoes.forEach(
            opcao => {

                opcao.style.border =
                    "3px solid transparent";
            }
        );

        elemento.style.border =
            "3px solid #111";

        const imagem =
            elemento.dataset.imagem;

        const tempo =
            Number(
                elemento.dataset.tempo
            );

        if (!imagem) {
            return;
        }

        capaURL =
            imagem;

        capaManual =
            false;

        previewCapa.innerHTML = `

            <div style="
                position:relative;
            ">

                <img
                    src="${imagem}"
                    alt="Capa automática escolhida"
                >

                <div style="
                    position:absolute;
                    bottom:8px;
                    left:8px;
                    padding:5px 9px;
                    border-radius:6px;
                    background:rgba(0,0,0,.78);
                    color:#fff;
                    font-size:12px;
                    font-weight:bold;
                ">
                    🤖 CAPA AUTOMÁTICA
                </div>

            </div>
        `;

        tempoCapa =
            tempo;

        const slider =
            document.getElementById(
                "sliderCapa"
            );

        if (slider) {

            slider.value =
                tempo;
        }

        const texto =
            document.getElementById(
                "tempoCapaTexto"
            );

        if (texto) {

            texto.textContent =
                `${formatarTempo(tempo)}`;
        }

        statusCapas(
            `✅ Capa ${elemento.textContent.trim().split("\n")[0]} selecionada.`
        );
    }


    /* =====================================================
       GERAR UMA CAPA EM OUTRO MOMENTO
       ===================================================== */

    async function gerarUmaCapa(
        video,
        tempo,
        mostrarComoNova
    ) {

        if (gerandoCapas) {
            return;
        }

        gerandoCapas =
            true;

        statusCapas(
            "⏳ Criando capa no momento escolhido..."
        );

        try {

            const imagem =
                await capturarFrame(
                    video,
                    tempo
                );

            capaURL =
                imagem;

            capaManual =
                false;

            previewCapa.innerHTML = `

                <div style="
                    position:relative;
                ">

                    <img
                        src="${imagem}"
                        alt="Nova capa automática"
                    >

                    <div style="
                        position:absolute;
                        bottom:8px;
                        left:8px;
                        padding:5px 9px;
                        border-radius:6px;
                        background:rgba(0,0,0,.78);
                        color:#fff;
                        font-size:12px;
                        font-weight:bold;
                    ">
                        🤖 CAPA AUTOMÁTICA
                    </div>

                </div>
            `;

            tempoCapa =
                tempo;

            statusCapas(
                `✅ Nova capa criada aos ${formatarTempo(tempo)}.`
            );

            /*
               Se solicitado, adicionamos
               essa nova opção às 5 existentes.
            */

            if (mostrarComoNova) {

                const opcoes =
                    document.getElementById(
                        "opcoesCapas"
                    );

                const numero =
                    opcoes
                        ? opcoes.children.length + 1
                        : 6;

                criarOpcaoCapa(
                    imagem,
                    tempo,
                    numero
                );

                const ultima =
                    opcoes.lastElementChild;

                if (ultima) {

                    selecionarCapa(
                        ultima
                    );
                }
            }

        } catch (erro) {

            console.error(
                erro
            );

            statusCapas(
                "⚠️ Não foi possível criar a capa."
            );

        } finally {

            gerandoCapas =
                false;
        }
    }


    /* =====================================================
       MOVER VÍDEO
       ===================================================== */

    function moverVideoParaTempo(
        video,
        tempo
    ) {

        return new Promise(
            (resolve, reject) => {

                const limite =
                    setTimeout(
                        () => {

                            video.removeEventListener(
                                "seeked",
                                terminou
                            );

                            reject(
                                new Error(
                                    "Tempo limite."
                                )
                            );

                        },
                        10000
                    );

                function terminou() {

                    clearTimeout(
                        limite
                    );

                    video.removeEventListener(
                        "seeked",
                        terminou
                    );

                    resolve();
                }

                video.addEventListener(
                    "seeked",
                    terminou
                );

                try {

                    video.currentTime =
                        tempo;

                } catch (erro) {

                    clearTimeout(
                        limite
                    );

                    video.removeEventListener(
                        "seeked",
                        terminou
                    );

                    reject(
                        erro
                    );
                }
            }
        );
    }


    /* =====================================================
       ESPERAR EVENTO
       ===================================================== */

    function esperarEvento(
        elemento,
        evento
    ) {

        return new Promise(
            (resolve, reject) => {

                function sucesso() {

                    limpar();

                    resolve();
                }

                function erro() {

                    limpar();

                    reject(
                        new Error(
                            `Erro no evento ${evento}`
                        )
                    );
                }

                function limpar() {

                    elemento.removeEventListener(
                        evento,
                        sucesso
                    );

                    elemento.removeEventListener(
                        "error",
                        erro
                    );
                }

                elemento.addEventListener(
                    evento,
                    sucesso,
                    {
                        once: true
                    }
                );

                elemento.addEventListener(
                    "error",
                    erro,
                    {
                        once: true
                    }
                );
            }
        );
    }


    /* =====================================================
       FORMATAR TEMPO
       ===================================================== */

    function formatarTempo(
        segundos
    ) {

        segundos =
            Math.max(
                0,
                Number(segundos) || 0
            );

        const minutos =
            Math.floor(
                segundos / 60
            );

        const seg =
            Math.floor(
                segundos % 60
            );

        return `${minutos}:${String(
            seg
        ).padStart(2, "0")}`;
    }


    /* =====================================================
       DESTRUIR VÍDEO TEMPORÁRIO
       ===================================================== */

    function destruirVideoTemporario() {

        if (
            !videoTemporarioCapa
        ) {
            return;
        }

        try {

            const url =
                videoTemporarioCapa.src;

            videoTemporarioCapa.pause();

            videoTemporarioCapa.src =
                "";

            videoTemporarioCapa.load();

            videoTemporarioCapa.remove();

            if (
                url &&
                url.startsWith(
                    "blob:"
                )
            ) {

                URL.revokeObjectURL(
                    url
                );
            }

        } catch (erro) {

            console.warn(
                "Erro ao limpar vídeo temporário:",
                erro
            );
        }

        videoTemporarioCapa =
            null;
    }


    /* =====================================================
       GERAR TEMPORADAS
       ===================================================== */

    function gerarTemporadas() {

        const totalTemporadas =
            parseInt(
                quantidadeTemporadas.value
            );

        const totalEpisodios =
            parseInt(
                quantidadeEpisodios.value
            );

        listaTemporadas.innerHTML =
            "";

        temporadaDados =
            [];

        if (
            !totalTemporadas ||
            totalTemporadas < 1
        ) {

            return;
        }

        if (
            !totalEpisodios ||
            totalEpisodios < 1
        ) {

            return;
        }

        for (
            let t = 1;
            t <= totalTemporadas;
            t++
        ) {

            const temporada = {

                numero: t,

                episodios: []
            };

            const bloco =
                document.createElement(
                    "div"
                );

            bloco.className =
                "temporada";

            bloco.innerHTML = `

                <h4>
                    📚 Temporada ${t}
                </h4>

                <div class="episodios"></div>
            `;

            const episodiosDiv =
                bloco.querySelector(
                    ".episodios"
                );

            for (
                let e = 1;
                e <= totalEpisodios;
                e++
            ) {

                temporada.episodios.push({

                    numero: e,

                    titulo:
                        `Episódio ${e}`,

                    arquivo: null,

                    url: null
                });

                const episodio =
                    document.createElement(
                        "div"
                    );

                episodio.className =
                    "episodio";

                episodio.innerHTML = `

                    <strong>
                        🎞️ Episódio ${e}
                    </strong>

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

                episodiosDiv.appendChild(
                    episodio
                );
            }

            listaTemporadas.appendChild(
                bloco
            );

            temporadaDados.push(
                temporada
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


    /* =====================================================
       EPISÓDIOS DAS SÉRIES
       ===================================================== */

    listaTemporadas.addEventListener(
        "change",
        async event => {

            if (
                !event.target.classList.contains(
                    "arquivo-episodio"
                )
            ) {

                return;
            }

            const arquivo =
                event.target.files[0];

            if (!arquivo) {
                return;
            }

            if (
                !arquivo.type.startsWith(
                    "video/"
                )
            ) {

                alert(
                    "⚠️ Escolha um vídeo válido."
                );

                event.target.value =
                    "";

                return;
            }

            const temporadaNumero =
                Number(
                    event.target.dataset
                        .temporada
                );

            const episodioNumero =
                Number(
                    event.target.dataset
                        .episodio
                );

            const temporada =
                temporadaDados.find(
                    item =>
                        item.numero ===
                        temporadaNumero
                );

            if (temporada) {

                const episodio =
                    temporada.episodios.find(
                        item =>
                            item.numero ===
                            episodioNumero
                    );

                if (episodio) {

                    if (
                        episodio.url
                    ) {

                        URL.revokeObjectURL(
                            episodio.url
                        );
                    }

                    episodio.arquivo =
                        arquivo;

                    episodio.url =
                        URL.createObjectURL(
                            arquivo
                        );
                }
            }

            /*
               O primeiro episódio selecionado
               gera as capas da série.
            */

            if (!capaManual) {

                await prepararVideoParaCapas(
                    arquivo
                );
            }
        }
    );


    /* =====================================================
       PUBLICAR
       ===================================================== */

    if (salvarPublicacao) {

        salvarPublicacao.addEventListener(
            "click",
            publicarConteudo
        );
    }


    function publicarConteudo() {

        const tipo =
            tipoConteudo.value;

        const nome =
            nomeConteudo.value.trim();

        const descricao =
            descricaoConteudo.value.trim();

        const ano =
            anoConteudo.value.trim();

        const acesso =
            tipoAcesso.value;


        /* -------------------------------------------------
           NOME
           ------------------------------------------------- */

        if (!nome) {

            alert(
                "⚠️ Digite o nome do conteúdo."
            );

            nomeConteudo.focus();

            return;
        }


        /* -------------------------------------------------
           ANO
           ------------------------------------------------- */

        if (!ano) {

            alert(
                "⚠️ Digite o ano do conteúdo."
            );

            anoConteudo.focus();

            return;
        }


        /* -------------------------------------------------
           CAPA
           ------------------------------------------------- */

        if (!capaURL) {

            alert(
                "⚠️ Escolha uma capa ou selecione um vídeo para gerar automaticamente."
            );

            return;
        }


        /* -------------------------------------------------
           REGRAS
           ------------------------------------------------- */

        if (
            !aceitarRegras.checked
        ) {

            alert(
                "⚠️ Confirme que possui os direitos de publicação."
            );

            aceitarRegras.focus();

            return;
        }


        /* -------------------------------------------------
           PREÇO
           ------------------------------------------------- */

        let preco = "";

        if (
            acesso === "venda" ||
            acesso === "aluguel"
        ) {

            preco =
                precoConteudo.value;

            if (
                !preco ||
                Number(preco) <= 0
            ) {

                alert(
                    "⚠️ Digite um preço válido."
                );

                precoConteudo.focus();

                return;
            }
        }


        /* =================================================
           FILME
           ================================================= */

        if (
            tipo === "filme"
        ) {

            if (
                !videoSelecionado
            ) {

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

                capa:
                    capaURL,

                video:
                    videoURL,

                acesso,

                preco
            });
        }


        /* =================================================
           SÉRIE
           ================================================= */

        if (
            tipo === "serie"
        ) {

            const arquivos =
                document.querySelectorAll(
                    ".arquivo-episodio"
                );

            let quantidade =
                0;

            arquivos.forEach(
                input => {

                    if (
                        input.files &&
                        input.files.length
                    ) {

                        quantidade++;
                    }
                }
            );

            if (
                quantidade === 0
            ) {

                alert(
                    "⚠️ Escolha pelo menos um episódio."
                );

                return;
            }

            const temporadas =
                montarDadosSerie();

            criarCardSerie({

                nome,

                descricao,

                ano,

                capa:
                    capaURL,

                acesso,

                preco,

                temporadas
            });
        }


        alert(
            "🎉 Conteúdo publicado com sucesso no I.M.A Filmes!"
        );

        fecharModalPublicacao();

        limparFormulario();
    }


    /* =====================================================
       MONTAR SÉRIE
       ===================================================== */

    function montarDadosSerie() {

        const temporadas =
            [];

        const blocos =
            document.querySelectorAll(
                ".temporada"
            );

        blocos.forEach(
            (
                bloco,
                indiceTemporada
            ) => {

                const temporada = {

                    numero:
                        indiceTemporada + 1,

                    episodios: []
                };

                const episodios =
                    bloco.querySelectorAll(
                        ".episodio"
                    );

                episodios.forEach(
                    (
                        episodio,
                        indiceEpisodio
                    ) => {

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

                        let url =
                            null;

                        if (
                            arquivo
                        ) {

                            url =
                                URL.createObjectURL(
                                    arquivo
                                );
                        }

                        temporada.episodios.push({

                            numero:
                                indiceEpisodio + 1,

                            titulo:
                                tituloInput.value.trim() ||
                                `Episódio ${indiceEpisodio + 1}`,

                            arquivo,

                            url
                        });
                    }
                );

                temporadas.push(
                    temporada
                );
            }
        );

        return temporadas;
    }


    /* =====================================================
       CARD FILME
       ===================================================== */

    function criarCardFilme(
        dados
    ) {

        const artigo =
            document.createElement(
                "article"
            );

        artigo.className =
            "card";

        artigo.dataset.nome =
            dados.nome.toLowerCase();

        const capaHTML =
            dados.capa
                ? `
                    <img
                        src="${dados.capa}"
                        alt="${escaparHTML(
                            dados.nome
                        )}"
                    >
                  `
                : "🎬";

        artigo.innerHTML = `

            <div class="capa">
                ${capaHTML}
            </div>

            <h3>
                ${escaparHTML(
                    dados.nome
                )}
            </h3>

            <p>
                🎬 Filme •
                ${escaparHTML(
                    dados.ano
                )}
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

        listaFilmes.prepend(
            artigo
        );


        artigo
            .querySelector(
                ".assistir"
            )
            .addEventListener(
                "click",
                () => {

                    abrirPlayer(

                        dados.nome,

                        dados.descricao,

                        dados.video
                    );
                }
            );


        artigo
            .querySelector(
                ".baixar"
            )
            .addEventListener(
                "click",
                () => {

                    baixarArquivo(

                        dados.video,

                        dados.nome
                    );
                }
            );


        artigo
            .querySelector(
                ".partilhar"
            )
            .addEventListener(
                "click",
                () => {

                    partilharConteudo(
                        dados.nome
                    );
                }
            );
    }


    /* =====================================================
       CARD SÉRIE
       ===================================================== */

    function criarCardSerie(
        dados
    ) {

        const artigo =
            document.createElement(
                "article"
            );

        artigo.className =
            "card";

        artigo.dataset.nome =
            dados.nome.toLowerCase();

        const capaHTML =
            dados.capa
                ? `
                    <img
                        src="${dados.capa}"
                        alt="${escaparHTML(
                            dados.nome
                        )}"
                    >
                  `
                : "📺";

        artigo.innerHTML = `

            <div class="capa">
                ${capaHTML}
            </div>

            <h3>
                ${escaparHTML(
                    dados.nome
                )}
            </h3>

            <p>
                📺 Série •
                ${escaparHTML(
                    dados.ano
                )}
            </p>

            <p>
                📚
                ${dados.temporadas.length}
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

        listaFilmes.prepend(
            artigo
        );


        artigo
            .querySelector(
                ".assistir"
            )
            .addEventListener(
                "click",
                () => {

                    abrirListaEpisodios(
                        dados
                    );
                }
            );


        artigo
            .querySelector(
                ".partilhar"
            )
            .addEventListener(
                "click",
                () => {

                    partilharConteudo(
                        dados.nome
                    );
                }
            );
    }


    /* =====================================================
       ACESSO
       ===================================================== */

    function mostrarAcesso(
        acesso,
        preco
    ) {

        if (
            acesso === "gratis"
        ) {

            return "🆓 Gratuito";
        }

        if (
            acesso === "venda"
        ) {

            return `💰 Venda: ${preco} Kz`;
        }

        if (
            acesso === "aluguel"
        ) {

            return `🎟️ Aluguel: ${preco} Kz`;
        }

        return "";
    }


    /* =====================================================
       PLAYER
       ===================================================== */

    function abrirPlayer(
        nome,
        descricao,
        url
    ) {

        if (!url) {

            alert(
                "⚠️ O vídeo não está disponível."
            );

            return;
        }

        tituloPlayer.textContent =
            nome;

        descricaoPlayer.textContent =
            descricao ||
            "Sem descrição.";

        videoPlayer.src =
            url;

        modalPlayer.classList.add(
            "ativo"
        );

        document.body.classList.add(
            "modal-aberto"
        );

        videoPlayer
            .play()
            .catch(
                () => {}
            );
    }


    /* =====================================================
       FECHAR PLAYER
       ===================================================== */

    function fecharVideo() {

        videoPlayer.pause();

        videoPlayer.removeAttribute(
            "src"
        );

        videoPlayer.load();

        modalPlayer.classList.remove(
            "ativo"
        );

        document.body.classList.remove(
            "modal-aberto"
        );
    }

    if (fecharPlayer) {

        fecharPlayer.addEventListener(
            "click",
            fecharVideo
        );
    }


    /* =====================================================
       EPISÓDIOS
       ===================================================== */

    function abrirListaEpisodios(
        serie
    ) {

        let mensagem =
            `📺 ${serie.nome}\n\n`;

        serie.temporadas.forEach(
            temporada => {

                mensagem +=
                    `📚 Temporada ${temporada.numero}\n`;

                temporada.episodios.forEach(
                    episodio => {

                        mensagem +=
                            `▶️ ${episodio.numero}. ${episodio.titulo}\n`;
                    }
                );

                mensagem +=
                    "\n";
            }
        );

        const escolha =
            prompt(
                mensagem +
                "Digite o número do episódio:"
            );

        if (!escolha) {
            return;
        }

        const numero =
            parseInt(
                escolha
            );

        let encontrado =
            null;

        for (
            const temporada of
            serie.temporadas
        ) {

            for (
                const episodio of
                temporada.episodios
            ) {

                if (
                    episodio.numero ===
                        numero &&
                    episodio.url
                ) {

                    encontrado =
                        episodio;

                    break;
                }
            }

            if (
                encontrado
            ) {
                break;
            }
        }

        if (
            !encontrado
        ) {

            alert(
                "⚠️ Episódio não encontrado ou sem vídeo."
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

    function baixarArquivo(
        url,
        nome
    ) {

        if (!url) {

            alert(
                "⚠️ Arquivo não disponível."
            );

            return;
        }

        const link =
            document.createElement(
                "a"
            );

        link.href =
            url;

        link.download =
            `${nome}.mp4`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();
    }


    /* =====================================================
       PARTILHAR
       ===================================================== */

    async function partilharConteudo(
        nome
    ) {

        const texto =
            `🎬 Confira "${nome}" no I.M.A Filmes!`;

        try {

            if (
                navigator.share
            ) {

                await navigator.share({

                    title:
                        "I.M.A Filmes",

                    text:
                        texto
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

                cards.forEach(
                    card => {

                        const texto =
                            card.textContent
                                .toLowerCase();

                        card.style.display =
                            texto.includes(
                                pesquisa
                            )
                                ? ""
                                : "none";
                    }
                );
            }
        );
    }


    /* =====================================================
       LIMPAR FORMULÁRIO
       ===================================================== */

    function limparFormulario() {

        nomeConteudo.value =
            "";

        descricaoConteudo.value =
            "";

        anoConteudo.value =
            "";

        tipoConteudo.value =
            "filme";

        tipoAcesso.value =
            "gratis";

        arquivoCapa.value =
            "";

        arquivoVideo.value =
            "";

        quantidadeTemporadas.value =
            "";

        quantidadeEpisodios.value =
            "";

        precoConteudo.value =
            "";

        aceitarRegras.checked =
            false;

        previewCapa.innerHTML =
            "Pré-visualização da capa";

        listaTemporadas.innerHTML =
            "";

        areaSerie.style.display =
            "none";

        areaPreco.style.display =
            "none";

        areaVideo.style.display =
            "block";

        capaURL =
            null;

        capaManual =
            false;

        videoSelecionado =
            null;

        if (videoURL) {

            try {

                URL.revokeObjectURL(
                    videoURL
                );

            } catch (erro) {}
        }

        videoURL =
            null;

        destruirVideoTemporario();

        esconderSistemaCapas();

        temporadaDados =
            [];

        duracaoVideo =
            0;

        tempoCapa =
            3;

        gerandoCapas =
            false;

        const opcoes =
            document.getElementById(
                "opcoesCapas"
            );

        if (opcoes) {

            opcoes.innerHTML =
                "";
        }
    }


    /* =====================================================
       ESCAPAR HTML
       ===================================================== */

    function escaparHTML(
        texto
    ) {

        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            texto;

        return div.innerHTML;
    }


    /* =====================================================
       CLICAR FORA DO MODAL
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
       ESC
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

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

    criarSistemaCapas();

    atualizarTipoConteudo();

    atualizarPreco();

    console.log(
        "🎬 I.M.A Filmes iniciado!"
    );

    console.log(
        "🤖 Sistema de 5 capas automáticas ativado!"
    );

});
```

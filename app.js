```javascript
/* =========================================================
   I.M.A FILMES
   APP.JS COMPLETO CORRIGIDO

   PUBLICAÇÃO DE FILMES E SÉRIES
   + 5 CAPAS AUTOMÁTICAS
   + CAPA MANUAL
   + PLAYER
   + DOWNLOAD
   + PARTILHA
   + PESQUISA

   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTOS DO HTML
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
       VARIÁVEIS
       ===================================================== */

    let capaURL = null;

    let capaManual = false;

    let videoSelecionado = null;

    let videoURL = null;

    let videoTemporarioCapa = null;

    let duracaoVideo = 0;

    let tempoCapa = 3;

    let gerandoCapas = false;

    let temporadaDados = [];

    let publicando = false;

    let geracaoId = 0;


    /* =====================================================
       SISTEMA DE CAPAS AUTOMÁTICAS
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

        sistema.style.background = "#f4f5f7";

        sistema.innerHTML = `

            <div style="
                font-size:17px;
                font-weight:700;
                margin-bottom:6px;
            ">
                🤖 Capas automáticas
            </div>

            <div
                id="statusCapas"
                style="
                    font-size:14px;
                    margin-bottom:12px;
                "
            >
                Escolha um vídeo para gerar as capas.
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
                    ⏱️ Escolher outro momento do vídeo
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
                    0:03
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

        if (
            previewCapa &&
            previewCapa.parentNode
        ) {

            previewCapa.parentNode.insertBefore(
                sistema,
                previewCapa.nextSibling
            );
        }

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
                    formatarTempo(tempoCapa);
            }
        );

        botaoOutra.addEventListener(
            "click",
            async () => {

                if (
                    !videoTemporarioCapa
                ) {

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
       MOSTRAR / ESCONDER CAPAS
       ===================================================== */

    function mostrarSistemaCapas() {

        const sistema =
            criarSistemaCapas();

        sistema.style.display =
            "block";
    }


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

        limparFormulario();

        modalPublicacao.classList.add(
            "ativo"
        );

        document.body.classList.add(
            "modal-aberto"
        );

        setTimeout(() => {

            if (nomeConteudo) {
                nomeConteudo.focus();
            }

        }, 100);
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
       FECHAR MODAL
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
            tipoConteudo.value === "serie"
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
       ACESSO / PREÇO
       ===================================================== */

    function atualizarPreco() {

        if (
            tipoAcesso.value === "venda" ||
            tipoAcesso.value === "aluguel"
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

                liberarCapaAnterior();

                capaURL =
                    URL.createObjectURL(
                        arquivo
                    );

                previewCapa.innerHTML = `

                    <div style="
                        position:relative;
                        width:100%;
                    ">

                        <img
                            src="${capaURL}"
                            alt="Capa manual"
                            style="
                                width:100%;
                                max-height:280px;
                                object-fit:cover;
                                border-radius:10px;
                                display:block;
                            "
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
                    "📁 Capa manual escolhida. Ela será usada na publicação."
                );
            }
        );
    }


    /* =====================================================
       SELEÇÃO DO VÍDEO DO FILME
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

                    limparVideo();

                    return;
                }

                if (
                    !arquivo.type.startsWith(
                        "video/"
                    )
                ) {

                    alert(
                        "⚠️ Selecione um arquivo de vídeo válido."
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

                /*
                   Se o usuário não escolheu
                   uma capa manual, geramos
                   automaticamente.
                */

                if (!capaManual) {

                    await prepararVideoParaCapas(
                        arquivo
                    );

                } else {

                    statusCapas(
                        "📁 A capa manual continuará sendo usada."
                    );
                }
            }
        );
    }


    /* =====================================================
       PREPARAR VÍDEO PARA CAPAS
       ===================================================== */

    async function prepararVideoParaCapas(
        arquivo
    ) {

        const idAtual =
            ++geracaoId;

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

            if (
                idAtual !== geracaoId
            ) {
                return;
            }

            duracaoVideo =
                Number(
                    video.duration
                );

            if (
                !duracaoVideo ||
                !Number.isFinite(
                    duracaoVideo
                )
            ) {

                throw new Error(
                    "Duração do vídeo inválida."
                );
            }

            const sistema =
                criarSistemaCapas();

            const slider =
                sistema.querySelector(
                    "#sliderCapa"
                );

            tempoCapa =
                Math.min(
                    3,
                    Math.max(
                        0,
                        duracaoVideo - 0.2
                    )
                );

            if (slider) {

                slider.max =
                    Math.max(
                        1,
                        duracaoVideo
                    );

                slider.value =
                    tempoCapa;
            }

            const texto =
                sistema.querySelector(
                    "#tempoCapaTexto"
                );

            if (texto) {

                texto.textContent =
                    formatarTempo(
                        tempoCapa
                    );
            }

            mostrarSistemaCapas();

            /*
               Remove capa automática
               anterior somente quando
               realmente vamos gerar outra.
            */

            capaURL =
                null;

            await gerarCincoCapas(
                video,
                idAtual
            );

        } catch (erro) {

            console.error(
                "Erro ao preparar vídeo:",
                erro
            );

            capaURL =
                null;

            statusCapas(
                "⚠️ Não foi possível gerar a capa automaticamente. Escolha uma capa manual."
            );
        }
    }


    /* =====================================================
       GERAR 5 CAPAS
       ===================================================== */

    async function gerarCincoCapas(
        video,
        idAtual
    ) {

        if (gerandoCapas) {

            /*
               Permite que a próxima
               seleção reinicie o processo.
            */

            gerandoCapas =
                false;
        }

        gerandoCapas =
            true;

        const opcoes =
            document.getElementById(
                "opcoesCapas"
            );

        if (!opcoes) {

            gerandoCapas =
                false;

            return;
        }

        opcoes.innerHTML =
            "";

        statusCapas(
            "⏳ Analisando o vídeo e criando 5 capas..."
        );

        try {

            const duracao =
                Number(
                    video.duration
                );

            const porcentagens = [
                0.05,
                0.20,
                0.40,
                0.60,
                0.80
            ];

            const momentos =
                porcentagens.map(
                    percentual => {

                        return Math.min(
                            Math.max(
                                0.1,
                                duracao *
                                percentual
                            ),
                            Math.max(
                                0.1,
                                duracao - 0.2
                            )
                        );
                    }
                );

            for (
                let i = 0;
                i < momentos.length;
                i++
            ) {

                if (
                    idAtual !== geracaoId
                ) {

                    return;
                }

                const tempo =
                    momentos[i];

                const imagem =
                    await capturarFrame(
                        video,
                        tempo
                    );

                if (
                    idAtual !== geracaoId
                ) {

                    return;
                }

                criarOpcaoCapa(
                    imagem,
                    tempo,
                    i + 1
                );
            }

            if (
                !opcoes.children.length
            ) {

                throw new Error(
                    "Nenhuma capa foi criada."
                );
            }

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
                "✅ 5 capas foram criadas. Clique na capa que deseja usar."
            );

        } catch (erro) {

            console.error(
                "Erro ao gerar 5 capas:",
                erro
            );

            capaURL =
                null;

            statusCapas(
                "⚠️ Não foi possível criar as capas automaticamente. Você pode escolher uma capa manual."
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

        /*
           Pequena espera para garantir
           que o frame esteja pronto.
        */

        await esperarPequenoTempo(
            100
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

        if (!contexto) {

            throw new Error(
                "Canvas não disponível."
            );
        }

        contexto.drawImage(
            video,
            0,
            0,
            largura,
            altura
        );

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
            String(tempo);

        botao.dataset.imagem =
            imagem;

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

        const imagem =
            elemento.dataset.imagem;

        if (!imagem) {

            return;
        }

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

        capaURL =
            imagem;

        capaManual =
            false;

        previewCapa.innerHTML = `

            <div style="
                position:relative;
                width:100%;
            ">

                <img
                    src="${imagem}"
                    alt="Capa automática escolhida"
                    style="
                        width:100%;
                        max-height:280px;
                        object-fit:cover;
                        border-radius:10px;
                        display:block;
                    "
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
            Number(
                elemento.dataset.tempo
            );

        const slider =
            document.getElementById(
                "sliderCapa"
            );

        if (slider) {

            slider.value =
                tempoCapa;
        }

        const texto =
            document.getElementById(
                "tempoCapaTexto"
            );

        if (texto) {

            texto.textContent =
                formatarTempo(
                    tempoCapa
                );
        }

        statusCapas(
            "✅ Capa automática selecionada."
        );
    }


    /* =====================================================
       GERAR OUTRA CAPA
       ===================================================== */

    async function gerarUmaCapa(
        video,
        tempo,
        adicionarLista
    ) {

        if (
            gerandoCapas
        ) {

            return;
        }

        if (
            !video ||
            !video.videoWidth
        ) {

            alert(
                "⚠️ O vídeo ainda não está pronto."
            );

            return;
        }

        gerandoCapas =
            true;

        try {

            const tempoSeguro =
                Math.min(
                    Math.max(
                        0,
                        Number(tempo) || 0
                    ),
                    Math.max(
                        0,
                        duracaoVideo - 0.2
                    )
                );

            statusCapas(
                "⏳ Criando nova capa..."
            );

            const imagem =
                await capturarFrame(
                    video,
                    tempoSeguro
                );

            capaURL =
                imagem;

            capaManual =
                false;

            previewCapa.innerHTML = `

                <div style="
                    position:relative;
                    width:100%;
                ">

                    <img
                        src="${imagem}"
                        alt="Nova capa automática"
                        style="
                            width:100%;
                            max-height:280px;
                            object-fit:cover;
                            border-radius:10px;
                            display:block;
                        "
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
                tempoSeguro;

            const slider =
                document.getElementById(
                    "sliderCapa"
                );

            if (slider) {

                slider.value =
                    tempoSeguro;
            }

            const texto =
                document.getElementById(
                    "tempoCapaTexto"
                );

            if (texto) {

                texto.textContent =
                    formatarTempo(
                        tempoSeguro
                    );
            }

            if (
                adicionarLista
            ) {

                criarOpcaoCapa(
                    imagem,
                    tempoSeguro,
                    document.querySelectorAll(
                        ".opcao-capa"
                    ).length + 1
                );

                const opcoes =
                    document.querySelectorAll(
                        ".opcao-capa"
                    );

                const ultima =
                    opcoes[
                        opcoes.length - 1
                    ];

                if (ultima) {

                    selecionarCapa(
                        ultima
                    );
                }
            }

            statusCapas(
                `✅ Nova capa criada em ${formatarTempo(tempoSeguro)}.`
            );

        } catch (erro) {

            console.error(
                "Erro ao criar capa:",
                erro
            );

            alert(
                "⚠️ Não foi possível criar a nova capa."
            );

        } finally {

            gerandoCapas =
                false;
        }
    }


    /* =====================================================
       MOVER VÍDEO PARA UM MOMENTO
       ===================================================== */

    function moverVideoParaTempo(
        video,
        tempo
    ) {

        return new Promise(
            (resolve, reject) => {

                const novoTempo =
                    Number(tempo);

                if (
                    !Number.isFinite(
                        novoTempo
                    )
                ) {

                    reject(
                        new Error(
                            "Tempo inválido."
                        )
                    );

                    return;
                }

                const limite =
                    setTimeout(
                        () => {

                            video.removeEventListener(
                                "seeked",
                                terminou
                            );

                            reject(
                                new Error(
                                    "Tempo limite ao procurar o frame."
                                )
                            );

                        },
                        15000
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
                        novoTempo;

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
                            `Erro no carregamento do vídeo.`
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
       PEQUENA ESPERA
       ===================================================== */

    function esperarPequenoTempo(
        tempo
    ) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    tempo
                )
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

            return `${horas}:${String(
                minutos
            ).padStart(2, "0")}:${String(
                seg
            ).padStart(2, "0")`;
        }

        return `${minutos}:${String(
            seg
        ).padStart(2, "0")}`;
    }


    /* =====================================================
       LIBERAR CAPA ANTERIOR
       ===================================================== */

    function liberarCapaAnterior() {

        /*
           Imagens geradas pelo canvas
           são data URLs e não precisam
           de revokeObjectURL.

           Apenas capas blob são liberadas.
        */

        if (
            capaURL &&
            capaURL.startsWith("blob:")
        ) {

            try {

                URL.revokeObjectURL(
                    capaURL
                );

            } catch (erro) {

                console.warn(
                    "Não foi possível liberar capa:",
                    erro
                );
            }
        }
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

            videoTemporarioCapa.removeAttribute(
                "src"
            );

            videoTemporarioCapa.load();

            videoTemporarioCapa.remove();

            if (
                url &&
                url.startsWith("blob:")
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
       LIMPAR VÍDEO
       ===================================================== */

    function limparVideo() {

        geracaoId++;

        destruirVideoTemporario();

        if (videoURL) {

            try {

                URL.revokeObjectURL(
                    videoURL
                );

            } catch (erro) {}
        }

        videoURL =
            null;

        videoSelecionado =
            null;

        duracaoVideo =
            0;

        capaURL =
            null;

        gerandoCapas =
            false;

        esconderSistemaCapas();

        if (previewCapa) {

            previewCapa.innerHTML =
                "Pré-visualização da capa";
        }
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

        /*
           Limite de segurança
           para não travar o navegador.
        */

        const temporadasSeguras =
            Math.min(
                totalTemporadas,
                50
            );

        const episodiosSeguros =
            Math.min(
                totalEpisodios,
                100
            );

        for (
            let t = 1;
            t <= temporadasSeguras;
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
                e <= episodiosSeguros;
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

        if (
            totalTemporadas > 50 ||
            totalEpisodios > 100
        ) {

            alert(
                "⚠️ Para manter o navegador rápido, foram aplicados limites de segurança."
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
       EPISÓDIOS DA SÉRIE
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
                    event.target.dataset.temporada
                );

            const episodioNumero =
                Number(
                    event.target.dataset.episodio
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

                        try {

                            URL.revokeObjectURL(
                                episodio.url
                            );

                        } catch (erro) {}
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
               O primeiro episódio escolhido
               gera as capas automáticas.
            */

            if (
                !capaManual &&
                !videoSelecionado
            ) {

                videoSelecionado =
                    arquivo;

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


    async function publicarConteudo() {

        if (publicando) {

            return;
        }

        publicando =
            true;

        salvarPublicacao.disabled =
            true;

        const textoOriginal =
            salvarPublicacao.innerHTML;

        salvarPublicacao.innerHTML =
            "⏳ Publicando...";

        try {

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


            /* =============================================
               NOME
               ============================================= */

            if (!nome) {

                alert(
                    "⚠️ Digite o nome do filme."
                );

                nomeConteudo.focus();

                return;
            }


            /* =============================================
               ANO
               ============================================= */

            if (!ano) {

                alert(
                    "⚠️ Digite o ano do conteúdo."
                );

                anoConteudo.focus();

                return;
            }


            const anoNumero =
                Number(ano);

            if (
                !Number.isInteger(
                    anoNumero
                ) ||
                anoNumero < 1900 ||
                anoNumero > 2100
            ) {

                alert(
                    "⚠️ Digite um ano válido entre 1900 e 2100."
                );

                anoConteudo.focus();

                return;
            }


            /* =============================================
               REGRAS
               ============================================= */

            if (
                !aceitarRegras.checked
            ) {

                alert(
                    "⚠️ Marque a confirmação de direitos de publicação."
                );

                aceitarRegras.focus();

                return;
            }


            /* =============================================
               PREÇO
               ============================================= */

            let preco =
                "";

            if (
                acesso === "venda" ||
                acesso === "aluguel"
            ) {

                preco =
                    precoConteudo.value.trim();

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


            /* =============================================
               FILME
               ============================================= */

            if (
                tipo === "filme"
            ) {

                if (
                    !videoSelecionado ||
                    !videoURL
                ) {

                    alert(
                        "⚠️ Escolha primeiro o vídeo do filme."
                    );

                    arquivoVideo.focus();

                    return;
                }


                /*
                   A capa pode ser automática
                   ou manual.
                */

                if (!capaURL) {

                    alert(
                        "⚠️ A capa ainda não foi criada. Aguarde a geração automática ou escolha uma capa manual."
                    );

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


                mostrarMensagemSucesso(
                    "🎉 Filme publicado com sucesso!"
                );
            }


            /* =============================================
               SÉRIE
               ============================================= */

            if (
                tipo === "serie"
            ) {

                const temporadas =
                    montarDadosSerie();

                let quantidadeVideos =
                    0;

                temporadas.forEach(
                    temporada => {

                        temporada.episodios.forEach(
                            episodio => {

                                if (
                                    episodio.arquivo
                                ) {

                                    quantidadeVideos++;
                                }
                            }
                        );
                    }
                );


                if (
                    quantidadeVideos === 0
                ) {

                    alert(
                        "⚠️ Escolha pelo menos um episódio."
                    );

                    return;
                }


                if (!capaURL) {

                    /*
                       Se ainda não houver capa,
                       tenta usar o primeiro episódio
                       disponível.
                    */

                    const primeiro =
                        encontrarPrimeiroEpisodio(
                            temporadas
                        );

                    if (
                        primeiro &&
                        primeiro.arquivo
                    ) {

                        try {

                            await prepararVideoParaCapas(
                                primeiro.arquivo
                            );

                        } catch (erro) {

                            console.error(
                                erro
                            );
                        }
                    }
                }


                if (!capaURL) {

                    alert(
                        "⚠️ Escolha uma capa para a série."
                    );

                    return;
                }


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


                mostrarMensagemSucesso(
                    "🎉 Série publicada com sucesso!"
                );
            }


            fecharModalPublicacao();

            limparFormulario();

        } catch (erro) {

            console.error(
                "Erro ao publicar:",
                erro
            );

            alert(
                "❌ Ocorreu um erro ao publicar o conteúdo. Veja o console do navegador para mais detalhes."
            );

        } finally {

            publicando =
                false;

            salvarPublicacao.disabled =
                false;

            salvarPublicacao.innerHTML =
                textoOriginal;
        }
    }


    /* =====================================================
       ENCONTRAR PRIMEIRO EPISÓDIO
       ===================================================== */

    function encontrarPrimeiroEpisodio(
        temporadas
    ) {

        for (
            const temporada of temporadas
        ) {

            for (
                const episodio of temporada.episodios
            ) {

                if (
                    episodio.arquivo
                ) {

                    return episodio;
                }
            }
        }

        return null;
    }


    /* =====================================================
       MONTAR DADOS DA SÉRIE
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
                            arquivoInput &&
                            arquivoInput.files
                                ? arquivoInput.files[0]
                                : null;

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
                                tituloInput &&
                                tituloInput.value.trim()
                                    ? tituloInput.value.trim()
                                    : `Episódio ${indiceEpisodio + 1}`,

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
       CARD DO FILME
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


        const botaoAssistir =
            artigo.querySelector(
                ".assistir"
            );

        if (botaoAssistir) {

            botaoAssistir.addEventListener(
                "click",
                () => {

                    abrirPlayer(

                        dados.nome,

                        dados.descricao,

                        dados.video
                    );
                }
            );
        }


        const botaoBaixar =
            artigo.querySelector(
                ".baixar"
            );

        if (botaoBaixar) {

            botaoBaixar.addEventListener(
                "click",
                () => {

                    baixarArquivo(

                        dados.video,

                        dados.nome
                    );
                }
            );
        }


        const botaoPartilhar =
            artigo.querySelector(
                ".partilhar"
            );

        if (botaoPartilhar) {

            botaoPartilhar.addEventListener(
                "click",
                () => {

                    partilharConteudo(
                        dados.nome
                    );
                }
            );
        }
    }


    /* =====================================================
       CARD DA SÉRIE
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


        const botaoAssistir =
            artigo.querySelector(
                ".assistir"
            );

        if (botaoAssistir) {

            botaoAssistir.addEventListener(
                "click",
                () => {

                    abrirListaEpisodios(
                        dados
                    );
                }
            );
        }


        const botaoPartilhar =
            artigo.querySelector(
                ".partilhar"
            );

        if (botaoPartilhar) {

            botaoPartilhar.addEventListener(
                "click",
                () => {

                    partilharConteudo(
                        dados.nome
                    );
                }
            );
        }
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

            return `💰 Venda: ${escaparHTML(
                preco
            )} Kz`;
        }

        if (
            acesso === "aluguel"
        ) {

            return `🎟️ Aluguel: ${escaparHTML(
                preco
            )} Kz`;
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
       LISTA DE EPISÓDIOS
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

                        const estado =
                            episodio.url
                                ? "▶️"
                                : "⚠️";

                        mensagem +=
                            `${estado} ${episodio.numero}. ${episodio.titulo}\n`;
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

        if (
            !Number.isInteger(
                numero
            )
        ) {

            alert(
                "⚠️ Digite um número válido."
            );

            return;
        }

        let encontrado =
            null;

        /*
           Procura primeiro um episódio
           com o número informado e vídeo.
        */

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
            `${limparNomeArquivo(
                nome
            )}.mp4`;

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

                if (
                    navigator.clipboard
                ) {

                    await navigator.clipboard.writeText(
                        texto
                    );

                    alert(
                        "🔗 Texto copiado para partilhar!"
                    );

                } else {

                    alert(
                        texto
                    );
                }
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

        geracaoId++;

        /*
           Liberar vídeo temporário.
        */

        destruirVideoTemporario();


        /*
           Liberar URL do vídeo.
        */

        if (videoURL) {

            try {

                URL.revokeObjectURL(
                    videoURL
                );

            } catch (erro) {}
        }


        /*
           Resetar campos.
        */

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


        /*
           Resetar preview.
        */

        previewCapa.innerHTML =
            "Pré-visualização da capa";


        /*
           Limpar temporadas.
        */

        listaTemporadas.innerHTML =
            "";


        /*
           Estado.
        */

        capaURL =
            null;

        capaManual =
            false;

        videoSelecionado =
            null;

        videoURL =
            null;

        duracaoVideo =
            0;

        tempoCapa =
            3;

        gerandoCapas =
            false;

        temporadaDados =
            [];


        /*
           Esconder capas.
        */

        esconderSistemaCapas();


        /*
           Limpar opções antigas.
        */

        const opcoes =
            document.getElementById(
                "opcoesCapas"
            );

        if (opcoes) {

            opcoes.innerHTML =
                "";
        }


        atualizarTipoConteudo();

        atualizarPreco();
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
            String(
                texto ?? ""
            );

        return div.innerHTML;
    }


    /* =====================================================
       LIMPAR NOME DE ARQUIVO
       ===================================================== */

    function limparNomeArquivo(
        nome
    ) {

        return String(
            nome || "filme"
        )
            .replace(
                /[<>:"/\\|?*]+/g,
                ""
            )
            .trim()
            .substring(
                0,
                100
            ) ||
            "filme";
    }


    /* =====================================================
       MENSAGEM DE SUCESSO
       ===================================================== */

    function mostrarMensagemSucesso(
        mensagem
    ) {

        /*
           Por enquanto usamos alert.
           Mais tarde podemos substituir
           por uma notificação moderna.
        */

        alert(
            mensagem
        );
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
       TECLA ESC
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }

            if (
                modalPublicacao &&
                modalPublicacao.classList.contains(
                    "ativo"
                )
            ) {

                fecharModalPublicacao();
            }

            if (
                modalPlayer &&
                modalPlayer.classList.contains(
                    "ativo"
                )
            ) {

                fecharVideo();
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
        "🎬 I.M.A Filmes iniciado corretamente!"
    );

    console.log(
        "🤖 Sistema de 5 capas automáticas ativado!"
    );

});
```

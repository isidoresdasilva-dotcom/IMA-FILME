const botaoEnviar = document.getElementById("botaoEnviar");
const botaoEnviarMenu = document.getElementById("botaoEnviarMenu");
const arquivoVideo = document.getElementById("arquivoVideo");

function abrirSeletorVideo() {
    arquivoVideo.click();
}

botaoEnviar.addEventListener("click", abrirSeletorVideo);
botaoEnviarMenu.addEventListener("click", abrirSeletorVideo);

arquivoVideo.addEventListener("change", function () {

    const arquivo = this.files[0];

    if (!arquivo) {
        return;
    }

    if (!arquivo.type.startsWith("video/")) {
        alert("Por favor, selecione um arquivo de vídeo.");
        return;
    }

    const urlVideo = URL.createObjectURL(arquivo);

    criarCardVideo(
        arquivo.name,
        urlVideo
    );
});


function criarCardVideo(nome, url) {

    const secaoFilmes = document.querySelector(".filmes");

    const artigo = document.createElement("article");

    artigo.className = "card";

    artigo.innerHTML = `
        <div class="capa">
            <video 
                src="${url}" 
                controls
                preload="metadata"
            ></video>
        </div>

        <h3>${nome}</h3>

        <p>Meu vídeo • 2026</p>

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

    secaoFilmes.prepend(artigo);

    const video = artigo.querySelector("video");

    const assistir = artigo.querySelector(".assistir");

    assistir.addEventListener("click", function () {

        video.play();

    });

    const baixar = artigo.querySelector(".baixar");

    baixar.addEventListener("click", function () {

        const link = document.createElement("a");

        link.href = url;
        link.download = nome;

        link.click();

    });

    const partilhar = artigo.querySelector(".partilhar");

    partilhar.addEventListener("click", async function () {

        try {

            await navigator.clipboard.writeText(url);

            alert("Link do vídeo copiado!");

        } catch (erro) {

            alert("Não foi possível copiar o link.");

        }

    });

}

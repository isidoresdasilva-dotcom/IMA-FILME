// ==========================================
// I.M.A FILMES - VERSÃO 1
// ==========================================

// Pesquisa
const campoPesquisa = document.querySelector(".pesquisa input");
const cards = document.querySelectorAll(".card");

campoPesquisa.addEventListener("input", function () {

    const texto = this.value.toLowerCase();

    cards.forEach(card => {

        const nome = card.querySelector("h3").textContent.toLowerCase();

        if (nome.includes(texto)) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }

    });

});


// Botão "Enviar Filme"
const botoesEnviar = document.querySelectorAll(".enviar, .botao-principal");

botoesEnviar.forEach(botao => {

    botao.addEventListener("click", function () {

        alert(
            "📤 ÁREA DE ENVIO\n\n" +
            "Nesta próxima etapa vamos permitir que você escolha " +
            "um filme ou série do seu computador ou celular."
        );

    });

});


// Botões dos filmes
const botoesFilmes = document.querySelectorAll(".botoes button");

botoesFilmes.forEach((botao, index) => {

    botao.addEventListener("click", function () {

        const card = this.closest(".card");
        const nome = card.querySelector("h3").textContent;

        // Primeiro botão = assistir
        if (index % 3 === 0) {

            alert(
                "▶️ ASSISTIR\n\n" +
                "Você selecionou: " + nome
            );

        }

        // Segundo botão = baixar
        else if (index % 3 === 1) {

            alert(
                "⬇️ DOWNLOAD\n\n" +
                "O download de \"" + nome +
                "\" será conectado ao armazenamento na próxima etapa."
            );

        }

        // Terceiro botão = compartilhar
        else {

            const link = window.location.href;

            if (navigator.share) {

                navigator.share({
                    title: nome,
                    text: "Confira este conteúdo no I.M.A Filmes",
                    url: link
                });

            } else {

                navigator.clipboard.writeText(link);

                alert(
                    "🔗 LINK COPIADO!\n\n" +
                    "O link do I.M.A Filmes foi copiado."
                );

            }

        }

    });

});


// Botão Ver todos
const verTodos = document.querySelector(".titulo-secao button");

verTodos.addEventListener("click", function () {

    cards.forEach(card => {
        card.style.display = "";
    });

    campoPesquisa.value = "";

});


// Botões do menu
const menuBotoes = document.querySelectorAll(".menu button");

menuBotoes.forEach(botao => {

    botao.addEventListener("click", function () {

        menuBotoes.forEach(item => {
            item.classList.remove("menu-ativo");
        });

        this.classList.add("menu-ativo");

    });

});


// Relógio simples no console
console.log("🎬 I.M.A Filmes iniciado com sucesso!");

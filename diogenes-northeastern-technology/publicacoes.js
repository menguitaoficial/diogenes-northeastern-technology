/* =========================================
   GERENCIAMENTO DE BANNERS
   Diogenes Northeastern Technology
   ========================================= */

(() => {
    "use strict";

    const CHAVE_BANNERS = "diogenes_banners";
    const LIMITE_IMAGEM = 800 * 1024;

    const form = document.getElementById("form-banner");
    const inputImagem = document.getElementById("imagem-banner");
    const inputLink = document.getElementById("link-banner");
    const mensagem = document.getElementById("mensagem-banner");
    const lista = document.getElementById("lista-banners");
    const contador = document.getElementById("contador-banners");
    const filtro = document.getElementById("filtro-banners");

    if (!form || !inputImagem || !lista) return;

    // Evita registrar o mesmo evento mais de uma vez.
    if (form.dataset.bannerInicializado === "true") return;
    form.dataset.bannerInicializado = "true";

    let publicando = false;

    function lerBanners() {
        try {
            const dados = JSON.parse(
                localStorage.getItem(CHAVE_BANNERS) || "[]"
            );

            if (!Array.isArray(dados)) return [];

            const vistos = new Set();
            const resultado = [];

            dados.forEach((banner, indice) => {
                if (!banner || typeof banner !== "object") return;

                const imagem =
                    banner.imagem ||
                    banner.imagemUrl ||
                    banner.src ||
                    banner.image ||
                    "";

                const link = banner.link || "";

                if (!imagem) return;

                // Remove somente banners com imagem e link idênticos.
                const chave = `${imagem}|||${link}`;

                if (vistos.has(chave)) return;

                vistos.add(chave);

                resultado.push({
                    ...banner,
                    id: banner.id || `banner-${Date.now()}-${indice}`,
                    imagem,
                    link
                });
            });

            // Atualiza o armazenamento somente se houve alteração.
            const original = JSON.stringify(dados);
            const corrigido = JSON.stringify(resultado);

            if (original !== corrigido) {
                localStorage.setItem(CHAVE_BANNERS, corrigido);
            }

            return resultado;
        } catch (erro) {
            console.error("Erro ao ler os banners:", erro);
            return [];
        }
    }

    function salvarBanners(banners) {
        localStorage.setItem(
            CHAVE_BANNERS,
            JSON.stringify(banners)
        );
    }

    function mostrarMensagem(texto, erro = false) {
        if (!mensagem) return;

        mensagem.textContent = texto;
        mensagem.style.color = erro ? "#ff7777" : "#00baff";
    }

    function atualizarFiltro(banners) {
        if (!filtro) return;

        const valorAnterior = filtro.value || "todos";

        filtro.innerHTML = "";

        const opcaoTodos = document.createElement("option");
        opcaoTodos.value = "todos";
        opcaoTodos.textContent = "Todos os banners";
        filtro.appendChild(opcaoTodos);

        banners.forEach((banner, indice) => {
            const opcao = document.createElement("option");
            opcao.value = banner.id;
            opcao.textContent = `Banner ${indice + 1}`;
            filtro.appendChild(opcao);
        });

        const valorExiste = [...filtro.options].some(
            opcao => opcao.value === valorAnterior
        );

        filtro.value = valorExiste ? valorAnterior : "todos";
    }

    function renderizarBanners() {
        const banners = lerBanners();

        if (contador) {
            contador.textContent = banners.length;
        }

        atualizarFiltro(banners);

        const selecionado = filtro?.value || "todos";

        const exibidos = selecionado === "todos"
            ? banners
            : banners.filter(banner => banner.id === selecionado);

        lista.replaceChildren();

        if (exibidos.length === 0) {
            const vazio = document.createElement("div");
            vazio.className = "vazio-banners";

            const titulo = document.createElement("strong");
            titulo.textContent = banners.length
                ? "Nenhum banner encontrado."
                : "Você ainda não cadastrou banners.";

            const descricao = document.createElement("p");
            descricao.textContent = banners.length
                ? "Selecione outro filtro para visualizar os banners."
                : "Use o formulário ao lado para adicionar a primeira imagem.";

            vazio.append(titulo, descricao);
            lista.appendChild(vazio);
            return;
        }

        exibidos.forEach(banner => {
            const cartao = document.createElement("article");
            cartao.className = "item-banner";

            const imagem = document.createElement("img");
            imagem.src = banner.imagem;
            imagem.alt = "Imagem do banner";
            imagem.loading = "lazy";

            const detalhes = document.createElement("div");
            detalhes.className = "detalhes-banner";

            const titulo = document.createElement("strong");
            titulo.textContent = `Banner ${banners.indexOf(banner) + 1}`;

            const destino = document.createElement("p");
            destino.textContent = banner.link
                ? banner.link
                : "Sem link de destino";

            const botaoExcluir = document.createElement("button");
            botaoExcluir.type = "button";
            botaoExcluir.textContent = "Excluir banner";

            botaoExcluir.addEventListener("click", () => {
                const confirmar = window.confirm(
                    "Deseja realmente excluir este banner?"
                );

                if (!confirmar) return;

                const atualizados = lerBanners().filter(
                    item => item.id !== banner.id
                );

                salvarBanners(atualizados);
                renderizarBanners();
                mostrarMensagem("Banner excluído com sucesso!");
            });

            detalhes.append(titulo, destino, botaoExcluir);
            cartao.append(imagem, detalhes);
            lista.appendChild(cartao);
        });
    }

    form.addEventListener("submit", async evento => {
        evento.preventDefault();

        // Bloqueia envios simultâneos.
        if (publicando) return;

        const arquivo = inputImagem.files?.[0];

        if (!arquivo) {
            mostrarMensagem("Selecione uma imagem.", true);
            return;
        }

        const formatosAceitos = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!formatosAceitos.includes(arquivo.type)) {
            mostrarMensagem(
                "Formato inválido. Use JPG, PNG ou WEBP.",
                true
            );
            return;
        }

        if (arquivo.size > LIMITE_IMAGEM) {
            mostrarMensagem(
                "A imagem ultrapassa 800 KB. Reduza o tamanho e tente novamente.",
                true
            );
            return;
        }

        const link = inputLink?.value.trim() || "";

        if (link) {
            try {
                const url = new URL(link);

                if (!["http:", "https:"].includes(url.protocol)) {
                    throw new Error("Link inválido");
                }
            } catch {
                mostrarMensagem("Informe um link válido.", true);
                return;
            }
        }

        publicando = true;

        const botao = form.querySelector('[type="submit"]');

        if (botao) botao.disabled = true;

        try {
            const imagemBase64 = await new Promise((resolve, reject) => {
                const leitor = new FileReader();

                leitor.onload = () => resolve(leitor.result);
                leitor.onerror = () => reject(
                    new Error("Não foi possível ler a imagem.")
                );

                leitor.readAsDataURL(arquivo);
            });

            const banners = lerBanners();

            // Impede cadastrar novamente a mesma imagem com o mesmo link.
            const duplicado = banners.some(banner =>
                banner.imagem === imagemBase64 &&
                (banner.link || "") === link
            );

            if (duplicado) {
                mostrarMensagem(
                    "Este banner já está cadastrado.",
                    true
                );
                return;
            }

            banners.push({
                id: `banner-${Date.now()}-${Math.random()
                    .toString(36).slice(2, 9)}`,
                imagem: imagemBase64,
                link,
                criadoEm: new Date().toISOString()
            });

            salvarBanners(banners);

            form.reset();
            renderizarBanners();

            mostrarMensagem("Banner publicado com sucesso!");
        } catch (erro) {
            console.error("Erro ao publicar banner:", erro);

            mostrarMensagem(
                "Não foi possível publicar. Verifique o espaço disponível no navegador.",
                true
            );
        } finally {
            publicando = false;

            if (botao) botao.disabled = false;
        }
    });

    filtro?.addEventListener("change", renderizarBanners);

    // Exibe os banners já cadastrados sem duplicá-los.
    renderizarBanners();
})();
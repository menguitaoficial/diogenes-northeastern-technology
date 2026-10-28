
"use strict";

/* =========================================================
   DIOGENES NORTHEASTERN TECHNOLOGY
   Gerenciamento de publicações e banners
   ========================================================= */

const CHAVE_PUBLICACOES = "diogenes_publicacoes";
const CHAVE_BANNERS = "diogenes_banners";

const CATEGORIAS = {
    musica: "Música",
    jogos: "Jogos",
    fotos: "Fotos",
    "mensagem-do-dia": "Mensagem do Dia",
    poemas: "Poemas"
};

/* =========================================================
   FUNÇÕES GERAIS
   ========================================================= */

function gerarId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function lerLista(chave) {
    try {
        const dados = JSON.parse(localStorage.getItem(chave) || "[]");
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error("Não foi possível ler:", chave, erro);
        return [];
    }
}

function salvarLista(chave, lista) {
    try {
        localStorage.setItem(chave, JSON.stringify(lista));
        return true;
    } catch (erro) {
        console.error("Não foi possível salvar:", chave, erro);
        return false;
    }
}

function obterElemento(id) {
    return document.getElementById(id);
}

function mostrarMensagem(texto, tipo = "sucesso") {
    const elemento = obterElemento("mensagem");

    if (!elemento) return;

    elemento.textContent = texto;
    elemento.className = "mensagem " + tipo;
    elemento.hidden = false;
}

function mostrarMensagemBanner(texto, tipo = "sucesso") {
    const elemento = obterElemento("mensagem-banner");

    if (elemento) {
        elemento.textContent = texto;
        elemento.className = "mensagem " + tipo;
        elemento.hidden = false;
    }

    if (tipo === "sucesso") {
        alert(texto);
    }
}

function obterCategoria(categoria) {
    return CATEGORIAS[categoria] || categoria || "Sem categoria";
}

function dataPublicacao(publicacao) {
    const valor = publicacao.data || publicacao.criadoEm;

    if (!valor) return "";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "";

    return data.toLocaleDateString("pt-BR");
}

function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) elemento.className = classe;
    if (texto !== undefined) elemento.textContent = texto;

    return elemento;
}

/* =========================================================
   PUBLICAÇÕES
   Chave preservada: diogenes_publicacoes
   ========================================================= */

function carregarPublicacoes() {
    return lerLista(CHAVE_PUBLICACOES);
}

function salvarPublicacoes(publicacoes) {
    return salvarLista(CHAVE_PUBLICACOES, publicacoes);
}

function ordenarPublicacoes(publicacoes) {
    return [...publicacoes].sort((a, b) => {
        const dataA = new Date(a.data || a.criadoEm || 0).getTime();
        const dataB = new Date(b.data || b.criadoEm || 0).getTime();

        return dataB - dataA;
    });
}

function limparFormularioPublicacao() {
    const formulario = obterElemento("form-publicacao");

    if (formulario) formulario.reset();

    const id = obterElemento("post-id");
    if (id) id.value = "";

    const tituloFormulario = obterElemento("titulo-formulario");
    if (tituloFormulario) {
        tituloFormulario.textContent = "Cadastrar publicação";
    }

    const botaoSalvar = obterElemento("botao-salvar");
    if (botaoSalvar) {
        botaoSalvar.innerHTML = 'Publicar conteúdo <span>→</span>';
    }

    const cancelar = obterElemento("cancelar-edicao");
    if (cancelar) cancelar.hidden = true;
}

function cadastrarOuEditarPublicacao(evento) {
    evento.preventDefault();

    const campoId = obterElemento("post-id");
    const campoCategoria = obterElemento("categoria");
    const campoTitulo = obterElemento("titulo");
    const campoDescricao = obterElemento("descricao");
    const campoImagem = obterElemento("imagem");
    const campoLink = obterElemento("link");

    if (
        !campoCategoria ||
        !campoTitulo ||
        !campoDescricao
    ) {
        mostrarMensagem(
            "Não foi possível localizar os campos do formulário.",
            "erro"
        );
        return;
    }

    const categoria = campoCategoria.value;
    const titulo = campoTitulo.value.trim();
    const descricao = campoDescricao.value.trim();
    const imagem = campoImagem ? campoImagem.value.trim() : "";
    const link = campoLink ? campoLink.value.trim() : "";
    const idExistente = campoId ? campoId.value : "";

    if (!categoria || !CATEGORIAS[categoria]) {
        mostrarMensagem("Selecione uma categoria válida.", "erro");
        campoCategoria.focus();
        return;
    }

    if (!titulo) {
        mostrarMensagem("Preencha o título da publicação.", "erro");
        campoTitulo.focus();
        return;
    }

    if (!descricao) {
        mostrarMensagem("O campo Descrição ou conteúdo é obrigatório.", "erro");
        campoDescricao.focus();
        return;
    }

    if (imagem && !campoImagem.validity.valid) {
        mostrarMensagem("Informe um link de imagem válido.", "erro");
        campoImagem.focus();
        return;
    }

    if (link && !campoLink.validity.valid) {
        mostrarMensagem("Informe um link externo válido.", "erro");
        campoLink.focus();
        return;
    }

    const publicacoes = carregarPublicacoes();
    const agora = new Date().toISOString();

    if (idExistente) {
        const indice = publicacoes.findIndex(
            publicacao => String(publicacao.id) === String(idExistente)
        );

        if (indice === -1) {
            mostrarMensagem(
                "Não foi possível localizar a publicação para editar.",
                "erro"
            );
            return;
        }

        const antiga = publicacoes[indice];

        publicacoes[indice] = {
            ...antiga,
            categoria,
            titulo,
            descricao,
            imagem,
            link,
            atualizadoEm: agora
        };

        if (!salvarPublicacoes(publicacoes)) {
            mostrarMensagem(
                "Não foi possível salvar. O armazenamento pode estar cheio.",
                "erro"
            );
            return;
        }

        limparFormularioPublicacao();
        atualizarListaPublicacoes();

        mostrarMensagem("Publicação editada com sucesso!");
        return;
    }

    const novaPublicacao = {
        id: gerarId(),
        categoria,
        titulo,
        descricao,
        imagem,
        link,
        data: agora
    };

    publicacoes.push(novaPublicacao);

    if (!salvarPublicacoes(publicacoes)) {
        mostrarMensagem(
            "Não foi possível salvar. O armazenamento pode estar cheio.",
            "erro"
        );
        return;
    }

    limparFormularioPublicacao();
    atualizarListaPublicacoes();

    mostrarMensagem("Publicação cadastrada com sucesso!");
}

function editarPublicacao(id) {
    const publicacao = carregarPublicacoes().find(
        item => String(item.id) === String(id)
    );

    if (!publicacao) {
        mostrarMensagem("Publicação não encontrada.", "erro");
        return;
    }

    obterElemento("post-id").value = publicacao.id;
    obterElemento("categoria").value = publicacao.categoria || "";
    obterElemento("titulo").value = publicacao.titulo || "";
    obterElemento("descricao").value = publicacao.descricao || "";
    obterElemento("imagem").value = publicacao.imagem || "";
    obterElemento("link").value = publicacao.link || "";

    const tituloFormulario = obterElemento("titulo-formulario");
    if (tituloFormulario) {
        tituloFormulario.textContent = "Editar publicação";
    }

    const botaoSalvar = obterElemento("botao-salvar");
    if (botaoSalvar) {
        botaoSalvar.innerHTML = 'Salvar alterações <span>→</span>';
    }

    const cancelar = obterElemento("cancelar-edicao");
    if (cancelar) cancelar.hidden = false;

    obterElemento("form-publicacao").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function excluirPublicacao(id) {
    const publicacoes = carregarPublicacoes();

    const publicacao = publicacoes.find(
        item => String(item.id) === String(id)
    );

    if (!publicacao) return;

    const confirmar = window.confirm(
        `Deseja excluir a publicação "${publicacao.titulo}"?`
    );

    if (!confirmar) return;

    const atualizadas = publicacoes.filter(
        item => String(item.id) !== String(id)
    );

    if (!salvarPublicacoes(atualizadas)) {
        mostrarMensagem("Não foi possível excluir a publicação.", "erro");
        return;
    }

    /*
      Os comentários não são apagados aqui.
      Assim, as chaves comentarios_ID existentes permanecem intactas.
    */

    if (
        String(obterElemento("post-id")?.value || "") === String(id)
    ) {
        limparFormularioPublicacao();
    }

    atualizarListaPublicacoes();
    mostrarMensagem("Publicação excluída com sucesso!");
}

function criarCartaoPublicacao(publicacao) {
    const cartao = criarElemento("article", "item-publicacao");

    const cabecalho = criarElemento("div", "cabecalho-publicacao");

    const categoria = criarElemento(
        "span",
        "categoria-publicacao",
        obterCategoria(publicacao.categoria)
    );

    const data = criarElemento(
        "span",
        "data-publicacao",
        dataPublicacao(publicacao)
    );

    cabecalho.append(categoria, data);

    const titulo = criarElemento(
        "h3",
        "titulo-publicacao",
        publicacao.titulo || "Sem título"
    );

    const descricao = criarElemento(
        "p",
        "descricao-publicacao",
        publicacao.descricao || ""
    );

    cartao.append(cabecalho, titulo, descricao);

    if (publicacao.imagem) {
        const imagem = criarElemento("img", "imagem-publicacao");

        imagem.src = publicacao.imagem;
        imagem.alt = publicacao.titulo || "Imagem da publicação";
        imagem.loading = "lazy";

        imagem.addEventListener("error", () => imagem.remove(), {
            once: true
        });

        cartao.appendChild(imagem);
    }

    if (publicacao.link) {
        const link = criarElemento(
            "a",
            "link-publicacao",
            "Abrir link externo ↗"
        );

        link.href = publicacao.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        cartao.appendChild(link);
    }

    const acoes = criarElemento("div", "acoes-publicacao");

    const botaoEditar = criarElemento(
        "button",
        "botao-editar",
        "Editar"
    );

    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", () => {
        editarPublicacao(publicacao.id);
    });

    const botaoExcluir = criarElemento(
        "button",
        "botao-excluir",
        "Excluir"
    );

    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", () => {
        excluirPublicacao(publicacao.id);
    });

    acoes.append(botaoEditar, botaoExcluir);
    cartao.appendChild(acoes);

    return cartao;
}

function atualizarListaPublicacoes() {
    const lista = obterElemento("lista-publicacoes");
    const contador = obterElemento("contador");
    const filtro = obterElemento("filtro-categoria");

    if (!lista) return;

    const todas = ordenarPublicacoes(carregarPublicacoes());
    const categoriaSelecionada = filtro ? filtro.value : "todas";

    const filtradas = categoriaSelecionada === "todas"
        ? todas
        : todas.filter(
            publicacao => publicacao.categoria === categoriaSelecionada
        );

    lista.replaceChildren();

    if (contador) {
        contador.textContent = String(filtradas.length);
    }

    if (filtradas.length === 0) {
        const vazio = criarElemento(
            "p",
            "vazio-publicacoes",
            categoriaSelecionada === "todas"
                ? "Você ainda não cadastrou publicações. Use o formulário para criar a primeira!"
                : "Nenhuma publicação encontrada nesta categoria."
        );

        lista.appendChild(vazio);
        return;
    }

    filtradas.forEach(publicacao => {
        lista.appendChild(criarCartaoPublicacao(publicacao));
    });
}

/* =========================================================
   BANNERS
   Chave preservada: diogenes_banners
   ========================================================= */

function carregarBanners() {
    return lerLista(CHAVE_BANNERS);
}

function salvarBanners(banners) {
    return salvarLista(CHAVE_BANNERS, banners);
}

function atualizarListaBanners() {
    const lista = obterElemento("lista-banners");
    const contador = obterElemento("contador-banners");
    const filtro = obterElemento("filtro-banners");

    if (!lista) return;

    const banners = carregarBanners();
    const valorFiltro = filtro ? filtro.value : "todos";

    const filtrados = valorFiltro === "todos"
        ? banners
        : banners.filter(
            banner => String(banner.id) === String(valorFiltro)
        );

    if (contador) {
        contador.textContent = String(banners.length);
    }

    if (filtro) {
        const valorAnterior = filtro.value;

        filtro.replaceChildren();

        const opcaoTodas = document.createElement("option");
        opcaoTodas.value = "todos";
        opcaoTodas.textContent = "Todos os banners";
        filtro.appendChild(opcaoTodas);

        banners.forEach((banner, indice) => {
            const opcao = document.createElement("option");

            opcao.value = String(banner.id);
            opcao.textContent = `Banner ${indice + 1}`;

            filtro.appendChild(opcao);
        });

        const existeOpcao = [...filtro.options].some(
            opcao => opcao.value === valorAnterior
        );

        filtro.value = existeOpcao ? valorAnterior : "todos";
    }

    const filtroAtual = filtro ? filtro.value : "todos";
    const bannersExibidos = filtroAtual === "todos"
        ? banners
        : banners.filter(
            banner => String(banner.id) === String(filtroAtual)
        );

    lista.replaceChildren();

    if (bannersExibidos.length === 0) {
        const vazio = criarElemento("div", "vazio-banners");

        const icone = criarElemento(
            "span",
            "icone-vazio-banner",
            "▧"
        );

        const titulo = criarElemento(
            "strong",
            "",
            "Você ainda não cadastrou banners."
        );

        const descricao = criarElemento(
            "p",
            "",
            "Use o formulário ao lado para adicionar a primeira imagem."
        );

        vazio.append(icone, titulo, descricao);
        lista.appendChild(vazio);
        return;
    }

    bannersExibidos.forEach((banner) => {
        const cartao = criarElemento("article", "item-banner");

        const imagemBanner = criarElemento("img", "imagem-banner-cadastrado");

        /*
          Compatibilidade com formatos comuns de objetos de banner.
        */
        imagemBanner.src =
            banner.imagem ||
            banner.imagemUrl ||
            banner.src ||
            banner.url ||
            "";

        imagemBanner.alt = "Prévia do banner cadastrado";
        imagemBanner.loading = "lazy";

        imagemBanner.addEventListener("error", () => {
            imagemBanner.alt = "Não foi possível carregar a imagem do banner";
        }, { once: true });

        const titulo = criarElemento(
            "h4",
            "",
            `Banner ${banners.indexOf(banner) + 1}`
        );

        const descricao = criarElemento(
            "p",
            "",
            banner.link ? "Possui link de destino" : "Sem link de destino"
        );

        const botaoExcluir = criarElemento(
            "button",
            "botao-excluir-banner",
            "Excluir banner"
        );

        botaoExcluir.type = "button";

        botaoExcluir.addEventListener("click", () => {
            excluirBanner(banner.id);
        });

        cartao.append(
            imagemBanner,
            titulo,
            descricao,
            botaoExcluir
        );

        lista.appendChild(cartao);
    });
}

function publicarBanner(evento) {
    evento.preventDefault();

    const campoImagem = obterElemento("imagem-banner");
    const campoLink = obterElemento("link-banner");

    if (!campoImagem || !campoImagem.files || !campoImagem.files[0]) {
        mostrarMensagemBanner("Selecione uma imagem para o banner.", "erro");
        return;
    }

    const arquivo = campoImagem.files[0];
    const link = campoLink ? campoLink.value.trim() : "";

    const formatosPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!formatosPermitidos.includes(arquivo.type)) {
        mostrarMensagemBanner(
            "Formato inválido. Envie uma imagem JPG, PNG ou WEBP.",
            "erro"
        );
        return;
    }

    if (arquivo.size > 800 * 1024) {
        mostrarMensagemBanner(
            "A imagem ultrapassa o limite de 800 KB.",
            "erro"
        );
        return;
    }

    if (link && campoLink && !campoLink.validity.valid) {
        mostrarMensagemBanner("Informe um link de destino válido.", "erro");
        campoLink.focus();
        return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
        const banners = carregarBanners();

        banners.push({
            id: gerarId(),
            imagem: leitor.result,
            link,
            data: new Date().toISOString()
        });

        if (!salvarBanners(banners)) {
            mostrarMensagemBanner(
                "Não foi possível salvar o banner. A imagem pode ser grande demais para o armazenamento do navegador.",
                "erro"
            );
            return;
        }

        const formulario = obterElemento("form-banner");
        if (formulario) formulario.reset();

        atualizarListaBanners();

        mostrarMensagemBanner("Banner publicado com sucesso!");
    };

    leitor.onerror = () => {
        mostrarMensagemBanner(
            "Não foi possível ler a imagem selecionada.",
            "erro"
        );
    };

    leitor.readAsDataURL(arquivo);
}

function excluirBanner(id) {
    const banners = carregarBanners();

    const banner = banners.find(
        item => String(item.id) === String(id)
    );

    if (!banner) return;

    const confirmar = window.confirm(
        "Tem certeza de que deseja excluir este banner?"
    );

    if (!confirmar) return;

    const atualizados = banners.filter(
        item => String(item.id) !== String(id)
    );

    if (!salvarBanners(atualizados)) {
        mostrarMensagemBanner("Não foi possível excluir o banner.", "erro");
        return;
    }

    atualizarListaBanners();
    mostrarMensagemBanner("Banner excluído com sucesso!");
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

function inicializarPainel() {
    const formularioPublicacao = obterElemento("form-publicacao");

    if (formularioPublicacao) {
        formularioPublicacao.addEventListener(
            "submit",
            cadastrarOuEditarPublicacao
        );
    }

    const filtroCategoria = obterElemento("filtro-categoria");

    if (filtroCategoria) {
        filtroCategoria.addEventListener(
            "change",
            atualizarListaPublicacoes
        );
    }

    const cancelarEdicao = obterElemento("cancelar-edicao");

    if (cancelarEdicao) {
        cancelarEdicao.addEventListener("click", () => {
            limparFormularioPublicacao();
            mostrarMensagem("Edição cancelada.");
        });
    }

    const formularioBanner = obterElemento("form-banner");

    if (formularioBanner) {
        formularioBanner.addEventListener("submit", publicarBanner);
    }

    const filtroBanners = obterElemento("filtro-banners");

    if (filtroBanners) {
        filtroBanners.addEventListener("change", atualizarListaBanners);
    }

    const ano = obterElemento("ano");

    if (ano) {
        ano.textContent = new Date().getFullYear();
    }

    atualizarListaPublicacoes();
    atualizarListaBanners();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarPainel);
} else {
    inicializarPainel();
}


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
    filmes: "Filmes",
    series: "Séries",
    "mensagem-do-dia": "Mensagem do Dia"
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
    if (obterElemento("url-jogo")) obterElemento("url-jogo").value = "";
    atualizarCampoJogo();

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


function atualizarCampoJogo() {
    const categoria = obterElemento("categoria");
    const grupo = obterElemento("grupo-url-jogo");
    const campo = obterElemento("url-jogo");
    if (!categoria || !grupo) return;
    const ehJogo = categoria.value === "jogos";
    grupo.hidden = !ehJogo;
    if (campo) {
        campo.required = ehJogo;
        campo.placeholder = "https://seusite.com/jogos/meu-jogo/";
    }
}

function cadastrarOuEditarPublicacao(evento) {
    evento.preventDefault();

    const campoId = obterElemento("post-id");
    const campoCategoria = obterElemento("categoria");
    const campoTitulo = obterElemento("titulo");
    const campoDescricao = obterElemento("descricao");
    const campoImagem = obterElemento("imagem");
    const campoLink = obterElemento("link");
    const campoUrlJogo = obterElemento("url-jogo");

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
    const urlJogo = campoUrlJogo ? campoUrlJogo.value.trim() : "";
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

    if (urlJogo) {
        try {
            const enderecoJogo = new URL(urlJogo);
            if (!["http:", "https:"].includes(enderecoJogo.protocol)) throw new Error("Protocolo inválido");
        } catch (erro) {
            mostrarMensagem("Informe um endereço válido para o jogo (https://...).", "erro");
            campoUrlJogo.focus();
            return;
        }
    }

    if (categoria === "jogos" && !urlJogo) {
        mostrarMensagem("Para publicar um jogo jogável, informe o endereço do jogo no campo indicado.", "erro");
        if (campoUrlJogo) campoUrlJogo.focus();
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
            urlJogo,
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
        urlJogo,
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
    if (obterElemento("url-jogo")) obterElemento("url-jogo").value = publicacao.urlJogo || "";
    atualizarCampoJogo();

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
    
function criarCartaoPublicacao(publicacao) {
    const cartao = criarElemento("article", "item-publicacao");

    const cabecalho = criarElemento("div", "cabecalho-publicacao");

    cabecalho.append(
        criarElemento(
            "span",
            "categoria-publicacao",
            obterCategoria(publicacao.categoria)
        ),
        criarElemento(
            "span",
            "data-publicacao",
            dataPublicacao(publicacao)
        )
    );

    cartao.append(
        cabecalho,
        criarElemento(
            "h3",
            "titulo-publicacao",
            publicacao.titulo || "Sem título"
        ),
        criarElemento(
            "p",
            "descricao-publicacao",
            publicacao.descricao || ""
        )
    );

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
        try {
            const endereco = new URL(publicacao.link);

            if (["http:", "https:"].includes(endereco.protocol)) {
                const link = criarElemento(
                    "a",
                    "link-publicacao",
                    "Abrir link externo ↗"
                );
                link.href = endereco.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                cartao.appendChild(link);
            }
        } catch (erro) {
            console.warn("Link inválido:", publicacao.link);
        }
    }

    /* Os comentários oficiais são carregados do Supabase por supabase-admin.js. */
    const area = criarElemento("section", "comentarios-admin");
    area.appendChild(criarElemento("h4", "", "Comentários desta publicação"));
    area.appendChild(criarElemento("p", "comentario-admin-vazio", "Os comentários são carregados diretamente do banco de dados."));
    cartao.appendChild(area);

    /* BOTÕES EDITAR E EXCLUIR */
    const acoes = criarElemento("div", "acoes-publicacao");

    const botaoEditar = criarElemento("button", "botao-editar", "Editar");
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", () => {
        editarPublicacao(publicacao.id);
    });

    const botaoExcluir = criarElemento("button", "botao-excluir", "Excluir");
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", () => {
        excluirPublicacao(publicacao.id);
    });

    acoes.append(botaoEditar, botaoExcluir);
    cartao.appendChild(acoes);

    return cartao;
}

}

/* =========================================================
   BANNERS NO SUPABASE + STORAGE
   ========================================================= */

let bannersCache = [];

function obterClientSupabase() {
    return window.supabaseClient || null;
}

async function carregarBanners() {
    const client = obterClientSupabase();
    if (!client) throw new Error("Conexão com Supabase indisponível.");
    const { data, error } = await client.from("banners")
        .select("id, imagem_url, link, ordem, created_at")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
    if (error) throw error;
    bannersCache = data || [];
    return bannersCache;
}

async function atualizarListaBanners() {
    const lista = obterElemento("lista-banners");
    const contador = obterElemento("contador-banners");
    const filtro = obterElemento("filtro-banners");
    if (!lista) return;
    lista.replaceChildren(criarElemento("p", "vazio-banners", "Carregando banners..."));
    try {
        const banners = await carregarBanners();
        const valorAnterior = filtro ? filtro.value : "todos";
        if (filtro) {
            filtro.replaceChildren();
            const todas = document.createElement("option");
            todas.value = "todos"; todas.textContent = "Todos os banners";
            filtro.appendChild(todas);
            banners.forEach((banner, indice) => {
                const op = document.createElement("option");
                op.value = banner.id; op.textContent = `Banner ${indice + 1}`;
                filtro.appendChild(op);
            });
            filtro.value = [...filtro.options].some(o => o.value === valorAnterior) ? valorAnterior : "todos";
        }
        if (contador) contador.textContent = String(banners.length);
        const atual = filtro ? filtro.value : "todos";
        const exibidos = atual === "todos" ? banners : banners.filter(b => b.id === atual);
        lista.replaceChildren();
        if (!exibidos.length) {
            const vazio = criarElemento("div", "vazio-banners");
            vazio.append(criarElemento("span", "icone-vazio-banner", "▧"),
                criarElemento("strong", "", "Você ainda não cadastrou banners."),
                criarElemento("p", "", "Use o formulário ao lado para adicionar a primeira imagem."));
            lista.appendChild(vazio);
            return;
        }
        exibidos.forEach((banner) => {
            const cartao = criarElemento("article", "item-banner");
            const img = criarElemento("img", "imagem-banner-cadastrado");
            img.src = banner.imagem_url; img.alt = "Prévia do banner cadastrado"; img.loading = "lazy";
            const titulo = criarElemento("h4", "", `Banner ${banners.indexOf(banner) + 1}`);
            const descricao = criarElemento("p", "", banner.link ? "Possui link de destino" : "Sem link de destino");
            const excluir = criarElemento("button", "botao-excluir-banner", "Excluir banner");
            excluir.type = "button"; excluir.addEventListener("click", () => excluirBanner(banner.id));
            cartao.append(img, titulo, descricao, excluir); lista.appendChild(cartao);
        });
    } catch (erro) {
        console.error("Erro ao listar banners:", erro);
        lista.replaceChildren(criarElemento("p", "vazio-banners", "Não foi possível carregar os banners: " + (erro.message || "erro desconhecido")));
    }
}

async function publicarBanner(evento) {
    evento.preventDefault();
    const client = obterClientSupabase();
    const campoImagem = obterElemento("imagem-banner");
    const campoLink = obterElemento("link-banner");
    const arquivo = campoImagem?.files?.[0];
    const link = campoLink ? campoLink.value.trim() : "";
    if (!client) { mostrarMensagemBanner("Conexão com Supabase indisponível.", "erro"); return; }
    const { data: { session } } = await client.auth.getSession();
    if (!session) { mostrarMensagemBanner("Entre na área administrativa para cadastrar banners.", "erro"); return; }
    if (!arquivo) { mostrarMensagemBanner("Selecione uma imagem para o banner.", "erro"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
        mostrarMensagemBanner("Formato inválido. Envie JPG, PNG ou WEBP.", "erro"); return;
    }
    if (arquivo.size > 800 * 1024) { mostrarMensagemBanner("A imagem ultrapassa o limite de 800 KB.", "erro"); return; }
    if (link) {
        try { const u = new URL(link); if (!["http:", "https:"].includes(u.protocol)) throw new Error(); }
        catch (_) { mostrarMensagemBanner("Informe um link de destino válido começando com https://.", "erro"); return; }
    }
    const botao = evento.submitter || obterElemento("botao-publicar-banner");
    if (botao) botao.disabled = true;
    const extensao = arquivo.name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const caminho = `banners/${crypto.randomUUID()}.${extensao}`;
    try {
        const { error: uploadError } = await client.storage.from("midias-site").upload(caminho, arquivo, {
            upsert: false, contentType: arquivo.type
        });
        if (uploadError) throw uploadError;
        const { data: publicData } = client.storage.from("midias-site").getPublicUrl(caminho);
        const { error: insertError } = await client.from("banners").insert({
            imagem_url: publicData.publicUrl, link: link || null,
            ordem: bannersCache.length
        });
        if (insertError) {
            await client.storage.from("midias-site").remove([caminho]);
            throw insertError;
        }
        obterElemento("form-banner")?.reset();
        await atualizarListaBanners();
        mostrarMensagemBanner("Banner publicado com sucesso! Ele já estará disponível em todos os dispositivos.");
    } catch (erro) {
        console.error("Erro ao publicar banner:", erro);
        mostrarMensagemBanner(erro.message || "Não foi possível publicar o banner.", "erro");
    } finally { if (botao) botao.disabled = false; }
}

async function excluirBanner(id) {
    const banner = bannersCache.find(item => String(item.id) === String(id));
    if (!banner || !window.confirm("Tem certeza de que deseja excluir este banner?")) return;
    const client = obterClientSupabase();
    try {
        const { error } = await client.from("banners").delete().eq("id", id);
        if (error) throw error;
        // Remove o arquivo do bucket quando a URL pertence ao nosso bucket.
        const marcador = "/storage/v1/object/public/midias-site/";
        const pos = (banner.imagem_url || "").indexOf(marcador);
        if (pos >= 0) {
            const caminho = decodeURIComponent(banner.imagem_url.slice(pos + marcador.length));
            const { error: storageError } = await client.storage.from("midias-site").remove([caminho]);
            if (storageError) console.warn("Registro excluído, mas o arquivo não foi removido:", storageError);
        }
        await atualizarListaBanners();
        mostrarMensagemBanner("Banner excluído com sucesso!");
    } catch (erro) {
        console.error("Erro ao excluir banner:", erro);
        mostrarMensagemBanner(erro.message || "Não foi possível excluir o banner.", "erro");
    }
}

async function migrarBannersAntigos() {
    const chave = "diogenes_banners";
    let antigos = [];
    try { antigos = JSON.parse(localStorage.getItem(chave) || "[]"); } catch (_) {}
    if (!Array.isArray(antigos) || !antigos.length || bannersCache.length) return;
    const client = obterClientSupabase();
    const { data: { session } } = await client.auth.getSession();
    if (!session) return;
    const importar = window.confirm(`Encontrei ${antigos.length} banner(s) antigo(s) salvos neste navegador. Deseja transferi-los para o Supabase para aparecerem em todos os dispositivos?`);
    if (!importar) return;
    let importados = 0;
    for (const antigo of antigos) {
        try {
            let url = antigo.imagem || antigo.imagemUrl || antigo.src || antigo.url || "";
            if (url.startsWith("data:")) {
                const resposta = await fetch(url); const blob = await resposta.blob();
                const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
                const caminho = `banners/${crypto.randomUUID()}.${ext}`;
                const { error: upErr } = await client.storage.from("midias-site").upload(caminho, blob, { contentType: blob.type });
                if (upErr) throw upErr;
                url = client.storage.from("midias-site").getPublicUrl(caminho).data.publicUrl;
            }
            if (!url) continue;
            const { error } = await client.from("banners").insert({ imagem_url: url, link: antigo.link || null, ordem: importados });
            if (error) throw error;
            importados++;
        } catch (erro) { console.error("Falha ao migrar banner antigo:", erro); }
    }
    await atualizarListaBanners();
    if (importados) mostrarMensagemBanner(`${importados} banner(s) antigo(s) transferido(s). A cópia local foi preservada.`);
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarPainel() {
    const client = obterClientSupabase();
    const formularioBanner = obterElemento("form-banner");
    if (formularioBanner) formularioBanner.addEventListener("submit", publicarBanner);
    const filtroBanners = obterElemento("filtro-banners");
    if (filtroBanners) filtroBanners.addEventListener("change", atualizarListaBanners);
    const ano = obterElemento("ano");
    if (ano) ano.textContent = new Date().getFullYear();
    if (!client) { mostrarMensagemBanner("Conexão com Supabase não encontrada.", "erro"); return; }
    try {
        await atualizarListaBanners();
        await migrarBannersAntigos();
    } catch (erro) { console.error(erro); }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicializarPainel);
else inicializarPainel();

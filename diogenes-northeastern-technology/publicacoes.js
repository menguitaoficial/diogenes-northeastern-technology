
const CHAVE_PUBLICACOES = "diogenes_publicacoes";

const formulario = document.getElementById("form-publicacao");
const campoId = document.getElementById("post-id");
const campoCategoria = document.getElementById("categoria");
const campoTitulo = document.getElementById("titulo");
const campoDescricao = document.getElementById("descricao");
const campoImagem = document.getElementById("imagem");
const campoLink = document.getElementById("link");

const lista = document.getElementById("lista-publicacoes");
const contador = document.getElementById("contador");
const mensagem = document.getElementById("mensagem");
const filtro = document.getElementById("filtro-categoria");
const tituloFormulario = document.getElementById("titulo-formulario");
const botaoSalvar = document.getElementById("botao-salvar");
const botaoCancelar = document.getElementById("cancelar-edicao");

document.getElementById("ano").textContent = new Date().getFullYear();

const categorias = {
  musica: "Música",
  jogos: "Jogos",
  fotos: "Fotos",
  sobre: "Sobre mim"
};

let temporizadorMensagem;

function carregarPublicacoes() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_PUBLICACOES) || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function salvarPublicacoes(publicacoes) {
  localStorage.setItem(CHAVE_PUBLICACOES, JSON.stringify(publicacoes));
}

function mostrarMensagem(texto, tipo = "sucesso") {
  clearTimeout(temporizadorMensagem);

  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
  mensagem.hidden = false;

  mensagem.scrollIntoView({ behavior: "smooth", block: "nearest" });

  temporizadorMensagem = setTimeout(() => {
    mensagem.hidden = true;
  }, 5000);
}

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;

  return elemento;
}

function urlValida(valor) {
  if (!valor) return true;

  try {
    const url = new URL(valor);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function renderizarPublicacoes() {
  const todas = carregarPublicacoes();
  const selecionadas = filtro.value === "todas"
    ? todas
    : todas.filter(post => post.categoria === filtro.value);

  contador.textContent = todas.length;
  lista.replaceChildren();

  if (selecionadas.length === 0) {
    const vazio = criarElemento(
      "p",
      "vazio",
      todas.length === 0
        ? "Você ainda não cadastrou publicações. Use o formulário para criar a primeira!"
        : "Não existem publicações nesta categoria."
    );

    lista.appendChild(vazio);
    return;
  }

  selecionadas.forEach(post => {
    const cartao = criarElemento("article", "publicacao");
    const topo = criarElemento("div", "publicacao-topo");
    const tag = criarElemento(
      "span",
      "categoria-tag",
      categorias[post.categoria] || post.categoria
    );

    const data = criarElemento(
      "span",
      "data-post",
      post.atualizadoEm
        ? `Atualizado: ${new Date(post.atualizadoEm).toLocaleDateString("pt-BR")}`
        : new Date(post.criadoEm).toLocaleDateString("pt-BR")
    );

    topo.append(tag, data);
    cartao.appendChild(topo);
    cartao.appendChild(criarElemento("h3", "", post.titulo));
    cartao.appendChild(criarElemento("p", "", post.descricao));

    if (post.imagem) {
      const imagem = document.createElement("img");
      imagem.className = "miniatura";
      imagem.src = post.imagem;
      imagem.alt = `Imagem da publicação: ${post.titulo}`;
      imagem.loading = "lazy";
      imagem.referrerPolicy = "no-referrer";
      imagem.addEventListener("error", () => imagem.remove());
      cartao.appendChild(imagem);
    }

    if (post.link) {
      const link = document.createElement("a");
      link.className = "link-post";
      link.href = post.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Abrir link externo ↗";
      cartao.appendChild(link);
    }

    const acoes = criarElemento("div", "acoes-post");

    const editar = criarElemento("button", "botao-editar", "Editar");
    editar.type = "button";
    editar.addEventListener("click", () => iniciarEdicao(post.id));

    const excluir = criarElemento("button", "botao-excluir", "Excluir");
    excluir.type = "button";
    excluir.addEventListener("click", () => excluirPublicacao(post.id));

    acoes.append(editar, excluir);
    cartao.appendChild(acoes);
    lista.appendChild(cartao);
  });
}

formulario.addEventListener("submit", event => {
  event.preventDefault();

  const categoria = campoCategoria.value;
  const titulo = campoTitulo.value.trim();
  const descricao = campoDescricao.value.trim();
  const imagem = campoImagem.value.trim();
  const link = campoLink.value.trim();
  const idAtual = campoId.value;

  if (!categorias[categoria] || !titulo || !descricao) {
    mostrarMensagem("Preencha a categoria, o título e o conteúdo.", "erro");
    return;
  }

  if (!urlValida(imagem) || !urlValida(link)) {
    mostrarMensagem("Informe links válidos começando com http:// ou https://.", "erro");
    return;
  }

  const publicacoes = carregarPublicacoes();

  const dados = {
    categoria,
    titulo,
    descricao,
    imagem,
    link
  };

  try {
    if (idAtual) {
      const indice = publicacoes.findIndex(post => post.id === idAtual);

      if (indice === -1) {
        mostrarMensagem("Não foi possível encontrar esta publicação.", "erro");
        return;
      }

      publicacoes[indice] = {
        ...publicacoes[indice],
        ...dados,
        atualizadoEm: new Date().toISOString()
      };

      salvarPublicacoes(publicacoes);
      mostrarMensagem("Publicação editada com sucesso!");
    } else {
      publicacoes.unshift({
        id: crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        ...dados,
        criadoEm: new Date().toISOString()
      });

      salvarPublicacoes(publicacoes);
      mostrarMensagem("Cadastro realizado com sucesso!");
    }

    formulario.reset();
    campoId.value = "";
    filtro.value = "todas";
    voltarModoCadastro();
    renderizarPublicacoes();
  } catch (erro) {
    mostrarMensagem(
      "Não foi possível salvar. Verifique o armazenamento disponível no navegador.",
      "erro"
    );
  }
});

function iniciarEdicao(id) {
  const post = carregarPublicacoes().find(item => item.id === id);

  if (!post) {
    mostrarMensagem("Publicação não encontrada.", "erro");
    return;
  }

  campoId.value = post.id;
  campoCategoria.value = post.categoria;
  campoTitulo.value = post.titulo;
  campoDescricao.value = post.descricao;
  campoImagem.value = post.imagem || "";
  campoLink.value = post.link || "";

  tituloFormulario.textContent = "Editar publicação";
  botaoSalvar.innerHTML = "Salvar alterações <span>→</span>";
  botaoCancelar.hidden = false;

  formulario.scrollIntoView({ behavior: "smooth", block: "start" });
  campoTitulo.focus();
}

function voltarModoCadastro() {
  campoId.value = "";
  tituloFormulario.textContent = "Cadastrar publicação";
  botaoSalvar.innerHTML = "Publicar conteúdo <span>→</span>";
  botaoCancelar.hidden = true;
}

botaoCancelar.addEventListener("click", () => {
  formulario.reset();
  voltarModoCadastro();
  mostrarMensagem("Edição cancelada.", "sucesso");
});

function excluirPublicacao(id) {
  const post = carregarPublicacoes().find(item => item.id === id);

  if (!post) {
    mostrarMensagem("Publicação não encontrada.", "erro");
    return;
  }

  const confirmou = confirm(
    `Tem certeza de que deseja excluir "${post.titulo}"?\n\nEsta ação não pode ser desfeita.`
  );

  if (!confirmou) return;

  try {
    const publicacoes = carregarPublicacoes().filter(item => item.id !== id);
    salvarPublicacoes(publicacoes);

    if (campoId.value === id) {
      formulario.reset();
      voltarModoCadastro();
    }

    renderizarPublicacoes();
    mostrarMensagem("Publicação excluída com sucesso!");
  } catch {
    mostrarMensagem("Não foi possível excluir a publicação.", "erro");
  }
}

filtro.addEventListener("change", renderizarPublicacoes);

renderizarPublicacoes();


/* ==========================================
   GERENCIAMENTO DE BANNERS
   Não substitui o código das publicações.
========================================== */

(() => {
    const CHAVE = "diogenes_banners";
    const TAMANHO_MAXIMO = 800 * 1024;
    const LIMITE_BANNERS = 5;

    const formulario = document.getElementById("form-banner");
    const campoImagem = document.getElementById("imagem-banner");
    const campoLink = document.getElementById("link-banner");
    const mensagem = document.getElementById("mensagem-banner");
    const contador = document.getElementById("contador-banners");
    const lista = document.getElementById("lista-banners");
    const filtro = document.getElementById("filtro-banners");

    if (!formulario || !campoImagem || !lista) return;

    function lerBanners() {
        try {
            const dados = JSON.parse(localStorage.getItem(CHAVE) || "[]");
            return Array.isArray(dados) ? dados : [];
        } catch {
            return [];
        }
    }

    function salvarBanners(banners) {
        try {
            localStorage.setItem(CHAVE, JSON.stringify(banners));
            return true;
        } catch (erro) {
            console.error("Erro ao salvar banners:", erro);
            return false;
        }
    }

    function avisar(texto) {
        if (mensagem) mensagem.textContent = texto;
    }

    function criarVazio() {
        const vazio = document.createElement("div");
        vazio.className = "vazio-banners";

        const icone = document.createElement("span");
        icone.className = "icone-vazio-banner";
        icone.textContent = "▧";

        const titulo = document.createElement("strong");
        titulo.textContent = "Você ainda não cadastrou banners.";

        const texto = document.createElement("p");
        texto.textContent =
            "Use o formulário ao lado para adicionar a primeira imagem.";

        vazio.append(icone, titulo, texto);
        lista.appendChild(vazio);
    }

    function renderizarBanners() {
        const banners = lerBanners();
        const valorFiltro = filtro ? filtro.value : "todos";

        if (contador) contador.textContent = String(banners.length);

        lista.replaceChildren();

        const exibidos = valorFiltro === "todos"
            ? banners
            : banners.filter((banner) => banner.id === valorFiltro);

        if (exibidos.length === 0) {
            criarVazio();
            return;
        }

        exibidos.forEach((banner) => {
            const item = document.createElement("article");
            item.className = "item-banner-admin";

            const imagem = document.createElement("img");
            imagem.src = banner.imagem;
            imagem.alt = "Prévia do banner cadastrado";
            imagem.loading = "lazy";

            const detalhes = document.createElement("div");
            detalhes.className = "detalhes-banner-admin";

            const nome = document.createElement("strong");
            nome.textContent = "Banner " + (banners.indexOf(banner) + 1);

            const estado = document.createElement("p");
            estado.textContent = banner.link
                ? "Com link de destino"
                : "Sem link de destino";

            const excluir = document.createElement("button");
            excluir.type = "button";
            excluir.className = "botao-excluir-banner";
            excluir.textContent = "Excluir banner";

            excluir.addEventListener("click", () => {
                if (!confirm("Deseja excluir este banner?")) return;

                const atualizados = lerBanners().filter(
                    (itemBanner) => itemBanner.id !== banner.id
                );

                if (!salvarBanners(atualizados)) {
                    avisar("Não foi possível excluir o banner.");
                    return;
                }

                if (filtro) filtro.value = "todos";
                renderizarBanners();
                avisar("Banner excluído com sucesso!");
            });

            detalhes.append(nome, estado, excluir);
            item.append(imagem, detalhes);
            lista.appendChild(item);
        });
    }

    function atualizarFiltro() {
        if (!filtro) return;

        const valorAnterior = filtro.value;
        const banners = lerBanners();

        filtro.replaceChildren();

        const opcaoTodos = document.createElement("option");
        opcaoTodos.value = "todos";
        opcaoTodos.textContent = "Todos os banners";
        filtro.appendChild(opcaoTodos);

        banners.forEach((banner, indice) => {
            const opcao = document.createElement("option");
            opcao.value = banner.id;
            opcao.textContent = "Banner " + (indice + 1);
            filtro.appendChild(opcao);
        });

        filtro.value = banners.some((banner) => banner.id === valorAnterior)
            ? valorAnterior
            : "todos";
    }

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const arquivo = campoImagem.files[0];
        const link = campoLink.value.trim();

        if (!arquivo) {
            avisar("Selecione uma imagem para o banner.");
            return;
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
            avisar("Escolha uma imagem JPG, PNG ou WEBP.");
            return;
        }

        if (arquivo.size > TAMANHO_MAXIMO) {
            avisar("A imagem ultrapassa 800 KB. Reduza o tamanho e tente novamente.");
            return;
        }

        if (lerBanners().length >= LIMITE_BANNERS) {
            avisar("Você atingiu o limite de 5 banners. Exclua um antes de adicionar outro.");
            return;
        }

        if (link) {
            try {
                const url = new URL(link);
                if (!["http:", "https:"].includes(url.protocol)) {
                    throw new Error("Protocolo inválido");
                }
            } catch {
                avisar("Digite um endereço válido começando com https:// ou http://.");
                return;
            }
        }

        const leitor = new FileReader();

        leitor.onload = () => {
            const novoBanner = {
                id: Date.now().toString() + Math.random().toString(16).slice(2),
                imagem: leitor.result,
                link,
                criadoEm: new Date().toISOString()
            };

            const banners = lerBanners();

            if (!salvarBanners([...banners, novoBanner])) {
                avisar("Não foi possível salvar. O armazenamento do navegador pode estar cheio.");
                return;
            }

            formulario.reset();
            atualizarFiltro();
            renderizarBanners();
            avisar("Banner publicado com sucesso!");
        };

        leitor.onerror = () => avisar("Não foi possível ler a imagem escolhida.");
        leitor.readAsDataURL(arquivo);
    });

    if (filtro) {
        filtro.addEventListener("change", renderizarBanners);
    }

    window.addEventListener("storage", (evento) => {
        if (evento.key === CHAVE) {
            atualizarFiltro();
            renderizarBanners();
        }
    });

    atualizarFiltro();
    renderizarBanners();
})();

/* Cadastro de banners — não apaga as publicações existentes */
(() => {
  const CHAVE = "diogenes_banners";
  const formulario = document.getElementById("form-banner");

  if (!formulario || formulario.dataset.bannersAtivos === "true") return;
  formulario.dataset.bannersAtivos = "true";

  const campoImagem = document.getElementById("imagem-banner");
  const campoLink = document.getElementById("link-banner");
  const mensagem = document.getElementById("mensagem-banner");

  function lerBanners() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE)) || [];
    } catch {
      return [];
    }
  }

  formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const arquivo = campoImagem.files[0];

    if (!arquivo) {
      mensagem.textContent = "Selecione uma imagem.";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) {
      mensagem.textContent = "Use uma imagem JPG, PNG ou WEBP.";
      return;
    }

    if (arquivo.size > 800 * 1024) {
      mensagem.textContent = "A imagem deve ter no máximo 800 KB.";
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      try {
        const banners = lerBanners();

        banners.push({
          id: Date.now().toString(),
          imagem: leitor.result,
          link: campoLink.value.trim()
        });

        localStorage.setItem(CHAVE, JSON.stringify(banners));

        formulario.reset();
        mensagem.textContent = "Banner publicado com sucesso!";
        window.dispatchEvent(new Event("banners-atualizados"));
      } catch (erro) {
        console.error(erro);
        mensagem.textContent =
          "Não foi possível salvar. Tente uma imagem menor ou remova banners antigos.";
      }
    };

    leitor.onerror = () => {
      mensagem.textContent = "Não foi possível ler a imagem.";
    };

    leitor.readAsDataURL(arquivo);
  });
})();



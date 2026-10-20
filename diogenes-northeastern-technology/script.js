
"use strict";

const CHAVE_PUBLICACOES = "diogenes_publicacoes";

const CATEGORIAS = {
  musica: {
    todos: "posts-musica",
    inicio: "home-posts-musica"
  },
  jogos: {
    todos: "posts-jogos",
    inicio: "home-posts-jogos"
  },
  fotos: {
    todos: "posts-fotos",
    inicio: "home-posts-fotos"
  }
};

// Carrega as publicações salvas no navegador.
function carregarPublicacoes() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(CHAVE_PUBLICACOES) || "[]"
    );

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error("Erro ao carregar publicações:", erro);
    return [];
  }
}

// Padroniza os nomes das categorias.
function normalizarCategoria(categoria) {
  return String(categoria || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Lê a data de criação de uma publicação.
function obterData(post) {
  const data = new Date(post.criadoEm || 0).getTime();

  return Number.isFinite(data) ? data : 0;
}

// Ordena as publicações da mais nova para a mais antiga.
function ordenarPublicacoes(publicacoes) {
  return [...publicacoes].sort(
    (a, b) => obterData(b) - obterData(a)
  );
}

// Cria elementos de texto com segurança.
function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) {
    elemento.className = classe;
  }

  if (texto !== undefined) {
    elemento.textContent = texto;
  }

  return elemento;
}

// Cria o cartão de uma publicação com comentários.
function criarCartao(post) {
  const cartao = criarElemento("article", "card-publicacao");

  cartao.appendChild(
    criarElemento("h3", "", post.titulo || "Sem título")
  );

  if (post.descricao) {
    cartao.appendChild(
      criarElemento("p", "", post.descricao)
    );
  }

  // Exibe a imagem da publicação.
  if (post.imagem) {
    const imagem = document.createElement("img");

    imagem.src = post.imagem;
    imagem.alt = post.titulo || "Imagem da publicação";
    imagem.loading = "lazy";
    imagem.className = "imagem-publicacao";

    imagem.addEventListener("error", () => imagem.remove());

    cartao.appendChild(imagem);
  }

  // Exibe o link da publicação.
  if (post.link) {
    try {
      const url = new URL(post.link);

      if (["http:", "https:"].includes(url.protocol)) {
        const link = document.createElement("a");

        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "link-publicacao";
        link.textContent = "Acessar conteúdo ↗";

        cartao.appendChild(link);
      }
    } catch (erro) {
      console.warn("Link inválido:", post.link);
    }
  }

  // Identifica a publicação para separar seus comentários.
  const idPublicacao = String(
    post.id ??
    `${post.categoria}-${post.titulo || "publicacao"}-${post.criadoEm || ""}`
  );

  const chaveComentarios = `comentarios_${idPublicacao}`;

  // Área de comentários.
  const areaComentarios = criarElemento(
    "section",
    "area-comentarios"
  );

  areaComentarios.appendChild(
    criarElemento("h4", "", "Comentários")
  );

  const listaComentarios = criarElemento(
    "div",
    "lista-comentarios"
  );

  // Lê e mostra os comentários desta publicação.
  function carregarComentarios() {
    let comentarios = [];

    try {
      const dados = JSON.parse(
        localStorage.getItem(chaveComentarios) || "[]"
      );

      if (Array.isArray(dados)) {
        comentarios = dados;
      }
    } catch (erro) {
      console.error("Erro ao carregar comentários:", erro);
    }

    listaComentarios.replaceChildren();

    if (comentarios.length === 0) {
      listaComentarios.appendChild(
        criarElemento(
          "p",
          "comentario-vazio",
          "Ainda não há comentários. Seja o primeiro!"
        )
      );

      return;
    }

    comentarios.forEach(comentario => {
      const item = criarElemento(
        "article",
        "comentario-item"
      );

      item.appendChild(
        criarElemento(
          "strong",
          "comentario-nome",
          comentario.nome || "Visitante"
        )
      );

      item.appendChild(
        criarElemento(
          "p",
          "comentario-texto",
          comentario.texto || ""
        )
      );

      if (comentario.data) {
        const data = new Date(comentario.data);

        item.appendChild(
          criarElemento(
            "small",
            "comentario-data",
            Number.isNaN(data.getTime())
              ? ""
              : data.toLocaleString("pt-BR")
          )
        );
      }

      listaComentarios.appendChild(item);
    });
  }

  // Formulário para enviar um comentário.
  const formulario = criarElemento(
    "form",
    "formulario-comentario"
  );

  const campoNome = document.createElement("input");

  campoNome.type = "text";
  campoNome.placeholder = "Seu nome (opcional)";
  campoNome.maxLength = 60;
  campoNome.autocomplete = "name";
  campoNome.setAttribute("aria-label", "Seu nome");

  const campoTexto = document.createElement("textarea");

  campoTexto.placeholder = "Escreva seu comentário...";
  campoTexto.required = true;
  campoTexto.maxLength = 1000;
  campoTexto.rows = 3;
  campoTexto.setAttribute(
    "aria-label",
    "Escreva seu comentário"
  );

  const botaoEnviar = criarElemento(
    "button",
    "botao-comentario",
    "Enviar comentário"
  );

  botaoEnviar.type = "submit";

  formulario.append(
    campoNome,
    campoTexto,
    botaoEnviar
  );

  // Salva o comentário neste navegador.
  formulario.addEventListener("submit", evento => {
    evento.preventDefault();

    const texto = campoTexto.value.trim();

    if (!texto) {
      campoTexto.focus();
      return;
    }

    let comentarios = [];

    try {
      const dados = JSON.parse(
        localStorage.getItem(chaveComentarios) || "[]"
      );

      if (Array.isArray(dados)) {
        comentarios = dados;
      }
    } catch (erro) {
      console.error("Erro ao ler comentários:", erro);
    }

    comentarios.push({
      nome: campoNome.value.trim() || "Visitante",
      texto: texto,
      data: new Date().toISOString()
    });

    try {
      localStorage.setItem(
        chaveComentarios,
        JSON.stringify(comentarios)
      );

      campoNome.value = "";
      campoTexto.value = "";

      carregarComentarios();
    } catch (erro) {
      alert(
        "Não foi possível salvar o comentário neste navegador."
      );

      console.error("Erro ao salvar comentário:", erro);
    }
  });

  areaComentarios.append(
    formulario,
    listaComentarios
  );

  cartao.appendChild(areaComentarios);

  carregarComentarios();

  return cartao;
}

// Mostra as publicações em uma área.
function mostrarPublicacoes(destino, publicacoes) {
  if (!destino) return;

  destino.replaceChildren();

  if (publicacoes.length === 0) {
    destino.appendChild(
      criarElemento(
        "p",
        "vazio",
        "  Nenhum conteúdo publicado ainda."
      )
    );

    return;
  }

  publicacoes.forEach(post => {
    destino.appendChild(criarCartao(post));
  });
}

// Atualiza a Home e todas as telas de categorias.
function atualizarSite() {
  const todas = ordenarPublicacoes(
    carregarPublicacoes().filter(
      post => post && post.categoria
    )
  );

  Object.entries(CATEGORIAS).forEach(
    ([categoria, destinos]) => {
      const publicacoesCategoria = todas.filter(
        post =>
          normalizarCategoria(post.categoria) === categoria
      );

      // Home: somente a publicação mais recente.
      mostrarPublicacoes(
        document.getElementById(destinos.inicio),
        publicacoesCategoria.slice(0, 1)
      );

      // Categoria: todas as publicações.
      mostrarPublicacoes(
        document.getElementById(destinos.todos),
        publicacoesCategoria
      );
    }
  );
}

// Abre a tela selecionada no menu.
function abrirTela(tela, atualizarEndereco = true) {
  const telaSolicitada =
    ["musica", "jogos", "fotos"].includes(tela)
      ? tela
      : "inicio";

  document.querySelectorAll("[data-pagina]").forEach(secao => {
    secao.hidden =
      secao.dataset.pagina !== telaSolicitada;
  });

  if (atualizarEndereco) {
    const endereco =
      telaSolicitada === "inicio"
        ? "#inicio"
        : `#${telaSolicitada}`;

    history.replaceState(null, "", endereco);
  }

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}

// Liga os links do menu às telas.
function configurarMenu() {
  document.querySelectorAll("[data-tela]").forEach(link => {
    link.addEventListener("click", evento => {
      evento.preventDefault();

      const tela = link.dataset.tela;

      if (tela === "sobre") {
        abrirTela("inicio");

        document.getElementById("sobre")?.scrollIntoView({
          behavior: "smooth"
        });

        return;
      }

      abrirTela(tela);
    });
  });

  // Permite abrir diretamente uma categoria pelo endereço.
  const telaInicial = location.hash.replace("#", "");

  abrirTela(telaInicial, false);
}

// Inicialização.
function iniciarSite() {
  configurarMenu();
  atualizarSite();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    iniciarSite
  );
} else {
  iniciarSite();
}

// Permite que o painel administrativo atualize a página.
window.atualizarPublicacoes = atualizarSite;

// Atualiza as publicações quando mudam em outra aba.
window.addEventListener("storage", evento => {
  if (evento.key === CHAVE_PUBLICACOES) {
    atualizarSite();
  }
});

"use strict";

/* ==========================================
   CONFIGURAÇÕES
========================================== */

const CHAVE_PUBLICACOES = "diogenes_publicacoes";
const CHAVE_BANNERS = "diogenes_banners";

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
  },

  "mensagem-do-dia": {
    todos: "posts-mensagem-do-dia",
    inicio: "home-posts-mensagem-do-dia"
  }
};

/* ==========================================
   CARREGAR E ORGANIZAR PUBLICAÇÕES
========================================== */

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

function normalizarCategoria(categoria) {
  return String(categoria || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obterData(post) {
  const data = new Date(
    post.criadoEm || post.data || 0
  ).getTime();

  return Number.isFinite(data) ? data : 0;
}

function ordenarPublicacoes(publicacoes) {
  return [...publicacoes].sort(
    (a, b) => obterData(b) - obterData(a)
  );
}

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

/* ==========================================
   CARTÕES E COMENTÁRIOS
========================================== */

function criarCartao(post) {
  const cartao = criarElemento(
    "article",
    "card-publicacao"
  );

  cartao.appendChild(
    criarElemento(
      "h3",
      "",
      post.titulo || "Sem título"
    )
  );

  if (post.descricao) {
    cartao.appendChild(
      criarElemento("p", "", post.descricao)
    );
  }

  if (post.imagem) {
    const imagem = document.createElement("img");

    imagem.src = post.imagem;
    imagem.alt = post.titulo || "Imagem da publicação";
    imagem.loading = "lazy";
    imagem.className = "imagem-publicacao";

    imagem.addEventListener("error", () => {
      imagem.remove();
    });

    cartao.appendChild(imagem);
  }

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

  const idPublicacao = String(
    post.id ??
    `${post.categoria}-${post.titulo || "publicacao"}-${post.criadoEm || post.data || ""}`
  );

  const chaveComentarios = `comentarios_${idPublicacao}`;

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

  /* Carregar comentários salvos */

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

  /* Formulário de comentários */

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
      texto,
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

/* ==========================================
   EXIBIR PUBLICAÇÕES
========================================== */

function mostrarPublicacoes(destino, publicacoes) {
  if (!destino) return;

  destino.replaceChildren();

  if (publicacoes.length === 0) {
    destino.appendChild(
      criarElemento(
        "p",
        "vazio",
        "Nenhum conteúdo publicado ainda."
      )
    );

    return;
  }

  publicacoes.forEach(post => {
    destino.appendChild(criarCartao(post));
  });
}

/* ==========================================
   ATUALIZAR HOME E CATEGORIAS
========================================== */

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

      /*
       * HOME:
       * Mostra somente a publicação mais recente.
       * Usa criarCartao(), incluindo os comentários.
       */

      mostrarPublicacoes(
        document.getElementById(destinos.inicio),
        publicacoesCategoria.slice(0, 1)
      );

      /*
       * CATEGORIA:
       * Mostra todas as publicações, da mais nova
       * para a mais antiga, com seus comentários.
       */

      mostrarPublicacoes(
        document.getElementById(destinos.todos),
        publicacoesCategoria
      );
    }
  );

  carregarPublicacoesRecentes(todas);
}

/* ==========================================
   PUBLICAÇÕES RECENTES
========================================== */

function carregarPublicacoesRecentes(publicacoes) {
  const container = document.getElementById("posts-recentes");
  const mensagemVazia = document.getElementById("vazio-recentes");

  if (!container) return;

  container.replaceChildren();

  const categoriasValidas = [
    "musica",
    "jogos",
    "fotos",
    "mensagem-do-dia"
  ];

  const recentes = ordenarPublicacoes(publicacoes).filter(
    post =>
      categoriasValidas.includes(
        normalizarCategoria(post.categoria)
      )
  );

  if (recentes.length === 0) {
    if (mensagemVazia) {
      mensagemVazia.hidden = false;
    } else {
      container.appendChild(
        criarElemento(
          "p",
          "vazio",
          "Nenhuma publicação cadastrada ainda."
        )
      );
    }

    return;
  }

  if (mensagemVazia) {
    mensagemVazia.hidden = true;
  }

  recentes.forEach(post => {
    container.appendChild(criarCartao(post));
  });
}

/* ==========================================
   NAVEGAÇÃO
========================================== */

function abrirTela(tela, atualizarEndereco = true) {
  const telasPermitidas = [
    "inicio",
    "musica",
    "jogos",
    "fotos",
    "mensagem-do-dia",
    "recentes"
  ];

  const telaEscolhida = telasPermitidas.includes(tela)
    ? tela
    : "inicio";

  const estaNaHome = telaEscolhida === "inicio";

  const secoesHome = [
    document.getElementById("home-banner"),
    document.getElementById("novidades"),
    document.getElementById("sobre")
  ];

  secoesHome.forEach(secao => {
    if (secao) {
      secao.hidden = !estaNaHome;
    }
  });

  document.querySelectorAll("[data-pagina]").forEach(secao => {
    secao.hidden = secao.dataset.pagina !== telaEscolhida;
  });

  if (atualizarEndereco) {
    const endereco = estaNaHome
      ? "#inicio"
      : `#${telaEscolhida}`;

    if (location.hash !== endereco) {
      history.pushState(null, "", endereco);
    }
  }

  window.scrollTo({
    top: 0,
    behavior: "auto"
  });
}

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

  document.querySelectorAll("[data-voltar-inicio]").forEach(botao => {
    botao.addEventListener("click", () => {
      abrirTela("inicio");
    });
  });

  abrirTela(location.hash.replace("#", ""), false);

  window.addEventListener("popstate", () => {
    abrirTela(location.hash.replace("#", ""), false);
  });
}

/* ==========================================
   CARROSSEL DE BANNERS
========================================== */

function iniciarCarrosselBanners() {
  const area = document.getElementById("banner-carrossel");

  if (!area || area.dataset.inicializado === "sim") {
    return;
  }

  area.dataset.inicializado = "sim";

  const imagemSemLink = document.getElementById(
    "imagem-banner-sem-link"
  );

  const link = document.getElementById(
    "link-banner-principal"
  );

  const imagemComLink = document.getElementById(
    "imagem-banner-principal"
  );

  const anterior = document.getElementById("banner-anterior");
  const proximo = document.getElementById("banner-proximo");
  const indicadores = document.getElementById("indicadores-banner");

  if (
    !imagemSemLink ||
    !imagemComLink ||
    !link ||
    !anterior ||
    !proximo ||
    !indicadores
  ) {
    console.warn(
      "Confira os IDs do carrossel de banners no index.html."
    );

    return;
  }

  let banners = [];
  let indice = 0;
  let temporizador = null;

  function lerBanners() {
    try {
      const dados = JSON.parse(
        localStorage.getItem(CHAVE_BANNERS) || "[]"
      );

      return Array.isArray(dados)
        ? dados.filter(
            banner =>
              banner &&
              typeof banner.imagem === "string" &&
              banner.imagem.length > 0
          )
        : [];
    } catch (erro) {
      console.error("Erro ao ler banners:", erro);
      return [];
    }
  }

  function pararTemporizador() {
    if (temporizador !== null) {
      clearInterval(temporizador);
      temporizador = null;
    }
  }

  function desenharIndicadores() {
    indicadores.replaceChildren();

    banners.forEach((banner, posicao) => {
      const ponto = document.createElement("button");

      ponto.type = "button";
      ponto.className = "indicador-banner";

      ponto.setAttribute(
        "aria-label",
        `Mostrar banner ${posicao + 1}`
      );

      ponto.addEventListener("click", () => {
        indice = posicao;
        mostrarBanner();
        iniciarTemporizador();
      });

      indicadores.appendChild(ponto);
    });
  }

  function mostrarBanner() {
    if (banners.length === 0) {
      area.hidden = true;

      pararTemporizador();

      imagemSemLink.removeAttribute("src");
      imagemComLink.removeAttribute("src");

      indicadores.replaceChildren();

      return;
    }

    area.hidden = false;

    indice = (indice + banners.length) % banners.length;

    const banner = banners[indice];

    const temLink =
      typeof banner.link === "string" &&
      banner.link.trim() !== "";

    if (temLink) {
      imagemComLink.src = banner.imagem;
      imagemComLink.alt = banner.alt || `Banner ${indice + 1}`;
      imagemComLink.hidden = false;

      imagemSemLink.hidden = true;
      imagemSemLink.removeAttribute("src");

      link.href = banner.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.hidden = false;
    } else {
      imagemSemLink.src = banner.imagem;
      imagemSemLink.alt = banner.alt || `Banner ${indice + 1}`;
      imagemSemLink.hidden = false;

      imagemComLink.hidden = true;
      imagemComLink.removeAttribute("src");

      link.hidden = true;
      link.removeAttribute("href");
      link.removeAttribute("target");
      link.removeAttribute("rel");
    }

    const mostrarControles = banners.length > 1;

    anterior.hidden = !mostrarControles;
    proximo.hidden = !mostrarControles;
    indicadores.hidden = !mostrarControles;

    [...indicadores.children].forEach((ponto, posicao) => {
      ponto.classList.toggle("ativo", posicao === indice);

      if (posicao === indice) {
        ponto.setAttribute("aria-current", "true");
      } else {
        ponto.removeAttribute("aria-current");
      }
    });
  }

  function iniciarTemporizador() {
    pararTemporizador();

    if (banners.length > 1) {
      temporizador = setInterval(() => {
        indice = (indice + 1) % banners.length;
        mostrarBanner();
      }, 5000);
    }
  }

  function atualizarBanners() {
    banners = lerBanners();

    if (indice >= banners.length) {
      indice = 0;
    }

    desenharIndicadores();
    mostrarBanner();
    iniciarTemporizador();
  }

  anterior.addEventListener("click", () => {
    if (banners.length < 2) return;

    indice = (indice - 1 + banners.length) % banners.length;

    mostrarBanner();
    iniciarTemporizador();
  });

  proximo.addEventListener("click", () => {
    if (banners.length < 2) return;

    indice = (indice + 1) % banners.length;

    mostrarBanner();
    iniciarTemporizador();
  });

  window.addEventListener("storage", evento => {
    if (
      evento.key === CHAVE_BANNERS ||
      evento.key === null
    ) {
      atualizarBanners();
    }
  });

  window.addEventListener(
    "banners-atualizados",
    atualizarBanners
  );

  window.addEventListener("pageshow", atualizarBanners);

  atualizarBanners();
}

/* ==========================================
   INICIALIZAÇÃO
========================================== */

function iniciarSite() {
  configurarMenu();
  atualizarSite();
  iniciarCarrosselBanners();
}

/* Permite que o painel administrativo atualize as publicações. */
window.atualizarPublicacoes = atualizarSite;

/* Atualiza publicações alteradas em outra aba. */
window.addEventListener("storage", evento => {
  if (
    evento.key === CHAVE_PUBLICACOES ||
    evento.key === null
  ) {
    atualizarSite();
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarSite);
} else {
  iniciarSite();
}
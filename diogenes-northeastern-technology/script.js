
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

// Ordena da mais nova para a mais antiga.
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

// Cria o cartão de uma publicação.
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

  if (post.imagem) {
    const imagem = document.createElement("img");

    imagem.src = post.imagem;
    imagem.alt = post.titulo || "Imagem da publicação";
    imagem.loading = "lazy";
    imagem.className = "imagem-publicacao";

    imagem.addEventListener("error", () => imagem.remove());

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
        "Nenhuma publicação ainda. Volte em breve!"
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

  Object.entries(CATEGORIAS).forEach(([categoria, destinos]) => {
    const publicacoesCategoria = todas.filter(
      post => normalizarCategoria(post.categoria) === categoria
    );

    // Home: somente a publicação mais recente da categoria.
    mostrarPublicacoes(
      document.getElementById(destinos.inicio),
      publicacoesCategoria.slice(0, 1)
    );

    // Tela da categoria: todas as publicações, da mais nova
    // para a mais antiga.
    mostrarPublicacoes(
      document.getElementById(destinos.todos),
      publicacoesCategoria
    );
  });
}

// Abre a tela selecionada no menu.
function abrirTela(tela, atualizarEndereco = true) {
  const telaSolicitada =
    tela === "musica" || tela === "jogos" || tela === "fotos"
      ? tela
      : "inicio";

  document.querySelectorAll("[data-pagina]").forEach(secao => {
    secao.hidden = secao.dataset.pagina !== telaSolicitada;
  });

  if (atualizarEndereco) {
    const endereco =
      telaSolicitada === "inicio" ? "#inicio" : `#${telaSolicitada}`;

    history.replaceState(null, "", endereco);
  }

  window.scrollTo({ top: 0, behavior: "auto" });
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

  // Permite abrir diretamente uma categoria usando o endereço.
  const telaInicial = location.hash.replace("#", "");
  abrirTela(telaInicial, false);
}

// Inicialização.
function iniciarSite() {
  configurarMenu();
  atualizarSite();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarSite);
} else {
  iniciarSite();
}

// Permite que o painel administrativo atualize a página.
window.atualizarPublicacoes = atualizarSite;

// Atualiza quando as publicações mudam em outra aba do navegador.
window.addEventListener("storage", evento => {
  if (evento.key === CHAVE_PUBLICACOES) {
    atualizarSite();
  }
});

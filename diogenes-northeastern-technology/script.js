
"use strict";

const CHAVE_PUBLICACOES = "diogenes_publicacoes";

const CATEGORIAS = {
  musica: "posts-musica",
  jogos: "posts-jogos",
  fotos: "posts-fotos",
  sobre: "posts-sobre"
};

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

function criarElemento(tag, classe, texto) {
  const elemento = document.createElement(tag);

  if (classe) elemento.className = classe;
  if (texto !== undefined) elemento.textContent = texto;

  return elemento;
}

function exibirPublicacoes(categoria, idDestino) {
  const destino = document.getElementById(idDestino);
  if (!destino) return;

  destino.replaceChildren();

  const publicacoes = carregarPublicacoes().filter(
    post => post && post.categoria === categoria
  );

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
    const cartao = criarElemento("article", "card-publicacao");

    cartao.appendChild(
      criarElemento("h3", "", post.titulo || "Sem título")
    );

    cartao.appendChild(
      criarElemento("p", "", post.descricao || "")
    );

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

    destino.appendChild(cartao);
  });
}

function atualizarSite() {
  Object.entries(CATEGORIAS).forEach(([categoria, idDestino]) => {
    exibirPublicacoes(categoria, idDestino);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", atualizarSite);
} else {
  atualizarSite();
}

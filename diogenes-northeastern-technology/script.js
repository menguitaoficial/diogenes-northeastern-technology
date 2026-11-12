"use strict";

/* =========================================
   CONFIGURAÇÕES
========================================= */

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

const IDS_HOME = {
  musica: "home-posts-musica",
  jogos: "home-posts-jogos",
  fotos: "home-posts-fotos",
  filmes: "home-posts-filmes",
  series: "home-posts-series",
  "mensagem-do-dia": "home-posts-mensagem-do-dia"
};

const IDS_CATEGORIA = {
  musica: "posts-musica",
  jogos: "posts-jogos",
  fotos: "posts-fotos",
  filmes: "posts-filmes",
  series: "posts-series",
  "mensagem-do-dia": "posts-mensagem-do-dia"
};

/* =========================================
   FUNÇÕES DE APOIO
========================================= */

function lerArmazenamento(chave, valorPadrao = []) {
  try {
    const dados = JSON.parse(localStorage.getItem(chave));
    return Array.isArray(dados) ? dados : valorPadrao;
  } catch (erro) {
    console.error("Erro ao ler armazenamento:", chave, erro);
    return valorPadrao;
  }
}

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => {
    const entidades = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return entidades[caractere];
  });
}

function normalizarCategoria(categoria) {
  const texto = String(categoria ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  const equivalencias = {
    "mensagem": "mensagem-do-dia",
    "mensagens": "mensagem-do-dia",
    "mensagem-do-dia": "mensagem-do-dia",
    "filme": "filmes",
    "serie": "series"
  };

  return equivalencias[texto] || texto;
}

function obterTitulo(publicacao) {
  return publicacao.titulo ||
         publicacao.nome ||
         publicacao.nomePublicacao ||
         "Publicação sem título";
}

function obterDescricao(publicacao) {
  return publicacao.descricao ||
         publicacao.conteudo ||
         publicacao.texto ||
         "";
}

function obterImagem(publicacao) {
  return publicacao.imagem ||
         publicacao.foto ||
         publicacao.imagemUrl ||
         publicacao.urlImagem ||
         "";
}

function obterLink(publicacao) {
  return publicacao.link ||
         publicacao.url ||
         publicacao.linkExterno ||
         "";
}

function obterData(publicacao) {
  return publicacao.data ||
         publicacao.dataCriacao ||
         publicacao.criadoEm ||
         publicacao.dataPublicacao ||
         "";
}

function obterId(publicacao, indice) {
  return String(
    publicacao.id ??
    publicacao.identificador ??
    `publicacao-${indice}`
  );
}

function dataFormatada(data) {
  if (!data) return "";

  const dataObjeto = new Date(data);

  if (Number.isNaN(dataObjeto.getTime())) {
    return String(data);
  }

  return dataObjeto.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function ordenarPublicacoes(publicacoes) {
  return [...publicacoes].sort((a, b) => {
    const dataA = new Date(obterData(a)).getTime() || 0;
    const dataB = new Date(obterData(b)).getTime() || 0;

    return dataB - dataA;
  });
}

/* =========================================
   NAVEGAÇÃO
========================================= */

function abrirTela(nomeTela) {
  const telaInicial = document.querySelector(".pagina-inicial");
  const telas = document.querySelectorAll(".tela-categoria");

  if (nomeTela === "inicio" || nomeTela === "sobre") {
    if (telaInicial) {
      telaInicial.style.display = "block";
    }

    telas.forEach(tela => {
      tela.classList.remove("ativa");
    });

    if (nomeTela === "sobre") {
      document.getElementById("sobre")?.scrollIntoView({
        behavior: "smooth"
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }

    fecharMenuMobile();
    return;
  }

  if (!CATEGORIAS[nomeTela]) {
    return;
  }

  if (telaInicial) {
    telaInicial.style.display = "none";
  }

  telas.forEach(tela => {
    tela.classList.remove("ativa");
  });

  const telaEscolhida = document.getElementById(`tela-${nomeTela}`);

  if (telaEscolhida) {
    telaEscolhida.classList.add("ativa");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  fecharMenuMobile();
}

function configurarNavegacao() {
  document.querySelectorAll("[data-tela]").forEach(elemento => {
    elemento.addEventListener("click", evento => {
      evento.preventDefault();

      const tela = elemento.dataset.tela;
      abrirTela(tela);
    });
  });

  document.querySelectorAll('a[href="#inicio"]').forEach(link => {
    link.addEventListener("click", evento => {
      evento.preventDefault();
      abrirTela("inicio");
    });
  });

  const botaoMenu = document.getElementById("botao-menu");

  if (botaoMenu) {
    botaoMenu.addEventListener("click", () => {
      document
        .getElementById("menu-navegacao")
        ?.classList.toggle("aberto");
    });
  }
}

function fecharMenuMobile() {
  document
    .getElementById("menu-navegacao")
    ?.classList.remove("aberto");
}

/* =========================================
   PUBLICAÇÕES
========================================= */

function obterPublicacoes() {
  return ordenarPublicacoes(
    lerArmazenamento(CHAVE_PUBLICACOES)
  );
}

function criarCartaoPublicacao(publicacao, indice) {
  const titulo = escaparHTML(obterTitulo(publicacao));
  const descricao = escaparHTML(obterDescricao(publicacao));
  const imagem = escaparHTML(obterImagem(publicacao));
  const link = escaparHTML(obterLink(publicacao));
  const data = escaparHTML(dataFormatada(obterData(publicacao)));
  const categoria = escaparHTML(
    CATEGORIAS[normalizarCategoria(publicacao.categoria)] ||
    publicacao.categoria ||
    "Conteúdo"
  );

  const id = escaparHTML(obterId(publicacao, indice));

  let imagemHTML = "";

  if (imagem) {
    imagemHTML = `
      <img
        class="imagem-publicacao"
        src="${imagem}"
        alt="${titulo}"
        loading="lazy"
        onerror="this.style.display='none'"
      >
    `;
  }

  let linkHTML = "";

  if (link) {
    linkHTML = `
      <a
        class="link-publicacao"
        href="${link}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Acessar conteúdo →
      </a>
    `;
  }

  return `
    <article class="cartao-publicacao" data-id="${id}">
      ${imagemHTML}

      <div class="conteudo-publicacao">
        <span class="categoria-publicacao">${categoria}</span>

        <h3>${titulo}</h3>

        <p class="descricao-publicacao">${descricao}</p>

        ${data ? `<div class="data-publicacao">${data}</div>` : ""}

        ${linkHTML}
      </div>

      <section class="area-comentarios">
        <h4>Comentários</h4>

        <div
          class="lista-comentarios"
          id="lista-comentarios-${id}"
        ></div>

        <form
          class="formulario-comentario"
          data-id-publicacao="${id}"
        >
          <input
            type="text"
            name="nome"
            placeholder="Seu nome"
            maxlength="60"
            required
          >

          <textarea
            name="comentario"
            placeholder="Escreva seu comentário..."
            maxlength="1000"
            required
          ></textarea>

          <button type="submit">Enviar comentário</button>
        </form>
      </section>
    </article>
  `;
}

function renderizarPublicacoes() {
  const publicacoes = obterPublicacoes();

  Object.keys(CATEGORIAS).forEach(categoria => {
    const publicacoesCategoria = publicacoes.filter(publicacao => {
      return normalizarCategoria(publicacao.categoria) === categoria;
    });

    // Na página inicial, mostra somente a publicação mais recente.
    const containerHome = document.getElementById(IDS_HOME[categoria]);

    if (containerHome) {
      const maisRecente = publicacoesCategoria.slice(0, 1);

      containerHome.innerHTML = maisRecente.length
        ? maisRecente.map((publicacao, indice) =>
            criarCartaoPublicacao(publicacao, indice)
          ).join("")
        : "";
    }

    // Na tela da categoria, mostra todas as publicações.
    const containerCategoria = document.getElementById(
      IDS_CATEGORIA[categoria]
    );

    if (containerCategoria) {
      containerCategoria.innerHTML = publicacoesCategoria.length
        ? publicacoesCategoria.map((publicacao, indice) =>
            criarCartaoPublicacao(publicacao, indice)
          ).join("")
        : `
          <div class="mensagem-vazia">
            <h3>Nenhuma publicação por enquanto.</h3>
            <p>Novos conteúdos aparecerão aqui em breve.</p>
          </div>
        `;
    }
  });

  carregarComentarios();
  configurarFormulariosComentario();
}

/* =========================================
   COMENTÁRIOS
========================================= */

function chaveComentarios(id) {
  return `comentarios_${id}`;
}

function obterComentarios(id) {
  try {
    const dados = JSON.parse(
      localStorage.getItem(chaveComentarios(id))
    );

    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    return [];
  }
}

function salvarComentarios(id, comentarios) {
  localStorage.setItem(
    chaveComentarios(id),
    JSON.stringify(comentarios)
  );
}

function carregarComentarios() {
  document.querySelectorAll(".lista-comentarios").forEach(container => {
    const id = container.id.replace("lista-comentarios-", "");
    const comentarios = obterComentarios(id);

    if (!comentarios.length) {
      container.innerHTML = `
        <p class="mensagem-sem-comentario">
          Seja a primeira pessoa a comentar!
        </p>
      `;
      return;
    }

    container.innerHTML = comentarios.map(comentario => {
      return `
        <div class="comentario">
          <strong>${escaparHTML(comentario.nome)}</strong>
          <p>${escaparHTML(comentario.texto)}</p>
          <small>${escaparHTML(comentario.data)}</small>
        </div>
      `;
    }).join("");
  });
}

function configurarFormulariosComentario() {
  document.querySelectorAll(".formulario-comentario").forEach(formulario => {
    if (formulario.dataset.configurado === "true") {
      return;
    }

    formulario.dataset.configurado = "true";

    formulario.addEventListener("submit", evento => {
      evento.preventDefault();

      const id = formulario.dataset.idPublicacao;
      const nome = formulario.elements.nome.value.trim();
      const texto = formulario.elements.comentario.value.trim();

      if (!nome || !texto) {
        alert("Preencha seu nome e seu comentário.");
        return;
      }

      if (nome.length > 60 || texto.length > 1000) {
        alert("Confira o limite de caracteres.");
        return;
      }

      const comentarios = obterComentarios(id);

      comentarios.push({
        nome,
        texto,
        data: new Date().toLocaleString("pt-BR")
      });

      salvarComentarios(id, comentarios);

      formulario.reset();
      carregarComentarios();
    });
  });
}

/* =========================================
   BANNERS
========================================= */

let bannersAtuais = [];
let indiceBanner = 0;
let intervaloBanner = null;

function obterBanners() {
  const bannersSalvos = lerArmazenamento(CHAVE_BANNERS);

  return bannersSalvos
    .map(banner => {
      if (typeof banner === "string") {
        return banner;
      }

      if (banner && typeof banner === "object") {
        return (
          banner.imagem ||
          banner.url ||
          banner.src ||
          banner.base64 ||
          ""
        );
      }

      return "";
    })
    .filter(Boolean);
}

function configurarBanner() {
  bannersAtuais = obterBanners();

  const imagem = document.getElementById("imagem-banner-principal");
  const anterior = document.getElementById("banner-anterior");
  const proximo = document.getElementById("banner-proximo");
  const indicadores = document.getElementById("indicadores-banner");

  if (!imagem) return;

  if (!bannersAtuais.length) {
    // Sem banners cadastrados, usa a imagem padrão.
    imagem.src = "images/banner-principal.jpg";

    if (indicadores) {
      indicadores.innerHTML = "";
    }

    if (anterior) anterior.style.display = "none";
    if (proximo) proximo.style.display = "none";

    return;
  }

  if (anterior) anterior.style.display = "block";
  if (proximo) proximo.style.display = "block";

  function mostrarBanner(indice) {
    if (!bannersAtuais.length) return;

    indiceBanner =
      (indice + bannersAtuais.length) % bannersAtuais.length;

    imagem.style.opacity = "0";

    setTimeout(() => {
      imagem.src = bannersAtuais[indiceBanner];
      imagem.style.opacity = "1";
    }, 180);

    if (indicadores) {
      indicadores.innerHTML = bannersAtuais.map((_, posicao) => `
        <button
          class="indicador-banner ${posicao === indiceBanner ? "ativo" : ""}"
          data-indice="${posicao}"
          aria-label="Mostrar banner ${posicao + 1}"
        ></button>
      `).join("");

      indicadores.querySelectorAll("button").forEach(botao => {
        botao.addEventListener("click", () => {
          mostrarBanner(Number(botao.dataset.indice));
          reiniciarIntervaloBanner();
        });
      });
    }
  }

  function proximoBanner() {
    mostrarBanner(indiceBanner + 1);
  }

  function bannerAnterior() {
    mostrarBanner(indiceBanner - 1);
  }

  if (anterior) {
    anterior.onclick = () => {
      bannerAnterior();
      reiniciarIntervaloBanner();
    };
  }

  if (proximo) {
    proximo.onclick = () => {
      proximoBanner();
      reiniciarIntervaloBanner();
    };
  }

  mostrarBanner(0);
  iniciarIntervaloBanner(proximoBanner);
}

function iniciarIntervaloBanner(funcao) {
  clearInterval(intervaloBanner);

  if (bannersAtuais.length > 1) {
    intervaloBanner = setInterval(funcao, 5000);
  }
}

function reiniciarIntervaloBanner() {
  clearInterval(intervaloBanner);

  if (bannersAtuais.length > 1) {
    intervaloBanner = setInterval(() => {
      indiceBanner =
        (indiceBanner + 1) % bannersAtuais.length;

      const imagem = document.getElementById(
        "imagem-banner-principal"
      );

      if (imagem) {
        imagem.src = bannersAtuais[indiceBanner];
      }

      const indicadores = document.getElementById(
        "indicadores-banner"
      );

      if (indicadores) {
        indicadores.querySelectorAll("button").forEach((botao, indice) => {
          botao.classList.toggle(
            "ativo",
            indice === indiceBanner
          );
        });
      }
    }, 5000);
  }
}

/* =========================================
   ATUALIZAÇÃO AUTOMÁTICA
========================================= */

window.addEventListener("storage", evento => {
  if (
    evento.key === CHAVE_PUBLICACOES ||
    evento.key === CHAVE_BANNERS
  ) {
    renderizarPublicacoes();
    configurarBanner();
  }
});

/* =========================================
   INICIALIZAÇÃO
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const ano = document.getElementById("ano");

  if (ano) {
    ano.textContent = new Date().getFullYear();
  }

  configurarNavegacao();
  renderizarPublicacoes();
  configurarBanner();
});
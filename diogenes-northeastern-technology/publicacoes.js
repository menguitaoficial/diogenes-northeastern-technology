
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

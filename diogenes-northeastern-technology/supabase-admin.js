"use strict";

(() => {
  const client = window.supabaseClient;
  const $ = (id) => document.getElementById(id);
  let publicacoes = [];
  let usuarioAtual = null;

  const categorias = {
    musica: "Música", jogos: "Jogos", fotos: "Fotos", filmes: "Filme",
    series: "Série", "mensagem-do-dia": "Mensagem do dia"
  };

  function mensagem(texto, tipo = "sucesso") {
    const el = $("mensagem");
    if (!el) return;
    el.textContent = texto;
    el.className = `mensagem ${tipo}`;
    el.hidden = false;
  }

  function normalizar(row) {
    return {
      id: row.id,
      categoria: row.categoria,
      titulo: row.titulo || "",
      descricao: row.descricao || "",
      imagem: row.imagem || "",
      link: row.link || "",
      urlJogo: row.url_jogo || "",
      urlAudio: row.url_audio || "",
      urlVideo: row.url_video || "",
      data: row.created_at || row.data || ""
    };
  }

  async function carregar() {
    const { data, error } = await client.from("publicacoes").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    publicacoes = (data || []).map(normalizar);
    atualizarLista();
  }

  function elemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function playerNoCartao(cartao, post) {
    if (post.urlAudio) {
      const audio = document.createElement("audio");
      audio.controls = true; audio.preload = "metadata"; audio.src = post.urlAudio;
      audio.className = "midia-publicacao"; cartao.appendChild(audio);
    }
    if (post.urlVideo) {
      const video = document.createElement("video");
      video.controls = true; video.preload = "metadata"; video.playsInline = true;
      video.src = post.urlVideo; video.className = "midia-publicacao";
      cartao.appendChild(video);
    }
  }

  function criarCartao(post) {
    const cartao = elemento("article", "item-publicacao");
    const cab = elemento("div", "cabecalho-publicacao");
    cab.append(elemento("span", "categoria-publicacao", categorias[post.categoria] || post.categoria), elemento("span", "data-publicacao", post.data ? new Date(post.data).toLocaleDateString("pt-BR") : ""));
    cartao.append(cab, elemento("h3", "titulo-publicacao", post.titulo), elemento("p", "descricao-publicacao", post.descricao));
    if (post.imagem) { const img = elemento("img", "imagem-publicacao"); img.src = post.imagem; img.alt = post.titulo; img.loading = "lazy"; cartao.appendChild(img); }
    playerNoCartao(cartao, post);
    if (post.link) { const a = elemento("a", "link-publicacao", "Abrir link externo ↗"); a.href = post.link; a.target = "_blank"; a.rel = "noopener noreferrer"; cartao.appendChild(a); }
    if (post.urlJogo) { const a = elemento("a", "link-publicacao", "Abrir jogo ↗"); a.href = post.urlJogo; a.target = "_blank"; a.rel = "noopener noreferrer"; cartao.appendChild(a); }

    const comentarios = elemento("section", "comentarios-admin");
    comentarios.appendChild(elemento("h4", "", "Comentários desta publicação"));
    let listaComentarios = [];
    try { listaComentarios = JSON.parse(localStorage.getItem(`comentarios_${post.id}`) || "[]"); } catch (_) {}
    if (!listaComentarios.length) comentarios.appendChild(elemento("p", "comentario-admin-vazio", "Nenhum comentário nesta publicação."));
    else listaComentarios.forEach(c => comentarios.appendChild(elemento("p", "comentario-admin-texto", `${c.nome || "Visitante"}: ${c.texto || ""}`)));
    cartao.appendChild(comentarios);

    const acoes = elemento("div", "acoes-publicacao");
    const editar = elemento("button", "botao-editar", "Editar"); editar.type = "button"; editar.addEventListener("click", () => preencherEdicao(post));
    const excluir = elemento("button", "botao-excluir", "Excluir"); excluir.type = "button"; excluir.addEventListener("click", () => excluirPost(post));
    acoes.append(editar, excluir); cartao.appendChild(acoes);
    return cartao;
  }

  function atualizarLista() {
    const lista = $("lista-publicacoes"); if (!lista) return;
    const filtro = $("filtro-categoria")?.value || "todas";
    const filtradas = publicacoes.filter(p => filtro === "todas" || p.categoria === filtro);
    lista.replaceChildren();
    if ($("contador")) $("contador").textContent = String(filtradas.length);
    if (!filtradas.length) { lista.appendChild(elemento("p", "vazio-publicacoes", "Você ainda não cadastrou publicações. Use o formulário para criar a primeira!")); return; }
    filtradas.forEach(p => lista.appendChild(criarCartao(p)));
  }

  function preencherEdicao(post) {
    $("post-id").value = post.id;
    $("categoria").value = post.categoria;
    $("titulo").value = post.titulo;
    const partesMensagem = post.categoria === "mensagem-do-dia" ? post.descricao.match(/^Autor: (.*?)\n\n([\s\S]*)$/) : null;
    $("autor").value = partesMensagem ? partesMensagem[1] : "";
    $("descricao").value = partesMensagem ? partesMensagem[2] : post.descricao;
    $("imagem").value = post.imagem || "";
    $("link").value = post.link || "";
    if ($("url-jogo")) $("url-jogo").value = post.urlJogo || "";
    $("titulo-formulario").textContent = "Editar publicação";
    $("botao-salvar").textContent = "Salvar alterações →";
    $("cancelar-edicao").hidden = false;
    atualizarCamposMidia();
    $("form-publicacao").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function atualizarCamposMidia() {
    const cat = $("categoria")?.value || "";
    const mostrar = (id, ativo) => { const el = $(id); if (el) el.hidden = !ativo; };
    const regras = {
      musica: ["Nome da música", "Cantor, álbum ou detalhes da música...", "Link para ouvir a música (opcional)"],
      jogos: ["Nome do jogo", "Descrição do jogo e como jogar...", "Link externo (opcional)"],
      fotos: ["Título da foto", "Escreva uma legenda para a foto..."],
      filmes: ["Nome do filme", "Escreva a sinopse do filme..."],
      series: ["Nome da série ou episódio", "Escreva a sinopse ou detalhes do episódio..."],
      "mensagem-do-dia": ["Título da mensagem", "Escreva a mensagem do dia..."]
    };
    const regra = regras[cat];
    $("label-titulo").textContent = regra ? regra[0] : "Título da publicação";
    $("titulo").placeholder = regra ? regra[0] : "Escolha uma categoria...";
    $("label-descricao").textContent = cat === "mensagem-do-dia" ? "Mensagem" : cat === "fotos" ? "Legenda" : cat === "musica" ? "Informações da música" : "Descrição";
    $("descricao").placeholder = regra ? regra[1] : "As informações aparecerão aqui...";
    if ($("label-link")) $("label-link").textContent = regra?.[2] || "Link para acessar (opcional)";
    mostrar("grupo-autor", cat === "mensagem-do-dia");
    mostrar("grupo-arquivo-imagem", cat === "fotos");
    mostrar("grupo-imagem-url", ["filmes", "series"].includes(cat));
    mostrar("grupo-link", ["musica", "jogos", "filmes", "series"].includes(cat));
    mostrar("grupo-url-jogo", cat === "jogos");
    mostrar("grupo-arquivo-audio", cat === "musica");
    mostrar("grupo-arquivo-video", ["filmes", "series"].includes(cat));
    if ($("arquivo-audio")) $("arquivo-audio").required = cat === "musica" && !$("post-id").value;
    if ($("arquivo-video")) $("arquivo-video").required = ["filmes", "series"].includes(cat) && !$("post-id").value;
    atualizarPrevia();
  }

  function atualizarPrevia() {
    const area = $("previa-conteudo");
    if (!area) return;
    area.replaceChildren();
    const cat = $("categoria")?.value || "";
    const titulo = $("titulo")?.value.trim() || "Título da publicação";
    const descricao = $("descricao")?.value.trim() || "A descrição aparecerá aqui...";
    const nomes = { musica: "🎵 Música", jogos: "🎮 Jogos", fotos: "📸 Fotos", filmes: "🎬 Filme", series: "📺 Série", "mensagem-do-dia": "💬 Mensagem do dia" };
    if (!cat) {
      area.appendChild(elemento("div", "previa-placeholder", "Escolha uma categoria e preencha os campos para visualizar sua publicação."));
      return;
    }
    area.appendChild(elemento("span", "previa-categoria", nomes[cat] || cat));
    const imagemUrl = $("imagem")?.value.trim();
    const arquivo = $("arquivo-imagem")?.files?.[0];
    if (arquivo) {
      const img = document.createElement("img");
      img.className = "previa-imagem"; img.alt = "Prévia da foto";
      img.src = URL.createObjectURL(arquivo); area.appendChild(img);
    } else if (imagemUrl && ["fotos", "filmes", "series"].includes(cat)) {
      const img = document.createElement("img");
      img.className = "previa-imagem"; img.alt = "Prévia da capa"; img.src = imagemUrl;
      area.appendChild(img);
    }
    area.appendChild(elemento("h3", "previa-titulo", titulo));
    area.appendChild(elemento("p", "previa-descricao", descricao));
    if (cat === "mensagem-do-dia" && $("autor")?.value.trim()) area.appendChild(elemento("small", "previa-autor", "— " + $("autor").value.trim()));
  }

  function limparFormulario() {
    $("form-publicacao")?.reset();
    $("post-id").value = "";
    $("titulo-formulario").textContent = "Cadastrar publicação";
    $("botao-salvar").textContent = "Publicar conteúdo →";
    $("cancelar-edicao").hidden = true;
    atualizarCamposMidia();
  }

  async function enviarArquivo(arquivo, tipo) {
    if (!arquivo) return "";
    const mimePermitidos = tipo === "audio"
      ? ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/x-wav", "audio/mp4"]
      : tipo === "video"
        ? ["video/mp4", "video/webm", "video/quicktime"]
        : ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!mimePermitidos.includes(arquivo.type)) {
      const mensagens = { audio: "Envie áudio MP3, OGG ou WAV.", video: "Envie vídeo MP4, WEBM ou MOV.", imagem: "Envie uma foto JPG, PNG, WEBP ou GIF." };
      throw new Error(mensagens[tipo] || "Formato de arquivo não permitido.");
    }
    const limite = tipo === "imagem" ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (arquivo.size > limite) throw new Error(tipo === "imagem" ? "A foto ultrapassa 10 MB." : "O arquivo ultrapassa 50 MB. No plano gratuito, use um arquivo menor ou um link externo.");
    const extensaoPadrao = tipo === "audio" ? "mp3" : tipo === "video" ? "mp4" : "jpg";
    const extensao = (arquivo.name.split(".").pop() || extensaoPadrao).toLowerCase().replace(/[^a-z0-9]/g, "");
    const caminho = `${tipo}/${crypto.randomUUID()}.${extensao}`;
    const { error } = await client.storage.from("midias-site").upload(caminho, arquivo, { upsert: false, contentType: arquivo.type });
    if (error) throw error;
    const { data } = client.storage.from("midias-site").getPublicUrl(caminho);
    return data.publicUrl;
  }

  async function salvarPost(evento) {
    evento.preventDefault();
    evento.stopImmediatePropagation();
    const botao = $("botao-salvar"); botao.disabled = true;
    try {
      const id = $("post-id").value;
      const categoria = $("categoria").value;
      const titulo = $("titulo").value.trim();
      const textoDescricao = $("descricao").value.trim();
      const autorMensagem = $("autor")?.value.trim() || "";
      const descricao = categoria === "mensagem-do-dia" && autorMensagem ? `Autor: ${autorMensagem}\n\n${textoDescricao}` : textoDescricao;
      if (!categoria || !categorias[categoria] || !titulo || !descricao) throw new Error("Preencha categoria, título e descrição.");
      const atual = publicacoes.find(p => String(p.id) === String(id));
      for (const [rotulo, valor] of [
        ["imagem", $("imagem")?.value.trim()],
        ["link", $("link")?.value.trim()],
        ["endereço do jogo", $("url-jogo")?.value.trim()]
      ]) {
        if (valor) {
          let endereco;
          try { endereco = new URL(valor); } catch (_) {
            throw new Error(`Informe um ${rotulo} válido (começando com https://).`);
          }
          if (!["http:", "https:"].includes(endereco.protocol)) {
            throw new Error(`O ${rotulo} precisa usar HTTP ou HTTPS.`);
          }
        }
      }
      const imageFile = $("arquivo-imagem")?.files?.[0];
      const audioFile = $("arquivo-audio")?.files?.[0];
      const videoFile = $("arquivo-video")?.files?.[0];
      if (categoria === "fotos" && !imageFile && !$("imagem")?.value.trim() && !atual?.imagem) throw new Error("Escolha uma foto para esta publicação.");
      if (categoria === "musica" && !audioFile && !atual?.urlAudio) throw new Error("Escolha o arquivo de áudio da música.");
      if (["filmes", "series"].includes(categoria) && !videoFile && !atual?.urlVideo) throw new Error("Escolha o arquivo de vídeo.");
      const imagemPublicacao = categoria === "fotos"
        ? (imageFile ? await enviarArquivo(imageFile, "imagem") : ($("imagem")?.value.trim() || atual?.imagem || null))
        : ($("imagem")?.value.trim() || null);
      const urlAudio = categoria === "musica"
        ? (audioFile ? await enviarArquivo(audioFile, "audio") : (atual?.urlAudio || null))
        : null;
      const urlVideo = ["filmes", "series"].includes(categoria)
        ? (videoFile ? await enviarArquivo(videoFile, "video") : (atual?.urlVideo || null))
        : null;
      const registro = {
        categoria, titulo, descricao,
        imagem: imagemPublicacao,
        link: $("link")?.value.trim() || null,
        url_jogo: $("url-jogo")?.value.trim() || null,
        url_audio: urlAudio,
        url_video: urlVideo
      };
      let resposta;
      if (id) resposta = await client.from("publicacoes").update(registro).eq("id", id).select().single();
      else resposta = await client.from("publicacoes").insert(registro).select().single();
      if (resposta.error) throw resposta.error;
      limparFormulario();
      await carregar();
      mensagem(id ? "Publicação atualizada com sucesso!" : "Publicação cadastrada com sucesso!");
    } catch (erro) {
      console.error(erro);
      mensagem(erro.message || "Não foi possível salvar a publicação.", "erro");
    } finally { botao.disabled = false; }
  }

  async function excluirPost(post) {
    if (!confirm(`Deseja excluir a publicação “${post.titulo}”?`)) return;
    const { error } = await client.from("publicacoes").delete().eq("id", post.id);
    if (error) { mensagem(error.message, "erro"); return; }
    await carregar();
    mensagem("Publicação excluída com sucesso!");
  }


  async function importarPublicacoesAntigas() {
    let antigas = [];
    try { antigas = JSON.parse(localStorage.getItem("diogenes_publicacoes") || "[]"); } catch (_) {}
    if (!Array.isArray(antigas) || !antigas.length) {
      mensagem("Não encontrei publicações antigas neste navegador.", "erro");
      return;
    }
    if (!confirm(`Encontrei ${antigas.length} publicação(ões) antigas neste navegador. Importar para o Supabase?`)) return;
    try {
      const existentes = new Set(publicacoes.map(p => `${p.categoria}|${p.titulo}`));
      const registros = antigas.filter(p => p && p.categoria && p.titulo && !existentes.has(`${p.categoria}|${p.titulo}`)).map(p => ({
        categoria: p.categoria,
        titulo: p.titulo,
        descricao: p.descricao || "",
        imagem: p.imagem || null,
        link: p.link || null,
        url_jogo: p.urlJogo || p.url_jogo || null,
        url_audio: p.urlAudio || p.url_audio || null,
        url_video: p.urlVideo || p.url_video || null
      }));
      if (!registros.length) { mensagem("As publicações antigas já estão no banco ou não possuem dados válidos."); return; }
      const { error } = await client.from("publicacoes").insert(registros);
      if (error) throw error;
      await carregar();
      mensagem(`${registros.length} publicação(ões) importada(s) com sucesso!`);
    } catch (erro) {
      mensagem("Falha ao importar: " + (erro.message || "erro desconhecido"), "erro");
    }
  }

  async function inicializar() {
    if (!client) { mensagem("Conexão com Supabase não configurada.", "erro"); return; }
    const { data: { session } } = await client.auth.getSession();
    if (!session) { window.location.replace("admin.html"); return; }
    usuarioAtual = session.user;
    const formulario = $("form-publicacao");
    if (formulario) formulario.addEventListener("submit", salvarPost, true);
    $("categoria")?.addEventListener("change", atualizarCamposMidia);
    ["titulo", "descricao", "autor", "imagem"].forEach(id => $(id)?.addEventListener("input", atualizarPrevia));
    $("arquivo-imagem")?.addEventListener("change", atualizarPrevia);
    $("filtro-categoria")?.addEventListener("change", atualizarLista);
    $("cancelar-edicao")?.addEventListener("click", limparFormulario);
    const importar = document.createElement("button");
    importar.type = "button"; importar.className = "botao-secundario";
    importar.textContent = "Importar publicações antigas deste navegador";
    importar.addEventListener("click", importarPublicacoesAntigas);
    document.querySelector(".introducao")?.appendChild(importar);
    const sair = document.createElement("button");
    sair.type = "button"; sair.className = "botao-secundario"; sair.textContent = "Sair da conta";
    sair.addEventListener("click", async () => { await client.auth.signOut(); window.location.href = "admin.html"; });
    document.querySelector(".topo-admin")?.appendChild(sair);
    atualizarCamposMidia();
    try { await carregar(); } catch (erro) { console.error(erro); mensagem("Não foi possível carregar publicações do banco: " + erro.message, "erro"); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicializar);
  else inicializar();
})();

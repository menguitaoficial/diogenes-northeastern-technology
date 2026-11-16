"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const email = document.getElementById("email");
  const senha = document.getElementById("senha");
  const botaoOlho = document.getElementById("mostrar-senha");
  const loginForm = document.getElementById("login-form");
  const loginMensagem = document.getElementById("login-mensagem");
  const anoAtual = document.getElementById("ano-atual");
  if (anoAtual) anoAtual.textContent = new Date().getFullYear();

  if (botaoOlho && senha) {
    botaoOlho.addEventListener("click", () => {
      const mostrar = senha.type === "password";
      senha.type = mostrar ? "text" : "password";
      botaoOlho.setAttribute("aria-pressed", String(mostrar));
      botaoOlho.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
      botaoOlho.title = mostrar ? "Ocultar senha" : "Mostrar senha";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      loginMensagem.textContent = "Verificando acesso...";
      loginMensagem.classList.remove("erro");
      if (!window.supabaseClient) {
        loginMensagem.textContent = "Não foi possível conectar ao Supabase. Atualize a página.";
        loginMensagem.classList.add("erro");
        return;
      }
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email.value.trim(),
        password: senha.value
      });
      if (error || !data.session) {
        loginMensagem.textContent = "E-mail ou senha incorretos. Confira os dados e tente novamente.";
        loginMensagem.classList.add("erro");
        senha.focus();
        return;
      }
      window.location.href = "./publicacoes.html";
    });
  }
});
